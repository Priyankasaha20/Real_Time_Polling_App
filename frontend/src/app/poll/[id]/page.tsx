"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { pollsAPI, votesAPI } from "@/lib/api";
import { getFingerprint } from "@/lib/fingerprint";
import { getSocket } from "@/lib/socket";
import { Poll, VoteStatus, Option, PollUpdate } from "@/types";
import ResultsChart from "@/components/ResultsChart";
import ShareCard from "@/components/ShareCard";

export default function PollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState("");
  const [voterName, setVoterName] = useState("");
  const [participantsPage, setParticipantsPage] = useState(1);
  const [showFairnessInfo, setShowFairnessInfo] = useState(false);
  const [voteSuccessPending, setVoteSuccessPending] = useState(false);
  const [anonymousNameTouched, setAnonymousNameTouched] = useState(false);
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState<
    number | null
  >(null);

  const loadPoll = useCallback(async () => {
    try {
      const [pollData, fp] = await Promise.all([
        pollsAPI.getById(id),
        getFingerprint(),
      ]);
      setPoll(pollData.poll);
      setFingerprint(fp);

      const statusData = await votesAPI.checkStatus(id, fp);
      setVoteStatus(statusData);
    } catch {
      setError("Poll not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  useEffect(() => {
    setParticipantsPage(1);
  }, [poll?.id, poll?.participants?.length]);

  useEffect(() => {
    if (voteStatus?.reason !== "rate_limit") {
      setRateLimitSecondsLeft(null);
      return;
    }

    const initialSeconds = voteStatus.retryAfterSeconds ?? null;
    if (!initialSeconds || initialSeconds <= 0) {
      setRateLimitSecondsLeft(null);
      return;
    }

    setRateLimitSecondsLeft(initialSeconds);
    const interval = setInterval(() => {
      setRateLimitSecondsLeft((prev) => {
        if (prev === null) return null;
        return prev > 1 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [voteStatus?.reason, voteStatus?.retryAfterSeconds]);

  // Socket.io real-time updates
  useEffect(() => {
    const socket = getSocket();
    socket.emit("join_poll", id);

    socket.on("update_results", (data: PollUpdate) => {
      if (data.pollId === id) {
        setPoll((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            options: data.options,
            _count: { votes: data.totalVotes },
          };
        });
      }
    });

    return () => {
      socket.emit("leave_poll", id);
      socket.off("update_results");
    };
  }, [id]);

  const handleVote = async () => {
    if (!selectedOption) return;

    setAnonymousNameTouched(true);
    const trimmedVoterName = voterName.trim();
    if (!user && !trimmedVoterName) {
      setError("Please enter your name to vote anonymously.");
      return;
    }

    setSubmitting(true);
    setVoteSuccessPending(false);
    setError("");

    try {
      await votesAPI.cast(id, {
        optionId: selectedOption,
        fingerprint,
        voterName: user ? undefined : trimmedVoterName,
      });

      setVoteSuccessPending(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setVoteStatus({
        hasVoted: true,
        canVote: false,
        reason: "already_voted",
        votedOptionId: selectedOption,
      });
    } catch (err: any) {
      setVoteSuccessPending(false);
      if (err.status === 429) {
        setVoteStatus({
          hasVoted: false,
          canVote: false,
          reason: "rate_limit",
          message: err.error,
          retryAfterSeconds: err.retryAfterSeconds,
        });
      } else if (err.status === 403) {
        setVoteStatus({
          hasVoted: false,
          canVote: false,
          reason: err.reason || "already_voted",
          message: err.error,
        });
      } else {
        setError(err.error || "Failed to cast vote");
      }
    } finally {
      setVoteSuccessPending(false);
      setSubmitting(false);
    }
  };

  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins <= 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="brutal-card text-center">
          <div className="text-4xl mb-4 animate-pulse">🗳️</div>
          <p className="font-mono font-bold">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="page-container flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="brutal-card-lg text-center max-w-md">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="font-display font-bold text-2xl mb-2">
            Poll Not Found
          </h2>
          <p className="font-mono text-sm text-gray-600 mb-6">
            This poll doesn&apos;t exist or has been deleted.
          </p>
          <button
            onClick={() => router.push("/")}
            className="brutal-btn-primary"
          >
            Back to Home →
          </button>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes =
    poll._count?.votes ?? poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  const showResults =
    voteStatus?.hasVoted || (voteStatus && !voteStatus.canVote);
  const showVoting = voteStatus && !voteStatus.hasVoted && voteStatus.canVote;
  const anonymousNameMissing = !user && !voterName.trim();
  const voterNameChars = voterName.length;
  const showAnonymousNameError =
    !user && anonymousNameTouched && anonymousNameMissing;
  const isCreator = user?.id === poll.creatorId;
  const participantsPerPage = 10;
  const participants = poll.participants ?? [];
  const totalParticipantPages = Math.max(
    1,
    Math.ceil(participants.length / participantsPerPage),
  );
  const clampedParticipantsPage = Math.min(
    participantsPage,
    totalParticipantPages,
  );
  const participantsStartIndex =
    (clampedParticipantsPage - 1) * participantsPerPage;
  const visibleParticipants = participants.slice(
    participantsStartIndex,
    participantsStartIndex + participantsPerPage,
  );

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        {/* Poll Header */}
        <div className="brutal-card-lg mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight">
                {poll.question}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                {poll.creator && (
                  <span className="brutal-badge bg-brutBlue">
                    by {poll.creator.name}
                  </span>
                )}
                <span className="font-mono text-xs text-gray-500">
                  {new Date(poll.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="brutal-badge bg-brutYellow shrink-0">
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Real-time indicator */}
          <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
            <span className="w-2 h-2 bg-brutGreen rounded-full animate-pulse" />
            Live results
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-brutRed/10 border-[3px] border-brutRed p-4 font-mono text-sm text-brutRed font-bold mb-6">
            ✗ {error}
          </div>
        )}

        {/* Vote Eligibility Preview */}
        {voteStatus && (
          <div className="brutal-card mb-6">
            {voteStatus.canVote && !voteStatus.hasVoted && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">
                    You Can Vote Now
                  </h3>
                  <p className="font-mono text-sm text-gray-600">
                    You are eligible to cast one vote in this poll.
                  </p>
                </div>
              </div>
            )}

            {!voteStatus.canVote && voteStatus.reason === "rate_limit" && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏱️</span>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">
                    Device Rate Limit Reached
                  </h3>
                  <p className="font-mono text-sm text-gray-600 mb-3">
                    {rateLimitSecondsLeft && rateLimitSecondsLeft > 0
                      ? `Try again in ${formatRemainingTime(rateLimitSecondsLeft)}.`
                      : "Please try again soon."}
                  </p>
                  <p className="font-mono text-xs text-gray-500">
                    Limit: 2 votes per device per hour (fairness protection).
                  </p>
                </div>
              </div>
            )}

            {!voteStatus.canVote && voteStatus.reason === "anonymous_used" && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">
                    Anonymous Vote Already Cast
                  </h3>
                  <p className="font-mono text-sm text-gray-600 mb-3">
                    An anonymous vote was already recorded from this device.
                  </p>
                  {!user && (
                    <button
                      onClick={() => router.push("/login")}
                      className="brutal-btn-primary !text-xs"
                    >
                      Login to Vote →
                    </button>
                  )}
                </div>
              </div>
            )}

            {!voteStatus.canVote && voteStatus.reason === "already_voted" && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">
                    Already Voted
                  </h3>
                  <p className="font-mono text-sm text-gray-600">
                    You have already voted in this poll.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voting Form */}
        {showVoting && (
          <div className="brutal-card-lg mb-6">
            <h3 className="font-display font-bold text-lg mb-4">
              Cast Your Vote
            </h3>

            {voteSuccessPending && (
              <div className="mb-4 bg-brutBlue/10 border-[3px] border-brutBlue p-3 font-mono text-sm text-brutDark font-bold">
                Recording your vote… syncing live results.
              </div>
            )}

            <div className="space-y-3 mb-6">
              {poll.options.map((option: Option, i: number) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (submitting || voteSuccessPending) return;
                    setSelectedOption(option.id);
                  }}
                  disabled={submitting || voteSuccessPending}
                  className={
                    selectedOption === option.id
                      ? "brutal-radio-selected w-full text-left disabled:opacity-70"
                      : "brutal-radio w-full text-left disabled:opacity-70"
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 border-[2px] border-brutDark flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        selectedOption === option.id
                          ? "bg-brutDark text-white"
                          : "bg-white"
                      }`}
                    >
                      {selectedOption === option.id
                        ? "✓"
                        : String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-display font-semibold">
                      {option.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {!user && (
              <div className="mb-6">
                <label
                  htmlFor="voterName"
                  className="block font-mono text-xs text-gray-600 mb-2"
                >
                  Your display name (anonymous vote)
                </label>
                <input
                  id="voterName"
                  type="text"
                  value={voterName}
                  onChange={(e) => {
                    setVoterName(e.target.value);
                    if (error) setError("");
                  }}
                  onBlur={() => setAnonymousNameTouched(true)}
                  maxLength={80}
                  placeholder="Enter your name"
                  className="brutal-input"
                />

                <div className="mt-2 flex items-center justify-between font-mono text-xs">
                  <span
                    className={
                      showAnonymousNameError
                        ? "text-brutRed font-bold"
                        : "text-gray-500"
                    }
                  >
                    This name is shown to the poll creator in participants list.
                  </span>
                  <span
                    className={
                      voterNameChars >= 70
                        ? "text-brutOrange font-bold"
                        : "text-gray-500"
                    }
                  >
                    {voterNameChars}/80
                  </span>
                </div>

                {showAnonymousNameError && (
                  <p className="mt-2 font-mono text-xs text-brutRed font-bold">
                    Name is required for anonymous voting.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleVote}
              disabled={
                !selectedOption ||
                submitting ||
                voteSuccessPending ||
                anonymousNameMissing
              }
              className="brutal-btn-primary w-full !py-4 !text-base"
            >
              {submitting || voteSuccessPending
                ? "Recording your vote..."
                : "Submit Vote →"}
            </button>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowFairnessInfo((prev) => !prev)}
                className="font-mono text-xs font-bold underline decoration-2 underline-offset-4 hover:text-brutPink"
              >
                Why this check exists?
              </button>

              {showFairnessInfo && (
                <div className="mt-2 bg-brutBlue/10 border-[2px] border-brutBlue p-3 font-mono text-xs text-gray-700">
                  PollSafe applies fairness protections (device rate limit,
                  account uniqueness, and anonymous duplication checks) to keep
                  poll results reliable and abuse-resistant.
                </div>
              )}
            </div>

            {!user && (
              <p className="font-mono text-xs text-gray-500 mt-3 text-center">
                Voting anonymously •{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="brutal-link !text-xs"
                >
                  Login for account-linked voting
                </button>
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="brutal-card-lg mb-6">
            <ResultsChart
              options={poll.options}
              totalVotes={totalVotes}
              votedOptionId={voteStatus?.votedOptionId}
            />
          </div>
        )}

        {/* Always show results preview for users who already voted */}
        {!showResults && !showVoting && (
          <div className="brutal-card-lg mb-6">
            <ResultsChart options={poll.options} totalVotes={totalVotes} />
          </div>
        )}

        {/* Share */}
        {isCreator && (
          <div className="brutal-card-lg mb-6">
            <h3 className="font-display font-bold text-lg mb-4">
              Participants ({participants.length})
            </h3>

            {participants.length === 0 ? (
              <p className="font-mono text-sm text-gray-500">
                No participants yet.
              </p>
            ) : (
              <div>
                <div className="space-y-2">
                  {visibleParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="border-[2px] border-brutDark bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-display font-semibold truncate">
                          {participant.name}
                        </span>
                        <span className="font-mono text-xs text-gray-500 shrink-0">
                          {new Date(participant.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-gray-600 mt-1">
                        Voted for:{" "}
                        <span className="font-bold">
                          {participant.optionText}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {participants.length > participantsPerPage && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() =>
                        setParticipantsPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={clampedParticipantsPage === 1}
                      className="brutal-btn-secondary !text-xs !px-4 !py-2"
                    >
                      ← Prev
                    </button>

                    <span className="font-mono text-xs text-gray-600">
                      Page {clampedParticipantsPage} of {totalParticipantPages}
                    </span>

                    <button
                      onClick={() =>
                        setParticipantsPage((prev) =>
                          Math.min(totalParticipantPages, prev + 1),
                        )
                      }
                      disabled={
                        clampedParticipantsPage === totalParticipantPages
                      }
                      className="brutal-btn-secondary !text-xs !px-4 !py-2"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <ShareCard pollId={poll.id} />
      </div>
    </div>
  );
}