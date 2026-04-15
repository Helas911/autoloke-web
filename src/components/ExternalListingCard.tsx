"use client";

import { useMemo, useState } from "react";
import type { ExternalListing } from "@/lib/externalAggregator";

function safeText(v?: string) {
  return (v || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sourceLabel(source?: string) {
  const s = (source || "").toLowerCase();
  if (s.includes("autoplius")) return "autoplius.lt";
  if (s.includes("autogidas")) return "autogidas.lt";
  if (s.includes("autobilis")) return "autobilis.lt";
  if (s.includes("autosel")) return "autosel.lt";
  if (s.includes("autobonus")) return "autobonus.lt";
  return safeText(source) || "išorinis šaltinis";
}

function placeholderDataUrl(source: string) {
  const safeSource = source.replace(/[<&>"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#15161b"/>
          <stop offset="100%" stop-color="#1d1f28"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="26" fill="url(#g)"/>
      <rect x="36" y="32" width="172" height="48" rx="24" fill="#000000aa"/>
      <text x="122" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${safeSource}</text>
      <text x="320" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">Skelbimas</text>
      <text x="320" y="228" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#c9c9d2">Nuotrauka nepasiekiama</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  const title = safeText(item.title) || "Skelbimas";
  const city = safeText(item.city);
  const price = safeText(item.priceText);
  const source = sourceLabel(item.source);
  const placeholder = useMemo(() => placeholderDataUrl(source), [source]);
  const proxied = item.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(item.imageUrl)}` : placeholder;
  const [imgSrc, setImgSrc] = useState(proxied);
  const details = [city, source].filter(Boolean).join(" • ") || "Atidaryti originalų skelbimą";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex gap-4 p-3 sm:p-4">
        <div className="relative h-[118px] w-[158px] shrink-0 overflow-hidden rounded-xl bg-white/[0.03] sm:h-[128px] sm:w-[190px]">
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
              <h3 className="line-clamp-2 text-[18px] font-black leading-tight text-white md:text-[22px]">{title}</h3>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white/60">{details}</p>
            </div>
            <div className="text-[24px] leading-none text-white/35">↗</div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="flex min-h-[44px] items-center rounded-xl bg-white px-4 py-2 text-base font-black text-black sm:text-lg">
              {price || "Žiūrėti"}
            </div>
            <div className="text-right text-xs font-extrabold text-white/45">
              <div>Atidaryti</div>
              <div>originalą ↗</div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
