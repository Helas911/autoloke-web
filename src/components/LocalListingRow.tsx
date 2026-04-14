import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { SiteCountry } from "@/lib/site";

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
    <Link
      href={href}
      className="group block overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] shadow-sm transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-[42%]">
          <div className="h-[220px] w-full bg-white/5 md:h-full">
            {img ? (
              <img
                src={img}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-white/45">
                {t(country, "noPhoto")}
              </div>
            )}
          </div>
          {badge ? (
            <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-xs font-extrabold text-white">
              {badge}
            </div>
          ) : null}
          <div className="px-4 pb-3 pt-2 text-center text-[18px] font-black tracking-tight text-white/60 md:text-[24px]">
            Autoloke
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-[22px] font-black leading-tight text-white md:text-[30px]">
                {title}
              </h3>
              <div className="text-[32px] leading-none text-white/45">♡</div>
            </div>

            {subtitle ? (
              <p className="text-[16px] leading-[1.35] text-white/65 md:text-[20px]">{subtitle}</p>
            ) : null}
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-[18px] bg-white px-5 py-3 text-[24px] font-black leading-none text-black md:text-[30px]">
              {typeof price === "number" ? formatPrice(price, country) : t(country, "priceNotSpecified")}
            </div>
            <div className="text-right text-sm font-semibold text-white/45">Atidaryti skelbimą ↗</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
