export type Brand = "delhi_brass" | "fig_living" | "casagold" | "house_of_samavar";

export type ProductCategory =
  // Lighting
  | "chandelier" | "pendant" | "lantern" | "flush_mount" | "cluster"
  | "wall_sconce" | "wall_light" | "hanging_lamp" | "table_lamp" | "floor_lamp" | "string_light"
  // Furniture
  | "coffee_table" | "console_table" | "side_table" | "dining_table"
  // Decor
  | "vase" | "figurine" | "clock" | "decorative_object"
  | "other";

export type ParentCategory =
  | "hanging_light" | "wall_light" | "table_lamp" | "floor_lamp"
  | "table" | "decor" | "other";

/** @deprecated Use ProductCategory */
export type ProductType = ProductCategory;

export type ProductSize = "small" | "medium" | "large";

export interface Product {
  slug: string;
  name: string;
  description: string;
  brand: Brand;
  category: ProductCategory;
  parentCategory?: ParentCategory;
  imagePath: string;
  // Optional — present when available
  type?: ProductCategory;
  size?: ProductSize;
  material?: string;
  finish?: string;
  collection?: string;
  priceINR?: number;
  tags?: string[];
  sourceUrl?: string;
  widthInches?: number;
  heightInches?: number;
  // Enriched fields (populated by AI enrichment script)
  displayName?: string;
  styleTags?: string[];
  colorPalette?: string[];
  vibes?: string[];
  roomTypes?: string[];
}

export type RoomState = "furnished" | "under_construction";

export type RoomType =
  | "formal_living"
  | "family_lounge"
  | "dining_room"
  | "bedroom"
  | "entrance_lobby"
  | "mandir"
  | "stairwell"
  | "passage"
  | "terrace"
  | "other";

export interface GenerateRequest {
  productSlug: string;
  roomType: RoomType;
  roomState: RoomState;
  vibe?: string;
}
