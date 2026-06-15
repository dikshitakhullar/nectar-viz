import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/inspire/waitlist/route";

// Mock @vercel/blob's put function
vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({ url: "https://blob.vercel-storage.com/inspire-waitlist.jsonl" }),
  head: vi.fn().mockRejectedValue(new Error("not found")),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/inspire/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/inspire/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with valid email", async () => {
    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });

  it("returns 400 with missing email", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 with malformed email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 with empty email string", async () => {
    const res = await POST(makeRequest({ email: "" }));
    expect(res.status).toBe(400);
  });

  it("trims whitespace and lowercases email before storing", async () => {
    const { put } = await import("@vercel/blob");
    await POST(makeRequest({ email: "  Test@Example.COM  " }));
    expect(put).toHaveBeenCalled();
    const callArg = (put as ReturnType<typeof vi.fn>).mock.calls[0][1];
    // callArg is the string content being appended
    expect(callArg).toContain('"email":"test@example.com"');
  });
});
