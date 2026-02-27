"use client";

import { useEffect, useMemo, useState } from "react";
import { cls } from "@/lib/format";

export function PhotoGallery({ images }: { images: string[] }) {
  const imgs = useMemo(() => images.filter(Boolean), [images]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, imgs.length]);

  function next() {
    setIdx((v) => (v + 1) % imgs.length);
  }
  function prev() {
    setIdx((v) => (v - 1 + imgs.length) % imgs.length);
  }

  if (!imgs.length) {
    return (
      <div className="grid aspect-[16/10] place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/50">
        Nuotraukų nėra
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setIdx(0);
          setOpen(true);
        }}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5"
      >
        <div className="aspect-[16/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[0]} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        </div>
        <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-extrabold text-white">
          {imgs.length} nuotr.
        </div>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-6xl flex-col px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-extrabold text-white hover:bg-white/10"
              >
                ← Atgal
              </button>
              <div className="text-sm font-extrabold text-white/80">
                {idx + 1} / {imgs.length}
              </div>
              <div className="w-20" />
            </div>

            <div className="mt-3 grid flex-1 place-items-center">
              <div className="relative w-full">
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-4 py-3 text-xl text-white hover:bg-black/70"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-4 py-3 text-xl text-white hover:bg-black/70"
                >
                  ›
                </button>

                <div className="mx-auto max-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgs[idx]} alt="" className="max-h-[70vh] w-full object-contain" />
                </div>
              </div>

              <div className="no-scrollbar mt-3 flex w-full gap-2 overflow-x-auto pb-1">
                {imgs.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setIdx(i)}
                    className={cls(
                      "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border",
                      i === idx ? "border-white/50" : "border-white/10 opacity-80 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
