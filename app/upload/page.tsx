"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { RoomState, RoomType } from "@/lib/types";

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
  {
    value: "furnished",
    label: "Fully Furnished",
    desc: "Room is complete — only add the product",
  },
  {
    value: "under_construction",
    label: "Under Construction",
    desc: "Room is unfinished — add product, keep structure intact",
  },
];

const VIBE_SUGGESTIONS = [
  "Modern Indian",
  "Minimal & elegant",
  "Classical / ornate",
  "Warm & cozy",
  "Contemporary",
  "Rustic",
];

function GeneratingOverlay() {
  const messages = [
    "Analyzing your room...",
    "Matching the product to your space...",
    "Adjusting scale and proportions...",
    "Rendering your visualization...",
    "Almost there...",
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center px-6">
      {/* Pulsing gold ring */}
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 border border-[#c9a84c]/30 rounded-full animate-ping absolute inset-0" />
        <div className="w-16 h-16 border-2 border-[#c9a84c] rounded-full animate-spin" style={{ borderTopColor: 'transparent' }} />
      </div>
      <p className="text-sm font-light tracking-wide text-neutral-200 mt-6 transition-opacity duration-500">
        {messages[msgIndex]}
      </p>
      <p className="text-[11px] text-neutral-600 mt-2 tracking-wider uppercase">
        This usually takes 15-30 seconds
      </p>
    </div>
  );
}

function UploadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productSlug = searchParams.get("product") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType>("formal_living");
  const [roomState, setRoomState] = useState<RoomState>("furnished");
  const [vibe, setVibe] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRoomImage(file);
    setRoomPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomImage || !productSlug) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("roomImage", roomImage);
    formData.append("productSlug", productSlug);
    formData.append("roomType", roomType);
    formData.append("roomState", roomState);
    if (vibe) formData.append("vibe", vibe);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Generation failed");

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      sessionStorage.setItem("resultImage", imageUrl);
      sessionStorage.setItem("productSlug", productSlug);
      router.push("/result");
    } catch {
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (!productSlug) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500">No product selected.</p>
        <a href="/" className="text-[#c9a84c] underline mt-2 inline-block text-sm">
          Go back and choose a product
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      {isSubmitting && <GeneratingOverlay />}

      {/* Selected product */}
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
          <a href="/" className="text-[11px] text-[#c9a84c] tracking-wider uppercase">
            Change product
          </a>
        </div>
      </div>

      {/* Room photo upload */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">
          Upload Room Photo
        </label>
        {roomPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-neutral-800/50">
            <img
              src={roomPreview}
              alt="Room preview"
              className="w-full"
            />
            <button
              type="button"
              onClick={() => {
                setRoomImage(null);
                setRoomPreview(null);
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Room type */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">
          Room Type
        </label>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value as RoomType)}
          className="w-full border border-neutral-800 rounded-xl px-4 py-3 text-sm bg-neutral-900/50 text-neutral-200 focus:border-[#c9a84c]/50 focus:outline-none transition-colors"
        >
          {ROOM_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>
              {rt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Room state */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">
          Room State
        </label>
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
              <input
                type="radio"
                name="roomState"
                value={rs.value}
                checked={roomState === rs.value}
                onChange={(e) => setRoomState(e.target.value as RoomState)}
                className="sr-only"
              />
              <span className="text-sm font-light text-neutral-200">{rs.label}</span>
              <span className="block text-[11px] text-neutral-500 mt-0.5">
                {rs.desc}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Vibe (optional) */}
      <div>
        <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-2">
          Style / Vibe <span className="text-neutral-600">(optional)</span>
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
                vibe === v
                  ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                  : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!roomImage || isSubmitting}
        className="w-full bg-[#c9a84c] text-black rounded-xl py-3.5 text-sm font-medium tracking-wider uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#dfc06b] transition-colors duration-300"
      >
        Visualize in My Room
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
