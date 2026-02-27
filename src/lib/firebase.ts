// Firebase client init (safe for Next.js SSR/SSG on Vercel)
// Important: This file must NOT initialize Firebase on the server, otherwise build/prerender can fail
// when env vars are not available.

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const isBrowser = typeof window !== "undefined";

function canInit() {
  return isBrowser && !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
}

function getFirebaseApp() {
  if (!canInit()) return null as any;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// These exports are used only inside Client Components (useEffect / events).
// On the server they resolve to null-ish values to avoid Vercel build/prerender crashes.
export const app = getFirebaseApp();
export const auth = canInit() ? getAuth(app) : (null as any);
export const db = canInit() ? getFirestore(app) : (null as any);
export const storage = canInit() ? getStorage(app) : (null as any);
