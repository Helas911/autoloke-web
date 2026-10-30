"use client";

import { useMemo, useState } from "react";
import type { ExternalListing } from "@/lib/externalAggregator";
import { getSiteCountry } from "@/lib/site";

function safeText(v?: string) {
  return (v || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sourceLabel(source: string | undefined, isDk: boolean) {
  const s = (source || "").toLowerCase();
  if (s.includes("autoplius")) return "autoplius.lt";
  if (s.includes("autogidas")) return "autogidas.lt";
  if (s.includes("autobilis")) return "autobilis.lt";
  if (s.includes("autosel")) return "autosel.lt";
  if (s.includes("autobonus")) return "autobonus.lt";
  return safeText(source) || (isDk ? "ekstern kilde" : "išorinis šaltinis");
}

function placeholderDataUrl(source: string, isDk: boolean) {
  const safeSource = source.replace(/[<&>"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e2f5e9"/>
          <stop offset="100%" stop-color="#c8ead7"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="26" fill="url(#g)"/>
      <rect x="36" y="32" width="172" height="48" rx="24" fill="#000000aa"/>
      <text x="122" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${safeSource}</text>
      <text x="320" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#145b39">${isDk ? "Annonce" : "Skelbimas"}</text>
      <text x="320" y="248" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#4b7760">${isDk ? "Billedet er ikke tilgængeligt" : "Nuotrauka nepasiekiama"}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  const isDk = getSiteCountry() === "DK";
  const title = safeText(item.title) || (isDk ? "Annonce" : "Skelbimas");
  const details = safeText(item.city) || (isDk ? "Åbn den originale annonce" : "Atidaryti originalų skelbimą");
  const price = safeText(item.priceText) || (isDk ? "Se annonce" : "Žiūrėti");
  const source = sourceLabel(item.source, isDk);
  const placeholder = useMemo(() => placeholderDataUrl(source, isDk), [source, isDk]);
  const proxied = item.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(item.imageUrl)}` : placeholder;
  const [imgSrc, setImgSrc] = useState(proxied);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex gap-3 p-2.5 sm:gap-4 sm:p-3">
        <div className="relative h-[100px] w-[112px] sm:h-[110px] sm:w-[160px] shrink-0 overflow-hidden rounded-xl bg-emerald-50">
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(placeholder)}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
            {source}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-black text-emerald-950 sm:text-[18px] md:text-[22px]">{title}</h3>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-600">{details}</p>
            </div>
            <div className="text-[24px] leading-none text-emerald-700/60">♡</div>
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-2 sm:mt-3">
            <div className="rounded-xl bg-emerald-50 px-3 py-1.5 text-base font-black text-emerald-800 sm:px-4 sm:py-2 sm:text-lg">{price}</div>
            <div className="hidden text-xs font-extrabold text-emerald-700/70 sm:block">{isDk ? "Original ↗" : "Originalas ↗"}</div>
          </div>
        </div>
      </div>
    </a>
  );
}
