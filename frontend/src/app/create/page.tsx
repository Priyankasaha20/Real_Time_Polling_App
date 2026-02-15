"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { pollsAPI } from "@/lib/api";
import ShareCard from "@/components/ShareCard";

export default function CreatePollPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdPollId, setCreatedPollId] = useState<string | null>(null);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) {
      setError("Question is required");
      return;
    }
    if (trimmedOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setLoading(true);
    try {
      const data = await pollsAPI.create({
        question: question.trim(),
        options: trimmedOptions,
        isPublic,
      });
      setCreatedPollId(data.poll.id);
    } catch (err: any) {
      setError(err.error || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="page-container flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="brutal-card-lg text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display font-bold text-2xl mb-2">
            Login Required
          </h2>
          <p className="font-mono text-sm text-gray-600 mb-6">
            You need to be logged in to create polls.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="brutal-btn-primary"
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  if (createdPollId) {
    return (
      <div className="page-container flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="page-title">Poll Created!</h1>
            <p className="page-subtitle">Share it with the world</p>
          </div>
          <ShareCard pollId={createdPollId} />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.push(`/poll/${createdPollId}`)}
              className="brutal-btn-primary flex-1"
            >
              View Poll →
            </button>
            <button
              onClick={() => {
                setCreatedPollId(null);
                setQuestion("");
                setOptions(["", ""]);
              }}
              className="brutal-btn-secondary flex-1"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="page-title">Create a Poll</h1>
          <p className="page-subtitle">Ask a question, add options, share.</p>
        </div>

        <div className="brutal-card-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-brutRed/10 border-[3px] border-brutRed p-3 font-mono text-sm text-brutRed font-bold">
                ✗ {error}
              </div>
            )}

            {/* Question */}
            <div>
              <label className="font-mono text-sm font-bold uppercase tracking-wider block mb-2">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="brutal-input"
                placeholder="What do you want to ask?"
                maxLength={200}
                required
              />
              <p className="font-mono text-xs text-gray-400 mt-1">
                {question.length}/200
              </p>
            </div>

            {/* Options */}
            <div>
              <label className="font-mono text-sm font-bold uppercase tracking-wider block mb-3">
                Options
              </label>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-8 h-8 bg-brutYellow border-[2px] border-brutDark flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="brutal-input"
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      maxLength={100}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="w-8 h-8 border-[2px] border-brutDark bg-brutRed text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="brutal-btn-secondary !py-2 !px-4 !text-xs mt-3"
                >
                  + Add Option
                </button>
              )}
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-7 border-[3px] border-brutDark relative transition-colors ${
                  isPublic ? "bg-brutGreen" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white border-[2px] border-brutDark absolute top-0.5 transition-all ${
                    isPublic ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
              <span className="font-mono text-sm font-bold">
                {isPublic ? "Public" : "Private"} — {isPublic ? "Listed on explore page" : "Only accessible via link"}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="brutal-btn-primary w-full !py-4 !text-base"
            >
              {loading ? "Creating..." : "Create Poll →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
