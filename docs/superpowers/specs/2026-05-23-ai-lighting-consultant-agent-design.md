# AI Lighting Consultant Agent — Design Spec

**Date:** 2026-05-23
**Author:** Dikshita Khullar + brainstorm session
**Status:** Draft for review

---

## 1. Vision

An AI lighting consultant agent that takes basic inputs about a room — dimensions or a floor plan, occupant brief, ceiling type, furniture layout, room orientation — and outputs a complete lighting design package: photoreal renders showing what the room will feel like, a layered lighting plan, fixture recommendations, a top-down ceiling plan, switching diagram, and a BOQ.

The same engine serves two audiences:
- **Homeowners** doing or planning a renovation, who can't afford or don't want to hire a lighting consultant
- **Interior designers and architects** who need a faster, AI-assisted way to deliver lighting design as part of their service

We build the engine audience-agnostic. We decide the primary front-end surface based on user interview findings after the prototype phase.

## 2. Why now, why us

- **Real designer demand:** Validated in interior designer call #2 (May 21). Designer said an AI lighting consultant would be "very helpful" — flagged that architects routinely get lighting wrong, that elderly vs. kids need different lighting, that wattage/spacing rules vary by purpose.
- **Existing strengths:** Nectar Viz already has the photoreal rendering layer (Gemini 2.5 Flash Image), a curated multi-brand decorative catalog (Delhi Brass + House of Samavar = 222 SKUs), and AI Pick recommendation logic. The lighting agent is a natural next layer.
- **Differentiator vs. Alya (the closest competitor):** Alya targets pro designers with a CAD-style editor for new-construction lighting design. Their output is technical (RCP, BOQ, IES) but they cannot do photoreal rendering. Our wedge is the opposite: start consumer-friendly + photoreal, layer technical outputs on top. The intersection (designers wanting to render an Alya BOQ in a client's room) is a future partnership lane.

## 3. Target users (engine-agnostic, primary surface deferred)

| Persona | Stage | What they bring | What they want |
|---|---|---|---|
| Homeowner — renovation / new build | Planning or under construction | Floor plan or rough dimensions, occupant brief, room photos | "Tell me what to do, in plain language, with a shopping list" |
| Homeowner — lived-in | Existing home, working with constraints | Room photos, existing electrical points, dimensions | Practical retrofits, decorative + smart upgrades |
| Interior designer | Late-stage sourcing for client | Floor plan + furniture layout + theme | Speed: skip lighting consultant fee, generate a BOQ + technical pack to present to client |
| Architect | Schematic design | Floor plan, ceiling plan, electrical preferences | Sanity check + recommendations on plans they're drawing |

Engine output supports all four. Front-end surfaces (UI tone, vocabulary, output emphasis) may diverge — that decision is deferred to post-prototype interviews.

## 4. V1 scope: "Standard"

### 4.1 In scope for v1

- One-time **Home Profile** (house-wide preferences, captured once, applied to every room consult)
- **Hybrid input flow per room**: form-first, with optional floor plan upload + room photos
- **Wall-by-wall conversational input** for users without a floor plan
- **Two-tier recommendation engine**:
  - Decorative fixtures from our catalog (Delhi Brass, House of Samavar, partners)
  - Architectural fixtures (downlights, cove, profile, track, spot, concealed/wall washer) via brand-agnostic specs + 2-3 brand picks per budget tier
- **"Lighting Pack"** output as both PDF and shareable web link, containing:
  1. Cover summary (room photo, key stats)
  2. Design intent narrative
  3. Photoreal render gallery — 3 scenes (Day, Evening, Mood)
  4. Layered lighting breakdown (Ambient / Task / Accent / Decorative)
  5. RCP-style 2D top-down diagram (SVG)
  6. Wall elevations (one per wall, with fixtures placed)
  7. Fixture Schedule (full table)
  8. Switching diagram
  9. BOQ with totals
  10. Brand recommendation sheet (architectural)
  11. Application notes ("why each fixture")
  12. Installation notes for electrician (driver placement, dimming compatibility, smart-hub wiring guidance — distinct from a full electrical point coordinate list, which is v2)
- **Light iteration**: swap any single fixture for alternatives, with re-render of that fixture + updated plan + BOQ
- **Catalog Importer** (internal admin tool, parallel build): upload brand catalogs (PDF/image/spreadsheet) → Claude Vision extraction → manual review → reference catalog

### 4.2 Out of scope for v1 (queued for v2+)

- **Plan Analyzer** — separate product surface where users upload an existing lighting plan and get critique + suggested fixes. ~80% engine reuse, but needs PDF/drawing parsing. Worth designing engine v1 with this in mind so v2 is incremental.
- Full iteration loop with chat + version history + per-fixture locks (v1.5)
- Electrical point list as a separate deliverable for the builder/electrician
- Multi-room consult / whole-home plan
- IES file generator (Alya-style)
- DWG/DXF export of RCP
- Comparison / info content pages ("downlight vs spot" etc.)
- Energy + maintenance detail outputs
- Pricing / paywall
- Multi-product placement engine refinements (existing core engine gap, tracked separately)

## 5. Phased delivery

| Phase | Scope | Weeks | Purpose |
|---|---|---|---|
| **Phase 0** | Clickable HTML prototype + user interviews | 3–5 | Validate UX before building backend; de-risk v1 |
| **Phase 1** | Engine + Home Profile + per-room input + wall-by-wall flow + recommendation engine | 4–5 | Real generation working end-to-end |
| **Phase 2** | Output generation: Lighting Pack PDF, render gallery, RCP diagram, fixture schedule, BOQ | 2–3 | The deliverable artifact |
| **Phase 3** | Light iteration loop, polish, launch on a controlled beta | 1–2 | Ship |
| **Parallel** | Catalog Importer admin tool | ~2 days (any time) | Operator self-serve catalog updates |

**Total:** 10–15 weeks for v1, including interviews. Without Phase 0 it would be 7–10 weeks — the interview phase is a deliberate de-risking investment.

## 6. Phase 0: Prototype + interviews (spec)

### Build
- Next.js page-based prototype, static / hardcoded data
- Single "demo room" walked through end-to-end — proposed: a 12 ft × 15 ft × 10 ft living/TV room with: front door on north wall, large window on east wall, TV wall on south, console + art on west
- All screens of the user journey:
  1. Landing
  2. Home Profile setup
  3. Room basics (dimensions, type, ceiling, finishes, orientation, occupants)
  4. Wall-by-wall (4 walls × ~30 seconds each, with live SVG sketch updating)
  5. Furniture placement (simple tap-to-place)
  6. Lifestyle brief + constraints
  7. "Agent thinking…" transitional screen
  8. Lighting Pack output — scrollable page with all 12 sections
  9. Iteration chat (scripted responses: "show me alternatives" → reveals 3 hardcoded options for one fixture)
- 3 photoreal renders pre-generated once with Gemini for the demo room (Day, Evening, Mood)
- No actual AI backend, no real catalog calls — everything pre-baked

### Interview targets
- 5–10 homeowners (mix: under-renovation, planning, lived-in)
- 5–10 interior designers (solo consultants, mid-size studios)
- 1–2 architects + 1–2 builders/contractors (secondary, lower priority)

### What we learn
- Does the wall-by-wall flow feel delightful or tedious?
- Does vocabulary land? ("fixture schedule," "RCP," "lux," "CCT" — at what point does jargon hurt vs. help by audience?)
- What in the Lighting Pack is most valuable? What's noise?
- Would they pay? At what price? Free, freemium, per-room, subscription?
- For designers: would they share this with their clients, or use it internally?
- Acquisition signal: what would make them tell a friend?

### Decisions that come out of Phase 0
- Primary front-end surface (homeowner vs designer) — based on enthusiasm signal
- Cuts to the input flow (what's actually necessary vs. nice-to-have)
- Cuts to the Lighting Pack (what's signal vs. noise per audience)
- Pricing direction
- Naming and tone

## 7. Architecture overview

### 7.1 Layers

```
┌─────────────────────────────────────────────────────────┐
│ SURFACE LAYER (audience-specific UI)                    │
│ - Homeowner UI: warm, hand-holding, plain language      │
│ - Designer Pro UI: technical, dense, editable           │
│ Both surfaces consume the same engine outputs            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ ENGINE LAYER (audience-agnostic)                        │
│ - Input normalization (form → structured room model)    │
│ - Lighting principles + lux math                        │
│ - Recommendation engine (decorative + architectural)    │
│ - Render orchestration (Gemini prompts + composition)   │
│ - Output generation (Lighting Pack assembly)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ DATA LAYER                                              │
│ - Decorative catalog (existing Delhi Brass + partners)  │
│ - Architectural reference catalog (new, brand-tiered)   │
│ - Home Profile + per-room session storage               │
│ - Render cache + log (Vercel Blob, existing pattern)    │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Audience-agnostic engine principle

The engine should never branch on `user.type === 'homeowner'`. All audience-specific logic lives at the surface layer:
- Surface decides what vocabulary to use ("warm soft glow" vs "2700K")
- Surface decides what artifacts to expose ("just give me the shopping list" vs "give me the full pack")
- Surface decides tone of agent's conversational messages

This keeps v2 (Plan Analyzer, multi-room, designer surface) as additive work, not rewrites.

## 8. Inputs

### 8.1 Home Profile (captured once)

| Field | Type | Notes |
|---|---|---|
| House type | Apartment / Builder floor / Villa / Standalone | Affects ceiling + electrical assumptions |
| Construction stage | New build / Mid-renovation / Lived-in | Drives constraint set |
| Smart-home interest | Yes / No / Maybe later | Filters control system recommendations |
| Preferred ambient CCT | Warm 2700K / Neutral 3000K / Mixed | Architectural lighting consistency |
| Brand tier | Budget / Mid / Premium / Luxury | For architectural fixture filtering |
| Brand preferences | Multi-select + free text | Boost / hide brands |
| No-go brands | Multi-select + free text | Hard exclude |
| Default ceiling type | Flat / False / Mixed | Per-room can override |
| Existing electrical layout (optional) | Upload | If known |

### 8.2 Per-room inputs

#### Room basics (Step 0)
- Room type (Dining / Drawing / Bedroom / Kitchen / Study / TV room — extensible)
- Dimensions: L × W × H (auto-fill if floor plan uploaded)
- Ceiling type override (if different from Home Profile default)
- Orientation: which way does the main window face? (N/S/E/W + intercardinals)
- Primary usage time: Morning / Evening / Mixed
- Occupants: age ranges + vision concerns (drives lux targets)
- Floor finish color (Light / Mid / Dark) — proxy for reflectance
- Wall finish color (Light / Mid / Dark)

#### Wall-by-wall (Steps 1–4)
For each wall:
- Length (auto if dimensions known)
- What's on this wall? Multi-select: door / window / TV / artwork / mirror / open shelves / console / sideboard / built-in / nothing
- Position of each item (left / center / right + rough distance)
- For windows: size + does it get direct sun?
- For art: planned or existing? Approx size?
- Live SVG sketch updates as the user fills

#### Furniture (Step 5)
- Major pieces and rough positions (sofa, dining table, bed, etc.)
- Simple drag-onto-grid or tap-to-place UI
- Optional: upload furniture layout PDF

#### Lifestyle brief (Step 6)
- "What do you do in this room?" multi-select + free text
- Mood preference: cozy / bright / dramatic / mixed
- Reference images (optional, feeds existing AI Pick logic)

#### Constraints (Step 7)
- Existing electrical points (if known / retrofit)
- Cannot-change list (rented, heritage, no false ceiling, etc.)
- Budget tier (or use Home Profile default)

### 8.3 Optional floor plan upload

- Accept: PDF / PNG / JPG / SketchUp screenshot
- Parser uses Claude Vision to extract: walls, dimensions, doors, windows, furniture rectangles, room labels
- Pre-fills Steps 0 and 1–4 when successful
- Fallback to wall-by-wall flow if parse fails or is incomplete

## 9. Engine

### 9.1 Lighting principles encoded

- **Layered lighting (ambient / task / accent / decorative)** — every room recommendation has all four layers explicitly addressed
- **Lux targets per room type and occupant age**:
  - Study desk: 500 lx
  - Kitchen counter: 500 lx (task)
  - Living room general: 200 lx
  - Bedroom general: 150 lx
  - Bathroom mirror: 500 lx (task)
  - Elderly multiplier: 1.5–2× for the same task
- **Spacing math** — downlight spacing as a function of mounting height and beam angle
- **CCT logic** — warmer for relaxation rooms, neutral/cooler for kitchens and study, consistent within the home (per Home Profile)
- **Glare avoidance** — for offices/study, UGR < 19; for residential, no direct downlight in the user's primary line of sight
- **Beam angle selection** — accent lighting at 10–24°, general at 36–60°, ambient at 60–90°+

### 9.2 Recommendation engine (two-tier)

**Tier 1 — Decorative (our catalog):**
- Source: existing Delhi Brass + House of Samavar + partner catalog
- Selection: existing AI Pick logic (style tags, color palette, vibes, room types) + this room's brief + Home Profile aesthetic
- Output: 1 recommended fixture per slot + 2-3 alternates for iteration
- Always paired with photoreal render

**Tier 2 — Architectural (brand-agnostic spec + brand picks):**
- Categories: downlight, cove LED strip, profile light, track light, spot, concealed/wall washer
- Source: small reference catalog of 6–8 Indian brands (Wipro, Philips, Havells, Schneider Electric, Astera, Goldmedal, Polycab, Crompton) × 3-5 hero products per category
- Selection logic:
  1. Compute spec requirement from room geometry + lighting principles (e.g., "12W, 3000K, 60°, dimmable, IP44")
  2. Filter by Home Profile brand tier + brand preferences
  3. Output spec sheet + 2-3 brand picks ("Try Wipro Garnet for mid, Philips for premium")
- No photoreal of architectural fixtures themselves — render the *light effect* instead

### 9.3 Render orchestration

**Inputs to renderer:**
- Base room photo (provided by user — strongly preferred) OR a generated baseline image from a "describe-the-room" Gemini call seeded with dimensions, finishes, furniture, and orientation (fallback when no photo)
- Fixture set (positions, types)
- Scene type (Day / Evening / Mood)

**Process:**
- Compose Gemini prompt per scene from a prompt library
- For visible fixtures: include product image + placement instruction
- For architectural light effects: describe the light, not the fixture ("warm 2700K pool of light from a recessed downlight on the wooden table")
- Generate 3 scenes per room

**Prompt library (to be built in Phase 2):**
- Downlight pool
- Cove glow
- Wall wash
- Picture light
- LED strip rim
- Profile light
- Spot beam
- Track light cluster
- Pendant ambient glow
- Sconce ambient glow

Each prompt template has slots for CCT, intensity, surface material, time-of-day.

**Honest limitations** (to be documented in product copy):
- Not a physics-accurate light simulator
- "What it will feel like" not "exact lux values"
- Multi-fixture rendering may need retry / per-fixture iteration

### 9.4 Output assembly (Lighting Pack)

The Lighting Pack is assembled in a deterministic pipeline:

1. Compute lighting plan (fixture set, positions, specs)
2. Run renders (3 scenes, ~30s total with parallelism)
3. Generate SVG diagrams (RCP top-down, wall elevations)
4. Compose narrative text (LLM call with structured outline)
5. Format Fixture Schedule + BOQ as tables
6. Assemble all into a single PDF (using `@react-pdf/renderer` or equivalent) AND a shareable web page (Next.js dynamic route)

## 10. Catalogs

### 10.1 Decorative catalog (existing)
- Already in production: `data/catalog.json`
- 222 SKUs (Delhi Brass + House of Samavar) currently exposed
- 531 SKUs total across 4 brands (FIG Living + CasaGold hidden from consumer grid, available to Visual Search)
- Will need a lighting-specific metadata enrichment pass: lumens, wattage, CCT, CRI, beam angle, mounting type, suspension specs

### 10.2 Architectural reference catalog (new)
- New JSON store: `data/architectural-catalog.json`
- Schema per item: id, brand, model, category, wattage, lumens, CCT_range, CRI, beam_angle, IP_rating, dimming_protocol, price_inr, budget_tier, image_url, buy_url
- Initial seed: ~150 SKUs (6-8 brands × 3-5 hero products × 6 categories)
- Maintained via Catalog Importer admin tool

### 10.3 Catalog Importer (admin tool)
- Route: `/admin/catalog-import` (login-protected)
- Flow:
  1. Upload PDF / image / spreadsheet of brand catalog
  2. Claude Vision extracts product cards into structured JSON
  3. Operator reviews extracted items in a grid (image + extracted specs)
  4. Edit / approve / reject per item
  5. On approve: write to architectural or decorative catalog, with brand version stamp
- Versioning: track when each brand was last updated
- Build time: 1-2 days, parallel to v1 work

## 11. Iteration model

### V1 (light iteration)
- After Lighting Pack is generated, user sees an "Alternatives" button next to each fixture
- Click → shows 2-3 alternates (same slot type, different fixture)
- Picking an alternate → re-renders just that fixture in the relevant scenes, updates Fixture Schedule + BOQ
- No conversational chat in v1 — purely button-driven

### V1.5 / V2 (full iteration)
- Chat interface alongside the live Lighting Pack
- User can say: "move the downlights left," "warmer mood," "remove cove," "more drama on the art wall"
- Agent updates plan, re-runs affected outputs only
- Version history: side-by-side comparison of Plan A vs Plan B
- Lock fixtures the user loves, so regeneration won't change them

## 12. Future scope (v2+)

| Feature | Why | When |
|---|---|---|
| **Plan Analyzer** | Lower-barrier entry; serves designers + builders who need a second opinion on existing plans | v2 — high priority |
| Full iteration loop | Makes the agent feel like a real consultant | v1.5 |
| Electrical point list | For builders / electricians | v2 |
| Multi-room consult | Same-home rooms compounded; respects house-wide consistency | v2 |
| IES generator | Wedge for pulling Indian lighting designers into the platform (Alya playbook) | v2 |
| DWG/DXF export | Designer integration into CAD workflow | v2 |
| Comparison / info content (`/learn`) | SEO, trust, designer trust, affiliate revenue | v2 |
| Energy + maintenance details | Long-tail utility | v2 |
| Pricing / paywall | Monetization | Post Phase 3 |

## 13. References & inspiration

- **Alya by The Light Co** (`thelightco.ai`) — Indian B2B lighting design SaaS targeting professional consultants. Strong technical vocab and BOQ-anchored workflow; weak rendering; expensive for India. Our consumer-facing photoreal approach is the differentiator.
- **Procurist** (`procurist.io`) — European FF&E procurement agent for interior designers. Excellent positioning ("Pinterest looks with Excel brains"), founder-from-the-industry voice, "Procurement Agent" naming. Steal: agent framing, stats-driven credibility, segmented "for designers / for suppliers" navigation, designer-side monetization model.
- **Livspace** (Indian interiors) — Auto-generated BOQ, set vendors, 3D from inputs, real-time cost. Lesson: the BOQ as the contract artifact is critical for trust. Risk: Livspace feels generic to high-end clients; we should stay aesthetically curated.
- **Interior designer call #2 (May 21)** — `docs/research/interior-designer-call-2.md`. Validated AI Lighting Consultant as "very helpful." Concrete pain points captured: elderly vs kids lighting, architects don't know lighting, 12W in 5ft gap rules, China catalog disconnect.
- **Lighting curriculum** — `docs/research/lighting/01–09.md`. Internal fluency-building modules. Reference for engine logic in Section 9.

## 14. Open questions and risks

### Open
- **Primary front-end surface for v1** — homeowner or designer? Deferred to Phase 0 interview findings. Engine is shared either way.
- **Pricing model** — free freemium with margin on Delhi Brass + affiliate on architectural? Per-room consult fee? Designer subscription? Test in Phase 0 interviews.
- **Pre-generated demo room for prototype** — confirm dimensions and layout before render generation.

### Risks
- **Multi-fixture photoreal rendering may not be solid enough.** Current core engine gap (noted in `pending-work.md`). If Gemini drops fixtures or scales wrong on multi-element prompts, v1 renders quality could be compromised. Mitigation: prompt library R&D in Phase 1; per-scene retry logic; "fix this one fixture" iteration path.
- **Architectural catalog maintenance burden.** A reference catalog of 150 SKUs across 6-8 brands needs quarterly refresh. Mitigation: Catalog Importer reduces this to a few hours of operator review per quarter.
- **Wall-by-wall flow could feel tedious.** Mitigation: Phase 0 interviews will surface this; floor plan upload path bypasses it entirely.
- **Homeowners might not value the technical pack** (RCP, switching, fixture schedule). If true, v1 could simplify the consumer surface to "narrative + renders + shopping list" with the technical pack hidden behind a "show full technical sheet" toggle. Phase 0 will tell us.
- **Designer adoption depends on credibility.** A designer won't use this if outputs look sloppy or non-standard. Phase 0 designer interviews critical to validate output format.
