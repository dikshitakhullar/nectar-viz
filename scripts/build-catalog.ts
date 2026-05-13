/**
 * Build catalog.json from Delhi Brass data.
 * Product images are served from the delhi-brass-website GitHub repo —
 * no local image copying needed.
 *
 * Run: npx tsx scripts/build-catalog.ts
 */
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();
const WEBSITE_IMAGES_DIR = "/Users/dikshitakhullar/Desktop/delhi brass/delhi-brass-website/public/images/chandeliers";
const CATALOG_SOURCE = "/Users/dikshitakhullar/Desktop/delhi brass/catalog-tools/chandelier_catalog.json";
const OUTPUT_JSON = path.join(PROJECT_ROOT, "data", "catalog.json");

// GitHub raw URL base — images already hosted here
const IMAGE_BASE = "https://raw.githubusercontent.com/dikshitakhullar/delhi-brass-website/main/public/images/chandeliers";

// Collection prefix → display name
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

function getCollection(slug: string): string | undefined {
  for (const [prefix, name] of Object.entries(COLLECTION_MAP)) {
    if (slug.startsWith(prefix)) return name;
  }
  return undefined;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type ProductType = "chandelier" | "pendant" | "lantern" | "flush_mount" | "cluster" | "wall_sconce" | "hanging_lamp";
type ProductSize = "small" | "medium" | "large";

function main() {
  // Load source catalog for metadata
  const rawCatalog = JSON.parse(fs.readFileSync(CATALOG_SOURCE, "utf-8"));
  const catalogBySlug = new Map<string, any>();
  for (const p of rawCatalog.products) {
    catalogBySlug.set(nameToSlug(p.name), p);
  }

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });

  // Scan website images dir for available products (these have studio.png)
  const folders = fs.readdirSync(WEBSITE_IMAGES_DIR).filter((f) => {
    const full = path.join(WEBSITE_IMAGES_DIR, f);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "studio.png"));
  });

  const products: any[] = [];

  for (const slug of folders) {
    const entry = catalogBySlug.get(slug);

    // Determine type from catalog or heuristic
    let type: ProductType = "chandelier";
    if (entry) {
      const validTypes: ProductType[] = ["chandelier", "pendant", "lantern", "flush_mount", "cluster", "wall_sconce", "hanging_lamp"];
      type = validTypes.includes(entry.type) ? entry.type : "chandelier";
    } else {
      if (slug.includes("pendant")) type = "pendant";
      else if (slug.includes("lantern")) type = "lantern";
      else if (slug.includes("cluster")) type = "cluster";
    }

    products.push({
      slug,
      name: entry?.name || slugToName(slug),
      description: entry?.description || "",
      type,
      size: (entry?.size as ProductSize) || "medium",
      material: entry?.material || "brass",
      finish: entry?.finish || "antique",
      collection: getCollection(slug),
      imagePath: `${IMAGE_BASE}/${slug}/studio.png`,
    });
  }

  products.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(products, null, 2));
  console.log(`Catalog built: ${products.length} products`);
  console.log(`Images served from GitHub: ${IMAGE_BASE}`);
  console.log(`Output: ${OUTPUT_JSON}`);
}

main();
