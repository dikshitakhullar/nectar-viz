import { doc, getDoc, setDoc, serverTimestamp, increment, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export type UserPlan = "free" | "member";

export interface UserProfile {
  uid: string;
  phoneNumber: string | null;
  name: string;
  email: string;
  optInSms: boolean;
  plan: UserPlan;
  generationsUsed: number;
  createdAt: Timestamp | null;
}

export const FREE_QUOTA = 10;

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

/** Create the user doc on first sign-in. Idempotent: skips if doc already exists. */
export async function ensureUserProfile(args: {
  uid: string;
  phoneNumber: string | null;
}): Promise<void> {
  const ref = doc(db, "users", args.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    phoneNumber: args.phoneNumber,
    name: "",
    email: "",
    optInSms: false,
    plan: "free" as UserPlan,
    generationsUsed: 0,
    createdAt: serverTimestamp(),
  });
}

/** First-time profile completion: name, email, opt-in. */
export async function updateUserProfile(uid: string, data: {
  name: string;
  email: string;
  optInSms: boolean;
}): Promise<void> {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

/** Atomic increment for the per-user quota counter. */
export async function incrementGenerationsUsed(uid: string): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    { generationsUsed: increment(1) },
    { merge: true },
  );
}

/** Whether the user has quota remaining (members are unlimited; future). */
export function hasQuotaRemaining(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.plan === "member") return true;
  return profile.generationsUsed < FREE_QUOTA;
}

/** Whether profile is "complete" (has name + email). Used to decide if we need
 *  to show the first-time profile step after phone OTP verification. */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!profile.name?.trim() && !!profile.email?.trim();
}
