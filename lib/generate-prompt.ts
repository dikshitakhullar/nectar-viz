import { Product, RoomType, RoomState } from "./types";

const DEFAULT_STYLE = "Modern Indian";

const VIBE_DETAILS: Record<string, string> = {
  "Modern Indian": `AESTHETIC — Modern Indian Luxury:
- Walls: paneled walls in warm taupe/cream with brass trim, or dark wood paneling accent walls
- Flooring: Italian marble (Calacatta/gold veining) or dark polished wood
- Furniture: quilted/textured fabric sofas in cream, beige, charcoal, or warm grey. Marble-top coffee tables with ornate brass jali-cut legs. Dining chairs with ribbed/fluted fabric and brass handles.
- Decor: contemporary Indian art (Thota Vaikuntam, Husain style, abstract), embroidered cushions in dark navy/black with Indian motifs, crystal bowls, brass figurines, coffee table books, candles
- Curtains: elegant sheer curtains with pleated valance — NOT velvet, NOT jewel-tone
- Color palette: warm neutrals — cream, taupe, warm grey, touches of gold/brass, navy accents
- DO NOT add: brass pots/urlis/jars, jute rugs, block prints, velvet curtains/sofas, jewel-tone furniture, olive green sofas`,

  "Minimal & elegant": `AESTHETIC — Minimal & Elegant:
- Walls: clean white or off-white plaster, one textured stone feature wall (travertine or limestone). No paneling, no heavy moldings.
- Flooring: light oak hardwood or pale limestone tiles
- Furniture: low-profile sofas in white/light grey linen. Simple wooden coffee table with clean lines. Slim dining chairs in natural wood. No ornate detailing.
- Decor: one large abstract artwork (monochrome or muted), a single ceramic vase, a few hardcover books. Less is more — leave breathing room.
- Curtains: floor-to-ceiling sheer white linen panels
- Color palette: white, off-white, light grey, pale wood, one muted accent (sage, soft clay, or dusty blue)
- DO NOT add: heavy ornate pieces, busy patterns, brass detailing, dark colors, cluttered surfaces`,

  "Classical / ornate": `AESTHETIC — Classical Ornate:
- Walls: rich paneled walls with crown molding, possibly in cream/ivory with gold leaf trim. Arched doorways or niches.
- Flooring: dark marble (Nero Marquina or dark emperador) or polished dark wood parquet
- Furniture: rolled-arm sofas in rich neutral fabric (not velvet), carved wood side tables, wingback chairs. Dining table with turned legs, upholstered dining chairs.
- Decor: ornate gilt-frame mirrors, classical oil paintings or Mughal miniatures, crystal decanters, silver candlesticks, heavy silk curtains with tassels, Pichwai art
- Curtains: layered — sheer underneath with heavier silk/damask drapes
- Color palette: ivory, gold, burgundy accents, dark wood, rich but not garish
- DO NOT add: modern minimalist pieces, industrial elements, plastic/acrylic`,

  "Warm & cozy": `AESTHETIC — Warm & Cozy:
- Walls: warm plaster in soft terracotta/clay tones, or warm white with one accent wall in deep warm tone
- Flooring: warm-toned wood (walnut, teak) with layered area rugs (Persian or kilim style)
- Furniture: deep comfortable sofas in warm brown leather (cognac Chesterfield) or warm-toned fabric. Chunky wooden coffee table. Cozy armchairs with throw blankets.
- Decor: stacked books, lit candles (multiple), warm-toned pottery, woven baskets, table lamps with warm glow, family photos in simple frames, fresh flowers
- Curtains: natural linen in warm oatmeal/camel tones
- Color palette: warm browns, cognac, camel, burnt orange, warm cream, touches of forest green
- DO NOT add: cold grey tones, chrome/steel, stark white, clinical modern pieces`,

  "Contemporary": `AESTHETIC — Contemporary:
- Walls: clean lines — smooth white or light grey, one bold feature wall (dark charcoal, textured concrete, or large-format stone)
- Flooring: polished concrete, large-format grey tiles, or dark engineered wood
- Furniture: modular sofas in charcoal or deep navy, geometric coffee tables in marble or blackened steel, sculptural dining chairs. Clean geometric forms.
- Decor: large-scale abstract art (bold color or monochrome), sculptural objects, architectural coffee table books, a single dramatic plant (monstera, fiddle leaf)
- Curtains: motorized roller shades or minimal track curtains in grey
- Color palette: black, white, grey, one bold accent (deep blue, terracotta, or emerald)
- DO NOT add: traditional ornate pieces, busy patterns, brass urlis, rustic elements`,

  "Rustic": `AESTHETIC — Rustic:
- Walls: exposed brick (one or two walls), remaining walls in warm plaster or lime wash
- Flooring: reclaimed wood planks or aged terracotta tiles
- Furniture: solid wood tables with visible grain (not too polished), leather sofas in aged brown, wrought iron accents. Farmhouse dining table with bench seating.
- Decor: woven baskets, terracotta pots with greenery, wrought iron candle holders, vintage frames, linen napkins, wooden cutting boards displayed
- Curtains: simple cotton or burlap panels, or no curtains — wooden shutters
- Color palette: earth tones — warm brown, terracotta, sage green, cream, charcoal
- DO NOT add: shiny chrome, velvet, crystal, ornate gilding, overly polished surfaces`,
};

function getVibeDetails(vibe: string): string {
  // Check for exact match first
  if (VIBE_DETAILS[vibe]) return VIBE_DETAILS[vibe];
  // Check for partial match
  const lower = vibe.toLowerCase();
  for (const [key, value] of Object.entries(VIBE_DETAILS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return value;
  }
  // If user typed a custom vibe, wrap it with the default as fallback
  return `AESTHETIC — ${vibe}:\nApply this style: "${vibe}". Use your best judgment for furniture, materials, and decor that match this description.\n\nFallback reference (if unsure):\n${VIBE_DETAILS["Modern Indian"]}`;
}

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
  let instruction = `PRODUCT INTEGRITY: The ${product.name} must look EXACTLY like the reference image — same design, same number of arms/shades/crystals, same proportions between parts. Do NOT add or remove any elements. Do NOT redesign or reinterpret the fixture.`;

  instruction += "\n\nSCALE — COMMON MISTAKE: AI tends to make fixtures TOO SMALL. Err on the side of LARGER rather than smaller. A light fixture should be a prominent design element, not a tiny afterthought lost in the room.";

  instruction += "\n\nSize by room type:";

  const sizeByRoom: Record<string, string> = {
    formal_living: "For a formal living room: the fixture should be substantial — at least 24-36 inches wide. It is the centerpiece of the room. Hang it centered in the main seating area, not off to the side or in front of a wall.",
    family_lounge: "For a family lounge: 24-30 inches wide. Centered over the main seating area.",
    dining_room: "For a dining room: centered directly above the dining table, spanning about 1/2 to 2/3 the width of the table. Hang 30-36 inches above the table surface.",
    bedroom: "For a bedroom: 20-28 inches wide. Centered in the room or over the bed.",
    entrance_lobby: "For an entrance lobby/foyer: the fixture should be LARGE and dramatic — 28-40 inches wide. This is the first thing visitors see. Hang it centered in the entrance space, NOT in front of a console or wall — in the CENTER of the open area where people walk in.",
    mandir: "For a mandir: 16-24 inches wide, centered above the prayer area.",
    stairwell: "For a stairwell/double-height space: the fixture can be very large — 36-60 inches. Hang on a long chain so it occupies the vertical space dramatically.",
    passage: "For a passage/corridor: 14-20 inches wide. If multiple fixtures, space them evenly along the passage.",
    terrace: "For a terrace: 24-32 inches wide. Centered in the covered area.",
    other: "Place the fixture centered in the main area of the room at a proportionate size — at least 24 inches wide for standard rooms.",
  };

  instruction += "\n" + (sizeByRoom[roomType] || sizeByRoom["other"]);

  instruction += "\n\nPlacement rules:";
  instruction += "\n- ALWAYS center the fixture in the PRIMARY open area of the room — where people gather or walk through.";
  instruction += "\n- Do NOT place the fixture in front of a wall, console, or artwork. It belongs in the CENTER of the space.";
  instruction += "\n- For reference: a standard sofa is ~7 feet wide, a dining table ~3-4 feet wide, a door is ~7 feet tall.";

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
    const styleDirection = vibe || DEFAULT_STYLE;

    prompt = `Edit this under-construction room photograph to add this exact light fixture: ${productDesc}.

ABSOLUTE RULES — STRUCTURAL PRESERVATION (CANNOT BE VIOLATED):
- EVERY wall, window, door, column, beam, ceiling structure, floor level, step, and platform MUST remain EXACTLY where they are. Do NOT add, remove, or move any wall.
- Exposed steel framing, metal studs, construction scaffolding, false ceiling grid/framework = these are STRUCTURAL. They MUST stay visible exactly as they are.
- Every window and door opening MUST keep its exact position, size, and shape. Do NOT fill in, shrink, or enlarge any opening.
- Construction equipment, tools, building materials visible in the photo = keep them OR remove them, but do NOT build new walls or structures in their place.
- Already-installed finishes (stone cladding, tiles, woodwork, marble, flooring) = keep exactly as-is. These are DONE. If the floor is already tiled or has marble/stone, do NOT change it — it stays as-is even if the rest of the room is unfinished.

WHAT YOU MAY DO:
- Add this light fixture to the ceiling in the appropriate position for a ${roomLabel}
- Apply paint, wall treatment, or paneling ONLY on bare plaster/concrete surfaces (NOT where steel framing is exposed — that stays as-is)
- Add furniture and movable decor items
- Add curtains/window treatments over existing windows (without changing the window itself)
- Minor ceiling finishing where there is bare plaster (NOT where false ceiling grid is exposed — that framework stays visible)
- Add a partition or room divider (movable furniture), but NEVER a new wall

SCALE — THIS IS CRITICAL:
${scaleInstruction}

${getVibeDetails(styleDirection)}
Apply this style ONLY to unfinished bare surfaces and added furniture/decor.

CRITICAL FLOORING RULE: If floor already has tiles/marble/stone — DO NOT CHANGE IT. Only apply new flooring to bare concrete/cement.

QUALITY:
- Maintain the exact same camera angle and perspective.
- This must look like a real photograph, not a CGI render.`;
  }

  if (roomState === "furnished" && vibe) {
    prompt += `\n\nNote: The customer describes their preferred style as "${vibe}". The fixture should feel at home in this aesthetic.`;
  }

  const negativePrompt = [
    "oversized fixture", "wrong scale", "too large",
    "CGI", "3D render", "composite look", "pasted look",
    "new walls added", "walls moved", "walls removed",
    "window changed", "window filled in", "door moved",
    "structural changes", "different room layout", "different room shape",
    "exposed framing hidden", "steel studs covered",
    "brass pots", "urli", "jute rug", "block print",
    "velvet curtains", "velvet sofa", "olive green sofa",
    "jewel-tone furniture", "bohemian", "kitchen island",
  ].join(", ");

  return { prompt, negativePrompt };
}
