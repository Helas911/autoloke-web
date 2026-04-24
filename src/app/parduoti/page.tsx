"use client";

import { useMemo, useState } from "react";
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
  "Kita",
];

function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "").slice(0, 20);
}

export default function QuickSellPage() {
  const [brand, setBrand] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return photos.length > 0 && price.trim().length > 0 && phone.trim().length > 0;
  }, [photos, price, phone]);

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
      setError("Firebase neprijungtas. Patikrink .env ir firebase konfigūraciją.");
      return;
    }
    if (!canSubmit) {
      setError("Pridėk bent nuotrauką, kainą ir telefono numerį.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setDoneId(null);

      const tempId = `quick_${Date.now()}`;
      const imageUrls = await Promise.all(
        photos.map((file, i) => uploadImage({ path: `ads/${tempId}/${i}-${file.name}`, file }))
      );

      const numericPrice = Number(String(price).replace(/[^\d]/g, "")) || 0;

      const docRef = await addDoc(collection(db, "ads"), {
        category: "automobiliai",
        type: "Greitas įkėlimas",
        brand: brand || "Nenurodyta",
        title: brand ? `${brand} parduodamas` : "Parduodamas automobilis",
        description: description.trim() || "Įkelta per ultra greitą Autoloke formą.",
        price: numericPrice,
        city: city.trim() || "Nenurodyta",
        phone: normalizePhone(phone),
        imageUrls,
        source: "quick_upload",
        sourceLabel: "Autoloke Greitas įkėlimas",
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
      setError(err?.message || "Nepavyko įkelti skelbimo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#111827] to-[#05070d] p-5 shadow-2xl">
          <div className="mb-4 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
            Facebook srautui pritaikytas ultra greitas įkėlimas
          </div>
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">
            Nori parduoti auto?
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/75 sm:text-base">
            Įkelk skelbimą kuo paprasčiau: nuotraukos, kaina ir telefonas. Visa kita galėsi papildyti vėliau.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl">📷</div>
              <div className="mt-2 text-sm font-semibold">Pridėk nuotraukas</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl">💶</div>
              <div className="mt-2 text-sm font-semibold">Įrašyk kainą</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xl">📞</div>
              <div className="mt-2 text-sm font-semibold">Palik telefoną</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-neutral-900 p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between text-sm text-white/70">
            <span>Užpildymas</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/55">Svarbiausia: nuotraukos, kaina, telefonas.</p>
        </section>

        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-neutral-900 p-4 shadow-xl">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">Nuotraukos *</label>
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
              <label className="mb-2 block text-sm font-semibold text-white">Kaina € *</label>
              <input
                inputMode="numeric"
                placeholder="Pvz. 6500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none ring-0 placeholder:text-white/30 focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Telefonas *</label>
              <input
                inputMode="tel"
                placeholder="Pvz. +37061234567"
                value={phone}
                onChange={(e) => setPhone(normalizePhone(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none ring-0 placeholder:text-white/30 focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Markė</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none focus:border-yellow-400"
              >
                <option value="">Pasirinkti vėliau</option>
                {BRANDS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Miestas</label>
              <input
                placeholder="Pvz. Kaunas"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none placeholder:text-white/30 focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">Trumpas komentaras</label>
            <textarea
              rows={4}
              placeholder="Pvz. Tvarkingas automobilis, važiuojantis, daugiau info telefonu."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base outline-none placeholder:text-white/30 focus:border-yellow-400"
            />
          </div>

          {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          {doneId && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
              Skelbimas įkeltas sėkmingai. ID: <span className="font-bold">{doneId}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full rounded-2xl bg-yellow-400 px-5 py-4 text-lg font-black text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Keliama..." : "PASKELBTI DABAR"}
          </button>

          <p className="text-center text-xs text-white/45">
            Be registracijos. Vėliau galėsi papildyti daugiau informacijos.
          </p>
        </form>
      </div>
    </main>
  );
}
