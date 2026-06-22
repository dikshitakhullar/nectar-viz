"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/components/auth-provider";
import type { GenerationDoc } from "@/lib/generations";

export default function RenderDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [gen, setGen] = useState<GenerationDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !params?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "generations", params.id));
        if (!snap.exists()) {
          if (!cancelled) setError("Render not found.");
          return;
        }
        const data = snap.data();
        if (data.userId !== user.uid) {
          if (!cancelled) setError("You don't have access to this render.");
          return;
        }
        if (!cancelled) setGen({ id: snap.id, ...data } as GenerationDoc);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Couldn't load this render.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, params?.id]);

  if (authLoading || (!user && !error)) {
    return <div className="text-center py-16 text-neutral-500">Loading…</div>;
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-red-400 text-sm">{error}</p>
        <Link href="/my-renders" className="inline-block text-gold underline">Back to my renders</Link>
      </div>
    );
  }

  if (!gen) {
    return <div className="text-center py-16 text-neutral-500">Loading render…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/my-renders"
        className="inline-flex items-center gap-1 text-[12px] tracking-wider uppercase text-neutral-500 hover:text-gold transition-colors"
        style={{ minHeight: "unset", minWidth: "unset" }}
      >
        ← All renders
      </Link>

      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.06] bg-neutral-900">
        {gen.resultImageUrl && (
          <Image
            src={gen.resultImageUrl}
            alt={gen.productName || "Visualization"}
            fill
            className="object-contain"
            sizes="100vw"
            unoptimized
          />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-light text-neutral-200">
          {gen.productName || gen.productSlug || "AI pick"}
        </h2>
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">
          {gen.roomType?.replace(/_/g, " ")} · {gen.vibe} · {gen.mode === "ai" ? "AI Pick" : "Selected product"}
        </p>
      </div>

      {gen.roomImageUrl && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-neutral-500 mb-2">Original room</p>
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.06] bg-neutral-900">
            <Image
              src={gen.roomImageUrl}
              alt="Original room"
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>
        </div>
      )}

      {gen.notes && (
        <div className="bg-neutral-900/40 border border-white/[0.06] rounded-xl p-4">
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-neutral-500 mb-2">Notes</p>
          <p className="text-sm text-neutral-300 leading-relaxed">{gen.notes}</p>
        </div>
      )}
    </div>
  );
}
