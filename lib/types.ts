export type ProductType = "chandelier" | "pendant" | "lantern" | "flush_mount" | "cluster" | "wall_sconce" | "hanging_lamp";
export type ProductSize = "small" | "medium" | "large";
export type ProductMaterial = "brass" | "iron" | "glass" | "crystal" | "mixed" | "wood" | "other";
export type ProductFinish = "polished" | "antique" | "matte" | "patina" | "gold" | "distressed" | "other";

export interface Product {
  slug: string;
  name: string;
  description: string;
  type: ProductType;
  size: ProductSize;
  material: ProductMaterial;
  finish: ProductFinish;
  collection?: string;
  imagePath: string;
  widthInches?: number;
  heightInches?: number;
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
