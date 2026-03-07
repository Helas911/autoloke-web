"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { uploadImage } from "@/lib/upload";
import { cls } from "@/lib/format";
import { VEHICLE_CATEGORIES, VEHICLE_TYPES, type VehicleCategory } from "@/lib/categories";
import { brandsForCategory, modelsForBrand, type BrandCategory } from "@/lib/brands_models";

type Mode = "transportas" | "dalys";

const LT_CENTER = { lat: 55.1694, lng: 23.8813 };
const optStyle: CSSProperties = { background: "#0b0b10", color: "rgba(255,255,255,0.95)" };

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

const OTHER = "__other__";

export default function IkeltiPage() {
  const { user } = useAuth();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [mode, setMode] = useState<Mode>("transportas");

  // transport
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
  const [engine, setEngine] = useState("");

  // parts
  const [title, setTitle] = useState("");

  // common
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const brandCat = toBrandCategory(category);
  const brands = useMemo(() => brandsForCategory(brandCat), [brandCat]);
  const effectiveBrand = brand === OTHER ? brandOther : brand;
  const models = useMemo(() => modelsForBrand(brandCat, effectiveBrand), [brandCat, effectiveBrand]);

  useEffect(() => {
    if (model && models.length && !models.includes(model)) setModel("");
    if (brand !== OTHER) setBrandOther("");
    if (model !== OTHER) setModelOther("");
  }, [brand]); // eslint-disable-line react-hooks/exhaustive-deps

  const markerPos = useMemo(() => {
    if (picked) return picked;
    if (!lat.trim() || !lng.trim()) return null;
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    // apsauga nuo (0,0) kai laukai tušti ar neteisingi
    if (Math.abs(la) < 0.000001 && Math.abs(ln) < 0.000001) return null;
    return { lat: la, lng: ln };
  }, [picked, lat, lng]);

  const mapCenter = markerPos ?? LT_CENTER;

  const canSubmit = useMemo(() => {
    if (!city.trim()) return false;
    if (!price.trim()) return false;
    if (!lat.trim() || !lng.trim()) return false;
    if (files.length === 0) return false;

    if (mode === "transportas") {
      const fb = (brand === OTHER ? brandOther : brand).trim();
      const fm = (model === OTHER ? modelOther : model).trim();
      if (!fb && !fm) return false;
      return true;
    }
    if (mode === "dalys") {
      if (!title.trim() && !brand.trim() && !model.trim()) return false;
      return true;
    }
    return false;
  }, [mode, city, price, lat, lng, files.length, brand, model, title]);

  function fillMyLocation() {
    setErr(null);
    if (!navigator.geolocation) {
      setErr("Naršyklė nepalaiko geolokacijos.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = Number(pos.coords.latitude);
        const ln = Number(pos.coords.longitude);
        setLat(la.toFixed(6));
        setLng(ln.toFixed(6));
        setPicked({ lat: la, lng: ln });
      },
      () => setErr("Nepavyko gauti vietos. Patikrink Location leidimus."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  useEffect(() => {
    if (!lat.trim() || !lng.trim()) return;
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    if (Math.abs(la) < 0.000001 && Math.abs(ln) < 0.000001) return;
    setPicked({ lat: la, lng: ln });
  }, [lat, lng]);

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      const p = Number(price);
      const y = year.trim() ? Number(year) : undefined;
      const mi = mileage.trim() ? Number(mileage) : undefined;
      const en = engine.trim() ? Number(engine.replace(",", ".")) : undefined;
      const la = Number(lat);
      const ln = Number(lng);

      if (!Number.isFinite(p)) throw new Error("Kaina turi būti skaičius.");
      if (!Number.isFinite(la) || !Number.isFinite(ln)) throw new Error("Koordinatės turi būti skaičiai.");
      if (year.trim() && !Number.isFinite(y)) throw new Error("Metai turi būti skaičius.");
      if (mileage.trim() && !Number.isFinite(mi)) throw new Error("Rida turi būti skaičius.");
      if (engine.trim() && !Number.isFinite(en)) throw new Error("Variklio tūris turi būti skaičius.");

      const finalBrand = (brand === OTHER ? brandOther : brand).trim() || undefined;
      const finalModel = (model === OTHER ? modelOther : model).trim() || undefined;

      if (!user) throw new Error("Prisijunk, kad galėtum įkelti skelbimą.");

      if (mode === "transportas") {
        // 1) sukuriam dokumentą (be nuotraukų), kad turėtume id
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
          engine: en,
          city: city.trim(),
          phone: phone.trim() || undefined,
          description: description.trim() || undefined,
          lat: la,
          lng: ln,
          imageUrls: [],
          imagePaths: [],
          ownerUid: user.uid,
          ownerEmail: user.email ?? undefined,
          createdAt: serverTimestamp(),
        });

        // 2) įkeliam nuotraukas į storage: ads/<uid>/<docId>/...
        const imageUrls: string[] = [];
        const imagePaths: string[] = [];
        for (const f of files) {
          const safeName = (f.name || "foto.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `ads/${user.uid}/${docRef.id}/${crypto.randomUUID?.() ?? Date.now()}-${safeName}`;
          const url = await uploadImage({ path, file: f });
          imageUrls.push(url);
          imagePaths.push(path);
        }

        // 3) atnaujinam dokumentą su nuotraukom
        await updateDoc(doc(db, "ads", docRef.id), { imageUrls, imagePaths });

        setOkMsg("Skelbimas įkeltas ✅");
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
          createdAt: serverTimestamp(),
        });

        const imageUrls: string[] = [];
        const imagePaths: string[] = [];
        for (const f of files) {
          const safeName = (f.name || "foto.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `parts/${user.uid}/${docRef.id}/${crypto.randomUUID?.() ?? Date.now()}-${safeName}`;
          const url = await uploadImage({ path, file: f });
          imageUrls.push(url);
          imagePaths.push(path);
        }

        await updateDoc(doc(db, "parts", docRef.id), { imageUrls, imagePaths });

        setOkMsg("Dalys įkeltos ✅");
      }

      // reset minimal
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setErr(e?.message || "Klaida įkeliant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-black">Įkelti skelbimą</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("transportas")}
              className={cls(
                "rounded-full border px-4 py-2 text-sm font-extrabold",
                mode === "transportas" ? "border-white/25 bg-white/12" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              Transportas
            </button>
            <button
              onClick={() => setMode("dalys")}
              className={cls(
                "rounded-full border px-4 py-2 text-sm font-extrabold",
                mode === "dalys" ? "border-white/25 bg-white/12" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              Dalys
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-[1fr_380px]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            {mode === "transportas" ? (
              <div className="grid gap-3">

                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={brand}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBrand(v);
                      setModel("");
                    }}
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" style={{ ...optStyle }}>Markė</option>
                    {brands.map((b) => (
                      <option key={b} value={b} style={{ ...optStyle }}>{b}</option>
                    ))}
                    <option value={OTHER} style={{ ...optStyle }}>Kita</option>
                  </select>

                  {brand === OTHER ? (
                    <input
                      value={brandOther}
                      onChange={(e) => setBrandOther(e.target.value)}
                      placeholder="Įrašyk markę"
                      className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                    />
                  ) : null}

                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!effectiveBrand}
                    className={cls(
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                      effectiveBrand ? "border-white/12 bg-white/5 text-white" : "border-white/10 bg-white/3 text-white/40"
                    )}
                  >
                    <option value="" style={{ ...optStyle }}>{effectiveBrand ? "Modelis" : "Modelis (pirmiau markė)"}</option>
                    {models.map((m) => (
                      <option key={m} value={m} style={{ ...optStyle }}>{m}</option>
                    ))}
                    {effectiveBrand ? <option value={OTHER} style={{ ...optStyle }}>Kita</option> : null}
                  </select>

                  {model === OTHER ? (
                    <input
                      value={modelOther}
                      onChange={(e) => setModelOther(e.target.value)}
                      placeholder="Įrašyk modelį"
                      className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                    />
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Kaina (€)"
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                  <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Metai"
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="Rida (km)"
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                  <select
                    value={gearbox}
                    onChange={(e) => setGearbox(e.target.value)}
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" style={optStyle}>Pavarų dėžė (pasirinkti)</option>
                    {["Mechaninė", "Automatinė", "Robotizuota", "Kita"].map((g) => (
                      <option key={g} value={g} style={optStyle}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" style={optStyle}>Kuro tipas (pasirinkti)</option>
                    {[
                      "Benzinas",
                      "Dyzelis",
                      "Benzinas+dujos",
                      "Dujos",
                      "Hibridas",
                      "Plug-in hibridas",
                      "Elektra",
                      "Kita",
                    ].map((f) => (
                      <option key={f} value={f} style={optStyle}>{f}</option>
                    ))}
                  </select>

                  <select
                    value={drive}
                    onChange={(e) => setDrive(e.target.value)}
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" style={optStyle}>Varomieji ratai (pasirinkti)</option>
                    {["Priekis", "Galas", "4x4"].map((d) => (
                      <option key={d} value={d} style={optStyle}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dalių pavadinimas (pvz. žibintas, variklis...)"
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={brand}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBrand(v);
                    }}
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" style={{ ...optStyle }}>Markė (nebūtina)</option>
                    {brands.map((b) => (
                      <option key={b} value={b} style={{ ...optStyle }}>{b}</option>
                    ))}
                    <option value={OTHER} style={{ ...optStyle }}>Kita</option>
                  </select>

                  {brand === OTHER ? (
                    <input
                      value={brandOther}
                      onChange={(e) => setBrandOther(e.target.value)}
                      placeholder="Įrašyk markę (nebūtina)"
                      className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                    />
                  ) : null}

                  <input
                    value={model === OTHER ? modelOther : model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Modelis (nebūtina)"
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                  />
                </div>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Kaina (€)"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
                />
              </div>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Miestas"
                className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefonas (+370...)"
                className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
              />
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aprašymas (būklė, komplektacija, pastabos...)"
              rows={4}
              className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45"
            />

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-black">Vieta žemėlapyje</div>
                <button
                  onClick={fillMyLocation}
                  className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/85 hover:bg-white/10"
                >
                  📍 Paimti mano vietą
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="lat"
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/45"
                />
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="lng"
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/45"
                />
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="h-[260px]">
                  {isLoaded ? (
                    <GoogleMap
                      zoom={markerPos ? 13 : 7}
                      center={mapCenter}
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      options={{
                        disableDefaultUI: true,
                        clickableIcons: false,
                        gestureHandling: "greedy",
                        fullscreenControl: false,
                        mapTypeControl: false,
                        streetViewControl: false,
                      }}
                      onClick={(e) => {
                        const la = e.latLng?.lat();
                        const ln = e.latLng?.lng();
                        if (typeof la === "number" && typeof ln === "number") {
                          setLat(la.toFixed(6));
                          setLng(ln.toFixed(6));
                          setPicked({ lat: la, lng: ln });
                        }
                      }}
                    >
                      {markerPos ? <Marker position={markerPos} /> : null}
                    </GoogleMap>
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-white/70">Kraunamas žemėlapis...</div>
                  )}
                </div>
              </div>

              <div className="mt-2 text-xs text-white/55">
                Paspausk ant žemėlapio, kad pažymėtum vietą (markerį galima perkelti paspaudžiant kitur).
              </div>
            </div>
          </div>

          {/* right side: photos + submit */}
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-black">Nuotraukos</div>
                <div className="text-xs text-white/60">Reikia bent 1.</div>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-black hover:bg-white/90"
              >
                ➕ Pasirinkti
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  setFiles(list);
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {files.map((f, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  alt=""
                  src={URL.createObjectURL(f)}
                  className="h-24 w-full rounded-xl object-cover"
                />
              ))}
            </div>

            <div className="mt-4 grid gap-2">
              <button
                onClick={submit}
                disabled={!canSubmit || busy}
                className={cls(
                  "w-full rounded-2xl px-4 py-3 text-sm font-black",
                  canSubmit && !busy ? "bg-white text-black hover:bg-white/90" : "bg-white/20 text-white/50"
                )}
              >
                {busy ? "Įkeliama..." : "Įkelti"}
              </button>

              <button
                onClick={() => {
                  setFiles([]);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-extrabold text-white/85 hover:bg-white/10"
              >
                Išvalyti foto
              </button>

              {err ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{err}</div> : null}
              {okMsg ? <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">{okMsg}</div> : null}
            </div>
          </div>
        </section>
      </main>

      
    </>
  );
}
