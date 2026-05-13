"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { RoomState, RoomType, ProductType } from "@/lib/types";

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "formal_living", label: "Formal Living / Drawing Room" },
  { value: "family_lounge", label: "Family Lounge" },
  { value: "dining_room", label: "Dining Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "entrance_lobby", label: "Entrance / Lobby" },
  { value: "mandir", label: "Mandir / Prayer Room" },
  { value: "stairwell", label: "Stairwell / Double Height" },
  { value: "passage", label: "Passage / Corridor" },
  { value: "terrace", label: "Terrace / Patio" },
  { value: "other", label: "Other" },
];

const ROOM_STATES: { value: RoomState; label: string; desc: string }[] = [
  { value: "furnished", label: "Fully Furnished", desc: "We'll seamlessly place the product in the right spot in your room" },
  { value: "under_construction", label: "Under Construction", desc: "We'll place the product and visualize the interiors based on your vibe. Don't want any changes? Just mention it in the notes below." },
];

const VIBE_SUGGESTIONS = ["Modern Indian", "Minimal & elegant", "Classical / ornate", "Warm & cozy", "Contemporary", "Rustic"];

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "chandelier", label: "Chandelier" },
  { value: "pendant", label: "Pendant" },
  { value: "lantern", label: "Lantern" },
  { value: "cluster", label: "Cluster" },
  { value: "hanging_lamp", label: "Hanging Lamp" },
];

function GeneratingOverlay({ message }: { message?: string }) {
  const messages = [
    "Analyzing your room...",
    "Matching the product to your space...",
    "Adjusting scale and proportions...",
    "Rendering your visualization...",
    "Almost there...",
  ];
  const aiMessages = [
    "Analyzing your room...",
    "Finding the best products for your space...",
    "Generating option 1 of 3...",
    "Generating option 2 of 3...",
    "Generating option 3 of 3...",
    "Finishing up...",
  ];
  const activeMessages = message ? aiMessages : messages;
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % activeMessages.length);
    }, message ? 8000 : 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center px-6">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 border border-[#c9a84c]/30 rounded-full animate-ping absolute inset-0" />
        <div className="w-16 h-16 border-2 border-[#c9a84c] rounded-full animate-spin" style={{ borderTopColor: "transparent" }} />
      </div>
      <p className="text-sm font-light tracking-wide text-neutral-200 mt-6">
        {message || activeMessages[msgIndex]}
      </p>
      <p className="text-[11px] text-neutral-600 mt-2 tracking-wider uppercase">
        {message ? "This takes about a minute" : "This usually takes 15-30 seconds"}
      </p>
    </div>
  );
}

function UploadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productSlug = searchParams.get("product") || "";
  const isAiMode = searchParams.get("mode") === "ai";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType>("formal_living");
  const [roomState, setRoomState] = useState<RoomState>("furnished");
  const [vibe, setVibe] = useState("");
  const [notes, setNotes] = useState("");
  const [productType, setProductType] = useState<ProductType>("chandelier");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();

  // Restore room image from sessionStorage if returning
  useEffect(() => {
    const savedPreview = sessionStorage.getItem("roomImagePreview");
    const savedRoomType = sessionStorage.getItem("roomType") as RoomType | null;
    const savedRoomState = sessionStorage.getItem("roomState") as RoomState | null;
    const savedVibe = sessionStorage.getItem("vibe");

    if (savedPreview && !roomPreview) {
      setRoomPreview(savedPreview);
      fetch(savedPreview)
        .then((res) => res.blob())
        .then((blob) => setRoomImage(new File([blob], "room.jpg", { type: "image/jpeg" })));
    }
    if (savedRoomType) setRoomType(savedRoomType);
    if (savedRoomState) setRoomState(savedRoomState);
    if (savedVibe) setVibe(savedVibe);
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRoomImage(file);
    const previewUrl = URL.createObjectURL(file);
    setRoomPreview(previewUrl);
    const reader = new FileReader();
    reader.onload = () => sessionStorage.setItem("roomImagePreview", reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmitSpecific(e: React.FormEvent) {
    e.preventDefault();
    if (!roomImage || !productSlug) return;
    setIsSubmitting(true);
    sessionStorage.setItem("roomType", roomType);
    sessionStorage.setItem("roomState", roomState);
    sessionStorage.setItem("vibe", vibe);

    const formData = new FormData();
    formData.append("roomImage", roomImage);
    formData.append("productSlug", productSlug);
    formData.append("roomType", roomType);
    formData.append("roomState", roomState);
    if (vibe) formData.append("vibe", vibe);
    if (notes) formData.append("notes", notes);

    try {
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Generation failed");
      const blob = await res.blob();
      sessionStorage.setItem("resultImage", URL.createObjectURL(blob));
      sessionStorage.setItem("productSlug", productSlug);
      router.push("/result");
    } catch {
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleSubmitAi(e: React.FormEvent) {
    e.preventDefault();
    if (!roomImage) return;
    setIsSubmitting(true);
    setLoadingMessage("Analyzing your room and finding the best products...");
    sessionStorage.setItem("roomType", roomType);
    sessionStorage.setItem("roomState", roomState);
    sessionStorage.setItem("vibe", vibe);

    try {
      // Step 1: Get AI recommendations
      const recFormData = new FormData();
      recFormData.append("roomImage", roomImage);
      recFormData.append("productType", productType);
      recFormData.append("roomType", roomType);
      if (vibe) recFormData.append("vibe", vibe);

      const recRes = await fetch("/api/recommend", { method: "POST", body: recFormData });
      if (!recRes.ok) throw new Error("Recommendation failed");
      const { slugs } = await recRes.json();

      // Step 2: Generate renders for each recommended product
      const results: { slug: string; imageUrl: string }[] = [];
      for (let i = 0; i < slugs.length; i++) {
        setLoadingMessage(`Generating option ${i + 1} of ${slugs.length}...`);
        const genFormData = new FormData();
        genFormData.append("roomImage", roomImage);
        genFormData.append("productSlug", slugs[i]);
        genFormData.append("roomType", roomType);
        genFormData.append("roomState", roomState);
        if (vibe) genFormData.append("vibe", vibe);
        if (notes) genFormData.append("notes", notes);

        const genRes = await fetch("/api/generate", { method: "POST", body: genFormData });
        if (genRes.ok) {
          const blob = await genRes.blob();
          results.push({ slug: slugs[i], imageUrl: URL.createObjectURL(blob) });
        }
      }

      if (results.length === 0) throw new Error("No renders generated");

      // Store all results
      sessionStorage.setItem("aiResults", JSON.stringify(results.map((r) => r.slug)));
      results.forEach((r, i) => {
        sessionStorage.setItem(`aiResultImage_${i}`, r.imageUrl);
        sessionStorage.setItem(`aiResultSlug_${i}`, r.slug);
      });
      sessionStorage.setItem("aiResultCount", String(results.length));
      router.push("/result?mode=ai");
    } catch {
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
      setLoadingMessage(undefined);
    }
  }

  if (!productSlug && !isAiMode) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500">No product selected.</p>
        <a href="/" className="text-[#c9a84c] underline mt-2 inline-block text-sm">Go back and choose a product</a>
      </div>
    );
  }

  return (
    <form onSubmit={isAiMode ? handleSubmitAi : handleSubmitSpecific} className="space-y-6 animate-fade-in-up">
      {isSubmitting && <GeneratingOverlay message={loadingMessage} />}

      {/* Mode indicator */}
      {isAiMode ? (
        <div className="bg-gradient-to-r from-[#c9a84c]/10 to-transparent rounded-xl border border-[#c9a84c]/20 p-4">
          <div className="flex items-center gap-3">
            <span className="text-[#c9a84c] text-lg">✦</span>
            <div>
              <p className="text-sm font-light text-neutral-200 tracking-wide">AI-Powered Selection</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">We&apos;ll pick the 3 best products for your space</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 bg-neutral-900/50 rounded-xl border border-neutral-800/50 p-3">
          <div className="w-16 h-16 relative shrink-0 bg-neutral-900 rounded-lg overflow-hidden">
            <Image
              src={`https://raw.githubusercontent.com/dikshitakhullar/delhi-brass-website/main/public/images/chandeliers/${productSlug}/studio.png`}
              alt={productSlug}
              fill
              className="object-contain p-1"
              sizes="64px"
              unoptimized
            />
          </div>
          <div>
            <p className="font-light text-sm text-neutral-200 tracking-wide">
              {productSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <a href="/" className="text-[11px] text-[#c9a84c] tracking-wider uppercase">Change product</a>
          </div>
        </div>
      )}

      {/* Product type picker (AI mode only) */}
      {isAiMode && (
        <div>
          <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">Product Type</label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setProductType(pt.value)}
                className={`px-4 py-2 rounded-xl text-xs tracking-wider uppercase border transition-all duration-300 ${
                  productType === pt.value
                    ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room photo upload */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">Upload Room Photo</label>
        {roomPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-neutral-800/50">
            <img src={roomPreview} alt="Room preview" className="w-full" />
            <button
              type="button"
              onClick={() => {
                setRoomImage(null);
                setRoomPreview(null);
                sessionStorage.removeItem("roomImagePreview");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-neutral-300 rounded-full w-8 h-8 flex items-center justify-center text-sm border border-neutral-700/50 hover:border-neutral-500 transition-colors"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-neutral-700 rounded-xl p-10 text-center text-neutral-500 hover:border-[#c9a84c]/50 hover:text-[#c9a84c]/70 transition-all duration-300 bg-neutral-900/30"
          >
            <span className="block text-3xl mb-2 font-extralight">+</span>
            <span className="text-xs tracking-wider uppercase">Tap to upload or take a photo</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
      </div>

      {/* Room type */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">Room Type</label>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value as RoomType)}
          className="w-full border border-neutral-800 rounded-xl px-4 py-3 text-sm bg-neutral-900/50 text-neutral-200 focus:border-[#c9a84c]/50 focus:outline-none transition-colors"
        >
          {ROOM_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>{rt.label}</option>
          ))}
        </select>
      </div>

      {/* Room state */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">Room State</label>
        <div className="space-y-2">
          {ROOM_STATES.map((rs) => (
            <label
              key={rs.value}
              className={`block border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                roomState === rs.value
                  ? "border-[#c9a84c]/50 bg-[#c9a84c]/5"
                  : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700"
              }`}
            >
              <input type="radio" name="roomState" value={rs.value} checked={roomState === rs.value} onChange={(e) => setRoomState(e.target.value as RoomState)} className="sr-only" />
              <span className="text-sm font-light text-neutral-200">{rs.label}</span>
              <span className="block text-[11px] text-neutral-500 mt-0.5">{rs.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Vibe */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">
          Style / Vibe {isAiMode ? "" : <span className="text-neutral-600">(optional)</span>}
        </label>
        <input
          type="text"
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="e.g. modern Indian, minimal, warm and cozy"
          className="w-full border border-neutral-800 rounded-xl px-4 py-3 text-sm bg-neutral-900/50 text-neutral-200 placeholder:text-neutral-600 focus:border-[#c9a84c]/50 focus:outline-none transition-colors"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {VIBE_SUGGESTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVibe(v)}
              className={`px-3 py-1.5 rounded-full text-[11px] tracking-wider uppercase border transition-all duration-300 ${
                vibe === v ? "bg-[#c9a84c] text-black border-[#c9a84c]" : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">
          Additional Notes <span className="text-neutral-600">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. place the light on the left side, change the flooring to wood, don't add curtains..."
          rows={3}
          className="w-full border border-neutral-800 rounded-xl px-4 py-3 text-sm bg-neutral-900/50 text-neutral-200 placeholder:text-neutral-600 focus:border-[#c9a84c]/50 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!roomImage || isSubmitting}
        className="w-full bg-[#c9a84c] text-black rounded-xl py-3.5 text-sm font-medium tracking-wider uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#dfc06b] transition-colors duration-300"
      >
        {isAiMode ? "Find Best Products & Visualize" : "Visualize in My Room"}
      </button>
    </form>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-neutral-500">Loading...</div>}>
      <UploadForm />
    </Suspense>
  );
}
