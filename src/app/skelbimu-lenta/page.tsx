"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { citySuggestions, getSiteCountry, type SiteCountry } from "@/lib/site";

const inputClass = "w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40";

type Cat = "buyCar" | "needParts" | "partsCars" | "buyAllCars" | "needMoto" | "buyMachines" | "other";

const categories: Cat[] = ["buyCar", "needParts", "partsCars", "buyAllCars", "needMoto", "buyMachines", "other"];
const brands = ["Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Volvo", "Toyota", "Opel", "Ford", "Peugeot", "Renault", "Skoda", "Nissan", "Kia", "Hyundai", "Mazda", "Honda", "Citroen", "Fiat", "Seat"];

const labels = {
  LT: {
    board: "📌 Skelbimų lenta",
    hero: "Ką norite rasti arba pirkti?",
    heroText: "Čia dėkite pirkimo, dalių paieškos, ardomų automobilių ir supirkimo skelbimus.",
    formTitle: "Įdėti skelbimą į lentą",
    formText: "Pirkimas, dalių paieška, ardomi automobiliai ir supirkimas.",
    needLogin: "Norint įdėti skelbimą, reikia prisijungti.",
    login: "Prisijungti",
    brand: "Markė",
    allBrands: "Visos markės",
    other: "Kita",
    model: "Modelis arba palik tuščią",
    title: "Pvz. BMW E60 ratlankiai arba superku auto",
    city: "Miestas",
    phone: "Telefonas",
    image: "Nuotraukos URL, nebūtina",
    desc: "Aprašymas",
    save: "➕ Įdėti skelbimą",
    saving: "Dedama...",
    found: "Rasta",
    search: "Paieška",
    allCats: "Visos kategorijos",
    call: "Skambinti",
    del: "🗑 Ištrinti",
    empty: "Kol kas nėra skelbimų pagal šią paiešką.",
    noCity: "Miestas nenurodytas",
    saved: "Skelbimas įdėtas.",
    phoneReq: "Įrašyk telefono numerį.",
    titleReq: "Įrašyk skelbimo tekstą.",
    firebase: "Firebase neprijungtas.",
    confirmDel: "Ištrinti skelbimą?",
    delErr: "Nepavyko ištrinti skelbimo",
    err: "Nepavyko įdėti skelbimo. Pabandyk dar kartą.",
    cats: {
      buyCar: "Perku automobilį",
      needParts: "Ieškau detalių",
      partsCars: "Ardomi automobiliai",
      buyAllCars: "Superku automobilius",
      needMoto: "Ieškau motociklo",
      buyMachines: "Perku techniką",
      other: "Kita",
    },
    cardText: {
      buyCar: "Įdėk skelbimą, kokio automobilio ieškai",
      needParts: "Rask reikiamas dalis pagal markę ir modelį",
      partsCars: "Įdėk ardomą automobilį, kad žmonės rastų dalis",
      buyAllCars: "Supirkimo skelbimai visoms markėms",
    },
  },
  DK: {
    board: "📌 Opslagstavle",
    hero: "Hvad vil du finde eller købe?",
    heroText: "Her kan du oprette købsannoncer, søge reservedele, finde biler til dele og bilkøbere.",
    formTitle: "Opret annonce på opslagstavlen",
    formText: "Køb, søgning efter reservedele, biler til dele og bilopkøb.",
    needLogin: "Du skal logge ind for at oprette en annonce.",
    login: "Log ind",
    brand: "Mærke",
    allBrands: "Alle mærker",
    other: "Andet",
    model: "Model eller lad feltet være tomt",
    title: "Fx BMW E60 fælge eller køber bil",
    city: "By",
    phone: "Telefon",
    image: "Billede-URL, valgfrit",
    desc: "Beskrivelse",
    save: "➕ Opret annonce",
    saving: "Opretter...",
    found: "Fundet",
    search: "Søg",
    allCats: "Alle kategorier",
    call: "Ring",
    del: "🗑 Slet",
    empty: "Der er endnu ingen annoncer for denne søgning.",
    noCity: "By ikke angivet",
    saved: "Annoncen er oprettet.",
    phoneReq: "Indtast telefonnummer.",
    titleReq: "Indtast annoncetekst.",
    firebase: "Firebase er ikke tilsluttet.",
    confirmDel: "Slet annonce?",
    delErr: "Kunne ikke slette annoncen",
    err: "Kunne ikke oprette annoncen. Prøv igen.",
    cats: {
      buyCar: "Køber bil",
      needParts: "Søger reservedele",
      partsCars: "Biler til dele",
      buyAllCars: "Bilopkøb",
      needMoto: "Søger motorcykel",
      buyMachines: "Køber maskiner",
      other: "Andet",
    },
    cardText: {
      buyCar: "Opret en annonce for den bil, du leder efter",
      needParts: "Find reservedele efter mærke og model",
      partsCars: "Opret en bil til dele, så andre kan finde reservedele",
      buyAllCars: "Købsannoncer for alle bilmærker",
    },
  },
} as const;

const cardKeys: Cat[] = ["buyCar", "needParts", "partsCars", "buyAllCars"];
const cardIcons: Record<Cat, string> = { buyCar: "🔎", needParts: "🛠", partsCars: "♻️", buyAllCars: "💰", needMoto: "🏍", buyMachines: "🚜", other: "📌" };
const cardColors: Record<Cat, string> = { buyCar: "border-blue-400/25 bg-blue-500/10", needParts: "border-yellow-400/25 bg-yellow-500/10", partsCars: "border-red-400/25 bg-red-500/10", buyAllCars: "border-green-400/25 bg-green-500/10", needMoto: "border-white/10 bg-white/5", buyMachines: "border-white/10 bg-white/5", other: "border-white/10 bg-white/5" };

type Item = { id: string; category?: Cat | string; brand?: string; model?: string; title?: string; city?: string; phone?: string; description?: string; imageUrl?: string; ownerUid?: string; country?: string };

function catLabel(country: SiteCountry, cat?: string) {
  const table = labels[country].cats as Record<string, string>;
  return (cat && table[cat]) || (country === "DK" ? "Annonce" : "Skelbimas");
}

function badge(country: SiteCountry, cat?: string) {
  return `${cardIcons[(cat as Cat) || "other"] || "📌"} ${catLabel(country, cat)}`;
}

function itemTitle(item: Item, country: SiteCountry) {
  const text = [item.brand, item.model, item.title].filter(Boolean).join(" ").trim();
  return text || catLabel(country, item.category);
}

export default function Page() {
  const { user, loading } = useAuth();
  const [country, setCountry] = useState<SiteCountry>("LT");
  const tr = labels[country];
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Cat | "">("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Cat>("needParts");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => setCountry(getSiteCountry()), []);
  useEffect(() => {
    if (!db) return;
    const qRef = query(collection(db, "partRequests"), orderBy("createdAt", "desc"));
    return onSnapshot(qRef, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
  }, []);

  const cities = useMemo(() => citySuggestions(country), [country]);
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return items.filter((i) => {
      const hay = `${catLabel(country, i.category)} ${i.category || ""} ${i.brand || ""} ${i.model || ""} ${i.title || ""} ${i.city || ""} ${i.description || ""}`.toLowerCase();
      if (filter && i.category !== filter) return false;
      if (s && !hay.includes(s)) return false;
      return true;
    });
  }, [items, filter, search, country]);

  async function removeItem(id: string) {
    if (!db) return;
    if (!window.confirm(tr.confirmDel)) return;
    try { await deleteDoc(doc(db, "partRequests", id)); } catch { alert(tr.delErr); }
  }

  function choose(c: Cat) {
    setCategory(c);
    setFilter(c);
    setTimeout(() => document.getElementById("skelbimo-forma")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!user) return setMessage(tr.needLogin);
    if (!db) return setMessage(tr.firebase);
    if (!phone.trim()) return setMessage(tr.phoneReq);
    if (category !== "buyAllCars" && !adTitle.trim()) return setMessage(tr.titleReq);
    try {
      setSaving(true);
      await addDoc(collection(db, "partRequests"), {
        category,
        brand: brand.trim() || (category === "buyAllCars" ? tr.allBrands : ""),
        model: model.trim(),
        title: adTitle.trim() || (country === "DK" ? "Køber biler af alle mærker" : "Superku visų markių automobilius"),
        city: city.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        ownerUid: user.uid,
        country,
        createdAt: serverTimestamp(),
      });
      setBrand(""); setModel(""); setAdTitle(""); setCity(""); setPhone(""); setImageUrl(""); setDescription("");
      setMessage(tr.saved);
    } catch { setMessage(tr.err); } finally { setSaving(false); }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 text-white">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <div className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">{tr.board}</div>
        <h1 className="mt-4 text-3xl font-black sm:text-5xl">{tr.hero}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65 sm:text-base">{tr.heroText}</p>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cardKeys.map((c) => (
          <button key={c} type="button" onClick={() => choose(c)} className={`rounded-3xl border p-5 text-left transition ${cardColors[c]}`}>
            <div className="mb-2 text-3xl">{cardIcons[c]}</div>
            <div className="text-lg font-black">{catLabel(country, c)}</div>
            <div className="mt-1 text-sm font-semibold text-white/55">{tr.cardText[c]}</div>
          </button>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
        <form id="skelbimo-forma" onSubmit={submit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="mb-1 text-xl font-black">{tr.formTitle}</h2>
          <p className="mb-4 text-sm font-semibold text-white/55">{tr.formText}</p>
          {!loading && !user ? <div className="mb-4 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-50">{tr.needLogin} <Link href="/prisijungti" className="underline">{tr.login}</Link></div> : null}
          <div className="grid gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value as Cat)} className={inputClass}>{categories.map((c) => <option key={c} value={c} className="bg-black">{catLabel(country, c)}</option>)}</select>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}><option value="" className="bg-black">{tr.brand}</option><option value={tr.allBrands} className="bg-black">{tr.allBrands}</option>{brands.map((b) => <option key={b} value={b} className="bg-black">{b}</option>)}<option value={tr.other} className="bg-black">{tr.other}</option></select>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={tr.model} className={inputClass} />
            <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder={tr.title} className={inputClass} />
            <input value={city} onChange={(e) => setCity(e.target.value)} list="request-cities" placeholder={tr.city} className={inputClass} />
            <datalist id="request-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={tr.phone} inputMode="tel" className={inputClass} />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={tr.image} className={inputClass} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={tr.desc} rows={4} className={inputClass} />
            {message ? <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold text-white/75">{message}</div> : null}
            <button disabled={saving || !user} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-45">{saving ? tr.saving : tr.save}</button>
          </div>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-xl font-black">{tr.board}</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">{tr.found}: {filtered.length}</p>
          <div className="my-4 grid gap-2 sm:grid-cols-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr.search} className={inputClass} />
            <select value={filter} onChange={(e) => setFilter(e.target.value as Cat | "")} className={inputClass}><option value="" className="bg-black">{tr.allCats}</option>{categories.map((c) => <option key={c} value={c} className="bg-black">{catLabel(country, c)}</option>)}</select>
          </div>
          <div className="space-y-3">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/25">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-44 w-full object-cover" /> : null}
                <div className="p-4">
                  <div className="mb-2 inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">{badge(country, item.category)}</div>
                  <h3 className="text-lg font-black">{itemTitle(item, country)}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/55">{item.city || tr.noCity}</p>
                  {item.description ? <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.phone ? <a href={`tel:${item.phone}`} className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-black">{tr.call}</a> : null}
                    {user?.uid === item.ownerUid ? <button onClick={() => removeItem(item.id)} className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-black text-red-100">{tr.del}</button> : null}
                  </div>
                </div>
              </article>
            ))}
            {filtered.length === 0 ? <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-sm font-semibold text-white/60">{tr.empty}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
