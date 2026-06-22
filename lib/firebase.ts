import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy init — defer initializeApp() until the first use so a missing config
// (e.g. during a Vercel build before env vars are set) doesn't crash module
// import time. All callers should access via `getFirebaseAuth()` / `getDb()`.
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getApp_(): FirebaseApp {
  if (_app) return _app;
  if (getApps().length) {
    _app = getApp();
    return _app;
  }
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Firebase not configured — NEXT_PUBLIC_FIREBASE_API_KEY missing. " +
        "Set Firebase env vars in your environment.",
    );
  }
  _app = initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getApp_());
  return _auth;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getApp_());
  return _db;
}

// Back-compat exports used by existing code — these use Proxy so the actual
// SDK call is deferred until property access at runtime (not module import).
export const auth: Auth = new Proxy({} as Auth, {
  get(_t, prop) {
    const a = getFirebaseAuth();
    const v = (a as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(a) : v;
  },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_t, prop) {
    const d = getDb();
    const v = (d as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(d) : v;
  },
});
