import type { ExternalListing } from "@/lib/externalAggregator";

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-2xl border border-orange-400/20 bg-gradient-to-b from-orange-500/10 to-white/[0.03] shadow-sm transition hover:border-orange-300/40 hover:bg-orange-500/[0.08]"
    >
      <div className="relative aspect-[16/10] bg-white/5">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full w-full place-items-center text-center text-xs font-extrabold text-white/45 px-4">
            Atidaryti originalų skelbimą
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full border border-orange-200/25 bg-black/55 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-orange-200">
          {item.source}
        </div>
      </div>

      <div className="p-3">
        <div className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold text-white">{item.title}</div>
        <div className="mt-1 line-clamp-1 text-xs text-white/60">{item.city || "Išorinis skelbimas"}</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-sm font-black text-orange-200">{item.priceText || "Žiūrėti skelbimą"}</div>
          <div className="text-[11px] font-extrabold text-white/45">Naujas langas ↗</div>
        </div>
      </div>
    </a>
  );
}
