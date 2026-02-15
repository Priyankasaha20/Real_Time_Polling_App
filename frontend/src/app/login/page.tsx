"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="page-title">Welcome Back</h1>
          <p className="page-subtitle">Log in to create & manage your polls</p>
        </div>

        {/* Login Card */}
        <div className="brutal-card-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-brutRed/10 border-[3px] border-brutRed p-3 font-mono text-sm text-brutRed font-bold">
                ✗ {error}
              </div>
            )}

            <div>
              <label className="font-mono text-sm font-bold uppercase tracking-wider block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="brutal-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="font-mono text-sm font-bold uppercase tracking-wider block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="brutal-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="brutal-btn-primary w-full"
            >
              {loading ? "Logging in..." : "Log In →"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 font-mono text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="brutal-link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}