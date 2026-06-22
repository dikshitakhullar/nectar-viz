import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type GenerationMode = "specific" | "ai";

export interface GenerationDoc {
  id: string;
  userId: string;
  mode: GenerationMode;
  productSlug: string | null;
  productName: string | null;
  productImage: string | null;
  roomType: string;
  roomState: string;
  vibe: string;
  notes: string;
  roomImageUrl: string;
  resultImageUrl: string;
  recommendedSlugs: string[] | null;
  createdAt: Timestamp | null;
}

interface SaveGenerationInput {
  userId: string;
  mode: GenerationMode;
  productSlug: string | null;
  productName?: string | null;
  productImage?: string | null;
  roomType: string;
  roomState: string;
  vibe: string;
  notes?: string;
  roomImageUrl: string;
  resultImageUrl: string;
  recommendedSlugs?: string[] | null;
}

export async function saveGeneration(input: SaveGenerationInput): Promise<string> {
  const ref = await addDoc(collection(db, "generations"), {
    userId: input.userId,
    mode: input.mode,
    productSlug: input.productSlug,
    productName: input.productName ?? null,
    productImage: input.productImage ?? null,
    roomType: input.roomType,
    roomState: input.roomState,
    vibe: input.vibe,
    notes: input.notes ?? "",
    roomImageUrl: input.roomImageUrl,
    resultImageUrl: input.resultImageUrl,
    recommendedSlugs: input.recommendedSlugs ?? null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listUserGenerations(userId: string): Promise<GenerationDoc[]> {
  const q = query(
    collection(db, "generations"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GenerationDoc));
}
