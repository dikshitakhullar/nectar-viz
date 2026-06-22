import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { put } from "@vercel/blob";
import { getProductBySlug } from "@/lib/catalog";
import { buildPrompt } from "@/lib/generate-prompt";
import { RoomState, RoomType } from "@/lib/types";
import { createPostHogClient } from "@/lib/posthog-server";
import { uploadImage } from "@/lib/imagekit-upload";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Vercel Blob token (used for legacy JSON log persistence only).
const BLOB_TOKEN =
  process.env.PUBLIC_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(request: NextRequest) {
  const distinctId = request.headers.get("X-POSTHOG-DISTINCT-ID") || "anonymous";
  const posthog = createPostHogClient();

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
    const { prompt } = buildPrompt(
      product,
      roomType,
      roomState,
      vibe || undefined
    );

    let fullPrompt: string;

    if (notes) {
      fullPrompt = `HIGHEST PRIORITY — THE CUSTOMER HAS SPECIFIC INSTRUCTIONS. FOLLOW THESE ABOVE ALL ELSE:\n"${notes}"\n\nNow generate the image following these instructions while also applying the guidelines below:\n\n${prompt}`;
    } else {
      fullPrompt = prompt;
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
      posthog.capture({
        distinctId,
        event: "visualization_generation_failed",
        properties: { product_slug: productSlug, room_type: roomType, reason: "no_response_parts" },
      });
      await posthog.shutdown();
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const imageBuffer = Buffer.from(part.inlineData.data!, "base64");

        // Upload room + result images to ImageKit (public CDN URLs).
        // The JSON metadata log still goes to Vercel Blob since that's
        // already working there for /review.
        let roomBlobUrl = "";
        let outputBlobUrl = "";
        const logId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

        try {
          const [roomUrl, outputUrl] = await Promise.all([
            uploadImage({
              buffer: Buffer.from(roomImageBase64, "base64"),
              fileName: `${logId}-room.jpg`,
            }),
            uploadImage({
              buffer: imageBuffer,
              fileName: `${logId}-output.jpg`,
            }),
          ]);
          roomBlobUrl = roomUrl;
          outputBlobUrl = outputUrl;
        } catch (e) {
          console.warn("Failed to upload images to ImageKit:", e);
        }

        // Best-effort metadata log to Vercel Blob (existing /review flow).
        if (BLOB_TOKEN) {
          try {
            await put(`generations/${logId}.json`, JSON.stringify({
              id: logId,
              timestamp: new Date().toISOString(),
              productSlug,
              productName: product.displayName || product.name,
              productImage: product.imagePath,
              roomType,
              roomState,
              vibe: vibe || null,
              notes: notes || null,
              roomUrl: roomBlobUrl,
              outputUrl: outputBlobUrl,
              feedback: null,
            }, null, 2), { access: "public", contentType: "application/json", addRandomSuffix: false, token: BLOB_TOKEN });
          } catch (e) {
            console.warn("Failed to save generation log to Vercel Blob:", e);
          }
        }

        posthog.capture({
          distinctId,
          event: "visualization_generated",
          properties: {
            product_slug: productSlug,
            product_name: product.name,
            product_category: product.category,
            room_type: roomType,
            room_state: roomState,
            vibe: vibe || null,
            has_notes: !!notes,
          },
        });
        await posthog.shutdown();
        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": part.inlineData.mimeType,
            "Cache-Control": "no-store",
            // Expose for the client so it can persist a Firestore generation doc.
            "X-Room-Blob-Url": roomBlobUrl,
            "X-Output-Blob-Url": outputBlobUrl,
            "Access-Control-Expose-Headers": "X-Room-Blob-Url, X-Output-Blob-Url",
          },
        });
      }
    }

    posthog.capture({
      distinctId,
      event: "visualization_generation_failed",
      properties: { product_slug: productSlug, room_type: roomType, reason: "no_image_in_response" },
    });
    await posthog.shutdown();
    return NextResponse.json(
      { error: "AI did not return an image" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Generation error:", error);
    posthog.capture({
      distinctId,
      event: "visualization_generation_failed",
      properties: { reason: "exception" },
    });
    await posthog.shutdown();
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}

export const maxDuration = 120;
