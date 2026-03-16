"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { getSiteCountry } from "@/lib/site";
import { t } from "@/lib/i18n";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const country = getSiteCountry();

  async function onLogout() {
    if (!auth) return;
    await signOut(auth as any);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-xl">🚗</span>
          <div className="leading-tight">
            <div className="text-2xl font-black tracking-tight">Autoloke</div>
            <div className="text-[11px] font-semibold text-white/60">{t(country, "siteTagline")}</div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {loading ? null : user ? (
            <>
              <Link
                href="/mano"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-extrabold text-white/90 hover:bg-white/10"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs">👤</span>
                )}
                <span className="hidden max-w-[160px] truncate sm:inline">{user.displayName || user.email || t(country, "myAccount")}</span>
              </Link>

              <button
                onClick={onLogout}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold text-white/90 hover:bg-white/10"
              >
                {t(country, "logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/prisijungti"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold text-white/90 hover:bg-white/10"
              >
                {t(country, "login")}
              </Link>
              <Link href="/registracija" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-black hover:bg-white/90">
                {t(country, "register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
