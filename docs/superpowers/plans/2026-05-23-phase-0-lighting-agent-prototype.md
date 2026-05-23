# Phase 0: AI Lighting Consultant — Clickable Prototype + Interview Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully clickable Next.js prototype of the AI Lighting Consultant Agent end-to-end user journey for a single hardcoded demo room, plus an interview kit, so we can validate UX with 10-20 users before building the real engine.

**Architecture:** Single feature directory at `app/lighting-agent/` (new route, isolated from existing product). All data hardcoded in `lib/lighting-agent/demo-data.ts`. Pure-logic utilities (SVG sketch generation, BOQ totals, fixture data lookups) live in `lib/lighting-agent/` with vitest unit tests. UI components live colocated under `app/lighting-agent/components/`. Three demo renders are generated once via a one-off script and committed to `public/lighting-agent/renders/`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4, vitest (new for this project), Gemini 2.5 Flash Image (one-time render generation).

**Reading before starting:** This is Next.js 16, not the Next.js in your training data. Read `node_modules/next/dist/docs/01-app/index.md` and the relevant App Router pages before writing route code. Heed deprecation notices.

---

## Spec coverage

This plan implements **Section 6 (Phase 0: Prototype + interviews)** of `docs/superpowers/specs/2026-05-23-ai-lighting-consultant-agent-design.md` in full. Specifically:

- All screens of the user journey (landing → Home Profile → Room Basics → Wall-by-wall × 4 → Furniture → Brief → Agent Thinking → Lighting Pack → Iteration chat)
- A single hardcoded demo room: 12 ft × 15 ft × 10 ft living/TV room
- Lighting Pack with all 12 sections rendered from hardcoded data
- 3 pre-generated photoreal renders (Day / Evening / Mood)
- Scripted iteration chat
- Interview kit: script, observation guide, recruitment screener

---

## Demo Room Specification

All prototype screens render a single hardcoded scenario. **Do not parameterize** — that's Phase 1.

| Attribute | Value |
|---|---|
| Room type | Living / TV room |
| Dimensions | 12 ft × 15 ft × 10 ft ceiling |
| Orientation | Main window faces East |
| Ceiling | False ceiling, 10 ft finish height |
| Floor finish | Mid-tone wood |
| Wall finish | Off-white paint |
| Occupants | Couple, 30s, no vision concerns |
| Primary usage | Evening (work-from-home in mornings, family lounge in evenings) |
| **North wall** | Front door on left (3 ft wide); console with framed art on right (console 4ft wide, 2 framed pieces above) |
| **East wall** | Large window (5 ft × 4 ft) center-right, gets morning direct sun; built-in bookshelf left half |
| **South wall** | TV (55") mounted center; media console below |
| **West wall** | Art wall — large single artwork (4ft × 3ft) centered |
| **Furniture** | 3-seater sofa facing TV; coffee table center; 2 armchairs flanking; side table by sofa-arm |
| Mood preference | Cozy, evening-warm, dramatic when entertaining |
| Budget tier | Mid |

### Fixtures recommended (hardcoded)

| Tag | Type | Layer | Specs | Catalog source |
|---|---|---|---|---|
| DL-01..06 | Recessed downlight × 6 | Ambient | 12W, 3000K, 60°, dimmable, CRI 90 | Wipro Garnet (mid) / Philips (premium pick) |
| P-01 | Brass cluster pendant × 1 over coffee table | Decorative | LED E27 × 5, 5×8W, 2700K, CRI 90 | Delhi Brass — pick a real SKU from catalog |
| C-01 | Perimeter cove × 1 (~14 m linear) | Ambient | 10W/m LED strip, 2700K, CRI 90 | Astera / Goldmedal |
| PL-01..02 | Picture lights × 2 on west art wall | Accent | 5W, 3000K, narrow beam | Generic; recommend brand picks |
| W-01 | Brass wall sconce × 1 (between front door and console) | Decorative + ambient | LED E27, 8W, 2700K | Delhi Brass — pick a real SKU |
| S-01..02 | Spot lights × 2 on art (recessed adjustable) | Accent | 7W, 3000K, 24°, dimmable | Wipro Garnet (mid) / Philips (premium) |
| T-01 | Table lamp × 1 on side table | Decorative + task | LED E27, 6W, 2700K | Delhi Brass — pick a real SKU |

**BOQ total target:** roughly ₹85,000–₹110,000 (mid tier) including all fixtures + drivers + cove strip + dimmers. Don't agonise over exact numbers; populate reasonable line-item costs and let totals fall out.

### Three render scenes to pre-generate

| Scene | Prompt intent |
|---|---|
| **Day** | Morning daylight through east window dominant; downlights off; cove off; lamps off. Show natural light spilling onto floor and sofa. |
| **Evening** | All architectural lighting on at warm dim; pendant on; cove glowing on ceiling edges; picture lights on art wall; warm pools from downlights. |
| **Mood** | Dramatic: pendant + picture lights + cove only. Downlights off or very low. Art wall the visual focus. Evening, low key. |

---

## File Structure

**New files to create:**

```
app/
  lighting-agent/                           # New isolated prototype route
    layout.tsx                              # Wraps the prototype in its own layout
    page.tsx                                # Landing page (Screen 1)
    home-profile/page.tsx                   # Home Profile screen (Screen 2)
    room-basics/page.tsx                    # Room Basics screen (Screen 3)
    wall/[wall]/page.tsx                    # Wall-by-wall screen, 1 of 4 (Screens 4-7)
    furniture/page.tsx                      # Furniture placement screen (Screen 8)
    brief/page.tsx                          # Lifestyle brief + constraints (Screen 9)
    generating/page.tsx                     # Agent thinking transition (Screen 10)
    pack/page.tsx                           # Lighting Pack output (Screen 11)
    components/
      WallSketchSVG.tsx                     # Live SVG sketch of a wall + items
      RCPDiagramSVG.tsx                     # Top-down ceiling plan SVG
      WallElevationSVG.tsx                  # Wall-elevation diagram component
      FixtureScheduleTable.tsx              # Full fixture schedule table
      SwitchingDiagram.tsx                  # Switch → fixture mapping diagram
      BOQTable.tsx                          # Costed BOQ table
      RenderGallery.tsx                     # 3-scene image gallery
      LayeredBreakdown.tsx                  # Ambient/Task/Accent/Decorative cards
      BrandRecCard.tsx                      # Brand picks per architectural category
      IterationChat.tsx                     # Scripted chat panel
      StepNav.tsx                           # Progress bar across steps
      AnswerOption.tsx                      # Reusable button-card option

lib/
  lighting-agent/
    demo-data.ts                            # Single source of demo room data
    fixtures.ts                             # Fixture recommendations + specs
    boq.ts                                  # BOQ assembly + totals math
    wall-sketch.ts                          # Pure function: wall data → SVG paths
    rcp.ts                                  # Pure function: fixtures → RCP layout
    scripted-chat.ts                        # Scripted iteration responses
    types.ts                                # Types specific to lighting-agent

public/
  lighting-agent/
    renders/
      day.jpg
      evening.jpg
      mood.jpg

scripts/
  generate-prototype-renders.ts             # One-off script to call Gemini and save 3 renders

docs/
  interviews/
    lighting-agent-interview-script.md      # Script for user interviews
    lighting-agent-observation-guide.md     # What to watch for during sessions
    lighting-agent-recruitment.md           # Screener + recruitment plan

tests/
  lighting-agent/
    boq.test.ts
    wall-sketch.test.ts
    rcp.test.ts
    fixtures.test.ts

vitest.config.ts                            # New
package.json                                # Modified: add vitest deps + test script
```

**Files to modify:**
- `package.json` — add vitest, @testing-library/react, jsdom dev deps + `test` and `test:watch` scripts
- `lib/types.ts:1-69` — add lighting-agent-specific shared types if any cross-boundary (likely none — keep types in `lib/lighting-agent/types.ts`)

**Conventions to follow:**
- App Router pages are server components by default; add `"use client"` only where state/effects needed
- Tailwind v4 utility classes; no custom CSS unless necessary
- Existing dark luxury aesthetic (near-black bg, gold accents, thin tracking, grain texture) — see `app/globals.css` and `app/layout.tsx` for tokens
- All copy in the prototype should match brand voice: "we'll" not "AI will", "for Delhi Brass" not "by Delhi Brass"

---

## Tasks

### Task 1: Set up vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Create: `tests/lighting-agent/.gitkeep`

- [ ] **Step 1: Install dev dependencies**

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @types/node
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 3: Create `tests/setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add scripts to `package.json`**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify setup with a smoke test**

Create `tests/setup.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: 1 test passing.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/
git commit -m "test: install vitest + testing-library for prototype tests"
```

---

### Task 2: Define demo data + types

**Files:**
- Create: `lib/lighting-agent/types.ts`
- Create: `lib/lighting-agent/demo-data.ts`

- [ ] **Step 1: Create `lib/lighting-agent/types.ts`**

```typescript
// Local types for the lighting-agent prototype. Phase 1 will promote some of these to lib/types.ts.

export type LightingLayer = "ambient" | "task" | "accent" | "decorative";

export type MountingType =
  | "recessed_ceiling"
  | "surface_ceiling"
  | "suspended"
  | "wall_mounted"
  | "cove"
  | "track"
  | "plug_in";

export type CCT = 2700 | 3000 | 4000;

export type BrandTier = "budget" | "mid" | "premium" | "luxury";

export type WallId = "north" | "east" | "south" | "west";

export interface WallItem {
  kind: "door" | "window" | "tv" | "art" | "mirror" | "shelf" | "console" | "sideboard" | "built_in";
  positionFromLeftFt: number;
  widthFt: number;
  heightFt?: number;
  notes?: string;
}

export interface Wall {
  id: WallId;
  lengthFt: number;
  heightFt: number;
  items: WallItem[];
}

export interface FurniturePiece {
  kind: "sofa" | "armchair" | "coffee_table" | "side_table" | "tv_console" | "bookshelf" | "dining_table" | "bed";
  positionXFt: number; // distance from west wall
  positionYFt: number; // distance from north wall
  widthFt: number;
  depthFt: number;
  label?: string;
}

export interface Room {
  type: "living_tv" | "dining" | "bedroom" | "kitchen" | "study" | "drawing";
  lengthFt: number;
  widthFt: number;
  ceilingFt: number;
  walls: Record<WallId, Wall>;
  furniture: FurniturePiece[];
  orientation: "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW";
  floorFinish: "light" | "mid" | "dark";
  wallFinish: "light" | "mid" | "dark";
  ceilingType: "flat" | "false" | "sloped" | "coffered" | "mixed";
}

export interface Occupant {
  ageRange: "kids" | "young_adult" | "adult" | "elderly";
  visionConcerns?: string;
}

export interface HomeProfile {
  houseType: "apartment" | "builder_floor" | "villa" | "standalone";
  constructionStage: "new_build" | "mid_renovation" | "lived_in";
  smartHome: "yes" | "no" | "maybe";
  preferredCCT: "warm_2700" | "neutral_3000" | "mixed";
  brandTier: BrandTier;
  brandPreferences: string[];
  brandNoGo: string[];
  defaultCeiling: Room["ceilingType"];
}

export interface Fixture {
  tag: string; // e.g. "DL-01"
  layer: LightingLayer;
  mounting: MountingType;
  category: string; // free text, e.g. "Recessed Downlight"
  description: string;
  wattage: number;
  lumens?: number;
  cct: CCT;
  cri?: number;
  beamAngleDeg?: number;
  dimmable: boolean;
  quantity: number;
  source: "decorative_catalog" | "architectural_spec";
  catalogSku?: string; // when source = decorative_catalog
  brandPicks?: { tier: BrandTier; brand: string; model?: string }[]; // when source = architectural_spec
  unitPriceInr: number;
  notes?: string;
  positionOnRcp?: { xFt: number; yFt: number };
  wallId?: WallId; // for wall-mounted fixtures
  applicationNote?: string; // e.g. "Placed for planned art piece"
}

export interface SwitchingZone {
  id: string;
  label: string;
  controlsTags: string[]; // fixture tags
  dimmer: boolean;
  switchLocation: string; // e.g. "Door entry, left wall"
}

export interface BOQLine {
  category: "Decorative" | "Architectural" | "Controls" | "Drivers/Accessories";
  description: string;
  qty: number;
  unitInr: number;
  totalInr: number;
}

export interface LightingPack {
  homeProfile: HomeProfile;
  room: Room;
  occupants: Occupant[];
  mood: string;
  budgetTier: BrandTier;
  fixtures: Fixture[];
  switching: SwitchingZone[];
  boq: BOQLine[];
  totals: { fixturesInr: number; controlsInr: number; grandTotalInr: number; estMonthlyEnergyInr: number };
  narrative: string; // markdown
  applicationNotes: string[]; // bullet list strings
  installationNotes: string[];
}
```

- [ ] **Step 2: Create `lib/lighting-agent/demo-data.ts` with the demo room**

```typescript
import type { HomeProfile, Occupant, Room, LightingPack, Fixture, SwitchingZone, BOQLine } from "./types";

export const demoHomeProfile: HomeProfile = {
  houseType: "apartment",
  constructionStage: "mid_renovation",
  smartHome: "maybe",
  preferredCCT: "warm_2700",
  brandTier: "mid",
  brandPreferences: ["Wipro", "Philips"],
  brandNoGo: [],
  defaultCeiling: "false",
};

export const demoOccupants: Occupant[] = [
  { ageRange: "adult" },
  { ageRange: "adult" },
];

export const demoRoom: Room = {
  type: "living_tv",
  lengthFt: 15,
  widthFt: 12,
  ceilingFt: 10,
  orientation: "E",
  floorFinish: "mid",
  wallFinish: "light",
  ceilingType: "false",
  walls: {
    north: {
      id: "north",
      lengthFt: 15,
      heightFt: 10,
      items: [
        { kind: "door", positionFromLeftFt: 1, widthFt: 3, heightFt: 7 },
        { kind: "console", positionFromLeftFt: 9, widthFt: 4, heightFt: 2.5 },
        { kind: "art", positionFromLeftFt: 9.5, widthFt: 3, heightFt: 2 },
      ],
    },
    east: {
      id: "east",
      lengthFt: 12,
      heightFt: 10,
      items: [
        { kind: "shelf", positionFromLeftFt: 0, widthFt: 4, heightFt: 7 },
        { kind: "window", positionFromLeftFt: 5, widthFt: 5, heightFt: 4, notes: "morning direct sun" },
      ],
    },
    south: {
      id: "south",
      lengthFt: 15,
      heightFt: 10,
      items: [
        { kind: "tv", positionFromLeftFt: 5.5, widthFt: 4, heightFt: 2.5 },
        { kind: "console", positionFromLeftFt: 4, widthFt: 7, heightFt: 1.5 },
      ],
    },
    west: {
      id: "west",
      lengthFt: 12,
      heightFt: 10,
      items: [
        { kind: "art", positionFromLeftFt: 4, widthFt: 4, heightFt: 3 },
      ],
    },
  },
  furniture: [
    { kind: "sofa", positionXFt: 4, positionYFt: 9, widthFt: 7, depthFt: 3, label: "3-seater" },
    { kind: "coffee_table", positionXFt: 5.5, positionYFt: 6.5, widthFt: 4, depthFt: 2 },
    { kind: "armchair", positionXFt: 1.5, positionYFt: 7, widthFt: 2.5, depthFt: 2.5 },
    { kind: "armchair", positionXFt: 11.5, positionYFt: 7, widthFt: 2.5, depthFt: 2.5 },
    { kind: "side_table", positionXFt: 11, positionYFt: 9, widthFt: 1.5, depthFt: 1.5 },
    { kind: "tv_console", positionXFt: 4, positionYFt: 11, widthFt: 7, depthFt: 1 },
    { kind: "bookshelf", positionXFt: 14, positionYFt: 1, widthFt: 4, depthFt: 1 },
  ],
};

export const demoFixtures: Fixture[] = [
  // 6 recessed downlights — 3x2 grid
  { tag: "DL-01", layer: "ambient", mounting: "recessed_ceiling", category: "Recessed Downlight", description: "Round flush downlight, dimmable", wattage: 12, lumens: 1100, cct: 3000, cri: 90, beamAngleDeg: 60, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "budget", brand: "Goldmedal" }, { tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 850, positionOnRcp: { xFt: 4, yFt: 3 } },
  { tag: "DL-02", layer: "ambient", mounting: "recessed_ceiling", category: "Recessed Downlight", description: "Round flush downlight, dimmable", wattage: 12, lumens: 1100, cct: 3000, cri: 90, beamAngleDeg: 60, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "budget", brand: "Goldmedal" }, { tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 850, positionOnRcp: { xFt: 8, yFt: 3 } },
  { tag: "DL-03", layer: "ambient", mounting: "recessed_ceiling", category: "Recessed Downlight", description: "Round flush downlight, dimmable", wattage: 12, lumens: 1100, cct: 3000, cri: 90, beamAngleDeg: 60, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "budget", brand: "Goldmedal" }, { tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 850, positionOnRcp: { xFt: 12, yFt: 3 } },
  { tag: "DL-04", layer: "ambient", mounting: "recessed_ceiling", category: "Recessed Downlight", description: "Round flush downlight, dimmable", wattage: 12, lumens: 1100, cct: 3000, cri: 90, beamAngleDeg: 60, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "budget", brand: "Goldmedal" }, { tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 850, positionOnRcp: { xFt: 4, yFt: 9 } },
  { tag: "DL-05", layer: "ambient", mounting: "recessed_ceiling", category: "Recessed Downlight", description: "Round flush downlight, dimmable", wattage: 12, lumens: 1100, cct: 3000, cri: 90, beamAngleDeg: 60, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "budget", brand: "Goldmedal" }, { tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 850, positionOnRcp: { xFt: 8, yFt: 9 } },
  { tag: "DL-06", layer: "ambient", mounting: "recessed_ceiling", category: "Recessed Downlight", description: "Round flush downlight, dimmable", wattage: 12, lumens: 1100, cct: 3000, cri: 90, beamAngleDeg: 60, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "budget", brand: "Goldmedal" }, { tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 850, positionOnRcp: { xFt: 12, yFt: 9 } },
  // Pendant over coffee table
  { tag: "P-01", layer: "decorative", mounting: "suspended", category: "Brass Cluster Pendant", description: "5-arm brass cluster, warm glow, hung 1.8m above table", wattage: 40, cct: 2700, cri: 90, dimmable: false, quantity: 1, source: "decorative_catalog", catalogSku: "delhibrass:cluster-5-arm", unitPriceInr: 28000, positionOnRcp: { xFt: 7.5, yFt: 7.5 }, applicationNote: "Hung over the coffee table — the visual anchor of the conversation area." },
  // Cove perimeter
  { tag: "C-01", layer: "ambient", mounting: "cove", category: "Perimeter Cove LED", description: "Warm cove LED strip, ~14m perimeter, indirect ambient", wattage: 140, cct: 2700, cri: 90, dimmable: true, quantity: 14, source: "architectural_spec", brandPicks: [{ tier: "budget", brand: "Goldmedal" }, { tier: "mid", brand: "Astera" }, { tier: "premium", brand: "Wipro Wave" }], unitPriceInr: 1200, applicationNote: "Indirect cove glow softens the room at night and removes the need for downlights at lower brightness scenes." },
  // Picture lights
  { tag: "PL-01", layer: "accent", mounting: "wall_mounted", category: "Picture Light", description: "Slim picture light, narrow downward beam", wattage: 5, cct: 3000, beamAngleDeg: 30, dimmable: false, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "mid", brand: "Wipro" }, { tier: "premium", brand: "Astera" }], unitPriceInr: 3500, wallId: "north", applicationNote: "Grazes the framed art above your console." },
  { tag: "PL-02", layer: "accent", mounting: "wall_mounted", category: "Picture Light", description: "Slim picture light, narrow downward beam", wattage: 5, cct: 3000, beamAngleDeg: 30, dimmable: false, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "mid", brand: "Wipro" }, { tier: "premium", brand: "Astera" }], unitPriceInr: 3500, wallId: "west", applicationNote: "On the west art wall — the room's hero moment." },
  // Spots on art
  { tag: "S-01", layer: "accent", mounting: "recessed_ceiling", category: "Adjustable Accent Spot", description: "Recessed adjustable spot, narrow beam for art wash", wattage: 7, cct: 3000, beamAngleDeg: 24, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 1800, positionOnRcp: { xFt: 1.5, yFt: 5 }, applicationNote: "Washes the west art wall — angled toward the painting." },
  { tag: "S-02", layer: "accent", mounting: "recessed_ceiling", category: "Adjustable Accent Spot", description: "Recessed adjustable spot, narrow beam for art wash", wattage: 7, cct: 3000, beamAngleDeg: 24, dimmable: true, quantity: 1, source: "architectural_spec", brandPicks: [{ tier: "mid", brand: "Wipro Garnet" }, { tier: "premium", brand: "Philips" }], unitPriceInr: 1800, positionOnRcp: { xFt: 1.5, yFt: 7.5 }, applicationNote: "Companion accent — pair with S-01 for even wash." },
  // Wall sconce
  { tag: "W-01", layer: "decorative", mounting: "wall_mounted", category: "Brass Wall Sconce", description: "Single-arm brass sconce, warm bulb", wattage: 8, cct: 2700, dimmable: false, quantity: 1, source: "decorative_catalog", catalogSku: "delhibrass:sconce-single-arm", unitPriceInr: 12000, wallId: "north", applicationNote: "Soft glow next to the entry — first impression as you walk in." },
  // Table lamp
  { tag: "T-01", layer: "decorative", mounting: "plug_in", category: "Table Lamp", description: "Brass-base table lamp, fabric shade", wattage: 6, cct: 2700, dimmable: false, quantity: 1, source: "decorative_catalog", catalogSku: "delhibrass:table-lamp-brass", unitPriceInr: 9500, applicationNote: "On the side table — task light for reading on the sofa." },
];

export const demoSwitching: SwitchingZone[] = [
  { id: "Z1", label: "Ambient (downlights)", controlsTags: ["DL-01", "DL-02", "DL-03", "DL-04", "DL-05", "DL-06"], dimmer: true, switchLocation: "Door entry, left of door + duplicate near sofa" },
  { id: "Z2", label: "Cove", controlsTags: ["C-01"], dimmer: true, switchLocation: "Door entry + duplicate near sofa" },
  { id: "Z3", label: "Art accents", controlsTags: ["S-01", "S-02", "PL-01", "PL-02"], dimmer: true, switchLocation: "Near sofa only" },
  { id: "Z4", label: "Decorative (pendant + sconce)", controlsTags: ["P-01", "W-01"], dimmer: false, switchLocation: "Door entry" },
  { id: "Z5", label: "Table lamp", controlsTags: ["T-01"], dimmer: false, switchLocation: "Plug + bulb-pull (no switch)" },
];

export const demoApplicationNotes: string[] = [
  "Pendant P-01 hung over the coffee table — the visual anchor of the conversation area. Suspension at 1.8m below ceiling for scale balance.",
  "Cove C-01 wraps the full room perimeter for indirect ambient — lets you turn off the downlights entirely in evening scenes and keep a warm wash.",
  "Picture lights PL-01 and PL-02 are sized to your stated art positions on the north and west walls.",
  "Spots S-01 and S-02 are placed 4–5 ft out from the west art wall, angled at ~30° for an even art wash without glare.",
  "Wall sconce W-01 between front door and console — soft welcoming light as you enter.",
  "Table lamp T-01 by the sofa-arm — reading task light, also a layered evening glow.",
  "Downlights placed in a 3×2 grid avoiding the pendant zone — gives even ambient without conflicting with the decorative anchor.",
];

export const demoInstallationNotes: string[] = [
  "All architectural fixtures (downlights, cove, spots) on dimmable circuits — confirm LED drivers are TRIAC-compatible if using standard wall dimmers, else move to 0–10V or DALI.",
  "Cove strip needs a continuous 12V or 24V driver run; recommend running driver in a serviceable location (false ceiling access panel).",
  "Picture lights PL-01 and PL-02 need a junction box at the marked positions on north and west walls — confirm with electrician at first-fix.",
  "Spots S-01 and S-02 are adjustable — schedule a focusing session after the art is installed.",
  "Pendant P-01: confirm 1.8m drop below false ceiling; electrician needs a secure hook + 3-core flex.",
];

const fixtureBOQ: BOQLine[] = demoFixtures.map(f => ({
  category: f.source === "decorative_catalog" ? "Decorative" : "Architectural",
  description: `${f.tag} — ${f.description}`,
  qty: f.quantity,
  unitInr: f.unitPriceInr,
  totalInr: f.unitPriceInr * f.quantity,
}));

const controlsBOQ: BOQLine[] = [
  { category: "Controls", description: "Wall dimmer (LED-compatible) × 3 zones (downlights, cove, accents)", qty: 3, unitInr: 1800, totalInr: 5400 },
  { category: "Controls", description: "2-way switch wiring for Z1 and Z2 (door + sofa)", qty: 1, unitInr: 3500, totalInr: 3500 },
];

const driverBOQ: BOQLine[] = [
  { category: "Drivers/Accessories", description: "LED driver for cove strip (200W rating)", qty: 1, unitInr: 2200, totalInr: 2200 },
  { category: "Drivers/Accessories", description: "Installation hardware + driver boxes", qty: 1, unitInr: 1500, totalInr: 1500 },
];

export const demoBOQ: BOQLine[] = [...fixtureBOQ, ...controlsBOQ, ...driverBOQ];

export const demoNarrative = `## Design intent

Your living/TV room gets four lighting layers working together so the room feels different at different times of day. **Ambient** comes from six dimmable downlights and a warm perimeter cove — the cove alone is enough for evening lounging without turning on the overhead lights. **Decorative** is anchored by the brass cluster pendant over your coffee table; this is the visual hero. **Accent** lighting picks out your art — picture lights on the framed pieces and adjustable spots washing the west art wall. **Task** is the side-table reading lamp.

Five switching zones let you build scenes — Daytime (cove + accents off, downlights on low, daylight dominant), Conversation (downlights at 50%, cove on, pendant on), Cinema (downlights off, cove low, accents on), Dramatic (pendant + accents only).

All decorative pieces are from Delhi Brass for cohesion with your warm aesthetic. Architectural fixtures (downlights, spots, cove) recommend Wipro Garnet at your mid-tier budget; upgrade to Philips for the premium variant.`;

export const demoPack: LightingPack = {
  homeProfile: demoHomeProfile,
  room: demoRoom,
  occupants: demoOccupants,
  mood: "Cozy evening warm, dramatic when entertaining",
  budgetTier: "mid",
  fixtures: demoFixtures,
  switching: demoSwitching,
  boq: demoBOQ,
  totals: {
    fixturesInr: demoBOQ.filter(b => b.category === "Decorative" || b.category === "Architectural").reduce((s, b) => s + b.totalInr, 0),
    controlsInr: demoBOQ.filter(b => b.category === "Controls" || b.category === "Drivers/Accessories").reduce((s, b) => s + b.totalInr, 0),
    grandTotalInr: demoBOQ.reduce((s, b) => s + b.totalInr, 0),
    estMonthlyEnergyInr: 380, // hardcoded estimate
  },
  narrative: demoNarrative,
  applicationNotes: demoApplicationNotes,
  installationNotes: demoInstallationNotes,
};
```

- [ ] **Step 3: Commit**

```bash
git add lib/lighting-agent/
git commit -m "feat(lighting-agent): demo room data + types for prototype"
```

---

### Task 3: BOQ math utility (TDD)

**Files:**
- Create: `lib/lighting-agent/boq.ts`
- Create: `tests/lighting-agent/boq.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lighting-agent/boq.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sumByCategory, sumTotal, formatInr } from "@/lib/lighting-agent/boq";
import type { BOQLine } from "@/lib/lighting-agent/types";

const sample: BOQLine[] = [
  { category: "Decorative", description: "A", qty: 1, unitInr: 1000, totalInr: 1000 },
  { category: "Decorative", description: "B", qty: 2, unitInr: 500, totalInr: 1000 },
  { category: "Architectural", description: "C", qty: 1, unitInr: 850, totalInr: 850 },
  { category: "Controls", description: "D", qty: 1, unitInr: 2000, totalInr: 2000 },
];

describe("boq math", () => {
  it("sums by category", () => {
    expect(sumByCategory(sample, "Decorative")).toBe(2000);
    expect(sumByCategory(sample, "Architectural")).toBe(850);
    expect(sumByCategory(sample, "Controls")).toBe(2000);
    expect(sumByCategory(sample, "Drivers/Accessories")).toBe(0);
  });

  it("sums total", () => {
    expect(sumTotal(sample)).toBe(3850);
  });

  it("formats INR with grouping", () => {
    expect(formatInr(85000)).toBe("₹85,000");
    expect(formatInr(1234567)).toBe("₹12,34,567"); // Indian grouping
    expect(formatInr(0)).toBe("₹0");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- boq`
Expected: FAIL with "Cannot find module" or similar.

- [ ] **Step 3: Implement `lib/lighting-agent/boq.ts`**

```typescript
import type { BOQLine } from "./types";

export function sumByCategory(lines: BOQLine[], category: BOQLine["category"]): number {
  return lines.filter(l => l.category === category).reduce((s, l) => s + l.totalInr, 0);
}

export function sumTotal(lines: BOQLine[]): number {
  return lines.reduce((s, l) => s + l.totalInr, 0);
}

export function formatInr(amount: number): string {
  // Indian grouping: 12,34,567 not 1,234,567
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(Math.round(amount));
  const s = abs.toString();
  if (s.length <= 3) return `${sign}₹${s}`;
  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);
  const restGrouped = rest.replace(/(\d)(?=(\d\d)+$)/g, "$1,");
  return `${sign}₹${restGrouped},${lastThree}`;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- boq`
Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/lighting-agent/boq.ts tests/lighting-agent/boq.test.ts
git commit -m "feat(lighting-agent): BOQ math + INR formatter with Indian grouping"
```

---

### Task 4: Wall sketch SVG utility (TDD)

This builds the live-updating SVG of a single wall as the user fills wall items. Pure function: wall data → SVG path strings.

**Files:**
- Create: `lib/lighting-agent/wall-sketch.ts`
- Create: `tests/lighting-agent/wall-sketch.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lighting-agent/wall-sketch.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeWallSketch } from "@/lib/lighting-agent/wall-sketch";
import type { Wall } from "@/lib/lighting-agent/types";

const wall: Wall = {
  id: "north",
  lengthFt: 15,
  heightFt: 10,
  items: [
    { kind: "door", positionFromLeftFt: 1, widthFt: 3, heightFt: 7 },
    { kind: "window", positionFromLeftFt: 9, widthFt: 4, heightFt: 4 },
  ],
};

describe("computeWallSketch", () => {
  it("returns wall outline matching the room dimensions in scaled units", () => {
    const result = computeWallSketch(wall, { widthPx: 600, paddingPx: 30 });
    expect(result.outline.widthPx).toBeGreaterThan(0);
    expect(result.outline.heightPx).toBeGreaterThan(0);
    // Wall is 15ft wide × 10ft tall, ratio 1.5:1
    expect(result.outline.widthPx / result.outline.heightPx).toBeCloseTo(1.5, 1);
  });

  it("places each item with correct position and size in scaled units", () => {
    const result = computeWallSketch(wall, { widthPx: 600, paddingPx: 30 });
    expect(result.items).toHaveLength(2);

    const door = result.items[0];
    expect(door.kind).toBe("door");
    // Door is at 1ft from left out of 15ft wall, width 3ft
    expect(door.xPx).toBeGreaterThan(0);
    expect(door.widthPx).toBeGreaterThan(0);

    const window = result.items[1];
    expect(window.kind).toBe("window");
    expect(window.xPx).toBeGreaterThan(door.xPx + door.widthPx);
  });

  it("returns empty items when wall has none", () => {
    const empty: Wall = { id: "west", lengthFt: 10, heightFt: 10, items: [] };
    const result = computeWallSketch(empty, { widthPx: 600, paddingPx: 30 });
    expect(result.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- wall-sketch`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/lighting-agent/wall-sketch.ts`**

```typescript
import type { Wall, WallItem } from "./types";

interface SketchOpts {
  widthPx: number;
  paddingPx: number;
}

export interface SketchedItem {
  kind: WallItem["kind"];
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
  positionFromLeftFt: number;
  widthFt: number;
}

export interface WallSketch {
  outline: { widthPx: number; heightPx: number; paddingPx: number };
  items: SketchedItem[];
  scale: number; // px per ft
}

export function computeWallSketch(wall: Wall, opts: SketchOpts): WallSketch {
  const drawableWidth = opts.widthPx - 2 * opts.paddingPx;
  const scale = drawableWidth / wall.lengthFt;
  const outlineHeight = wall.heightFt * scale;

  const items: SketchedItem[] = wall.items.map(item => {
    const heightFt = item.heightFt ?? wall.heightFt * 0.4;
    return {
      kind: item.kind,
      xPx: opts.paddingPx + item.positionFromLeftFt * scale,
      // Items are positioned vertically — door at the floor, window mid-height, art ~5-6ft up
      // For prototype, use simple heuristic by kind
      yPx: itemBaselineYPx(item.kind, opts.paddingPx, outlineHeight, heightFt, scale),
      widthPx: item.widthFt * scale,
      heightPx: heightFt * scale,
      positionFromLeftFt: item.positionFromLeftFt,
      widthFt: item.widthFt,
    };
  });

  return {
    outline: { widthPx: drawableWidth, heightPx: outlineHeight, paddingPx: opts.paddingPx },
    items,
    scale,
  };
}

function itemBaselineYPx(
  kind: WallItem["kind"],
  paddingPx: number,
  wallHeightPx: number,
  itemHeightPx: number,
  scale: number,
): number {
  // y measured from top of svg, with padding above
  // Door / shelf / console / sideboard / built_in / tv: from floor
  // Window: mid-height (typical sill at 3ft)
  // Art / mirror: ~5ft from floor
  const floorY = paddingPx + wallHeightPx;
  if (kind === "door" || kind === "shelf" || kind === "console" || kind === "sideboard" || kind === "built_in") {
    return floorY - itemHeightPx;
  }
  if (kind === "tv") {
    return floorY - 5 * scale; // TV centered around 5ft
  }
  if (kind === "window") {
    return floorY - 3 * scale - itemHeightPx; // sill at 3ft
  }
  if (kind === "art" || kind === "mirror") {
    return floorY - 5 * scale - itemHeightPx; // hung centered around 5ft
  }
  return floorY - itemHeightPx;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- wall-sketch`
Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/lighting-agent/wall-sketch.ts tests/lighting-agent/wall-sketch.test.ts
git commit -m "feat(lighting-agent): computeWallSketch — pure layout for live wall preview"
```

---

### Task 5: RCP top-down layout utility (TDD)

**Files:**
- Create: `lib/lighting-agent/rcp.ts`
- Create: `tests/lighting-agent/rcp.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lighting-agent/rcp.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeRCPLayout } from "@/lib/lighting-agent/rcp";
import { demoRoom, demoFixtures } from "@/lib/lighting-agent/demo-data";

describe("computeRCPLayout", () => {
  it("returns room outline scaled to canvas", () => {
    const result = computeRCPLayout(demoRoom, demoFixtures, { widthPx: 800, paddingPx: 40 });
    expect(result.outline.widthPx).toBeGreaterThan(0);
    expect(result.outline.heightPx).toBeGreaterThan(0);
    // 15ft × 12ft room — width should be larger
    expect(result.outline.widthPx).toBeGreaterThan(result.outline.heightPx);
  });

  it("places only ceiling-mounted fixtures on the RCP", () => {
    const result = computeRCPLayout(demoRoom, demoFixtures, { widthPx: 800, paddingPx: 40 });
    // Downlights (DL-*), spots (S-*), pendant (P-01), cove (C-01) all ceiling-mounted
    // Wall sconce W-01, picture lights PL-*, table lamp T-01 are NOT on RCP
    const tags = result.fixtures.map(f => f.tag);
    expect(tags).toContain("DL-01");
    expect(tags).toContain("P-01");
    expect(tags).toContain("S-01");
    expect(tags).not.toContain("W-01");
    expect(tags).not.toContain("PL-01");
    expect(tags).not.toContain("T-01");
  });

  it("draws walls with door and window openings marked", () => {
    const result = computeRCPLayout(demoRoom, demoFixtures, { widthPx: 800, paddingPx: 40 });
    expect(result.openings.length).toBeGreaterThan(0);
    const door = result.openings.find(o => o.kind === "door");
    expect(door).toBeDefined();
    const window = result.openings.find(o => o.kind === "window");
    expect(window).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- rcp`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/lighting-agent/rcp.ts`**

```typescript
import type { Room, Fixture, WallId } from "./types";

interface RCPOpts {
  widthPx: number;
  paddingPx: number;
}

export interface PlacedFixture {
  tag: string;
  xPx: number;
  yPx: number;
  category: string;
  layer: Fixture["layer"];
  mounting: Fixture["mounting"];
}

export interface RCPOpening {
  kind: "door" | "window";
  wall: WallId;
  startPx: { x: number; y: number };
  endPx: { x: number; y: number };
}

export interface RCPLayout {
  outline: { widthPx: number; heightPx: number; paddingPx: number };
  scale: number; // px per ft
  fixtures: PlacedFixture[];
  openings: RCPOpening[];
}

const CEILING_MOUNTINGS: ReadonlyArray<Fixture["mounting"]> = [
  "recessed_ceiling",
  "surface_ceiling",
  "suspended",
  "cove",
  "track",
];

export function computeRCPLayout(room: Room, fixtures: Fixture[], opts: RCPOpts): RCPLayout {
  const drawableWidth = opts.widthPx - 2 * opts.paddingPx;
  const scale = drawableWidth / room.lengthFt;
  const outlineHeight = room.widthFt * scale;

  const fixturesOnCeiling = fixtures.filter(f => CEILING_MOUNTINGS.includes(f.mounting));
  const fixturesWithPos = fixturesOnCeiling.filter(f => f.positionOnRcp);

  const placed: PlacedFixture[] = fixturesWithPos.map(f => ({
    tag: f.tag,
    xPx: opts.paddingPx + f.positionOnRcp!.xFt * scale,
    yPx: opts.paddingPx + f.positionOnRcp!.yFt * scale,
    category: f.category,
    layer: f.layer,
    mounting: f.mounting,
  }));

  // Cove fixtures: don't have positions; rendered as a perimeter glow effect
  // The component will detect cove and draw a perimeter line — no point placement here.

  const openings: RCPOpening[] = [];

  for (const wallId of ["north", "east", "south", "west"] as WallId[]) {
    const wall = room.walls[wallId];
    for (const item of wall.items) {
      if (item.kind !== "door" && item.kind !== "window") continue;
      const start = wallPointToRcp(wallId, item.positionFromLeftFt, room, scale, opts.paddingPx);
      const end = wallPointToRcp(wallId, item.positionFromLeftFt + item.widthFt, room, scale, opts.paddingPx);
      openings.push({ kind: item.kind, wall: wallId, startPx: start, endPx: end });
    }
  }

  return {
    outline: { widthPx: drawableWidth, heightPx: outlineHeight, paddingPx: opts.paddingPx },
    scale,
    fixtures: placed,
    openings,
  };
}

function wallPointToRcp(
  wall: WallId,
  ft: number,
  room: Room,
  scale: number,
  pad: number,
): { x: number; y: number } {
  // Convention: viewer looks down at the room from above.
  // North wall = top of canvas, runs left→right along increasing X.
  // East wall = right of canvas, runs top→bottom along increasing Y.
  // South wall = bottom, runs right→left.
  // West wall = left, runs bottom→top.
  switch (wall) {
    case "north":
      return { x: pad + ft * scale, y: pad };
    case "east":
      return { x: pad + room.lengthFt * scale, y: pad + ft * scale };
    case "south":
      return { x: pad + (room.lengthFt - ft) * scale, y: pad + room.widthFt * scale };
    case "west":
      return { x: pad, y: pad + (room.widthFt - ft) * scale };
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- rcp`
Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/lighting-agent/rcp.ts tests/lighting-agent/rcp.test.ts
git commit -m "feat(lighting-agent): computeRCPLayout — fixtures + wall openings projected to top-down view"
```

---

### Task 6: Fixture lookup helpers (TDD)

**Files:**
- Create: `lib/lighting-agent/fixtures.ts`
- Create: `tests/lighting-agent/fixtures.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lighting-agent/fixtures.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { groupByLayer, fixturesForWall, totalWattage } from "@/lib/lighting-agent/fixtures";
import { demoFixtures } from "@/lib/lighting-agent/demo-data";

describe("fixture helpers", () => {
  it("groups by layer", () => {
    const grouped = groupByLayer(demoFixtures);
    expect(Object.keys(grouped)).toEqual(expect.arrayContaining(["ambient", "accent", "decorative"]));
    expect(grouped.ambient.length).toBeGreaterThan(0);
    expect(grouped.decorative.some(f => f.tag === "P-01")).toBe(true);
  });

  it("returns wall-mounted fixtures for a given wall", () => {
    const northWall = fixturesForWall(demoFixtures, "north");
    expect(northWall.some(f => f.tag === "W-01")).toBe(true);
    expect(northWall.some(f => f.tag === "PL-01")).toBe(true);
    const eastWall = fixturesForWall(demoFixtures, "east");
    expect(eastWall.length).toBe(0);
  });

  it("totals wattage across all fixtures including quantity multiplier", () => {
    const total = totalWattage(demoFixtures);
    // 6 × 12 (DL) + 40 (P-01) + 14 × 10 (cove, with qty=14 representing meters) + 5 + 5 + 7 + 7 + 8 + 6
    expect(total).toBeGreaterThan(0);
    expect(typeof total).toBe("number");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- fixtures`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/lighting-agent/fixtures.ts`**

```typescript
import type { Fixture, LightingLayer, WallId } from "./types";

export function groupByLayer(fixtures: Fixture[]): Record<LightingLayer, Fixture[]> {
  const empty: Record<LightingLayer, Fixture[]> = { ambient: [], task: [], accent: [], decorative: [] };
  return fixtures.reduce((acc, f) => {
    acc[f.layer].push(f);
    return acc;
  }, empty);
}

export function fixturesForWall(fixtures: Fixture[], wall: WallId): Fixture[] {
  return fixtures.filter(f => f.wallId === wall);
}

export function totalWattage(fixtures: Fixture[]): number {
  return fixtures.reduce((s, f) => s + f.wattage * f.quantity, 0);
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- fixtures`
Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/lighting-agent/fixtures.ts tests/lighting-agent/fixtures.test.ts
git commit -m "feat(lighting-agent): fixture helpers (groupByLayer, fixturesForWall, totalWattage)"
```

---

### Task 7: Scripted chat responses

**Files:**
- Create: `lib/lighting-agent/scripted-chat.ts`

(No tests — pure data file.)

- [ ] **Step 1: Create `lib/lighting-agent/scripted-chat.ts`**

```typescript
import type { Fixture } from "./types";

export interface ChatTurn {
  role: "user" | "agent";
  message: string;
  alternates?: { tag: string; description: string; priceInr: number; imagePath?: string }[];
}

export const scriptedConversations: Record<string, ChatTurn[]> = {
  "alt-pendant": [
    { role: "user", message: "Show me other pendant options for the coffee table." },
    {
      role: "agent",
      message: "Here are three alternates in your warm-mid range that fit the brass cluster vibe — want me to render any of them in your room?",
      alternates: [
        { tag: "ALT-P-1", description: "Delhi Brass 7-arm sputnik, smaller scale", priceInr: 24000, imagePath: "/lighting-agent/alts/pendant-1.jpg" },
        { tag: "ALT-P-2", description: "Delhi Brass beaded chandelier, warmer feel", priceInr: 32000, imagePath: "/lighting-agent/alts/pendant-2.jpg" },
        { tag: "ALT-P-3", description: "Delhi Brass linear pendant, modern", priceInr: 27000, imagePath: "/lighting-agent/alts/pendant-3.jpg" },
      ],
    },
  ],
  "warmer-mood": [
    { role: "user", message: "Can we make the room a bit warmer overall?" },
    {
      role: "agent",
      message: "Yep — I'd shift the downlights from 3000K to 2700K, drop the cove driver to 2700K (it already is), and keep all decoratives at 2700K. Across the home this also matches your living spaces. Want me to update the plan?",
    },
  ],
  "drop-cove": [
    { role: "user", message: "My contractor says we don't have enough ceiling drop for the cove. Can we remove it?" },
    {
      role: "agent",
      message: "Absolutely. Removing C-01 means we lean more on the downlights for evening ambient — I'd suggest leaving them all dimmable to compensate. BOQ drops by about ₹16,800. Updated plan ready — want to see it?",
    },
  ],
  "what-about-elderly": [
    { role: "user", message: "If my parents (70s) are using this room, what changes?" },
    {
      role: "agent",
      message: "Three changes I'd make: (1) bump ambient target from ~200 lx to ~300 lx — add 2 more downlights or upgrade to 15W. (2) Add a stronger task light by the sofa (currently the table lamp is 6W; recommend 10W with good glare control). (3) Avoid the cinema-low scene as a default — keep the cove on at 40% even in dim modes. I can regenerate with these adjustments.",
    },
  ],
};

export const chatSuggestionChips = [
  { id: "alt-pendant", label: "Show alternate pendants" },
  { id: "warmer-mood", label: "Make it warmer" },
  { id: "drop-cove", label: "Remove cove lighting" },
  { id: "what-about-elderly", label: "What if elderly use this room?" },
];
```

- [ ] **Step 2: Commit**

```bash
git add lib/lighting-agent/scripted-chat.ts
git commit -m "feat(lighting-agent): scripted chat turns + suggestion chips for iteration demo"
```

---

### Task 8: Prototype layout + landing page

**Files:**
- Create: `app/lighting-agent/layout.tsx`
- Create: `app/lighting-agent/page.tsx`
- Create: `app/lighting-agent/components/StepNav.tsx`

- [ ] **Step 1: Create `app/lighting-agent/layout.tsx`**

```tsx
import type { ReactNode } from "react";

export default function LightingAgentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-100">
      <header className="border-b border-stone-800 px-6 py-4">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Nectar Viz</div>
        <div className="text-lg font-light tracking-tight">AI Lighting Consultant</div>
      </header>
      <main className="px-6 py-8 max-w-3xl mx-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/lighting-agent/components/StepNav.tsx`**

```tsx
"use client";

export interface Step {
  href: string;
  label: string;
}

export const PROTO_STEPS: Step[] = [
  { href: "/lighting-agent/home-profile", label: "Home Profile" },
  { href: "/lighting-agent/room-basics", label: "Room Basics" },
  { href: "/lighting-agent/wall/north", label: "Wall 1" },
  { href: "/lighting-agent/wall/east", label: "Wall 2" },
  { href: "/lighting-agent/wall/south", label: "Wall 3" },
  { href: "/lighting-agent/wall/west", label: "Wall 4" },
  { href: "/lighting-agent/furniture", label: "Furniture" },
  { href: "/lighting-agent/brief", label: "Brief" },
  { href: "/lighting-agent/generating", label: "Generating" },
  { href: "/lighting-agent/pack", label: "Lighting Pack" },
];

export function StepNav({ currentHref }: { currentHref: string }) {
  const currentIndex = PROTO_STEPS.findIndex(s => s.href === currentHref);
  return (
    <nav className="flex items-center gap-1 text-xs text-stone-500 mb-6">
      {PROTO_STEPS.map((s, i) => (
        <div key={s.href} className="flex items-center">
          <span className={i === currentIndex ? "text-amber-200" : i < currentIndex ? "text-stone-400" : ""}>
            {s.label}
          </span>
          {i < PROTO_STEPS.length - 1 && <span className="mx-2 text-stone-700">›</span>}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Create `app/lighting-agent/page.tsx`**

```tsx
import Link from "next/link";

export default function LightingAgentLandingPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Prototype</div>
        <h1 className="text-3xl font-light tracking-tight">Light your room with an AI consultant</h1>
        <p className="text-stone-400 leading-relaxed">
          Tell us about your room — its dimensions, your walls, your furniture, your life — and we&apos;ll design a complete lighting plan with renders, a fixture schedule, and a costed BOQ. Layered, considered, photoreal.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="border border-stone-800 rounded-md p-5 space-y-2">
          <div className="text-sm uppercase tracking-wider text-amber-200/80">Renders</div>
          <p className="text-sm text-stone-400">See your room transformed at three times of day — morning, evening, dramatic.</p>
        </div>
        <div className="border border-stone-800 rounded-md p-5 space-y-2">
          <div className="text-sm uppercase tracking-wider text-amber-200/80">Technical pack</div>
          <p className="text-sm text-stone-400">Reflected ceiling plan, fixture schedule, switching diagram, BOQ — share with your electrician.</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Link href="/lighting-agent/home-profile" className="inline-flex items-center gap-2 bg-amber-200 text-stone-900 px-5 py-3 rounded-md font-medium hover:bg-amber-100 transition">
          Start your consult →
        </Link>
        <p className="text-xs text-stone-600">~10 minutes. No floor plan needed.</p>
      </div>

      <div className="border-t border-stone-800 pt-6 text-xs text-stone-600 leading-relaxed">
        Prototype mode: this walkthrough is for a single hardcoded demo room (12 × 15 ft living room). Real consultations come in v1.
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify renders**

Run: `npm run dev`
Visit: `http://localhost:3000/lighting-agent`
Expected: dark page, "Start your consult" CTA, no errors.

- [ ] **Step 5: Commit**

```bash
git add app/lighting-agent/
git commit -m "feat(lighting-agent): landing page + layout + step nav scaffolding"
```

---

### Task 9: Home Profile screen

**Files:**
- Create: `app/lighting-agent/home-profile/page.tsx`
- Create: `app/lighting-agent/components/AnswerOption.tsx`

- [ ] **Step 1: Create `app/lighting-agent/components/AnswerOption.tsx`**

```tsx
"use client";

import { useState } from "react";

interface Props {
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function AnswerOption({ label, description, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border rounded-md p-4 transition w-full ${
        selected ? "border-amber-200 bg-amber-200/5" : "border-stone-800 hover:border-stone-600"
      }`}
    >
      <div className="text-sm font-medium">{label}</div>
      {description && <div className="text-xs text-stone-500 mt-1">{description}</div>}
    </button>
  );
}

// Simple stateful multi-select option group
export function OptionGroup({
  options,
  multi = false,
}: {
  options: { id: string; label: string; description?: string }[];
  multi?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => {
    if (multi) {
      setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
    } else {
      setSelected([id]);
    }
  };
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map(o => (
        <AnswerOption
          key={o.id}
          label={o.label}
          description={o.description}
          selected={selected.includes(o.id)}
          onClick={() => toggle(o.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/lighting-agent/home-profile/page.tsx`**

```tsx
import Link from "next/link";
import { StepNav } from "../components/StepNav";
import { OptionGroup } from "../components/AnswerOption";

export default function HomeProfilePage() {
  return (
    <div className="space-y-8">
      <StepNav currentHref="/lighting-agent/home-profile" />

      <div className="space-y-2">
        <h1 className="text-2xl font-light tracking-tight">First, a quick home profile</h1>
        <p className="text-stone-400 text-sm">Captured once. Applies to every room we design for you.</p>
      </div>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">House type</div>
        <OptionGroup
          options={[
            { id: "apartment", label: "Apartment" },
            { id: "builder_floor", label: "Builder floor" },
            { id: "villa", label: "Villa" },
            { id: "standalone", label: "Standalone home" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Stage of construction</div>
        <OptionGroup
          options={[
            { id: "new_build", label: "New build", description: "Wiring not done yet" },
            { id: "mid_renovation", label: "Mid renovation", description: "Some flexibility on points" },
            { id: "lived_in", label: "Lived in", description: "Working with what exists" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Smart home interest</div>
        <OptionGroup
          options={[
            { id: "yes", label: "Yes — dimming, scenes, voice control" },
            { id: "maybe", label: "Maybe later — keep wiring smart-ready" },
            { id: "no", label: "Not interested — keep it simple" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Preferred ambient warmth</div>
        <OptionGroup
          options={[
            { id: "warm_2700", label: "Warm (2700K)", description: "Cozy, golden, restful" },
            { id: "neutral_3000", label: "Neutral (3000K)", description: "Balanced, contemporary" },
            { id: "mixed", label: "Mixed by room", description: "Warmer in lounges, cooler in kitchen" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Budget tier (architectural fixtures)</div>
        <OptionGroup
          options={[
            { id: "budget", label: "Budget", description: "Goldmedal, Polycab range" },
            { id: "mid", label: "Mid", description: "Wipro Garnet, Crompton" },
            { id: "premium", label: "Premium", description: "Philips, Schneider" },
            { id: "luxury", label: "Luxury", description: "Astera, imported" },
          ]}
        />
      </section>

      <div className="flex justify-between pt-6 border-t border-stone-800">
        <Link href="/lighting-agent" className="text-sm text-stone-500 hover:text-stone-300">← Back</Link>
        <Link href="/lighting-agent/room-basics" className="bg-amber-200 text-stone-900 px-5 py-2 rounded-md text-sm font-medium hover:bg-amber-100 transition">
          Continue →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Visit: `http://localhost:3000/lighting-agent/home-profile`
Expected: 5 question sections, selecting options highlights them, Continue link to /room-basics.

- [ ] **Step 4: Commit**

```bash
git add app/lighting-agent/home-profile/ app/lighting-agent/components/AnswerOption.tsx
git commit -m "feat(lighting-agent): Home Profile screen with selectable option cards"
```

---

### Task 10: Room Basics screen

**Files:**
- Create: `app/lighting-agent/room-basics/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import Link from "next/link";
import { StepNav } from "../components/StepNav";
import { OptionGroup } from "../components/AnswerOption";

export default function RoomBasicsPage() {
  return (
    <div className="space-y-8">
      <StepNav currentHref="/lighting-agent/room-basics" />

      <div className="space-y-2">
        <h1 className="text-2xl font-light tracking-tight">About this room</h1>
        <p className="text-stone-400 text-sm">Tell us what you&apos;re lighting and roughly how big it is.</p>
      </div>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Room type</div>
        <OptionGroup
          options={[
            { id: "living_tv", label: "Living / TV room" },
            { id: "drawing", label: "Drawing / formal living" },
            { id: "dining", label: "Dining room" },
            { id: "bedroom", label: "Bedroom" },
            { id: "kitchen", label: "Kitchen" },
            { id: "study", label: "Study / WFH" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Dimensions</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Length (ft)", value: "15" },
            { label: "Width (ft)", value: "12" },
            { label: "Ceiling (ft)", value: "10" },
          ].map(f => (
            <label key={f.label} className="block">
              <div className="text-xs text-stone-500 mb-1">{f.label}</div>
              <input
                type="number"
                defaultValue={f.value}
                className="w-full bg-stone-900 border border-stone-800 rounded-md px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-stone-600">Prototype: dimensions hardcoded for the demo room.</p>
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Ceiling type</div>
        <OptionGroup
          options={[
            { id: "false", label: "False ceiling" },
            { id: "flat", label: "Flat (no false ceiling)" },
            { id: "sloped", label: "Sloped" },
            { id: "mixed", label: "Mixed" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Main window faces</div>
        <OptionGroup
          options={[
            { id: "N", label: "North" },
            { id: "S", label: "South" },
            { id: "E", label: "East", description: "Morning sun" },
            { id: "W", label: "West", description: "Evening sun" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Who uses this room?</div>
        <OptionGroup
          multi
          options={[
            { id: "kids", label: "Kids" },
            { id: "young_adult", label: "Teen / young adult" },
            { id: "adult", label: "Adult (30s–50s)" },
            { id: "elderly", label: "Elderly", description: "Higher lux + glare control" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Floor + wall finish</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-stone-500 mb-2">Floor</div>
            <OptionGroup
              options={[
                { id: "light", label: "Light" },
                { id: "mid", label: "Mid" },
                { id: "dark", label: "Dark" },
              ]}
            />
          </div>
          <div>
            <div className="text-xs text-stone-500 mb-2">Walls</div>
            <OptionGroup
              options={[
                { id: "light", label: "Light" },
                { id: "mid", label: "Mid" },
                { id: "dark", label: "Dark" },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-between pt-6 border-t border-stone-800">
        <Link href="/lighting-agent/home-profile" className="text-sm text-stone-500 hover:text-stone-300">← Back</Link>
        <Link href="/lighting-agent/wall/north" className="bg-amber-200 text-stone-900 px-5 py-2 rounded-md text-sm font-medium hover:bg-amber-100 transition">
          Continue to walls →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser, then commit**

```bash
git add app/lighting-agent/room-basics/
git commit -m "feat(lighting-agent): Room Basics screen (type, dims, ceiling, orientation, occupants, finishes)"
```

---

### Task 11: Wall-by-wall screen with live SVG sketch

This is the heart of the prototype. One page, parameterized by wall id, renders the live sketch as items are selected.

**Files:**
- Create: `app/lighting-agent/wall/[wall]/page.tsx`
- Create: `app/lighting-agent/components/WallSketchSVG.tsx`

- [ ] **Step 1: Create the SVG component**

```tsx
"use client";

import type { Wall } from "@/lib/lighting-agent/types";
import { computeWallSketch } from "@/lib/lighting-agent/wall-sketch";

const FILL_BY_KIND: Record<string, string> = {
  door: "#7c5e3c",
  window: "#a8c5d4",
  tv: "#1c1c1c",
  art: "#c9a87a",
  mirror: "#d7d7d7",
  shelf: "#5b3f24",
  console: "#3e2a18",
  sideboard: "#3e2a18",
  built_in: "#5b3f24",
};

export function WallSketchSVG({ wall }: { wall: Wall }) {
  const sketch = computeWallSketch(wall, { widthPx: 600, paddingPx: 30 });
  const totalHeight = sketch.outline.heightPx + 60;

  return (
    <svg
      viewBox={`0 0 600 ${totalHeight}`}
      className="w-full border border-stone-800 rounded-md bg-stone-950"
      role="img"
      aria-label={`Sketch of ${wall.id} wall`}
    >
      {/* Floor line */}
      <line
        x1={sketch.outline.paddingPx}
        y1={sketch.outline.paddingPx + sketch.outline.heightPx}
        x2={sketch.outline.paddingPx + sketch.outline.widthPx}
        y2={sketch.outline.paddingPx + sketch.outline.heightPx}
        stroke="#666"
        strokeWidth={1}
      />
      {/* Wall outline */}
      <rect
        x={sketch.outline.paddingPx}
        y={sketch.outline.paddingPx}
        width={sketch.outline.widthPx}
        height={sketch.outline.heightPx}
        fill="none"
        stroke="#444"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {sketch.items.map((item, i) => (
        <g key={i}>
          <rect
            x={item.xPx}
            y={item.yPx}
            width={item.widthPx}
            height={item.heightPx}
            fill={FILL_BY_KIND[item.kind] ?? "#888"}
            opacity={0.85}
          />
          <text
            x={item.xPx + item.widthPx / 2}
            y={item.yPx + item.heightPx / 2 + 4}
            fontSize={9}
            fill="#fff"
            textAnchor="middle"
            opacity={0.85}
          >
            {item.kind}
          </text>
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Create the wall page**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { StepNav } from "../../components/StepNav";
import { WallSketchSVG } from "../../components/WallSketchSVG";
import { demoRoom } from "@/lib/lighting-agent/demo-data";
import type { WallId } from "@/lib/lighting-agent/types";

const WALL_ORDER: WallId[] = ["north", "east", "south", "west"];
const WALL_LABELS: Record<WallId, string> = {
  north: "Wall 1: Front wall (with door)",
  east: "Wall 2: Window wall",
  south: "Wall 3: TV wall",
  west: "Wall 4: Art wall",
};

export default async function WallPage({ params }: { params: Promise<{ wall: string }> }) {
  const { wall: wallParam } = await params;
  if (!WALL_ORDER.includes(wallParam as WallId)) notFound();
  const wallId = wallParam as WallId;
  const idx = WALL_ORDER.indexOf(wallId);
  const wall = demoRoom.walls[wallId];

  const nextHref = idx < WALL_ORDER.length - 1 ? `/lighting-agent/wall/${WALL_ORDER[idx + 1]}` : "/lighting-agent/furniture";
  const backHref = idx > 0 ? `/lighting-agent/wall/${WALL_ORDER[idx - 1]}` : "/lighting-agent/room-basics";

  return (
    <div className="space-y-6">
      <StepNav currentHref={`/lighting-agent/wall/${wallId}`} />

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">{idx + 1} of 4</div>
        <h1 className="text-2xl font-light tracking-tight">{WALL_LABELS[wallId]}</h1>
        <p className="text-stone-400 text-sm">Tell us what&apos;s on this wall. We&apos;ll sketch it live.</p>
      </div>

      <WallSketchSVG wall={wall} />

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">What&apos;s on this wall? (prototype: shown above)</div>
        <ul className="text-sm text-stone-300 space-y-1">
          {wall.items.map((item, i) => (
            <li key={i} className="flex justify-between border border-stone-800 rounded-md px-3 py-2">
              <span className="capitalize">{item.kind.replace("_", " ")}</span>
              <span className="text-stone-500 text-xs">
                {item.positionFromLeftFt} ft from left · {item.widthFt} ft wide
                {item.notes ? ` · ${item.notes}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-600">In v1, users tap to add doors, windows, TV, art etc., and the sketch updates live.</p>
      </section>

      <div className="flex justify-between pt-6 border-t border-stone-800">
        <Link href={backHref} className="text-sm text-stone-500 hover:text-stone-300">← Back</Link>
        <Link href={nextHref} className="bg-amber-200 text-stone-900 px-5 py-2 rounded-md text-sm font-medium hover:bg-amber-100 transition">
          {idx < WALL_ORDER.length - 1 ? "Next wall →" : "Continue to furniture →"}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify all four walls render**

Run: `npm run dev`
Visit each of `/lighting-agent/wall/north`, `/east`, `/south`, `/west`.
Expected: SVG sketch renders with door/window/art etc. positioned, list shows below.

- [ ] **Step 4: Commit**

```bash
git add app/lighting-agent/wall/ app/lighting-agent/components/WallSketchSVG.tsx
git commit -m "feat(lighting-agent): wall-by-wall screen + live SVG wall sketch component"
```

---

### Task 12: Furniture placement screen

**Files:**
- Create: `app/lighting-agent/furniture/page.tsx`
- Create: `app/lighting-agent/components/FurniturePlanSVG.tsx`

- [ ] **Step 1: Create `FurniturePlanSVG.tsx`**

```tsx
"use client";

import type { Room } from "@/lib/lighting-agent/types";

const PADDING = 30;
const CANVAS_WIDTH = 600;

const FURN_FILL: Record<string, string> = {
  sofa: "#5b3f24",
  armchair: "#7c5e3c",
  coffee_table: "#3e2a18",
  side_table: "#3e2a18",
  tv_console: "#1c1c1c",
  bookshelf: "#5b3f24",
  dining_table: "#3e2a18",
  bed: "#5b3f24",
};

export function FurniturePlanSVG({ room }: { room: Room }) {
  const scale = (CANVAS_WIDTH - 2 * PADDING) / room.lengthFt;
  const roomHeightPx = room.widthFt * scale;
  const totalHeight = roomHeightPx + 2 * PADDING;

  return (
    <svg
      viewBox={`0 0 ${CANVAS_WIDTH} ${totalHeight}`}
      className="w-full border border-stone-800 rounded-md bg-stone-950"
      role="img"
      aria-label="Top-down furniture plan"
    >
      <rect
        x={PADDING}
        y={PADDING}
        width={CANVAS_WIDTH - 2 * PADDING}
        height={roomHeightPx}
        fill="none"
        stroke="#444"
        strokeWidth={1.5}
      />
      {room.furniture.map((f, i) => (
        <g key={i}>
          <rect
            x={PADDING + f.positionXFt * scale - (f.widthFt * scale) / 2}
            y={PADDING + f.positionYFt * scale - (f.depthFt * scale) / 2}
            width={f.widthFt * scale}
            height={f.depthFt * scale}
            fill={FURN_FILL[f.kind] ?? "#888"}
            opacity={0.85}
          />
          <text
            x={PADDING + f.positionXFt * scale}
            y={PADDING + f.positionYFt * scale + 4}
            fontSize={9}
            fill="#fff"
            textAnchor="middle"
            opacity={0.85}
          >
            {f.label ?? f.kind.replace("_", " ")}
          </text>
        </g>
      ))}
      <text x={PADDING} y={PADDING - 8} fontSize={10} fill="#888">N</text>
      <text x={CANVAS_WIDTH - PADDING + 8} y={PADDING + roomHeightPx / 2} fontSize={10} fill="#888">E</text>
    </svg>
  );
}
```

- [ ] **Step 2: Create `app/lighting-agent/furniture/page.tsx`**

```tsx
import Link from "next/link";
import { StepNav } from "../components/StepNav";
import { FurniturePlanSVG } from "../components/FurniturePlanSVG";
import { demoRoom } from "@/lib/lighting-agent/demo-data";

export default function FurniturePage() {
  return (
    <div className="space-y-6">
      <StepNav currentHref="/lighting-agent/furniture" />

      <div className="space-y-2">
        <h1 className="text-2xl font-light tracking-tight">Furniture layout</h1>
        <p className="text-stone-400 text-sm">Where the big pieces sit. Drives where pendants hang, where task lights go.</p>
      </div>

      <FurniturePlanSVG room={demoRoom} />

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Pieces in this room</div>
        <ul className="text-sm text-stone-300 space-y-1">
          {demoRoom.furniture.map((f, i) => (
            <li key={i} className="flex justify-between border border-stone-800 rounded-md px-3 py-2">
              <span className="capitalize">{f.label ?? f.kind.replace("_", " ")}</span>
              <span className="text-stone-500 text-xs">{f.widthFt} × {f.depthFt} ft</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-600">In v1, drag and drop pieces onto the grid. Optional floor plan upload bypasses this entirely.</p>
      </section>

      <div className="flex justify-between pt-6 border-t border-stone-800">
        <Link href="/lighting-agent/wall/west" className="text-sm text-stone-500 hover:text-stone-300">← Back</Link>
        <Link href="/lighting-agent/brief" className="bg-amber-200 text-stone-900 px-5 py-2 rounded-md text-sm font-medium hover:bg-amber-100 transition">
          Continue →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add app/lighting-agent/furniture/ app/lighting-agent/components/FurniturePlanSVG.tsx
git commit -m "feat(lighting-agent): furniture top-down plan + screen"
```

---

### Task 13: Lifestyle brief + constraints screen

**Files:**
- Create: `app/lighting-agent/brief/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import Link from "next/link";
import { StepNav } from "../components/StepNav";
import { OptionGroup } from "../components/AnswerOption";

export default function BriefPage() {
  return (
    <div className="space-y-8">
      <StepNav currentHref="/lighting-agent/brief" />

      <div className="space-y-2">
        <h1 className="text-2xl font-light tracking-tight">Last few questions</h1>
        <p className="text-stone-400 text-sm">Lifestyle + constraints. Then we get to work.</p>
      </div>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">What happens in this room?</div>
        <OptionGroup
          multi
          options={[
            { id: "lounging", label: "Lounging / relaxing" },
            { id: "tv", label: "Watching TV / movies" },
            { id: "entertaining", label: "Hosting guests" },
            { id: "reading", label: "Reading" },
            { id: "wfh", label: "Working from home" },
            { id: "playing", label: "Kids playing" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Mood</div>
        <OptionGroup
          options={[
            { id: "cozy", label: "Cozy", description: "Soft, warm, restful" },
            { id: "bright", label: "Bright", description: "Energetic, clear" },
            { id: "dramatic", label: "Dramatic", description: "Layered, moody, accent-heavy" },
            { id: "mixed", label: "Mixed", description: "Different vibes at different times" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Primary usage time</div>
        <OptionGroup
          options={[
            { id: "morning", label: "Mornings" },
            { id: "evening", label: "Evenings" },
            { id: "mixed", label: "Mixed throughout the day" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Any constraints?</div>
        <OptionGroup
          multi
          options={[
            { id: "rented", label: "Rented property" },
            { id: "no_false_ceiling", label: "No false ceiling possible" },
            { id: "existing_wiring", label: "Existing wiring (can't change)" },
            { id: "heritage", label: "Heritage building" },
            { id: "none", label: "None of the above" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Anything else? (Optional)</div>
        <textarea
          placeholder="e.g. 'I want to highlight a specific painting on the west wall' or 'no exposed downlights please'"
          rows={3}
          className="w-full bg-stone-900 border border-stone-800 rounded-md px-3 py-2 text-sm placeholder-stone-600"
        />
      </section>

      <div className="flex justify-between pt-6 border-t border-stone-800">
        <Link href="/lighting-agent/furniture" className="text-sm text-stone-500 hover:text-stone-300">← Back</Link>
        <Link href="/lighting-agent/generating" className="bg-amber-200 text-stone-900 px-5 py-2 rounded-md text-sm font-medium hover:bg-amber-100 transition">
          Generate my lighting plan →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
git add app/lighting-agent/brief/
git commit -m "feat(lighting-agent): brief + constraints screen"
```

---

### Task 14: "Agent thinking" transitional screen

**Files:**
- Create: `app/lighting-agent/generating/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "Reading your home profile…",
  "Mapping room geometry and orientation…",
  "Computing ambient lux targets for evening lounging…",
  "Picking decorative fixtures from Delhi Brass and partner catalogs…",
  "Speccing architectural fixtures and selecting brand picks…",
  "Laying out the reflected ceiling plan…",
  "Drafting switching zones and dimming groups…",
  "Composing photoreal renders — day, evening, mood…",
  "Assembling your Lighting Pack…",
];

export default function GeneratingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (stepIndex >= STEPS.length) {
      const t = setTimeout(() => router.push("/lighting-agent/pack"), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStepIndex(i => i + 1), 700);
    return () => clearTimeout(t);
  }, [stepIndex, router]);

  return (
    <div className="space-y-10 py-12 min-h-[60vh] flex flex-col justify-center">
      <div className="space-y-3 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Agent at work</div>
        <h1 className="text-2xl font-light tracking-tight">Designing your room…</h1>
      </div>
      <ul className="max-w-md mx-auto w-full space-y-2">
        {STEPS.map((s, i) => (
          <li
            key={i}
            className={`text-sm transition-opacity duration-300 flex items-center gap-2 ${
              i < stepIndex ? "text-stone-500 line-through" : i === stepIndex ? "text-amber-200" : "text-stone-700"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Visit `/lighting-agent/generating`. After ~7 seconds, should auto-route to `/lighting-agent/pack`.

- [ ] **Step 3: Commit**

```bash
git add app/lighting-agent/generating/
git commit -m "feat(lighting-agent): agent-thinking transitional with animated step log"
```

---

### Task 15: Generate the 3 demo renders (one-off script)

**Files:**
- Create: `scripts/generate-prototype-renders.ts`
- Create: `public/lighting-agent/renders/` (output dir)
- Create: `public/lighting-agent/renders/PLACEHOLDER.md` (until script runs)

- [ ] **Step 1: Create the placeholder so the build doesn't break**

Create `public/lighting-agent/renders/PLACEHOLDER.md`:

```markdown
# Lighting Agent Prototype — Renders

Three scenes generated once by `scripts/generate-prototype-renders.ts`:

- `day.jpg`
- `evening.jpg`
- `mood.jpg`

Until the script is run, the Render Gallery component will show a fallback. Run:

```bash
npx tsx scripts/generate-prototype-renders.ts
```

You need `GEMINI_API_KEY` in `.env.local`.
```

- [ ] **Step 2: Create the script**

```typescript
// scripts/generate-prototype-renders.ts
// One-off: generate the 3 demo room renders and save to public/lighting-agent/renders/.
// Re-run only when the demo room spec changes.

import { GoogleGenAI } from "@google/genai";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const PROMPTS = {
  day:
    "Interior photograph, eye-level, of a 12 by 15 foot Indian apartment living room. Mid-tone wooden floor, off-white walls, false ceiling. Large east-facing window on the right wall, morning sunlight pours in across the floor and a 3-seater sofa. Bookshelf on the left side of that wall. A coffee table sits in the center with two armchairs flanking. A TV console is opposite the sofa. A brass cluster pendant hangs over the coffee table but is OFF. No artificial lights on. Soft natural shadows. Warm but daylight-driven mood. Editorial dark-luxury aesthetic. Photoreal, 35mm, slight grain.",
  evening:
    "Interior photograph, eye-level, of the same 12 by 15 foot Indian apartment living room at evening. Mid-tone wooden floor, off-white walls, false ceiling. The brass cluster pendant over the coffee table is ON, glowing warmly at 2700K. A warm perimeter cove glow softens the ceiling edges. Six recessed downlights cast warm 3000K pools onto the floor and sofa at gentle dimmed intensity. Two picture lights illuminate framed art on the north wall, two more accent the large painting on the west art wall. A brass wall sconce by the door is on. A table lamp on the side table glows softly. Cozy, layered, considered. Editorial dark-luxury aesthetic, photoreal, 35mm.",
  mood:
    "Interior photograph, eye-level, of the same 12 by 15 foot Indian apartment living room — dramatic mood scene. The brass cluster pendant is ON glowing warmly. Cove lighting is on at low intensity. Picture lights and accent spots wash the west art wall — the painting is the visual hero. Downlights are OFF or barely visible. Most of the room is in shadow. The art wall is the brightest area. Cinematic, moody, evening, low-key. Editorial dark-luxury aesthetic, photoreal, 35mm, subtle film grain.",
};

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in environment.");
    process.exit(1);
  }
  const client = new GoogleGenAI({ apiKey });
  const outDir = join(process.cwd(), "public", "lighting-agent", "renders");
  await mkdir(outDir, { recursive: true });

  for (const [scene, prompt] of Object.entries(PROMPTS)) {
    console.log(`Generating ${scene}…`);
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData?.data) {
      console.error(`No image returned for ${scene}`);
      continue;
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    const outPath = join(outDir, `${scene}.jpg`);
    await writeFile(outPath, buffer);
    console.log(`Saved ${outPath}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Run the script**

```bash
npx tsx scripts/generate-prototype-renders.ts
```

If the output of a scene looks off, adjust the prompt and rerun for that scene only (you can comment out the other scenes in PROMPTS). Re-run is cheap.

- [ ] **Step 4: Commit script + generated images**

```bash
git add scripts/generate-prototype-renders.ts public/lighting-agent/renders/
git commit -m "feat(lighting-agent): one-off Gemini script + 3 pre-generated demo renders"
```

---

### Task 16: Lighting Pack — top section (cover + narrative + render gallery)

**Files:**
- Create: `app/lighting-agent/pack/page.tsx` (will grow across tasks 16–18)
- Create: `app/lighting-agent/components/RenderGallery.tsx`

- [ ] **Step 1: Create the RenderGallery component**

```tsx
"use client";

import { useState } from "react";

const SCENES = [
  { id: "day", label: "Day", caption: "Morning, daylight-driven. Artificial lights off." },
  { id: "evening", label: "Evening", caption: "All layers on, dimmable scene." },
  { id: "mood", label: "Mood", caption: "Pendant + accents only. Art wall hero." },
];

export function RenderGallery() {
  const [active, setActive] = useState("evening");
  const scene = SCENES.find(s => s.id === active)!;
  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] bg-stone-900 rounded-md overflow-hidden border border-stone-800">
        <img
          src={`/lighting-agent/renders/${scene.id}.jpg`}
          alt={`${scene.label} scene render`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex gap-2">
        {SCENES.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`flex-1 text-xs uppercase tracking-wider py-2 rounded-md border transition ${
              active === s.id
                ? "border-amber-200 text-amber-200 bg-amber-200/5"
                : "border-stone-800 text-stone-500 hover:border-stone-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-stone-500">{scene.caption}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create the pack page top section**

```tsx
import Link from "next/link";
import { StepNav } from "../components/StepNav";
import { RenderGallery } from "../components/RenderGallery";
import { demoPack } from "@/lib/lighting-agent/demo-data";
import { formatInr } from "@/lib/lighting-agent/boq";
import { totalWattage } from "@/lib/lighting-agent/fixtures";

export default function PackPage() {
  const wattage = totalWattage(demoPack.fixtures);
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <StepNav currentHref="/lighting-agent/pack" />

      <header className="space-y-3 border-b border-stone-800 pb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Your Lighting Pack</div>
        <h1 className="text-3xl font-light tracking-tight">Living / TV Room — 12 × 15 ft</h1>
        <div className="flex gap-6 text-sm text-stone-400 pt-2">
          <div><span className="text-stone-600">Fixtures</span> {demoPack.fixtures.length}</div>
          <div><span className="text-stone-600">Wattage</span> {wattage} W</div>
          <div><span className="text-stone-600">BOQ</span> {formatInr(demoPack.totals.grandTotalInr)}</div>
          <div><span className="text-stone-600">Est. monthly</span> {formatInr(demoPack.totals.estMonthlyEnergyInr)}</div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Renders</div>
        <RenderGallery />
      </section>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Design intent</div>
        <div className="prose prose-invert prose-sm max-w-none text-stone-300 whitespace-pre-line">
          {demoPack.narrative}
        </div>
      </section>

      {/* Sections continued in Task 17–18 */}

      <div className="border-t border-stone-800 pt-6">
        <Link href="/lighting-agent/brief" className="text-sm text-stone-500 hover:text-stone-300">← Back to brief</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the pack page renders so far**

Visit `/lighting-agent/pack`. Should show header stats, render gallery (clicking tabs swaps the image), and narrative text.

- [ ] **Step 4: Commit**

```bash
git add app/lighting-agent/pack/ app/lighting-agent/components/RenderGallery.tsx
git commit -m "feat(lighting-agent): Lighting Pack — cover, narrative, 3-scene render gallery"
```

---

### Task 17: Lighting Pack — layered breakdown + RCP + wall elevations

**Files:**
- Modify: `app/lighting-agent/pack/page.tsx`
- Create: `app/lighting-agent/components/LayeredBreakdown.tsx`
- Create: `app/lighting-agent/components/RCPDiagramSVG.tsx`
- Create: `app/lighting-agent/components/WallElevationSVG.tsx`

- [ ] **Step 1: Create `LayeredBreakdown.tsx`**

```tsx
import { groupByLayer } from "@/lib/lighting-agent/fixtures";
import type { Fixture, LightingLayer } from "@/lib/lighting-agent/types";

const LAYER_LABELS: Record<LightingLayer, string> = {
  ambient: "Ambient",
  task: "Task",
  accent: "Accent",
  decorative: "Decorative",
};

const LAYER_DESCRIPTIONS: Record<LightingLayer, string> = {
  ambient: "General fill light. The first thing on when you walk in.",
  task: "Focused light for an activity — reading, cooking, working.",
  accent: "Highlights art, architecture, materials. Drama.",
  decorative: "Fixtures that are themselves the focal point.",
};

export function LayeredBreakdown({ fixtures }: { fixtures: Fixture[] }) {
  const grouped = groupByLayer(fixtures);
  const layers: LightingLayer[] = ["ambient", "task", "accent", "decorative"];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {layers.map(layer => {
        const items = grouped[layer];
        if (items.length === 0) return null;
        return (
          <div key={layer} className="border border-stone-800 rounded-md p-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-amber-200">{LAYER_LABELS[layer]}</div>
              <div className="text-xs text-stone-500">{LAYER_DESCRIPTIONS[layer]}</div>
            </div>
            <ul className="text-sm text-stone-300 space-y-1.5">
              {items.map(f => (
                <li key={f.tag} className="flex justify-between gap-3">
                  <span>
                    <span className="text-stone-500 mr-2">{f.tag}</span>
                    {f.category}
                  </span>
                  <span className="text-stone-600 text-xs whitespace-nowrap">
                    {f.quantity > 1 ? `${f.quantity} × ` : ""}{f.wattage}W
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `RCPDiagramSVG.tsx`**

```tsx
"use client";

import { computeRCPLayout } from "@/lib/lighting-agent/rcp";
import { demoRoom, demoFixtures } from "@/lib/lighting-agent/demo-data";

const LAYER_COLOR: Record<string, string> = {
  ambient: "#facc15",
  task: "#60a5fa",
  accent: "#f472b6",
  decorative: "#c084fc",
};

export function RCPDiagramSVG() {
  const layout = computeRCPLayout(demoRoom, demoFixtures, { widthPx: 700, paddingPx: 40 });
  const totalH = layout.outline.heightPx + 2 * layout.outline.paddingPx;

  return (
    <svg
      viewBox={`0 0 700 ${totalH}`}
      className="w-full border border-stone-800 rounded-md bg-stone-950"
      role="img"
      aria-label="Reflected ceiling plan top-down"
    >
      <rect
        x={layout.outline.paddingPx}
        y={layout.outline.paddingPx}
        width={layout.outline.widthPx}
        height={layout.outline.heightPx}
        fill="none"
        stroke="#666"
        strokeWidth={1.5}
      />
      {/* Cove perimeter */}
      <rect
        x={layout.outline.paddingPx + 4}
        y={layout.outline.paddingPx + 4}
        width={layout.outline.widthPx - 8}
        height={layout.outline.heightPx - 8}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.6}
      />
      {/* Openings (doors + windows) */}
      {layout.openings.map((o, i) => (
        <line
          key={i}
          x1={o.startPx.x}
          y1={o.startPx.y}
          x2={o.endPx.x}
          y2={o.endPx.y}
          stroke={o.kind === "door" ? "#7c5e3c" : "#a8c5d4"}
          strokeWidth={4}
        />
      ))}
      {/* Fixtures */}
      {layout.fixtures.map(f => (
        <g key={f.tag}>
          <circle cx={f.xPx} cy={f.yPx} r={f.category.includes("Pendant") ? 10 : 7} fill={LAYER_COLOR[f.layer] ?? "#888"} opacity={0.85} />
          <text x={f.xPx} y={f.yPx - 12} fontSize={8} fill="#ccc" textAnchor="middle">{f.tag}</text>
        </g>
      ))}
      {/* Compass */}
      <text x={layout.outline.paddingPx} y={layout.outline.paddingPx - 12} fontSize={9} fill="#666">N (front door)</text>
    </svg>
  );
}
```

- [ ] **Step 3: Create `WallElevationSVG.tsx`**

```tsx
"use client";

import type { WallId } from "@/lib/lighting-agent/types";
import { demoRoom, demoFixtures } from "@/lib/lighting-agent/demo-data";
import { computeWallSketch } from "@/lib/lighting-agent/wall-sketch";
import { fixturesForWall } from "@/lib/lighting-agent/fixtures";

const FILL_BY_KIND: Record<string, string> = {
  door: "#7c5e3c",
  window: "#a8c5d4",
  tv: "#1c1c1c",
  art: "#c9a87a",
  mirror: "#d7d7d7",
  shelf: "#5b3f24",
  console: "#3e2a18",
  sideboard: "#3e2a18",
  built_in: "#5b3f24",
};

export function WallElevationSVG({ wallId }: { wallId: WallId }) {
  const wall = demoRoom.walls[wallId];
  const sketch = computeWallSketch(wall, { widthPx: 600, paddingPx: 30 });
  const fixtures = fixturesForWall(demoFixtures, wallId);
  const totalH = sketch.outline.heightPx + 70;

  return (
    <svg viewBox={`0 0 600 ${totalH}`} className="w-full border border-stone-800 rounded-md bg-stone-950">
      <text x={30} y={20} fontSize={11} fill="#999" textTransform="capitalize">{wallId} wall</text>
      <line x1={sketch.outline.paddingPx} y1={sketch.outline.paddingPx + sketch.outline.heightPx} x2={sketch.outline.paddingPx + sketch.outline.widthPx} y2={sketch.outline.paddingPx + sketch.outline.heightPx} stroke="#666" strokeWidth={1} />
      <rect x={sketch.outline.paddingPx} y={sketch.outline.paddingPx} width={sketch.outline.widthPx} height={sketch.outline.heightPx} fill="none" stroke="#444" strokeDasharray="3 3" />
      {sketch.items.map((it, i) => (
        <g key={i}>
          <rect x={it.xPx} y={it.yPx} width={it.widthPx} height={it.heightPx} fill={FILL_BY_KIND[it.kind] ?? "#888"} opacity={0.8} />
        </g>
      ))}
      {fixtures.map(f => {
        // Place wall-mounted fixture markers above its associated item (art / console)
        // Simple heuristic: spread evenly across wall at ~6ft height
        const yPx = sketch.outline.paddingPx + sketch.outline.heightPx - 6 * sketch.scale;
        const xPx = sketch.outline.paddingPx + sketch.outline.widthPx * ((fixtures.indexOf(f) + 1) / (fixtures.length + 1));
        return (
          <g key={f.tag}>
            <circle cx={xPx} cy={yPx} r={6} fill="#facc15" />
            <text x={xPx} y={yPx - 10} fontSize={8} fill="#ccc" textAnchor="middle">{f.tag}</text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 4: Modify `app/lighting-agent/pack/page.tsx` — add sections**

Insert after the "Design intent" section, before the closing back-link:

```tsx
import { LayeredBreakdown } from "../components/LayeredBreakdown";
import { RCPDiagramSVG } from "../components/RCPDiagramSVG";
import { WallElevationSVG } from "../components/WallElevationSVG";

// ... within the JSX, replace the "Sections continued in Task 17–18" comment with:

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Layered lighting</div>
        <LayeredBreakdown fixtures={demoPack.fixtures} />
      </section>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Reflected ceiling plan</div>
        <RCPDiagramSVG />
        <p className="text-xs text-stone-500">Top-down view of the ceiling. Yellow = ambient, pink = accent, purple = decorative. Dashed perimeter is the cove.</p>
      </section>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Wall elevations</div>
        <div className="space-y-4">
          <WallElevationSVG wallId="north" />
          <WallElevationSVG wallId="east" />
          <WallElevationSVG wallId="south" />
          <WallElevationSVG wallId="west" />
        </div>
      </section>
```

- [ ] **Step 5: Verify in browser**

Visit `/lighting-agent/pack`. Scroll: should see layered breakdown grid, RCP SVG, four wall elevation SVGs.

- [ ] **Step 6: Commit**

```bash
git add app/lighting-agent/pack/page.tsx app/lighting-agent/components/LayeredBreakdown.tsx app/lighting-agent/components/RCPDiagramSVG.tsx app/lighting-agent/components/WallElevationSVG.tsx
git commit -m "feat(lighting-agent): layered breakdown + RCP diagram + wall elevations"
```

---

### Task 18: Lighting Pack — fixture schedule + switching + BOQ + brand picks + notes

**Files:**
- Modify: `app/lighting-agent/pack/page.tsx`
- Create: `app/lighting-agent/components/FixtureScheduleTable.tsx`
- Create: `app/lighting-agent/components/SwitchingDiagram.tsx`
- Create: `app/lighting-agent/components/BOQTable.tsx`
- Create: `app/lighting-agent/components/BrandRecCard.tsx`
- Create: `app/lighting-agent/components/NotesList.tsx`

- [ ] **Step 1: Create `FixtureScheduleTable.tsx`**

```tsx
import type { Fixture } from "@/lib/lighting-agent/types";

export function FixtureScheduleTable({ fixtures }: { fixtures: Fixture[] }) {
  return (
    <div className="overflow-x-auto border border-stone-800 rounded-md">
      <table className="w-full text-xs">
        <thead className="bg-stone-900/50 text-stone-500 uppercase tracking-wider">
          <tr>
            <th className="text-left p-3">Tag</th>
            <th className="text-left p-3">Category</th>
            <th className="text-left p-3">Mounting</th>
            <th className="text-right p-3">Qty</th>
            <th className="text-right p-3">W</th>
            <th className="text-right p-3">CCT</th>
            <th className="text-right p-3">CRI</th>
            <th className="text-right p-3">Beam</th>
            <th className="text-left p-3">Source</th>
          </tr>
        </thead>
        <tbody className="text-stone-300">
          {fixtures.map(f => (
            <tr key={f.tag} className="border-t border-stone-800">
              <td className="p-3 font-medium">{f.tag}</td>
              <td className="p-3">{f.category}</td>
              <td className="p-3 text-stone-500">{f.mounting.replace("_", " ")}</td>
              <td className="p-3 text-right">{f.quantity}</td>
              <td className="p-3 text-right">{f.wattage}</td>
              <td className="p-3 text-right">{f.cct}K</td>
              <td className="p-3 text-right">{f.cri ?? "—"}</td>
              <td className="p-3 text-right">{f.beamAngleDeg ? `${f.beamAngleDeg}°` : "—"}</td>
              <td className="p-3 text-stone-500">{f.source === "decorative_catalog" ? "Catalog" : "Spec"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create `SwitchingDiagram.tsx`**

```tsx
import type { SwitchingZone } from "@/lib/lighting-agent/types";

export function SwitchingDiagram({ zones }: { zones: SwitchingZone[] }) {
  return (
    <div className="space-y-3">
      {zones.map(z => (
        <div key={z.id} className="border border-stone-800 rounded-md p-4 grid sm:grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1 items-baseline">
          <div className="text-amber-200 font-medium">{z.id}</div>
          <div>
            <div className="text-sm">{z.label}</div>
            <div className="text-xs text-stone-500 mt-1">Controls: {z.controlsTags.join(", ")}</div>
            <div className="text-xs text-stone-500">Switch: {z.switchLocation}</div>
          </div>
          <div className="text-xs">
            {z.dimmer ? <span className="text-amber-300">Dimmable</span> : <span className="text-stone-600">On/Off</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `BOQTable.tsx`**

```tsx
import type { BOQLine } from "@/lib/lighting-agent/types";
import { formatInr, sumByCategory, sumTotal } from "@/lib/lighting-agent/boq";

const CATEGORIES: BOQLine["category"][] = ["Decorative", "Architectural", "Controls", "Drivers/Accessories"];

export function BOQTable({ lines }: { lines: BOQLine[] }) {
  return (
    <div className="space-y-6">
      {CATEGORIES.map(cat => {
        const rows = lines.filter(l => l.category === cat);
        if (rows.length === 0) return null;
        return (
          <div key={cat} className="border border-stone-800 rounded-md overflow-hidden">
            <div className="bg-stone-900/50 px-4 py-2 text-xs uppercase tracking-wider text-amber-200/80 flex justify-between">
              <span>{cat}</span>
              <span className="text-stone-400">{formatInr(sumByCategory(lines, cat))}</span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-stone-800">
                    <td className="p-3 text-stone-300">{r.description}</td>
                    <td className="p-3 text-right text-stone-500 w-16">{r.qty}</td>
                    <td className="p-3 text-right text-stone-500 w-24">{formatInr(r.unitInr)}</td>
                    <td className="p-3 text-right text-stone-300 w-28 font-medium">{formatInr(r.totalInr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <div className="border-t border-amber-200/30 pt-4 flex justify-between text-sm">
        <span className="text-amber-200">Grand total</span>
        <span className="font-medium text-lg">{formatInr(sumTotal(lines))}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `BrandRecCard.tsx`**

```tsx
import type { Fixture } from "@/lib/lighting-agent/types";

interface Props {
  fixtures: Fixture[];
}

export function BrandRecCard({ fixtures }: Props) {
  // Group architectural fixtures by category for brand recs
  const archByCat = new Map<string, Fixture>();
  for (const f of fixtures) {
    if (f.source === "architectural_spec" && !archByCat.has(f.category)) {
      archByCat.set(f.category, f);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {[...archByCat.values()].map(f => (
        <div key={f.category} className="border border-stone-800 rounded-md p-4 space-y-2">
          <div className="text-sm font-medium">{f.category}</div>
          <div className="text-xs text-stone-500">
            Spec: {f.wattage}W · {f.cct}K · {f.beamAngleDeg ? `${f.beamAngleDeg}° beam ·` : ""} {f.dimmable ? "dimmable" : "non-dimmable"}
          </div>
          <div className="space-y-1 pt-2">
            {f.brandPicks?.map(bp => (
              <div key={`${bp.tier}-${bp.brand}`} className="flex justify-between text-xs">
                <span className="text-stone-400 capitalize">{bp.tier}</span>
                <span className="text-stone-200">{bp.brand}{bp.model ? ` · ${bp.model}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create `NotesList.tsx`**

```tsx
export function NotesList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-3">
      <div className="text-xs uppercase tracking-wider text-amber-200/80">{title}</div>
      <ul className="space-y-2 text-sm text-stone-300">
        {items.map((note, i) => (
          <li key={i} className="border-l-2 border-amber-200/40 pl-3 text-stone-300 leading-relaxed">
            {note}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Add sections to `app/lighting-agent/pack/page.tsx`**

Add the imports at the top:

```tsx
import { FixtureScheduleTable } from "../components/FixtureScheduleTable";
import { SwitchingDiagram } from "../components/SwitchingDiagram";
import { BOQTable } from "../components/BOQTable";
import { BrandRecCard } from "../components/BrandRecCard";
import { NotesList } from "../components/NotesList";
```

Add sections (after Wall Elevations, before the back link):

```tsx
      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Fixture schedule</div>
        <FixtureScheduleTable fixtures={demoPack.fixtures} />
      </section>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Switching + dimming</div>
        <SwitchingDiagram zones={demoPack.switching} />
      </section>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">BOQ</div>
        <BOQTable lines={demoPack.boq} />
      </section>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Brand picks (architectural)</div>
        <p className="text-xs text-stone-500">Decorative comes from Delhi Brass + partners. Architectural picks per budget tier:</p>
        <BrandRecCard fixtures={demoPack.fixtures} />
      </section>

      <NotesList title="Application notes" items={demoPack.applicationNotes} />
      <NotesList title="Installation notes" items={demoPack.installationNotes} />
```

- [ ] **Step 7: Verify**

Visit `/lighting-agent/pack`. Should now show all 12 sections of the Lighting Pack: header → renders → narrative → layered → RCP → wall elevations → fixture schedule → switching → BOQ → brand picks → application notes → installation notes.

- [ ] **Step 8: Commit**

```bash
git add app/lighting-agent/pack/ app/lighting-agent/components/
git commit -m "feat(lighting-agent): fixture schedule, switching, BOQ, brand picks, application + install notes"
```

---

### Task 19: Iteration chat (scripted)

**Files:**
- Create: `app/lighting-agent/components/IterationChat.tsx`
- Modify: `app/lighting-agent/pack/page.tsx`

- [ ] **Step 1: Create `IterationChat.tsx`**

```tsx
"use client";

import { useState } from "react";
import { chatSuggestionChips, scriptedConversations } from "@/lib/lighting-agent/scripted-chat";
import type { ChatTurn } from "@/lib/lighting-agent/scripted-chat";

export function IterationChat() {
  const [transcript, setTranscript] = useState<ChatTurn[]>([
    { role: "agent", message: "Want to tweak anything? Try one of these:" },
  ]);

  const choose = (id: string) => {
    const turns = scriptedConversations[id];
    if (!turns) return;
    setTranscript(t => [...t, ...turns]);
  };

  return (
    <div className="border border-stone-800 rounded-md p-4 space-y-4 bg-stone-950">
      <div className="text-xs uppercase tracking-wider text-amber-200/80">Talk to the agent</div>

      <ul className="space-y-3">
        {transcript.map((turn, i) => (
          <li key={i} className={turn.role === "agent" ? "" : "text-right"}>
            <div
              className={`inline-block max-w-[85%] rounded-md px-3 py-2 text-sm ${
                turn.role === "agent" ? "bg-stone-900 text-stone-200" : "bg-amber-200/10 text-amber-100"
              }`}
            >
              {turn.message}
            </div>
            {turn.alternates && (
              <div className="grid sm:grid-cols-3 gap-2 mt-2">
                {turn.alternates.map(a => (
                  <div key={a.tag} className="border border-stone-800 rounded-md p-3 text-xs space-y-1 bg-stone-900/50">
                    <div className="font-medium text-stone-200">{a.description}</div>
                    <div className="text-stone-500">{a.priceInr.toLocaleString("en-IN")}</div>
                    <button className="text-amber-200 text-xs hover:underline">Pick this →</button>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-stone-800 pt-3 space-y-2">
        <div className="text-xs text-stone-500">Suggested:</div>
        <div className="flex flex-wrap gap-2">
          {chatSuggestionChips.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              className="text-xs border border-stone-800 hover:border-amber-200/60 hover:text-amber-200 rounded-full px-3 py-1.5 transition"
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Or type your own…"
          className="w-full bg-stone-900 border border-stone-800 rounded-md px-3 py-2 text-sm placeholder-stone-600 mt-2"
        />
        <p className="text-xs text-stone-600">Prototype: only suggested chips trigger scripted responses.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the chat to the pack page**

Add import:
```tsx
import { IterationChat } from "../components/IterationChat";
```

Insert just after the last `<NotesList />`:

```tsx
      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-amber-200/80">Iterate</div>
        <IterationChat />
      </section>
```

- [ ] **Step 3: Verify**

Visit `/lighting-agent/pack`. Scroll to bottom. Click each suggestion chip — should reveal scripted agent responses, including the alternates for "Show alternate pendants."

- [ ] **Step 4: Commit**

```bash
git add app/lighting-agent/components/IterationChat.tsx app/lighting-agent/pack/page.tsx
git commit -m "feat(lighting-agent): scripted iteration chat with suggestion chips"
```

---

### Task 20: End-to-end smoke

- [ ] **Step 1: Walk the full flow manually**

Run `npm run dev` and click through:

1. `/lighting-agent` → click "Start your consult"
2. Home Profile → make selections → Continue
3. Room Basics → make selections → Continue to walls
4. Wall north → Next wall (×3 more times for east, south, west)
5. Furniture → Continue
6. Brief → Generate my lighting plan
7. Generating → auto-routes to Pack
8. Pack → scroll through all sections; switch render scenes; trigger each chat suggestion

Confirm no console errors, no broken links, no missing images, no Tailwind class warnings.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: all tests passing.

- [ ] **Step 3: Run `npm run build` to catch any production-only errors**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit any final fixes**

If you find issues during the smoke walk, fix and commit. If clean, skip this step.

---

### Task 21: Interview kit

**Files:**
- Create: `docs/interviews/lighting-agent-interview-script.md`
- Create: `docs/interviews/lighting-agent-observation-guide.md`
- Create: `docs/interviews/lighting-agent-recruitment.md`

- [ ] **Step 1: Create the interview script**

`docs/interviews/lighting-agent-interview-script.md`:

```markdown
# AI Lighting Consultant — User Interview Script

**Duration:** 30–45 minutes
**Format:** Screen share over Google Meet, recorded with Granola or similar
**Goal:** Validate that our prototype's flow, vocabulary, and output match a real user's needs and willingness to pay.

## Before the call
- Confirm consent to record
- Confirm participant persona (homeowner / designer / architect / builder)
- Send them the prototype URL 30 minutes before, ask them not to click anything yet

## Part 1 — Context (5 min)

1. Tell me about your current home / your most recent project. How big, how old, what's your relationship to it?
2. What's been your experience with lighting in that home? Anything you love, anything you hate?
3. **For designers:** How do you currently handle lighting design for clients? Do you do it yourself, or bring in a consultant?
4. **For homeowners:** Have you ever hired a lighting consultant or thought about it? Why or why not?

## Part 2 — The journey (15–20 min)

> "I'm going to walk you through a prototype of an AI lighting agent. We'd love your unfiltered reactions. Talk out loud — what's confusing, what's exciting, what you'd skip."

Share the prototype URL. Sit on screen share. Do not narrate or guide.

**At each screen, ask only after they've finished:**

- Landing: First impression — what is this offering?
- Home Profile: Anything here that doesn't apply to you? Anything missing? Did "budget tier" framing make sense?
- Room Basics: Did the questions feel like the right ones? What would you change about how dimensions are asked?
- Wall-by-wall (after wall 1): What did you think of describing the room one wall at a time? Painful or natural?
- After wall 4: Were 4 walls too many, too few, or right?
- Furniture: Useful or unnecessary?
- Brief: Did "mood" + "constraints" framing work?
- Generating screen: Did this build trust or feel theatrical?
- Lighting Pack — scroll slowly:
  - Renders: Believable? Useful? Which scene resonated most?
  - Narrative: Did you read it? Was it the right length?
  - Layered breakdown: Did you understand the four layers?
  - RCP: Did you understand what this is? Would you share with an electrician?
  - Wall elevations: Useful?
  - Fixture schedule: Too much detail? Right amount?
  - Switching: Did this make sense?
  - BOQ: Reaction to the total. Reaction to brand picks.
  - Application + install notes: Read them? Trust them?
- Iteration chat: Did you try it? Would you actually use this?

## Part 3 — Willingness + value (5 min)

1. If this existed for real, would you use it? When?
2. What would you pay for this — for one room? For your whole home?
3. Free / freemium / one-time / subscription — what fits the way you'd use it?
4. Who in your life would you forward the output to? (Spouse / contractor / designer / electrician?)
5. **For designers:** Would you use this for client work? White-label it? Charge clients separately?
6. What's missing for this to be a "yes" for you?

## Part 4 — Close (2 min)

- Anything else we should have asked?
- Can we follow up if we add features that came out of this conversation?
- Thank-you and any incentive (gift voucher / shoutout)

## After the call
- Notes into `docs/interviews/sessions/YYYY-MM-DD-name.md`
- Tag findings into the observation guide categories
```

- [ ] **Step 2: Create the observation guide**

`docs/interviews/lighting-agent-observation-guide.md`:

```markdown
# Observation Guide

Watch for these patterns during sessions and tag them in your notes.

## Vocabulary confusion
Note any time a user asks "what does X mean?" or skips a field because they didn't understand it. Words to watch:
- Lux / CRI / CCT / Kelvin / beam angle
- Fixture schedule / BOQ / RCP
- Ambient / task / accent / decorative
- Dimming protocol / driver / cove
- "Architectural" vs "decorative" — does this distinction land?

## Dropout points
Where do users hesitate or seem ready to bail?
- Home Profile too long?
- Wall-by-wall by wall 3 — fatigue?
- Brief — last-mile drop?
- Pack page overwhelm?

## Aha moments
What did they react positively to? Note the exact moment and what was on screen.
- Renders ("Oh wow, that looks like my room")
- Application notes ("Did it really place that for the painting I mentioned?")
- Brand picks ("So I can choose budget vs premium?")
- Iteration ("I can just ask it to remove the cove?")

## Mismatches with their real workflow
- Designers: does the output format match what they'd send a client?
- Homeowners: do they feel confident handing this to a contractor?
- Architects: would they trust this as a starting point?
- Builders: is the BOQ the format they'd want?

## Pricing signal
Watch reactions to:
- Total BOQ amount (~₹1L for one room)
- The question "would you pay for this"
- Their proposed price points

## Tone reactions
- Does "we'll" vs "the AI will" land?
- Does the dark luxury aesthetic feel premium or off-putting?
- Does the wall-by-wall feel conversational or robotic?
```

- [ ] **Step 3: Create the recruitment plan**

`docs/interviews/lighting-agent-recruitment.md`:

```markdown
# Recruitment Plan

## Target mix (10–20 sessions total)

### Homeowners (5–10)
- 2× actively under renovation
- 2× planning a renovation in next 6 months
- 2× just moved into new home, unhappy with lighting
- 2× content in current home but renovated within last 2 years
- Mix: age 30–55, mix metros (Delhi, Bangalore, Mumbai), mid-to-premium budget

### Interior designers (5–10)
- 2× solo consultants
- 2× small studios (3–10 people)
- 1–2× larger firms (10+)
- Mix of tech-comfort levels — at least one designer who barely uses any software

### Architects (1–2)
- Mid-career residential architects

### Builders / contractors (1–2)
- Independent contractors who do interiors execution

## Sources

- Existing network — start with the 2 designers already interviewed (call #2)
- Instagram outreach — Delhi Brass followers who comment on renders
- Bombay Interior Designers WhatsApp group
- IIID (Institute of Indian Interior Designers) chapter directories
- Houzz India profiles
- Friends of friends in target categories

## Incentive

- ₹2,000 gift voucher (Amazon or Delhi Brass) for completed 45-min session
- For designers: option of free Lighting Pack for one of their actual client rooms once v1 ships

## Screener

Send before booking:
1. Are you currently planning, doing, or recently completed a home renovation or interiors project? (Yes / No / About to start)
2. What city are you in?
3. What's your role? (Homeowner / Designer / Architect / Builder / Other)
4. How tech-comfortable are you? (1–5)
5. Budget range for the project? (<10L / 10–25L / 25L–1Cr / >1Cr)

Aim for variance on city, role, tech-comfort, and budget. Don't overweight your existing network.

## Scheduling

- Use Calendly with 45-min slots
- 1 session per day max to avoid pattern fatigue
- Take notes within 2 hours of each session into `docs/interviews/sessions/YYYY-MM-DD-name.md`

## Synthesis

After every 5 sessions, write a synthesis doc into `docs/interviews/synthesis/`. After all sessions, write a final summary that explicitly answers:
- Primary front-end surface decision (homeowner vs designer)
- What's in / out of the v1 scope based on findings
- Pricing direction
- Naming + tone direction
```

- [ ] **Step 4: Commit**

```bash
git add docs/interviews/
git commit -m "docs(lighting-agent): interview script, observation guide, recruitment plan"
```

---

## Final summary

After all tasks are complete, you should have:

- A fully clickable Next.js prototype at `/lighting-agent/*`, with 10 pages plus a Lighting Pack output page containing all 12 sections
- A single hardcoded demo room used end-to-end
- Three pre-generated Gemini renders
- Vitest test suite covering pure-logic utilities (BOQ math, wall sketch, RCP layout, fixture helpers)
- A complete interview kit (script, observation guide, recruitment plan)

Run the full smoke flow from `/lighting-agent` one more time, then ship the prototype to staging and start scheduling interviews.

---

## Notes for future phases (NOT part of Phase 0)

When you write the Phase 1 plan (after interview findings), the following Phase 0 artifacts will get replaced or extended:

- **Demo data** in `lib/lighting-agent/demo-data.ts` becomes session state from the real form
- **Hardcoded fixtures** become recommendations from the engine
- **Hardcoded renders** become live Gemini calls per session
- **Scripted chat** becomes real LLM-driven iteration
- **Hardcoded `applicationNotes`** become engine-generated reasoning
- The `app/lighting-agent/` route remains; pages may be restructured based on interview findings
- Pure-logic utilities (`boq.ts`, `wall-sketch.ts`, `rcp.ts`, `fixtures.ts`) carry forward unchanged

The Phase 1 plan is **deliberately not written yet** — it should be shaped by what the interviews surface.
