"use client";

import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase";

export default function RegistracijaPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
      window.location.href = "/mano";
    } catch (e: any) {
      setErr(e?.message ?? "Nepavyko užsiregistruoti");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-black">Registracija</h1>

      <form onSubmit={onSubmit} className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <Field label="El. paštas">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            placeholder="pvz. vardas@gmail.com"
          />
        </Field>

        <Field label="Slaptažodis (min. 6)">
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
          disabled={busy}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:bg-white/90 disabled:opacity-60"
        >
          {busy ? "Kuriama..." : "Sukurti paskyrą"}
        </button>

        <div className="text-center text-sm text-white/60">
          Jau turi paskyrą?{" "}
          <Link className="font-extrabold text-white hover:underline" href="/prisijungti">
            Prisijungti
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
