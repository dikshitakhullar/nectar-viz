import catalogData from "@/data/catalog.json";
import { Product, ProductType } from "./types";

const products: Product[] = catalogData as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByType(type: ProductType): Product[] {
  return products.filter((p) => p.type === type);
}

export function getProductTypes(): ProductType[] {
  const types = new Set(products.map((p) => p.type));
  return Array.from(types) as ProductType[];
}

export function getCollections(): string[] {
  const collections = new Set(
    products.map((p) => p.collection).filter(Boolean)
  );
  return Array.from(collections) as string[];
}
