"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

const inputClass =
  "w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-yellow-300/40";

const cities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Jurbarkas", "Tauragė", "Telšiai", "Utena"];

const requestCategories = [
  "Ieškau detalės",
  "Perku automobilį",
  "Superku automobilius",
  "Ieškau motociklo",
  "Perku techniką",
  "Kita",
];

const brands = [
  "Visos markės",
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Volkswagen",
  "Volvo",
  "Toyota",
  "Opel",
  "Ford",
  "Peugeot",
  "Renault",
  "Skoda",
  "Nissan",
  "Kia",
  "Hyundai",
  "Mazda",
  "Honda",
  "Citroen",
  "Fiat",
  "Seat",
  "Kita",
];

type RequestItem = {
  id: string;
  category?: string;
  brand?: string;
  model?: string;
  part?: string;
  city?: string;
  phone?: string;
  description?: string;
  imageUrl?: string;
  createdAt?: any;
  ownerUid?: string;
};

function buildTitle(item: RequestItem) {
  const category = item.category || "Ieškau";
  const text = [item.brand, item.model, item.part].filter(Boolean).join(" ").trim();
  if (category === "Superku automobilius") return item.part || "Superku visų markių automobilius";
  if (category === "Perku automobilį") return `Perku ${text || "automobilį"}`;
  if (category === "Ieškau motociklo") return `Ieškau ${text || "motociklo"}`;
  if (category === "Perku techniką") return `Perku ${text || "techniką"}`;
  return `${category} ${text}`.trim();
}

export default function Page() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCity, setFilterCity] = useState("");

  const [category, setCategory] = useState("Ieškau detalės");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [part, setPart] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db) return;
    const qRef = query(collection(db, "partRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qRef, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const cat = filterCategory.trim().toLowerCase();
    const b = filterBrand.trim().toLowerCase();
    const c = filterCity.trim().toLowerCase();

    return items.filter((item) => {
      const hay = `${item.category || ""} ${item.brand || ""} ${item.model || ""} ${item.part || ""} ${item.city || ""} ${item.description || ""}`.toLowerCase();
      if (text && !hay.includes(text)) return false;
      if (cat && (item.category || "").toLowerCase() !== cat) return false;
      if (b && (item.brand || "").toLowerCase() !== b) return false;
      if (c && !(item.city || "").toLowerCase().includes(c)) return false;
      return true;
    });
  }, [items, q, filterCategory, filterBrand, filterCity]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Norint įdėti skelbimą, reikia prisijungti.");
      return;
    }

    if (!category.trim() || !phone.trim()) {
      setMessage("Pasirink kategoriją ir įrašyk telefoną.");
      return;
    }

    if (category === "Superku automobilius" && !part.trim()) {
      setPart("Superku visų markių automobilius");
    }

    if (category !== "Superku automobilius" && !part.trim()) {
      setMessage("Įrašyk ko ieškai arba ką perki.");
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "partRequests"), {
        category,
        brand: brand.trim() || (category === "Superku automobilius" ? "Visos markės" : ""),
        model: model.trim(),
        part: part.trim() || "Superku visų markių automobilius",
        city: city.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      setCategory("Ieškau detalės");
      setBrand("");
      setModel("");
      setPart("");
      setCity("");
      setPhone("");
      setImageUrl("");
      setDescription("");
      setMessage("Skelbimas įdėtas.");
    } catch {
      setMessage("Nepavyko įdėti skelbimo. Patikrink Firebase taisykles.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 text-white">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
        <div className="bg-[radial-gradient(70%_90%_at_20%_0%,rgba(250,204,21,0.18),transparent_60%)] p-5 sm:p-7">
          <div className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">
            🔎 Ieškau / Perku / Superku
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Pirkimo skelbimai</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65 sm:text-base">
            Čia žmonės gali įdėti, ko ieško: detalių, automobilių, motociklų arba skelbimą „Superku visų markių automobilius“.
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
        <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black">Įdėti pirkimo skelbimą</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">Pvz.: Superku visų markių automobilius, ieškau BMW E60 ratlankių.</p>
          </div>

          {!loading && !user ? (
            <div className="mb-4 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-50">
              Norint įdėti skelbimą, reikia prisijungti.
              <Link href="/prisijungti" className="ml-2 underline">Prisijungti</Link>
            </div>
          ) : null}

          <div className="grid gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {requestCategories.map((c) => (
                <option key={c} value={c} className="bg-black">{c}</option>
              ))}
            </select>

            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}>
              <option value="" className="bg-black">Markė</option>
              {brands.map((b) => (
                <option key={b} value={b} className="bg-black">{b}</option>
              ))}
            </select>

            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelis arba palik tuščią" className={inputClass} />
            <input
              value={part}
              onChange={(e) => setPart(e.target.value)}
              placeholder={category === "Superku automobilius" ? "Pvz. Superku visų markių automobilius" : "Ko ieškai / ką perki"}
              className={inputClass}
            />
            <input value={city} onChange={(e) => setCity(e.target.value)} list="request-cities" placeholder="Miestas" className={inputClass} />
            <datalist id="request-cities">
              {cities.map((c) => <option key={c} value={c} />)}
            </datalist>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefonas" inputMode="tel" className={inputClass} />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Nuotraukos URL, nebūtina" className={inputClass} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Aprašymas" rows={4} className={inputClass} />

            {message ? <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold text-white/75">{message}</div> : null}

            <button disabled={saving || !user} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45">
              {saving ? "Dedama..." : "➕ Įdėti skelbimą"}
            </button>
          </div>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Ieško / perka / superka</h2>
              <p className="mt-1 text-sm font-semibold text-white/55">Rasta: {filtered.length}</p>
            </div>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-4">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Paieška" className={inputClass} />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={inputClass}>
              <option value="" className="bg-black">Visos kategorijos</option>
              {requestCategories.map((c) => <option key={c} value={c} className="bg-black">{c}</option>)}
            </select>
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className={inputClass}>
              <option value="" className="bg-black">Visos markės</option>
              {brands.map((b) => <option key={b} value={b} className="bg-black">{b}</option>)}
            </select>
            <input value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="Miestas" className={inputClass} />
          </div>

          <div className="space-y-3">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/25">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-44 w-full object-cover" />
                ) : null}
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-100">
                        {item.category || "Ieškau"}
                      </div>
                      <h3 className="text-lg font-black">{buildTitle(item)}</h3>
                      <p className="mt-1 text-sm font-semibold text-white/55">{item.city || "Miestas nenurodytas"}</p>
                    </div>
                    {item.phone ? (
                      <a href={`tel:${item.phone}`} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black hover:bg-white/90">Skambinti</a>
                    ) : null}
                  </div>
                  {item.description ? <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p> : null}
                  {item.phone ? <div className="mt-3 text-sm font-extrabold text-white/80">📞 {item.phone}</div> : null}
                </div>
              </article>
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-sm font-semibold text-white/60">
                Kol kas nėra skelbimų pagal šią paiešką.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
