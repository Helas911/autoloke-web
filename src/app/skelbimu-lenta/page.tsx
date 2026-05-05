"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

const inputClass =
  "w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-yellow-300/40";

const cities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Jurbarkas", "Tauragė", "Telšiai", "Utena"];

const brands = [
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
  brand?: string;
  model?: string;
  part?: string;
  city?: string;
  phone?: string;
  description?: string;
  createdAt?: any;
  ownerUid?: string;
};

export default function Page() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [q, setQ] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCity, setFilterCity] = useState("");

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [part, setPart] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
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
    const b = filterBrand.trim().toLowerCase();
    const c = filterCity.trim().toLowerCase();

    return items.filter((item) => {
      const hay = `${item.brand || ""} ${item.model || ""} ${item.part || ""} ${item.city || ""} ${item.description || ""}`.toLowerCase();
      if (text && !hay.includes(text)) return false;
      if (b && (item.brand || "").toLowerCase() !== b) return false;
      if (c && !(item.city || "").toLowerCase().includes(c)) return false;
      return true;
    });
  }, [items, q, filterBrand, filterCity]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Norint įdėti skelbimą, reikia prisijungti.");
      return;
    }

    if (!brand.trim() || !model.trim() || !part.trim() || !phone.trim()) {
      setMessage("Užpildyk markę, modelį, ieškomą detalę ir telefoną.");
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "partRequests"), {
        brand: brand.trim(),
        model: model.trim(),
        part: part.trim(),
        city: city.trim(),
        phone: phone.trim(),
        description: description.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      setBrand("");
      setModel("");
      setPart("");
      setCity("");
      setPhone("");
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
            🔎 Ieškau / Perku
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Ieškomų detalių skelbimai</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65 sm:text-base">
            Pasirink markę, modelį ir įrašyk kokios detalės ieškai. Pardavėjai greičiau ras pirkėjus, o pirkėjai nebesimėtys po Facebook grupes.
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
        <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-xl font-black">Įdėti ieškomą detalę</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">Pvz.: BMW E60 ratlankiai R16, Audi A6 C6 sparnas.</p>
          </div>

          {!loading && !user ? (
            <div className="mb-4 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-50">
              Norint įdėti skelbimą, reikia prisijungti.
              <Link href="/prisijungti" className="ml-2 underline">Prisijungti</Link>
            </div>
          ) : null}

          <div className="grid gap-3">
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}>
              <option value="" className="bg-black">Markė</option>
              {brands.map((b) => (
                <option key={b} value={b} className="bg-black">{b}</option>
              ))}
            </select>

            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelis, pvz. E60, A6 C6, Passat B6" className={inputClass} />
            <input value={part} onChange={(e) => setPart(e.target.value)} placeholder="Ieškoma detalė, pvz. ratlankiai, sparnas, žibintas" className={inputClass} />
            <input value={city} onChange={(e) => setCity(e.target.value)} list="request-cities" placeholder="Miestas" className={inputClass} />
            <datalist id="request-cities">
              {cities.map((c) => <option key={c} value={c} />)}
            </datalist>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefonas" inputMode="tel" className={inputClass} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Aprašymas: dydis, spalva, būklė, ar tinka siųsti ir pan." rows={4} className={inputClass} />

            {message ? <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold text-white/75">{message}</div> : null}

            <button disabled={saving || !user} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45">
              {saving ? "Dedama..." : "➕ Įdėti skelbimą"}
            </button>
          </div>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Kas ko ieško</h2>
              <p className="mt-1 text-sm font-semibold text-white/55">Rasta: {filtered.length}</p>
            </div>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Paieška" className={inputClass} />
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className={inputClass}>
              <option value="" className="bg-black">Visos markės</option>
              {brands.map((b) => <option key={b} value={b} className="bg-black">{b}</option>)}
            </select>
            <input value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="Miestas" className={inputClass} />
          </div>

          <div className="space-y-3">
            {filtered.map((item) => (
              <article key={item.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">Ieškau {item.brand} {item.model} {item.part}</h3>
                    <p className="mt-1 text-sm font-semibold text-white/55">{item.city || "Miestas nenurodytas"}</p>
                  </div>
                  {item.phone ? (
                    <a href={`tel:${item.phone}`} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black hover:bg-white/90">Skambinti</a>
                  ) : null}
                </div>
                {item.description ? <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p> : null}
                {item.phone ? <div className="mt-3 text-sm font-extrabold text-white/80">📞 {item.phone}</div> : null}
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
