"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import type { Ad, Part } from "@/lib/types";
import { ListingCard } from "@/components/ListingCard";

export default function ManoPage() {
  const { user, loading } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  useEffect(() => {
    const q1 = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(q1, (snap) => {
      setAds(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    const q2 = query(collection(db, "parts"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      setParts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const myAds = useMemo(() => ads.filter((a) => user?.uid && a.ownerUid === user.uid), [ads, user?.uid]);
  const myParts = useMemo(() => parts.filter((p) => user?.uid && p.ownerUid === user.uid), [parts, user?.uid]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/70">Kraunasi...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-black">Mano</h1>
        <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="text-white/70">Kad matytum savo skelbimus, reikia prisijungti.</div>
          <div className="mt-4 flex gap-2">
            <Link href="/prisijungti" className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-black hover:bg-white/90">
              Prisijungti
            </Link>
            <Link href="/registracija" className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">
              Registracija
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Mano skelbimai</h1>
          <div className="mt-1 text-sm text-white/60">{user.email}</div>
        </div>
        <Link href="/ikelti" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-black hover:bg-white/90">
          ➕ Įkelti
        </Link>
      </div>

      <h2 className="mt-6 text-lg font-black">Transportas</h2>
      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {myAds.map((a) => (
          <ListingCard
            key={a.id}
            href={`/transportas/${a.id}`}
            title={`${a.brand ?? ""} ${a.model ?? ""}`.trim() || (a.title ?? "Skelbimas")}
            subtitle={[a.city, a.type].filter(Boolean).join(" • ")}
            price={typeof a.price === "number" ? a.price : null}
            img={a.imageUrls?.[0] ?? null}
            badge="Mano"
          />
        ))}
      </section>
      {!myAds.length ? <Empty text="Neturi transporto skelbimų." /> : null}

      <h2 className="mt-8 text-lg font-black">Dalys</h2>
      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {myParts.map((p) => (
          <ListingCard
            key={p.id}
            href={`/dalys/${p.id}`}
            title={p.title || "Detalė"}
            subtitle={[p.city, [p.brand, p.model].filter(Boolean).join(" ")].filter(Boolean).join(" • ")}
            price={typeof p.price === "number" ? p.price : null}
            img={p.imageUrls?.[0] ?? null}
            badge="Mano"
          />
        ))}
      </section>
      {!myParts.length ? <Empty text="Neturi dalių skelbimų." /> : null}
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">{text}</div>
  );
}
