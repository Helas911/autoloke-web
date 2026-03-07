'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type MoveDir = -1 | 1;

export default function PhotoGallery({
  images,
  editable = false,
  onSetPrimary,
  onDelete,
  onMove,
  onReplace,
}: {
  images: string[];
  editable?: boolean;
  onSetPrimary?: (index: number) => void | Promise<void>;
  onDelete?: (index: number) => void | Promise<void>;
  onMove?: (index: number, dir: MoveDir) => void | Promise<void>;
  onReplace?: (index: number, file: File) => void | Promise<void>;
}) {
  const list = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!list.length) setOpen(false);
    if (idx > list.length - 1) setIdx(Math.max(0, list.length - 1));
  }, [list.length, idx]);

  if (!list.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
        Nuotraukų nėra.
      </div>
    );
  }

  const current = list[idx];

  const canMoveLeft = editable && idx > 0 && !!onMove;
  const canMoveRight = editable && idx < list.length - 1 && !!onMove;

  function nav(d: MoveDir) {
    setIdx((v) => {
      const next = v + d;
      if (next < 0) return 0;
      if (next > list.length - 1) return list.length - 1;
      return next;
    });
  }

  async function doPrimary() {
    if (!editable || !onSetPrimary) return;
    await onSetPrimary(idx);
    // after making primary, most implementations move it to index 0
    setIdx(0);
  }

  async function doDelete() {
    if (!editable || !onDelete) return;
    await onDelete(idx);
    setIdx((v) => Math.max(0, Math.min(v, list.length - 2)));
  }

  async function doMove(dir: MoveDir) {
    if (!editable || !onMove) return;
    const next = idx + dir;
    if (next < 0 || next > list.length - 1) return;
    await onMove(idx, dir);
    setIdx(next);
  }

  function pickReplace() {
    if (!editable || !onReplace) return;
    replaceInputRef.current?.click();
  }

  async function onReplacePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !editable || !onReplace) return;
    // reset input so selecting same file again triggers change
    e.target.value = '';
    await onReplace(idx, f);
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <button
        className="relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40"
        onClick={() => setOpen(true)}
        title="Atidaryti"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt="Nuotrauka" loading="eager" decoding="async" className="aspect-[16/9] w-full object-cover" />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-extrabold text-white/90">
          {idx + 1}/{list.length}
        </div>
      </button>

      {/* thumbnails */}
      <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1">
        {list.map((u, i) => (
          <button
            key={u + i}
            onClick={() => setIdx(i)}
            className={
              'relative h-16 w-24 flex-none overflow-hidden rounded-xl border ' +
              (i === idx ? 'border-white/50' : 'border-white/10 hover:border-white/30')
            }
            title={i === 0 ? 'Pagrindinė' : 'Pasirinkti'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={'Nuotrauka ' + (i + 1)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            {i === 0 && (
              <div className="absolute left-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                ★
              </div>
            )}
          </button>
        ))}
      </div>

      {/* edit toolbar */}
      {editable && (
        <div className="mt-3 flex w-full flex-wrap items-center gap-2">
          <button
            onClick={doPrimary}
            disabled={!onSetPrimary || idx === 0}
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
            title="Padaryti pagrindine"
          >
            ★ Pagrindinė
          </button>

          <button
            onClick={pickReplace}
            disabled={!onReplace}
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Keisti
          </button>

          <button
            onClick={doDelete}
            disabled={!onDelete}
            className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-extrabold text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ištrinti
          </button>

          <div className="flex-1" />

          <button
            onClick={() => doMove(-1)}
            disabled={!canMoveLeft}
            className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
            title="Perkelti kairėn"
          >
            ←
          </button>
          <button
            onClick={() => doMove(1)}
            disabled={!canMoveRight}
            className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
            title="Perkelti dešinėn"
          >
            →
          </button>

          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onReplacePicked}
          />
        </div>
      )}

      {/* lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-2 text-xs font-extrabold text-white/90 hover:bg-black/75"
              onClick={() => setOpen(false)}
            >
              Uždaryti
            </button>

            <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-2 text-xs font-extrabold text-white/90">
              {idx + 1}/{list.length}
            </div>

            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-3 text-white/90 hover:bg-black/75 disabled:opacity-30"
              onClick={() => nav(-1)}
              disabled={idx === 0}
            >
              ‹
            </button>
            <button
              className="absolute right-16 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-3 text-white/90 hover:bg-black/75 disabled:opacity-30"
              onClick={() => nav(1)}
              disabled={idx === list.length - 1}
            >
              ›
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt="Nuotrauka" loading="eager" decoding="async" className="max-h-[80vh] w-full object-contain" />

            {editable && (
              <div className="border-t border-white/10 bg-black/70 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={doPrimary}
                    disabled={!onSetPrimary || idx === 0}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ★ Pagrindinė
                  </button>
                  <button
                    onClick={pickReplace}
                    disabled={!onReplace}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Keisti
                  </button>
                  <button
                    onClick={doDelete}
                    disabled={!onDelete}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-extrabold text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ištrinti
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => doMove(-1)}
                    disabled={!canMoveLeft}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => doMove(1)}
                    disabled={!canMoveRight}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-extrabold text-white/85 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
