"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./firebase";

export function useAuth() {
  // During Next.js build/prerender, `auth` may be null (because window is undefined).
  const initialUser: User | null =
    typeof window !== "undefined" && auth ? (auth as any).currentUser ?? null : null;

  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(true);

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
