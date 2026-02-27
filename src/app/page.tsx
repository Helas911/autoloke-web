"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";

type Item = {
  id: string;
  title?: string;
  brand?: string;
  model?: string;
  city?: string;
  price?: number;
  imageUrls?: string[];
  lat?: number;
  lng?: number;
  category?: string;
  type?: string;
};

type Tab = "transportas" | "dalys";

const LT_CENTER = { lat: 55.1694, lng: 23.8813 };

export default function HomeMarketplace() {
  const router = useRouter();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [tab, setTab] = useState<Tab>("transportas");
  const [qText, setQText] = useState("");
  const [filterByMap, setFilterByMap] = useState(true);

  const [ads, setAds] = useState<Item[]>([]);
  const [parts, setParts] = useState<Item[]>([]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  useEffect(() => {
    const qAds = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const unsubAds = onSnapshot(qAds, (snap) => {
      setAds(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    const qParts = query(collection(db, "parts"), orderBy("createdAt", "desc"));
    const unsubParts = onSnapshot(qParts, (snap) => {
      setParts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => {
      unsubAds();
      unsubParts();
    };
  }, []);

  const items = tab === "transportas" ? ads : parts;

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    const base = !t
      ? items
      : items.filter((a) => {
          const s = `${a.title ?? ""} ${a.brand ?? ""} ${a.model ?? ""} ${a.city ?? ""} ${a.category ?? ""} ${a.type ?? ""}`.toLowerCase();
          return s.includes(t);
        });

    if (!filterByMap) return base;
    if (!bounds) return base;

    return base.filter((a) => {
      if (typeof a.lat !== "number" || typeof a.lng !== "number") return false;
      return bounds.contains(new google.maps.LatLng(a.lat, a.lng));
    });
  }, [items, qText, filterByMap, bounds, tab]);

  const markers = useMemo(() => {
    // Markeriai iš visų įrašų, bet ribojam kiekį
    return items
      .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
      .slice(0, 700);
  }, [items]);

  function openItem(id: string) {
    router.push(`/${tab}/${id}`);
  }

  async function centerOnMe() {
    const m = mapRef.current;
    if (!m) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        m.panTo(p);
        m.setZoom(Math.max(m.getZoom() ?? 8, 11));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-extrabold text-white/70">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Ta pati Firebase bazė kaip programėlėje
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Autoloke – <span className="text-white/85">Lengvai rask transportą ir dalis aplink save.</span>
          </h1>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link href="/transportas" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">
            Transportas
          </Link>
          <Link href="/dalys" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">
            Dalys
          </Link>
          <Link href="/ikelti" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-black hover:bg-white/90">
            ➕ Įkelti
          </Link>
        </nav>
      </div>

      {/* Tabs + search */}
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setTab("transportas")}
              className={`rounded-xl px-4 py-2 text-sm font-extrabold ${tab === "transportas" ? "bg-white text-black" : "text-white/80 hover:bg-white/[0.06]"}`}
            >
              🚗 Transportas
            </button>
            <button
              type="button"
              onClick={() => setTab("dalys")}
              className={`rounded-xl px-4 py-2 text-sm font-extrabold ${tab === "dalys" ? "bg-white text-black" : "text-white/80 hover:bg-white/[0.06]"}`}
            >
              🧩 Dalys
            </button>
          </div>

          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder={tab === "transportas" ? "Ieškoti transporto (markė, modelis, miestas...)" : "Ieškoti dalių (pavadinimas, markė, miestas...)"}
            className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40"
          />
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <button
            type="button"
            onClick={centerOnMe}
            className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
          >
            📍 Aplink mane
          </button>
          <button
            type="button"
            onClick={() => setFilterByMap((v) => !v)}
            className={`rounded-2xl px-4 py-3 text-sm font-extrabold ${filterByMap ? "bg-white text-black" : "border border-white/12 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]"}`}
            title="Rodyti tik tai, kas matosi žemėlapyje"
          >
            Filtruoti pagal žemėlapį: {filterByMap ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        {!isLoaded ? (
          <div className="grid h-[46vh] place-items-center text-sm font-extrabold text-white/60">
            Žemėlapis kraunasi… (įsidėk NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "46vh" }}
            center={LT_CENTER}
            zoom={6.6}
            onLoad={(m) => { mapRef.current = m; }}
            onIdle={() => {
              const b = mapRef.current?.getBounds() ?? null;
              setBounds(b);
            }}
            options={{
              clickableIcons: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              gestureHandling: "greedy",
            }}
          >
            {markers.map((m) => (
              <Marker
                key={m.id}
                position={{ lat: m.lat as number, lng: m.lng as number }}
                title={`${m.brand ?? m.title ?? ""} ${m.model ?? ""}`.trim()}
                label={
                  typeof m.price === "number"
                    ? { text: `${m.price}€`, className: "priceLabel" }
                    : undefined
                }
                onClick={() => openItem(m.id)}
              />
            ))}
          </GoogleMap>
        )}
      </div>

      {/* List */}
      <div className="mt-5 flex items-center justify-between">
        <div className="text-lg font-black">Skelbimai</div>
        <div className="text-xs font-extrabold text-white/55">Rasta: {filtered.length}</div>
      </div>

      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <Link
            key={a.id}
            href={`/${tab}/${a.id}`}
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
                {tab === "transportas" ? (
                  <>
                    {(a.brand ?? "").toString()} {(a.model ?? "").toString()}
                  </>
                ) : (
                  <>{(a.title ?? "Detalė").toString()}</>
                )}
              </div>
              <div className="mt-1 text-xs font-extrabold text-white/55">
                {(a.city ?? "").toString() || "—"}
                {a.category ? ` • ${a.category}` : ""}
                {a.type ? ` • ${a.type}` : ""}
              </div>
              <div className="mt-3 text-lg font-black">
                {typeof a.price === "number" ? `${a.price} €` : "Kaina nenurodyta"}
              </div>
            </div>
          </Link>
        ))}
      </section>

      <style jsx global>{`
        .priceLabel {
          font-weight: 900;
          font-size: 12px;
          padding: 4px 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(0, 0, 0, 0.55);
          color: #fff;
        }
      `}</style>
    </main>
  );
}
