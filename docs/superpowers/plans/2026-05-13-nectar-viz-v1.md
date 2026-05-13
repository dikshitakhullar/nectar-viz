# Nectar Viz V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A mobile-first web app where Delhi Brass showroom customers pick a product, upload a room photo, and get an AI-rendered image of that product in their room.

**Architecture:** Next.js 14 App Router with server-side Gemini Pro Image API calls. Product catalog stored as a static JSON file. No database, no auth. Three-page flow: product grid → upload + room details → result.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Google Generative AI SDK (@google/generative-ai), Vercel deployment.

---

## File Structure

```
nectar-viz/
├── app/
│   ├── layout.tsx                  # Root layout — mobile-first, app shell
│   ├── page.tsx                    # Step 1: Product selection grid
│   ├── upload/
│   │   └── page.tsx                # Step 2: Room photo upload + room details form
│   ├── result/
│   │   └── page.tsx                # Step 4: Result display with download/share
│   ├── api/
│   │   └── generate/
│   │       └── route.ts            # POST endpoint: takes inputs, calls Gemini, returns image
│   └── globals.css                 # Tailwind base styles
├── lib/
│   ├── catalog.ts                  # Load and filter catalog data
│   ├── generate-prompt.ts          # Build the generation prompt from all inputs
│   └── types.ts                    # Shared TypeScript types
├── data/
│   └── catalog.json                # Product catalog (built from delhi brass data)
├── public/
│   └── products/                   # White-bg studio shots for each product
├── scripts/
│   └── build-catalog.ts            # One-time script: builds catalog.json + copies product images
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local                      # GEMINI_API_KEY
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `.env.local`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

When prompted, accept defaults. This creates the full Next.js scaffold with Tailwind.

- [ ] **Step 2: Create .env.local with Gemini API key**

Create `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

- [ ] **Step 3: Install Google Generative AI SDK**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npm install @google/generative-ai
```

- [ ] **Step 4: Update .gitignore to exclude .env.local**

Verify `.gitignore` includes `.env.local` (create-next-app should add it). Also add:
```
.env.local
```

- [ ] **Step 5: Update app/layout.tsx for mobile-first shell**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delhi Brass — Room Visualizer",
  description: "See how Delhi Brass lighting looks in your room",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        <header className="px-4 py-3 border-b border-stone-200 bg-white">
          <h1 className="text-lg font-semibold tracking-tight">Delhi Brass</h1>
          <p className="text-xs text-stone-500">Room Visualizer</p>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify dev server runs**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npm run dev
```

Open `http://localhost:3000` — should see the header with "Delhi Brass / Room Visualizer".

- [ ] **Step 7: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and Gemini SDK"
```

---

### Task 2: Build Product Catalog

**Files:**
- Create: `lib/types.ts`, `scripts/build-catalog.ts`, `data/catalog.json`, `lib/catalog.ts`
- Source data: `/Users/dikshitakhullar/Desktop/delhi brass/catalog-tools/chandelier_catalog.json`
- Source images: `/Users/dikshitakhullar/Desktop/delhi brass/Chandelier/*/generated/01-white-bg-studio.png`

- [ ] **Step 1: Define types**

Create `lib/types.ts`:
```ts
export type ProductType = "chandelier" | "pendant" | "lantern" | "flush_mount" | "cluster" | "wall_sconce" | "hanging_lamp";
export type ProductSize = "small" | "medium" | "large";
export type ProductMaterial = "brass" | "iron" | "glass" | "crystal" | "mixed" | "wood" | "other";
export type ProductFinish = "polished" | "antique" | "matte" | "patina" | "gold" | "distressed" | "other";

export interface Product {
  slug: string;            // folder name, e.g. "fluted-scroll"
  name: string;            // display name, e.g. "Fluted Scroll"
  description: string;     // one-line product description
  type: ProductType;
  size: ProductSize;
  material: ProductMaterial;
  finish: ProductFinish;
  collection?: string;     // e.g. "Heritage Mini Shade", "Crystal Garden"
  imagePath: string;       // relative path: "/products/fluted-scroll.png"
  widthInches?: number;    // real product width for scale prompting
  heightInches?: number;   // real product height for scale prompting
}

export type RoomState = "furnished" | "under_construction";

export type RoomType =
  | "formal_living"
  | "family_lounge"
  | "dining_room"
  | "bedroom"
  | "entrance_lobby"
  | "mandir"
  | "stairwell"
  | "passage"
  | "terrace"
  | "other";

export interface GenerateRequest {
  productSlug: string;
  roomType: RoomType;
  roomState: RoomState;
  vibe?: string;           // optional user-provided style description
  // roomImage is sent as FormData, not in this interface
}
```

- [ ] **Step 2: Write the catalog build script**

Create `scripts/build-catalog.ts`:
```ts
/**
 * One-time script to build catalog.json from delhi brass data
 * and copy product studio images to public/products/.
 *
 * Run: npx tsx scripts/build-catalog.ts
 */
import * as fs from "fs";
import * as path from "path";

const CHANDELIER_DIR = "/Users/dikshitakhullar/Desktop/delhi brass/Chandelier";
const CATALOG_SOURCE = "/Users/dikshitakhullar/Desktop/delhi brass/catalog-tools/chandelier_catalog.json";
const OUTPUT_JSON = path.join(__dirname, "..", "data", "catalog.json");
const OUTPUT_IMAGES = path.join(__dirname, "..", "public", "products");

// Collection mappings from IMAGE_GENERATION_GUIDE.md
const COLLECTION_MAP: Record<string, string> = {
  "heritage-shade-": "Heritage Mini Shade",
  "crystal-garden-": "Crystal Garden",
  "grand-lantern-": "Grand Lantern",
  "noir-crystal-": "Noir Crystal",
  "distressed-scroll-": "Distressed Scroll",
  "iron-brass-": "Iron Brass",
  "crystal-fringe-": "Crystal Fringe",
  "farmhouse-bead-": "Farmhouse Bead",
  "brass-medallion-": "Brass Medallion",
};

function getCollection(slug: string): string | undefined {
  for (const [prefix, name] of Object.entries(COLLECTION_MAP)) {
    if (slug.startsWith(prefix)) return name;
  }
  return undefined;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface SourceProduct {
  name: string;
  size: string;
  type: string;
  material: string;
  finish: string;
  description: string;
}

function main() {
  // Load source catalog for metadata
  const sourceData = JSON.parse(fs.readFileSync(CATALOG_SOURCE, "utf-8"));
  const sourceByName: Record<string, SourceProduct> = {};
  for (const p of sourceData.products) {
    sourceByName[p.name.toLowerCase().replace(/\s+/g, "-")] = p;
  }

  // Ensure output dirs exist
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(OUTPUT_IMAGES, { recursive: true });

  const products: any[] = [];
  const folders = fs.readdirSync(CHANDELIER_DIR).filter((f) => {
    const full = path.join(CHANDELIER_DIR, f);
    return fs.statSync(full).isDirectory() && !f.startsWith("_") && !f.startsWith(".");
  });

  for (const folder of folders) {
    // Find studio image
    const studioPath = path.join(CHANDELIER_DIR, folder, "generated", "01-white-bg-studio.png");
    const studioPathJpg = path.join(CHANDELIER_DIR, folder, "generated", "01-white-bg-studio.jpg");
    const srcImage = fs.existsSync(studioPath) ? studioPath : fs.existsSync(studioPathJpg) ? studioPathJpg : null;

    if (!srcImage) continue; // skip products without studio shots

    // Copy image to public/products/
    const ext = path.extname(srcImage);
    const destImage = path.join(OUTPUT_IMAGES, `${folder}${ext}`);
    fs.copyFileSync(srcImage, destImage);

    // Look up metadata from source catalog
    const source = sourceByName[folder] || sourceByName[slugToName(folder).toLowerCase().replace(/\s+/g, "-")];

    products.push({
      slug: folder,
      name: source?.name || slugToName(folder),
      description: source?.description || "",
      type: source?.type || "chandelier",
      size: source?.size || "medium",
      material: source?.material || "brass",
      finish: source?.finish || "antique",
      collection: getCollection(folder),
      imagePath: `/products/${folder}${ext}`,
    });
  }

  // Sort alphabetically
  products.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(products, null, 2));
  console.log(`Catalog built: ${products.length} products`);
  console.log(`Images copied to: ${OUTPUT_IMAGES}`);
  console.log(`Catalog JSON: ${OUTPUT_JSON}`);
}

main();
```

- [ ] **Step 3: Run the catalog build script**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npm install tsx --save-dev
mkdir -p data public/products
npx tsx scripts/build-catalog.ts
```

Expected: "Catalog built: ~105 products" message. Verify `data/catalog.json` exists and `public/products/` has .png files.

- [ ] **Step 4: Write catalog lookup helpers**

Create `lib/catalog.ts`:
```ts
import catalogData from "@/data/catalog.json";
import { Product, ProductType } from "./types";

const products: Product[] = catalogData as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByType(type: ProductType): Product[] {
  return products.filter((p) => p.type === type);
}

export function getProductTypes(): ProductType[] {
  const types = new Set(products.map((p) => p.type));
  return Array.from(types) as ProductType[];
}

export function getCollections(): string[] {
  const collections = new Set(
    products.map((p) => p.collection).filter(Boolean)
  );
  return Array.from(collections) as string[];
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add lib/types.ts lib/catalog.ts data/catalog.json scripts/build-catalog.ts public/products/
git commit -m "feat: build product catalog from delhi brass data (105 products)"
```

---

### Task 3: Product Selection Page (Step 1 of user flow)

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Build the product grid page**

Replace `app/page.tsx`:
```tsx
import { getAllProducts, getProductTypes } from "@/lib/catalog";
import { Product, ProductType } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

function TypeFilter({
  types,
  selected,
}: {
  types: ProductType[];
  selected?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      <Link
        href="/"
        className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${
          !selected
            ? "bg-stone-900 text-white border-stone-900"
            : "border-stone-300 text-stone-600"
        }`}
      >
        All
      </Link>
      {types.map((type) => (
        <Link
          key={type}
          href={`/?type=${type}`}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm border capitalize ${
            selected === type
              ? "bg-stone-900 text-white border-stone-900"
              : "border-stone-300 text-stone-600"
          }`}
        >
          {type.replace("_", " ")}
        </Link>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/upload?product=${product.slug}`}
      className="block bg-white rounded-lg border border-stone-200 overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="aspect-square relative bg-stone-100">
        <Image
          src={product.imagePath}
          alt={product.name}
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 50vw, 200px"
        />
      </div>
      <div className="p-2.5">
        <p className="font-medium text-sm leading-tight">{product.name}</p>
        <p className="text-xs text-stone-500 mt-0.5 capitalize">
          {product.type.replace("_", " ")} · {product.material}
        </p>
      </div>
    </Link>
  );
}

export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type as ProductType | undefined;
  const types = getProductTypes();
  const allProducts = getAllProducts();
  const products = typeFilter
    ? allProducts.filter((p) => p.type === typeFilter)
    : allProducts;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Choose a Product</h2>
        <p className="text-sm text-stone-500 mt-1">
          Select a light to visualize in your room
        </p>
      </div>

      <TypeFilter types={types} selected={typeFilter} />

      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the product grid renders**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npm run dev
```

Open `http://localhost:3000`. Should see:
- "Choose a Product" heading
- Type filter pills (All, Chandelier, Pendant, etc.)
- Grid of product cards with images, names, types
- Tapping a filter shows only that type
- Tapping a product navigates to `/upload?product=<slug>`

- [ ] **Step 3: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add app/page.tsx
git commit -m "feat: product selection grid with type filters"
```

---

### Task 4: Upload & Room Details Page (Step 2 of user flow)

**Files:**
- Create: `app/upload/page.tsx`

- [ ] **Step 1: Build the upload page**

Create `app/upload/page.tsx`:
```tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, Suspense } from "react";
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

      // Store result in sessionStorage for the result page
      sessionStorage.setItem("resultImage", imageUrl);
      sessionStorage.setItem("productSlug", productSlug);
      router.push("/result");
    } catch (err) {
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (!productSlug) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">No product selected.</p>
        <a href="/" className="text-blue-600 underline mt-2 inline-block">
          Go back and choose a product
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selected product indicator */}
      <div className="flex items-center gap-3 bg-white rounded-lg border border-stone-200 p-3">
        <div className="w-16 h-16 relative shrink-0 bg-stone-100 rounded">
          <Image
            src={`/products/${productSlug}.png`}
            alt={productSlug}
            fill
            className="object-contain p-1"
            sizes="64px"
          />
        </div>
        <div>
          <p className="font-medium text-sm">
            {productSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </p>
          <a href="/" className="text-xs text-blue-600">
            Change product
          </a>
        </div>
      </div>

      {/* Room photo upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Room Photo
        </label>
        {roomPreview ? (
          <div className="relative">
            <img
              src={roomPreview}
              alt="Room preview"
              className="w-full rounded-lg border border-stone-200"
            />
            <button
              type="button"
              onClick={() => {
                setRoomImage(null);
                setRoomPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-stone-300 rounded-lg p-8 text-center text-stone-500 hover:border-stone-400 transition-colors"
          >
            <span className="block text-2xl mb-1">+</span>
            <span className="text-sm">Tap to upload or take a photo</span>
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
        <label className="block text-sm font-medium mb-2">Room Type</label>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value as RoomType)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm bg-white"
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
        <label className="block text-sm font-medium mb-2">Room State</label>
        <div className="space-y-2">
          {ROOM_STATES.map((rs) => (
            <label
              key={rs.value}
              className={`block border rounded-lg p-3 cursor-pointer transition-colors ${
                roomState === rs.value
                  ? "border-stone-900 bg-stone-50"
                  : "border-stone-200"
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
              <span className="text-sm font-medium">{rs.label}</span>
              <span className="block text-xs text-stone-500 mt-0.5">
                {rs.desc}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Vibe (optional) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Style / Vibe <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="e.g. modern Indian, minimal, warm and cozy"
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {VIBE_SUGGESTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVibe(v)}
              className={`px-2.5 py-1 rounded-full text-xs border ${
                vibe === v
                  ? "bg-stone-900 text-white border-stone-900"
                  : "border-stone-300 text-stone-600"
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
        className="w-full bg-stone-900 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Generating your room..." : "Visualize in My Room"}
      </button>
    </form>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-500">Loading...</div>}>
      <UploadForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify the upload page**

Navigate to `http://localhost:3000/upload?product=fluted-scroll`. Should see:
- Selected product card with image and name
- "Change product" link back to grid
- Room photo upload area (tap opens camera/gallery on mobile)
- Room type dropdown
- Room state radio buttons (Fully Furnished / Under Construction)
- Vibe text input with suggestion pills
- "Visualize in My Room" button (disabled until photo uploaded)

- [ ] **Step 3: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add app/upload/
git commit -m "feat: room upload page with photo, room type, state, and vibe inputs"
```

---

### Task 5: Prompt Engine

**Files:**
- Create: `lib/generate-prompt.ts`

This is the core logic — translating user inputs into a prompt that produces good results. Based directly on our spike test learnings.

- [ ] **Step 1: Build the prompt generator**

Create `lib/generate-prompt.ts`:
```ts
import { Product, RoomType, RoomState } from "./types";

const DEFAULT_STYLE = "Modern Indian luxury — clean marble surfaces, warm brass accents, contemporary Indian art, elegant sheer curtains, Italian marble or dark wood flooring, paneled walls with brass trim, warm ambient lighting. Not traditional or bohemian — sophisticated Delhi luxury.";

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  formal_living: "formal living room / drawing room",
  family_lounge: "family lounge",
  dining_room: "dining room",
  bedroom: "bedroom",
  entrance_lobby: "entrance lobby / foyer",
  mandir: "mandir / prayer room",
  stairwell: "stairwell / double-height space",
  passage: "passage / corridor",
  terrace: "terrace / covered patio",
  other: "room",
};

function getScaleInstruction(product: Product, roomType: RoomType): string {
  // If we have actual dimensions, use them
  if (product.widthInches) {
    return `The ${product.name} is approximately ${product.widthInches} inches wide${
      product.heightInches ? ` and ${product.heightInches} inches tall` : ""
    } in real life.`;
  }

  // Otherwise use size category + room type to estimate
  const sizeGuide: Record<string, string> = {
    small: "This is a SMALL light fixture — about 12-16 inches wide. It should look compact and delicate relative to the room, NOT dominant.",
    medium: "This is a MEDIUM sized light fixture — about 18-24 inches wide. It should look proportionate to the room, like a tasteful accent — NOT oversized or dominant.",
    large: "This is a LARGE light fixture — about 28-36 inches wide. It is a statement piece but must still be proportionate to the room.",
  };

  let instruction = sizeGuide[product.size] || sizeGuide["medium"];

  // Double-height rooms can handle bigger fixtures
  if (roomType === "stairwell") {
    instruction += " In this double-height space, the fixture can hang on a longer chain and appear larger than in a standard room.";
  }

  // Standard ceiling rooms need careful sizing
  if (["formal_living", "family_lounge", "bedroom", "mandir"].includes(roomType)) {
    instruction += " This is a standard 9-10 foot ceiling room. The fixture should hang on a short chain, close to the ceiling, well above head height.";
  }

  return instruction;
}

function getProductDescription(product: Product): string {
  if (product.description) return product.description;
  return `${product.name} — a ${product.size} ${product.material} ${product.type} with ${product.finish} finish`;
}

export function buildPrompt(
  product: Product,
  roomType: RoomType,
  roomState: RoomState,
  vibe?: string
): { prompt: string; negativePrompt: string } {
  const roomLabel = ROOM_TYPE_LABELS[roomType];
  const productDesc = getProductDescription(product);
  const scaleInstruction = getScaleInstruction(product, roomType);

  let prompt: string;

  if (roomState === "furnished") {
    prompt = `Edit this room photograph to add this exact light fixture: ${productDesc}.

CRITICAL — PRESERVE THE ROOM:
- Keep the ENTIRE room EXACTLY as it is. Do NOT change, move, or alter any furniture, wall, floor, ceiling, curtain, rug, decor object, or any other element in the room.
- The ONLY change is: add this light fixture in the appropriate position for a ${roomLabel}.
- If there is an existing ceiling fan or basic light where this fixture should go, replace ONLY that element.

SCALE — THIS IS CRITICAL:
${scaleInstruction}
- For reference: compare the fixture to the furniture in the room. A standard sofa is about 7 feet wide, a dining table about 3-4 feet wide, a door is about 7 feet tall.
- The fixture must look like a real interior designer chose it for this specific room size.

PLACEMENT:
- Hang from the ceiling in the natural center point for a ${roomLabel}.
- Show warm light glow from the fixture, casting soft ambient light.

QUALITY:
- Maintain the exact same camera angle, perspective, and lighting of the original photo.
- This must look like a real photograph, not a CGI render or composite.
- The fixture must look naturally integrated — proper shadows, reflections, lighting interaction with the room.`;
  } else {
    // Under construction
    const styleDirection = vibe || DEFAULT_STYLE;

    prompt = `Edit this under-construction room photograph to add this exact light fixture: ${productDesc}.

CRITICAL — PRESERVE ALL STRUCTURE AND INSTALLED FINISHES:
- Keep ALL structural elements EXACTLY as they are: walls, windows, doors, ceiling shape, room dimensions, steps, platforms. These are IMMOVABLE.
- Keep ALL already-installed finishes EXACTLY as they are: any stone cladding, tiles, woodwork, flooring, paneling that is already in place. These are DONE and must not change.
- Do NOT change the shape or position of any window or door opening.
- The ONLY surfaces you may finish are bare plaster, raw concrete, or clearly unfinished areas.

WHAT TO ADD:
- Hang this light fixture from the ceiling in the appropriate position for a ${roomLabel}.
${scaleInstruction}

STYLE DIRECTION: ${styleDirection}
Apply this style ONLY to unfinished surfaces and added decor — never to already-installed elements.

DEFAULT AESTHETIC FOR UNFINISHED SURFACES (Delhi luxury Indian modern):
- Walls: paneled walls in warm taupe/cream with brass trim, or dark wood paneling accent walls
- Flooring: Italian marble throughout, or dark polished wood
- Ceiling: smooth finish with subtle cove lighting in warm white
- Furniture (if room needs it): quilted/textured fabric sofas in cream, beige, charcoal, or warm grey. Marble-top coffee tables with ornate brass jali-cut legs. Dining chairs with ribbed/fluted fabric and brass handles.
- Decor: contemporary Indian art, embroidered cushions in dark navy/black with Indian motifs, crystal bowls, brass figurines, coffee table books, candles, elegant sheer curtains with pleated valance
- DO NOT add: brass pots/urlis/jars, jute rugs, block prints, velvet curtains, velvet sofas, jewel-tone furniture, olive green sofas, kitchen settings, plain/empty rooms

QUALITY:
- Maintain the exact same camera angle and perspective.
- This must look like a real photograph, not a CGI render.`;
  }

  // Add vibe to furnished rooms too
  if (roomState === "furnished" && vibe) {
    prompt += `\n\nNote: The customer describes their preferred style as "${vibe}". The fixture should feel at home in this aesthetic.`;
  }

  const negativePrompt = [
    "oversized fixture",
    "wrong scale",
    "too large",
    "CGI",
    "3D render",
    "composite look",
    "pasted look",
    "different furniture",
    "changed room",
    "altered walls",
    "altered windows",
    "structural changes",
    "different room layout",
    "brass pots",
    "urli",
    "jute rug",
    "block print",
    "velvet curtains",
    "velvet sofa",
    "olive green sofa",
    "jewel-tone furniture",
    "bohemian",
    "kitchen island",
  ].join(", ");

  return { prompt, negativePrompt };
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add lib/generate-prompt.ts
git commit -m "feat: prompt engine with scale rules, room preservation, and vibe support"
```

---

### Task 6: API Route — Image Generation Endpoint

**Files:**
- Create: `app/api/generate/route.ts`

- [ ] **Step 1: Build the generation API route**

Create `app/api/generate/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { getProductBySlug } from "@/lib/catalog";
import { buildPrompt } from "@/lib/generate-prompt";
import { RoomState, RoomType } from "@/lib/types";
import * as fs from "fs";
import * as path from "path";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const roomImageFile = formData.get("roomImage") as File;
    const productSlug = formData.get("productSlug") as string;
    const roomType = formData.get("roomType") as RoomType;
    const roomState = formData.get("roomState") as RoomState;
    const vibe = formData.get("vibe") as string | null;

    if (!roomImageFile || !productSlug || !roomType || !roomState) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Look up product
    const product = getProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Read room image as base64
    const roomImageBytes = await roomImageFile.arrayBuffer();
    const roomImageBase64 = Buffer.from(roomImageBytes).toString("base64");
    const roomMimeType = roomImageFile.type || "image/jpeg";

    // Read product studio image as base64
    const productImagePath = path.join(
      process.cwd(),
      "public",
      product.imagePath
    );
    const productImageBytes = fs.readFileSync(productImagePath);
    const productImageBase64 = Buffer.from(productImageBytes).toString("base64");
    const productMimeType = product.imagePath.endsWith(".jpg") ? "image/jpeg" : "image/png";

    // Build prompt
    const { prompt, negativePrompt } = buildPrompt(
      product,
      roomType,
      roomState,
      vibe || undefined
    );

    const fullPrompt = `${prompt}\n\nAvoid: ${negativePrompt}`;

    // Call Gemini Pro Image
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",  // Will update to gemini-3-pro-image when available
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: roomMimeType,
                data: roomImageBase64,
              },
            },
            {
              inlineData: {
                mimeType: productMimeType,
                data: productImageBase64,
              },
            },
            { text: fullPrompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Extract generated image from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const imageBuffer = Buffer.from(part.inlineData.data!, "base64");
        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": part.inlineData.mimeType,
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return NextResponse.json(
      { error: "AI did not return an image" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
```

**Note:** The Gemini model ID (`gemini-2.0-flash-exp`) is a placeholder. At deploy time, update to the correct model that supports image generation (e.g., `gemini-3-pro-image-preview`). The `@google/genai` SDK and model availability may need to be verified — check the latest docs. If the official SDK doesn't support image generation yet, we'll switch to a direct REST API call.

- [ ] **Step 2: Add the Google GenAI SDK**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npm install @google/genai
```

(This is the newer `@google/genai` package, not the older `@google/generative-ai`.)

- [ ] **Step 3: Update next.config.ts for large responses**

Update `next.config.ts` to allow large API response bodies:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add app/api/generate/ next.config.ts
git commit -m "feat: image generation API endpoint with Gemini Pro Image"
```

---

### Task 7: Result Page (Step 4 of user flow)

**Files:**
- Create: `app/result/page.tsx`

- [ ] **Step 1: Build the result page**

Create `app/result/page.tsx`:
```tsx
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
      // User cancelled or share not supported — fall back to download
      handleDownload();
    }
  }

  if (!imageUrl) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full mx-auto" />
        <p className="text-sm text-stone-500 mt-3">Loading result...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Your Room Visualization</h2>
        <p className="text-sm text-stone-500 mt-1">
          {productSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} in your room
        </p>
      </div>

      {/* Result image */}
      <div className="rounded-lg overflow-hidden border border-stone-200">
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
          className="bg-stone-900 text-white rounded-lg py-3 text-sm font-medium"
        >
          Download
        </button>
        <button
          onClick={handleShare}
          className="bg-stone-900 text-white rounded-lg py-3 text-sm font-medium"
        >
          Share
        </button>
      </div>

      {/* Navigation */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => {
            sessionStorage.removeItem("resultImage");
            router.push(`/upload?product=${productSlug}`);
          }}
          className="w-full border border-stone-300 rounded-lg py-3 text-sm font-medium text-stone-700"
        >
          Try a Different Room
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem("resultImage");
            sessionStorage.removeItem("productSlug");
            router.push("/");
          }}
          className="w-full border border-stone-300 rounded-lg py-3 text-sm font-medium text-stone-700"
        >
          Try Another Product
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add app/result/
git commit -m "feat: result page with download, share, and navigation"
```

---

### Task 8: Loading State

**Files:**
- Modify: `app/upload/page.tsx`

The generation takes 15-30 seconds. We need a good loading experience, not just a disabled button.

- [ ] **Step 1: Add a full-screen loading overlay to the upload page**

In `app/upload/page.tsx`, add this component above the `UploadForm` function:

```tsx
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

  return (
    <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center px-6">
      <div className="animate-spin w-10 h-10 border-2 border-stone-300 border-t-stone-900 rounded-full" />
      <p className="text-sm font-medium mt-4 text-stone-900">
        {messages[msgIndex]}
      </p>
      <p className="text-xs text-stone-500 mt-2">
        This usually takes 15-30 seconds
      </p>
    </div>
  );
}
```

Then in `UploadForm`, add right after the opening `<form>` tag:
```tsx
{isSubmitting && <GeneratingOverlay />}
```

Also add `useEffect` to the imports at the top of the file.

- [ ] **Step 2: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add app/upload/page.tsx
git commit -m "feat: loading overlay with rotating status messages during generation"
```

---

### Task 9: End-to-End Test

**Files:** None new — this is a manual integration test.

- [ ] **Step 1: Set up the Gemini API key**

Edit `.env.local` and add the real Gemini API key:
```
GEMINI_API_KEY=<real_key>
```

- [ ] **Step 2: Start the dev server**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npm run dev
```

- [ ] **Step 3: Test the full flow**

1. Open `http://localhost:3000` on phone (or use Chrome DevTools mobile view)
2. Browse the product grid — verify images load, type filters work
3. Tap a product (e.g., fluted-scroll) — should go to `/upload?product=fluted-scroll`
4. Upload a room photo from camera roll
5. Select room type and state
6. Tap "Visualize in My Room"
7. Verify loading overlay appears with rotating messages
8. After 15-30 sec, should redirect to result page with the generated image
9. Test Download button — should download the image
10. Test Share button — should open native share sheet (on mobile)
11. Test "Try a Different Room" — should go back to upload with same product
12. Test "Try Another Product" — should go back to product grid

- [ ] **Step 4: Fix any issues found during testing**

Common issues to watch for:
- Gemini SDK model ID may need updating — check error logs
- Image file too large for API — may need client-side resize before upload
- CORS or body size limits — check next.config.ts settings

- [ ] **Step 5: Commit any fixes**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add -A
git commit -m "fix: end-to-end testing fixes"
```

---

### Task 10: Deploy to Vercel

**Files:** None — deployment configuration.

- [ ] **Step 1: Initialize Vercel project**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
npx vercel
```

Follow prompts:
- Set up and deploy? Yes
- Scope: your account
- Link to existing project? No
- Project name: nectar-viz
- Directory: ./
- Override settings? No

- [ ] **Step 2: Set environment variable on Vercel**

```bash
npx vercel env add GEMINI_API_KEY production
```

Paste the Gemini API key when prompted.

- [ ] **Step 3: Deploy to production**

```bash
npx vercel --prod
```

- [ ] **Step 4: Test the production URL**

Open the Vercel URL on your phone. Run through the same flow as Task 9. Verify everything works on the deployed version.

- [ ] **Step 5: Generate a QR code for the showroom**

Use any QR code generator to create a QR code pointing to the production URL. Print it for the Delhi Brass showroom.

- [ ] **Step 6: Commit**

```bash
cd /Users/dikshitakhullar/Desktop/nectar-viz
git add -A
git commit -m "chore: Vercel deployment configuration"
```
