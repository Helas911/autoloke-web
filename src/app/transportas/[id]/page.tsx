"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { deleteFile, deleteFolder, uploadImage } from "@/lib/upload";
import PhotoGallery from "@/components/gallery/PhotoGallery";

type Ad = {
  id: string;
  brand?: string;
  model?: string;
  city?: string;
  price?: number;
  year?: number;
  category?: string;
  type?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  ownerUid?: string;
  ownerEmail?: string;
  description?: string;
  mileage?: number;
  fuel?: string;
  drive?: string;
  gearbox?: string;
  engineCapacity?: number;
  powerKw?: number;
  desc?: string;
  imageUrls?: string[];
  imagePaths?: string[];
};

function Spec({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs font-extrabold text-white/55">{label}</div>
      <div className="mt-1 text-base font-black text-white">{value ?? "—"}</div>
    </div>
  );
}

export default function TransportDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<Ad | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // edit fields
  const [eBrand, setEBrand] = useState("");
  const [eModel, setEModel] = useState("");
  const [eType, setEType] = useState("");
  const [eCity, setECity] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eMileage, setEMileage] = useState("");
  const [eFuel, setEFuel] = useState("");
  const [eDrive, setEDrive] = useState("");
  const [eGearbox, setEGearbox] = useState("");
  const [eEngineCapacity, setEEngineCapacity] = useState("");
  const [ePowerKw, setEPowerKw] = useState("");

  const [newFiles, setNewFiles] = useState<File[]>([]);


  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "ads", id);
    const unsub = onSnapshot(ref, (snap) => {
      setData(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Ad) : null);
    });
    return () => unsub();
  }, [id]);
  useEffect(() => {
    if (!data) return;
    setEBrand(data.brand ?? "");
    setEModel(data.model ?? "");
    setEType(data.type ?? "");
    setECity(data.city ?? "");
    setEPrice(typeof data.price === "number" ? String(data.price) : "");
    setEPhone(data.phone ?? "");
    setEDesc((data.description ?? data.desc ?? "") as any);
    setEMileage(typeof data.mileage === "number" ? String(data.mileage) : "");
    setEFuel(data.fuel ?? "");
    setEDrive(data.drive ?? "");
    setEGearbox(data.gearbox ?? "");
    setEEngineCapacity(typeof data.engineCapacity === "number" ? String(data.engineCapacity) : "");
    setEPowerKw(typeof data.powerKw === "number" ? String(data.powerKw) : "");
  }, [data]);


  const isOwner = !!user?.uid && !!data?.ownerUid && data.ownerUid === user.uid;

  const images = useMemo(
    () => (Array.isArray(data?.imageUrls) ? data!.imageUrls!.filter(Boolean) : []),
    [data]
  );


  async function saveEdits() {
    if (!id || !isOwner) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const next: any = {
        brand: eBrand.trim() || undefined,
        model: eModel.trim() || undefined,
        type: eType.trim() || undefined,
        city: eCity.trim() || undefined,
        phone: ePhone.trim() || undefined,
        description: eDesc.trim() || undefined,
        fuel: eFuel.trim() || undefined,
        drive: eDrive.trim() || undefined,
        gearbox: eGearbox.trim() || undefined,
      };
      if (ePrice.trim()) next.price = Number(ePrice);
      next.mileage = eMileage.trim() ? Number(eMileage) : undefined;
      next.engineCapacity = eEngineCapacity.trim() ? Number(eEngineCapacity.replace(",", ".")) : undefined;
      next.powerKw = ePowerKw.trim() ? Number(ePowerKw) : undefined;
      await updateDoc(doc(db, "ads", id), next);
      setMsg("Išsaugota ✅");
    } catch (e: any) {
      setErr(e?.message || "Klaida saugant.");
    } finally {
      setSaving(false);
    }
  }

  async function replacePhotos() {
    if (!id || !isOwner) return;
    if (!newFiles.length) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      // ištrinam seną folderį
      await deleteFolder(`ads/${user!.uid}/${id}`);
      const imageUrls: string[] = [];
      const imagePaths: string[] = [];
      for (const f of newFiles) {
        const safeName = (f.name || "foto.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `ads/${user!.uid}/${id}/${crypto.randomUUID?.() ?? Date.now()}-${safeName}`;
        const url = await uploadImage({ path, file: f });
        imageUrls.push(url);
        imagePaths.push(path);
      }
      await updateDoc(doc(db, "ads", id), { imageUrls, imagePaths });
      setNewFiles([]);
      setMsg("Nuotraukos atnaujintos ✅");
    } catch (e: any) {
      setErr(e?.message || "Klaida atnaujinant nuotraukas.");
    } finally {
      setSaving(false);
    }
  }


  async function setPrimaryPhoto(index: number) {
  if (!id || !isOwner || !data?.imageUrls?.length) return;

  const urls = [...(data.imageUrls || [])];
  if (index <= 0 || index >= urls.length) return;

  // move chosen url to front
  const [u0] = urls.splice(index, 1);
  urls.unshift(u0);

  // paths are optional (older ads may not have them)
  const pathsRaw = Array.isArray(data.imagePaths) ? [...data.imagePaths] : null;
  const hasValidPaths = !!pathsRaw && pathsRaw.length === (data.imageUrls || []).length;

  setSaving(true);
  setErr(null);
  try {
    if (hasValidPaths) {
      const paths = pathsRaw!;
      const [p0] = paths.splice(index, 1);
      paths.unshift(p0);
      await updateDoc(doc(db, "ads", id), { imageUrls: urls, imagePaths: paths });
    } else {
      await updateDoc(doc(db, "ads", id), { imageUrls: urls });
    }
    setMsg("Pagrindinė nuotrauka pakeista ✅");
  } catch (e: any) {
    setErr(e?.message || "Klaida keičiant pagrindinę nuotrauką.");
  } finally {
    setSaving(false);
  }
}

async function deleteOnePhoto(index: number) {
  if (!id || !isOwner || !data?.imageUrls?.length) return;
  if (!confirm("Ištrinti šią nuotrauką?")) return;

  const urls = [...(data.imageUrls || [])];
  const url = urls[index];
  urls.splice(index, 1);

  const pathsRaw = Array.isArray(data.imagePaths) ? [...data.imagePaths] : null;
  const hasValidPaths = !!pathsRaw && pathsRaw.length === (data.imageUrls || []).length;

  setSaving(true);
  setErr(null);
  try {
    // try delete from Storage (works for both path + download URL)
    if (hasValidPaths) {
      const paths = pathsRaw!;
      const path = paths[index];
      paths.splice(index, 1);
      if (path) await deleteFile(path);
      await updateDoc(doc(db, "ads", id), { imageUrls: urls, imagePaths: paths });
    } else {
      if (url) {
        try {
          await deleteObject(ref(storage, url));
        } catch {
          // ignore if it's an external URL or already deleted
        }
      }
      await updateDoc(doc(db, "ads", id), { imageUrls: urls });
    }

    setMsg("Nuotrauka ištrinta ✅");
  } catch (e: any) {
    setErr(e?.message || "Klaida trinant nuotrauką.");
  } finally {
    setSaving(false);
  }
}
  async function movePhoto(index: number, dir: -1 | 1) {
    if (!id || !isOwner) return;
    const next = index + dir;
    if (next < 0 || next >= images.length) return;

    const urls = [...images];
    const tmp = urls[index];
    urls[index] = urls[next];
    urls[next] = tmp;

    // try keep paths in sync
    const pathsSrc = Array.isArray(data?.imagePaths) ? (data?.imagePaths as any[]) : [];
    let paths: any[] | undefined = undefined;
    if (pathsSrc.length === images.length) {
      paths = [...pathsSrc];
      const t2 = paths[index];
      paths[index] = paths[next];
      paths[next] = t2;
    }

    await updateDoc(doc(db, 'ads', id), {
      imageUrls: urls,
      ...(paths ? { imagePaths: paths } : {}),
      updatedAt: serverTimestamp(),
    });
  }

  async function replaceOnePhoto(index: number, file: File) {
    if (!id || !isOwner || !user) return;
    if (!file) return;

    const urls = [...images];
    if (!urls[index]) return;

    // upload new image
    const newPath = `ads/${user.uid}/${id}/${Date.now()}_${file.name}`;
    const newUrl = await uploadImage({ path: newPath, file });

    // delete old image if possible
    try {
      const pathsSrc = Array.isArray(data?.imagePaths) ? (data?.imagePaths as any[]) : [];
      if (pathsSrc.length === images.length && pathsSrc[index]) {
        await deleteObject(ref(storage, String(pathsSrc[index])));
      } else {
        // fallback: delete by URL ref (works for Firebase Storage download URLs)
        await deleteObject(ref(storage, urls[index]));
      }
    } catch {}

    // update arrays
    urls[index] = newUrl;

    const pathsSrc = Array.isArray(data?.imagePaths) ? (data?.imagePaths as any[]) : [];
    let paths: any[] | undefined = undefined;
    if (pathsSrc.length === images.length) {
      paths = [...pathsSrc];
      paths[index] = newPath;
    } else {
      // create paths array so future deletes work at least for replaced items
      paths = new Array(images.length).fill(null);
      paths[index] = newPath;
    }

    await updateDoc(doc(db, 'ads', id), {
      imageUrls: urls,
      imagePaths: paths,
      updatedAt: serverTimestamp(),
    });
  }





  async function copyPhone() {
    const p = (data?.phone || "").toString().trim();
    if (!p) return;
    try {
      await navigator.clipboard.writeText(p);
      setMsg("Telefono numeris nukopijuotas ✅");
    } catch {
      // ignore
    }
  }

  async function deleteListing() {
    if (!id || !isOwner) return;
    if (!confirm("Tikrai ištrinti skelbimą?")) return;
    setSaving(true);
    setErr(null);
    try {
      await deleteFolder(`ads/${user!.uid}/${id}`);
      await deleteDoc(doc(db, "ads", id));
      window.location.href = "/mano";
    } catch (e: any) {
      setErr(e?.message || "Klaida trinant.");
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/70">Kraunasi…</div>
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link href="/transportas" className="text-sm font-extrabold text-white/80 hover:text-white">
          ← Atgal
        </Link>
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/70">
          Skelbimas nerastas arba kraunasi…
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/transportas" className="text-sm font-extrabold text-white/80 hover:text-white">
          ← Atgal
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/transportas/map"
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/[0.08]"
          >
            Žemėlapis
          </Link>
          <Link
            href="/ikelti"
            className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-black hover:bg-white/90"
          >
            ➕ Įkelti
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <PhotoGallery images={images} editable={isOwner} onSetPrimary={setPrimaryPhoto} onDelete={deleteOnePhoto} onMove={movePhoto} onReplace={replaceOnePhoto} />

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-white/60">🚗 Transportas</div>
                <h1 className="mt-1 text-2xl font-black">
                  {(data.brand ?? "").toString()} {(data.model ?? "").toString()}
                </h1>
                <div className="mt-2 text-sm text-white/65">
                  {[data.city, [data.category, data.type].filter(Boolean).join(" • ")].filter(Boolean).join(" • ")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold text-white/60">Kaina</div>
                <div className="text-2xl font-black">
                  {typeof data.price === "number" ? `${data.price} €` : "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Spec label="Metai" value={data.year} />
              <Spec label="Rida" value={typeof data.mileage === "number" ? `${data.mileage} km` : undefined} />
              <Spec label="Kuro tipas" value={data.fuel} />
              <Spec label="Pavarų dėžė" value={data.gearbox} />
              <Spec label="Varomieji ratai" value={data.drive} />
              <Spec label="Variklio tūris" value={typeof data.engineCapacity === "number" ? `${data.engineCapacity} l` : undefined} />
              <Spec label="Galia" value={typeof data.powerKw === "number" ? `${data.powerKw} kW` : undefined} />
            </div>

            <div className="mt-5">
              <div className="text-sm font-extrabold uppercase tracking-wide text-white/55">Aprašymas</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                {(data.description ?? data.desc ?? "").toString() || "—"}
              </div>
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 self-start">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-extrabold text-white/60">Kontaktai</div>
                        {typeof data.lat === "number" && typeof data.lng === "number" ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-xs font-extrabold text-white/60">Vieta</div>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                  <iframe
                    title="map"
                    className="h-36 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${data.lat},${data.lng}&z=12&output=embed`}
                  />
                </div>
                <a
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-extrabold text-white/90 hover:bg-white/[0.08]"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  🧭 Naviguoti
                </a>
              </div>
            ) : null}

            {data.phone ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
                  <div className="text-sm font-extrabold text-white/90">{data.phone}</div>
                  <button
                    type="button"
                    onClick={copyPhone}
                    className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-extrabold text-white/90 hover:bg-white/[0.08]"
                  >
                    Kopijuoti
                  </button>
                </div>

                <a
                  href={`tel:${data.phone}`}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:bg-white/90"
                >
                  📞 Skambinti
                </a>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-center text-sm text-white/55">
                Telefono nėra
              </div>
            )}
          </div>


          {isOwner ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-black">Valdymas</div>
              {err ? <div className="mt-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</div> : null}
              {msg ? <div className="mt-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{msg}</div> : null}

              <div className="mt-3 grid grid-cols-1 gap-2">
                <input value={eBrand} onChange={(e) => setEBrand(e.target.value)} placeholder="Markė" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eModel} onChange={(e) => setEModel(e.target.value)} placeholder="Modelis" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eType} onChange={(e) => setEType(e.target.value)} placeholder="Tipas" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eCity} onChange={(e) => setECity(e.target.value)} placeholder="Miestas" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={ePrice} onChange={(e) => setEPrice(e.target.value)} placeholder="Kaina" inputMode="numeric" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eMileage} onChange={(e) => setEMileage(e.target.value)} placeholder="Rida (km)" inputMode="numeric" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eEngineCapacity} onChange={(e) => setEEngineCapacity(e.target.value)} placeholder="Variklio tūris (l)" inputMode="decimal" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={ePowerKw} onChange={(e) => setEPowerKw(e.target.value)} placeholder="Galia (kW)" inputMode="numeric" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eFuel} onChange={(e) => setEFuel(e.target.value)} placeholder="Kuro tipas" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eGearbox} onChange={(e) => setEGearbox(e.target.value)} placeholder="Pavarų dėžė" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={eDrive} onChange={(e) => setEDrive(e.target.value)} placeholder="Varomieji ratai" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} placeholder="Telefonas" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
                <textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Aprašymas" rows={4} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20" />
              </div>

              <button onClick={saveEdits} disabled={saving} className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:bg-white/90 disabled:opacity-60">
                💾 Išsaugoti
              </button>

              <div className="mt-4 text-xs font-extrabold text-white/60">Nuotraukos</div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80"
              />
              <button onClick={replacePhotos} disabled={saving || !newFiles.length} className="mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-extrabold text-white/90 hover:bg-white/[0.08] disabled:opacity-60">
                🔁 Atnaujinti nuotraukas
              </button>

              <button onClick={deleteListing} disabled={saving} className="mt-4 w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-extrabold text-red-200 hover:bg-red-500/15 disabled:opacity-60">
                🗑️ Ištrinti skelbimą
              </button>
            </div>
          ) : null}

        </aside>
      </div>
    </main>
  );
}
