import { Product, RoomType, RoomState } from "./types";

const DEFAULT_STYLE = "Modern Indian";

const VIBE_DETAILS: Record<string, string> = {
  "Modern Indian": `AESTHETIC — Modern Indian Luxury:
- Walls: cream/warm white paneled walls with thin brass trim or molding frames. Walnut wood accent paneling with jali-screen cutouts or beaded vertical trim. Some walls in smooth warm plaster or microcement.
- Flooring: polished Italian marble — white/grey with dramatic veining (Calacatta or Statuario style) OR warm sand-toned stone. Never dark floors.
- Ceiling: layered tray ceiling with fluted/ribbed border details and warm LED cove lighting. Cream or warm taupe tones.
- Furniture: cream/off-white contemporary sofas with clean curved lines. Green marble or onyx coffee tables on gold/brass conical bases. Ribbed/fluted cream dining chairs. Walnut side tables with brass accents. Low-profile but substantial.
- Decor: Indian figurative art is the HERO — Pichwai paintings (Krishna, cows, lotus), M.F. Husain-style figures, Kalighat paintings, Mughal miniatures in ornate frames. Silver or brass figurines (Nandi, elephants). Red crystal bowls. Embroidered cushions in navy/black with Indian motifs. Coffee table books. Kashmiri shawls framed as wall art.
- Curtains: elegant sheer curtains in champagne/cream with pleated valance — NOT velvet, NOT jewel-tone
- Color palette: cream, warm white, gold/brass, sage/jade green, warm walnut brown. Pops of vivid color ONLY from artwork (blues, reds, greens). Base stays neutral.
- DO NOT add: brass pots/urlis/jars, jute rugs, block prints, velvet curtains/sofas, jewel-tone furniture, olive green sofas, temple bells`,

  "Minimal & elegant": `AESTHETIC — Minimal & Elegant:
- Walls: smooth warm beige/sand plaster or microcement. One dramatic feature: backlit onyx/marble slab panel OR a large-scale organic art installation (river-shaped cutouts, abstract landscape murals). Sheer curtains as soft dividers.
- Flooring: light marble or pale limestone with subtle veining. Light oak hardwood as alternative. Soft wave-pattern or organic-shaped area rugs in cream/sand.
- Ceiling: sculptural tray ceilings with organic flowing plaster forms. Painted sky/cloud panels in soft blue-grey for dreamy effect. Warm LED cove lighting. Rounded, never angular.
- Furniture: curved serpentine sofas in white/cream boucle. Organic-shaped coffee tables in light stone or cream. Rounded poufs/ottomans. Everything low-profile with soft edges. NO sharp geometric forms.
- Decor: ONE dramatic art piece (backlit installation, abstract mural, or large sculpture). A single white floral arrangement. One or two hardcover books. LEAVE BREATHING ROOM — surfaces should be mostly empty. The architecture IS the decoration.
- Curtains: floor-to-ceiling sheer white or champagne linen panels
- Color palette: cream, warm sand, soft beige, pale grey, touches of blue-grey. Entirely monochromatic warm neutrals. ONE muted accent maximum.
- DO NOT add: heavy ornate pieces, busy patterns, brass detailing, dark colors, cluttered surfaces, multiple art pieces, decorative objects on every surface`,

  "Classical / ornate": `AESTHETIC — Classical Ornate:
- Walls: classical raised panel molding with deep crown profiles in cream/ivory. Deep teal or petrol blue paint as a rich alternative. Antique European pastoral tapestries in ornate frames as focal walls. Arched niches and doorways with carved trim.
- Flooring: dark marble (Nero Marquina, dark emperador) OR polished dark wood parquet/herringbone. Black-and-white geometric marble inlays (star/pinwheel patterns) for foyers/hallways.
- Ceiling: coffered/paneled with classical plaster medallions, acanthus leaf molding, deep crown profiles. Cream/warm white. High and grand.
- Furniture: cream skirted sofas with wood-trimmed arms (English style). Gilt-frame bergere chairs. Glass-top brass coffee tables. Wingback chairs in neutral fabric. Dark wood dining table with carved legs, upholstered dining chairs. Crystal balustrades on staircases.
- Decor: ornate gilt-frame mirrors, antique European tapestries, crystal candlesticks with black tapers, blue-and-white chinoiserie plates, silver tea service, classical white marble figurines/busts, heavy silk curtains with tassels. Oil paintings in gold frames.
- Curtains: layered — sheer underneath with heavier silk/damask drapes in champagne or taupe. Full-height, puddling slightly.
- Color palette: cream, deep teal, antique gold, dark wood, burgundy accents, black-and-white marble. Rich but not garish.
- DO NOT add: modern minimalist pieces, industrial elements, plastic/acrylic, chrome`,

  "Warm & cozy": `AESTHETIC — Warm & Cozy:
- Walls: channel-tufted fabric or upholstered panels in champagne/beige behind beds. Warm walnut wood paneling. Warm plaster in soft clay/terracotta tones. Fluted/ribbed panel details.
- Flooring: warm-toned wood (walnut, honey oak) with layered rugs — Persian rug underneath, textured cream/sand rug on top. Chevron or parquet patterns.
- Ceiling: dark painted ceiling (chocolate brown or warm taupe) to COMPRESS the space into a cocoon. Tray ceiling with gold accent trim and warm LED cove lighting. Low and intimate.
- Furniture: deep channel-tufted sofas and headboards in cream/beige. Cognac leather Chesterfield or barrel chairs. Chunky walnut coffee tables. Upholstered benches at foot of bed. Everything invites sinking in.
- Decor: lit candles (multiple, pillar style), cashmere/knit throw blankets in dusty blue or camel, stacked books, warm-toned pottery, smoked glass table lamps with amber glow, reed diffusers, olive branches in simple vases, autumn-toned botanical art.
- Curtains: natural linen in warm oatmeal/camel tones, heavy enough to feel cocooning
- Color palette: cognac, camel, champagne, warm walnut brown, soft terracotta/rust accents, dusty blue as one cool accent. Everything warm-toned.
- DO NOT add: cold grey tones, chrome/steel, stark white, clinical modern pieces, bright overhead lighting`,

  "Contemporary": `AESTHETIC — Contemporary:
- Walls: flat walnut wood paneling with clean seams (NOT ornate). 3D sculptural relief panels in cream/white with abstract organic shapes. Backlit marble or onyx slab feature walls. Fluted/ribbed vertical panels. Crane/nature murals for artistic accent.
- Flooring: light warm stone or concrete-look tiles in sand/beige. Large-format. Textured area rugs in neutral tones with abstract or wave patterns.
- Ceiling: flat modern in warm taupe/grey with black recessed linear track lighting. Stepped false ceiling with warm cove lighting. Clean and architectural.
- Furniture: large curved/modular sectional sofas in olive/sage, cream boucle, or chocolate brown. Sculptural coffee tables in green marble, travertine, or bronze. Mushroom-shaped walnut stools. Houndstooth or bold-pattern accent pieces. Organic flowing forms mixed with geometric.
- Decor: ONE bold abstract or figurative painting (pop-art, surrealist, Cubist style in vivid colors). Sculptural objects. Tall ceramic cacti or single dramatic plant. Dried branches in dark vases. Architectural coffee table books. MINIMAL objects — let materials speak.
- Curtains: heavy taupe curtains for windows OR minimal roller shades. Not fussy.
- Color palette: warm sand, walnut brown, olive/sage green, terracotta, charcoal, cream. Earth tones with ONE bold art-driven color pop.
- DO NOT add: traditional ornate pieces, busy textile patterns, brass urlis, chinoiserie, multiple small decorative objects`,

  "Rustic": `AESTHETIC — Rustic:
- Walls: exposed brick (one or two walls), remaining walls in warm lime-wash plaster or raw plaster finish
- Flooring: reclaimed wood planks with visible grain or aged terracotta tiles
- Furniture: solid wood tables with visible grain and natural imperfections (not polished), aged brown leather sofas, wrought iron accents. Farmhouse dining table with bench seating. Chunky proportions.
- Decor: woven baskets, terracotta pots with trailing greenery, wrought iron candle holders, vintage frames, linen napkins, wooden cutting boards displayed, dried herbs
- Curtains: simple cotton or burlap panels, or no curtains — wooden shutters
- Color palette: earth tones — warm brown, terracotta, sage green, cream, charcoal
- DO NOT add: shiny chrome, velvet, crystal, ornate gilding, overly polished surfaces, glass furniture`,

  "Indian Maximalist": `AESTHETIC — Indian Maximalist:
- Walls: BOLD saturated wall color — coral-red/vermilion lacquer, deep teal/hunter green, or rich navy. Salon-style gallery hanging with MULTIPLE framed artworks covering the wall (Indian miniatures, landscape oils, figurative art in ornate gold and dark frames). Antique tapestries in warm sepia/gold tones. Lacquered built-in bookshelves.
- Flooring: deep red/navy Persian or Oriental rugs with intricate traditional patterns. Navy-and-white striped dhurrie rugs as alternative. Geometric marble inlays for grand spaces.
- Ceiling: varied — natural wood plank, woven cane/rattan barrel vault, or dark painted to match walls. Not minimal.
- Furniture: eclectic MIX is key — toile-upholstered daybed with hunting scenes ALONGSIDE carved cane-back colonial chairs ALONGSIDE tufted Chesterfield in gold/olive. Black lacquer chests with brass hardware. Gothic-carved side cabinets. Chinoiserie X-leg tables. Red leather bar stools. Vintage leather travel trunks as side tables.
- Decor: blue-and-white chinoiserie porcelain (ginger jars, vases, plates — ESSENTIAL). Brass foo-dog or griffin figural lamps with green tole shades. Ikat, kilim, and floral-embroidered cushions mixed together. Silver elephant/Nandi figurines. Red berries and white hydrangea arrangements. Stacked Chanel/Louis Vuitton coffee table books. Black tapers in crystal holders. Red military jacket on mannequin form.
- Curtains: heavy drapes in dark teal or cream silk. Layered with sheers.
- Color palette: coral-red, deep teal, navy, cream, sepia gold, black lacquer. BOLD and saturated — warm undertones throughout. Many colors coexisting confidently.
- DO NOT add: minimalist furniture, bare walls, monochrome palette, modern track lighting, empty surfaces. This vibe is about ABUNDANCE and LAYERING.`,

  "Art Deco": `AESTHETIC — Art Deco:
- Walls: warm taupe or putty-colored smooth plaster. Archways with curved molding. Sage green paneled cabinetry with glass-fronted displays. Geometric carved or relief details.
- Flooring: geometric marble inlay — star/pinwheel/chevron patterns using white marble with dark grey or burgundy stone. Ornamental and high-contrast.
- Ceiling: mirrored or reflective glass panels with geometric brass/gold Art Deco framing. Woven natural cane barrel-vault ceilings with backlit center panels. Dramatic and glamorous.
- Furniture: oval-back chairs in dark wood with chinoiserie/floral upholstered seats. Barley-sugar or twisted carved columns. Houndstooth-check upholstered benches in pink-red and cream. Marble-topped vanity islands. Dark wood pieces with strong geometric silhouettes.
- Decor: crystal multi-arm chandeliers, globe/orb wall sconces in brass, Indian deity paintings as focal art, geometric brass framing on everything, perfume bottles, displayed accessories as decor.
- Curtains: silk or satin in champagne/gold tones, geometric pleating
- Color palette: warm taupe, black, white marble, gold/brass, sage green, burgundy, houndstooth patterns. Glamorous geometry.
- DO NOT add: rustic elements, distressed finishes, casual fabrics, minimal/bare surfaces`,
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
