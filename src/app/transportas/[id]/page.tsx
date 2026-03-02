"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { deleteFolder, uploadImage } from "@/lib/upload";
import PhotoGallery from "@/components/gallery/PhotoGallery";

type Ad = {
  id: string;
  brand?: string;
  model?: string;
  city?: string;
  price?: number;
  category?: string;
  type?: string;
  phone?: string;
  ownerUid?: string;
  ownerEmail?: string;
  description?: string;
  desc?: string;
  imageUrls?: string[];
  imagePaths?: string[];
};

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
      };
      if (ePrice.trim()) next.price = Number(ePrice);
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

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <PhotoGallery images={images} />

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

            <div className="mt-4 whitespace-pre-wrap text-sm text-white/80">
              {(data.description ?? data.desc ?? "").toString() || "—"}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-extrabold text-white/60">Kontaktai</div>
            <div className="mt-2 text-sm text-white/75">{data.ownerEmail ?? "—"}</div>

            {data.phone ? (
              <a
                href={`tel:${data.phone}`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:bg-white/90"
              >
                📞 Skambinti
              </a>
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
