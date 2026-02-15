"use client";

import { Option } from "@/types";

interface ResultsChartProps {
  options: Option[];
  totalVotes: number;
  votedOptionId?: string;
}

const COLORS = [
  "bg-brutYellow",
  "bg-brutPink",
  "bg-brutBlue",
  "bg-brutPurple",
  "bg-brutOrange",
  "bg-brutGreen",
  "bg-brutRed",
  "bg-amber-400",
  "bg-cyan-400",
  "bg-rose-400",
];

export default function ResultsChart({
  options,
  totalVotes,
  votedOptionId,
}: ResultsChartProps) {
  const maxVotes = Math.max(...options.map((o) => o.voteCount), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-lg">Results</h3>
        <span className="brutal-badge bg-brutYellow">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </span>
      </div>

      {options.map((option, i) => {
        const percentage =
          totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
        const barWidth =
          maxVotes > 0 ? Math.round((option.voteCount / maxVotes) * 100) : 0;
        const isVoted = option.id === votedOptionId;

        return (
          <div
            key={option.id}
            className={`border-[3px] border-brutDark p-4 relative overflow-hidden ${
              isVoted ? "ring-4 ring-brutYellow ring-offset-2" : ""
            }`}
          >
            {/* Background bar */}
            <div
              className={`absolute inset-y-0 left-0 ${COLORS[i % COLORS.length]} opacity-30 transition-all duration-700 ease-out animate-grow`}
              style={{ width: `${barWidth}%` }}
            />

            {/* Content */}
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-7 h-7 ${COLORS[i % COLORS.length]} border-[2px] border-brutDark flex items-center justify-center font-mono font-bold text-xs shrink-0`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-display font-semibold truncate">
                  {option.text}
                </span>
                {isVoted && (
                  <span className="brutal-badge bg-brutYellow !text-[10px] shrink-0">
                    Your vote
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-bold text-lg">{percentage}%</span>
                <span className="font-mono text-xs text-gray-500">
                  ({option.voteCount})
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
