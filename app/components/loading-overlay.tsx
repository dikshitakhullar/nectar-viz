"use client";

import { useState, useEffect } from "react";

interface LoadingOverlayProps {
  /** Image to show dimmed in the background */
  backgroundImage?: string;
  /** Sequential status messages */
  messages: string[];
  /** Estimated total time in seconds (for progress bar) */
  estimatedSeconds?: number;
  /** Interval between message changes in ms */
  messageInterval?: number;
}

export function LoadingOverlay({
  backgroundImage,
  messages,
  estimatedSeconds = 20,
  messageInterval = 3000,
}: LoadingOverlayProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, messageInterval);
    return () => clearInterval(msgTimer);
  }, [messages.length, messageInterval]);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      // Asymptotic progress — approaches 95% but never reaches 100%
      const pct = Math.min(95, (elapsed / estimatedSeconds) * 80);
      setProgress(pct);
    }, 200);
    return () => clearInterval(timer);
  }, [estimatedSeconds]);

  return (
    <div className="text-center py-12">
      {backgroundImage && (
        <div className="w-56 h-56 mx-auto mb-6 rounded-xl overflow-hidden border border-neutral-800/50 relative">
          <img src={backgroundImage} alt="" className="w-full h-full object-cover opacity-40" />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
        </div>
      )}

      {/* Progress bar */}
      <div className="w-48 h-[2px] mx-auto bg-neutral-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm font-light text-neutral-400 tracking-wide transition-opacity duration-300">
        {messages[msgIndex]}
      </p>

      {estimatedSeconds > 10 && (
        <p className="text-[11px] text-neutral-600 mt-2 tracking-wider">
          This usually takes {estimatedSeconds < 30 ? "15-30" : "30-60"} seconds
        </p>
      )}
    </div>
  );
}
