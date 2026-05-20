/**
 * AI-enrich catalog products using Claude Sonnet 4.6.
 *
 * For each product, sends the image + existing metadata to Claude and gets back:
 * - displayName: clean "Distinctive Name — Material ProductType" format
 * - material, finish (if missing or needs correction)
 * - styleTags, colorPalette, vibes, roomTypes
 *
 * Resume-friendly: skips products that already have styleTags.
 *
 * Run: npx tsx scripts/enrich-catalog.ts
 * Run subset: npx tsx scripts/enrich-catalog.ts --brand fig_living
 * Dry run (1 product): npx tsx scripts/enrich-catalog.ts --dry-run
 */
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// Load env from .env.local and scraper .env (for ANTHROPIC_API_KEY)
for (const envFile of [
  path.join(process.cwd(), ".env.local"),
  "/Users/dikshitakhullar/Desktop/nectar/scraper/.env",
]) {
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf-8").split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  }
}

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.json");
const MODEL = "claude-haiku-4-5-20251001";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface CatalogProduct {
  slug: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  parentCategory?: string;
  imagePath: string;
  material?: string;
  finish?: string;
  tags?: string[];
  displayName?: string;
  styleTags?: string[];
  colorPalette?: string[];
  vibes?: string[];
  roomTypes?: string[];
  [key: string]: unknown;
}

const ENRICHMENT_PROMPT = `You are a home decor product analyst. Given a product image and metadata, return a JSON object with these fields:

{
  "displayName": "A clean, concise display name. Format: [Distinctive Name] — [Material] [Product Type]. Examples: 'Amber Cascade — Brass Chandelier', 'Meiji — Rattan Floor Lamp', 'Azure Sunstrike — Bone Inlay Coffee Table'. Strip brand names, redundant words, marketing fluff. Keep it elegant and short.",
  "material": "Primary material. e.g. 'brass', 'bone inlay', 'mango wood', 'rattan', 'paper mache', 'iron', 'crystal'. Use what you can see in the image.",
  "finish": "Surface treatment/finish. e.g. 'polished', 'antique', 'matte', 'patina', 'hammered', 'natural', 'painted'. Use what you can see in the image.",
  "styleTags": ["3-5 visual/style descriptors. e.g. 'ornate', 'geometric', 'floral', 'minimalist', 'sculptural', 'tiered', 'cascading', 'hand-forged', 'woven'. Focus on visual characteristics."],
  "colorPalette": ["2-3 dominant colors visible in the product. e.g. 'antique gold', 'warm brass', 'off-white', 'black', 'sea green'. Be specific."],
  "vibes": ["Which interior design vibes this product fits. Choose from: 'Modern Indian', 'Minimal & Elegant', 'Classical / Ornate', 'Warm Rustic', 'Coastal & Fresh', 'Indian Maximalist', 'Art Deco', 'Bohemian'. Pick 1-3 that fit best."],
  "roomTypes": ["Which room types this works in. Choose from: 'formal_living', 'family_lounge', 'dining_room', 'bedroom', 'entrance_lobby', 'mandir', 'stairwell', 'passage', 'terrace'. Pick 1-4 that fit best."]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown fences, no explanation.
- If material/finish are already provided in the metadata, still verify against the image and correct if wrong.
- displayName should be SHORT (max 6-7 words). No brand names in it.`;

function detectMimeType(data: Buffer): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  // Check magic bytes
  if (data[0] === 0xFF && data[1] === 0xD8) return "image/jpeg";
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) return "image/png";
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return "image/gif";
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) return "image/webp";
  return "image/jpeg"; // default
}

const MAX_IMAGE_BYTES = 4_800_000; // Stay under Claude's 5MB limit

async function fetchImageAsBase64(imagePath: string): Promise<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" } | null> {
  try {
    let buffer: Buffer;

    if (imagePath.startsWith("/")) {
      const localPath = path.join(process.cwd(), "public", imagePath);
      if (!fs.existsSync(localPath)) return null;
      buffer = fs.readFileSync(localPath);
    } else {
      const response = await fetch(imagePath);
      if (!response.ok) return null;
      buffer = Buffer.from(await response.arrayBuffer());
    }

    // If image is too large, try to get a smaller version from Shopify CDN
    if (buffer.length > MAX_IMAGE_BYTES && imagePath.includes("cdn.shopify.com")) {
      // Shopify CDN supports _800x800 size suffix before extension
      const smallUrl = imagePath.replace(/\.(\w+)(\?.*)?$/, "_800x800.$1$2");
      try {
        const smallResp = await fetch(smallUrl);
        if (smallResp.ok) {
          const smallBuf = Buffer.from(await smallResp.arrayBuffer());
          if (smallBuf.length < MAX_IMAGE_BYTES) {
            buffer = smallBuf;
          }
        }
      } catch {}
    }

    // Still too large — skip
    if (buffer.length > MAX_IMAGE_BYTES) {
      return null;
    }

    return { base64: buffer.toString("base64"), mimeType: detectMimeType(buffer) };
  } catch {
    return null;
  }
}

async function enrichProduct(product: CatalogProduct): Promise<Partial<CatalogProduct> | null> {
  const image = await fetchImageAsBase64(product.imagePath);
  if (!image) {
    console.warn(`  SKIP (no image): ${product.slug}`);
    return null;
  }

  const metadata = [
    `Name: ${product.name}`,
    `Category: ${product.category}`,
    product.description ? `Description: ${product.description.slice(0, 200)}` : null,
    product.material ? `Material: ${product.material}` : null,
    product.finish ? `Finish: ${product.finish}` : null,
    product.tags?.length ? `Tags: ${product.tags.slice(0, 10).join(", ")}` : null,
  ].filter(Boolean).join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: image.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: image.base64,
          },
        },
        {
          type: "text",
          text: `${ENRICHMENT_PROMPT}\n\nProduct metadata:\n${metadata}`,
        },
      ],
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      displayName: parsed.displayName || undefined,
      material: parsed.material || product.material || undefined,
      finish: parsed.finish || product.finish || undefined,
      styleTags: Array.isArray(parsed.styleTags) ? parsed.styleTags : undefined,
      colorPalette: Array.isArray(parsed.colorPalette) ? parsed.colorPalette : undefined,
      vibes: Array.isArray(parsed.vibes) ? parsed.vibes : undefined,
      roomTypes: Array.isArray(parsed.roomTypes) ? parsed.roomTypes : undefined,
    };
  } catch (e) {
    console.warn(`  PARSE ERROR for ${product.slug}: ${e}`);
    console.warn(`  Raw response: ${text.slice(0, 200)}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const brandFilter = args.find((a) => a.startsWith("--brand="))?.split("=")[1]
    || (args.includes("--brand") ? args[args.indexOf("--brand") + 1] : undefined);
  const dryRun = args.includes("--dry-run");
  const forceAll = args.includes("--force");

  const catalog: CatalogProduct[] = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));

  let toEnrich = catalog.filter((p) => {
    if (brandFilter && p.brand !== brandFilter) return false;
    if (!forceAll && p.styleTags && p.styleTags.length > 0) return false;
    return true;
  });

  if (dryRun) {
    toEnrich = toEnrich.slice(0, 1);
    console.log("DRY RUN: enriching 1 product only\n");
  }

  console.log(`Using model: ${MODEL}`);
  console.log(`Enriching ${toEnrich.length} products${brandFilter ? ` (brand: ${brandFilter})` : ""}...`);
  console.log(`Skipping ${catalog.length - toEnrich.length} already enriched\n`);

  let enriched = 0;
  let failed = 0;

  for (const product of toEnrich) {
    process.stdout.write(`  ${product.slug}...`);

    try {
      const result = await enrichProduct(product);
      if (result) {
        const idx = catalog.findIndex((p) => p.slug === product.slug);
        if (idx >= 0) {
          Object.assign(catalog[idx], result);
        }
        enriched++;
        console.log(` OK (${result.displayName})`);
      } else {
        failed++;
        console.log(` FAILED`);
      }
    } catch (e: any) {
      failed++;
      console.log(` ERROR: ${e.message || e}`);
    }

    // Save progress every 20 products (in case of interruption)
    if (enriched > 0 && enriched % 20 === 0) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
      console.log(`  [checkpoint saved: ${enriched} enriched so far]`);
    }
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

  console.log(`\nDone: ${enriched} enriched, ${failed} failed, ${catalog.length} total products`);
  console.log(`Output: ${CATALOG_PATH}`);
}

main().catch(console.error);
