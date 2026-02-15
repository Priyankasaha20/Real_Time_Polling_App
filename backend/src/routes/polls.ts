import { Router, Request, Response } from "express";
import { verifyUser, requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// ─── Create Poll (Auth Required) ──────────────────────────────────
router.post("/", verifyUser, requireAuth, async (req: Request, res: Response) => {
  try {
    const { question, options, isPublic } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      res.status(400).json({
        error: "Question and at least 2 options are required",
      });
      return;
    }

    if (options.length > 10) {
      res.status(400).json({ error: "Maximum 10 options allowed" });
      return;
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        isPublic: isPublic !== false,
        creatorId: (req.user as any).id,
        options: {
          create: options.map((text: string) => ({ text: text.trim() })),
        },
      },
      include: {
        options: true,
        creator: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
    });

    res.status(201).json({ poll });
  } catch (error) {
    console.error("Create poll error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Get Poll by ID ────────────────────────────────────────────────
router.get("/:id", verifyUser, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { voteCount: "desc" },
        },
        creator: {
          select: { id: true, name: true, profilePicture: true },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!poll) {
      res.status(404).json({ error: "Poll not found" });
      return;
    }

    if (!poll.isPublic && poll.creatorId !== userId) {
      res.status(404).json({ error: "Poll not found" });
      return;
    }

    let participants: Array<{
      id: string;
      name: string;
      optionId: string;
      optionText: string;
      createdAt: Date;
    }> = [];

    if (poll.creatorId === userId) {
      const votes = await prisma.vote.findMany({
        where: { pollId: id },
        include: {
          option: {
            select: {
              id: true,
              text: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      participants = votes.map((vote) => ({
        id: vote.id,
        name: vote.participantName || vote.user?.name || "Anonymous",
        optionId: vote.option.id,
        optionText: vote.option.text,
        createdAt: vote.createdAt,
      }));
    }

    res.json({
      poll: {
        ...poll,
        participants,
      },
    });
  } catch (error) {
    console.error("Get poll error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── List Public Polls ─────────────────────────────────────────────
router.get("/", verifyUser, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where: { isPublic: true },
        include: {
          options: { orderBy: { voteCount: "desc" } },
          creator: {
            select: { id: true, name: true, profilePicture: true },
          },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.poll.count({ where: { isPublic: true } }),
    ]);

    res.json({
      polls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List polls error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Get My Polls ──────────────────────────────────────────────────
router.get(
  "/user/mine",
  verifyUser,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const polls = await prisma.poll.findMany({
        where: { creatorId: (req.user as any).id },
        include: {
          options: { orderBy: { voteCount: "desc" } },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ polls });
    } catch (error) {
      console.error("My polls error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Delete Poll (Auth Required, Creator Only) ───────────────────
router.delete(
  "/:id",
  verifyUser,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const pollId = req.params.id as string;
      const userId = (req.user as any).id;

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { id: true, creatorId: true },
      });

      if (!poll) {
        res.status(404).json({ error: "Poll not found" });
        return;
      }

      if (poll.creatorId !== userId) {
        res.status(403).json({ error: "Only the poll creator can delete this poll." });
        return;
      }

      await prisma.poll.delete({
        where: { id: pollId },
      });

      res.json({ message: "Poll deleted successfully." });
    } catch (error) {
      console.error("Delete poll error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
