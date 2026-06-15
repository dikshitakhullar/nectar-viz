"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function UploadCallout() {
  const [mounted, setMounted] = useState(false);
  const [hasRoom, setHasRoom] = useState(false);

  useEffect(() => {
    // Hydration-from-storage: this is the canonical setState-in-effect pattern.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    try {
      const base64 = sessionStorage.getItem("nectar.currentRoomBase64");
      if (base64) setHasRoom(true);
    } catch {
      // sessionStorage may be unavailable (e.g. private mode)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Only show when mounted (avoid SSR mismatch) AND when no room is in session.
  if (!mounted || hasRoom) return null;

  return (
    <Link
      href="/upload"
      className="block bg-gradient-to-br from-gold/[0.08] via-transparent to-gold/[0.02] border border-gold/20 rounded-3xl p-6 hover:border-gold/40 hover:shadow-[0_0_60px_rgba(201,168,76,0.06)] transition-all duration-500 group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-light tracking-wide text-neutral-200">
            See it in your room
          </h3>
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
            Upload a photo of your space — we&apos;ll show you how any product fits.
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
          <svg
            className="w-5 h-5 text-gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
