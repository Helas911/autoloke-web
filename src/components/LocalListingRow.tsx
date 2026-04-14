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

export function LocalListingRow({ href, title, subtitle, price, img, badge, country = "LT" }: Props) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-[340px] md:min-w-[340px]">
          <div className="aspect-[4/3] bg-white/5 md:h-full md:min-h-[220px] md:aspect-auto">
            {img ? (
              <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm font-extrabold text-white/40">{t(country, "noPhoto")}</div>
            )}
          </div>
          {badge ? <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-black text-white">{badge}</div> : null}
        </div>
        <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-black leading-tight text-white md:text-[34px]">{title}</h3>
              <div className="text-[30px] leading-none text-white/45">♡</div>
            </div>
            {subtitle ? <p className="mt-2 text-sm font-bold text-white/65 md:text-lg">{subtitle}</p> : null}
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-[18px] bg-white px-4 py-2 text-2xl font-black leading-none text-black md:px-5 md:py-3 md:text-[34px]">{typeof price === "number" ? formatPrice(price, country) : t(country, "priceNotSpecified")}</div>
            <div className="text-xs font-extrabold text-white/40">Autoloke</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
