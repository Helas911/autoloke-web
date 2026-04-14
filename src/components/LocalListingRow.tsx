import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { SiteCountry } from "@/lib/site";
import { t } from "@/lib/i18n";

export default function LocalListingRow({
  href,
  title,
  subtitle,
  price,
  img,
  badge,
  country = "LT",
}: {
  href: string;
  title: string;
  subtitle?: string;
  price?: number | null;
  img?: string | null;
  badge?: string | null;
  country?: SiteCountry;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex flex-col gap-0 sm:flex-row">
        <div className="relative h-[165px] w-full shrink-0 overflow-hidden bg-white/5 sm:h-[140px] sm:w-[210px]">
          {img ? (
            <img
              src={img}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-extrabold text-white/45">
              {t(country, "noPhoto")}
            </div>
          )}
          {badge ? (
            <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[11px] font-black text-white">
              {badge}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-2xl font-black leading-tight text-white sm:text-[28px]">
                {title}
              </div>
              {subtitle ? (
                <div className="mt-2 line-clamp-2 text-sm font-semibold text-white/65 sm:text-[15px]">
                  {subtitle}
                </div>
              ) : null}
            </div>
            <div className="text-[28px] leading-none text-white/40">♡</div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-xl bg-white px-4 py-2 text-xl font-black text-black sm:text-2xl">
              {typeof price === "number" ? formatPrice(price, country) : t(country, "priceNotSpecified")}
            </div>
            <div className="text-xs font-extrabold text-white/40">Autoloke</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
