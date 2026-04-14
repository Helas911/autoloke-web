"use client";

import Link from "next/link";

type Props = {
  href: string;
  title: string;
  subtitle?: string;
  price?: number | null;
  img?: string | null;
  badge?: string | null;
  country?: "LT" | "DK";
};

export default function LocalListingRow({ href, title, subtitle, price, img, badge, country = "LT" }: Props) {
  const priceText = typeof price === "number"
    ? `${price.toLocaleString(country === "DK" ? "da-DK" : "lt-LT")} €`
    : country === "DK" ? "Pris ikke angivet" : "Kaina nenurodyta";

  return (
    <Link href={href} className="block">
      <article className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-[340px] md:min-w-[340px]">
            {img ? (
              <img src={img} alt={title} className="h-[230px] w-full object-cover md:h-full" loading="lazy" />
            ) : (
              <div className="grid h-[230px] w-full place-items-center bg-white/5 text-sm font-extrabold text-white/40 md:h-full">
                {country === "DK" ? "Ingen foto" : "Nėra nuotraukos"}
              </div>
            )}

            {badge ? (
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {badge}
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[230px] flex-1 flex-col justify-between p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-[28px] font-black leading-tight text-white md:text-[34px]">{title}</h3>
                {subtitle ? (
                  <p className="mt-2 text-[15px] leading-6 text-white/65 md:text-[18px]">{subtitle}</p>
                ) : null}
              </div>
              <div className="text-[34px] leading-none text-white/45">♡</div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="inline-flex rounded-[18px] bg-white px-5 py-3 text-[22px] font-black leading-none text-black md:text-[30px]">
                {priceText}
              </div>
              <div className="text-right text-sm font-semibold text-white/45">Autoloke</div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
