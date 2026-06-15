"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import posthog from "posthog-js";

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

  const [allSlugs, setAllSlugs] = useState<string[]>([]);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isAiMode) {
      const count = parseInt(sessionStorage.getItem("aiResultCount") || "0");
      const options: AiOption[] = [];
      for (let i = 0; i < count; i++) {
        const url = sessionStorage.getItem(`aiResultImage_${i}`);
        const slug = sessionStorage.getItem(`aiResultSlug_${i}`);
        if (url && slug) options.push({ slug, imageUrl: url });
      }
      // Load all recommended slugs (some may not have renders yet)
      const slugsJson = sessionStorage.getItem("aiAllSlugs");
      const slugs = slugsJson ? JSON.parse(slugsJson) : options.map((o) => o.slug);
      setAllSlugs(slugs);

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
    posthog.capture("ai_option_switched", {
      option_index: index,
      product_slug: aiOptions[index].slug,
      total_options: aiOptions.length,
    });
  }

  async function addLogoWatermark(imageBlob: Blob): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.onload = () => {
          // Logo in bottom-right, ~8% of image width, with some padding
          const logoWidth = Math.max(80, img.width * 0.08);
          const logoHeight = (logo.height / logo.width) * logoWidth;
          const padding = img.width * 0.02;
          const x = img.width - logoWidth - padding;
          const y = img.height - logoHeight - padding;
          ctx.globalAlpha = 0.7;
          ctx.drawImage(logo, x, y, logoWidth, logoHeight);
          ctx.globalAlpha = 1;
          canvas.toBlob((blob) => resolve(blob!), "image/png");
        };
        logo.onerror = () => {
          // If logo fails to load, just use the original image
          canvas.toBlob((blob) => resolve(blob!), "image/png");
        };
        logo.src = "/logo.png";
      };
      img.src = URL.createObjectURL(imageBlob);
    });
  }

  async function handleDownload() {
    if (!imageUrl) return;
    posthog.capture("result_downloaded", {
      product_slug: productSlug,
      mode: isAiMode ? "ai" : "specific",
    });
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const watermarked = await addLogoWatermark(blob);
    const url = URL.createObjectURL(watermarked);
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
    posthog.capture("result_shared", {
      product_slug: productSlug,
      mode: isAiMode ? "ai" : "specific",
    });
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const watermarked = await addLogoWatermark(blob);
      const file = new File([watermarked], `delhi-brass-${productSlug}.png`, { type: "image/png" });
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
        <div className="w-12 h-12 border-2 border-gold rounded-full animate-spin mx-auto" style={{ borderTopColor: "transparent" }} />
        <p className="text-sm text-neutral-500 mt-4">Loading result...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors -ml-1"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span className="text-xs tracking-wider uppercase">Back</span>
      </button>

      <div>
        <div className="w-12 h-[1px] bg-gradient-to-r from-gold to-transparent mb-4" />
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
      {isAiMode && allSlugs.length > 1 && (
        <div className="flex gap-2">
          {allSlugs.map((slug, i) => {
            const existing = aiOptions.find((o) => o.slug === slug);
            const isSelected = productSlug === slug;
            const isGenerating = generatingIndex === i;

            return (
              <button
                key={slug}
                disabled={isGenerating}
                onClick={async () => {
                  if (existing) {
                    // Already generated — just switch
                    const idx = aiOptions.indexOf(existing);
                    selectAiOption(idx);
                  } else {
                    // Generate on demand
                    setGeneratingIndex(i);
                    try {
                      const roomPreview = sessionStorage.getItem("roomImagePreview");
                      if (!roomPreview) {
                        alert("Room image expired. Please go back and try again.");
                        return;
                      }
                      const roomBlob = await fetch(roomPreview).then((r) => r.blob());
                      const formData = new FormData();
                      formData.append("roomImage", new File([roomBlob], "room.jpg", { type: "image/jpeg" }));
                      formData.append("productSlug", slug);
                      formData.append("roomType", sessionStorage.getItem("roomType") || "formal_living");
                      formData.append("roomState", sessionStorage.getItem("roomState") || "furnished");
                      const vibe = sessionStorage.getItem("vibe");
                      if (vibe) formData.append("vibe", vibe);

                      const res = await fetch("/api/generate", { method: "POST", body: formData });
                      if (!res.ok) throw new Error("Failed");
                      const blob = await res.blob();
                      const reader = new FileReader();
                      const dataUrl = await new Promise<string>((resolve) => {
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                      });

                      const newOption = { slug, imageUrl: dataUrl };
                      const newOptions = [...aiOptions, newOption];
                      setAiOptions(newOptions);
                      setImageUrl(dataUrl);
                      setProductSlug(slug);
                      setSelectedAiIndex(newOptions.length - 1);

                      // Cache in sessionStorage
                      const count = newOptions.length;
                      sessionStorage.setItem(`aiResultImage_${count - 1}`, dataUrl);
                      sessionStorage.setItem(`aiResultSlug_${count - 1}`, slug);
                      sessionStorage.setItem("aiResultCount", String(count));
                    } catch {
                      alert("Failed to generate this option. Try again.");
                    } finally {
                      setGeneratingIndex(null);
                    }
                  }
                }}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs tracking-wider uppercase border transition-all duration-300 ${
                  isSelected
                    ? "bg-gold text-black border-gold"
                    : isGenerating
                    ? "border-gold/50 text-gold/50 animate-pulse"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                }`}
              >
                {isGenerating ? "..." : `Option ${i + 1}`}
              </button>
            );
          })}
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
          className="bg-gold text-black rounded-xl py-3 text-xs font-medium tracking-wider uppercase hover:bg-gold-light transition-colors"
        >
          Download
        </button>
        <button
          onClick={handleShare}
          className="border border-gold/50 text-gold rounded-xl py-3 text-xs font-medium tracking-wider uppercase hover:bg-gold/10 transition-colors"
        >
          Share
        </button>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={() => {
            posthog.capture("try_another_product_clicked", {
              current_product_slug: productSlug,
              mode: isAiMode ? "ai" : "specific",
            });
            // Keep room + form sticky state — only clear the current result.
            sessionStorage.removeItem("resultImage");
            sessionStorage.removeItem("productSlug");
            router.push("/");
          }}
          className="border border-neutral-700 rounded-md py-3 text-xs tracking-wider uppercase text-neutral-300 hover:border-neutral-500 transition-colors"
        >
          Try a Different Product
        </button>
        <button
          onClick={() => {
            const ok = window.confirm(
              "This will clear your room and start fresh. Continue?",
            );
            if (!ok) return;
            posthog.capture("use_different_room_clicked", {
              product_slug: productSlug,
              mode: isAiMode ? "ai" : "specific",
            });
            // Clear new sticky-room state
            sessionStorage.removeItem("nectar.currentRoomBase64");
            [
              "nectar.lastRoomState",
              "nectar.lastRoomType",
              "nectar.lastVibe",
              "nectar.lastNotes",
              "nectar.lastPreserveFinishes",
              "nectar.lastAddDecor",
              "nectar.lastTimeOfDay",
            ].forEach((k) => localStorage.removeItem(k));
            // Clear legacy/back-compat keys too
            sessionStorage.removeItem("resultImage");
            sessionStorage.removeItem("roomImagePreview");
            sessionStorage.removeItem("roomType");
            sessionStorage.removeItem("roomState");
            sessionStorage.removeItem("vibe");
            router.push("/upload");
          }}
          className="border border-neutral-700 rounded-md py-3 text-xs tracking-wider uppercase text-neutral-300 hover:border-neutral-500 transition-colors"
        >
          Use a Different Room
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
