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
  if (product.widthInches) {
    return `The ${product.name} is approximately ${product.widthInches} inches wide${
      product.heightInches ? ` and ${product.heightInches} inches tall` : ""
    } in real life.`;
  }

  const sizeGuide: Record<string, string> = {
    small: "This is a SMALL light fixture — about 12-16 inches wide. It should look compact and delicate relative to the room, NOT dominant.",
    medium: "This is a MEDIUM sized light fixture — about 18-24 inches wide. It should look proportionate to the room, like a tasteful accent — NOT oversized or dominant.",
    large: "This is a LARGE light fixture — about 28-36 inches wide. It is a statement piece but must still be proportionate to the room.",
  };

  let instruction = sizeGuide[product.size] || sizeGuide["medium"];

  if (roomType === "stairwell") {
    instruction += " In this double-height space, the fixture can hang on a longer chain and appear larger than in a standard room.";
  }

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

STYLE DIRECTION: ${styleDirection}
Apply this style ONLY to unfinished bare surfaces and added furniture/decor.

DEFAULT AESTHETIC (Delhi luxury Indian modern):
- Walls (bare plaster only): paneled walls in warm taupe/cream with brass trim, or dark wood paneling
- Flooring (ONLY if floor is bare concrete/cement): Italian marble or dark polished wood. If floor already has tiles/marble/stone — DO NOT CHANGE IT.
- Furniture: quilted fabric sofas in cream/beige/charcoal/warm grey. Marble-top coffee tables with brass jali-cut legs. Dining chairs with ribbed fabric and brass handles.
- Decor: contemporary Indian art, embroidered cushions in dark navy/black, crystal bowls, brass figurines, coffee table books, candles, elegant sheer curtains
- DO NOT add: brass pots/urlis/jars, jute rugs, block prints, velvet curtains/sofas, jewel-tone furniture, olive green sofas

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
