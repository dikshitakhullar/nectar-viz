"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface AiOption {
  slug: string;
  imageUrl: string;
}

function slugToName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SingleResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAiMode = searchParams.get("mode") === "ai";

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [productSlug, setProductSlug] = useState<string>("");
  const [aiOptions, setAiOptions] = useState<AiOption[]>([]);
  const [selectedAiIndex, setSelectedAiIndex] = useState(0);

  useEffect(() => {
    if (isAiMode) {
      const count = parseInt(sessionStorage.getItem("aiResultCount") || "0");
      const options: AiOption[] = [];
      for (let i = 0; i < count; i++) {
        const url = sessionStorage.getItem(`aiResultImage_${i}`);
        const slug = sessionStorage.getItem(`aiResultSlug_${i}`);
        if (url && slug) options.push({ slug, imageUrl: url });
      }
      if (options.length === 0) {
        router.push("/");
        return;
      }
      setAiOptions(options);
      setImageUrl(options[0].imageUrl);
      setProductSlug(options[0].slug);
    } else {
      const url = sessionStorage.getItem("resultImage");
      const slug = sessionStorage.getItem("productSlug");
      if (!url) {
        router.push("/");
        return;
      }
      setImageUrl(url);
      setProductSlug(slug || "");
    }
  }, [router, isAiMode]);

  function selectAiOption(index: number) {
    setSelectedAiIndex(index);
    setImageUrl(aiOptions[index].imageUrl);
    setProductSlug(aiOptions[index].slug);
  }

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
      const file = new File([blob], `delhi-brass-${productSlug}.png`, { type: "image/png" });
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
        <div className="w-12 h-12 border-2 border-[#c9a84c] rounded-full animate-spin mx-auto" style={{ borderTopColor: "transparent" }} />
        <p className="text-sm text-neutral-500 mt-4">Loading result...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <div className="w-12 h-[1px] bg-gradient-to-r from-[#c9a84c] to-transparent mb-4" />
        <h2 className="text-2xl font-extralight tracking-wide text-neutral-200">
          {isAiMode ? "AI Recommendations" : "Your Visualization"}
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {isAiMode
            ? `${aiOptions.length} options for your room — ${slugToName(productSlug)}`
            : `${slugToName(productSlug)} in your room`}
        </p>
      </div>

      {/* AI option tabs */}
      {isAiMode && aiOptions.length > 1 && (
        <div className="flex gap-2">
          {aiOptions.map((opt, i) => (
            <button
              key={opt.slug}
              onClick={() => selectAiOption(i)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs tracking-wider uppercase border transition-all duration-300 ${
                selectedAiIndex === i
                  ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              Option {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Product name for current selection */}
      {isAiMode && (
        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800/50 px-4 py-3">
          <p className="text-xs tracking-wider uppercase text-neutral-500">Selected Product</p>
          <p className="text-sm font-light text-neutral-200 mt-0.5">{slugToName(productSlug)}</p>
        </div>
      )}

      {/* Result image */}
      <div className="rounded-xl overflow-hidden border border-neutral-800/50 shadow-[0_0_40px_rgba(201,168,76,0.05)]">
        <img src={imageUrl} alt="Room visualization" className="w-full" />
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
            if (isAiMode) {
              router.push("/upload?mode=ai");
            } else {
              router.push(`/upload?product=${productSlug}`);
            }
          }}
          className="w-full border border-neutral-800 rounded-xl py-3 text-xs tracking-wider uppercase text-neutral-400 hover:border-neutral-600 transition-colors"
        >
          Try a Different Room
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem("resultImage");
            sessionStorage.removeItem("productSlug");
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

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-neutral-500">Loading...</div>}>
      <SingleResult />
    </Suspense>
  );
}
