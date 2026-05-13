"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [productSlug, setProductSlug] = useState<string>("");

  useEffect(() => {
    const url = sessionStorage.getItem("resultImage");
    const slug = sessionStorage.getItem("productSlug");
    if (!url) {
      router.push("/");
      return;
    }
    setImageUrl(url);
    setProductSlug(slug || "");
  }, [router]);

  async function handleDownload() {
    if (!imageUrl) return;
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delhi-brass-${productSlug}-room.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (!imageUrl || !navigator.share) {
      handleDownload();
      return;
    }
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `delhi-brass-${productSlug}.png`, {
        type: "image/png",
      });
      await navigator.share({
        title: "Delhi Brass — Room Visualization",
        text: "See how this light looks in my room!",
        files: [file],
      });
    } catch {
      handleDownload();
    }
  }

  if (!imageUrl) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 border-2 border-[#c9a84c] rounded-full animate-spin mx-auto" style={{ borderTopColor: 'transparent' }} />
        <p className="text-sm text-neutral-500 mt-4">Loading result...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <div className="w-12 h-[1px] bg-gradient-to-r from-[#c9a84c] to-transparent mb-4" />
        <h2 className="text-2xl font-extralight tracking-wide text-neutral-200">
          Your Visualization
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {productSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} in your room
        </p>
      </div>

      {/* Result image */}
      <div className="rounded-xl overflow-hidden border border-neutral-800/50 shadow-[0_0_40px_rgba(201,168,76,0.05)]">
        <img
          src={imageUrl}
          alt="Room visualization"
          className="w-full"
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="bg-[#c9a84c] text-black rounded-xl py-3 text-xs font-medium tracking-wider uppercase hover:bg-[#dfc06b] transition-colors"
        >
          Download
        </button>
        <button
          onClick={handleShare}
          className="border border-[#c9a84c]/50 text-[#c9a84c] rounded-xl py-3 text-xs font-medium tracking-wider uppercase hover:bg-[#c9a84c]/10 transition-colors"
        >
          Share
        </button>
      </div>

      {/* Navigation */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => {
            sessionStorage.removeItem("resultImage");
            // Keep room image, room type, state, vibe — just go back to upload with same product
            router.push(`/upload?product=${productSlug}`);
          }}
          className="w-full border border-neutral-800 rounded-xl py-3 text-xs tracking-wider uppercase text-neutral-400 hover:border-neutral-600 transition-colors"
        >
          Try a Different Room
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem("resultImage");
            sessionStorage.removeItem("productSlug");
            // Keep room image, room type, state, vibe — user picks a new product, room is preserved
            router.push("/");
          }}
          className="w-full border border-neutral-800 rounded-xl py-3 text-xs tracking-wider uppercase text-neutral-400 hover:border-neutral-600 transition-colors"
        >
          Try Another Product
        </button>
      </div>
    </div>
  );
}
