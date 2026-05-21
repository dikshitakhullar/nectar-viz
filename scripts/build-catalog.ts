/**
 * Build unified catalog.json from Delhi Brass + scraped Shopify brands.
 *
 * Run: npx tsx scripts/build-catalog.ts
 */
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();
const OUTPUT_JSON = path.join(PROJECT_ROOT, "data", "catalog.json");

// ─── Delhi Brass source ───
const DB_WEBSITE_ROOT = "/Users/dikshitakhullar/Desktop/delhi brass/delhi-brass-website";
const WEBSITE_IMAGES_DIR = `${DB_WEBSITE_ROOT}/public/images/chandeliers`;
const DB_WEBSITE_CATALOG = `${DB_WEBSITE_ROOT}/data/products.json`;
const DB_DATA_DIR = `${DB_WEBSITE_ROOT}/data`;
const IMAGE_BASE = "https://ik.imagekit.io/delhibrass/chandeliers";
const DB_IMAGE_BASE = "https://ik.imagekit.io/delhibrass";

// ─── Scraped data roots ───
const SCRAPER_DATA = "/Users/dikshitakhullar/Desktop/nectar/scraper/data/raw";

// ─── Types (inline to keep script self-contained) ───
type Brand = "delhi_brass" | "fig_living" | "casagold" | "house_of_samavar";
type ProductCategory =
  | "chandelier" | "pendant" | "lantern" | "flush_mount" | "cluster"
  | "wall_sconce" | "wall_light" | "hanging_lamp" | "table_lamp" | "floor_lamp" | "string_light"
  | "coffee_table" | "console_table" | "side_table" | "dining_table"
  | "vase" | "figurine" | "clock" | "decorative_object"
  | "other";

type ParentCategory =
  | "hanging_light" | "wall_light" | "table_lamp" | "floor_lamp"
  | "table" | "decor" | "other";

interface CatalogProduct {
  slug: string;
  name: string;
  description: string;
  brand: Brand;
  category: ProductCategory;
  parentCategory: ParentCategory;
  imagePath: string;
  type?: ProductCategory;
  size?: string;
  material?: string;
  finish?: string;
  collection?: string;
  priceINR?: number;
  tags?: string[];
  sourceUrl?: string;
  // Enriched fields
  displayName?: string;
  styleTags?: string[];
  colorPalette?: string[];
  vibes?: string[];
  roomTypes?: string[];
}

// ─── Category → parent category ───
const PARENT_CATEGORY_MAP: Record<ProductCategory, ParentCategory> = {
  chandelier: "hanging_light",
  pendant: "hanging_light",
  lantern: "hanging_light",
  flush_mount: "hanging_light",
  cluster: "hanging_light",
  hanging_lamp: "hanging_light",
  wall_sconce: "wall_light",
  wall_light: "wall_light",
  table_lamp: "table_lamp",
  floor_lamp: "floor_lamp",
  string_light: "decor",
  coffee_table: "table",
  console_table: "table",
  side_table: "table",
  dining_table: "table",
  vase: "decor",
  figurine: "decor",
  clock: "decor",
  decorative_object: "decor",
  other: "other",
};

// ─── Shopify product_type → our category ───
const CATEGORY_MAP: Record<string, ProductCategory | "SKIP"> = {
  // FigLiving
  "Table Lamp": "table_lamp",
  "Pendant Lamp": "pendant",
  "Floor Lamp": "floor_lamp",
  "Decor": "decorative_object",
  "Figurines": "figurine",
  "String Lights": "string_light",
  "Vase": "vase",
  "Wall Clock": "clock",
  "Lighting": "pendant",
  "Side Table": "side_table",
  "Bundle": "SKIP",
  // CasaGold
  "Coffee Table": "coffee_table",
  "Coffee Tables": "coffee_table",
  "Bone Inlay Table": "coffee_table",
  "Console Tables": "console_table",
  "Bone Inlay cONSOLE": "console_table",
  "bed side table": "side_table",
  "dresser": "other",
  "Furniture": "other",
  "Cabinets & Storage": "other",
};

// ─── Delhi Brass ───

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

const DB_VALID_TYPES: ProductCategory[] = [
  "chandelier", "pendant", "lantern", "flush_mount", "cluster", "wall_sconce", "hanging_lamp",
];

function getCollection(slug: string): string | undefined {
  for (const [prefix, name] of Object.entries(COLLECTION_MAP)) {
    if (slug.startsWith(prefix)) return name;
  }
  return undefined;
}

function slugToName(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildDelhiBrass(): CatalogProduct[] {
  if (!fs.existsSync(WEBSITE_IMAGES_DIR)) {
    console.warn("Delhi Brass images dir not found, skipping");
    return [];
  }

  // Load website catalog for descriptions if available
  const catalogBySlug = new Map<string, any>();
  if (fs.existsSync(DB_WEBSITE_CATALOG)) {
    const rawCatalog = JSON.parse(fs.readFileSync(DB_WEBSITE_CATALOG, "utf-8"));
    for (const p of rawCatalog) {
      // Website catalog uses collection-prefixed folder names as the image path
      // We need to match by folder name, not by slug
      catalogBySlug.set(p.slug, p);
    }
  }

  const folders = fs.readdirSync(WEBSITE_IMAGES_DIR).filter((f) => {
    const full = path.join(WEBSITE_IMAGES_DIR, f);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "studio.png"));
  });

  const products: CatalogProduct[] = [];
  for (const slug of folders) {
    const entry = catalogBySlug.get(slug);

    let category: ProductCategory = "chandelier";
    if (entry) {
      category = DB_VALID_TYPES.includes(entry.type) ? entry.type : "chandelier";
    } else {
      if (slug.includes("pendant")) category = "pendant";
      else if (slug.includes("lantern")) category = "lantern";
      else if (slug.includes("cluster")) category = "cluster";
    }

    products.push({
      slug,
      name: entry?.name || slugToName(slug),
      description: entry?.description || "",
      brand: "delhi_brass",
      category,
      parentCategory: PARENT_CATEGORY_MAP[category],
      type: category,
      size: entry?.size || "medium",
      material: entry?.material || "brass",
      finish: entry?.finish || "antique",
      collection: getCollection(slug),
      imagePath: `${IMAGE_BASE}/${slug}/studio.png`,
    });
  }

  return products;
}

// ─── Shopify brands ───

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildShopifyBrand(siteDir: string, brand: Brand, siteUrl: string): CatalogProduct[] {
  const rawDir = path.join(SCRAPER_DATA, siteDir);
  if (!fs.existsSync(rawDir)) {
    console.warn(`Scraper data not found for ${siteDir}, skipping`);
    return [];
  }

  const products: CatalogProduct[] = [];
  const handles = fs.readdirSync(rawDir).filter((f) => {
    return fs.statSync(path.join(rawDir, f)).isDirectory();
  });

  for (const handle of handles) {
    const jsonPath = path.join(rawDir, handle, "product.json");
    if (!fs.existsSync(jsonPath)) continue;

    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const p = raw.product;
      if (!p) continue;

      // Map category
      const productType = (p.product_type || "").trim();
      const mapped = CATEGORY_MAP[productType];
      if (mapped === "SKIP") continue;
      const category: ProductCategory = mapped || "other";

      // Skip products with no images
      if (!p.images || p.images.length === 0) continue;

      // Description
      const description = p.body_html ? stripHtml(p.body_html).slice(0, 300) : "";

      // Price from first variant
      const price = p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : undefined;

      // Tags
      const tags = p.tags
        ? p.tags.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : undefined;

      products.push({
        slug: p.handle,
        name: p.title,
        description,
        brand,
        category,
        parentCategory: PARENT_CATEGORY_MAP[category],
        type: category,
        imagePath: p.images[0].src,
        priceINR: price && !isNaN(price) ? price : undefined,
        tags: tags && tags.length > 0 ? tags : undefined,
        sourceUrl: `${siteUrl}/products/${p.handle}`,
      });
    } catch (e) {
      console.warn(`Error processing ${handle}: ${e}`);
    }
  }

  return products;
}

/**
 * Load Delhi Brass products from structured JSON data files
 * (table-lamps.json, floor-lamps.json, wall-lights.json, chandeliers.json).
 * These have rich pre-computed metadata.
 */
function buildDelhiBrassFromJSON(): CatalogProduct[] {
  const files: { file: string; defaultCategory: ProductCategory; imageFolder: string }[] = [
    { file: "table-lamps.json", defaultCategory: "table_lamp", imageFolder: "table-lamps" },
    { file: "floor-lamps.json", defaultCategory: "floor_lamp", imageFolder: "floor-lamps" },
    { file: "wall-lights.json", defaultCategory: "wall_light", imageFolder: "wall-lights" },
  ];

  const products: CatalogProduct[] = [];

  for (const { file, defaultCategory, imageFolder } of files) {
    const filePath = path.join(DB_DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Delhi Brass ${file} not found, skipping`);
      continue;
    }

    const items: any[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const item of items) {
      const category: ProductCategory = (item.category as ProductCategory) || defaultCategory;

      // Find the best image
      let imagePath = "";
      if (item.images && item.images.length > 0) {
        const img = item.images[0];
        // If already a full URL, use as-is. Otherwise construct from base.
        imagePath = img.startsWith("http") ? img : `${DB_IMAGE_BASE}${img.replace(/^\/images\//, "/")}`;
      } else {
        imagePath = `${DB_IMAGE_BASE}/${imageFolder}/${item.slug}/01-white-bg-studio.png`;
      }

      // Material: can be array or string
      const material = Array.isArray(item.material)
        ? item.material.join(", ")
        : (item.material || "brass");

      products.push({
        slug: item.slug,
        name: item.name,
        description: item.description || "",
        brand: "delhi_brass",
        category,
        parentCategory: PARENT_CATEGORY_MAP[category],
        type: category,
        size: item.size || "medium",
        material,
        finish: item.finish || "antique",
        imagePath,
        // Pre-enriched fields from the JSON
        ...(item.styleTags && { styleTags: item.styleTags }),
        ...(item.colorPalette && { colorPalette: item.colorPalette }),
        ...(item.vibes && { vibes: item.vibes }),
        ...(item.roomTypes && { roomTypes: item.roomTypes }),
      } as any);
    }
  }

  return products;
}

// ─── House of Samavar (manual entries + CSV vases) ───

const SAMAVAR_CSV = "/Users/dikshitakhullar/Desktop/HouseOfSamavar/products.csv";
const SAMAVAR_VASES_DIR = path.join(PROJECT_ROOT, "public", "images", "house-of-samavar", "vases");

function buildSamavarVases(): CatalogProduct[] {
  if (!fs.existsSync(SAMAVAR_CSV)) {
    console.warn("Samavar CSV not found, skipping vases");
    return [];
  }

  const csv = fs.readFileSync(SAMAVAR_CSV, "utf-8");
  const lines = csv.split("\n").slice(1).filter(Boolean); // skip header
  const products: CatalogProduct[] = [];

  for (const line of lines) {
    // Parse CSV (simple — no quoted commas in this data)
    const [filename, name, category, dimensions, priceStr, ...descParts] = line.split(",");
    if (category?.trim() !== "Vase") continue;

    const description = descParts.join(",").trim();
    const price = parseFloat(priceStr);

    // Check if image exists locally
    const normalizedFilename = filename.trim().toLowerCase().replace(/ /g, "-");
    const imagePath = path.join(SAMAVAR_VASES_DIR, normalizedFilename);
    if (!fs.existsSync(imagePath)) continue;

    const slug = "samavar-" + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    products.push({
      slug,
      name: name.trim(),
      description,
      brand: "house_of_samavar",
      category: "vase",
      parentCategory: PARENT_CATEGORY_MAP["vase"],
      type: "vase",
      material: "paper mache",
      finish: "lacquer",
      priceINR: isNaN(price) ? undefined : price,
      imagePath: `/images/house-of-samavar/vases/${normalizedFilename}`,
    });
  }

  return products;
}

function buildHouseOfSamavar(): CatalogProduct[] {
  const items: Omit<CatalogProduct, "parentCategory">[] = [
    {
      slug: "samavar-sculptural-brass-table-lamp",
      name: "Sculptural Brass Table Lamp",
      description: "Hand-forged brass table lamp with nature relief panels depicting deer and foliage, walnut wood base, linen drum shade",
      brand: "house_of_samavar",
      category: "table_lamp",
      type: "table_lamp",
      material: "brass",
      finish: "antique",
      imagePath: "/images/house-of-samavar/brass_lamp_2.jpeg",
    },
    {
      slug: "samavar-brass-scroll-candle-holder",
      name: "Brass Scroll Candle Holder",
      description: "Unrolling brass scroll candle holder set with hand-engraved wildlife scenes — leopard, deer, and foliage motifs",
      brand: "house_of_samavar",
      category: "decorative_object",
      type: "decorative_object",
      material: "brass",
      finish: "antique",
      imagePath: "/images/house-of-samavar/brass_candle_holder.jpeg",
    },
    {
      slug: "samavar-hammered-brass-coffee-table",
      name: "Hammered Brass Coffee Table",
      description: "Solid brass block coffee table with hammered patina finish and torn-edge paisley detail, on white plinth base",
      brand: "house_of_samavar",
      category: "coffee_table",
      type: "coffee_table",
      material: "brass",
      finish: "patina",
      imagePath: "/images/house-of-samavar/brass_coffee_table.jpeg",
    },
    {
      slug: "samavar-fluted-brass-side-table",
      name: "Fluted Brass Side Table",
      description: "Cylindrical fluted brass side table with hand-engraved floral patterns, round top and base in polished brass",
      brand: "house_of_samavar",
      category: "side_table",
      type: "side_table",
      material: "brass",
      finish: "polished",
      imagePath: "/images/house-of-samavar/brass_side_table.jpeg",
    },
    {
      slug: "samavar-ornate-brass-marble-side-table",
      name: "Ornate Brass & Marble Side Table",
      description: "Classical brass pedestal side table with acanthus leaf relief carving, white marble top and base",
      brand: "house_of_samavar",
      category: "side_table",
      type: "side_table",
      material: "brass",
      finish: "antique",
      imagePath: "/images/house-of-samavar/brass_side_table_2.jpeg",
    },
    {
      slug: "samavar-rolled-brass-wall-sconce",
      name: "Rolled Brass Wall Sconce",
      description: "Sculptural rolled brass wall light with hand-engraved floral border detail, warm ambient uplighting",
      brand: "house_of_samavar",
      category: "wall_sconce",
      type: "wall_sconce",
      material: "brass",
      finish: "antique",
      imagePath: "/images/house-of-samavar/brass_wall_light_scone.jpeg",
    },
  ];
  return items.map((item) => ({
    ...item,
    parentCategory: PARENT_CATEGORY_MAP[item.category],
  }));
}

// ─── Main ───

function main() {
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });

  const delhiBrassChandeliers = buildDelhiBrass();
  const delhiBrassNew = buildDelhiBrassFromJSON();
  const figLiving = buildShopifyBrand("figliving.com", "fig_living", "https://figliving.com");
  const casaGold = buildShopifyBrand("casagold.in", "casagold", "https://casagold.in");
  const samavar = buildHouseOfSamavar();
  const samavarVases = buildSamavarVases();

  // Deduplicate Delhi Brass (in case chandeliers.json overlaps with folder scan)
  const dbSlugs = new Set(delhiBrassNew.map((p) => p.slug));
  const delhiBrass = [
    ...delhiBrassChandeliers.filter((p) => !dbSlugs.has(p.slug)),
    ...delhiBrassNew,
  ];

  const all = [...delhiBrass, ...figLiving, ...casaGold, ...samavar, ...samavarVases].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Check for slug collisions
  const slugs = new Set<string>();
  for (const p of all) {
    if (slugs.has(p.slug)) {
      console.warn(`SLUG COLLISION: ${p.slug} (${p.brand})`);
    }
    slugs.add(p.slug);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(all, null, 2));

  // Summary
  const byBrand: Record<string, number> = {};
  const byCat: Record<string, number> = {};
  for (const p of all) {
    byBrand[p.brand] = (byBrand[p.brand] || 0) + 1;
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }

  console.log(`\nCatalog built: ${all.length} products`);
  console.log(`\nBy brand:`);
  for (const [b, c] of Object.entries(byBrand)) console.log(`  ${b}: ${c}`);
  console.log(`\nBy category:`);
  for (const [cat, c] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${c}`);
  }
  console.log(`\nOutput: ${OUTPUT_JSON}`);
}

main();
