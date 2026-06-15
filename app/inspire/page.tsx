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
    <main className="min-h-screen flex flex-col">
      {/* Brand wordmark */}
      <header className="pt-10 pb-4">
        <h1 className="text-center font-serif text-base text-gold tracking-[0.18em] uppercase font-light">
          Nectar
        </h1>
      </header>

      <div className="w-full max-w-md mx-auto px-5 py-8 space-y-6">
        {/* Hero icon */}
        <div className="text-center text-gold pb-2">
          <svg className="w-9 h-9 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
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

        {/* Closing flourish */}
        <p className="text-center text-[10px] uppercase tracking-[0.15em] text-neutral-600 pt-8">
          — Save the screenshot for later —
        </p>
      </div>
    </main>
  );
}
