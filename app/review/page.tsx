"use client";

import { useState, useEffect } from "react";

interface GenerationLog {
  id: string;
  timestamp: string;
  productSlug: string;
  productName: string;
  productImage: string;
  roomType: string;
  roomState: string;
  vibe: string | null;
  notes: string | null;
  roomUrl: string;
  outputUrl: string;
  feedback: string | null;
}

export default function ReviewPage() {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function submitFeedback(id: string, feedback: string) {
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, feedback }),
    });
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, feedback } : l))
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 text-sm">Loading generations...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 text-sm">No generations logged yet.</p>
        <p className="text-neutral-600 text-xs mt-1">Generate a visualization first, then come back here to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-xl font-extralight tracking-wide text-neutral-200">
          Generation Review
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {logs.length} generations · tap to give feedback
        </p>
      </div>

      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-neutral-900/50 rounded-xl border border-neutral-800/50 overflow-hidden"
        >
          {/* Images: input → output side by side */}
          <div className="grid grid-cols-2 gap-px bg-neutral-800/30">
            <div className="relative">
              <img
                src={log.roomUrl}
                alt="Room input"
                className="w-full aspect-square object-cover"
              />
              <span className="absolute top-2 left-2 bg-black/60 text-[9px] text-neutral-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Input
              </span>
            </div>
            <div className="relative">
              <img
                src={log.outputUrl}
                alt="Generated output"
                className="w-full aspect-square object-cover"
              />
              <span className="absolute top-2 left-2 bg-black/60 text-[9px] text-neutral-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Output
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <img
                src={log.productImage}
                alt=""
                className="w-8 h-8 rounded bg-neutral-800 object-contain"
              />
              <div>
                <p className="text-xs text-neutral-200">{log.productName}</p>
                <p className="text-[10px] text-neutral-500">
                  {log.roomType.replace("_", " ")} · {log.roomState.replace("_", " ")}
                  {log.vibe ? ` · ${log.vibe}` : ""}
                </p>
              </div>
            </div>

            {log.notes && (
              <p className="text-[10px] text-neutral-400 italic">
                &ldquo;{log.notes}&rdquo;
              </p>
            )}

            <p className="text-[10px] text-neutral-600">
              {new Date(log.timestamp).toLocaleString()}
            </p>

            {/* Feedback buttons */}
            <div className="flex gap-2 pt-1">
              {["good", "bad", "structure_changed", "wrong_scale", "wrong_placement"].map((fb) => (
                <button
                  key={fb}
                  onClick={() => submitFeedback(log.id, fb)}
                  className={`px-2 py-1 rounded-md text-[10px] tracking-wider uppercase border transition-all ${
                    log.feedback === fb
                      ? "bg-gold text-black border-gold"
                      : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
                  }`}
                >
                  {fb.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
