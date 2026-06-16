"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

import catalogData from "@/data/catalog.json";
import type { ProductCategory, RoomState, RoomType } from "@/lib/types";
import { CatalogModal } from "@/app/components/catalog-modal";
import { GeneratingOverlay } from "@/app/components/generating-overlay";
import { SegmentedControl } from "@/app/components/segmented-control";

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { value: "bar", label: "Bar / Home Bar" },
  { value: "other", label: "Other" },
];

const VIBE_OPTIONS = [
  "Modern Indian",
  "Minimal & elegant",
  "Classical / ornate",
  "Warm & cozy",
  "Contemporary",
  "Rustic",
  "Indian Maximalist",
  "Art Deco",
];

// UI-level room state — maps down to lib/types RoomState (only 2 values today).
type RoomStateUi = "under_construction" | "3d_render" | "furnished";

const ROOM_STATE_CARDS: {
  value: RoomStateUi;
  icon: string;
  label: string;
  desc: string;
}[] = [
  {
    value: "under_construction",
    icon: "🏗",
    label: "Under construction",
    desc: "Bare walls, no furniture",
  },
  {
    value: "3d_render",
    icon: "🖥",
    label: "3D render",
    desc: "Architect's mock-up",
  },
  {
    value: "furnished",
    icon: "🏠",
    label: "Finished real room",
    desc: "Furnished & lived-in",
  },
];

function uiStateToRoomState(ui: RoomStateUi): RoomState {
  // Both under_construction and 3d_render share the same prompt branch today.
  return ui === "furnished" ? "furnished" : "under_construction";
}

type PreserveMode = "auto" | "on" | "off";
type AddDecorMode = "auto" | "on" | "off";
type TimeOfDay = "auto" | "daytime" | "evening" | "night";

const AUTO_ON_OFF: { value: PreserveMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "daytime", label: "Daytime" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEYS = {
  roomState: "nectar.lastRoomState",
  roomType: "nectar.lastRoomType",
  productType: "nectar.lastProductType",
  vibe: "nectar.lastVibe",
  notes: "nectar.lastNotes",
  preserveFinishes: "nectar.lastPreserveFinishes",
  addDecor: "nectar.lastAddDecor",
  timeOfDay: "nectar.lastTimeOfDay",
} as const;

// Product types visible in prod (Delhi Brass + House of Samavar only)
const VISIBLE_BRANDS = new Set(["delhi_brass", "house_of_samavar"]);
const PRODUCT_TYPES: ProductCategory[] = Array.from(
  new Set(
    (catalogData as Array<{ brand: string; category: ProductCategory }>)
      .filter((p) => VISIBLE_BRANDS.has(p.brand))
      .map((p) => p.category),
  ),
).sort();

const SS_ROOM_KEY = "nectar.currentRoomBase64";

function readLs(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLs(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / private-mode errors
  }
}

// ─── Inline icons (SVG, not emoji) ────────────────────────────────────────────

function CameraIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface CatalogEntry {
  slug: string;
  name?: string;
  imagePath?: string;
  brand?: string;
  category?: string;
}

const BRAND_LABELS: Record<string, string> = {
  delhi_brass: "Delhi Brass",
  fig_living: "FIG Living",
  casagold: "CasaGold",
  house_of_samavar: "House of Samavar",
};

function formatTitleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function UploadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productSlug = searchParams.get("product") || "";
  const isAiMode = searchParams.get("mode") === "ai";
  const catalogProduct = (catalogData as CatalogEntry[]).find(
    (p) => p.slug === productSlug,
  );
  const hasProduct = !!productSlug;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [roomStateUi, setRoomStateUi] = useState<RoomStateUi>("furnished");
  const [roomType, setRoomType] = useState<RoomType>("formal_living");
  const [vibe, setVibe] = useState<string>("Modern Indian");
  const [notes, setNotes] = useState<string>("");
  const [preserveFinishes, setPreserveFinishes] = useState<PreserveMode>("auto");
  const [addDecor, setAddDecor] = useState<AddDecorMode>("auto");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("auto");
  const [productType, setProductType] = useState<ProductCategory | null>(null); // null = "Any"
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Auto-open the catalog modal when ?browse=open is in the URL, then strip
  // the param so reloads don't keep reopening it. This is a URL→state sync,
  // the canonical setState-in-effect pattern.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (searchParams.get("browse") === "open") {
      setCatalogOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("browse");
      const qs = params.toString();
      router.replace(qs ? `/upload?${qs}` : "/upload");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams, router]);

  // ── Hydrate from storage on mount ──────────────────────────────────────────
  useEffect(() => {
    // Hydration-from-storage: this is the canonical setState-in-effect pattern.
    /* eslint-disable react-hooks/set-state-in-effect */
    const savedRoomState = readLs(LS_KEYS.roomState) as RoomStateUi | null;
    const savedRoomType = readLs(LS_KEYS.roomType) as RoomType | null;
    const savedProductType = readLs(LS_KEYS.productType) as ProductCategory | "any" | null;
    const savedVibe = readLs(LS_KEYS.vibe);
    const savedNotes = readLs(LS_KEYS.notes);
    const savedPreserve = readLs(LS_KEYS.preserveFinishes) as PreserveMode | null;
    const savedAddDecor = readLs(LS_KEYS.addDecor) as AddDecorMode | null;
    const savedTime = readLs(LS_KEYS.timeOfDay) as TimeOfDay | null;

    if (
      savedRoomState === "under_construction" ||
      savedRoomState === "3d_render" ||
      savedRoomState === "furnished"
    ) {
      setRoomStateUi(savedRoomState);
    }
    if (savedRoomType) setRoomType(savedRoomType);
    if (savedProductType && savedProductType !== "any") setProductType(savedProductType);
    if (savedVibe) setVibe(savedVibe);
    if (savedNotes) setNotes(savedNotes);
    if (savedPreserve) setPreserveFinishes(savedPreserve);
    if (savedAddDecor) setAddDecor(savedAddDecor);
    if (savedTime) setTimeOfDay(savedTime);

    // Hydrate room preview from sessionStorage
    try {
      const base64 = sessionStorage.getItem(SS_ROOM_KEY);
      if (base64) {
        setRoomPreview(base64);
        // Rebuild File object from base64 so we can submit via FormData
        fetch(base64)
          .then((r) => r.blob())
          .then((blob) =>
            setRoomFile(
              new File([blob], "room.jpg", {
                type: blob.type || "image/jpeg",
              }),
            ),
          )
          .catch(() => {
            /* ignore */
          });
      }
    } catch {
      // sessionStorage unavailable
    }

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // ── Debounced sticky writes ────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => writeLs(LS_KEYS.roomState, roomStateUi), 300);
    return () => clearTimeout(t);
  }, [roomStateUi, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => writeLs(LS_KEYS.roomType, roomType), 300);
    return () => clearTimeout(t);
  }, [roomType, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => writeLs(LS_KEYS.vibe, vibe), 300);
    return () => clearTimeout(t);
  }, [vibe, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => writeLs(LS_KEYS.notes, notes), 300);
    return () => clearTimeout(t);
  }, [notes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(
      () => writeLs(LS_KEYS.preserveFinishes, preserveFinishes),
      300,
    );
    return () => clearTimeout(t);
  }, [preserveFinishes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => writeLs(LS_KEYS.addDecor, addDecor), 300);
    return () => clearTimeout(t);
  }, [addDecor, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => writeLs(LS_KEYS.timeOfDay, timeOfDay), 300);
    return () => clearTimeout(t);
  }, [timeOfDay, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(
      () => writeLs(LS_KEYS.productType, productType ?? "any"),
      300,
    );
    return () => clearTimeout(t);
  }, [productType, hydrated]);

  // ── Room upload handling ───────────────────────────────────────────────────
  const persistRoomBase64 = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRoomPreview(dataUrl);
      try {
        sessionStorage.setItem(SS_ROOM_KEY, dataUrl);
      } catch {
        // quota exceeded — keep preview but skip persistence
      }
    };
    reader.readAsDataURL(file);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRoomFile(file);
    persistRoomBase64(file);
    posthog.capture("room_photo_uploaded", {
      mode: isAiMode ? "ai" : "specific",
      product_slug: productSlug || null,
      source: e.target === cameraInputRef.current ? "camera" : "library",
    });
  }

  function handleUseDifferentRoom() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "This will clear your room and start fresh. Continue?",
    );
    if (!ok) return;
    setRoomFile(null);
    setRoomPreview(null);
    try {
      sessionStorage.removeItem(SS_ROOM_KEY);
    } catch {
      // ignore
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const roomState = uiStateToRoomState(roomStateUi);
  const canSubmit = !!roomFile && hydrated && !isSubmitting;

  async function handleSubmitSpecific() {
    if (!roomFile || !productSlug) return;
    setIsSubmitting(true);

    posthog.capture("generate_started", {
      mode: "specific",
      product_slug: productSlug,
      room_type: roomType,
      room_state: roomState,
      room_state_ui: roomStateUi,
      vibe,
      has_notes: !!notes,
      preserve_finishes: preserveFinishes,
      add_decor: addDecor,
      time_of_day: timeOfDay,
    });

    const formData = new FormData();
    formData.append("roomImage", roomFile);
    formData.append("productSlug", productSlug);
    formData.append("roomType", roomType);
    formData.append("roomState", roomState);
    if (vibe) formData.append("vibe", vibe);
    if (notes) formData.append("notes", notes);
    // Stage new control values for when the API consumes them.
    formData.append("preserveFinishes", preserveFinishes);
    formData.append("addDecor", addDecor);
    formData.append("timeOfDay", timeOfDay);

    const distinctId = posthog.get_distinct_id();
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
        headers: { "X-POSTHOG-DISTINCT-ID": distinctId },
      });
      if (!res.ok) throw new Error("Generation failed");
      const blob = await res.blob();

      const blobUrl = URL.createObjectURL(blob);
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        sessionStorage.removeItem("resultImage");
        sessionStorage.setItem("resultImage", dataUrl);
      } catch {
        sessionStorage.setItem("resultImage", blobUrl);
      }

      sessionStorage.setItem("productSlug", productSlug);
      // Keep room sessionStorage payload + back-compat keys for the result page.
      sessionStorage.setItem("roomType", roomType);
      sessionStorage.setItem("roomState", roomState);
      sessionStorage.setItem("vibe", vibe);
      // roomImagePreview is used by result page's on-demand AI option flow.
      if (roomPreview) {
        try {
          sessionStorage.setItem("roomImagePreview", roomPreview);
        } catch {
          // ignore
        }
      }

      posthog.capture("visualization_completed", {
        product_slug: productSlug,
        room_type: roomType,
        room_state: roomState,
        vibe,
      });
      router.push("/result");
    } catch (err) {
      posthog.capture("visualization_failed", {
        mode: "specific",
        product_slug: productSlug,
        room_type: roomType,
      });
      posthog.captureException(err);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleSubmitAi() {
    if (!roomFile) return;
    setIsSubmitting(true);
    setLoadingMessage("Analyzing your room and finding the best products...");

    posthog.capture("generate_started", {
      mode: "ai",
      product_type: productType,
      room_type: roomType,
      room_state: roomState,
      room_state_ui: roomStateUi,
      vibe,
      has_notes: !!notes,
      preserve_finishes: preserveFinishes,
      add_decor: addDecor,
      time_of_day: timeOfDay,
    });

    const distinctId = posthog.get_distinct_id();

    try {
      // Step 1: recommend products
      const recFormData = new FormData();
      recFormData.append("roomImage", roomFile);
      // Use user-selected type; fall back to chandelier when "Any" (null) since
      // /api/recommend still expects a concrete type today.
      recFormData.append("productType", productType ?? "chandelier");
      recFormData.append("roomType", roomType);
      if (vibe) recFormData.append("vibe", vibe);

      const recRes = await fetch("/api/recommend", {
        method: "POST",
        body: recFormData,
        headers: { "X-POSTHOG-DISTINCT-ID": distinctId },
      });
      if (!recRes.ok) throw new Error("Recommendation failed");
      const { slugs } = (await recRes.json()) as { slugs: string[] };

      // Step 2: render the first pick
      setLoadingMessage("Generating visualization...");
      const firstSlug = slugs[0];
      const genFormData = new FormData();
      genFormData.append("roomImage", roomFile);
      genFormData.append("productSlug", firstSlug);
      genFormData.append("roomType", roomType);
      genFormData.append("roomState", roomState);
      if (vibe) genFormData.append("vibe", vibe);
      if (notes) genFormData.append("notes", notes);
      genFormData.append("preserveFinishes", preserveFinishes);
      genFormData.append("addDecor", addDecor);
      genFormData.append("timeOfDay", timeOfDay);

      const genRes = await fetch("/api/generate", {
        method: "POST",
        body: genFormData,
        headers: { "X-POSTHOG-DISTINCT-ID": distinctId },
      });
      if (!genRes.ok) throw new Error("Generation failed");

      const blob = await genRes.blob();
      let imageUrl: string;
      try {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        sessionStorage.removeItem("resultImage");
        sessionStorage.setItem("aiResultImage_0", imageUrl);
      } catch {
        imageUrl = URL.createObjectURL(blob);
        sessionStorage.setItem("aiResultImage_0", imageUrl);
      }

      sessionStorage.setItem("aiResultSlug_0", firstSlug);
      sessionStorage.setItem("aiResultCount", "1");
      sessionStorage.setItem("aiAllSlugs", JSON.stringify(slugs));
      sessionStorage.setItem("roomType", roomType);
      sessionStorage.setItem("roomState", roomState);
      sessionStorage.setItem("vibe", vibe);
      if (roomPreview) {
        try {
          sessionStorage.setItem("roomImagePreview", roomPreview);
        } catch {
          // ignore
        }
      }

      posthog.capture("ai_visualization_completed", {
        room_type: roomType,
        room_state: roomState,
        vibe,
        renders_count: 1,
        recommended_slugs: slugs,
      });
      router.push("/result?mode=ai");
    } catch (err) {
      posthog.capture("visualization_failed", {
        mode: "ai",
        room_type: roomType,
      });
      posthog.captureException(err);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
      setLoadingMessage(undefined);
    }
  }

  function handlePrimaryCta() {
    if (hasProduct) return handleSubmitSpecific();
    if (isAiMode) return handleSubmitAi();
  }

  function handleSwitchToAi() {
    router.replace("/upload?mode=ai");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in-up pb-44">
      {isSubmitting && <GeneratingOverlay message={loadingMessage} />}

      {/* A. Page title — quota indicator inline on the same row */}
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-light tracking-wide text-neutral-200">
            Visualize a decorative light in your room
          </h1>
          <p className="shrink-0 text-[10px] tracking-[0.2em] uppercase text-neutral-500">
            10 renders left
          </p>
        </div>
        <p className="text-sm text-neutral-500 mt-2">
          Upload your room, tell us your style, and pick a product
        </p>
      </div>

      {/* 2-column grid on md+: left = photo, right = form fields */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,420px)_1fr] gap-8 lg:gap-12 items-start">

        {/* ── LEFT COLUMN: room photo ── */}
        <div className="md:sticky md:top-24 space-y-0">

          {/* C. Room photo */}
          <section>
            <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-3">
              Your room
            </label>

            {roomPreview ? (
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-neutral-800/50 bg-neutral-900 md:max-h-[60vh]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={roomPreview}
                    alt="Room preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] tracking-wider uppercase text-gold hover:text-gold-light transition-colors"
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={handleUseDifferentRoom}
                    className="text-[11px] tracking-wider uppercase text-neutral-500 hover:text-neutral-300 transition-colors"
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    Use a different room
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-neutral-700 rounded-xl p-6 sm:p-10 text-center bg-neutral-900/30 transition-colors hover:border-gold/30">
                <CameraIcon className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 rounded-md bg-surface border border-neutral-700 text-neutral-200 text-xs tracking-wider uppercase hover:border-gold/40 transition-colors"
                  >
                    Choose photo
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 rounded-md bg-surface border border-neutral-700 text-neutral-200 text-xs tracking-wider uppercase hover:border-gold/40 transition-colors"
                  >
                    Camera
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 mt-3">
                  JPG, PNG, HEIC · up to 25MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </section>
        </div>

        {/* ── RIGHT COLUMN: form fields ── */}
        <div className="space-y-8">

          {/* AI mode badge (if ?mode=ai) */}
          {isAiMode && !hasProduct && (
            <div className="bg-gradient-to-r from-gold/10 to-transparent rounded-xl border border-gold/20 p-4">
              <div className="flex items-center gap-3">
                <span className="text-gold text-lg">✦</span>
                <div>
                  <p className="text-sm font-light text-neutral-200 tracking-wide">
                    AI Pick
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    We&apos;ll pick the 3 best products for your space
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* D. Room state cards */}
          <section>
            <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-3">
              What kind of photo is this?
            </label>
            <div
              role="radiogroup"
              aria-label="Room state"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {ROOM_STATE_CARDS.map((card) => {
                const isSelected = roomStateUi === card.value;
                return (
                  <button
                    key={card.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setRoomStateUi(card.value)}
                    className={`text-left bg-neutral-900/50 border rounded-xl p-4 transition-all duration-300 ${
                      isSelected
                        ? "border-gold shadow-[0_0_30px_rgba(201,168,76,0.05)]"
                        : "border-neutral-800/50 hover:border-gold/30"
                    }`}
                  >
                    <span className="text-lg block mb-1">{card.icon}</span>
                    <p className="text-sm font-light text-neutral-200 tracking-wide">
                      {card.label}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">{card.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* E. Product type chips */}
          <section>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-3">
              Type
            </label>
            <div
              role="radiogroup"
              aria-label="Product type"
              className="flex flex-wrap gap-2"
            >
              {/* "Any" chip */}
              <button
                type="button"
                role="radio"
                aria-checked={productType === null}
                onClick={() => setProductType(null)}
                className={`px-4 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${
                  productType === null
                    ? "bg-gold text-black border-gold scale-[1.04]"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                }`}
                style={{ minHeight: "44px" }}
              >
                Any
              </button>
              {PRODUCT_TYPES.map((type) => {
                const isSelected = productType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setProductType(type)}
                    className={`px-4 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${
                      isSelected
                        ? "bg-gold text-black border-gold scale-[1.04]"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                    }`}
                    style={{ minHeight: "44px" }}
                  >
                    {type.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </section>

          {/* F. Room type */}
          <section>
            <label
              htmlFor="room-type-select"
              className="block text-xs tracking-wider uppercase text-neutral-400 mb-3"
            >
              Room type
            </label>
            <select
              id="room-type-select"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as RoomType)}
              className="w-full bg-surface border border-neutral-800 rounded-md px-3 h-11 text-sm text-neutral-200 focus:border-gold/50 focus:outline-none transition-colors"
            >
              {ROOM_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </section>

          {/* G. Vibe chips */}
          <section>
            <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-3">
              Vibe
            </label>
            <div
              role="radiogroup"
              aria-label="Vibe"
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {VIBE_OPTIONS.map((v) => {
                const isSelected = vibe === v;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setVibe(v)}
                    className={`px-3 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${
                      isSelected
                        ? "bg-gold text-black border-gold"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </section>

          {/* G. Notes */}
          <section>
            <label
              htmlFor="notes-textarea"
              className="block text-xs tracking-wider uppercase text-neutral-400 mb-2"
            >
              Notes <span className="text-neutral-600 normal-case tracking-normal">(optional)</span>
            </label>
            <p className="text-[11px] text-neutral-500 mb-2">
              e.g. warm tones, no dark wood, keep the painting on the right untouched
            </p>
            <textarea
              id="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-surface border border-neutral-800 rounded-md p-3 min-h-[100px] text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-gold/50 focus:outline-none transition-colors resize-none"
            />
          </section>

          {/* H. Advanced options */}
          <section>
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="flex items-center gap-2 text-xs tracking-wider uppercase text-neutral-400 hover:text-neutral-200 transition-colors"
              style={{ minHeight: "unset", minWidth: "unset" }}
              aria-expanded={advancedOpen}
            >
              <ChevronIcon open={advancedOpen} />
              Advanced options
            </button>

            {advancedOpen && (
              <div className="mt-4 space-y-5 pt-2">
                <div>
                  <p className="text-xs tracking-wider uppercase text-neutral-400 mb-1">
                    Preserve existing finishes
                  </p>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    Lock in your finished walls, flooring, and ceiling work — only treat what&apos;s bare.
                  </p>
                  <SegmentedControl<PreserveMode>
                    value={preserveFinishes}
                    onChange={setPreserveFinishes}
                    options={AUTO_ON_OFF}
                    ariaLabel="Preserve existing finishes"
                  />
                </div>

                <div>
                  <p className="text-xs tracking-wider uppercase text-neutral-400 mb-1">
                    Add movable decor
                  </p>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    Art, plants, runners, vases — we&apos;ll add a few thoughtful touches to fit the vibe.
                  </p>
                  <SegmentedControl<AddDecorMode>
                    value={addDecor}
                    onChange={setAddDecor}
                    options={AUTO_ON_OFF}
                    ariaLabel="Add movable decor"
                  />
                </div>

                <div>
                  <p className="text-xs tracking-wider uppercase text-neutral-400 mb-1">
                    Time of day
                  </p>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    When in the day should the room read as? Auto follows the photo.
                  </p>
                  <SegmentedControl<TimeOfDay>
                    value={timeOfDay}
                    onChange={setTimeOfDay}
                    options={TIME_OPTIONS}
                    ariaLabel="Time of day"
                  />
                </div>
              </div>
            )}
          </section>

          {/* I. Selected product preview (only when ?product=) — sits where the
                  empty-form shows its "Browse catalog / Let AI pick" CTA pair. */}
          {hasProduct && (
            <section>
              <label className="block text-xs tracking-wider uppercase text-neutral-400 mb-3">
                Product
              </label>
              <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-4 flex gap-4">
                <div className="w-24 h-24 relative shrink-0 bg-neutral-900 rounded-xl overflow-hidden">
                  <Image
                    src={
                      catalogProduct?.imagePath ||
                      `https://raw.githubusercontent.com/dikshitakhullar/delhi-brass-website/main/public/images/chandeliers/${productSlug}/studio.png`
                    }
                    alt={catalogProduct?.name || productSlug}
                    fill
                    className="object-contain p-2"
                    sizes="96px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <p className="text-base font-light text-neutral-200 tracking-wide truncate">
                    {catalogProduct?.name || formatTitleCase(productSlug)}
                  </p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1 truncate">
                    {[
                      catalogProduct?.brand
                        ? BRAND_LABELS[catalogProduct.brand] ||
                          formatTitleCase(catalogProduct.brand)
                        : null,
                      catalogProduct?.category
                        ? formatTitleCase(catalogProduct.category)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Link
                    href="/"
                    className="text-xs text-gold hover:text-gold-light mt-3 tracking-wide transition-colors"
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    Change product →
                  </Link>
                </div>
              </div>
            </section>
          )}

        </div>
        {/* ── end RIGHT COLUMN ── */}

      </div>
      {/* ── end 2-column grid ── */}

      {/* J. CTAs — float over a soft gradient fade, sit just above bottom-nav */}
      <div className="fixed bottom-[3.75rem] left-0 right-0 z-30 px-5 pb-2 pt-10 pointer-events-none bg-gradient-to-t from-bg from-30% via-bg/75 to-transparent">
        <div className="max-w-lg mx-auto pointer-events-auto">
          {hasProduct ? (
            <button
              type="button"
              onClick={handlePrimaryCta}
              disabled={!canSubmit}
              className={`w-full bg-gold text-black rounded-2xl py-3.5 text-sm font-medium tracking-wider uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ${
                canSubmit ? "hover:bg-gold-light" : "opacity-40 cursor-not-allowed"
              }`}
            >
              Generate render →
            </button>
          ) : isAiMode ? (
            <button
              type="button"
              onClick={handlePrimaryCta}
              disabled={!canSubmit}
              className={`w-full bg-gold text-black rounded-2xl py-3.5 text-sm font-medium tracking-wider uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ${
                canSubmit ? "hover:bg-gold-light" : "opacity-40 cursor-not-allowed"
              }`}
            >
              Generate AI picks →
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCatalogOpen(true)}
                disabled={!canSubmit}
                className={`flex items-center justify-center bg-surface border border-neutral-700 text-neutral-200 rounded-2xl py-3.5 text-xs font-medium tracking-wider uppercase transition-all duration-300 ${
                  canSubmit ? "hover:border-neutral-500" : "opacity-40 cursor-not-allowed"
                }`}
              >
                📷 Find a product →
              </button>
              <button
                type="button"
                onClick={handleSwitchToAi}
                disabled={!canSubmit}
                className={`bg-gold text-black rounded-2xl py-3.5 text-xs font-medium tracking-wider uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ${
                  canSubmit ? "hover:bg-gold-light" : "opacity-40 cursor-not-allowed"
                }`}
              >
                ✨ Let AI pick →
              </button>
            </div>
          )}
        </div>
      </div>

      <CatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSelect={(slug) => {
          setCatalogOpen(false);
          router.push(`/upload?product=${slug}`);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        initialTypeFilter={productType}
      />
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-16 text-neutral-500">Loading...</div>
      }
    >
      <UploadForm />
    </Suspense>
  );
}
