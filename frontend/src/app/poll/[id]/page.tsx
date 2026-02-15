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

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
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
    setSubmitting(true);
    setError("");

    try {
      await votesAPI.cast(id, {
        optionId: selectedOption,
        fingerprint,
      });

      setVoteStatus({
        hasVoted: true,
        canVote: false,
        reason: "already_voted",
        votedOptionId: selectedOption,
      });
    } catch (err: any) {
      if (err.status === 429) {
        setVoteStatus({
          hasVoted: false,
          canVote: false,
          reason: "rate_limit",
          message: err.error,
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
      setSubmitting(false);
    }
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
          <h2 className="font-display font-bold text-2xl mb-2">Poll Not Found</h2>
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

  const totalVotes = poll._count?.votes ?? poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  const showResults = voteStatus?.hasVoted || (voteStatus && !voteStatus.canVote);
  const showVoting = voteStatus && !voteStatus.hasVoted && voteStatus.canVote;

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

        {/* Blocked Messages */}
        {voteStatus && !voteStatus.canVote && !voteStatus.hasVoted && (
          <div className="brutal-card mb-6">
            {voteStatus.reason === "rate_limit" && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏱️</span>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">
                    Device Rate Limit Reached
                  </h3>
                  <p className="font-mono text-sm text-gray-600">
                    This device has reached the vote limit (2 per hour). Please
                    try again later.
                  </p>
                </div>
              </div>
            )}
            {voteStatus.reason === "anonymous_used" && (
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
            {voteStatus.reason === "already_voted" && (
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
            <div className="space-y-3 mb-6">
              {poll.options.map((option: Option, i: number) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={
                    selectedOption === option.id
                      ? "brutal-radio-selected w-full text-left"
                      : "brutal-radio w-full text-left"
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

            <button
              onClick={handleVote}
              disabled={!selectedOption || submitting}
              className="brutal-btn-primary w-full !py-4 !text-base"
            >
              {submitting ? "Submitting..." : "Submit Vote →"}
            </button>

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
        <ShareCard pollId={poll.id} />
      </div>
    </div>
  );
}
