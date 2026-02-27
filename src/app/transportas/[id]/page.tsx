"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
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
  ownerEmail?: string;
  description?: string;
  desc?: string;
  imageUrls?: string[];
};

export default function TransportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<Ad | null>(null);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "ads", id);
    const unsub = onSnapshot(ref, (snap) => {
      setData(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Ad) : null);
    });
    return () => unsub();
  }, [id]);

  const images = useMemo(
    () => (Array.isArray(data?.imageUrls) ? data!.imageUrls!.filter(Boolean) : []),
    [data]
  );

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
        </aside>
      </div>
    </main>
  );
}
