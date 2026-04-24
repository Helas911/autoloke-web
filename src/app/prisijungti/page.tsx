"use client";

import Link from "next/link";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { getSiteCountry } from "@/lib/site";
import { t } from "@/lib/i18n";

export default function PrisijungtiPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const country = getSiteCountry();
  const [nextPath, setNextPath] = useState("/mano");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/mano";
    if (next.startsWith("/") && !next.startsWith("//")) setNextPath(next);
  }, []);

  async function loginWithGoogle() {
    setErr(null);
    setBusy(true);
    try {
      if (!auth || !googleProvider) throw new Error(country === "DK" ? "Google-login er ikke klar" : "Google prisijungimas neparuoštas");
      await signInWithPopup(auth as any, googleProvider as any);
      window.location.href = nextPath;
    } catch (e: any) {
      setErr(e?.message ?? (country === "DK" ? "Google-login mislykkedes" : "Nepavyko prisijungti su Google"));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      window.location.href = nextPath;
    } catch (e: any) {
      setErr(e?.message ?? (country === "DK" ? "Login mislykkedes" : "Nepavyko prisijungti"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-black">{t(country, "login")}</h1>

      <form onSubmit={onSubmit} className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <Field label={t(country, "email")}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            placeholder="pvz. vardas@gmail.com"
          />
        </Field>

        <Field label={t(country, "password")}>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            placeholder="••••••••"
          />
        </Field>

        {err ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{err}</div> : null}

        <button
          type="button"
          onClick={loginWithGoogle}
          disabled={busy}
          className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/10 disabled:opacity-60"
        >
          {busy ? t(country, "joining") : t(country, "loginGoogle")}
        </button>

        <div className="text-center text-xs font-extrabold text-white/40">arba</div>

        <button disabled={busy} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:bg-white/90 disabled:opacity-60">
          {busy ? t(country, "joining") : t(country, "login")}
        </button>

        <div className="text-center text-sm text-white/60">
          {t(country, "noAccount")} {" "}
          <Link className="font-extrabold text-white hover:underline" href={`/registracija?next=${encodeURIComponent(nextPath)}`}>
            {t(country, "register")}
          </Link>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-extrabold text-white/60">{label}</div>
      {children}
    </div>
  );
}
