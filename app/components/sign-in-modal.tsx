"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "./auth-provider";
import {
  isProfileComplete,
  updateUserProfile,
  getUserProfile,
} from "@/lib/user-profile";

type Step = "phone" | "otp" | "profile";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired once the user is fully signed in AND their profile is complete. */
  onComplete?: () => void;
}

const RECAPTCHA_CONTAINER_ID = "nectar-recaptcha-container";

export function SignInModal({ open, onClose, onComplete }: SignInModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [optInSms, setOptInSms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Portal hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Body scroll lock + ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // If user is already signed in when modal opens, decide which step to show
  useEffect(() => {
    if (!open) return;
    if (user && !isProfileComplete(profile)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("profile");
    } else if (user && isProfileComplete(profile)) {
      // Already done — fire complete and close
      onComplete?.();
      onClose();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("phone");
    }
  }, [open, user, profile, onComplete, onClose]);

  // Clean up recaptcha when modal closes
  useEffect(() => {
    if (open) return;
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch {
        /* ignore */
      }
      recaptchaRef.current = null;
    }
    confirmationRef.current = null;
    setOtp("");
    setError(null);
    setBusy(false);
  }, [open]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    // Basic +91 prefix handling — if user typed digits only, prepend +91
    let phoneToSend = phone.trim();
    if (!phoneToSend.startsWith("+")) {
      phoneToSend = "+91" + phoneToSend.replace(/\D/g, "");
    }

    try {
      // Lazy-init the (invisible) reCAPTCHA verifier
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(
          auth,
          RECAPTCHA_CONTAINER_ID,
          { size: "invisible" },
        );
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneToSend,
        recaptchaRef.current,
      );
      confirmationRef.current = confirmation;
      setStep("otp");
    } catch (err) {
      console.error("send otp failed", err);
      setError("Couldn't send the code. Check the number and try again.");
      // Reset recaptcha so user can retry
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          /* ignore */
        }
        recaptchaRef.current = null;
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!confirmationRef.current) throw new Error("No pending confirmation");
      await confirmationRef.current.confirm(otp.trim());
      // onAuthStateChanged in AuthProvider will fire, populate user + profile.
      // We need to wait briefly for that propagation, then check if profile is complete.
      // Easiest: refetch profile here, then decide step.
      // Wait a tick for auth state to settle
      await new Promise((r) => setTimeout(r, 200));
      const u = auth.currentUser;
      if (!u) throw new Error("Auth state not propagated");
      const p = await getUserProfile(u.uid);
      if (!isProfileComplete(p)) {
        setStep("profile");
      } else {
        await refreshProfile();
        onComplete?.();
        onClose();
      }
    } catch (err) {
      console.error("verify otp failed", err);
      setError("Wrong code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = auth.currentUser;
      if (!u) throw new Error("Not signed in");
      await updateUserProfile(u.uid, {
        name: name.trim(),
        email: email.trim(),
        optInSms,
      });
      await refreshProfile();
      onComplete?.();
      onClose();
    } catch (err) {
      console.error("save profile failed", err);
      setError("Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-surface border border-line-gold rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] p-7 md:p-8"
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign-in"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === "phone" && (
          <>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold mb-3">Sign in</p>
            <h2 id="signin-title" className="font-serif text-[24px] leading-tight font-light text-text-primary">
              Continue with your phone
            </h2>
            <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
              We&apos;ll send a 6-digit code to verify. No password to remember.
            </p>

            <form onSubmit={handleSendOtp} className="mt-6 space-y-3">
              <label htmlFor="signin-phone" className="block font-mono text-[10px] tracking-[0.1em] uppercase text-text-secondary">
                Phone
              </label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 h-12 rounded-md bg-black/40 border border-white/10 text-text-secondary text-[14px] font-mono shrink-0">
                  +91
                </span>
                <input
                  id="signin-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  required
                  className="flex-1 h-12 px-4 bg-black/40 border border-white/10 rounded-md text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !phone.trim()}
                className="w-full h-12 rounded-md bg-gold text-on-gold font-semibold text-[14px] hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                {busy ? "Sending…" : "Send code →"}
              </button>
              {error && (
                <p role="alert" className="text-[12px] text-red-400 pt-1">{error}</p>
              )}
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold mb-3">Verify</p>
            <h2 id="signin-title" className="font-serif text-[24px] leading-tight font-light text-text-primary">
              Enter the 6-digit code
            </h2>
            <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
              Sent to <span className="text-text-primary font-mono">+91 {phone}</span>.{" "}
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-gold hover:text-gold-light underline-offset-2 hover:underline"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                Change
              </button>
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-3">
              <label htmlFor="signin-otp" className="block font-mono text-[10px] tracking-[0.1em] uppercase text-text-secondary">
                Code
              </label>
              <input
                id="signin-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                required
                className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-md text-[18px] tracking-[0.4em] text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold/40 transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={busy || otp.length < 6}
                className="w-full h-12 rounded-md bg-gold text-on-gold font-semibold text-[14px] hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                {busy ? "Verifying…" : "Verify →"}
              </button>
              {error && (
                <p role="alert" className="text-[12px] text-red-400 pt-1">{error}</p>
              )}
            </form>
          </>
        )}

        {step === "profile" && (
          <>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold mb-3">Almost there</p>
            <h2 id="signin-title" className="font-serif text-[24px] leading-tight font-light text-text-primary">
              A few quick details
            </h2>
            <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
              So we can keep your renders and reach out about updates.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-3">
              <label htmlFor="signin-name" className="block font-mono text-[10px] tracking-[0.1em] uppercase text-text-secondary">
                Your name
              </label>
              <input
                id="signin-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-md text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold/40 transition-colors"
              />

              <label htmlFor="signin-email" className="block font-mono text-[10px] tracking-[0.1em] uppercase text-text-secondary pt-1">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                required
                className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-md text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold/40 transition-colors"
              />

              <label className="flex items-start gap-2 pt-2 text-[13px] text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={optInSms}
                  onChange={(e) => setOptInSms(e.target.checked)}
                  className="mt-1 accent-gold"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                />
                <span>Send me design tips and product updates on WhatsApp.</span>
              </label>

              <button
                type="submit"
                disabled={busy || !name.trim() || !email.trim()}
                className="w-full h-12 rounded-md bg-gold text-on-gold font-semibold text-[14px] hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                {busy ? "Saving…" : "Continue →"}
              </button>
              {error && (
                <p role="alert" className="text-[12px] text-red-400 pt-1">{error}</p>
              )}
            </form>
          </>
        )}

        {/* Invisible reCAPTCHA container — required by Firebase phone auth */}
        <div id={RECAPTCHA_CONTAINER_ID} />
      </div>
    </div>,
    document.body,
  );
}
