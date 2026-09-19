"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteFolder } from "@/lib/upload";
import { useAuth } from "@/lib/useAuth";
import { getSiteCountry } from "@/lib/site";

type Listing = {
  id: string;
  kind: "ads" | "parts";
  title?: string;
  brand?: string;
  model?: string;
  price?: number;
  currency?: string;
  city?: string;
  imageUrls?: string[];
  ownerUid?: string;
};

export default function ManoPage() {
  const isDk = getSiteCountry() === "DK";
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function loadItems() {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const [adsSnap, partsSnap] = await Promise.all([
        getDocs(query(collection(db, "ads"), where("ownerUid", "==", user.uid))),
        getDocs(query(collection(db, "parts"), where("ownerUid", "==", user.uid))),
      ]);

      const ads = adsSnap.docs.map((d) => ({ id: d.id, kind: "ads" as const, ...d.data() } as Listing));
      const parts = partsSnap.docs.map((d) => ({ id: d.id, kind: "parts" as const, ...d.data() } as Listing));

      setItems([...ads, ...parts]);
    } catch (e: any) {
      setErr(e?.message || (isDk ? "Annoncerne kunne ikke indlæses." : "Nepavyko užkrauti skelbimų."));
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(item: Listing) {
    if (!user || !db) return;
    if (!confirm(isDk ? "Vil du virkelig slette denne annonce?" : "Tikrai ištrinti šį skelbimą?")) return;

    try {
      setErr(null);
      await deleteDoc(doc(db, item.kind, item.id));
      await deleteFolder(`${item.kind}/${user.uid}/${item.id}`).catch(() => undefined);
      setItems((prev) => prev.filter((x) => !(x.kind === item.kind && x.id === item.id)));
    } catch (e: any) {
      setErr(e?.message || (isDk ? "Annoncen kunne ikke slettes." : "Nepavyko ištrinti skelbimo."));
    }
  }

  useEffect(() => {
    if (!authLoading) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid]);

  if (authLoading || loading) return <main className="p-6 text-white">{isDk ? "Indlæser..." : "Kraunama..."}</main>;

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-white">
        <h1 className="text-2xl font-black">{isDk ? "Log ind" : "Prisijunkite"}</h1>
        <p className="mt-2 text-white/60">{isDk ? "Log ind for at se og slette dine annoncer." : "Prisijungus matysite savo skelbimus ir galėsite juos ištrinti."}</p>
        <Link href="/prisijungti?next=/mano" className="mt-5 inline-block rounded-2xl bg-white px-5 py-3 font-black text-black">
          {isDk ? "Log ind" : "Prisijungti"}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-24 text-white">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{isDk ? "Mine annoncer" : "Mano skelbimai"}</h1>
          <p className="text-sm text-white/55">{isDk ? "Her vises kun annoncer, der er oprettet med din konto." : "Čia rodomi tik su jūsų paskyra sukurti skelbimai."}</p>
        </div>
        <Link href="/ikelti" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">{isDk ? "Opret annonce" : "Įkelti"}</Link>
      </div>

      {err ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{err}</div> : null}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
          {isDk ? "Der er ingen annoncer endnu. Nye annoncer vises her, når du opretter dem." : "Skelbimų nėra. Nauji skelbimai atsiras čia, kai juos įkelsite prisijungę."}
        </div>
      ) : null}

      <div className="grid gap-3">
        {items.map((item) => {
          const name = item.title || [item.brand, item.model].filter(Boolean).join(" ") || (item.kind === "parts" ? (isDk ? "Reservedelsannonce" : "Detalės skelbimas") : (isDk ? "Køretøjsannonce" : "Transporto skelbimas"));
          return (
            <article key={`${item.kind}-${item.id}`} className="flex gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-3">
              <div className="h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                {item.imageUrls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black">{name}</div>
                <div className="mt-1 text-sm text-white/60">{item.city || (isDk ? "By ikke angivet" : "Miestas nenurodytas")}</div>
                <div className="mt-1 text-sm font-bold">{item.price ? `${item.price} ${item.currency || (isDk ? "DKK" : "€")}` : (isDk ? "Pris ikke angivet" : "Kaina nenurodyta")}</div>
                <button
                  onClick={() => removeItem(item)}
                  className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-500"
                >
                  {isDk ? "Slet" : "Ištrinti"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
