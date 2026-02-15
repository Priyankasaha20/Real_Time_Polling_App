import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PollSafe — Real-Time Polling with Fair Voting",
  description:
    "Create and share polls with robust anti-abuse protection. Real-time results, anonymous & authenticated voting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="retro-grid min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="pt-4 pb-16">{children}</main>
          <footer className="border-t-[3px] border-brutDark bg-white py-6">
            <div className="max-w-4xl mx-auto px-4 flex flex-col gap-3 items-center">
              <p className="font-mono text-sm text-center">
                Developed by <span className="font-bold">Priyanka</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
                <a
                  href="https://github.com/Priyankasaha20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 hover:text-brutBlue transition-colors"
                >
                  GitHub
                </a>
                <span>•</span>
                <a
                  href="https://leetcode.com/u/OotjGNQwSi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 hover:text-brutBlue transition-colors"
                >
                  LeetCode
                </a>
                <span>•</span>
                <a
                  href="https://www.linkedin.com/in/priyanka-saha-03a8b5267/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 hover:text-brutBlue transition-colors"
                >
                  LinkedIn
                </a>
                <span>•</span>
                <a
                  href="https://www.instagram.com/tooloudbitch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 hover:text-brutBlue transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
