"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalListingCard } from "@/components/ExternalListingCard";
import type { ExternalListing } from "@/lib/externalAggregator";
import { db } from "@/lib/firebase";
import { formatPrice } from "@/lib/format";
import { getSiteCountry, normalizeItemCountry, type SiteCountry } from "@/lib/site";
import { canonicalDriveOptions, canonicalFuelOptions, canonicalGearboxOptions, labelDrive, labelFuel, labelGearbox, t } from "@/lib/i18n";

type Ad = {
  id: string;
  title?: string;
  brand?: string;
  model?: string;
  city?: string;
  price?: number;
  mileage?: number;
  fuel?: string;
  drive?: string;
  gearbox?: string;
  engineCapacity?: number;
  powerKw?: number;
  imageUrls?: string[];
  category?: string;
  type?: string;
  country?: string;
  year?: number | string;
  body?: string;
};

function localTitle(a: Ad) {
  const title = `${(a.brand ?? "").toString()} ${(a.model ?? "").toString()}`.trim();
  return title || (a.title ?? "Skelbimas");
}

function localDetail(a: Ad) {
  const bits = [
    a.fuel ? labelFuel(a.fuel, "LT") : "",
    a.year ? String(a.year) : "",
    a.gearbox ? labelGearbox(a.gearbox, "LT") : "",
    typeof a.powerKw === "number" ? `${a.powerKw} kW` : "",
    typeof a.mileage === "number" ? `${a.mileage.toLocaleString("lt-LT")} km` : "",
    a.body || a.type || "",
    a.city || "",
  ].filter(Boolean);
  return bits.join(" | ");
}

export default function TransportasPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [siteCountry, setSiteCountry] = useState<SiteCountry>("LT");
  const [qText, setQText] = useState("");
  const [mileageMin, setMileageMin] = useState("");
  const [mileageMax, setMileageMax] = useState("");
  const [fuel, setFuel] = useState("");
  const [drive, setDrive] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [engineFrom, setEngineFrom] = useState("");
  const [engineTo, setEngineTo] = useState("");
  const [powerFrom, setPowerFrom] = useState("");
  const [powerTo, setPowerTo] = useState("");
  const [externalItems, setExternalItems] = useState<ExternalListing[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [searchTick, setSearchTick] = useState(0);

  useEffect(() => {
    setSiteCountry(getSiteCountry());
    const col = collection(db, "ads");
    const q = query(col, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (searchTick === 0) return;

    const queryText = qText.trim();
    if (queryText.length < 2) {
      setExternalItems([]);
      setExternalLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setExternalLoading(true);
        const params = new URLSearchParams({
          q: queryText,
          section: "transportas",
          category: "automobiliai",
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
    })();

    return () => controller.abort();
  }, [searchTick, qText]);

  const filtered = useMemo(() => {
    const q = qText.trim().toLowerCase();
    const miMin = Number(mileageMin || 0) || 0;
    const miMax = Number(mileageMax || 99999999) || 99999999;
    const enMin = Number(engineFrom.replace(",", ".") || 0) || 0;
    const enMax = Number(engineTo.replace(",", ".") || 99) || 99;
    const pwMin = Number(powerFrom || 0) || 0;
    const pwMax = Number(powerTo || 99999999) || 99999999;

    return items.filter((a) => {
      if (normalizeItemCountry(a.country) !== siteCountry) return false;
      const s = `${a.title ?? ""} ${a.brand ?? ""} ${a.model ?? ""} ${a.city ?? ""} ${a.category ?? ""} ${a.type ?? ""}`.toLowerCase();
      if (q && !s.includes(q)) return false;
      if (fuel && a.fuel !== fuel) return false;
      if (drive && a.drive !== drive) return false;
      if (gearbox && a.gearbox !== gearbox) return false;
      if (mileageMin && (typeof a.mileage !== "number" || a.mileage < miMin)) return false;
      if (mileageMax && (typeof a.mileage !== "number" || a.mileage > miMax)) return false;
      if (engineFrom && (typeof a.engineCapacity !== "number" || a.engineCapacity < enMin)) return false;
      if (engineTo && (typeof a.engineCapacity !== "number" || a.engineCapacity > enMax)) return false;
      if (powerFrom && (typeof a.powerKw !== "number" || a.powerKw < pwMin)) return false;
      if (powerTo && (typeof a.powerKw !== "number" || a.powerKw > pwMax)) return false;
      return true;
    });
  }, [items, qText, mileageMin, mileageMax, fuel, drive, gearbox, engineFrom, engineTo, powerFrom, powerTo, siteCountry]);

  const clearFilters = () => {
    setQText("");
    setMileageMin("");
    setMileageMax("");
    setFuel("");
    setDrive("");
    setGearbox("");
    setEngineFrom("");
    setEngineTo("");
    setPowerFrom("");
    setPowerTo("");
    setExternalItems([]);
    setExternalLoading(false);
    setSearchTick(0);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">{t(siteCountry, "transport")}</h1>
          <div className="mt-1 text-sm font-extrabold text-white/60">{t(siteCountry, "firestoreAds")}: <b>ads</b></div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link href="/" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">{t(siteCountry, "home")}</Link>
          <Link href="/transportas/map" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">{t(siteCountry, "map")}</Link>
          <Link href="/ikelti" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-black hover:bg-white/90">➕ {t(siteCountry, "upload")}</Link>
          <Link href="/dalys" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]">{t(siteCountry, "parts")}</Link>
        </nav>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-6 sm:items-end">
        <div className="sm:col-span-2">
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder={t(siteCountry, "searchVehiclePlaceholder")}
            className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40"
          />
        </div>
        <div className="sm:col-span-1">
          <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none">
            <option value="" style={{ background: "#0b0b10", color: "rgba(255,255,255,0.95)" }}>{t(siteCountry, "fuelAll")}</option>
            {canonicalFuelOptions.map((f) => (
              <option key={f} value={f} style={{ background: "#0b0b10", color: "rgba(255,255,255,0.95)" }}>{labelFuel(f, siteCountry)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <select value={drive} onChange={(e) => setDrive(e.target.value)} className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none">
            <option value="" style={{ background: "#0b0b10", color: "rgba(255,255,255,0.95)" }}>{t(siteCountry, "driveAll")}</option>
            {canonicalDriveOptions.map((d) => (
              <option key={d} value={d} style={{ background: "#0b0b10", color: "rgba(255,255,255,0.95)" }}>{labelDrive(d, siteCountry)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <select value={gearbox} onChange={(e) => setGearbox(e.target.value)} className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none">
            <option value="" style={{ background: "#0b0b10", color: "rgba(255,255,255,0.95)" }}>{t(siteCountry, "gearboxAll")}</option>
            {canonicalGearboxOptions.map((g) => (
              <option key={g} value={g} style={{ background: "#0b0b10", color: "rgba(255,255,255,0.95)" }}>{labelGearbox(g, siteCountry)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1 grid grid-cols-2 gap-2">
          <input value={mileageMin} onChange={(e) => setMileageMin(e.target.value)} placeholder={t(siteCountry, "mileageFrom")} inputMode="numeric" className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40" />
          <input value={mileageMax} onChange={(e) => setMileageMax(e.target.value)} placeholder={t(siteCountry, "mileageTo")} inputMode="numeric" className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40" />
        </div>
        <div className="sm:col-span-1 grid grid-cols-2 gap-2">
          <input value={engineFrom} onChange={(e) => setEngineFrom(e.target.value)} placeholder={`${t(siteCountry, "engineCapacity")} ${siteCountry === "DK" ? "fra" : "nuo"}`} inputMode="decimal" className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40" />
          <input value={engineTo} onChange={(e) => setEngineTo(e.target.value)} placeholder={`${t(siteCountry, "engineCapacity")} ${siteCountry === "DK" ? "til" : "iki"}`} inputMode="decimal" className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40" />
        </div>
        <div className="sm:col-span-1 grid grid-cols-2 gap-2">
          <input value={powerFrom} onChange={(e) => setPowerFrom(e.target.value)} placeholder={`kW ${siteCountry === "DK" ? "fra" : "nuo"}`} inputMode="numeric" className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40" />
          <input value={powerTo} onChange={(e) => setPowerTo(e.target.value)} placeholder={`kW ${siteCountry === "DK" ? "til" : "iki"}`} inputMode="numeric" className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 outline-none placeholder:text-white/40" />
        </div>

        <div className="sm:col-span-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchTick((v) => v + 1)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-500"
          >
            🔍 Ieškoti
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
          >
            ✕ Išvalyti
          </button>
          <div className="ml-auto text-xs font-extrabold text-white/55">{filtered.length} {t(siteCountry, "adsCount")}</div>
        </div>
      </div>

      <section className="mt-5 space-y-4">
        {filtered.map((a) => (
          <Link key={a.id} href={`/transportas/${a.id}`} className="block overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.05]">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-[38%]">
                <div className="h-[220px] w-full bg-white/5 md:h-full">
                  {a.imageUrls?.[0] ? (
                    <img src={a.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-extrabold text-white/40">{t(siteCountry, "noPhoto")}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-[28px] font-black leading-tight text-white md:text-[34px]">
                      {localTitle(a)}
                    </h3>
                    <div className="text-[32px] leading-none text-white/45">♡</div>
                  </div>

                  <p className="text-[16px] leading-[1.35] text-white/65 md:text-[20px]">
                    {localDetail(a) || "—"}
                  </p>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="inline-flex rounded-[18px] bg-white px-5 py-3 text-[24px] font-black leading-none text-black md:text-[28px]">
                    {typeof a.price === "number" ? formatPrice(a.price, siteCountry) : t(siteCountry, "priceNotSpecified")}
                  </div>

                  <div className="text-right text-sm font-semibold text-white/55">
                    Autoloke
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
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
  );
}
