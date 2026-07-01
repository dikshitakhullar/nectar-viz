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
import { SignInModal } from "@/app/components/sign-in-modal";
import { useAuth } from "@/app/components/auth-provider";
import { hasQuotaRemaining, isProfileComplete, incrementGenerationsUsed, FREE_QUOTA } from "@/lib/user-profile";
import { saveGeneration } from "@/lib/generations";
import { downscaleImage } from "@/lib/downscale-image";

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

type RoomStateUi = "under_construction" | "3d_render" | "furnished";

const ROOM_STATE_CARDS: {
  value: RoomStateUi;
  icon: string;
  label: string;
  desc: string;
}[] = [
  { value: "under_construction", icon: "🏗", label: "Under construction", desc: "Bare walls, no furniture" },
  { value: "3d_render", icon: "🖥", label: "3D render", desc: "Architect's mock-up" },
  { value: "furnished", icon: "🏠", label: "Finished real room", desc: "Furnished & lived-in" },
];

function uiStateToRoomState(ui: RoomStateUi): RoomState {
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
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeLs(key: string, value: string) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

// ─── Visual primitives (local) ────────────────────────────────────────────────

function FormLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-[11px] tracking-[0.08em] uppercase text-text-secondary mb-3"
    >
      {children}
    </label>
  );
}

function Divider() {
  return <div className="h-px bg-line" />;
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full border font-sans text-[13px] transition-colors duration-150 ${
        selected
          ? "border-gold bg-gold/14 text-gold-bright font-medium"
          : "border-line text-text-secondary hover:border-white/20 hover:text-text-primary"
      }`}
      style={{ minHeight: "unset", minWidth: "unset" }}
    >
      {children}
    </button>
  );
}

function SubLabeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-text-tertiary mb-2">{label}</div>
      {children}
    </div>
  );
}

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

// Build a detailed error from a non-OK API response: status + response body.
async function describeFailedResponse(res: Response, label: string): Promise<string> {
  let body = "";
  try {
    body = (await res.text()).trim();
  } catch {
    // ignore — body may be unavailable
  }
  return `${label} (HTTP ${res.status})${body ? ": " + body.slice(0, 300) : ""}`;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || err.name;
  return String(err);
}

// ─── Main form ────────────────────────────────────────────────────────────────

function UploadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productSlug = searchParams.get("product") || "";
  const catalogProduct = (catalogData as CatalogEntry[]).find((p) => p.slug === productSlug);
  const hasProduct = !!productSlug;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [roomStateUi, setRoomStateUi] = useState<RoomStateUi>("furnished");
  const [roomType, setRoomType] = useState<RoomType>("formal_living");
  const [vibe, setVibe] = useState<string>("Modern Indian");
  const [notes, setNotes] = useState<string>("");
  const [preserveFinishes, setPreserveFinishes] = useState<PreserveMode>("auto");
  const [addDecor, setAddDecor] = useState<AddDecorMode>("auto");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("auto");
  const [productType, setProductType] = useState<ProductCategory | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Auth gating: when an unauthenticated user clicks a CTA, open the sign-in
  // modal and remember which action to run on completion.
  const { user, profile, refreshProfile } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"catalog" | "ai" | "specific" | null>(null);

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

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const savedRoomState = readLs(LS_KEYS.roomState) as RoomStateUi | null;
    const savedRoomType = readLs(LS_KEYS.roomType) as RoomType | null;
    // productType intentionally NOT hydrated — always defaults to "All" on each visit
    const savedVibe = readLs(LS_KEYS.vibe);
    const savedNotes = readLs(LS_KEYS.notes);
    const savedPreserve = readLs(LS_KEYS.preserveFinishes) as PreserveMode | null;
    const savedAddDecor = readLs(LS_KEYS.addDecor) as AddDecorMode | null;
    const savedTime = readLs(LS_KEYS.timeOfDay) as TimeOfDay | null;

    if (savedRoomState === "under_construction" || savedRoomState === "3d_render" || savedRoomState === "furnished") {
      setRoomStateUi(savedRoomState);
    }
    if (savedRoomType) setRoomType(savedRoomType);
    if (savedVibe) setVibe(savedVibe);
    if (savedNotes) setNotes(savedNotes);
    if (savedPreserve) setPreserveFinishes(savedPreserve);
    if (savedAddDecor) setAddDecor(savedAddDecor);
    if (savedTime) setTimeOfDay(savedTime);

    try {
      const base64 = sessionStorage.getItem(SS_ROOM_KEY);
      if (base64) {
        setRoomPreview(base64);
        fetch(base64)
          .then((r) => r.blob())
          .then((blob) => setRoomFile(new File([blob], "room.jpg", { type: blob.type || "image/jpeg" })))
          .catch(() => {});
      }
    } catch {}

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.roomState, roomStateUi), 300); return () => clearTimeout(t); }, [roomStateUi, hydrated]);
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.roomType, roomType), 300); return () => clearTimeout(t); }, [roomType, hydrated]);
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.vibe, vibe), 300); return () => clearTimeout(t); }, [vibe, hydrated]);
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.notes, notes), 300); return () => clearTimeout(t); }, [notes, hydrated]);
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.preserveFinishes, preserveFinishes), 300); return () => clearTimeout(t); }, [preserveFinishes, hydrated]);
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.addDecor, addDecor), 300); return () => clearTimeout(t); }, [addDecor, hydrated]);
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.timeOfDay, timeOfDay), 300); return () => clearTimeout(t); }, [timeOfDay, hydrated]);
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => writeLs(LS_KEYS.productType, productType ?? "any"), 300); return () => clearTimeout(t); }, [productType, hydrated]);

  const persistRoomBase64 = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRoomPreview(dataUrl);
      try { sessionStorage.setItem(SS_ROOM_KEY, dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const source = e.target === cameraInputRef.current ? "camera" : "library";
    // Compress + JPEG-encode before upload: keeps the request under Vercel's
    // ~4.5MB body limit (HTTP 413) and makes HEIC previewable.
    const processed = await downscaleImage(file);
    setRoomFile(processed);
    persistRoomBase64(processed);
    posthog.capture("room_photo_uploaded", {
      mode: hasProduct ? "specific" : "browse",
      product_slug: productSlug || null,
      source,
      original_type: file.type,
      original_size: file.size,
      processed_size: processed.size,
    });
  }

  function handleUseDifferentRoom() {
    if (typeof window === "undefined") return;
    const ok = window.confirm("This will clear your room and start fresh. Continue?");
    if (!ok) return;
    setRoomFile(null);
    setRoomPreview(null);
    try { sessionStorage.removeItem(SS_ROOM_KEY); } catch {}
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  const roomState = uiStateToRoomState(roomStateUi);
  const canSubmit = !!roomFile && hydrated && !isSubmitting;

  async function handleSubmitSpecific() {
    if (!roomFile || !productSlug) return;
    setIsSubmitting(true);
    posthog.capture("generate_started", { mode: "specific", product_slug: productSlug, room_type: roomType, room_state: roomState, room_state_ui: roomStateUi, vibe, has_notes: !!notes, preserve_finishes: preserveFinishes, add_decor: addDecor, time_of_day: timeOfDay });

    const formData = new FormData();
    formData.append("roomImage", roomFile);
    formData.append("productSlug", productSlug);
    formData.append("roomType", roomType);
    formData.append("roomState", roomState);
    if (vibe) formData.append("vibe", vibe);
    if (notes) formData.append("notes", notes);
    formData.append("preserveFinishes", preserveFinishes);
    formData.append("addDecor", addDecor);
    formData.append("timeOfDay", timeOfDay);

    const distinctId = posthog.get_distinct_id();
    try {
      const res = await fetch("/api/generate", { method: "POST", body: formData, headers: { "X-POSTHOG-DISTINCT-ID": distinctId } });
      if (!res.ok) throw new Error(await describeFailedResponse(res, "Generation failed"));
      const roomBlobUrl = res.headers.get("X-Room-Blob-Url") || "";
      const outputBlobUrl = res.headers.get("X-Output-Blob-Url") || "";
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => { reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob); });
        sessionStorage.removeItem("resultImage");
        sessionStorage.setItem("resultImage", dataUrl);
      } catch { sessionStorage.setItem("resultImage", blobUrl); }
      sessionStorage.setItem("productSlug", productSlug);
      sessionStorage.setItem("roomType", roomType);
      sessionStorage.setItem("roomState", roomState);
      sessionStorage.setItem("vibe", vibe);
      if (roomPreview) { try { sessionStorage.setItem("roomImagePreview", roomPreview); } catch {} }

      // Persist saved-render doc to Firestore + bump quota counter.
      // Counter increments regardless of Blob upload success — image URL may be
      // empty if Blob is misconfigured; we still record the render + count.
      console.log("[save] specific:", { hasUser: !!user, roomBlobUrl, outputBlobUrl });
      if (user) {
        try {
          const genId = await saveGeneration({
            userId: user.uid,
            mode: "specific",
            productSlug,
            productName: catalogProduct?.name ?? null,
            productImage: catalogProduct?.imagePath ?? null,
            roomType,
            roomState,
            vibe,
            notes,
            roomImageUrl: roomBlobUrl,
            resultImageUrl: outputBlobUrl,
          });
          console.log("[save] saved generation", genId);
          await incrementGenerationsUsed(user.uid);
          console.log("[save] incremented quota");
          await refreshProfile();
          console.log("[save] refreshed profile");
        } catch (e) {
          console.error("[save] FAILED:", e);
        }
      }

      posthog.capture("visualization_completed", { product_slug: productSlug, room_type: roomType, room_state: roomState, vibe });
      router.push("/result");
    } catch (err) {
      const msg = errorMessage(err);
      posthog.capture("visualization_failed", { mode: "specific", product_slug: productSlug, room_type: roomType, error_message: msg, room_file_type: roomFile?.type || null, room_file_size: roomFile?.size ?? null });
      posthog.captureException(err);
      alert(`Something went wrong:\n\n${msg}`);
      setIsSubmitting(false);
    }
  }

  async function handleSubmitAi() {
    if (!roomFile) return;
    setIsSubmitting(true);
    setLoadingMessage("Analyzing your room and finding the best products...");
    posthog.capture("generate_started", { mode: "ai", product_type: productType, room_type: roomType, room_state: roomState, room_state_ui: roomStateUi, vibe, has_notes: !!notes, preserve_finishes: preserveFinishes, add_decor: addDecor, time_of_day: timeOfDay });
    const distinctId = posthog.get_distinct_id();

    try {
      const recFormData = new FormData();
      recFormData.append("roomImage", roomFile);
      recFormData.append("productType", productType ?? "chandelier");
      recFormData.append("roomType", roomType);
      if (vibe) recFormData.append("vibe", vibe);

      const recRes = await fetch("/api/recommend", { method: "POST", body: recFormData, headers: { "X-POSTHOG-DISTINCT-ID": distinctId } });
      if (!recRes.ok) throw new Error(await describeFailedResponse(recRes, "Recommendation failed"));
      const { slugs } = (await recRes.json()) as { slugs: string[] };

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

      const genRes = await fetch("/api/generate", { method: "POST", body: genFormData, headers: { "X-POSTHOG-DISTINCT-ID": distinctId } });
      if (!genRes.ok) throw new Error(await describeFailedResponse(genRes, "Generation failed"));
      const roomBlobUrl = genRes.headers.get("X-Room-Blob-Url") || "";
      const outputBlobUrl = genRes.headers.get("X-Output-Blob-Url") || "";

      const blob = await genRes.blob();
      let imageUrl: string;
      try {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve, reject) => { reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob); });
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
      if (roomPreview) { try { sessionStorage.setItem("roomImagePreview", roomPreview); } catch {} }

      // Persist saved-render doc to Firestore + bump quota counter.
      // Counter increments regardless of Blob upload success.
      console.log("[save] ai:", { hasUser: !!user, roomBlobUrl, outputBlobUrl });
      if (user) {
        try {
          const genId = await saveGeneration({
            userId: user.uid,
            mode: "ai",
            productSlug: firstSlug,
            roomType,
            roomState,
            vibe,
            notes,
            roomImageUrl: roomBlobUrl,
            resultImageUrl: outputBlobUrl,
            recommendedSlugs: slugs,
          });
          console.log("[save] saved generation", genId);
          await incrementGenerationsUsed(user.uid);
          console.log("[save] incremented quota");
          await refreshProfile();
          console.log("[save] refreshed profile");
        } catch (e) {
          console.error("[save] FAILED:", e);
        }
      }

      posthog.capture("ai_visualization_completed", { room_type: roomType, room_state: roomState, vibe, renders_count: 1, recommended_slugs: slugs });
      router.push("/result?mode=ai");
    } catch (err) {
      const msg = errorMessage(err);
      posthog.capture("visualization_failed", { mode: "ai", room_type: roomType, error_message: msg, room_file_type: roomFile?.type || null, room_file_size: roomFile?.size ?? null });
      posthog.captureException(err);
      alert(`Something went wrong:\n\n${msg}`);
      setIsSubmitting(false);
      setLoadingMessage(undefined);
    }
  }

  // ─── Auth-gated CTA wrappers ──────────────────────────────────────────────
  // If unauthenticated OR profile is incomplete, open sign-in modal and stash
  // the intended action — fire it on modal `onComplete`.
  function requireAuth(action: "catalog" | "ai" | "specific") {
    if (!user || !isProfileComplete(profile)) {
      setPendingAction(action);
      setSignInOpen(true);
      return;
    }
    if (!hasQuotaRemaining(profile)) {
      alert(
        "You've used all 10 free renders. Subscription coming soon — drop your email and we'll let you know.",
      );
      return;
    }
    runAction(action);
  }

  function runAction(action: "catalog" | "ai" | "specific") {
    if (action === "catalog") setCatalogOpen(true);
    else if (action === "ai") void handleSubmitAi();
    else if (action === "specific") void handleSubmitSpecific();
  }

  function handleSignInComplete() {
    const a = pendingAction;
    setPendingAction(null);
    if (!a) return;
    // Use a microtask so React has applied auth state updates before action runs.
    setTimeout(() => runAction(a), 0);
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="pb-[calc(var(--chrome-bottomnav-h)+1rem)] md:pb-0">
      {isSubmitting && <GeneratingOverlay message={loadingMessage} />}

      {/* On md+: fixed split-pane filling viewport between header and CTA bar.
          On mobile: static, content flows with page scroll. */}
      <div
        className="md:fixed md:left-0 md:right-0 md:flex md:flex-col md:overflow-hidden"
        style={{
          top: "var(--chrome-header-h)",
          bottom: "var(--chrome-bottomnav-h)",
        }}
      >
        <div className="md:max-w-3xl lg:max-w-5xl xl:max-w-6xl md:w-full md:mx-auto md:px-10 md:pt-6 md:pb-4 md:flex md:flex-col md:flex-1 md:overflow-hidden">
          {/* Title — frozen at top of split pane */}
          <div className="md:shrink-0">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="font-sans font-medium text-[22px] md:text-[28px] leading-tight tracking-[-0.005em] text-text-primary">
                Visualize a decorative light in your room
              </h1>
              <p className="shrink-0 font-mono text-[11px] tracking-[0.16em] uppercase text-text-tertiary">
                {profile?.plan === "member"
                  ? "Member"
                  : `${Math.max(0, FREE_QUOTA - (profile?.generationsUsed ?? 0))} of ${FREE_QUOTA} renders left`}
              </p>
            </div>
            <p className="font-sans text-[13px] text-text-secondary mt-2">
              Upload your room, tell us your style, and pick a product
            </p>
          </div>

          {/* 2-col grid: left=photo (frozen), right=form (scrolls on md+) */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-8 md:gap-10 lg:gap-12 items-start mt-5 md:mt-6 md:flex-1 md:min-h-0">

            {/* LEFT — photo */}
            <div className="md:h-full md:overflow-hidden flex flex-col">
              <FormLabel>Your room</FormLabel>
              {roomPreview ? (
                <div className="flex flex-col gap-3 md:flex-1 md:min-h-0">
                  <div className="rounded-md overflow-hidden border border-line bg-surface-2 md:flex-1 md:min-h-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={roomPreview}
                      alt="Room preview"
                      className="block max-w-full max-h-[60vh] md:max-h-full w-auto h-auto object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 shrink-0">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="font-mono text-[11px] tracking-[0.08em] uppercase text-gold hover:text-gold-bright transition-colors duration-150" style={{ minHeight: "unset", minWidth: "unset" }}>
                      Change photo
                    </button>
                    <button type="button" onClick={handleUseDifferentRoom} className="font-mono text-[11px] tracking-[0.08em] uppercase text-text-tertiary hover:text-red-400 transition-colors duration-150" style={{ minHeight: "unset", minWidth: "unset" }}>
                      Start over
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full md:aspect-[4/5] min-h-[260px] flex flex-col items-center justify-center gap-4 bg-surface-1 border border-dashed rounded-md hover:border-gold/40 transition-colors duration-200 p-6"
                  style={{ borderColor: "rgb(255 255 255 / 0.16)", borderWidth: "1.5px" }}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6f695d" strokeWidth={1.5}>
                    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                    <circle cx="8.5" cy="10" r="1.5" />
                    <path d="m3 17 5-4 4 3 3.5-3 5.5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-11 px-5 rounded-sm bg-surface-2 border border-line text-text-primary font-sans text-[13px] hover:border-gold/40 transition-colors duration-150" style={{ minHeight: "unset", minWidth: "unset" }}>
                      Choose photo
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="h-11 px-5 rounded-sm bg-surface-2 border border-line text-text-primary font-sans text-[13px] hover:border-gold/40 transition-colors duration-150 inline-flex items-center gap-2" style={{ minHeight: "unset", minWidth: "unset" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.315z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                      Camera
                    </button>
                  </div>
                  <p className="font-mono text-[11px] tracking-[0.06em] text-text-tertiary">JPG · PNG · HEIC · up to 25MB</p>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            </div>

            {/* RIGHT — form (scrolls on md+) */}
            <div className="space-y-7 md:space-y-8 md:h-full md:overflow-y-auto md:pr-4 md:-mr-4">
              {/* ROOM STATE */}
              <section>
                <FormLabel>What kind of photo is this?</FormLabel>
                <div role="radiogroup" aria-label="Room state" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ROOM_STATE_CARDS.map((card) => {
                    const isSelected = roomStateUi === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setRoomStateUi(card.value)}
                        className={`text-left bg-surface-2 border rounded-md p-4 transition-all duration-150 ${isSelected ? "border-gold/40 bg-surface-3" : "border-line hover:border-gold/20"}`}
                        style={{ minHeight: "unset", minWidth: "unset" }}
                      >
                        <span className="text-lg block mb-1.5">{card.icon}</span>
                        <p className="font-sans text-[14px] font-medium text-text-primary leading-tight">{card.label}</p>
                        <p className="font-sans text-[12px] text-text-secondary mt-1 leading-snug">{card.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <Divider />

              {/* PRODUCT TYPE */}
              <section>
                <FormLabel>Product type</FormLabel>
                <div className="relative">
                  <div role="radiogroup" aria-label="Product type" className="flex gap-2 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide overscroll-x-contain touch-pan-x">
                    <Chip selected={productType === null} onClick={() => setProductType(null)}>All</Chip>
                    {PRODUCT_TYPES.map((type) => (
                      <Chip key={type} selected={productType === type} onClick={() => setProductType(type)}>
                        {type.replace(/_/g, " ")}
                      </Chip>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-bg to-transparent" />
                </div>
              </section>

              <Divider />

              {/* ROOM TYPE */}
              <section>
                <FormLabel htmlFor="room-type-select">Room type</FormLabel>
                <select
                  id="room-type-select"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as RoomType)}
                  className="w-full h-12 px-4 bg-surface-2 border border-line rounded-sm font-sans text-[14px] text-text-primary focus:outline-none focus:border-gold/40 transition-colors duration-150"
                >
                  {ROOM_TYPES.map((rt) => (<option key={rt.value} value={rt.value}>{rt.label}</option>))}
                </select>
              </section>

              <Divider />

              {/* VIBE — horizontal scroll, matches product type */}
              <section>
                <FormLabel>Vibe</FormLabel>
                <div className="relative">
                  <div role="radiogroup" aria-label="Vibe" className="flex gap-2 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide overscroll-x-contain touch-pan-x">
                    {VIBE_OPTIONS.map((v) => (
                      <Chip key={v} selected={vibe === v} onClick={() => setVibe(v)}>{v}</Chip>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-bg to-transparent" />
                </div>
              </section>

              <Divider />

              {/* NOTES */}
              <section>
                <FormLabel htmlFor="notes-textarea">
                  Notes <span className="normal-case tracking-normal text-text-tertiary">· optional</span>
                </FormLabel>
                <textarea
                  id="notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. keep it low over the table…"
                  rows={3}
                  className="w-full min-h-[72px] px-4 py-3 bg-surface-2 border border-line rounded-sm font-sans text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold/40 transition-colors duration-150 resize-y"
                />
              </section>

              {/* ADVANCED CONTROLS */}
              <section>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((o) => !o)}
                  className="font-mono text-[12px] tracking-[0.08em] uppercase text-gold hover:text-gold-bright transition-colors duration-150 flex items-center gap-2"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  Advanced controls
                  <span className={`transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}>▾</span>
                </button>
                {advancedOpen && (
                  <div className="mt-5 space-y-5">
                    <SubLabeled label="Preserve finishes">
                      <SegmentedControl value={preserveFinishes} onChange={setPreserveFinishes} options={AUTO_ON_OFF} ariaLabel="Preserve finishes" />
                    </SubLabeled>
                    <SubLabeled label="Add decor">
                      <SegmentedControl value={addDecor} onChange={setAddDecor} options={AUTO_ON_OFF} ariaLabel="Add decor" />
                    </SubLabeled>
                    <SubLabeled label="Time of day">
                      <SegmentedControl value={timeOfDay} onChange={setTimeOfDay} options={TIME_OPTIONS} ariaLabel="Time of day" />
                    </SubLabeled>
                  </div>
                )}
              </section>

              {/* SELECTED PRODUCT */}
              {hasProduct && (
                <>
                  <Divider />
                  <section>
                    <FormLabel>Product</FormLabel>
                    <div className="bg-surface-2 border border-line rounded-md p-4 flex gap-4">
                      <div className="w-20 h-20 relative shrink-0 bg-surface-1 rounded-sm overflow-hidden">
                        <Image
                          src={catalogProduct?.imagePath || `https://raw.githubusercontent.com/dikshitakhullar/delhi-brass-website/main/public/images/chandeliers/${productSlug}/studio.png`}
                          alt={catalogProduct?.name || productSlug}
                          fill
                          className="object-contain p-1.5"
                          sizes="80px"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col">
                        <p className="font-sans text-[15px] font-medium text-text-primary truncate">
                          {catalogProduct?.name || formatTitleCase(productSlug)}
                        </p>
                        <p className="font-mono text-[11px] tracking-[0.06em] uppercase text-text-tertiary mt-1 truncate">
                          {[
                            catalogProduct?.brand ? BRAND_LABELS[catalogProduct.brand] || formatTitleCase(catalogProduct.brand) : null,
                            catalogProduct?.category ? formatTitleCase(catalogProduct.category) : null,
                          ].filter(Boolean).join(" · ")}
                        </p>
                        <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-gold hover:text-gold-bright mt-3 transition-colors duration-150" style={{ minHeight: "unset", minWidth: "unset" }}>
                          Change product →
                        </Link>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* CTAs — inline at the end of the form */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                {hasProduct ? (
                  <button
                    type="button"
                    onClick={() => requireAuth("specific")}
                    disabled={!canSubmit}
                    className={`h-12 px-7 rounded-sm font-sans font-semibold text-[14px] transition-colors duration-150 ${
                      canSubmit ? "bg-gold text-on-gold hover:bg-gold-bright" : "bg-gold/16 text-text-tertiary cursor-not-allowed"
                    }`}
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    Generate render →
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => requireAuth("ai")}
                      disabled={!canSubmit}
                      className={`h-12 px-6 rounded-sm border font-sans font-medium text-[14px] transition-colors duration-150 ${
                        canSubmit ? "bg-surface-2 border-white/14 text-text-primary hover:bg-surface-3 hover:border-gold/40" : "bg-surface-1 border-line text-text-tertiary cursor-not-allowed"
                      }`}
                      style={{ minHeight: "unset", minWidth: "unset" }}
                    >
                      Let AI pick
                    </button>
                    <button
                      type="button"
                      onClick={() => requireAuth("catalog")}
                      className="h-12 px-7 rounded-sm bg-gold text-on-gold hover:bg-gold-bright font-sans font-semibold text-[14px] transition-colors duration-150"
                      style={{ minHeight: "unset", minWidth: "unset" }}
                    >
                      Find a product
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* close right form */}
          </div>
          {/* close 2-col grid */}
        </div>
        {/* close inner max-w container */}
      </div>
      {/* close split-pane wrapper */}

      <SignInModal
        open={signInOpen}
        onClose={() => {
          setSignInOpen(false);
          setPendingAction(null);
        }}
        onComplete={handleSignInComplete}
      />

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
    <Suspense fallback={<div className="text-center py-16 text-text-tertiary">Loading...</div>}>
      <UploadForm />
    </Suspense>
  );
}
