"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload";

const BRANDS = [
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Volkswagen",
  "Toyota",
  "Volvo",
  "Škoda",
  "Opel",
  "Ford",
  "Nissan",
  "Kia",
  "Hyundai",
  "Renault",
  "Peugeot",
  "Kita / Andet",
];

type Locale = "lt" | "dk";

const TEXT = {
  lt: {
    badge: "Facebook srautui pritaikytas ultra greitas įkėlimas",
    title: "Nori parduoti auto?",
    subtitle: "Įkelk skelbimą kuo paprasčiau: nuotraukos, kaina ir telefonas. Visa kita galėsi papildyti vėliau.",
    step1: "Pridėk nuotraukas",
    step2: "Įrašyk kainą",
    step3: "Palik telefoną",
    progress: "Užpildymas",
    required: "Svarbiausia: nuotraukos, kaina, telefonas.",
    photos: "Nuotraukos *",
    price: "Kaina € *",
    pricePlaceholder: "Pvz. 6500",
    phone: "Telefonas *",
    phonePlaceholder: "Pvz. +37061234567",
    brand: "Markė",
    later: "Pasirinkti vėliau",
    city: "Miestas",
    cityPlaceholder: "Pvz. Kaunas",
    comment: "Trumpas komentaras",
    commentPlaceholder: "Pvz. Tvarkingas automobilis, važiuojantis, daugiau info telefonu.",
    submit: "PASKELBTI DABAR",
    loading: "Keliama...",
    done: "Skelbimas įkeltas sėkmingai.",
    footer: "Be registracijos. Vėliau galėsi papildyti daugiau informacijos.",
    firebaseError: "Firebase neprijungtas. Patikrink .env ir firebase konfigūraciją.",
    validationError: "Pridėk bent nuotrauką, kainą ir telefono numerį.",
    unknownError: "Nepavyko įkelti skelbimo.",
    defaultBrand: "Nenurodyta",
    defaultCity: "Nenurodyta",
    defaultTitle: "Parduodamas automobilis",
    defaultDescription: "Įkelta per ultra greitą Autoloke formą.",
    sourceLabel: "Autoloke LT greitas įkėlimas",
    currency: "EUR",
    country: "LT",
  },
  dk: {
    badge: "Ultra hurtig annonceoprettelse til Facebook-trafik",
    title: "Vil du sælge din bil?",
    subtitle: "Opret annoncen så nemt som muligt: billeder, pris og telefon. Resten kan du tilføje senere.",
    step1: "Tilføj billeder",
    step2: "Skriv pris",
    step3: "Skriv telefon",
    progress: "Udfyldt",
    required: "Det vigtigste: billeder, pris og telefon.",
    photos: "Billeder *",
    price: "Pris kr. *",
    pricePlaceholder: "F.eks. 45000",
    phone: "Telefon *",
    phonePlaceholder: "F.eks. +4512345678",
    brand: "Mærke",
    later: "Vælg senere",
    city: "By",
    cityPlaceholder: "F.eks. København",
    comment: "Kort kommentar",
    commentPlaceholder: "F.eks. Pæn bil, kører godt, mere info på telefon.",
    submit: "OPRET ANNONCE NU",
    loading: "Opretter...",
    done: "Annoncen er oprettet.",
    footer: "Uden registrering. Du kan tilføje flere oplysninger senere.",
    firebaseError: "Firebase er ikke tilsluttet. Tjek .env og Firebase-konfigurationen.",
    validationError: "Tilføj mindst ét billede, pris og telefonnummer.",
    unknownError: "Kunne ikke oprette annoncen.",
    defaultBrand: "Ikke angivet",
    defaultCity: "Ikke angivet",
    defaultTitle: "Bil til salg",
    defaultDescription: "Oprettet via Autoloke ultra hurtig formular.",
    sourceLabel: "Autoloke DK hurtig oprettelse",
    currency: "DKK",
    country: "DK",
  },
} as const;

function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "").slice(0, 20);
}

function detectLocale(fallback: Locale): Locale {
  if (typeof window === "undefined") return fallback;
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (host.endsWith(".dk") || path.includes("/saelg") || path.includes("/opret-annonce")) return "dk";
  return "lt";
}

export default function QuickUploadPage({ initialLocale = "lt" as Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [brand, setBrand] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocale(detectLocale(initialLocale));
  }, [initialLocale]);

  const t = TEXT[locale];

  const canSubmit = useMemo(() => photos.length > 0 && price.trim().length > 0 && phone.trim().length > 0, [photos, price, phone]);

  const progress = useMemo(() => {
    let value = 0;
    if (photos.length > 0) value += 40;
    if (price.trim()) value += 30;
    if (phone.trim()) value += 30;
    return value;
  }, [photos.length, price, phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db) {
      setError(t.firebaseError);
      return;
    }
    if (!canSubmit) {
      setError(t.validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setDoneId(null);

      const tempId = `${t.country.toLowerCase()}_quick_${Date.now()}`;
      const imageUrls = await Promise.all(
        photos.map((file, i) => uploadImage({ path: `ads/${t.country}/quick/${tempId}/${i}-${file.name}`, file }))
      );

      const numericPrice = Number(String(price).replace(/[^\d]/g, "")) || 0;
      const finalBrand = brand || t.defaultBrand;

      const docRef = await addDoc(collection(db, "ads"), {
        category: "automobiliai",
        type: "Greitas įkėlimas",
        brand: finalBrand,
        title: brand ? `${brand} ${locale === "dk" ? "til salg" : "parduodamas"}` : t.defaultTitle,
        description: description.trim() || t.defaultDescription,
        price: numericPrice,
        currency: t.currency,
        country: t.country,
        locale,
        city: city.trim() || t.defaultCity,
        phone: normalizePhone(phone),
        imageUrls,
        source: "quick_upload",
        sourceLabel: t.sourceLabel,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setDoneId(docRef.id);
      setBrand("");
      setCity("");
      setPrice("");
      setPhone("");
      setPhotos([]);
      setDescription("");
    } catch (err: any) {
      setError(err?.message || t.unknownError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#111827] to-[#05070d] p-5 shadow-2xl">
          <div className="mb-4 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
            {t.badge}
          </div>
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-white/75 sm:text-base">{t.subtitle}</p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl">📷</div>
              <div className="mt-2 text-sm font-semibold">{t.step1}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl">💶</div>
              <div className="mt-2 text-sm font-semibold">{t.step2}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl">📞</div>
              <div className="mt-2 text-sm font-semibold">{t.step3}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-neutral-900 p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between text-sm text-white/70">
            <span>{t.progress}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/55">{t.required}</p>
        </section>

        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-neutral-900 p-4 shadow-xl">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">{t.photos}</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              className="block w-full rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:font-semibold file:text-black"
            />
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">{t.price}</label>
              <input
                inputMode="numeric"
                placeholder={t.pricePlaceholder}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none ring-0 placeholder:text-white/30 focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">{t.phone}</label>
              <input
                inputMode="tel"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(normalizePhone(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none ring-0 placeholder:text-white/30 focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">{t.brand}</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-4 text-base outline-none focus:border-yellow-400"
              >
                <option value="">{t.later}</option>
                {BRANDS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">{t.city}</label>
              <input
                placeholder={t.cityPlaceholder}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none placeholder:text-white/30 focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">{t.comment}</label>
            <textarea
              rows={4}
              placeholder={t.commentPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none placeholder:text-white/30 focus:border-yellow-400"
            />
          </div>

          {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          {doneId && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
              {t.done} ID: <span className="font-bold">{doneId}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full rounded-2xl bg-yellow-400 px-5 py-4 text-lg font-black text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t.loading : t.submit}
          </button>

          <p className="text-center text-xs text-white/45">{t.footer}</p>
        </form>
      </div>
    </main>
  );
}
