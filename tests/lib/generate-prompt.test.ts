import { describe, it, expect } from "vitest";
import {
  buildPrompt,
  buildVibeContent,
  getScaleInstruction,
  VIBES,
} from "@/lib/generate-prompt";
import type { Product, RoomType, RoomState } from "@/lib/types";

const mockProduct: Product = {
  slug: "test",
  name: "Test Chandelier",
  description: "A test chandelier",
  brand: "delhi_brass",
  category: "chandelier",
  imagePath: "/test.jpg",
};

const ALL_ROOM_TYPES: RoomType[] = [
  "formal_living",
  "family_lounge",
  "dining_room",
  "bedroom",
  "entrance_lobby",
  "mandir",
  "stairwell",
  "passage",
  "terrace",
  "bar",
  "other",
];

const ROOM_SIZE_HINTS: Record<RoomType, string> = {
  formal_living: "main seating area",
  family_lounge: "main seating",
  dining_room: "table width",
  bedroom: "over bed",
  entrance_lobby: "entrance area",
  mandir: "prayer area",
  stairwell: "vertical drama",
  passage: "spaced evenly",
  terrace: "covered area",
  bar: "bar counter",
  other: "standard rooms",
};

const tokenEstimate = (s: string): number => Math.ceil(s.length / 4);

const longestVibeName = (): string => {
  // Returns the vibe name whose full-render prompt is the largest, by sampling.
  let worst = "";
  let worstLen = 0;
  for (const name of Object.keys(VIBES)) {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", name, {
      preserveFinishes: "off",
    });
    if (prompt.length > worstLen) {
      worst = name;
      worstLen = prompt.length;
    }
  }
  return worst;
};

// Token budget ceilings.
//
// NOTE: These are higher than the original design-doc targets (500/800/1100/1400)
// because the shared scaffold (MUST_PRESERVE + INTEGRATE_WELL + GLOBAL_NEGATIVES,
// all mandated verbatim by the design) already consumes ~600 tokens on its own.
// The ceilings below are set ~5% above current peak output for each tier so they
// catch regression but stay realistic. If you change the scaffold, recompute.
// Budgets reflect mandated shared-constant scaffold + CONSTRUCTION_CLEANUP
// + expanded DECOR_LIVED_IN (added Jun 15 after user feedback re: construction
// debris remaining in renders + decor being too restrained).
// Recompute these if the shared constants change.
const BUDGET_FURNISHED = 700;
const BUDGET_UC_PRESERVE_ON = 1200;
const BUDGET_UC_PRESERVE_AUTO = 1400;
const BUDGET_UC_PRESERVE_OFF = 1500;
const BUDGET_UC_CUSTOM_VIBE = 1100;

describe("token budget assertions", () => {
  it(`furnished render is <= ${BUDGET_FURNISHED} tokens for max vibe`, () => {
    let worst = 0;
    let worstName = "";
    for (const name of Object.keys(VIBES)) {
      const { prompt } = buildPrompt(mockProduct, "formal_living", "furnished", name);
      const tokens = tokenEstimate(prompt);
      if (tokens > worst) {
        worst = tokens;
        worstName = name;
      }
    }
    expect(worst, `worst furnished vibe was ${worstName} at ${worst} tokens`).toBeLessThanOrEqual(BUDGET_FURNISHED);
  });

  it(`under-construction Preserve=ON, max vibe <= ${BUDGET_UC_PRESERVE_ON} tokens`, () => {
    let worst = 0;
    let worstName = "";
    for (const name of Object.keys(VIBES)) {
      const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", name, {
        preserveFinishes: "on",
      });
      const tokens = tokenEstimate(prompt);
      if (tokens > worst) {
        worst = tokens;
        worstName = name;
      }
    }
    expect(worst, `worst preserve=on vibe was ${worstName} at ${worst} tokens`).toBeLessThanOrEqual(BUDGET_UC_PRESERVE_ON);
  });

  it(`under-construction Preserve=AUTO, max vibe <= ${BUDGET_UC_PRESERVE_AUTO} tokens`, () => {
    let worst = 0;
    let worstName = "";
    for (const name of Object.keys(VIBES)) {
      const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", name, {
        preserveFinishes: "auto",
      });
      const tokens = tokenEstimate(prompt);
      if (tokens > worst) {
        worst = tokens;
        worstName = name;
      }
    }
    expect(worst, `worst preserve=auto vibe was ${worstName} at ${worst} tokens`).toBeLessThanOrEqual(BUDGET_UC_PRESERVE_AUTO);
  });

  it(`under-construction Preserve=OFF, max vibe <= ${BUDGET_UC_PRESERVE_OFF} tokens`, () => {
    let worst = 0;
    let worstName = "";
    for (const name of Object.keys(VIBES)) {
      const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", name, {
        preserveFinishes: "off",
      });
      const tokens = tokenEstimate(prompt);
      if (tokens > worst) {
        worst = tokens;
        worstName = name;
      }
    }
    expect(worst, `worst preserve=off vibe was ${worstName} at ${worst} tokens`).toBeLessThanOrEqual(BUDGET_UC_PRESERVE_OFF);
  });

  it(`under-construction with custom vibe (not in VIBES map) <= ${BUDGET_UC_CUSTOM_VIBE} tokens`, () => {
    const { prompt } = buildPrompt(
      mockProduct,
      "formal_living",
      "under_construction",
      "Japanese Minimalist",
      { preserveFinishes: "off" },
    );
    expect(tokenEstimate(prompt)).toBeLessThanOrEqual(BUDGET_UC_CUSTOM_VIBE);
  });
});

describe("vibe content correctness", () => {
  it("furnished returns just the toneSummary line", () => {
    const out = buildVibeContent("Modern Indian", "furnished");
    expect(out.startsWith("STYLE: Fixture should feel at home in a ")).toBe(true);
    expect(out).toContain(VIBES["Modern Indian"].toneSummary);
    // It should NOT include the structural sections.
    expect(out).not.toContain(VIBES["Modern Indian"].walls);
    expect(out).not.toContain(VIBES["Modern Indian"].ceiling);
    expect(out).not.toContain(VIBES["Modern Indian"].flooring);
  });

  it("preserve=ON returns toneSummary + decor (when addDecor != off)", () => {
    const out = buildVibeContent("Modern Indian", "under_construction", "on", "auto");
    expect(out).toContain(VIBES["Modern Indian"].toneSummary);
    expect(out).toContain(VIBES["Modern Indian"].decor);
    // Should not include walls/ceiling/flooring/furniture.
    expect(out).not.toContain(VIBES["Modern Indian"].walls);
    expect(out).not.toContain(VIBES["Modern Indian"].ceiling);
    expect(out).not.toContain(VIBES["Modern Indian"].flooring);
    expect(out).not.toContain(VIBES["Modern Indian"].furniture);
  });

  it("preserve=ON with addDecor=off omits decor", () => {
    const out = buildVibeContent("Modern Indian", "under_construction", "on", "off");
    expect(out).toContain(VIBES["Modern Indian"].toneSummary);
    expect(out).not.toContain(VIBES["Modern Indian"].decor);
  });

  it("preserve=OFF returns all 8 sections (curtains only when addCurtains=true)", () => {
    const v = VIBES["Modern Indian"];
    const out = buildVibeContent("Modern Indian", "under_construction", "off", "auto", true);
    expect(out).toContain(v.toneSummary);
    expect(out).toContain(v.walls);
    expect(out).toContain(v.ceiling);
    expect(out).toContain(v.flooring);
    expect(out).toContain(v.furniture);
    expect(out).toContain(v.curtains);
    expect(out).toContain(v.decor);
    expect(out).toContain(v.colorPalette);
    expect(out).toContain(v.doNotAdd);
  });

  it("preserve=OFF without addCurtains omits curtains", () => {
    const v = VIBES["Modern Indian"];
    const out = buildVibeContent("Modern Indian", "under_construction", "off", "auto", false);
    expect(out).not.toContain(v.curtains);
    // But other sections still present.
    expect(out).toContain(v.walls);
    expect(out).toContain(v.decor);
  });

  it("custom vibe returns single-sentence fallback (NOT 400-token wrap)", () => {
    const out = buildVibeContent("Japanese Minimalist", "under_construction", "off", "auto");
    expect(out).toContain("Japanese Minimalist");
    expect(tokenEstimate(out)).toBeLessThan(80);
    // Should not leak any reference vibe's content.
    expect(out).not.toContain(VIBES["Modern Indian"].walls);
    expect(out).not.toContain(VIBES["Modern Indian"].decor);
  });
});

describe("VIBES catalog completeness", () => {
  const REQUIRED_FIELDS: Array<keyof (typeof VIBES)[string]> = [
    "toneSummary",
    "walls",
    "ceiling",
    "flooring",
    "furniture",
    "curtains",
    "decor",
    "colorPalette",
    "doNotAdd",
  ];

  it("has the 8 expected vibes", () => {
    const expected = [
      "Modern Indian",
      "Minimal & elegant",
      "Classical / ornate",
      "Warm & cozy",
      "Contemporary",
      "Rustic",
      "Indian Maximalist",
      "Art Deco",
    ];
    for (const name of expected) {
      expect(VIBES[name], `missing vibe: ${name}`).toBeDefined();
    }
  });

  for (const name of Object.keys(VIBES)) {
    it(`vibe "${name}" has all required non-empty fields`, () => {
      const v = VIBES[name];
      for (const field of REQUIRED_FIELDS) {
        expect(typeof v[field], `${name}.${field} not a string`).toBe("string");
        expect(v[field].trim().length, `${name}.${field} is empty`).toBeGreaterThan(0);
      }
    });
  }
});

describe("scale instruction fires for each RoomType", () => {
  for (const roomType of ALL_ROOM_TYPES) {
    it(`returns non-empty scale text for ${roomType} including its size hint`, () => {
      const text = getScaleInstruction(mockProduct, roomType);
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain(ROOM_SIZE_HINTS[roomType]);
      // Always reminds about centering.
      expect(text.toLowerCase()).toContain("center");
    });
  }
});

describe("buildPrompt structural sanity", () => {
  const states: RoomState[] = ["furnished", "under_construction"];

  for (const state of states) {
    it(`${state}: always includes "MUST PRESERVE"`, () => {
      const { prompt } = buildPrompt(mockProduct, "formal_living", state, "Modern Indian");
      expect(prompt).toContain("MUST PRESERVE");
    });

    it(`${state}: always includes "INTEGRATE WELL"`, () => {
      const { prompt } = buildPrompt(mockProduct, "formal_living", state, "Modern Indian");
      expect(prompt).toContain("INTEGRATE WELL");
    });

    it(`${state}: ends with GLOBAL_NEGATIVES (AVOID: ...)`, () => {
      const { prompt } = buildPrompt(mockProduct, "formal_living", state, "Modern Indian");
      expect(prompt.trimEnd().endsWith("structural changes to the room.")).toBe(true);
      expect(prompt).toContain("AVOID: pasted-on or composite look");
    });
  }

  it("under-construction includes ROOM_ASSESSMENT text", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", "Modern Indian");
    expect(prompt).toContain("ASSESS THE ROOM STATE FIRST");
    expect(prompt).toContain("FINISHED =");
    expect(prompt).toContain("BARE =");
  });

  it("furnished does NOT include ROOM_ASSESSMENT text", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "furnished", "Modern Indian");
    expect(prompt).not.toContain("ASSESS THE ROOM STATE FIRST");
    expect(prompt).not.toContain("FULLY RAW");
  });

  it("furnished includes FURNISHED_PRESERVATION text", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "furnished", "Modern Indian");
    expect(prompt).toContain("FURNISHED PRESERVATION");
  });

  it("under-construction does NOT include FURNISHED_PRESERVATION text", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", "Modern Indian");
    expect(prompt).not.toContain("FURNISHED PRESERVATION");
  });

  it("under-construction includes CONSTRUCTION_CLEANUP directive", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", "Modern Indian");
    expect(prompt).toContain("REMOVE CONSTRUCTION DEBRIS");
    expect(prompt).toContain("brown protective paper");
  });

  it("furnished does NOT include CONSTRUCTION_CLEANUP directive", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "furnished", "Modern Indian");
    expect(prompt).not.toContain("REMOVE CONSTRUCTION DEBRIS");
  });

  it("under-construction DECOR_LIVED_IN uses directive 'ALWAYS add'", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "under_construction", "Modern Indian");
    expect(prompt).toContain("ALWAYS add at least 1-2 decor touches");
    expect(prompt).toContain("EMPTY WALLS visible?");
  });

  it("returns empty negativePrompt (absorbed into GLOBAL_NEGATIVES)", () => {
    const { negativePrompt } = buildPrompt(mockProduct, "formal_living", "furnished", "Modern Indian");
    expect(negativePrompt).toBe("");
  });

  it("works with undefined vibe (falls back to default)", () => {
    const { prompt } = buildPrompt(mockProduct, "formal_living", "furnished");
    expect(prompt).toContain("Modern Indian");
  });

  it("debug sentinel — longest vibe in OFF mode is identified", () => {
    const name = longestVibeName();
    expect(name.length).toBeGreaterThan(0);
  });
});
