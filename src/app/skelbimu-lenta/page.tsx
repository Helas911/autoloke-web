"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { brandsForCategory, modelsForBrand, type BrandCategory } from "@/lib/brands_models";
import { citySuggestions, getSiteCountry, normalizeItemCountry } from "@/lib/site";

const inputClass = "w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 disabled:opacity-45";
const OTHER = "__other__";

const categories = ["Perku automobilį", "Ieškau detalių", "Ardomi automobiliai", "Superku automobilius", "Ieškau motociklo", "Perku techniką", "Kita"];
const cards = [
  { title: "Perku automobilį", icon: "🔎", text: "Įdėk skelbimą, kokio automobilio ieškai", color: "border-blue-400/25 bg-blue-500/10" },
  { title: "Ieškau detalių", icon: "🛠", text: "Rask reikiamas dalis pagal markę ir modelį", color: "border-yellow-400/25 bg-yellow-500/10" },
  { title: "Ardomi automobiliai", icon: "♻️", text: "Įdėk ardomą automobilį, kad žmonės rastų dalis", color: "border-red-400/25 bg-red-500/10" },
  { title: "Superku automobilius", icon: "💰", text: "Supirkimo skelbimai visoms markėms", color: "border-green-400/25 bg-green-500/10" },
];

const categoryDk: Record<string, string> = {
  "Perku automobilį": "Jeg søger en bil",
  "Ieškau detalių": "Jeg søger reservedele",
  "Ardomi automobiliai": "Biler til ophugning",
  "Superku automobilius": "Jeg køber biler",
  "Ieškau motociklo": "Jeg søger en motorcykel",
  "Perku techniką": "Jeg søger maskiner",
  "Kita": "Andet",
};

function categoryLabel(value: string, isDk: boolean) {
  return isDk ? categoryDk[value] || value : value;
}

type Item = {
  id: string;
  category?: string;
  brand?: string;
  model?: string;
  title?: string;
  city?: string;
  phone?: string;
  description?: string;
  imageUrl?: string;
  country?: string;
};

function brandCategoryForRequest(category: string): BrandCategory {
  if (category === "Ieškau motociklo") return "motociklai";
  if (category === "Perku techniką") return "zu_technika";
  return "automobiliai";
}

function badge(category: string | undefined, isDk: boolean) {
  if (category === "Perku automobilį") return isDk ? "🔎 Søger bil" : "🔎 Perka";
  if (category === "Ieškau detalių") return isDk ? "🛠 Søger reservedele" : "🛠 Ieško detalių";
  if (category === "Ardomi automobiliai") return isDk ? "♻️ Til ophugning" : "♻️ Ardo";
  if (category === "Superku automobilius") return isDk ? "💰 Køber biler" : "💰 Superka";
  return isDk ? "📌 Annonce" : "📌 Skelbimas";
}

function title(item: Item, isDk: boolean) {
  const text = [item.brand, item.model, item.title].filter(Boolean).join(" ").trim();
  if (item.category === "Superku automobilius") return item.title || (isDk ? "Køber biler af alle mærker" : "Superku visų markių automobilius");
  if (item.category === "Ardomi automobiliai") return isDk ? `Til ophugning: ${text || "bil"}` : `Ardomas ${text || "automobilis"}`;
  if (item.category === "Perku automobilį") return isDk ? `Søger: ${text || "bil"}` : `Perku ${text || "automobilį"}`;
  if (item.category === "Ieškau detalių") return isDk ? `Søger: ${text || "reservedele"}` : `Ieškau ${text || "detalių"}`;
  return text || (item.category ? categoryLabel(item.category, isDk) : "") || (isDk ? "Annonce" : "Skelbimas");
}

function errorText(error: unknown, isDk: boolean) {
  const code = typeof error === "object" && error && "code" in error ? String((error as any).code) : "";
  if (code === "permission-denied") return isDk ? "Annoncen kunne ikke oprettes: Firebase-reglerne skal tillade samlingen partRequests." : "Nepavyko įdėti: Firebase taisyklėse reikia leisti kolekciją partRequests.";
  if (!db) return isDk ? "Annoncen kunne ikke oprettes: Firebase er ikke tilsluttet." : "Nepavyko įdėti: Firebase neprijungtas.";
  return isDk ? "Annoncen kunne ikke oprettes. Prøv igen." : "Nepavyko įdėti skelbimo. Pabandyk dar kartą.";
}

export default function Page() {
  const siteCountry = getSiteCountry();
  const isDk = siteCountry === "DK";
  const cities = citySuggestions(siteCountry);
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("Ieškau detalių");
  const [brand, setBrand] = useState("");
  const [brandOther, setBrandOther] = useState("");
  const [model, setModel] = useState("");
  const [modelOther, setModelOther] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const brandCat = useMemo(() => brandCategoryForRequest(category), [category]);
  const brands = useMemo(() => brandsForCategory(brandCat), [brandCat]);
  const effectiveBrand = brand === OTHER ? brandOther : brand;
  const effectiveModel = model === OTHER ? modelOther : model;
  const models = useMemo(() => modelsForBrand(brandCat, effectiveBrand), [brandCat, effectiveBrand]);

  useEffect(() => {
    setBrand("");
    setBrandOther("");
    setModel("");
    setModelOther("");
  }, [brandCat]);

  useEffect(() => {
    if (brand !== OTHER) setBrandOther("");
    if (model !== OTHER) setModelOther("");
    if (model && model !== OTHER && models.length && !models.includes(model)) setModel("");
  }, [brand, model, models]);

  useEffect(() => {
    if (!db) return;
    const qRef = query(collection(db, "partRequests"), orderBy("createdAt", "desc"));
    return onSnapshot(qRef, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return items.filter((i) => {
      if (normalizeItemCountry(i.country) !== siteCountry) return false;
      const hay = `${i.category || ""} ${i.brand || ""} ${i.model || ""} ${i.title || ""} ${i.city || ""} ${i.description || ""}`.toLowerCase();
      if (filter && i.category !== filter) return false;
      if (s && !hay.includes(s)) return false;
      return true;
    });
  }, [items, filter, search, siteCountry]);

  function choose(c: string) {
    setCategory(c);
    setFilter(c);
    setTimeout(() => document.getElementById("skelbimo-forma")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!user) return setMessage(isDk ? "Du skal logge ind for at oprette en annonce." : "Norint įdėti skelbimą, reikia prisijungti.");
    if (!db) return setMessage(isDk ? "Firebase er ikke tilsluttet." : "Firebase neprijungtas.");
    if (!phone.trim()) return setMessage(isDk ? "Indtast et telefonnummer." : "Įrašyk telefono numerį.");
    if (category !== "Superku automobilius" && !adTitle.trim()) return setMessage(isDk ? "Indtast annonceteksten." : "Įrašyk skelbimo tekstą.");

    try {
      setSaving(true);
      await addDoc(collection(db, "partRequests"), {
        category,
        brand: effectiveBrand.trim() || (category === "Superku automobilius" ? "Visos markės" : ""),
        model: effectiveModel.trim(),
        title: adTitle.trim() || "Superku visų markių automobilius",
        city: city.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        ownerUid: user.uid,
        country: siteCountry,
        createdAt: serverTimestamp(),
      });
      setBrand(""); setBrandOther(""); setModel(""); setModelOther(""); setAdTitle(""); setCity(""); setPhone(""); setImageUrl(""); setDescription("");
      setMessage(isDk ? "Annoncen er oprettet." : "Skelbimas įdėtas.");
    } catch (err) {
      setMessage(errorText(err, isDk));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 text-white">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <div className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">📌 {isDk ? "Opslagstavle" : "Skelbimų lenta"}</div>
        <h1 className="mt-4 text-3xl font-black sm:text-5xl">{isDk ? "Hvad vil du finde eller købe?" : "Ką norite rasti arba pirkti?"}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65 sm:text-base">{isDk ? "Opret søgeannoncer for biler, reservedele, biler til ophugning og bilopkøb." : "Čia dėkite pirkimo, dalių paieškos, ardomų automobilių ir supirkimo skelbimus."}</p>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <button key={c.title} type="button" onClick={() => choose(c.title)} className={`rounded-3xl border p-5 text-left transition ${c.color}`}>
            <div className="mb-2 text-3xl">{c.icon}</div>
            <div className="text-lg font-black">{categoryLabel(c.title, isDk)}</div>
            <div className="mt-1 text-sm font-semibold text-white/55">{isDk ? ({
              "Perku automobilį": "Beskriv den bil, du søger",
              "Ieškau detalių": "Find reservedele efter mærke og model",
              "Ardomi automobiliai": "Opret en bil til ophugning, så andre kan finde dele",
              "Superku automobilius": "Bilopkøb for alle mærker",
            } as Record<string, string>)[c.title] : c.text}</div>
          </button>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
        <form id="skelbimo-forma" onSubmit={submit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="mb-1 text-xl font-black">{isDk ? "Opret opslag" : "Įdėti skelbimą į lentą"}</h2>
          <p className="mb-4 text-sm font-semibold text-white/55">{isDk ? "Bilsøgning, reservedele, biler til ophugning og bilopkøb." : "Pirkimas, dalių paieška, ardomi automobiliai ir supirkimas."}</p>
          {!loading && !user ? <div className="mb-4 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-50">{isDk ? "Du skal logge ind for at oprette en annonce." : "Norint įdėti skelbimą, reikia prisijungti."} <Link href="/prisijungti" className="underline">{isDk ? "Log ind" : "Prisijungti"}</Link></div> : null}
          <div className="grid gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>{categories.map((c) => <option key={c} value={c} className="bg-black">{categoryLabel(c, isDk)}</option>)}</select>
            <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); }} className={inputClass}>
              <option value="" className="bg-black">{isDk ? "Mærke" : "Markė"}</option>
              {brands.map((b) => <option key={b} value={b} className="bg-black">{b}</option>)}
              <option value={OTHER} className="bg-black">{isDk ? "Andet" : "Kita"}</option>
            </select>
            {brand === OTHER ? <input value={brandOther} onChange={(e) => setBrandOther(e.target.value)} placeholder={isDk ? "Skriv mærke" : "Įrašyk markę"} className={inputClass} /> : null}
            <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!effectiveBrand} className={inputClass}>
              <option value="" className="bg-black">{effectiveBrand ? (isDk ? "Model" : "Modelis") : (isDk ? "Vælg først mærke" : "Pirma pasirink markę")}</option>
              {models.map((m) => <option key={m} value={m} className="bg-black">{m}</option>)}
              {effectiveBrand ? <option value={OTHER} className="bg-black">{isDk ? "Anden model" : "Kitas modelis"}</option> : null}
            </select>
            {model === OTHER ? <input value={modelOther} onChange={(e) => setModelOther(e.target.value)} placeholder={isDk ? "Skriv model" : "Įrašyk modelį"} className={inputClass} /> : null}
            <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder={isDk ? "Fx BMW E60 fælge eller køber biler" : "Pvz. BMW E60 ratlankiai arba superku auto"} className={inputClass} />
            <input value={city} onChange={(e) => setCity(e.target.value)} list="request-cities" placeholder={isDk ? "By" : "Miestas"} className={inputClass} />
            <datalist id="request-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={isDk ? "Telefon" : "Telefonas"} inputMode="tel" className={inputClass} />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={isDk ? "Billede-URL, valgfrit" : "Nuotraukos URL, nebūtina"} className={inputClass} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isDk ? "Beskrivelse" : "Aprašymas"} rows={4} className={inputClass} />
            {message ? <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold text-white/75">{message}</div> : null}
            <button disabled={saving || !user} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-45">{saving ? (isDk ? "Opretter..." : "Dedama...") : (isDk ? "➕ Opret annonce" : "➕ Įdėti skelbimą")}</button>
          </div>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-xl font-black">{isDk ? "Opslagstavle" : "Skelbimų lenta"}</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">{isDk ? "Fundet" : "Rasta"}: {filtered.length}</p>
          <div className="my-4 grid gap-2 sm:grid-cols-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isDk ? "Søg" : "Paieška"} className={inputClass} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputClass}><option value="" className="bg-black">{isDk ? "Alle kategorier" : "Visos kategorijos"}</option>{categories.map((c) => <option key={c} value={c} className="bg-black">{categoryLabel(c, isDk)}</option>)}</select>
          </div>
          <div className="space-y-3">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/25">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-44 w-full object-cover" /> : null}
                <div className="p-4">
                  <div className="mb-2 inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">{badge(item.category, isDk)}</div>
                  <h3 className="text-lg font-black">{title(item, isDk)}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/55">{item.city || (isDk ? "By ikke angivet" : "Miestas nenurodytas")}</p>
                  {item.description ? <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p> : null}
                  {item.phone ? <a href={`tel:${item.phone}`} className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-black">{isDk ? "Ring" : "Skambinti"}</a> : null}
                </div>
              </article>
            ))}
            {filtered.length === 0 ? <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-sm font-semibold text-white/60">{isDk ? "Der er endnu ingen annoncer, der matcher søgningen." : "Kol kas nėra skelbimų pagal šią paiešką."}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
