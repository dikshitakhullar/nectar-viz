import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export async function GET() {
  try {
    // List all .json metadata files in generations/
    const { blobs } = await list({ prefix: "generations/", limit: 100 });

    const jsonBlobs = blobs
      .filter((b) => b.pathname.endsWith(".json"))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()); // newest first

    const logs = await Promise.all(
      jsonBlobs.map(async (b) => {
        try {
          const res = await fetch(b.url);
          return await res.json();
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({ logs: logs.filter(Boolean) });
  } catch (e) {
    console.warn("Review list failed:", e);
    return NextResponse.json({ logs: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, feedback } = await request.json();
    if (!id || !feedback) {
      return NextResponse.json({ error: "Missing id or feedback" }, { status: 400 });
    }

    // Read existing metadata
    const { blobs } = await list({ prefix: `generations/${id}.json` });
    if (blobs.length === 0) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const res = await fetch(blobs[0].url);
    const log = await res.json();
    log.feedback = feedback;

    // Overwrite with feedback
    await put(`generations/${id}.json`, JSON.stringify(log, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
