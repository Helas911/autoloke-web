"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { uploadImage } from "@/lib/upload";
import { cls } from "@/lib/format";
import { createPendingListingPaymentFields, LISTING_ACTIVE_DAYS, LISTING_PRICE_EUR } from "@/lib/billing";
import { startListingPayment } from "@/lib/paymentClient";
import { VEHICLE_CATEGORIES, VEHICLE_TYPES, type VehicleCategory } from "@/lib/categories";
import { citySuggestions, getSiteCountry, getSiteCurrency, type SiteCountry } from "@/lib/site";
import { categoryLabelLocalized, canonicalDriveOptions, canonicalFuelOptions, canonicalGearboxOptions, labelDrive, labelFuel, labelGearbox, otherLabel, t } from "@/lib/i18n";
import { brandsForCategory, modelsForBrand, type BrandCategory } from "@/lib/brands_models";

type Mode = "transportas" | "dalys";

const optStyle: CSSProperties = { background: "#0b0b10", color: "rgba(255,255,255,0.95)" };
const OTHER = "__other__";

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

export default function IkeltiPage() {
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("transportas");
  const [siteCountry, setSiteCountry] = useState<SiteCountry>("LT");

  const [category, setCategory] = useState<VehicleCategory>("automobiliai");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [brandOther, setBrandOther] = useState("");
  const [model, setModel] = useState("");
  const [modelOther, setModelOther] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("");
  const [drive, setDrive] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [engineCapacity, setEngineCapacity] = useState("");
  const [powerKw, setPowerKw] = useState("");

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    setSiteCountry(getSiteCountry());
  }, []);

  const brandCat = toBrandCategory(category);
  const brands = useMemo(() => brandsForCategory(brandCat), [brandCat]);
  const effectiveBrand = brand === OTHER ? brandOther : brand;
  const effectiveModel = model === OTHER ? modelOther : model;
  const models = useMemo(() => modelsForBrand(brandCat, effectiveBrand), [brandCat, effectiveBrand]);
  const cities = useMemo(() => citySuggestions(siteCountry), [siteCountry]);
  const otherText = useMemo(() => otherLabel(siteCountry), [siteCountry]);
  const currency = getSiteCurrency(siteCountry);

  useEffect(() => {
    if (brand !== OTHER) setBrandOther("");
    if (model !== OTHER) setModelOther("");
    if (model && model !== OTHER && models.length && !models.includes(model)) setModel("");
  }, [brand, model, models]);

  const canSubmit = useMemo(() => {
    if (!city.trim()) return false;
    if (!price.trim()) return false;
    if (!lat.trim() || !lng.trim()) return false;
    if (files.length === 0) return false;
    if (mode === "transportas") return !!(effectiveBrand.trim() || effectiveModel.trim());
    return !!(title.trim() || effectiveBrand.trim() || effectiveModel.trim());
  }, [city, price, lat, lng, files.length, mode, effectiveBrand, effectiveModel, title]);

  function fillMyLocation() {
    setErr(null);
    if (!navigator.geolocation) {
      setErr("Naršyklė nepalaiko vietos nustatymo.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setErr("Nepavyko gauti vietos. Patikrink Location leidimus."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function uploadPhotos(folder: "ads" | "parts", id: string) {
    const imageUrls: string[] = [];
    const imagePaths: string[] = [];

    for (const f of files) {
      const safeName = (f.name || "foto.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
      const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
      const path = `${folder}/${user!.uid}/${id}/${random}-${safeName}`;
      const url = await uploadImage({ path, file: f });
      imageUrls.push(url);
      imagePaths.push(path);
    }

    return { imageUrls, imagePaths };
  }

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      if (!user) throw new Error("Prisijunk, kad galėtum įkelti skelbimą.");

      const p = Number(price);
      const y = year.trim() ? Number(year) : undefined;
      const mi = mileage.trim() ? Number(mileage) : undefined;
      const ec = engineCapacity.trim() ? Number(engineCapacity.replace(",", ".")) : undefined;
      const pk = powerKw.trim() ? Number(powerKw) : undefined;
      const la = Number(lat);
      const ln = Number(lng);

      if (!Number.isFinite(p)) throw new Error("Kaina turi būti skaičius.");
      if (!Number.isFinite(la) || !Number.isFinite(ln)) throw new Error("Koordinatės turi būti skaičiai.");
      if (year.trim() && !Number.isFinite(y)) throw new Error("Metai turi būti skaičius.");
      if (mileage.trim() && !Number.isFinite(mi)) throw new Error("Rida turi būti skaičius.");
      if (engineCapacity.trim() && !Number.isFinite(ec)) throw new Error("Variklio tūris turi būti skaičius.");
      if (powerKw.trim() && !Number.isFinite(pk)) throw new Error("Galia turi būti skaičius.");

      const finalBrand = effectiveBrand.trim() || undefined;
      const finalModel = effectiveModel.trim() || undefined;
      const paymentFields = createPendingListingPaymentFields();

      if (mode === "transportas") {
        const docRef = await addDoc(collection(db, "ads"), {
          category,
          type: type.trim() || undefined,
          brand: finalBrand,
          model: finalModel,
          year: y,
          price: p,
          mileage: mi,
          fuel: fuel.trim() || undefined,
          drive: drive.trim() || undefined,
          gearbox: gearbox.trim() || undefined,
          engineCapacity: ec,
          powerKw: pk,
          city: city.trim(),
          phone: phone.trim() || undefined,
          description: description.trim() || undefined,
          lat: la,
          lng: ln,
          imageUrls: [],
          imagePaths: [],
          ownerUid: user.uid,
          ownerEmail: user.email ?? undefined,
          country: siteCountry,
          createdAt: serverTimestamp(),
          ...paymentFields,
        });

        const photos = await uploadPhotos("ads", docRef.id);
        await updateDoc(doc(db, "ads", docRef.id), photos);
        setOkMsg("Skelbimas paruoštas. Nukreipiama į apmokėjimą...");
        await startListingPayment({ collectionName: "ads", listingId: docRef.id });
      } else {
        const docRef = await addDoc(collection(db, "parts"), {
          title: title.trim() || undefined,
          brand: finalBrand,
          model: finalModel,
          price: p,
          city: city.trim(),
          phone: phone.trim() || undefined,
          description: description.trim() || undefined,
          lat: la,
          lng: ln,
          imageUrls: [],
          imagePaths: [],
          ownerUid: user.uid,
          ownerEmail: user.email ?? undefined,
          country: siteCountry,
          createdAt: serverTimestamp(),
          ...paymentFields,
        });

        const photos = await uploadPhotos("parts", docRef.id);
        await updateDoc(doc(db, "parts", docRef.id), photos);
        setOkMsg("Skelbimas paruoštas. Nukreipiama į apmokėjimą...");
        await startListingPayment({ collectionName: "parts", listingId: docRef.id });
      }
    } catch (e: any) {
      setErr(e?.message || "Klaida įkeliant.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <main className="p-6 text-white">Kraunama...</main>;

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-2xl font-black">Pirmiausia prisijunk</h1>
          <p className="mt-2 text-sm text-white/65">Tada skelbimas bus priskirtas tavo paskyrai ir galėsi jį redaguoti arba ištrinti.</p>
          <Link href="/prisijungti?next=/ikelti" className="mt-5 block rounded-2xl bg-white px-5 py-3 text-center font-black text-black">
            Prisijungti ir tęsti
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 text-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-black">{t(siteCountry, "uploadListing")}</h1>
          <p className="mt-1 text-sm font-semibold text-white/60">
            Vienas skelbimas kainuoja {LISTING_PRICE_EUR} € ir galioja {LISTING_ACTIVE_DAYS} dienų. Nepratęsus, 31-ą dieną jis ištrinamas automatiškai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("transportas")}
            className={cls("rounded-full border px-4 py-2 text-sm font-extrabold", mode === "transportas" ? "border-white/25 bg-white/12" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10")}
          >
            {t(siteCountry, "transport")}
          </button>
          <button
            type="button"
            onClick={() => setMode("dalys")}
            className={cls("rounded-full border px-4 py-2 text-sm font-extrabold", mode === "dalys" ? "border-white/25 bg-white/12" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10")}
          >
            {t(siteCountry, "parts")}
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-[1fr_380px]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          {mode === "transportas" ? (
            <div className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={category} onChange={(e) => { setCategory(e.target.value as VehicleCategory); setType(""); }} className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                  {VEHICLE_CATEGORIES.map((c) => <option key={c.id} value={c.id} style={optStyle}>{categoryLabelLocalized(c.id, siteCountry)}</option>)}
                </select>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                  <option value="" style={optStyle}>{t(siteCountry, "vehicleTypePick")}</option>
                  {VEHICLE_TYPES[category].map((item) => <option key={item} value={item} style={optStyle}>{item}</option>)}
                </select>
              </div>

              <BrandModelFields
                brands={brands}
                models={models}
                brand={brand}
                model={model}
                brandOther={brandOther}
                modelOther={modelOther}
                otherText={otherText}
                siteCountry={siteCountry}
                setBrand={setBrand}
                setModel={setModel}
                setBrandOther={setBrandOther}
                setModelOther={setModelOther}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`Kaina (${currency})`} inputMode="numeric" className="input-pay" />
                <input value={year} onChange={(e) => setYear(e.target.value)} placeholder={t(siteCountry, "year")} inputMode="numeric" className="input-pay" />
                <input value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder={t(siteCountry, "mileage")} inputMode="numeric" className="input-pay" />
                <select value={gearbox} onChange={(e) => setGearbox(e.target.value)} className="input-pay">
                  <option value="" style={optStyle}>{t(siteCountry, "gearboxPick")}</option>
                  {canonicalGearboxOptions.map((g) => <option key={g} value={g} style={optStyle}>{labelGearbox(g, siteCountry)}</option>)}
                </select>
                <input value={engineCapacity} onChange={(e) => setEngineCapacity(e.target.value)} placeholder={t(siteCountry, "engineCapacity")} inputMode="decimal" className="input-pay" />
                <input value={powerKw} onChange={(e) => setPowerKw(e.target.value)} placeholder={t(siteCountry, "powerKw")} inputMode="numeric" className="input-pay" />
                <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="input-pay">
                  <option value="" style={optStyle}>{t(siteCountry, "fuelPick")}</option>
                  {canonicalFuelOptions.map((f) => <option key={f} value={f} style={optStyle}>{labelFuel(f, siteCountry)}</option>)}
                </select>
                <select value={drive} onChange={(e) => setDrive(e.target.value)} className="input-pay">
                  <option value="" style={optStyle}>{t(siteCountry, "drivePick")}</option>
                  {canonicalDriveOptions.map((d) => <option key={d} value={d} style={optStyle}>{labelDrive(d, siteCountry)}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(siteCountry, "titleParts")} className="input-pay" />
              <BrandModelFields
                brands={brands}
                models={models}
                brand={brand}
                model={model}
                brandOther={brandOther}
                modelOther={modelOther}
                otherText={otherText}
                siteCountry={siteCountry}
                setBrand={setBrand}
                setModel={setModel}
                setBrandOther={setBrandOther}
                setModelOther={setModelOther}
              />
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`Kaina (${currency})`} inputMode="numeric" className="input-pay" />
            </div>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t(siteCountry, "city")} list="city-suggestions" className="input-pay" />
            <datalist id="city-suggestions">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t(siteCountry, "phone")} className="input-pay" />
          </div>

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t(siteCountry, "description")} rows={4} className="mt-2 input-pay" />

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-black">Vieta</div>
              <button type="button" onClick={fillMyLocation} className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/85 hover:bg-white/10">
                📍 Paimti mano vietą
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" inputMode="decimal" className="input-pay" />
              <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" inputMode="decimal" className="input-pay" />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-black">{t(siteCountry, "uploadPhotos")}</div>
              <div className="text-xs text-white/60">Reikia bent vienos nuotraukos</div>
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black hover:bg-white/90">➕ Pasirinkti</button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {files.map((f, idx) => <img key={idx} alt="" src={URL.createObjectURL(f)} className="h-24 w-full rounded-xl object-cover" />)}
          </div>

          <div className="mt-4 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-3 text-sm font-semibold text-yellow-50">
            Paspaudus mygtuką skelbimas bus sukurtas kaip neaktyvus. Po apmokėjimo jis taps aktyvus 30 dienų.
          </div>

          <div className="mt-4 grid gap-2">
            <button type="button" onClick={submit} disabled={!canSubmit || busy} className={cls("w-full rounded-2xl px-4 py-3 text-sm font-black", canSubmit && !busy ? "bg-white text-black hover:bg-white/90" : "bg-white/20 text-white/50")}>
              {busy ? "Keliama..." : `Apmokėti ${LISTING_PRICE_EUR} € ir įkelti`}
            </button>
            <button type="button" onClick={() => { setFiles([]); if (fileRef.current) fileRef.current.value = ""; }} className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-extrabold text-white/85 hover:bg-white/10">
              Išvalyti foto
            </button>
            {err ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{err}</div> : null}
            {okMsg ? <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">{okMsg}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandModelFields(props: {
  brands: string[];
  models: string[];
  brand: string;
  model: string;
  brandOther: string;
  modelOther: string;
  otherText: string;
  siteCountry: SiteCountry;
  setBrand: (value: string) => void;
  setModel: (value: string) => void;
  setBrandOther: (value: string) => void;
  setModelOther: (value: string) => void;
}) {
  const effectiveBrand = props.brand === OTHER ? props.brandOther : props.brand;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <select value={props.brand} onChange={(e) => { props.setBrand(e.target.value); props.setModel(""); }} className="input-pay">
        <option value="" style={optStyle}>{t(props.siteCountry, "brand")}</option>
        {props.brands.map((b) => <option key={b} value={b} style={optStyle}>{b}</option>)}
        <option value={OTHER} style={optStyle}>{props.otherText}</option>
      </select>
      {props.brand === OTHER ? <input value={props.brandOther} onChange={(e) => props.setBrandOther(e.target.value)} placeholder={t(props.siteCountry, "enterBrand")} className="input-pay" /> : null}
      <select value={props.model} onChange={(e) => props.setModel(e.target.value)} disabled={!effectiveBrand} className="input-pay disabled:opacity-45">
        <option value="" style={optStyle}>{effectiveBrand ? "Modelis" : t(props.siteCountry, "modelFirstBrand")}</option>
        {props.models.map((m) => <option key={m} value={m} style={optStyle}>{m}</option>)}
        {effectiveBrand ? <option value={OTHER} style={optStyle}>{props.otherText}</option> : null}
      </select>
      {props.model === OTHER ? <input value={props.modelOther} onChange={(e) => props.setModelOther(e.target.value)} placeholder={t(props.siteCountry, "enterModel")} className="input-pay" /> : null}
    </div>
  );
}
