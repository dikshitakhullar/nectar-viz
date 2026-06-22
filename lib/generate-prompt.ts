import { Product, RoomType, RoomState } from "./types";

const DEFAULT_STYLE = "Modern Indian";

// ─── SHARED CONSTANTS ─────────────────────────────────────────────────────────

const ORIENTATION_RULE =
  "Preserve the input photo's exact aspect ratio and orientation. " +
  "Portrait input = portrait output; landscape = landscape. " +
  "Do not crop, rotate, or change the field of view.";

const STRUCTURE_PRESERVATION =
  "Count walls, windows, doors, columns, beams, and ceiling structure in " +
  "the input photo. Output MUST have the SAME count and SAME positions. " +
  "Do not add, remove, move, or resize any of these.";

const FIXTURE_FIDELITY =
  "Match the fixture EXACTLY to the reference image — same design, " +
  "same number of arms/shades/crystals, same proportions between parts. " +
  "Do not add, remove, or reinterpret any element of the fixture.";

const INSTALLATION_GEOMETRY =
  "INSTALLATION GEOMETRY (critical — fixture must look installed by a " +
  "professional, not tilted/swinging):\n" +
  "- Ceiling-mounted fixtures (chandeliers, pendants, clusters, linear bars) " +
  "MUST hang perfectly LEVEL — long axis exactly parallel to the floor and ceiling, " +
  "perpendicular to gravity. No tilt, no skew, no rotation off the horizontal plane.\n" +
  "- Suspension rod/chain/cable hangs straight DOWN (true vertical, perpendicular " +
  "to the floor). Never angled. Never curving.\n" +
  "- Linear / rectangular fixtures: their long edge must be PARALLEL to the room's " +
  "longest wall or the dining/console below them, not at a random angle.\n" +
  "- Wall sconces: mounted FLUSH and PLUMB on the wall, perfectly vertical.\n" +
  "- Centered on the natural focal axis (above table/console center, room center, " +
  "or bay center) — never offset from that axis.";

const LIGHTING_INTEGRATION =
  "LIGHTING INTEGRATION (fixture must look LIT and INTEGRATED, not pasted on):\n" +
  "- Fixture appears ON — bulbs glowing warmly\n" +
  "- Soft warm light spill on nearby ceiling and upper walls\n" +
  "- Subtle shadow cast on nearby surfaces (floor for ceiling fixtures, wall behind for sconces)\n" +
  "- Match the room's existing color temperature\n" +
  "- Reflective surfaces (brass, crystal) pick up the room's light direction\n" +
  "- No hard cutout edges — camera captured fixture WITH the room";

const PRODUCT_HERO_BALANCE =
  "PRODUCT HERO (fixture must be the visual hero of the shot):\n" +
  "- If bright daylight in the photo would overpower the fixture's glow, " +
  "use natural compositional darkening — subtle vignetting toward the fixture, " +
  "shift midday to late-afternoon warmth, reduce direct sunlight intensity\n" +
  "- Fixture brightness always reads INTENTIONAL and WARM — never washed out\n" +
  "- Do NOT overdramatically dim (no night-from-daytime); keep the photo's character";

const ROOM_ASSESSMENT =
  "ASSESS THE ROOM STATE FIRST:\n" +
  "For each visible surface, classify it:\n" +
  "- FINISHED = painted walls, installed tiles/marble/stone, completed ceiling " +
  "(painted, with cornice/cove/false-ceiling work), installed doors with frames, " +
  "polished floors → LOCK and preserve EXACTLY as photographed\n" +
  "- BARE = raw cement/plaster, exposed brick, raw concrete ceiling without finish, " +
  "exposed beams, missing flooring (subfloor or protective covering only) → " +
  "FAIR GAME to treat per the style direction\n" +
  "Exposed structural elements (steel framing, scaffolding) are STRUCTURAL — stay visible.\n" +
  "Then scale your creative liberty:\n" +
  "- MOSTLY FINISHED → respect ALL finished surfaces; only treat bare ones; add fixture + 1-2 light decor touches\n" +
  "- PARTIAL MIX → treat only bare surfaces; preserve finished; add fixture + 2-3 decor touches\n" +
  "- FULLY RAW → full liberty on materials/finishes/decor per style direction";

const DECOR_LIVED_IN =
  "DECOR — lived-in and personal, like a recently-moved-into home, not staged.\n" +
  "ALWAYS add at least 1-2 decor touches for under-construction renders. An empty " +
  "room or hallway feels unfinished — even a single framed artwork transforms it.\n" +
  "Empty-surface heuristics (apply each that matches):\n" +
  "- EMPTY WALLS visible? Add framed art (1 piece for short walls, 2-3 for long " +
  "walls) OR wall paneling/molding per the vibe (cleaner choice for hallways).\n" +
  "- EMPTY CORNERS? Add a plant in a simple pot.\n" +
  "- LONG CORRIDORS or empty floor stretches? Add a textured runner.\n" +
  "- EMPTY console/shelf area? A small vase or stack of books.\n" +
  "Volume guidance:\n" +
  "- Mostly-finished: 1-2 touches MINIMUM\n" +
  "- Partial mix: 2-3 touches\n" +
  "- Fully raw: full styling per vibe, but UNDER-stated\n" +
  "NEVER: sofas blocking walls, big tables obscuring views, clutter, more than " +
  "3-4 decor items in a small space.";

const CONSTRUCTION_CLEANUP =
  "REMOVE CONSTRUCTION DEBRIS: If the photo shows removable construction-stage " +
  "coverings on top of otherwise-finished surfaces — brown protective paper on " +
  "floors, drop cloths, plastic sheets, painter's tape, scattered tools, stacked " +
  "materials — REMOVE these in the render. Show the finished surface underneath " +
  "(which counts as FINISHED for assessment). The customer clears these before " +
  "move-in; the render previews the finished state.";

const FURNISHED_PRESERVATION =
  "FURNISHED PRESERVATION: do NOT move, alter, add, or remove ANY existing " +
  "furniture, rug, curtain, artwork, or decor. The ONLY change allowed is " +
  "adding this ONE light fixture. If there's an existing ceiling fan or basic " +
  "light where the fixture should go, replace ONLY that element.";

const GLOBAL_NEGATIVES =
  "AVOID: pasted-on or composite look, CGI render appearance, hard cutout " +
  "edges around the fixture, fixture lost in ambient, sterile empty space, " +
  "structural changes to the room.";

// ─── VIBE BLOCKS ──────────────────────────────────────────────────────────────

interface VibeBlock {
  toneSummary: string;
  walls: string;
  ceiling: string;
  flooring: string;
  furniture: string;
  curtains: string;
  decor: string;
  colorPalette: string;
  doNotAdd: string;
}

export const VIBES: Record<string, VibeBlock> = {
  "Modern Indian": {
    toneSummary:
      "Modern Indian Luxury — cream warm-whites with brass trim, polished marble, layered tray ceilings with warm cove light, Indian figurative art as the hero. Restrained luxury, never garish.",
    walls:
      "Walls: cream/warm-white paneled with thin brass trim or molding frames. Walnut accent paneling with jali-screen cutouts or beaded vertical trim. Or smooth warm plaster/microcement.",
    ceiling:
      "Ceiling: layered tray with fluted/ribbed border details, warm LED cove lighting. Cream or warm-taupe tones.",
    flooring:
      "Flooring: polished Italian marble — white/grey with dramatic veining (Calacatta or Statuario) OR warm sand-toned stone. Never dark floors.",
    furniture:
      "Furniture: cream/off-white contemporary sofas with curved lines. Green marble or onyx coffee tables on brass conical bases. Walnut side tables with brass accents. Low-profile but substantial.",
    curtains:
      "Curtains: sheer champagne/cream with pleated valance. Never velvet or jewel-tone.",
    decor:
      "Decor: Indian figurative art as hero — Pichwai paintings, Mughal miniatures, M.F. Husain-style figures in ornate frames. Silver/brass figurines (Nandi, elephants). Embroidered cushions in navy/black with Indian motifs.",
    colorPalette:
      "Palette: cream, warm white, gold/brass, sage/jade green, warm walnut brown. Vivid color pops ONLY from artwork.",
    doNotAdd:
      "AVOID: brass pots/urlis/jars, jute rugs, block prints, velvet, jewel-tone furniture, olive green sofas, temple bells.",
  },

  "Minimal & elegant": {
    toneSummary:
      "Minimal & Elegant — warm beige plaster, sculptural curves, monochromatic neutrals, breathing room as the design. Architecture IS the decoration.",
    walls:
      "Walls: smooth warm beige/sand plaster or microcement. One dramatic feature — backlit onyx/marble slab panel OR a large-scale organic art installation (river cutouts, abstract landscape mural).",
    ceiling:
      "Ceiling: sculptural tray with organic flowing plaster forms. Soft blue-grey painted sky/cloud panels optional. Warm LED cove. Rounded, never angular.",
    flooring:
      "Flooring: light marble or pale limestone with subtle veining. Light oak hardwood as alternative. Soft wave-pattern or organic-shaped rugs in cream/sand.",
    furniture:
      "Furniture: curved serpentine sofas in white/cream boucle. Organic light-stone or cream coffee tables. Rounded poufs/ottomans. Everything low-profile with soft edges. No sharp geometry.",
    curtains:
      "Curtains: floor-to-ceiling sheer white or champagne linen panels.",
    decor:
      "Decor: ONE dramatic art piece (backlit installation, abstract mural, or large sculpture). A single white floral arrangement. One or two hardcover books. Surfaces mostly empty — leave breathing room.",
    colorPalette:
      "Palette: cream, warm sand, soft beige, pale grey, touches of blue-grey. Monochromatic warm neutrals with ONE muted accent maximum.",
    doNotAdd:
      "AVOID: heavy ornate pieces, busy patterns, brass detailing, dark colors, cluttered surfaces, multiple art pieces.",
  },

  "Classical / ornate": {
    toneSummary:
      "Classical Ornate — raised panel molding, coffered ceilings, gilt mirrors and oil paintings, deep teal and antique gold. Grand and richly layered without being garish.",
    walls:
      "Walls: classical raised-panel molding with deep crown profiles in cream/ivory. Deep teal or petrol blue as a rich alternative. Antique European pastoral tapestries in ornate frames. Arched niches with carved trim.",
    ceiling:
      "Ceiling: coffered/paneled with classical plaster medallions, acanthus leaf molding, deep crown profiles. Cream/warm white. High and grand.",
    flooring:
      "Flooring: dark marble (Nero Marquina, dark emperador) OR polished dark wood parquet/herringbone. Black-and-white geometric marble inlays (star/pinwheel) for foyers.",
    furniture:
      "Furniture: cream skirted sofas with wood-trimmed arms (English style). Gilt-frame bergere chairs. Glass-top brass coffee tables. Dark wood dining table with carved legs and upholstered chairs.",
    curtains:
      "Curtains: layered — sheer under heavier silk/damask in champagne or taupe. Full-height, puddling slightly.",
    decor:
      "Decor: ornate gilt-frame mirrors, antique European tapestries, crystal candlesticks with black tapers, blue-and-white chinoiserie plates, silver tea service, classical white marble busts. Oil paintings in gold frames.",
    colorPalette:
      "Palette: cream, deep teal, antique gold, dark wood, burgundy accents, black-and-white marble. Rich but not garish.",
    doNotAdd:
      "AVOID: modern minimalist pieces, industrial elements, plastic/acrylic, chrome.",
  },

  "Warm & cozy": {
    toneSummary:
      "Warm & Cozy — channel-tufted upholstery, walnut wood, layered Persian rugs, dark cocooning ceilings, candlelit and lived-in. Everything invites sinking in.",
    walls:
      "Walls: channel-tufted fabric or upholstered panels in champagne/beige. Warm walnut wood paneling. Warm plaster in soft clay/terracotta. Fluted/ribbed panel details.",
    ceiling:
      "Ceiling: dark painted (chocolate brown or warm taupe) to compress space into a cocoon. Tray with gold accent trim and warm LED cove. Low and intimate.",
    flooring:
      "Flooring: warm-toned wood (walnut, honey oak) with layered rugs — Persian underneath, textured cream/sand on top. Chevron or parquet.",
    furniture:
      "Furniture: deep channel-tufted sofas and headboards in cream/beige. Cognac leather Chesterfield or barrel chairs. Chunky walnut coffee tables. Upholstered benches at the foot of the bed.",
    curtains:
      "Curtains: natural linen in warm oatmeal/camel, heavy enough to feel cocooning.",
    decor:
      "Decor: multiple lit pillar candles, cashmere/knit throws in dusty blue or camel, stacked books, warm-toned pottery, smoked-glass amber-glow lamps, olive branches in simple vases, autumn-toned botanical art.",
    colorPalette:
      "Palette: cognac, camel, champagne, warm walnut brown, soft terracotta/rust accents, dusty blue as the one cool accent. Everything warm-toned.",
    doNotAdd:
      "AVOID: cold grey tones, chrome/steel, stark white, clinical modern pieces, bright overhead lighting.",
  },

  "Contemporary": {
    toneSummary:
      "Contemporary — flat walnut paneling, sculptural relief walls, large-format stone floors, curved modular seating, ONE bold art piece. Earth tones with restraint, materials speak.",
    walls:
      "Walls: flat walnut paneling with clean seams (not ornate). 3D sculptural relief panels in cream/white with abstract organic shapes. Backlit marble/onyx feature walls. Fluted vertical panels or crane/nature murals.",
    ceiling:
      "Ceiling: flat modern in warm taupe/grey with black recessed linear track lighting. Stepped false ceiling with warm cove. Clean and architectural.",
    flooring:
      "Flooring: light warm stone or concrete-look tiles in sand/beige. Large-format. Textured neutral rugs with abstract or wave patterns.",
    furniture:
      "Furniture: large curved/modular sectional sofas in olive/sage, cream boucle, or chocolate brown. Sculptural coffee tables in green marble, travertine, or bronze. Mushroom-shaped walnut stools. Organic forms mixed with geometric.",
    curtains:
      "Curtains: heavy taupe drapes OR minimal roller shades. Not fussy.",
    decor:
      "Decor: ONE bold abstract/figurative painting (pop-art, surrealist, or Cubist in vivid colors). Sculptural objects. Tall ceramic cactus or single dramatic plant. Dried branches in dark vases. Minimal objects — let materials speak.",
    colorPalette:
      "Palette: warm sand, walnut brown, olive/sage green, terracotta, charcoal, cream. Earth tones with ONE bold art-driven color pop.",
    doNotAdd:
      "AVOID: traditional ornate pieces, busy textile patterns, brass urlis, chinoiserie, multiple small decorative objects.",
  },

  "Rustic": {
    toneSummary:
      "Rustic — exposed brick, lime-wash plaster, reclaimed wood, aged leather, wrought iron. Honest materials, visible grain, lived-in farmhouse warmth.",
    walls:
      "Walls: exposed brick on one or two walls; remaining walls in warm lime-wash or raw plaster finish.",
    ceiling:
      "Ceiling: exposed wooden beams or raw plaster. Warm and unfussy.",
    flooring:
      "Flooring: reclaimed wood planks with visible grain OR aged terracotta tiles.",
    furniture:
      "Furniture: solid wood tables with visible grain and natural imperfections (not polished). Aged brown leather sofas. Wrought iron accents. Farmhouse dining table with bench seating. Chunky proportions.",
    curtains:
      "Curtains: simple cotton or burlap panels — or no curtains, wooden shutters instead.",
    decor:
      "Decor: woven baskets, terracotta pots with trailing greenery, wrought iron candle holders, vintage frames, linen napkins, wooden cutting boards displayed, dried herbs hanging.",
    colorPalette:
      "Palette: earth tones — warm brown, terracotta, sage green, cream, charcoal.",
    doNotAdd:
      "AVOID: shiny chrome, velvet, crystal, ornate gilding, overly polished surfaces, glass furniture.",
  },

  "Indian Maximalist": {
    toneSummary:
      "Indian Maximalist — saturated lacquered walls, salon-style gallery hangs, chinoiserie porcelain, eclectic furniture mix, layered Persian rugs. Abundance and confident layering.",
    walls:
      "Walls: bold saturated color — coral-red/vermilion lacquer, deep teal/hunter green, or rich navy. Salon-style gallery hang with MULTIPLE framed artworks (Indian miniatures, landscape oils, figurative in ornate gold/dark frames). Lacquered built-in bookshelves.",
    ceiling:
      "Ceiling: natural wood plank, woven cane/rattan barrel vault, or dark painted to match walls. Not minimal.",
    flooring:
      "Flooring: deep red/navy Persian or Oriental rugs with intricate patterns. Navy-and-white striped dhurrie as alternative. Geometric marble inlays for grand spaces.",
    furniture:
      "Furniture: eclectic MIX is key — toile-upholstered daybed with hunting scenes ALONGSIDE carved cane-back colonial chairs ALONGSIDE tufted Chesterfield in gold/olive. Black lacquer chests with brass hardware. Chinoiserie X-leg tables. Red leather bar stools. Vintage leather trunks as side tables.",
    curtains:
      "Curtains: heavy drapes in dark teal or cream silk, layered with sheers.",
    decor:
      "Decor: blue-and-white chinoiserie porcelain (ginger jars, vases, plates — ESSENTIAL). Brass foo-dog or griffin figural lamps with green tole shades. Ikat, kilim, and floral-embroidered cushions mixed. Silver elephant/Nandi figurines. Red berries with white hydrangea. Stacked designer coffee table books. Black tapers in crystal holders.",
    colorPalette:
      "Palette: coral-red, deep teal, navy, cream, sepia gold, black lacquer. Bold and saturated with warm undertones — many colors coexisting confidently.",
    doNotAdd:
      "AVOID: minimalist furniture, bare walls, monochrome palette, modern track lighting, empty surfaces.",
  },

  "Art Deco": {
    toneSummary:
      "Art Deco — warm taupe plaster, geometric marble inlay floors, mirrored or cane-vault ceilings, twisted carved columns, glamorous geometry in brass and burgundy.",
    walls:
      "Walls: warm taupe or putty-colored smooth plaster. Curved-molding archways. Sage green paneled cabinetry with glass-fronted displays. Geometric carved relief details.",
    ceiling:
      "Ceiling: mirrored or reflective glass panels with geometric brass/gold Art Deco framing. Woven cane barrel-vault with backlit center panels as alternative. Dramatic and glamorous.",
    flooring:
      "Flooring: geometric marble inlay — star/pinwheel/chevron in white marble with dark grey or burgundy stone. Ornamental and high-contrast.",
    furniture:
      "Furniture: oval-back chairs in dark wood with chinoiserie/floral upholstered seats. Barley-sugar or twisted carved columns. Houndstooth-check benches in pink-red and cream. Marble-topped vanity islands. Strong geometric silhouettes in dark wood.",
    curtains:
      "Curtains: silk or satin in champagne/gold with geometric pleating.",
    decor:
      "Decor: crystal multi-arm chandeliers, globe/orb wall sconces in brass, Indian deity paintings as focal art, geometric brass framing on everything, perfume bottles and displayed accessories as decor.",
    colorPalette:
      "Palette: warm taupe, black, white marble, gold/brass, sage green, burgundy, houndstooth patterns. Glamorous geometry.",
    doNotAdd:
      "AVOID: rustic elements, distressed finishes, casual fabrics, minimal/bare surfaces.",
  },
};

// ─── VIBE CONTENT SELECTOR ────────────────────────────────────────────────────

export type PreserveMode = "auto" | "on" | "off";
export type AddDecorMode = "auto" | "on" | "off";

export function buildVibeContent(
  vibeName: string | undefined,
  roomState: RoomState,
  preserveFinishes: PreserveMode = "auto",
  addDecor: AddDecorMode = "auto",
  addCurtains: boolean = false,
): string {
  const effectiveName = vibeName || DEFAULT_STYLE;
  const v = VIBES[effectiveName];

  // Custom vibe fallback — model handles named styles well, no need for full reference
  if (!v) {
    return `Apply this style: "${effectiveName}". Use best judgment for materials, furniture, and decor that fit this description.`;
  }

  if (roomState === "furnished") {
    return `STYLE: Fixture should feel at home in a ${v.toneSummary} Bulb tone and reflective finishes align with this style.`;
  }

  // Under-construction — depth controlled by preserveFinishes
  const includeDecor = addDecor !== "off";

  if (preserveFinishes === "on") {
    const parts = [`STYLE: ${v.toneSummary}`];
    if (includeDecor) parts.push(v.decor);
    return parts.join("\n");
  }

  if (preserveFinishes === "off") {
    // Fully raw — full block
    const parts = [
      `STYLE — full direction:`,
      v.toneSummary,
      v.walls,
      v.ceiling,
      v.flooring,
      v.furniture,
    ];
    if (addCurtains) parts.push(v.curtains);
    if (includeDecor) parts.push(v.decor);
    parts.push(v.colorPalette);
    parts.push(v.doNotAdd);
    return parts.join("\n");
  }

  // AUTO — partial mix, surfaces likely treated
  const parts = [
    `STYLE: ${v.toneSummary}`,
    `Bare walls: ${v.walls.replace(/^Walls:\s*/, "")}`,
    `Bare ceiling: ${v.ceiling.replace(/^Ceiling:\s*/, "")}`,
  ];
  if (includeDecor) parts.push(v.decor);
  parts.push(v.colorPalette);
  parts.push(v.doNotAdd);
  return parts.join("\n");
}

// ─── ROOM TYPE LABELS (kept as-is per constraints) ────────────────────────────

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
  bar: "bar / home bar area",
  other: "room",
};
// ROOM_TYPE_LABELS retained for any future use; not referenced in the new builder.
void ROOM_TYPE_LABELS;

// ─── SCALE INSTRUCTION ────────────────────────────────────────────────────────

export function getScaleInstruction(_product: Product, roomType: RoomType): string {
  const sizeByRoom: Record<RoomType, string> = {
    formal_living: '24-36" wide, centered in main seating area',
    family_lounge: '24-30" wide, centered over main seating',
    dining_room: '½ to ⅔ the table width, 30-36" above tabletop',
    bedroom: '20-28" wide, centered in room or over bed',
    entrance_lobby: '28-40" wide, centered in OPEN entrance area (not over console)',
    mandir: '16-24" wide, centered above prayer area',
    stairwell: '36-60" wide, hung on long chain for vertical drama',
    passage: '14-20" wide, spaced evenly if multiple',
    terrace: '24-32" wide, centered in covered area',
    bar: '18-28" wide, 30-36" above bar counter; 24-30" apart if multiple',
    other: 'at least 24" wide for standard rooms, centered in main area',
  };
  const sizeText = sizeByRoom[roomType] ?? sizeByRoom.other;
  return (
    "SCALE — err LARGER not smaller. Fixture should be a prominent design " +
    `element, not a tiny afterthought. Size: ${sizeText}. ` +
    "Always center in the main open area where people gather/walk — " +
    "NEVER in front of a wall or console."
  );
}

// ─── PRODUCT DESCRIPTION (kept as-is per constraints) ─────────────────────────

function getProductDescription(product: Product): string {
  if (product.description) return product.description;
  return `${product.name} — a ${product.size || "medium"} ${product.material || "brass"} ${product.category} with ${product.finish || "antique"} finish`;
}

// ─── MAIN PROMPT BUILDER ──────────────────────────────────────────────────────

export function buildPrompt(
  product: Product,
  roomType: RoomType,
  roomState: RoomState,
  vibe?: string,
  options: {
    preserveFinishes?: PreserveMode;
    addDecor?: AddDecorMode;
    addCurtains?: boolean;
  } = {},
): { prompt: string; negativePrompt: string } {
  const productDesc = getProductDescription(product);
  const isFurnished = roomState === "furnished";

  const intro = isFurnished
    ? `Edit this room photograph to add this exact light fixture: ${productDesc}.`
    : `Edit this under-construction room photograph to add this exact light fixture: ${productDesc}.`;

  // ─── MUST PRESERVE ───
  const mustPreserve = [
    "MUST PRESERVE (these override everything below):",
    `1. ${ORIENTATION_RULE}`,
    `2. ${STRUCTURE_PRESERVATION}`,
    `3. ${FIXTURE_FIDELITY}`,
  ].join("\n");

  // ─── INTEGRATE WELL ───
  const integrateParts: string[] = ["INTEGRATE WELL:"];
  if (isFurnished) {
    integrateParts.push(FURNISHED_PRESERVATION);
  } else {
    integrateParts.push(ROOM_ASSESSMENT);
    integrateParts.push(CONSTRUCTION_CLEANUP);
  }
  integrateParts.push(getScaleInstruction(product, roomType));
  integrateParts.push(INSTALLATION_GEOMETRY);
  integrateParts.push(LIGHTING_INTEGRATION);
  integrateParts.push(PRODUCT_HERO_BALANCE);
  if (!isFurnished) {
    integrateParts.push(DECOR_LIVED_IN);
  }
  const integrateWell = integrateParts.join("\n\n");

  // ─── STYLE ───
  const style = buildVibeContent(
    vibe,
    roomState,
    options.preserveFinishes,
    options.addDecor,
    options.addCurtains,
  );

  const prompt = [intro, mustPreserve, integrateWell, style, GLOBAL_NEGATIVES].join("\n\n");

  // Negative prompt absorbed into GLOBAL_NEGATIVES; caller no longer needs to append.
  return { prompt, negativePrompt: "" };
}
