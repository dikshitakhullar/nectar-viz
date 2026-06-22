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

// Skip init at module load when config is missing (e.g. Vercel build before
// env vars are populated). At runtime the env vars are always present, so
// `auth` and `db` will be real instances by the time anything calls them.
const hasConfig = !!firebaseConfig.apiKey;

const _app: FirebaseApp | null = hasConfig
  ? getApps().length ? getApp() : initializeApp(firebaseConfig)
  : null;

// Real instances when configured, null otherwise. Callers in client code
// will always run with config present at runtime; only the build phase ever
// sees null, and the build doesn't touch these (they live behind useEffect).
export const firebaseApp: FirebaseApp = _app as FirebaseApp;
export const auth: Auth = _app ? getAuth(_app) : (null as unknown as Auth);
export const db: Firestore = _app ? getFirestore(_app) : (null as unknown as Firestore);
