import Link from "next/link";
import { cls, formatPrice } from "@/lib/format";
import type { SiteCountry } from "@/lib/site";

export type UnifiedSearchItem = {
  id: string;
  href: string;
  external?: boolean;
  source: string;
  title: string;
  subtitle?: string;
  priceText?: string;
  price?: number | null;
  img?: string | null;
  badge?: string | null;
  country: SiteCountry;
};

export function UnifiedSearchCard({ item }: { item: UnifiedSearchItem }) {
  const content = (
    <div className={cls(
      "group overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-0.5",
      item.external
        ? "border-orange-400/20 bg-gradient-to-b from-orange-500/10 to-white/[0.03] hover:border-orange-300/40"
        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
    )}>
      <div className="relative aspect-[16/10] bg-white/5">
        {item.img ? (
          <img src={item.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full w-full place-items-center px-4 text-center text-xs font-extrabold text-white/40">
            {item.external ? "Atidaryti originalų skelbimą" : "Nuotraukos nėra"}
          </div>
        )}
        <div className={cls(
          "absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide",
          item.external ? "border border-orange-200/25 bg-black/55 text-orange-200" : "border border-white/15 bg-black/60 text-white/90"
        )}>
          {item.source}
        </div>
        {item.badge ? (
          <div className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-black text-white/85">
            {item.badge}
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="line-clamp-2 min-h-[2.7rem] text-sm font-black text-white">{item.title}</div>
        <div className="mt-1 line-clamp-1 text-xs font-extrabold text-white/55">{item.subtitle || (item.external ? "Išorinis skelbimas" : "Autoloke")}</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className={cls("text-base font-black", item.external ? "text-orange-200" : "text-white")}>
            {item.priceText || (typeof item.price === "number" ? formatPrice(item.price, item.country) : "Žiūrėti skelbimą")}
          </div>
          <div className="text-[11px] font-extrabold text-white/45">{item.external ? "Naujas langas ↗" : "Autoloke"}</div>
        </div>
      </div>
    </div>
  );

  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer">{content}</a>
  ) : (
    <Link href={item.href}>{content}</Link>
  );
}
