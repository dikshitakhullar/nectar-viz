import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAllProducts } from "@/lib/catalog";
import { ProductType } from "@/lib/types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const roomImageFile = formData.get("roomImage") as File;
    const productType = formData.get("productType") as string;
    const vibe = formData.get("vibe") as string | null;
    const roomType = formData.get("roomType") as string;

    if (!roomImageFile || !productType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const roomImageBytes = await roomImageFile.arrayBuffer();
    const roomImageBase64 = Buffer.from(roomImageBytes).toString("base64");
    const roomMimeType = roomImageFile.type || "image/jpeg";

    // Filter catalog to the requested type
    const allProducts = getAllProducts();
    const candidates = allProducts.filter((p) => p.type === productType as ProductType);

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No products of that type" }, { status: 404 });
    }

    // Build a compact catalog summary for the AI
    const catalogSummary = candidates.map((p) => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      size: p.size,
      material: p.material,
      finish: p.finish,
      collection: p.collection || "none",
    }));

    const prompt = `You are an expert interior designer helping a customer choose lighting for their room.

ROOM PHOTO: Attached. This is a ${roomType.replace("_", " ")}.
PRODUCT TYPE REQUESTED: ${productType}
${vibe ? `STYLE PREFERENCE: ${vibe}` : "No specific style preference — use your best judgment."}

AVAILABLE PRODUCTS (${candidates.length} options):
${JSON.stringify(catalogSummary, null, 2)}

TASK: Analyze the room photo — its size, style, existing decor, ceiling height, and overall aesthetic. Then pick the 3 BEST products from the list above that would look great in this specific room.

Consider:
- Scale: small fixtures for small rooms, large for grand spaces
- Style match: modern room → modern fixture, classical room → ornate fixture
- Material harmony: brass works with warm tones, iron with industrial/modern
- The customer's style preference (if given)

Respond with ONLY a JSON array of exactly 3 slugs, ordered best to worst. Example:
["product-slug-1", "product-slug-2", "product-slug-3"]

No explanation, no markdown, just the JSON array.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: roomMimeType, data: roomImageBase64 } },
          { text: prompt },
        ],
      }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI did not return valid recommendations" }, { status: 500 });
    }

    const slugs: string[] = JSON.parse(jsonMatch[0]);

    // Validate slugs exist in catalog
    const validSlugs = slugs.filter((s) => candidates.find((p) => p.slug === s)).slice(0, 3);

    if (validSlugs.length === 0) {
      // Fallback: pick 3 random from candidates
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return NextResponse.json({ slugs: shuffled.slice(0, 3).map((p) => p.slug) });
    }

    return NextResponse.json({ slugs: validSlugs });
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json({ error: "Recommendation failed" }, { status: 500 });
  }
}

export const maxDuration = 60;
