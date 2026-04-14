"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalListingCard } from "@/components/ExternalListingCard";
import type { ExternalListing } from "@/lib/externalAggregator";
import type { CSSProperties } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { GoogleMap, Marker, MarkerClustererF, useLoadScript } from "@react-google-maps/api";
import { useRouter } from "next/navigation";

import { db } from "@/lib/firebase";
import LocalListingRow from "@/components/LocalListingRow";
import { cls } from "@/lib/format";
import { bubbleIcon } from "@/lib/mapMarkers";
import { citySuggestions, getSiteCenter, getSiteCountry, normalizeItemCountry, priceShort, type SiteCountry } from "@/lib/site";
import { categoryLabelLocalized, canonicalDriveOptions, canonicalFuelOptions, canonicalGearboxOptions, labelDrive, labelFuel, labelGearbox, otherLabel, t } from "@/lib/i18n";
import { VEHICLE_CATEGORIES, VEHICLE_TYPES, type VehicleCategory } from "@/lib/categories";
import { brandsForCategory, modelsForBrand, type BrandCategory } from "@/lib/brands_models";

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
  category?: string; // VehicleCategory
  type?: string;
  year?: number;
  mileage?: number;
  fuel?: string;
  drive?: string;
  gearbox?: string;
  country?: string;
  createdAt?: any;
};

type Tab = "transportas" | "dalys";

const optStyle: CSSProperties = { background: "#0b0b10", color: "rgba(255,255,255,0.95)" };

function toBrandCategory(cat: VehicleCategory): BrandCategory {
  switch (cat) {
    case "vandensTransportas":
      return "vandens";
    case "zemesUkioTechnika":
      return "zu_technika";
    case "automobiliai":
    case "motociklai":
    case "sunkvezimiai":
      return cat;
    default:
      return "automobiliai";
  }
}

const OTHER = "__other__";

function buildTitle(i: Item, tab: Tab) {
  if (tab === "dalys") return i.title?.trim() || "Dalys";
  const t = [i.brand, i.model].filter(Boolean).join(" ");
  return t || "Transportas";
}

function buildSubtitle(i: Item) {
  const bits = [i.city, typeof i.year === "number" ? String(i.year) : undefined, i.type].filter(Boolean);
  return bits.join(" • ");
}

export default function Home() {
  const router = useRouter();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [tab, setTab] = useState<Tab>("transportas");
  const [siteCountry, setSiteCountry] = useState<SiteCountry>("LT");
  const [ads, setAds] = useState<Item[]>([]);
  const [parts, setParts] = useState<Item[]>([]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(7);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  // filters (simple + clean)
  const [qText, setQText] = useState("");
  const [cat, setCat] = useState<VehicleCategory>("automobiliai");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [brandOther, setBrandOther] = useState("");
  const [model, setModel] = useState("");
  const [modelOther, setModelOther] = useState("");
  const [city, setCity] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [mileageMin, setMileageMin] = useState("");
  const [mileageMax, setMileageMax] = useState("");
  const [fuel, setFuel] = useState("");
  const [drive, setDrive] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [filterByMap, setFilterByMap] = useState(true);
  const [externalItems, setExternalItems] = useState<ExternalListing[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);

  useEffect(() => {
    setSiteCountry(getSiteCountry());

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

  const brandCat = toBrandCategory(cat);
  const brands = useMemo(() => brandsForCategory(brandCat), [brandCat]);
  const effectiveBrand = brand === OTHER ? brandOther : brand;
  const models = useMemo(() => modelsForBrand(brandCat, effectiveBrand), [brandCat, effectiveBrand]);

  useEffect(() => {
    if (model && models.length && !models.includes(model)) setModel("");
    if (brand !== OTHER) setBrandOther("");
    if (model !== OTHER) setModelOther("");
  }, [brand]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => (tab === "transportas" ? ads : parts), [tab, ads, parts]);
  const mapCenter = useMemo(() => getSiteCenter(siteCountry), [siteCountry]);
  const cities = useMemo(() => citySuggestions(siteCountry), [siteCountry]);
  const otherText = useMemo(() => otherLabel(siteCountry), [siteCountry]);



  useEffect(() => {
    const queryText = qText.trim();
    if (queryText.length < 2) {
      setExternalItems([]);
      setExternalLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setExternalLoading(true);
        const params = new URLSearchParams({
          q: queryText,
          section: tab === "dalys" ? "dalys" : "transportas",
          category: tab === "transportas" ? cat : "dalys",
        });
        const res = await fetch(`/api/external-search?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("external-search-failed");
        const json = (await res.json()) as ExternalListing[];
        setExternalItems(Array.isArray(json) ? json : []);
      } catch {
        if (!controller.signal.aborted) setExternalItems([]);
      } finally {
        if (!controller.signal.aborted) setExternalLoading(false);
      }
    }, 550);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [qText, tab, cat]);

  const filtered = useMemo(() => {
    const q = qText.trim().toLowerCase();
    const effBrand = (brand === OTHER ? brandOther : brand).trim();
    const effModel = (model === OTHER ? modelOther : model).trim();
    const b = effBrand.toLowerCase();
    const m = effModel.toLowerCase();
    const c = city.trim().toLowerCase();
    const pMin = priceMin.trim() ? Number(priceMin) : null;
    const pMax = priceMax.trim() ? Number(priceMax) : null;
    const yMin = yearMin.trim() ? Number(yearMin) : null;
    const yMax = yearMax.trim() ? Number(yearMax) : null;
    const miMin = mileageMin.trim() ? Number(mileageMin) : null;
    const miMax = mileageMax.trim() ? Number(mileageMax) : null;
    const f = fuel.trim().toLowerCase();
    const d = drive.trim().toLowerCase();
    const g = gearbox.trim().toLowerCase();

    return items.filter((it) => {
      if (normalizeItemCountry(it.country) !== siteCountry) return false;
      if (tab === "transportas") {
        if (cat && it.category && it.category !== cat) return false;
        if (type.trim() && (it.type || "").toLowerCase() !== type.trim().toLowerCase()) return false;
      }
      if (q) {
        const hay = `${it.title || ""} ${it.brand || ""} ${it.model || ""} ${it.city || ""} ${it.type || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (b && (it.brand || "").toLowerCase() !== b) return false;
      if (m && (it.model || "").toLowerCase() !== m) return false;
      if (c && !(it.city || "").toLowerCase().includes(c)) return false;

      if (typeof pMin === "number" && typeof it.price === "number" && it.price < pMin) return false;
      if (typeof pMax === "number" && typeof it.price === "number" && it.price > pMax) return false;

      if (typeof yMin === "number" && typeof it.year === "number" && it.year < yMin) return false;
      if (typeof yMax === "number" && typeof it.year === "number" && it.year > yMax) return false;

      if (typeof miMin === "number") {
        if (typeof it.mileage !== "number") return false;
        if (it.mileage < miMin) return false;
      }
      if (typeof miMax === "number") {
        if (typeof it.mileage !== "number") return false;
        if (it.mileage > miMax) return false;
      }

      if (f && (it.fuel || "").toLowerCase() !== f) return false;
      if (d && (it.drive || "").toLowerCase() !== d) return false;
      if (g && (it.gearbox || "").toLowerCase() !== g) return false;

      if (filterByMap && bounds && typeof it.lat === "number" && typeof it.lng === "number") {
        if (!bounds.contains(new google.maps.LatLng(it.lat, it.lng))) return false;
      }

      return true;
    });
  }, [items, qText, brand, model, city, priceMin, priceMax, mileageMin, mileageMax, fuel, drive, gearbox, yearMin, yearMax, filterByMap, bounds, tab, cat, type, siteCountry]);


  function goNearMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        mapRef.current?.panTo({ lat: la, lng: ln });
        mapRef.current?.setZoom(12);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <>
      

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-extrabold text-white/80">
            {t(siteCountry, "siteTagline")}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("transportas")}
              className={cls(
                "rounded-full border px-4 py-2 text-sm font-extrabold",
                tab === "transportas" ? "border-white/25 bg-white/12" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              {t(siteCountry, "transport")}
            </button>
            <button
              onClick={() => setTab("dalys")}
              className={cls(
                "rounded-full border px-4 py-2 text-sm font-extrabold",
                tab === "dalys" ? "border-white/25 bg-white/12" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              {t(siteCountry, "parts")}
            </button>
          </div>
        </div>

        {/* CATEGORIES (only for transport) */}
        {tab === "transportas" ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {VEHICLE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCat(c.id);
                  setType("");
                }}
                className={cls(
                  "rounded-full border px-4 py-2 text-sm font-extrabold transition",
                  c.id === cat ? "border-white/25 bg-white/12 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                )}
              >
                <span className="mr-2">{c.icon}</span>
                {categoryLabelLocalized(c.id, siteCountry)}
              </button>
            ))}
          </div>
        ) : null}

        <section className="grid items-start gap-3 md:grid-cols-[1fr_360px]">
          {/* MAP */}
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
            <div className="relative h-[62vh] min-h-[420px]">
              {/* overlay search */}
              <div className="absolute left-3 right-3 top-3 z-10 flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/12 bg-black/55 px-4 py-3 backdrop-blur">
                  <span className="text-white/70">🔎</span>
                  <input
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder={tab === "transportas" ? t(siteCountry, "searchVehiclePlaceholder") : t(siteCountry, "searchPartsPlaceholder")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={goNearMe}
                    className="rounded-2xl border border-white/12 bg-black/55 px-4 py-3 text-sm font-extrabold text-white/90 backdrop-blur hover:bg-black/45"
                  >
                    📍 {t(siteCountry, "nearMe")}
                  </button>
                  <button
                    onClick={() => setFilterByMap((v) => !v)}
                    className={cls(
                      "rounded-2xl border px-4 py-3 text-sm font-extrabold backdrop-blur",
                      filterByMap ? "border-blue-400/40 bg-blue-600/90 text-white shadow-sm" : "border-white/12 bg-black/55 text-white/85 hover:bg-black/45"
                    )}
                  >
                    {t(siteCountry, "filterByMap")}: {filterByMap ? t(siteCountry, "on") : t(siteCountry, "off")}
                  </button>
                </div>
              </div>

              {isLoaded ? (
                <GoogleMap
                  onLoad={(m) => {
              mapRef.current = m;
            }}
                  onIdle={() => {
                    const m = mapRef.current;
                    if (!m) return;
                    setZoom(m.getZoom() || 7);
                    setBounds(m.getBounds() || null);
                  }}
                  zoom={7}
                  center={mapCenter}
                  key={siteCountry}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  options={{
                    disableDefaultUI: true,
                    clickableIcons: false,
                    gestureHandling: "greedy",
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                  }}
                >
                  <MarkerClustererF
                    options={{
                      minimumClusterSize: 2,
                      gridSize: 56,
                      maxZoom: 15,
                      zoomOnClick: false,
                    }}
                    onClick={(cluster) => {
                      const m = mapRef.current;
                      if (!m) return;
                      const clusterBounds = (cluster as any)?.getBounds?.();
                      if (clusterBounds) {
                        m.fitBounds(clusterBounds);
                        return;
                      }
                      const center = (cluster as any)?.getCenter?.();
                      if (center) {
                        m.panTo(center);
                        m.setZoom(Math.min(16, (m.getZoom() ?? zoom ?? 7) + 2));
                      }
                    }}
                  >
                    {(clusterer) => (
                      <>
                        {filtered
                          .filter((item) => typeof item.lat === "number" && typeof item.lng === "number")
                          .slice(0, 500)
                          .map((item) => (
                            <Marker
                              key={item.id}
                              clusterer={clusterer}
                              position={{ lat: item.lat as number, lng: item.lng as number }}
                              icon={bubbleIcon(priceShort(item.price, siteCountry), "price")}
                              onClick={() => {
                                router.push(tab === "transportas" ? `/transportas/${item.id}` : `/dalys/${item.id}`);
                              }}
                            />
                          ))}
                      </>
                    )}
                  </MarkerClustererF>
                </GoogleMap>
              ) : (
                <div className="grid h-full place-items-center text-sm text-white/70">{t(siteCountry, "mapLoading")}</div>
              )}
            </div>
          </div>

          {/* FILTERS */}
          <aside className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black">{t(siteCountry, "searchFilters")}</div>
              <button
                onClick={() => {
                  setQText("");
                  setBrand("");
                  setModel("");
                  setCity("");
                  setPriceMin("");
                  setPriceMax("");
                  setMileageMin("");
                  setMileageMax("");
                  setFuel("");
                  setDrive("");
                  setGearbox("");
                  setYearMin("");
                  setYearMax("");
                  setType("");
                }}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/80 hover:bg-white/10"
              >
                {t(siteCountry, "clear")}
              </button>
            </div>

            <div className="grid gap-2">
              {tab === "transportas" ? (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="" style={optStyle}>{t(siteCountry, "typeAll")}</option>
                  {VEHICLE_TYPES[cat].map((t) => (
                    <option key={t} value={t} style={optStyle}>{t}</option>
                  ))}
                </select>
              ) : null}

              <select
                value={brand}
                onChange={(e) => {
                  const v = e.target.value;
                  setBrand(v);
                  setModel("");
                }}
                className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="" style={{ ...optStyle }}>{t(siteCountry, "brandAll")}</option>
                {brands.map((b) => (
                  <option key={b} value={b} style={{ ...optStyle }}>{b}</option>
                ))}
                <option value={OTHER} style={{ ...optStyle }}>{otherText}</option>
              </select>

              {brand === OTHER ? (
                <input
                  value={brandOther}
                  onChange={(e) => setBrandOther(e.target.value)}
                  placeholder={t(siteCountry, "enterBrand")}
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                />
              ) : null}

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={!effectiveBrand}
                className={cls(
                  "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                  effectiveBrand ? "border-white/12 bg-white/5 text-white" : "border-white/10 bg-white/3 text-white/40"
                )}
              >
                <option value="" style={{ ...optStyle }}>{effectiveBrand ? t(siteCountry, "modelAll") : t(siteCountry, "modelFirstBrand")}</option>
                {models.map((m) => (
                  <option key={m} value={m} style={{ ...optStyle }}>{m}</option>
                ))}
                {effectiveBrand ? <option value={OTHER} style={{ ...optStyle }}>{otherText}</option> : null}
              </select>

              {model === OTHER ? (
                <input
                  value={modelOther}
                  onChange={(e) => setModelOther(e.target.value)}
                  placeholder={t(siteCountry, "enterModel")}
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                />
              ) : null}

              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t(siteCountry, "city")}
                list="city-suggestions"
                className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
              />
              <datalist id="city-suggestions">
                {cities.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder={t(siteCountry, "priceFrom")}
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                />
                <input
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder={t(siteCountry, "priceTo")}
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                />
              </div>

              {tab === "transportas" ? (
                <>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={yearMin}
                    onChange={(e) => setYearMin(e.target.value)}
                    placeholder={t(siteCountry, "yearFrom")}
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                  <input
                    value={yearMax}
                    onChange={(e) => setYearMax(e.target.value)}
                    placeholder={t(siteCountry, "yearTo")}
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={mileageMin}
                    onChange={(e) => setMileageMin(e.target.value)}
                    placeholder={`${t(siteCountry, "mileageFrom")} (km)`}
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                  <input
                    value={mileageMax}
                    onChange={(e) => setMileageMax(e.target.value)}
                    placeholder={`${t(siteCountry, "mileageTo")} (km)`}
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                </div>

                <select
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="" style={optStyle}>{t(siteCountry, "fuelAll")}</option>
                  {canonicalFuelOptions.map((f) => (
                    <option key={f} value={f} style={optStyle}>{labelFuel(f, siteCountry)}</option>
                  ))}
                </select>

                <select
                  value={drive}
                  onChange={(e) => setDrive(e.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="" style={optStyle}>{t(siteCountry, "driveAll")}</option>
                  {canonicalDriveOptions.map((d) => (
                    <option key={d} value={d} style={optStyle}>{labelDrive(d, siteCountry)}</option>
                  ))}
                </select>


                <select
                  value={gearbox}
                  onChange={(e) => setGearbox(e.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="" style={optStyle}>{t(siteCountry, "gearboxAll")}</option>
                  {canonicalGearboxOptions.map((g) => (
                    <option key={g} value={g} style={optStyle}>{labelGearbox(g, siteCountry)}</option>
                  ))}
                </select>
                </>
              ) : null}

              <div className="mt-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-bold text-white/70">
                {siteCountry === "DK" ? "Fundet" : "Rasta"}: <span className="text-white">{filtered.length}</span>
              </div>

              <Link
                href="/ikelti"
                className="mt-2 inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-black hover:bg-white/90"
              >
                ➕ {t(siteCountry, "uploadListing")}
              </Link>
            </div>
          </aside>
        </section>

        {/* LISTINGS */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-black">{siteCountry === "DK" ? "Annoncer" : "Skelbimai"}</div>
            <div className="text-xs text-white/55">{siteCountry === "DK" ? "Fundet" : "Rasta"}: {filtered.length}</div>
          </div>

          <div className="space-y-4">
            {filtered.slice(0, 18).map((i) => (
              <LocalListingRow
                key={i.id}
                href={tab === "transportas" ? `/transportas/${i.id}` : `/dalys/${i.id}`}
                title={buildTitle(i, tab)}
                subtitle={buildSubtitle(i)}
                price={typeof i.price === "number" ? i.price : null}
                img={i.imageUrls?.[0] || null}
                badge={tab === "transportas" ? (i.category ? categoryLabelLocalized(String(i.category), siteCountry) : null) : t(siteCountry, "parts")}
                country={siteCountry}
              />
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                {siteCountry === "DK" ? "Ingen resultater. Prøv at rydde filtrene eller zoome ind på kortet." : "Nieko nerasta. Pabandyk išvalyti filtrus arba priartinti žemėlapį."}
              </div>
            ) : null}
          </div>
        </section>


        {qText.trim().length >= 2 ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Iš kitų portalų</h2>
                <div className="text-xs font-extrabold text-white/55">Autoplius, Autogidas, Autobilis, Autosel, Autobonus</div>
              </div>
              {externalLoading ? <div className="text-xs font-extrabold text-orange-200">Ieškoma…</div> : null}
            </div>

            {externalItems.length ? (
              <div className="space-y-4">
                {externalItems.map((item) => (
                  <ExternalListingCard key={item.id} item={item} />
                ))}
              </div>
            ) : !externalLoading ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm font-extrabold text-white/60">
                Išorinių rezultatų nerasta pagal dabartinę užklausą.
              </div>
            ) : null}
          </section>
        ) : null}
      </main>

    </>
  );
}
