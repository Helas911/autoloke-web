"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";

type Ad = {
  id: string;
  brand?: string;
  model?: string;
  price?: number;
  lat?: number;
  lng?: number;
  city?: string;
};

const LT_CENTER = { lat: 55.1694, lng: 23.8813 };

export default function TransportMapPage() {
  const router = useRouter();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [qText, setQText] = useState("");
  const [items, setItems] = useState<Ad[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ads"), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const markers = useMemo(() => {
    const t = qText.trim().toLowerCase();
    return items
      .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
      .filter((a) => {
        if (!t) return true;
        const s = `${a.brand ?? ""} ${a.model ?? ""} ${a.city ?? ""}`.toLowerCase();
        return s.includes(t);
      })
      .slice(0, 700);
  }, [items, qText]);

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Transportas žemėlapyje</h1>
          <div className="mt-1 text-sm font-extrabold text-white/60">
            Markeriai iš Firestore kolekcijos: <b>ads</b>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/transportas"
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
          >
            ← Sąrašas
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
          >
            Home
          </Link>
        </nav>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          placeholder="Ieškoti žemėlapyje (markė, modelis, miestas...)"
          className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40"
        />
        <button
          type="button"
          onClick={centerOnMe}
          className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
        >
          📍 Aplink mane
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        {!isLoaded ? (
          <div className="grid h-[70vh] place-items-center text-sm font-extrabold text-white/60">
            Kraunasi žemėlapis…
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "70vh" }}
            center={LT_CENTER}
            zoom={6.6}
            onLoad={(m) => { mapRef.current = m; }}
            options={{
              clickableIcons: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              gestureHandling: "greedy", // ✅ be CTRL
            }}
          >
            {markers.map((m) => (
              <Marker
                key={m.id}
                position={{ lat: m.lat as number, lng: m.lng as number }}
                title={`${m.brand ?? ""} ${m.model ?? ""}`.trim()}
                label={
                  typeof m.price === "number"
                    ? { text: `${m.price}€`, className: "priceLabel" }
                    : undefined
                }
                onClick={() => router.push(`/transportas/${m.id}`)}
              />
            ))}
          </GoogleMap>
        )}
      </div>

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
