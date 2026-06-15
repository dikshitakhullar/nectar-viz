"use client";

import { useState, useEffect } from "react";

interface GeneratingOverlayProps {
  /** When provided, uses the AI-mode message rotation + longer interval. */
  message?: string;
}

const DEFAULT_MESSAGES = [
  "Analyzing your room...",
  "Matching the product to your space...",
  "Adjusting scale and proportions...",
  "Rendering your visualization...",
  "Almost there...",
];

const AI_MESSAGES = [
  "Analyzing your room...",
  "Finding the best products for your space...",
  "Generating option 1 of 3...",
  "Generating option 2 of 3...",
  "Generating option 3 of 3...",
  "Finishing up...",
];

export function GeneratingOverlay({ message }: GeneratingOverlayProps) {
  const activeMessages = message ? AI_MESSAGES : DEFAULT_MESSAGES;
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setMsgIndex((i) => (i + 1) % activeMessages.length);
      },
      message ? 8000 : 4000,
    );
    return () => clearInterval(interval);
    // activeMessages identity intentionally stable across renders by interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center px-6">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 border border-gold/30 rounded-full animate-ping absolute inset-0" />
        <div
          className="w-16 h-16 border-2 border-gold rounded-full animate-spin"
          style={{ borderTopColor: "transparent" }}
        />
      </div>
      <p className="text-sm font-light tracking-wide text-neutral-200 mt-6">
        {message || activeMessages[msgIndex]}
      </p>
      <p className="text-[11px] text-neutral-600 mt-2 tracking-wider uppercase">
        {message ? "This takes about a minute" : "This usually takes 15-30 seconds"}
      </p>
    </div>
  );
}
