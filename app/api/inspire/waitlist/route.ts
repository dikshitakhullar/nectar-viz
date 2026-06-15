import { NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

const BLOB_PATH = "inspire-waitlist.jsonl";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// MVP trade-offs (revisit if waitlist scale or sensitivity grows):
// - Public Blob access: emails stored in plaintext at a predictable URL.
//   Acceptable for an opt-in marketing waitlist; if any sensitive flow ever
//   reuses this endpoint, switch to access: "private" + signed URLs.
// - No de-duplication: same email can be submitted multiple times. Acceptable
//   for now — analytics-friendly (signups per email).
// - Read-then-write append has a race window. At expected volume (<100/day),
//   concurrent writes are vanishingly rare. Migrate to a real append-only
//   store (DB / Vercel KV) before promoting beyond beta.

export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = rawEmail.trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  const entry = JSON.stringify({
    email,
    created_at: new Date().toISOString(),
    source: "inspire-teaser",
  });

  try {
    // Read existing file content (if any), append new entry, write back.
    // Vercel Blob doesn't support append natively; we fetch + concatenate.
    let existing = "";
    try {
      const meta = await head(BLOB_PATH);
      const res = await fetch(meta.url);
      if (res.ok) existing = await res.text();
    } catch {
      // file doesn't exist yet — that's fine, we'll create it
    }

    const next = existing + entry + "\n";
    await put(BLOB_PATH, next, {
      access: "public",
      contentType: "application/x-ndjson",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inspire/waitlist] write failed", err);
    return NextResponse.json({ error: "could not save email" }, { status: 500 });
  }
}
