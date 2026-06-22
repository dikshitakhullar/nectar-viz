"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { FREE_QUOTA } from "@/lib/user-profile";

export function UserMenu() {
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (loading) {
    return <div className="w-8 h-8" aria-hidden />;
  }

  if (!user) {
    // Not signed in — nothing in chrome (signin happens via gate)
    return null;
  }

  const initial = (profile?.name?.trim()?.[0] || user.phoneNumber?.slice(-1) || "•").toUpperCase();
  const used = profile?.generationsUsed ?? 0;
  const remaining = Math.max(0, FREE_QUOTA - used);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 text-gold font-mono text-[12px] flex items-center justify-center hover:bg-gold/25 transition-colors"
        style={{ minHeight: "unset", minWidth: "unset" }}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line-gold bg-surface shadow-[0_24px_64px_rgba(0,0,0,0.6)] py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-line">
            <p className="text-[13px] text-text-primary font-medium truncate">
              {profile?.name || "Account"}
            </p>
            <p className="font-mono text-[10px] text-text-tertiary mt-0.5 truncate">
              {user.phoneNumber || profile?.email}
            </p>
            <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-gold mt-2">
              {profile?.plan === "member" ? "Member" : `${remaining} / ${FREE_QUOTA} renders left`}
            </p>
          </div>
          <Link
            href="/my-renders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            My renders
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="block w-full text-left px-4 py-2 text-[13px] text-text-secondary hover:text-red-300 hover:bg-white/[0.04] transition-colors"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
