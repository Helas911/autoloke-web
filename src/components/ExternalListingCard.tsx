import type { ExternalListing } from "@/lib/externalAggregator";

function compactPrice(v?: string) {
  const p = (v || "").trim();
  return p || "Žiūrėti skelbimą";
}

function compactSubtitle(item: ExternalListing) {
  const bits = [item.city, item.year, item.mileage, item.fuel, item.engine, item.gearbox]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter(Boolean);
  return bits.join(" • ");
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl border border-orange-400/20 bg-white/[0.04] transition hover:border-orange-300/40 hover:bg-white/[0.06]"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-[165px] w-full shrink-0 overflow-hidden bg-white/5 sm:h-[140px] sm:w-[210px]">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-extrabold text-white/45">
              Atidaryti originalų skelbimą
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full border border-orange-200/25 bg-black/55 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-orange-200">
            {item.source}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-2xl font-black leading-tight text-orange-200 sm:text-[28px]">
                {item.title}
              </div>
              <div className="mt-2 line-clamp-2 text-sm font-semibold text-white/65 sm:text-[15px]">
                {compactSubtitle(item) || "Išorinis skelbimas"}
              </div>
            </div>
            <div className="text-[28px] leading-none text-orange-200/80">♡</div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-xl bg-orange-500 px-4 py-2 text-xl font-black text-white sm:text-2xl">
              {compactPrice(item.priceText)}
            </div>
            <div className="text-[11px] font-extrabold text-white/40">Naujas langas ↗</div>
          </div>
        </div>
      </div>
    </a>
  );
}
