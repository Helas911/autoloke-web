"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useRouter } from "next/navigation";

import { db } from "@/lib/firebase";
import { cls, formatPrice } from "@/lib/format";
import { bubbleIcon, groupMarkers } from "@/lib/mapMarkers";
import { brandsForCategory, modelsForBrand, type BrandCategory } from "@/lib/brands_models";
import { getSiteCenter, getSiteCountry, normalizeItemCountry, priceShort, type SiteCountry } from "@/lib/site";
import { categoryLabelLocalized, canonicalDriveOptions, canonicalFuelOptions, canonicalGearboxOptions, labelDrive, labelFuel, labelGearbox, t } from "@/lib/i18n";

type Ad = {
  id: string;
  brand?: string;
  model?: string;
  price?: number;
  year?: number;
  lat?: number;
  lng?: number;
  city?: string;
  imageUrls?: string[];
  category?: string; // automobiliai / motociklai / sunkvezimiai / vandens / zu_technika
  type?: string;
  country?: string;
};

const CAT_OPTIONS: Array<{ id: BrandCategory; label: string }> = [
  { id: "automobiliai", label: "Auto" },
  { id: "motociklai", label: "Motociklai" },
  { id: "sunkvezimiai", label: "Sunkvežimiai" },
  { id: "vandens", label: "Vandens" },
  { id: "zu_technika", label: "Ž.Ū. technika" },
];

export default function TransportMapPage() {
  const router = useRouter();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [qText, setQText] = useState("");
  const [siteCountry, setSiteCountry] = useState<SiteCountry>("LT");
  const [items, setItems] = useState<Ad[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

  const [cat, setCat] = useState<BrandCategory>("automobiliai");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [city, setCity] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const [filterByMap, setFilterByMap] = useState(true);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(6.6);
  const initialCenter = useMemo(() => getSiteCenter(siteCountry), [siteCountry]);

  useEffect(() => {
    setSiteCountry(getSiteCountry());
    const unsub = onSnapshot(collection(db, "ads"), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const brands = useMemo(() => brandsForCategory(cat), [cat]);
  const models = useMemo(() => modelsForBrand(cat, brand), [cat, brand]);

  useEffect(() => {
    // reset when category changes
    setBrand("");
    setModel("");
  }, [cat]);

  useEffect(() => {
    if (model && models.length && !models.includes(model)) setModel("");
  }, [models, model]);

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    const b = brand.trim().toLowerCase();
    const m = model.trim().toLowerCase();
    const c = city.trim().toLowerCase();
    const pMin = priceFrom.trim() ? Number(priceFrom) : null;
    const pMax = priceTo.trim() ? Number(priceTo) : null;
    const yMin = yearFrom.trim() ? Number(yearFrom) : null;
    const yMax = yearTo.trim() ? Number(yearTo) : null;

    return items.filter((a) => {
      if (normalizeItemCountry(a.country) !== siteCountry) return false;
      // category filter (only if ad has category)
      if (a.category && a.category !== cat) return false;

      if (t) {
        const s = `${a.brand ?? ""} ${a.model ?? ""} ${a.city ?? ""} ${a.type ?? ""}`.toLowerCase();
        if (!s.includes(t)) return false;
      }
      if (b && !(a.brand ?? "").toLowerCase().includes(b)) return false;
      if (m && !(a.model ?? "").toLowerCase().includes(m)) return false;
      if (c && !(a.city ?? "").toLowerCase().includes(c)) return false;

      if (pMin !== null || pMax !== null) {
        if (typeof a.price !== "number") return false;
        if (pMin !== null && a.price < pMin) return false;
        if (pMax !== null && a.price > pMax) return false;
      }

      if (yMin !== null || yMax !== null) {
        if (typeof a.year !== "number") return false;
        if (yMin !== null && a.year < yMin) return false;
        if (yMax !== null && a.year > yMax) return false;
      }

      if (filterByMap && bounds && typeof a.lat === "number" && typeof a.lng === "number") {
        if (!bounds.contains(new google.maps.LatLng(a.lat, a.lng))) return false;
      }

      return true;
    });
  }, [items, qText, cat, brand, model, city, priceFrom, priceTo, yearFrom, yearTo, filterByMap, bounds, siteCountry]);

  const markers = useMemo(() => {
    return groupMarkers(filtered, zoom).slice(0, 500);
  }, [filtered, zoom]);

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
    <main className="mx-auto max-w-7xl px-3 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-white/80">{t(siteCountry, "vehiclesMap")}</div>
        <button
          type="button"
          onClick={() => setFilterByMap((v) => !v)}
          className={cls(
            "rounded-xl px-3 py-2 text-xs font-extrabold transition",
            filterByMap ? "bg-blue-500 text-white" : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
          )}
        >
          {t(siteCountry, "filterByMap")}: {filterByMap ? t(siteCountry, "on") : t(siteCountry, "off")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.45fr_0.95fr]">
        {/* MAP */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {!isLoaded ? (
            <div className="grid h-[58vh] lg:h-[76vh] place-items-center text-sm font-extrabold text-white/60">
              {t(siteCountry, "mapLoading")}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "76vh" }}
              zoom={6.6}
              center={initialCenter}
              key={siteCountry}
              onLoad={(m) => {
                mapRef.current = m;
              }}
              onIdle={() => {
                const m = mapRef.current;
                if (!m) return;
                setBounds(m.getBounds() ?? null);
                setZoom(m.getZoom() ?? 6.6);
              }}
              options={{
                clickableIcons: false,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                gestureHandling: "greedy",
              }}
            >
              {markers.map((g) => {
                const count = g.items.length;
                const first = g.items[0];
                const label = count > 1 ? String(count) : priceShort(first.price, siteCountry);
                const icon = bubbleIcon(label, count > 1 ? "count" : "price");
                return (
                  <Marker
                    key={g.key}
                    position={g.pos}
                    icon={icon}
                    onClick={() => {
                      if (count === 1) {
                        router.push(`/transportas/${first.id}`);
                      } else {
                        mapRef.current?.panTo(g.pos);
                        mapRef.current?.setZoom(Math.min(14, (zoom || 6.6) + 2));
                      }
                    }}
                  />
                );
              })}
            </GoogleMap>
          )}
        </div>

        {/* FILTERS + LIST */}
        <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black">{t(siteCountry, "filters")}</div>
              <div className="text-xs font-extrabold text-white/55">{filtered.length} {t(siteCountry, "adsCount")} • {t(siteCountry, "activeSeparate")}</div>
            </div>
            <button
              type="button"
              onClick={centerOnMe}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08]"
            >
              📍 {t(siteCountry, "nearMe")}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as BrandCategory)}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none"
            >
              {CAT_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Paieška (Audi A6, Vilnius...)"
              className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40"
            />

            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none"
            >
              <option value="">Markė (visos)</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!brand}
              className={cls(
                "rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none",
                !brand && "opacity-60"
              )}
            >
              <option value="">{brand ? "Modelis (visi)" : "Modelis (pirma markė)"}</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} inputMode="numeric" className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none placeholder:text-white/40" placeholder={t(siteCountry, "priceFrom")} />
            <input value={priceTo} onChange={(e) => setPriceTo(e.target.value)} inputMode="numeric" className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none placeholder:text-white/40" placeholder={t(siteCountry, "priceTo")} />
            <input value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} inputMode="numeric" className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none placeholder:text-white/40" placeholder="Metai nuo" />
            <input value={yearTo} onChange={(e) => setYearTo(e.target.value)} inputMode="numeric" className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none placeholder:text-white/40" placeholder="Metai iki" />
            <input value={city} onChange={(e) => setCity(e.target.value)} className="col-span-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold outline-none placeholder:text-white/40" placeholder={t(siteCountry, "city")} />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setQText("");
                setBrand("");
                setModel("");
                setCity("");
                setPriceFrom("");
                setPriceTo("");
                setYearFrom("");
                setYearTo("");
              }}
              className="flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
            >
              Išvalyti
            </button>
          </div>

          <div className="mt-3 max-h-[46vh] overflow-auto rounded-2xl border border-white/10">
            {filtered.slice(0, 80).map((a) => (
              <button
                key={a.id}
                onClick={() => router.push(`/transportas/${a.id}`)}
                className="flex w-full items-center gap-3 border-b border-white/10 p-3 text-left hover:bg-white/[0.04]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrls?.[0] || "/favicon.ico"} alt="" loading="lazy" decoding="async" className="h-10 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black">{`${a.brand ?? ""} ${a.model ?? ""}`.trim() || "Skelbimas"}</div>
                  <div className="truncate text-xs font-semibold text-white/55">{[a.city, a.year].filter(Boolean).join(" • ")}</div>
                </div>
                <div className="text-sm font-black">{typeof a.price === "number" ? formatPrice(a.price, siteCountry) : "—"}</div>
              </button>
            ))}
            {filtered.length === 0 ? (
              <div className="p-4 text-sm font-semibold text-white/60">Nieko nerasta.</div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
