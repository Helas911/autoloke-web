"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

const inputClass = "w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40";

const categories = ["Perku automobilį", "Ieškau detalių", "Ardomi automobiliai", "Superku automobilius", "Ieškau motociklo", "Perku techniką", "Kita"];
const brands = ["Visos markės", "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Volvo", "Toyota", "Opel", "Ford", "Peugeot", "Renault", "Skoda", "Nissan", "Kia", "Hyundai", "Mazda", "Honda", "Citroen", "Fiat", "Seat", "Kita"];
const cities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Jurbarkas", "Tauragė", "Telšiai", "Utena"];

const cards = [
  { title: "Perku automobilį", icon: "🔎", text: "Įdėk skelbimą, kokio automobilio ieškai", color: "border-blue-400/25 bg-blue-500/10" },
  { title: "Ieškau detalių", icon: "🛠", text: "Rask reikiamas dalis pagal markę ir modelį", color: "border-yellow-400/25 bg-yellow-500/10" },
  { title: "Ardomi automobiliai", icon: "♻️", text: "Įdėk ardomą automobilį, kad žmonės rastų dalis", color: "border-red-400/25 bg-red-500/10" },
  { title: "Superku automobilius", icon: "💰", text: "Supirkimo skelbimai visoms markėms", color: "border-green-400/25 bg-green-500/10" },
];

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
};

function badge(category?: string) {
  if (category === "Perku automobilį") return "🔎 Perka";
  if (category === "Ieškau detalių") return "🛠 Ieško detalių";
  if (category === "Ardomi automobiliai") return "♻️ Ardo";
  if (category === "Superku automobilius") return "💰 Superka";
  return "📌 Skelbimas";
}

function title(item: Item) {
  const text = [item.brand, item.model, item.title].filter(Boolean).join(" ").trim();
  if (item.category === "Superku automobilius") return item.title || "Superku visų markių automobilius";
  if (item.category === "Ardomi automobiliai") return `Ardomas ${text || "automobilis"}`;
  if (item.category === "Perku automobilį") return `Perku ${text || "automobilį"}`;
  if (item.category === "Ieškau detalių") return `Ieškau ${text || "detalių"}`;
  return text || item.category || "Skelbimas";
}

export default function Page() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("Ieškau detalių");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db) return;
    const qRef = query(collection(db, "partRequests"), orderBy("createdAt", "desc"));
    return onSnapshot(qRef, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return items.filter((i) => {
      const hay = `${i.category || ""} ${i.brand || ""} ${i.model || ""} ${i.title || ""} ${i.city || ""} ${i.description || ""}`.toLowerCase();
      if (filter && i.category !== filter) return false;
      if (s && !hay.includes(s)) return false;
      return true;
    });
  }, [items, filter, search]);

  function choose(c: string) {
    setCategory(c);
    setFilter(c);
    setTimeout(() => document.getElementById("skelbimo-forma")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!user) return setMessage("Norint įdėti skelbimą, reikia prisijungti.");
    if (!phone.trim()) return setMessage("Įrašyk telefono numerį.");
    if (category !== "Superku automobilius" && !adTitle.trim()) return setMessage("Įrašyk skelbimo tekstą.");

    try {
      setSaving(true);
      await addDoc(collection(db, "partRequests"), {
        category,
        brand: brand.trim() || (category === "Superku automobilius" ? "Visos markės" : ""),
        model: model.trim(),
        title: adTitle.trim() || "Superku visų markių automobilius",
        city: city.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setBrand(""); setModel(""); setAdTitle(""); setCity(""); setPhone(""); setImageUrl(""); setDescription("");
      setMessage("Skelbimas įdėtas.");
    } catch {
      setMessage("Nepavyko įdėti skelbimo. Patikrink Firebase taisykles.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 text-white">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <div className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">📌 Skelbimų lenta</div>
        <h1 className="mt-4 text-3xl font-black sm:text-5xl">Ką norite rasti arba pirkti?</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65 sm:text-base">Čia dėkite pirkimo, dalių paieškos, ardomų automobilių ir supirkimo skelbimus.</p>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <button key={c.title} type="button" onClick={() => choose(c.title)} className={`rounded-3xl border p-5 text-left transition ${c.color}`}>
            <div className="mb-2 text-3xl">{c.icon}</div>
            <div className="text-lg font-black">{c.title}</div>
            <div className="mt-1 text-sm font-semibold text-white/55">{c.text}</div>
          </button>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
        <form id="skelbimo-forma" onSubmit={submit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="mb-1 text-xl font-black">Įdėti skelbimą į lentą</h2>
          <p className="mb-4 text-sm font-semibold text-white/55">Pirkimas, dalių paieška, ardomi automobiliai ir supirkimas.</p>
          {!loading && !user ? <div className="mb-4 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-50">Norint įdėti skelbimą, reikia prisijungti. <Link href="/prisijungti" className="underline">Prisijungti</Link></div> : null}
          <div className="grid gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>{categories.map((c) => <option key={c} value={c} className="bg-black">{c}</option>)}</select>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}><option value="" className="bg-black">Markė</option>{brands.map((b) => <option key={b} value={b} className="bg-black">{b}</option>)}</select>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelis arba palik tuščią" className={inputClass} />
            <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Pvz. BMW E60 ratlankiai arba superku auto" className={inputClass} />
            <input value={city} onChange={(e) => setCity(e.target.value)} list="request-cities" placeholder="Miestas" className={inputClass} />
            <datalist id="request-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefonas" inputMode="tel" className={inputClass} />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Nuotraukos URL, nebūtina" className={inputClass} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Aprašymas" rows={4} className={inputClass} />
            {message ? <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold text-white/75">{message}</div> : null}
            <button disabled={saving || !user} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-45">{saving ? "Dedama..." : "➕ Įdėti skelbimą"}</button>
          </div>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-xl font-black">Skelbimų lenta</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">Rasta: {filtered.length}</p>
          <div className="my-4 grid gap-2 sm:grid-cols-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Paieška" className={inputClass} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputClass}><option value="" className="bg-black">Visos kategorijos</option>{categories.map((c) => <option key={c} value={c} className="bg-black">{c}</option>)}</select>
          </div>
          <div className="space-y-3">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/25">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-44 w-full object-cover" /> : null}
                <div className="p-4">
                  <div className="mb-2 inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">{badge(item.category)}</div>
                  <h3 className="text-lg font-black">{title(item)}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/55">{item.city || "Miestas nenurodytas"}</p>
                  {item.description ? <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p> : null}
                  {item.phone ? <a href={`tel:${item.phone}`} className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-black">Skambinti</a> : null}
                </div>
              </article>
            ))}
            {filtered.length === 0 ? <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-sm font-semibold text-white/60">Kol kas nėra skelbimų pagal šią paiešką.</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
