import type { ExternalListing } from "@/lib/externalAggregator";

function safeText(v?: string) {
  return (v || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sourceLabel(source?: string) {
  const s = (source || "").toLowerCase();
  if (s.includes("autoplius")) return "autoplius.lt";
  if (s.includes("autogidas")) return "autogidas.lt";
  if (s.includes("autobilis")) return "autobilis.lt";
  if (s.includes("autosel")) return "autosel.lt";
  if (s.includes("autobonus")) return "autobonus.lt";
  return safeText(source) || "išorinis šaltinis";
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  const title = safeText(item.title) || "Skelbimas";
  const details = safeText(item.city) || "Atidaryti originalų skelbimą";
  const price = safeText(item.priceText) || "Žiūrėti";
  const image = item.imageUrl || "https://placehold.co/640x420/1b1b1f/ffffff?text=Skelbimas";
  const source = sourceLabel(item.source);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex gap-4 p-3">
        <div className="relative h-[110px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-white/[0.03]">
          <img src={image} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
            {source}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[18px] font-black text-white md:text-[22px]">{title}</h3>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white/60">{details}</p>
            </div>
            <div className="text-[24px] leading-none text-white/40">♡</div>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="rounded-xl bg-white px-4 py-2 text-lg font-black text-black">{price}</div>
            <div className="text-xs font-extrabold text-white/45">Originalas ↗</div>
          </div>
        </div>
      </div>
    </a>
  );
}
