"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";

type Ad = {
  id: string;
  title?: string;
  brand?: string;
  model?: string;
  city?: string;
  price?: number;
  imageUrls?: string[];
  category?: string;
  type?: string;
};

export default function TransportasPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [qText, setQText] = useState("");

  useEffect(() => {
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return items;
    return items.filter((a) => {
      const s = `${a.title ?? ""} ${a.brand ?? ""} ${a.model ?? ""} ${a.city ?? ""} ${a.category ?? ""} ${a.type ?? ""}`.toLowerCase();
      return s.includes(t);
    });
  }, [items, qText]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Transportas</h1>
          <div className="mt-1 text-sm font-extrabold text-white/60">
            Skelbimai iš Firestore: <b>ads</b>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link href="/" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">Home</Link>
          <Link href="/transportas/map" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">Žemėlapis</Link>
          <Link href="/ikelti" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-black hover:bg-white/90">➕ Įkelti</Link>
          <Link href="/dalys" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">Dalys</Link>
        </nav>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          placeholder="Ieškoti (markė, modelis, miestas...)"
          className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40"
        />
        <div className="text-xs font-extrabold text-white/55">{filtered.length} skelb.</div>
      </div>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <Link
            key={a.id}
            href={`/transportas/${a.id}`}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
          >
            <div className="aspect-[16/10] bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.imageUrls?.[0] ? (
                <img src={a.imageUrls[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs font-extrabold text-white/40">No photo</div>
              )}
            </div>
            <div className="p-4">
              <div className="truncate text-sm font-black">
                {(a.brand ?? "").toString()} {(a.model ?? "").toString()}
              </div>
              <div className="mt-1 text-xs font-extrabold text-white/55">
                {(a.city ?? "").toString() || "—"} • {(a.category ?? "").toString()} {a.type ? `• ${a.type}` : ""}
              </div>
              <div className="mt-3 text-lg font-black">
                {typeof a.price === "number" ? `${a.price} €` : "Kaina nenurodyta"}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
