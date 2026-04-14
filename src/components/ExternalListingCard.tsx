import type { ExternalListing } from "@/lib/externalAggregator";

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-2xl border border-orange-400/20 bg-[#161616] shadow-sm transition hover:border-orange-300/40 hover:bg-[#1b1b1b]"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-[44%]">
          <div className="aspect-[16/10] bg-white/5 sm:h-full">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
            ) : (
              <div className="grid h-full w-full place-items-center text-center text-xs font-extrabold text-white/45 px-4">
                Atidaryti originalų skelbimą
              </div>
            )}
          </div>
          <div className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
            {item.source}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <div className="line-clamp-2 text-xl font-black text-orange-400">{item.title}</div>
            <div className="mt-2 line-clamp-2 text-sm text-white/75">{item.city || "Išorinis skelbimas"}</div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="inline-flex rounded-2xl bg-orange-500 px-4 py-2 text-2xl font-black text-white">
              {item.priceText || "Žiūrėti"}
            </div>
            <div className="text-[11px] font-extrabold text-white/45">Naujas langas ↗</div>
          </div>
        </div>
      </div>
    </a>
  );
}
