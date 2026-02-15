"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { pollsAPI } from "@/lib/api";
import { Poll } from "@/types";

export default function MyPollsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      pollsAPI
        .myPolls()
        .then((data) => setPolls(data.polls))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && !loading)) {
    return (
      <div className="page-container flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="brutal-card text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="font-mono font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">My Polls</h1>
            <p className="page-subtitle">Manage your created polls</p>
          </div>
          <Link href="/create" className="brutal-btn-primary !text-xs">
            + New Poll
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="brutal-card animate-pulse">
                <div className="h-5 bg-gray-200 w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 w-1/3" />
              </div>
            ))}
          </div>
        ) : polls.length === 0 ? (
          <div className="brutal-card-lg text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-display font-bold text-xl mb-2">
              No polls yet
            </h3>
            <p className="font-mono text-sm text-gray-500 mb-6">
              Create your first poll and share it with the world.
            </p>
            <Link href="/create" className="brutal-btn-primary">
              Create Your First Poll →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const totalVotes = poll._count?.votes ?? 0;
              return (
                <Link
                  key={poll.id}
                  href={`/poll/${poll.id}`}
                  className="brutal-card block group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all duration-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-lg mb-1 group-hover:text-brutPink transition-colors truncate">
                        {poll.question}
                      </h3>
                      <div className="flex items-center gap-3 font-mono text-xs text-gray-500">
                        <span>{poll.options.length} options</span>
                        <span>•</span>
                        <span>
                          {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{poll.isPublic ? "Public" : "Private"}</span>
                      </div>
                    </div>
                    <div className="brutal-badge bg-brutYellow shrink-0">
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div className="mt-3 flex gap-1 h-3">
                    {poll.options.map((opt, i) => {
                      const pct =
                        totalVotes > 0
                          ? (opt.voteCount / totalVotes) * 100
                          : 100 / poll.options.length;
                      const colors = [
                        "bg-brutYellow",
                        "bg-brutPink",
                        "bg-brutBlue",
                        "bg-brutPurple",
                        "bg-brutOrange",
                        "bg-brutGreen",
                      ];
                      return (
                        <div
                          key={opt.id}
                          className={`${colors[i % colors.length]} border-[2px] border-brutDark`}
                          style={{ width: `${Math.max(pct, 3)}%` }}
                          title={`${opt.text}: ${opt.voteCount}`}
                        />
                      );
                    })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}