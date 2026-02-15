"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pollsAPI } from "@/lib/api";
import { Poll } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await pollsAPI.list(page, 9);
        setPolls(data.polls);
        setTotalPages(data.pagination.totalPages);
      } catch {
        setLoadError("Could not load public polls right now.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, reloadTick]);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="brutal-card-lg bg-brutYellow mb-10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="brutal-badge bg-white mb-4">Real-Time Polling</div>
            <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-4 leading-[1.1]">
              Create Polls.
              <br />
              Get Answers.
              <br />
              <span className="inline-block bg-brutDark text-brutYellow px-3 py-1 -rotate-1">
                Stay Fair.
              </span>
            </h1>
            <p className="font-mono text-sm md:text-base max-w-md mb-6">
              Anti-abuse protection with device rate limiting. Real-time results
              via WebSocket. Anonymous & authenticated voting.
            </p>

            {user && (
              <p className="font-mono text-xs text-gray-700 mb-4">
                Welcome back, <span className="font-bold">{user.name}</span>.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link href="/create" className="brutal-btn bg-white !text-sm">
                    + Create a Poll
                  </Link>
                  <Link
                    href="/my-polls"
                    className="brutal-btn bg-brutDark text-brutYellow !text-sm"
                  >
                    My Polls
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="brutal-btn bg-white !text-sm">
                    Get Started Free →
                  </Link>
                  <Link
                    href="/login"
                    className="brutal-btn bg-brutDark text-brutYellow !text-sm"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Fun graphic */}
          <div className="shrink-0 hidden md:block">
            <div className="w-48 h-48 bg-white border-[3px] border-brutDark shadow-brutal-xl p-4 rotate-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-brutPink border-[2px] border-brutDark" />
                  <div
                    className="flex-1 h-6 bg-brutPink/30 border-[2px] border-brutDark"
                    style={{ width: "80%" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-brutBlue border-[2px] border-brutDark" />
                  <div
                    className="flex-1 h-6 bg-brutBlue/30 border-[2px] border-brutDark"
                    style={{ width: "60%" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-brutPurple border-[2px] border-brutDark" />
                  <div
                    className="flex-1 h-6 bg-brutPurple/30 border-[2px] border-brutDark"
                    style={{ width: "45%" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-brutGreen border-[2px] border-brutDark" />
                  <div
                    className="flex-1 h-6 bg-brutGreen/30 border-[2px] border-brutDark"
                    style={{ width: "30%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="brutal-card">
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="font-display font-bold text-lg mb-1">Anti-Abuse</h3>
          <p className="font-mono text-xs text-gray-600">
            3-layer fairness system: device rate limiting, user checks,
            anonymous checks.
          </p>
        </div>
        <div className="brutal-card">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-display font-bold text-lg mb-1">Real-Time</h3>
          <p className="font-mono text-xs text-gray-600">
            Results update live via WebSocket. No refresh needed.
          </p>
        </div>
        <div className="brutal-card">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-display font-bold text-lg mb-1">Open Voting</h3>
          <p className="font-mono text-xs text-gray-600">
            Anyone can vote — logged in or anonymous. Fair for everyone.
          </p>
        </div>
      </div>

      {/* Explore Polls */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Explore Polls</h2>
          <p className="font-mono text-sm text-gray-500">
            Public polls from the community
          </p>
        </div>
        <div className="font-mono text-xs text-gray-500">
          Page {page} of {totalPages}
        </div>
      </div>

      {loadError && (
        <div className="bg-brutRed/10 border-[3px] border-brutRed p-4 font-mono text-sm text-brutRed font-bold mb-6 flex items-center justify-between gap-3">
          <span>✗ {loadError}</span>
          <button
            onClick={() => setReloadTick((v) => v + 1)}
            className="brutal-btn-secondary !text-xs !py-1 !px-3"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="brutal-card animate-pulse">
              <div className="h-4 bg-gray-200 w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 w-1/2 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 w-full" />
                <div className="h-3 bg-gray-100 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="brutal-card text-center py-12">
          <div className="text-4xl mb-4">🗳️</div>
          <h3 className="font-display font-bold text-xl mb-2">No polls yet</h3>
          <p className="font-mono text-sm text-gray-500 mb-4">
            Be the first to create one!
          </p>
          <Link href="/create" className="brutal-btn-primary">
            Create Poll →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {polls.map((poll) => {
              const totalVotes = poll._count?.votes ?? 0;
              return (
                <Link
                  key={poll.id}
                  href={`/poll/${poll.id}`}
                  className="brutal-card group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all duration-100"
                >
                  <h3 className="font-display font-bold text-base mb-2 line-clamp-2 group-hover:text-brutPink transition-colors">
                    {poll.question}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {poll.creator && (
                      <span className="font-mono text-xs text-gray-500">
                        by {poll.creator.name}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-gray-400">
                      {new Date(poll.createdAt).toLocaleDateString()}
                    </span>
                    <span className="brutal-badge bg-brutYellow !text-[10px] !py-0">
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {poll.options.slice(0, 3).map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-2 font-mono text-xs"
                      >
                        <div
                          className="h-2 bg-brutBlue border border-brutDark"
                          style={{
                            width: `${
                              totalVotes > 0
                                ? Math.max(
                                    (opt.voteCount / totalVotes) * 100,
                                    5,
                                  )
                                : 5
                            }%`,
                          }}
                        />
                        <span className="truncate">{opt.text}</span>
                      </div>
                    ))}
                    {poll.options.length > 3 && (
                      <p className="font-mono text-xs text-gray-400">
                        +{poll.options.length - 3} more
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="brutal-btn-secondary !text-xs !py-2 !px-4"
              >
                ← Prev
              </button>
              <span className="font-mono text-sm font-bold">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="brutal-btn-secondary !text-xs !py-2 !px-4"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}