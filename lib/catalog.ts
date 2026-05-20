import catalogData from "@/data/catalog.json";
import { Product, ProductCategory, Brand } from "./types";

const allProducts: Product[] = catalogData as Product[];

// Brands shown on the main product grid
const GRID_BRANDS: Brand[] = ["delhi_brass", "house_of_samavar"];

// Delhi Brass categories with images on GitHub (others pending upload)
const DB_LIVE_CATEGORIES: ProductCategory[] = ["chandelier", "pendant", "lantern", "cluster", "flush_mount", "hanging_lamp"];

// === Product grid functions ===

export function getAllProducts(): Product[] {
  return allProducts.filter((p) => {
    if (!GRID_BRANDS.includes(p.brand)) return false;
    // Hide Delhi Brass products without images on GitHub yet
    if (p.brand === "delhi_brass" && !DB_LIVE_CATEGORIES.includes(p.category)) return false;
    return true;
  });
}

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function getProductsByType(type: ProductCategory): Product[] {
  return allProducts.filter((p) => GRID_BRANDS.includes(p.brand) && p.category === type);
}

export function getProductTypes(): ProductCategory[] {
  const types = new Set(
    allProducts.filter((p) => GRID_BRANDS.includes(p.brand)).map((p) => p.category)
  );
  return Array.from(types);
}

export function getCollections(): string[] {
  const collections = new Set(
    allProducts
      .filter((p) => p.brand === "delhi_brass")
      .map((p) => p.collection)
      .filter(Boolean)
  );
  return Array.from(collections) as string[];
}

// === New multi-brand functions ===

export function getAllCatalogProducts(): Product[] {
  return allProducts;
}

export function getProductsByBrand(brand: Brand): Product[] {
  return allProducts.filter((p) => p.brand === brand);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return allProducts.filter((p) => p.category === category);
}

export function getCatalogCategories(): ProductCategory[] {
  return Array.from(new Set(allProducts.map((p) => p.category)));
}

export function getBrands(): Brand[] {
  return Array.from(new Set(allProducts.map((p) => p.brand)));
}
