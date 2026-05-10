"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

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
  phone?: string;
  country?: string;
};

function parseListingPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  if (parts[0] !== "transportas" && parts[0] !== "dalys") return null;
  return {
    collectionName: parts[0] === "transportas" ? "ads" : "parts",
    type: parts[0] as "transportas" | "dalys",
    id: decodeURIComponent(parts[1]),
  };
}

function listingTitle(item: Item) {
  return item.title || [item.brand, item.model].filter(Boolean).join(" ") || "Skelbimas";
}

export function SellerFloatingPanel() {
  const pathname = usePathname();
  const listingPath = useMemo(() => parseListingPath(pathname || ""), [pathname]);

  const [siteCountry, setSiteCountry] = useState<SiteCountry>("LT");
  const [current, setCurrent] = useState<Item | null>(null);
  const [ads, setAds] = useState<Item[]>([]);
  const [parts, setParts] = useState<Item[]>([]);

  useEffect(() => {
    setSiteCountry(getSiteCountry());
  }, []);

  useEffect(() => {
    if (!listingPath) {
      setCurrent(null);
      return;
    }

    const unsub = onSnapshot(doc(db, listingPath.collectionName, listingPath.id), (snap) => {
      setCurrent(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Item) : null);
    });

    return () => unsub();
  }, [listingPath?.collectionName, listingPath?.id]);

  useEffect(() => {
    if (!current) return;

    const unsubAds = onSnapshot(query(collection(db, "ads"), orderBy("createdAt", "desc")), (snap) => {
      setAds(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    const unsubParts = onSnapshot(query(collection(db, "parts"), orderBy("createdAt", "desc")), (snap) => {
      setParts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => {
      unsubAds();
      unsubParts();
    };
  }, [current]);

  if (!listingPath || !current) return null;

  const sellerId = getSellerId(current);
  if (!sellerId) return null;

  const sellerName = getSellerName(current);
  const sellerCity = getSellerCity(current);
  const sellerPhone = getSellerPhone(current);

  const otherAds = ads
    .filter((x) => x.id !== current.id)
    .filter((x) => normalizeItemCountry(x.country) === siteCountry)
    .filter((x) => isSameSeller(x, sellerId))
    .slice(0, 2)
    .map((x) => ({ ...x, href: `/transportas/${x.id}`, badge: "Transportas" }));

  const otherParts = parts
    .filter((x) => x.id !== current.id)
    .filter((x) => normalizeItemCountry(x.country) === siteCountry)
    .filter((x) => isSameSeller(x, sellerId))
    .slice(0, 2)
    .map((x) => ({ ...x, href: `/dalys/${x.id}`, badge: "Dalys" }));

  const otherItems = [...otherAds, ...otherParts].slice(0, 3);

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-6xl md:bottom-5 md:left-auto md:right-5 md:w-[340px]">
      <div className="rounded-3xl border border-white/15 bg-black/85 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-extrabold uppercase tracking-wide text-white/50">Pardavėjas</div>
            <Link href={`/pardavejai/${sellerId}`} className="mt-1 block truncate text-lg font-black text-white hover:underline">
              {sellerName}
            </Link>
            <div className="mt-1 text-xs font-semibold text-white/55">
              {[sellerCity, sellerPhone].filter(Boolean).join(" • ") || "Visi šio pardavėjo skelbimai"}
            </div>
          </div>
          <Link
            href={`/pardavejai/${sellerId}`}
            className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-black hover:bg-white/90"
          >
            Visi
          </Link>
        </div>

        {otherItems.length ? (
          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="mb-2 text-xs font-extrabold text-white/55">Kiti šio pardavėjo skelbimai</div>
            <div className="space-y-2">
              {otherItems.map((item) => (
                <Link
                  key={`${item.badge}-${item.id}`}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 hover:bg-white/[0.08]"
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
                    {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-white">{listingTitle(item)}</div>
                    <div className="truncate text-xs font-bold text-white/45">{item.badge}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
