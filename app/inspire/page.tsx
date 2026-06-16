"use client";

import { useState } from "react";
import posthog from "posthog-js";

export default function InspirePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/inspire/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Something went wrong. Try again?");
        setStatus("error");
        return;
      }
      setStatus("success");
      try {
        posthog.capture("inspire_waitlist_signup", { source: "inspire-teaser" });
      } catch {
        // posthog optional
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Try again?");
      setStatus("error");
    }
  };

  return (
    <div>
      {/* Brand wordmark — page-level (doc-level <h1> is in app/layout.tsx) */}
      <section className="pt-10 pb-4">
        <p className="text-center font-serif text-base text-gold tracking-[0.18em] uppercase font-light">
          Nectar
        </p>
      </section>

      <div className="w-full max-w-md mx-auto px-5 py-8 space-y-6">
        {/* Hero icon — pinterest pin */}
        <div className="text-center text-gold pb-2">
          <svg className="w-9 h-9 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="17" x2="12" y2="22" />
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
          </svg>
        </div>

        {/* Headline */}
        <h2 className="text-center font-serif text-[22px] leading-[1.3] font-light text-neutral-200">
          Shop your Pinterest.
        </h2>

        {/* Body */}
        <p className="text-center text-[13px] text-neutral-400 leading-relaxed px-2">
          Upload a screenshot — we&apos;ll find matching products in our catalog and render them in your room.
        </p>

        {/* Gold divider */}
        <div className="w-14 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" />

        {/* Coming soon section */}
        <div className="text-center pt-4 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Coming soon</p>

          {status === "success" ? (
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-sm text-neutral-300 py-6"
            >
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          ) : (
            <>
              <p className="text-xs text-neutral-500">Sign up to get early access.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <label htmlFor="inspire-email" className="sr-only">Email address</label>
                <input
                  id="inspire-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={status === "submitting"}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-gold/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "submitting" || !email}
                  className="w-full bg-gold text-black px-4 py-3 rounded-xl text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-gold-light transition-colors disabled:opacity-40"
                >
                  {status === "submitting" ? "Saving…" : "Notify me →"}
                </button>
                {status === "error" && (
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="text-xs text-red-400"
                  >
                    {errorMsg}
                  </p>
                )}
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
