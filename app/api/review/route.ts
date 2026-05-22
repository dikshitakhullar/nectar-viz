import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "data", "generation-logs");

export async function GET() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      return NextResponse.json({ logs: [] });
    }

    const files = fs.readdirSync(LOG_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse(); // newest first

    const logs = files.map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(LOG_DIR, f), "utf-8"));
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, feedback } = await request.json();
    if (!id || !feedback) {
      return NextResponse.json({ error: "Missing id or feedback" }, { status: 400 });
    }

    const logPath = path.join(LOG_DIR, `${id}.json`);
    if (!fs.existsSync(logPath)) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const log = JSON.parse(fs.readFileSync(logPath, "utf-8"));
    log.feedback = feedback;
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
