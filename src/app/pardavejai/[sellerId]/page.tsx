"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import LocalListingRow from "@/components/LocalListingRow";
import { formatPrice } from "@/lib/format";
import { db } from "@/lib/firebase";
import { getSiteCountry, normalizeItemCountry, type SiteCountry } from "@/lib/site";
import { getSellerCity, getSellerId, getSellerName, getSellerPhone, isSameSeller } from "@/lib/sellers";

type Item = {
  id: string;
  title?: string;
  brand?: string;
  model?: string;
  city?: string;
  price?: number;
  imageUrls?: string[];
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  ownerUid?: string;
  country?: string;
};

export default function SellerPage() {
  const params = useParams<{ sellerId: string }>();
  const sellerId = params?.sellerId || "";

  const [siteCountry, setSiteCountry] = useState<SiteCountry>("LT");
  const [ads, setAds] = useState<Item[]>([]);
  const [parts, setParts] = useState<Item[]>([]);

  useEffect(() => {
    setSiteCountry(getSiteCountry());

    const unsubAds = onSnapshot(
      query(collection(db, "ads"), orderBy("createdAt", "desc")),
      (snap) => setAds(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );

    const unsubParts = onSnapshot(
      query(collection(db, "parts"), orderBy("createdAt", "desc")),
      (snap) => setParts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );

    return () => {
      unsubAds();
      unsubParts();
    };
  }, []);

  const allItems = useMemo(() => {
    const transport = ads
      .filter((x) => normalizeItemCountry(x.country) === siteCountry)
      .filter((x) => isSameSeller(x, sellerId))
      .map((x) => ({ ...x, href: `/transportas/${x.id}`, badge: "Transportas" }));

    const partItems = parts
      .filter((x) => normalizeItemCountry(x.country) === siteCountry)
      .filter((x) => isSameSeller(x, sellerId))
      .map((x) => ({ ...x, href: `/dalys/${x.id}`, badge: "Dalys" }));

    return [...transport, ...partItems];
  }, [ads, parts, sellerId, siteCountry]);

  const seller = allItems[0];
  const sellerName = seller ? getSellerName(seller) : "Pardavėjas";
  const sellerCity = seller ? getSellerCity(seller) : "";
  const sellerPhone = seller ? getSellerPhone(seller) : "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/" className="text-sm font-extrabold text-white/80 hover:text-white">
        ← Atgal
      </Link>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-3xl font-black text-white">{sellerName}</h1>

        <div className="mt-3 space-y-1 text-sm text-white/70">
          {sellerCity ? <div>📍 {sellerCity}</div> : null}
          {sellerPhone ? (
            <div>
              📞 <a href={`tel:${sellerPhone}`} className="font-bold text-white">{sellerPhone}</a>
            </div>
          ) : null}
          <div>📢 Skelbimų kiekis: {allItems.length}</div>
        </div>
      </div>

      <section className="mt-6 space-y-4">
        {allItems.map((item) => (
          <LocalListingRow
            key={`${item.badge}-${item.id}`}
            href={item.href}
            title={item.title || [item.brand, item.model].filter(Boolean).join(" ") || "Skelbimas"}
            subtitle={item.city}
            price={typeof item.price === "number" ? item.price : null}
            img={item.imageUrls?.[0] || null}
            badge={item.badge}
            country={siteCountry}
          />
        ))}

        {allItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
            Šis pardavėjas kol kas neturi aktyvių skelbimų.
          </div>
        ) : null}
      </section>
    </main>
  );
}
