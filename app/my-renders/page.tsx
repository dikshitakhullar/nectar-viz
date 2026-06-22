"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/auth-provider";
import { listUserGenerations, type GenerationDoc } from "@/lib/generations";

function formatWhen(ts: GenerationDoc["createdAt"]): string {
  if (!ts) return "";
  try {
    const date = ts.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function MyRendersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<GenerationDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect anonymous users home
  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const docs = await listUserGenerations(user.uid);
        if (!cancelled) setItems(docs);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Couldn't load your renders.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || (!user && !error)) {
    return <div className="text-center py-16 text-neutral-500">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="text-center font-mono text-[10px] tracking-[0.18em] uppercase text-gold">My renders</p>
        <h2 className="text-center font-serif text-[26px] leading-[1.25] font-light text-neutral-200 mt-2">
          Your <span className="italic text-gold">visualized</span> rooms.
        </h2>
      </header>

      {error && (
        <p role="alert" className="text-center text-red-400 text-sm">{error}</p>
      )}

      {items === null && !error && (
        <p className="text-center text-neutral-500 text-sm">Loading…</p>
      )}

      {items && items.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <p className="text-neutral-400">No renders yet.</p>
          <Link
            href="/upload"
            className="inline-block px-5 py-3 rounded-md bg-gold text-black font-medium text-sm tracking-wide hover:bg-gold-light transition-colors"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            Visualize your first room →
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((g) => (
            <li key={g.id}>
              <Link
                href={`/my-renders/${g.id}`}
                className="group block overflow-hidden rounded-xl border border-white/[0.06] bg-neutral-900/40 hover:border-gold/30 transition-all duration-200"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <div className="relative aspect-[4/3] bg-neutral-900 flex items-center justify-center">
                  {g.resultImageUrl ? (
                    <Image
                      src={g.resultImageUrl}
                      alt={g.productName || "Visualization"}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      unoptimized
                    />
                  ) : (
                    <div className="text-center text-neutral-600">
                      <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                        <circle cx="8.5" cy="10" r="1.5" />
                        <path d="m3 17 5-4 4 3 3.5-3 5.5 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-[10px] uppercase tracking-wider">Preview unavailable</p>
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-light text-neutral-200 tracking-wide truncate">
                      {g.productName || g.productSlug || "AI pick"}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 uppercase tracking-wider">
                      {g.roomType?.replace(/_/g, " ")} · {g.mode === "ai" ? "AI Pick" : "Selected"}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] tracking-[0.1em] uppercase text-neutral-600">
                    {formatWhen(g.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
