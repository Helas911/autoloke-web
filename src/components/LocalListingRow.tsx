"use client";

import Link from "next/link";

type LocalListingRowProps = {
  href: string;
  title: string;
  subtitle?: string;
  price?: number | null;
  img?: string | null;
  badge?: string | null;
  country?: "LT" | "DK";
};

export default function LocalListingRow({ href, title, subtitle, price, img, badge, country = "LT" }: LocalListingRowProps) {
  const formattedPrice = typeof price === "number"
    ? `${price.toLocaleString(country === "DK" ? "da-DK" : "lt-LT")} €`
    : country === "DK"
      ? "Pris ikke angivet"
      : "Kaina nenurodyta";

  return (
    <Link href={href} className="block">
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]">
        <div className="flex flex-col gap-0 sm:flex-row">
          <div className="relative h-[120px] w-full shrink-0 overflow-hidden bg-white/5 sm:h-[110px] sm:w-[165px]">
            {img ? (
              <img src={img} alt={title} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs font-extrabold text-white/40">
                {country === "DK" ? "Ingen foto" : "Nėra nuotraukos"}
              </div>
            )}

            {badge ? (
              <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
                {badge}
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-4 p-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[22px] font-black leading-tight text-white">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white/60">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-3">
              <div className="text-[24px] leading-none text-white/45">♡</div>
              <div className="rounded-2xl bg-white px-4 py-2 text-lg font-black leading-none text-black">
                {formattedPrice}
              </div>
              <div className="text-[11px] font-extrabold text-white/45">Autoloke</div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
