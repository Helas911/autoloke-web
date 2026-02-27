"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./firebase";

export function useAuth() {
  // ✅ Important for Next.js (SSR/SSG on Vercel): never touch `auth.currentUser` during render.
  // Some build/prerender paths can evaluate this code without a real Firebase Auth instance,
  // which causes `Cannot read properties of null (reading 'currentUser')`.
  // We always start with null and resolve the user only inside `useEffect` (client-only).
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!auth) {
      // No Firebase auth available in this runtime (SSR/build).
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth as any, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { user, loading };
}
