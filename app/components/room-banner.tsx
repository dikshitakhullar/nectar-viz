"use client";

import { useEffect, useState } from "react";
import type { RoomType } from "@/lib/types";

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  formal_living: "Formal Living / Drawing Room",
  family_lounge: "Family Lounge",
  dining_room: "Dining Room",
  bedroom: "Bedroom",
  entrance_lobby: "Entrance / Lobby",
  mandir: "Mandir / Prayer Room",
  stairwell: "Stairwell / Double Height",
  passage: "Passage / Corridor",
  terrace: "Terrace / Patio",
  bar: "Bar / Home Bar",
  other: "Room",
};

const STICKY_KEYS = [
  "nectar.lastRoomState",
  "nectar.lastRoomType",
  "nectar.lastVibe",
  "nectar.lastNotes",
  "nectar.lastPreserveFinishes",
  "nectar.lastAddDecor",
  "nectar.lastTimeOfDay",
];

export function RoomBanner() {
  const [thumb, setThumb] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType>("other");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Hydration-from-storage: this is the canonical setState-in-effect pattern.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    try {
      const base64 = sessionStorage.getItem("nectar.currentRoomBase64");
      const savedType = localStorage.getItem("nectar.lastRoomType") as RoomType | null;
      if (base64) setThumb(base64);
      if (savedType && ROOM_TYPE_LABELS[savedType]) setRoomType(savedType);
    } catch {
      // sessionStorage / localStorage may be unavailable (e.g. private mode)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!mounted || !thumb) return null;

  function handleChange() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "This will clear your current room photo. Continue?",
    );
    if (!ok) return;
    try {
      sessionStorage.removeItem("nectar.currentRoomBase64");
      STICKY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.reload();
  }

  return (
    <div className="bg-gold/[0.04] border border-gold/15 rounded-2xl p-4 flex items-center gap-4 transition-colors duration-300 hover:border-gold/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt="Your room"
        className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
      />
      <p className="flex-1 text-sm font-light tracking-wide text-neutral-300 truncate">
        <span className="text-neutral-500">Visualizing for · </span>
        <span className="text-neutral-200">{ROOM_TYPE_LABELS[roomType]}</span>
      </p>
      <button
        type="button"
        onClick={handleChange}
        className="text-xs tracking-wider uppercase text-gold hover:text-gold-light transition-colors px-3 flex items-center"
        style={{ minHeight: "44px", minWidth: "unset" }}
      >
        Change
      </button>
    </div>
  );
}
