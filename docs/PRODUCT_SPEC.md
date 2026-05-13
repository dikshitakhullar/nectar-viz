# Nectar Viz — Product Spec

## What is this?
An AI-powered room visualization tool. Customers upload a photo of their room, pick a lighting product, and get a photorealistic render of that product installed in their space.

Starting with Delhi Brass's chandelier catalog. Eventually expanding to other brands and interior designers.

---

## V1 — Delhi Brass In-Store Tool

### Who uses it
Customers visiting the Delhi Brass showroom, assisted by staff. Accessed on the customer's phone (or store iPad) via QR code.

### User Flow
1. **Select product** — browse a visual grid of products, filtered by type (chandelier, pendant, lantern) and style (crystal, brass, modern, heritage). Staff assists.
2. **Upload room photo** — customer takes/uploads a photo of the room where they want the product.
3. **Room details** — select room type (dining, living, bedroom, mandir, etc.), room state (fully furnished vs. under construction), and optional vibe/style description.
4. **Generate** — AI places the product in the room photo and returns a photorealistic render (15-30 sec).
5. **Result** — view, download, or share via WhatsApp/email.

### Core Rules for Image Generation
- **Fully furnished rooms:** Preserve EVERYTHING. Only add the product. No furniture, wall, floor, or decor changes.
- **Under construction rooms:** Preserve all structural elements (walls, windows, doors, dimensions) AND all already-installed finishes (stone, tiles, woodwork). Can add wall treatments, window treatments, finishes on bare surfaces, furniture, and decor.
- **Scale is critical:** Each product has real dimensions. The prompt must reference these relative to the room (e.g., "chandelier is 20 inches wide, less than 1/4 the width of the sofa"). Large products (e.g., grand-lantern-cylinder at 10 feet) stay large in appropriate settings (double-height spaces).
- **Never change structural elements:** Walls, windows, doors, ceiling shape, room dimensions are immovable. Only add things on top of what exists.

### Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Deploy:** Vercel
- **Image Generation:** Gemini Pro Image API (server-side)
- **Product Catalog:** JSON file (~115 products, no database needed)
- **Auth:** None — open access via URL/QR code

### Project Structure
```
nectar-viz/
  app/
    page.tsx                  # Product selection grid
    upload/page.tsx           # Room photo upload + details form
    generate/page.tsx         # Loading + result display
    api/generate/route.ts     # Image generation endpoint
  data/
    catalog.json              # Product catalog (name, type, style, images, dimensions)
  public/
    products/                 # Product studio images
  lib/
    generate-prompt.ts        # Prompt builder — the core logic
    catalog.ts                # Catalog lookup helpers
```

### Prompt Engine (the hard part)
The prompt builder takes all user inputs and constructs the generation prompt. It encodes:
- Product description (from catalog metadata)
- Product dimensions and scale rules relative to room type
- Room preservation rules (structural + installed finishes)
- Room state handling (furnished vs. under construction)
- Style/vibe guidelines (user input or default modern Indian luxury aesthetic)
- Negative prompts (no structural changes, no oversizing, no CGI look)

---

## V2 — Enhanced Experience

### Product Discovery (when user doesn't have a specific product)
- **Option A:** AI matching — user describes what they want ("something modern with crystals, not too big") and AI suggests 2-3 products from the catalog
- **Option B:** Guided flow — 2-3 quick questions (type? size? vibe?) that narrow to 3-5 suggestions
- **Option C:** Both — text search + guided filters

### Better Placement Control
- User can circle/tap where they want the product placed in their room photo
- More precise compositing — proper lighting, shadows, reflections matching the room environment (not just AI generation but actual image compositing that looks seamless)

### Room Design Mode (under construction rooms)
- Two outputs: (1) light only, (2) light + room designed
- Smarter about what's already installed vs. what's bare — auto-detect from the photo rather than asking the user
- Style presets: Modern Indian, Classical, Minimal, Contemporary, etc.

### Iteration
- "Make it smaller / bigger"
- "Try a different position"
- "Show me this product instead" (swap product, keep same room)
- Save history of generations for the customer

### SKU Support
- Products get SKUs, customer can type SKU directly
- QR codes on individual products in showroom link directly to that product's page

---

## Future — Nectar Platform (beyond Delhi Brass)

### Multi-Brand Support
- Other lighting brands can onboard their catalogs
- Each brand uploads product images + metadata (dimensions, type, style)
- Brand-specific product grids, shared generation engine

### Interior Designer Tool
- Designers upload client room photos, source products from multiple brand catalogs
- Save projects per client
- Generate multiple options (different products in same room) for client presentations
- Mark-up pricing for client billing
- Mood boards — combine multiple room renders into a presentation

### Floor Plan / Layout Input
- User uploads a 2D floor plan or architectural layout
- AI generates a 3D-style room render from the plan
- Then places products into the generated room
- Useful for architects and designers working from blueprints

### Expanded Product Categories
- Wall lights, table lamps, floor lamps
- Eventually: furniture, decor, rugs, art
- Cross-category coordination (e.g., chandelier + matching wall sconces)

### Business Model Ideas
- Free for Delhi Brass customers (drives sales)
- SaaS subscription for other brands (per-brand catalog hosting + generation credits)
- Designer tier with project management, client presentations, supplier access
- Per-generation pricing beyond free tier

---

## Spike Test Results (May 2026)

### Test 1: Finished room + fluted-scroll chandelier
- Room: formal living/drawing room (cream sofas, marble floor, gold lattice)
- Result: Room preserved ~90%, chandelier placed centrally with correct proportions
- Verdict: Pass

### Test 2: Finished room + twisted-linen chandelier (replacing ceiling fan)
- Room: family lounge (mint green sofas, Persian rug, leather trunk)
- First attempt: chandelier too large. Second attempt with aggressive scale instructions: much better.
- Key learning: Must specify product dimensions relative to room furniture for correct scale.
- Verdict: Pass (after scale correction)

### Test 3A: Under-construction mandir + brass-linear-cluster (light only)
- Room: bare plaster mandir with scaffolding visible
- Result: Construction site preserved perfectly, chandelier added to ceiling
- Issue: Linear (horizontal) fixture in narrow room caused slight product distortion
- Verdict: Pass with caveat — some product/room shape combinations are harder

### Test 3B: Under-construction mandir + brass-linear-cluster (designed room)
- Same room, but AI also designed the finished interior
- Result: Beautiful modern Indian mandir design
- Issue: AI changed structural elements (window became a wall) and replaced already-installed stone finishes
- Key learning: Prompt must explicitly distinguish structural/installed elements from bare surfaces
- Verdict: Partial pass — design quality is high but structural preservation needs stronger prompting

### Key Learnings
1. Scale needs product dimensions in the prompt, referenced relative to room furniture
2. Structural preservation requires explicit, aggressive prompting
3. "Already installed" finishes must be called out separately from "unfinished" surfaces
4. Product orientation matters — horizontal fixtures in narrow rooms can distort
5. Generation quality is high enough for a customer visualization tool
6. Gemini Pro Image with two input images (room + product) works well for this use case
