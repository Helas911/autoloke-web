import type { ExternalListing } from "@/lib/externalAggregator";

function niceTitle(item: ExternalListing) {
  const t = (item.title || "").trim();
  if (t) return t;
  return item.source || "Išorinis skelbimas";
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block"
    >
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-orange-300/30 hover:bg-white/[0.06]">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-[120px] w-full shrink-0 overflow-hidden bg-white/5 sm:h-[110px] sm:w-[165px]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={niceTitle(item)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center px-3 text-center text-xs font-extrabold text-white/40">
                Atidaryti originalų skelbimą
              </div>
            )}
            <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
              {item.source}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-4 p-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[22px] font-black leading-tight text-white">
                {niceTitle(item)}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white/60">
                {[item.city, item.yearText, item.mileageText, item.fuelText, item.gearboxText].filter(Boolean).join(" • ") || "Išorinis skelbimas"}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-3">
              <div className="text-[24px] leading-none text-white/45">↗</div>
              <div className="rounded-2xl bg-orange-500 px-4 py-2 text-lg font-black leading-none text-white">
                {item.priceText || "Žiūrėti"}
              </div>
              <div className="text-[11px] font-extrabold text-white/45">{item.source}</div>
            </div>
          </div>
        </div>
      </article>
    </a>
  );
}
