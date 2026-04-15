"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalListingCard } from "@/components/ExternalListingCard";
import LocalListingRow from "@/components/LocalListingRow";
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
};

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
  const [externalOnlyWithPhotos, setExternalOnlyWithPhotos] = useState(false);
  const [searchNonce, setSearchNonce] = useState(0);

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
    const queryText = qText.trim();
    if (searchNonce === 0 || queryText.length < 2) {
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
    }, 150);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [qText, searchNonce]);

  const shownExternalItems = useMemo(() => {
    if (!externalOnlyWithPhotos) return externalItems;
    return externalItems.filter((item) => !!item.imageUrl);
  }, [externalItems, externalOnlyWithPhotos]);

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
        <div className="text-xs font-extrabold text-white/55 sm:text-right">{filtered.length} {t(siteCountry, "adsCount")}</div>
      </div>

      <section className="mt-5 space-y-4">
        {filtered.map((a) => (
          <LocalListingRow
            key={a.id}
            href={`/transportas/${a.id}`}
            title={`${(a.brand ?? "").toString()} ${(a.model ?? "").toString()}`.trim() || "Skelbimas"}
            subtitle={[
              (a.city ?? "").toString() || "—",
              typeof a.mileage === "number" ? `${a.mileage} km` : "",
              a.fuel ?? "",
              a.gearbox ?? "",
              typeof a.engineCapacity === "number" ? `${a.engineCapacity} l` : "",
              typeof a.powerKw === "number" ? `${a.powerKw} kW` : "",
            ].filter(Boolean).join(" • ")}
            price={typeof a.price === "number" ? a.price : null}
            img={a.imageUrls?.[0] || null}
            badge={(a.category ?? a.type ?? "Auto").toString()}
            country={siteCountry}
          />
        ))}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            {siteCountry === "DK" ? "Ingen resultater. Prøv at rydde filtrene eller zoome ind på kortet." : "Nieko nerasta. Pabandyk išvalyti filtrus arba priartinti žemėlapį."}
          </div>
        ) : null}
      </section>

      {searchNonce > 0 ? (
        <section className="mt-8">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Iš kitų portalų</h2>
              <div className="text-xs font-extrabold text-white/55">Autoplius, Autogidas, Autobilis, Autosel, Autobonus</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setExternalOnlyWithPhotos((v) => !v)}
                className={externalOnlyWithPhotos
                  ? "rounded-full border border-white bg-white px-3 py-2 text-xs font-black text-black transition"
                  : "rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/80 transition hover:bg-white/[0.08]"}
              >
                {externalOnlyWithPhotos ? "✓ " : ""}Rodyti tik su nuotraukomis
              </button>
              <div className="text-xs font-extrabold text-white/55">Rasta: {shownExternalItems.length}</div>
              {externalLoading ? <div className="text-xs font-extrabold text-orange-200">Ieškoma…</div> : null}
            </div>
          </div>

          {shownExternalItems.length ? (
            <div className="space-y-5">
              {shownExternalItems.map((item) => (
                <ExternalListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : !externalLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm font-extrabold text-white/60">
              {externalOnlyWithPhotos ? "Nerasta išorinių rezultatų su nuotraukomis." : "Išorinių rezultatų nerasta pagal dabartinę užklausą."}
            </div>
          ) : null}
        </section>
      ) : null}

    </main>
  );
}
