"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoomBanner } from "./room-banner";

export function HomeContent() {
  const [hasRoom, setHasRoom] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hydration-from-storage: this is the canonical setState-in-effect pattern.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const room = sessionStorage.getItem("nectar.currentRoomBase64");
      setHasRoom(!!room);
    } catch {
      // storage may be unavailable (e.g., privacy mode)
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Show first-time variant until hydration to avoid flash.
  // Server-rendered output matches the first-time variant.
  const card1Label =
    hydrated && hasRoom ? "Continue visualizing" : "See it in your room";
  const card1Sub =
    hydrated && hasRoom
      ? "Pick a product or let AI suggest the best ones."
      : "Upload your room. Pick a product or let AI suggest the best ones.";

  return (
    <div className="w-full max-w-md mx-auto px-5 py-10 space-y-6">
      {/* Room banner (only when room is in session) */}
      {hydrated && hasRoom && <RoomBanner />}

      {/* Card 1 — primary */}
      <Link
        href="/upload"
        className="group block bg-gradient-to-br from-gold/[0.08] via-transparent to-gold/[0.02] border border-gold/20 rounded-3xl p-5 hover:border-gold/40 hover:shadow-[0_0_60px_rgba(201,168,76,0.06)] transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors text-gold">
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.315z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-light text-neutral-200 tracking-wide">
              {card1Label}
            </p>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              {card1Sub}
            </p>
          </div>
          <span className="text-neutral-600 text-lg">→</span>
        </div>
      </Link>

      {/* Card 2 — Pinterest (coming soon) */}
      <Link
        href="/inspire"
        className="group block bg-white/[0.025] border border-white/[0.07] rounded-3xl p-5 hover:border-white/[0.18] transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.15] flex items-center justify-center shrink-0 text-neutral-400">
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-light text-neutral-200 tracking-wide">
              Shop your Pinterest
              <span className="ml-2 inline-block text-[9px] uppercase tracking-[0.1em] text-gold border border-gold/30 bg-gold/[0.05] px-2 py-[2px] rounded-full align-middle">
                Soon
              </span>
            </p>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              From inspo to in-your-room — matching products from your
              screenshots.
            </p>
          </div>
          <span className="text-neutral-600 text-lg">→</span>
        </div>
      </Link>

      {/* Closing flourish */}
      <p className="text-center text-[10px] uppercase tracking-[0.15em] text-neutral-600 pt-6">
        — Every product, in your room —
      </p>
    </div>
  );
}
