import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { SiteCountry } from "@/lib/site";
import { t } from "@/lib/i18n";

type Props = {
  href: string;
  title: string;
  subtitle?: string;
  price?: number | null;
  img?: string | null;
  badge?: string | null;
  country?: SiteCountry;
};

export default function LocalListingRow({ href, title, subtitle, price, img, badge, country = "LT" }: Props) {
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex gap-4 p-3">
        <div className="relative h-[110px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-white/[0.03]">
          {img ? (
            <img src={img} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-bold text-white/40">{t(country, "noPhoto")}</div>
          )}
          {badge ? (
            <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
              {badge}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[18px] font-black text-white md:text-[22px]">{title}</h3>
              {subtitle ? (
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white/60">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="text-[24px] leading-none text-white/40">♡</div>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="rounded-xl bg-white px-4 py-2 text-lg font-black text-black">
              {typeof price === "number" ? formatPrice(price, country) : t(country, "priceNotSpecified")}
            </div>
            <div className="text-xs font-extrabold text-white/45">Autoloke</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
