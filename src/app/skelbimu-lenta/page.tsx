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
  "Perku automobilį",
  "Ieškau detalių",
  "Ardomi automobiliai",
  "Superku automobilius",
  "Ieškau motociklo",
  "Perku techniką",
  "Kita",
];

const actionCards = [
  {
    title: "Parduodu automobilį",
    subtitle: "Įkelk normalų transporto pardavimo skelbimą",
    icon: "🚗",
    href: "/ikelti",
    type: "link",
    className: "border-white/15 bg-white/[0.06] hover:bg-white/[0.10]",
  },
  {
    title: "Perku automobilį",
    subtitle: "Įdėk skelbimą, kokio automobilio ieškai",
    icon: "🔎",
    category: "Perku automobilį",
    type: "category",
    className: "border-blue-400/25 bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    title: "Ieškau detalių",
    subtitle: "Rask reikiamas dalis pagal markę ir modelį",
    icon: "🛠",
    category: "Ieškau detalių",
    type: "category",
    className: "border-yellow-400/25 bg-yellow-500/10 hover:bg-yellow-500/20",
  },
  {
    title: "Ardomi automobiliai",
    subtitle: "Įdėk ardomą automobilį, kad žmonės rastų dalis",
    icon: "♻️",
    category: "Ardomi automobiliai",
    type: "category",
    className: "border-red-400/25 bg-red-500/10 hover:bg-red-500/20",
  },
  {
    title: "Superku automobilius",
    subtitle: "Supirkimo skelbimai visoms markėms",
    icon: "💰",
    category: "Superku automobilius",
    type: "category",
    className: "border-green-400/25 bg-green-500/10 hover:bg-green-500/20",
  },
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
  const category = item.category || "Skelbimas";
  const text = [item.brand, item.model, item.part].filter(Boolean).join(" ").trim();

  if (category === "Superku automobilius") return item.part || "Superku visų markių automobilius";
  if (category === "Ardomi automobiliai") return `Ardomas ${text || "automobilis"}`;
  if (category === "Perku automobilį") return `Perku ${text || "automobilį"}`;
  if (category === "Ieškau detalių") return `Ieškau ${text || "detalių"}`;
  if (category === "Ieškau motociklo") return `Ieškau ${text || "motociklo"}`;
  if (category === "Perku techniką") return `Perku ${text || "techniką"}`;

  return `${category} ${text}`.trim();
}

function categoryBadge(category?: string) {
  if (category === "Perku automobilį") return "🔎 Perka";
  if (category === "Ieškau detalių") return "🛠 Ieško detalių";
  if (category === "Ardomi automobiliai") return "♻️ Ardo";
  if (category === "Superku automobilius") return "💰 Superka";
  if (category === "Ieškau motociklo") return "🏍 Motociklas";
  if (category === "Perku techniką") return "🚜 Technika";
  return "📌 Skelbimas";
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

  const [category, setCategory] = useState("Ieškau detalių");
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

  function chooseCategory(nextCategory: string) {
    setCategory(nextCategory);
    setFilterCategory(nextCategory);
    setMessage("");
    setTimeout(() => document.getElementById("skelbimo-forma")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

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

    const cleanBrand = brand.trim() || (category === "Superku automobilius" ? "Visos markės" : "");
    const cleanPart = part.trim() || (category === "Superku automobilius" ? "Superku visų markių automobilius" : "");

    if (category !== "Superku automobilius" && !cleanPart) {
      setMessage("Įrašyk skelbimo tekstą: ko ieškai, ką perki arba ką ardai.");
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "partRequests"), {
        category,
        brand: cleanBrand,
        model: model.trim(),
        part: cleanPart,
        city: city.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      setCategory("Ieškau detalių");
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
            📌 Skelbimų lenta
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Ką norite padaryti?</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65 sm:text-base">
            Aiškiai pasirinkite skelbimo tipą: parduoti automobilį, pirkti automobilį, ieškoti detalių, įdėti ardomą automobilį arba supirkimo skelbimą.
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {actionCards.map((card) =>
          card.type === "link" ? (
            <Link key={card.title} href={card.href || "/ikelti"} className={`rounded-3xl border p-5 text-left transition ${card.className}`}>
              <div className="mb-2 text-3xl">{card.icon}</div>
              <div className="text-lg font-black">{card.title}</div>
              <div className="mt-1 text-sm font-semibold text-white/55">{card.subtitle}</div>
            </Link>
          ) : (
            <button key={card.title} type="button" onClick={() => chooseCategory(card.category || "Ieškau detalių")} className={`rounded-3xl border p-5 text-left transition ${card.className}`}>
              <div className="mb-2 text-3xl">{card.icon}</div>
              <div className="text-lg font-black">{card.title}</div>
              <div className="mt-1 text-sm font-semibold text-white/55">{card.subtitle}</div>
            </button>
          )
        )}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
        <form id="skelbimo-forma" onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black">Įdėti skelbimą į lentą</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">Pardavimo skelbimui naudok „Parduodu automobilį“, o čia dėk pirkimo, paieškos, ardymo ir supirkimo skelbimus.</p>
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
              placeholder={
                category === "Ardomi automobiliai"
                  ? "Pvz. Ardomas BMW E60"
                  : category === "Superku automobilius"
                    ? "Pvz. Superku visų markių automobilius"
                    : category === "Perku automobilį"
                      ? "Pvz. Perku BMW 320 dyzelį"
                      : "Ko ieškai / ką perki"
              }
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
              <h2 className="text-xl font-black">Skelbimų lenta</h2>
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
                        {categoryBadge(item.category)}
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
