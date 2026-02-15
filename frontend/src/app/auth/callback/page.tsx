"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const { refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
      await refresh();
      router.push("/");
    };
    finalize();
  }, [refresh, router]);

  return (
    <div className="page-container flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="brutal-card text-center">
        <div className="text-4xl mb-4 animate-pulse">🔐</div>
        <p className="font-mono font-bold">Completing login...</p>
      </div>
    </div>
  );
}
