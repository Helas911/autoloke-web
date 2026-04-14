import type { ExternalListing } from "@/lib/externalAggregator";

function looksFallback(item: ExternalListing) {
  return !item.imageUrl && !item.priceText && (!item.city || item.city === "Išorinis skelbimas");
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  if (looksFallback(item)) {
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-orange-200">{item.source}</div>
            <div className="mt-1 text-lg font-black text-white">{item.title}</div>
            <div className="mt-1 text-sm font-bold text-white/60">Atidaryti paiešką portale</div>
          </div>
          <div className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white">Žiūrėti ↗</div>
        </div>
      </a>
    );
  }

  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-[24px] border border-[#f09a2a]/20 bg-[#efe6d8] text-[#2f2f2f] transition hover:border-[#f09a2a]/40">
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-[340px] md:min-w-[340px]">
          <div className="aspect-[4/3] bg-[#ddd4c6] md:h-full md:min-h-[220px] md:aspect-auto">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl font-black text-black/45">Skelbimas</div>
            )}
          </div>
          <div className="px-4 pb-3 pt-2 text-center text-xl font-black tracking-tight text-[#d24d3d] md:text-[34px]">{item.source}</div>
        </div>
        <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-black leading-tight text-[#f18418] md:text-[34px]">{item.title}</h3>
              <div className="text-[30px] leading-none text-[#f18418]">♡</div>
            </div>
            <p className="mt-3 text-sm font-bold text-black/70 md:text-lg">{[item.city, item.priceText].filter(Boolean).join(" • ") || "Atidaryti originalų skelbimą"}</p>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-[18px] bg-[#f18418] px-4 py-2 text-2xl font-black leading-none text-white md:px-5 md:py-3 md:text-[34px]">{item.priceText || "Žiūrėti"}</div>
            <div className="text-xs font-extrabold text-black/45">Atidaryti originalų skelbimą ↗</div>
          </div>
        </div>
      </div>
    </a>
  );
}
