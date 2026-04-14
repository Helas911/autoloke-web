import type { ExternalListing } from "@/lib/externalAggregator";

function safeText(v?: string) {
  return (v || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function looksReal(item: ExternalListing) {
  return !item.isFallback && Boolean(safeText(item.priceText) || safeText(item.city) || item.imageUrl);
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  const title = safeText(item.title) || "Skelbimas";
  const details = safeText(item.city) || "Atidaryti originalų skelbimą";
  const price = safeText(item.priceText);
  const image = item.imageUrl || "https://placehold.co/800x500/e8decd/4a4a4a?text=Skelbimas";
  const source = sourceLabel(item.source);

  if (!looksReal(item)) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-4 text-white transition hover:bg-white/[0.05]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold uppercase tracking-wide text-orange-300">{source}</div>
            <div className="mt-1 text-xl font-black text-white">{title}</div>
            <div className="mt-1 text-sm text-white/60">Atidaryti paieškos rezultatą originale ↗</div>
          </div>
          <div className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-black text-white">Žiūrėti</div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-[26px] border border-[#efc58f]/35 bg-[#efe4d4] text-[#3d352c] shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition hover:scale-[1.01]"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-[42%]">
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-[240px] w-full object-cover md:h-full"
          />
          <div className="px-4 pb-4 pt-2 text-center text-[20px] font-black text-[#d24d3d] md:text-[34px]">
            {source}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-[30px] font-black leading-tight text-[#f18418] md:text-[38px]">
                {title}
              </h3>
              <div className="shrink-0 text-[42px] leading-none text-[#f18418]">♡</div>
            </div>

            <p className="text-[20px] leading-[1.35] text-[#4d4d4d] md:text-[24px]">
              {details}
            </p>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-[18px] bg-[#f18418] px-5 py-3 text-[30px] font-black leading-none text-white md:text-[38px]">
              {price || 'Žiūrėti'}
            </div>

            <div className="text-right text-sm font-bold text-[#666]">
              Atidaryti originalų skelbimą ↗
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
