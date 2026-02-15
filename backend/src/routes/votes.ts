import { Router, Request, Response } from "express";
import crypto from "crypto";
import { verifyUser } from "../middleware/auth";
import { hashIP } from "../utils/hash";
import { getIO } from "../socket";
import { prisma } from "../lib/prisma";

const router = Router();

function getClientIP(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getDeviceFingerprint(req: Request): string {
  const ipHash = hashIP(getClientIP(req));
  const userAgent = (req.get("user-agent") || "unknown").toLowerCase();

  return crypto
    .createHash("sha256")
    .update(`${ipHash}:${userAgent}`)
    .digest("hex");
}

// ─── Check Vote Status ────────────────────────────────────────────
router.get(
  "/:pollId/status",
  verifyUser,
  async (req: Request, res: Response) => {
    try {
      const pollId = req.params.pollId as string;
      const userId = req.user?.id;
      const deviceFingerprint = getDeviceFingerprint(req);

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { id: true, isPublic: true, creatorId: true },
      });

      if (!poll) {
        res.status(404).json({ error: "Poll not found" });
        return;
      }

      if (!poll.isPublic && poll.creatorId !== userId) {
        res.status(404).json({ error: "Poll not found" });
        return;
      }

      const clientIP = getClientIP(req);
      const ipHash = hashIP(clientIP);

      // Check device rate limit (Layer 1)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deviceVoteCount = await prisma.vote.count({
        where: {
          pollId,
          deviceFingerprint,
          createdAt: { gt: oneHourAgo },
        },
      });

      if (deviceVoteCount >= 2) {
        res.json({
          hasVoted: false,
          canVote: false,
          reason: "rate_limit",
          message:
            "This device has reached the vote limit (2 per hour). Please try again later.",
        });
        return;
      }

      // Check authenticated user (Layer 2)
      if (userId) {
        const existingVote = await prisma.vote.findFirst({
          where: { pollId, userId },
        });

        if (existingVote) {
          res.json({
            hasVoted: true,
            canVote: false,
            reason: "already_voted",
            votedOptionId: existingVote.optionId,
            message: "You have already voted in this poll.",
          });
          return;
        }

        res.json({ hasVoted: false, canVote: true });
        return;
      }

      // Check anonymous user (Layer 3)
      const existingAnonymous = await prisma.vote.findFirst({
        where: {
          pollId,
          userId: null,
          OR: [{ ipHash }, { deviceFingerprint }],
        },
      });

      if (existingAnonymous) {
        res.json({
          hasVoted: false,
          canVote: false,
          reason: "anonymous_used",
          message:
            "Anonymous vote already cast from this device. Login to vote again.",
        });
        return;
      }

      res.json({ hasVoted: false, canVote: true });
    } catch (error) {
      console.error("Vote status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Cast Vote ─────────────────────────────────────────────────────
router.post(
  "/:pollId",
  verifyUser,
  async (req: Request, res: Response) => {
    try {
      const pollId = req.params.pollId as string;
      const { optionId } = req.body;
      const userId = req.user?.id;
      const deviceFingerprint = getDeviceFingerprint(req);

      if (!optionId) {
        res.status(400).json({ error: "optionId is required" });
        return;
      }

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { id: true, isPublic: true, creatorId: true },
      });

      if (!poll) {
        res.status(404).json({ error: "Poll not found" });
        return;
      }

      if (!poll.isPublic && poll.creatorId !== userId) {
        res.status(404).json({ error: "Poll not found" });
        return;
      }

      const clientIP = getClientIP(req);
      const ipHash = hashIP(clientIP);

      // Verify poll and option exist
      const option = await prisma.option.findFirst({
        where: { id: optionId, pollId },
      });

      if (!option) {
        res.status(404).json({ error: "Poll or option not found" });
        return;
      }

      // ── Layer 1: Device Rate Limit (Universal) ──────────────────
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deviceVoteCount = await prisma.vote.count({
        where: {
          pollId,
          deviceFingerprint,
          createdAt: { gt: oneHourAgo },
        },
      });

      if (deviceVoteCount >= 2) {
        res.status(429).json({
          error: "Rate limit: Maximum 2 votes per device per hour.",
          reason: "rate_limit",
        });
        return;
      }

      // ── Layer 2: Authenticated User Check ───────────────────────
      if (userId) {
        const existingVote = await prisma.vote.findFirst({
          where: { pollId, userId },
        });

        if (existingVote) {
          res.status(403).json({
            error: "You have already voted.",
            reason: "already_voted",
          });
          return;
        }

        // Proceed to vote
        const result = await prisma.$transaction(async (tx) => {
          const vote = await tx.vote.create({
            data: {
              pollId,
              optionId,
              userId,
              ipHash,
              deviceFingerprint,
            },
          });

          await tx.option.update({
            where: { id: optionId },
            data: { voteCount: { increment: 1 } },
          });

          return vote;
        });

        // Emit real-time update
        await emitPollUpdate(pollId);

        res.status(201).json({ vote: result, message: "Vote recorded!" });
        return;
      }

      // ── Layer 3: Anonymous User Check ───────────────────────────
      const existingAnonymous = await prisma.vote.findFirst({
        where: {
          pollId,
          userId: null,
          OR: [{ ipHash }, { deviceFingerprint }],
        },
      });

      if (existingAnonymous) {
        res.status(403).json({
          error:
            "Anonymous vote already recorded. Please login to vote again.",
          reason: "anonymous_used",
        });
        return;
      }

      // Proceed with anonymous vote
      const result = await prisma.$transaction(async (tx) => {
        const vote = await tx.vote.create({
          data: {
            pollId,
            optionId,
            userId: null,
            ipHash,
            deviceFingerprint,
          },
        });

        await tx.option.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } },
        });

        return vote;
      });

      // Emit real-time update
      await emitPollUpdate(pollId);

      res.status(201).json({ vote: result, message: "Vote recorded!" });
    } catch (error: any) {
      // Handle unique constraint violation (race condition safety net)
      if (error.code === "P2002") {
          const reason = req.user ? "already_voted" : "anonymous_used";
          const message = req.user
            ? "You have already voted."
            : "Anonymous vote already recorded. Please login to vote again.";
        res.status(403).json({
            error: message,
            reason,
        });
        return;
      }
      console.error("Vote error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Emit Poll Update via Socket.io ────────────────────────────────
async function emitPollUpdate(pollId: string) {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: { orderBy: { voteCount: "desc" } },
        _count: { select: { votes: true } },
      },
    });

    if (poll) {
      const io = getIO();
      io.to(pollId).emit("update_results", {
        pollId,
        options: poll.options,
        totalVotes: poll._count.votes,
      });
    }
  } catch (error) {
    console.error("Socket emit error:", error);
  }
}

export default router;
