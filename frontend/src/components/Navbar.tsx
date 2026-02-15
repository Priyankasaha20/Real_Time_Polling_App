"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="bg-white border-b-[3px] border-brutDark sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brutYellow border-[3px] border-brutDark flex items-center justify-center font-mono font-bold text-sm group-hover:bg-brutPink transition-colors">
            P
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
            PollSafe
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/" className="brutal-btn-secondary !py-2 !px-4 !text-xs">
            Explore
          </Link>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/create"
                    className="brutal-btn-primary !py-2 !px-4 !text-xs"
                  >
                    + Create Poll
                  </Link>
                  <Link
                    href="/my-polls"
                    className="brutal-btn-secondary !py-2 !px-4 !text-xs"
                  >
                    My Polls
                  </Link>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-8 h-8 bg-brutBlue border-[2px] border-brutDark flex items-center justify-center font-mono font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="font-mono text-xs font-bold underline decoration-2 hover:text-brutRed transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="brutal-btn-secondary !py-2 !px-4 !text-xs"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="brutal-btn-primary !py-2 !px-4 !text-xs"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 border-[3px] border-brutDark flex items-center justify-center font-mono font-bold"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t-[3px] border-brutDark bg-white p-4 flex flex-col gap-2">
          <Link href="/" onClick={() => setMenuOpen(false)} className="brutal-btn-secondary !text-xs">
            Explore
          </Link>
          {!loading && user ? (
            <>
              <Link href="/create" onClick={() => setMenuOpen(false)} className="brutal-btn-primary !text-xs">
                + Create Poll
              </Link>
              <Link href="/my-polls" onClick={() => setMenuOpen(false)} className="brutal-btn-secondary !text-xs">
                My Polls
              </Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="brutal-btn-danger !text-xs">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="brutal-btn-secondary !text-xs">
                Login
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="brutal-btn-primary !text-xs">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
