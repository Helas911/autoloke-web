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
    await signOut(auth);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 shadow-[0_4px_24px_rgba(7,80,43,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Autoloke – pradinis puslapis">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-xl text-white shadow-sm">🚗</span>
          <span className="truncate text-2xl font-black tracking-tight text-emerald-800">Autoloke</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label={country === "DK" ? "Hovedmenu" : "Pagrindinis meniu"}>
          <Link href="/transportas" className="text-sm font-extrabold text-emerald-950 transition hover:text-emerald-600">{t(country, "transport")}</Link>
          <Link href="/dalys" className="text-sm font-extrabold text-emerald-950 transition hover:text-emerald-600">{t(country, "parts")}</Link>
          <Link href="/skelbimu-lenta" className="text-sm font-extrabold text-emerald-950 transition hover:text-emerald-600">{country === "DK" ? "Opslagstavle" : "Skelbimų lenta"}</Link>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 sm:inline-flex">
            {country === "DK" ? "🇩🇰 DK" : "🇱🇹 LT"}
          </span>
          {!loading && (user ? (
            <>
              <Link href="/mano" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50">
                {user.photoURL ? <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" /> : <span>👤</span>}
                <span className="hidden max-w-28 truncate sm:inline">{user.displayName || user.email || t(country, "myAccount")}</span>
              </Link>
              <button onClick={onLogout} className="hidden rounded-full border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50 sm:inline-flex">{t(country, "logout")}</button>
            </>
          ) : (
            <Link href="/prisijungti" className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50">👤 <span className="hidden sm:inline">{t(country, "login")}</span></Link>
          ))}
          <Link href="/ikelti" className="inline-flex items-center rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800">＋ {t(country, "upload")}</Link>
        </div>
      </div>

      <nav className="flex items-center justify-around gap-2 border-t border-emerald-100 px-3 py-2 lg:hidden" aria-label={country === "DK" ? "Mobilmenu" : "Mobilus meniu"}>
        <Link href="/transportas" className="text-xs font-bold text-emerald-800">{t(country, "transport")}</Link>
        <Link href="/dalys" className="text-xs font-bold text-emerald-800">{t(country, "parts")}</Link>
        <Link href="/skelbimu-lenta" className="text-xs font-bold text-emerald-800">{country === "DK" ? "Opslagstavle" : "Skelbimų lenta"}</Link>
        <Link href="/mano" className="text-xs font-bold text-emerald-800">{country === "DK" ? "Min konto" : "Mano"}</Link>
      </nav>
    </header>
  );
}
