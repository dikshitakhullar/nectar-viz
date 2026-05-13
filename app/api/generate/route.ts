import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { getProductBySlug } from "@/lib/catalog";
import { buildPrompt } from "@/lib/generate-prompt";
import { RoomState, RoomType } from "@/lib/types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const roomImageFile = formData.get("roomImage") as File;
    const productSlug = formData.get("productSlug") as string;
    const roomType = formData.get("roomType") as RoomType;
    const roomState = formData.get("roomState") as RoomState;
    const vibe = formData.get("vibe") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!roomImageFile || !productSlug || !roomType || !roomState) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = getProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Read room image as base64
    const roomImageBytes = await roomImageFile.arrayBuffer();
    const roomImageBase64 = Buffer.from(roomImageBytes).toString("base64");
    const roomMimeType = roomImageFile.type || "image/jpeg";

    // Fetch product studio image from GitHub
    const productImageRes = await fetch(product.imagePath);
    if (!productImageRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch product image" },
        { status: 500 }
      );
    }
    const productImageBuffer = await productImageRes.arrayBuffer();
    const productImageBase64 = Buffer.from(productImageBuffer).toString("base64");

    // Build prompt
    const { prompt, negativePrompt } = buildPrompt(
      product,
      roomType,
      roomState,
      vibe || undefined
    );

    let fullPrompt = `${prompt}\n\nAvoid: ${negativePrompt}`;

    if (notes) {
      fullPrompt += `\n\nADDITIONAL CUSTOMER INSTRUCTIONS: ${notes}`;
    }

    // Call Gemini image generation
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: roomMimeType,
                data: roomImageBase64,
              },
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: productImageBase64,
              },
            },
            { text: fullPrompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Extract generated image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const imageBuffer = Buffer.from(part.inlineData.data!, "base64");
        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": part.inlineData.mimeType,
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return NextResponse.json(
      { error: "AI did not return an image" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
