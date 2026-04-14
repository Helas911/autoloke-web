
import type { ExternalListing } from "@/lib/externalAggregator";

function clean(text?: string) {
  return (text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  const title = clean(item.title) || item.source;
  const details = [clean(item.city), clean(item.priceText)].filter(Boolean).join(" • ");
  const hasRich = Boolean(item.imageUrl || item.priceText || item.city);

  if (!hasRich) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-black text-white">{item.source}</div>
            <div className="mt-1 text-xs text-white/60">Atidaryti originalų paieškos rezultatą</div>
          </div>
          <div className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white">Žiūrėti</div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-[22px] border border-orange-400/20 bg-[#efe6d8] text-[#2b2b2b] shadow-sm transition hover:border-orange-300/40"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-[42%]">
          <div className="aspect-[16/10] md:h-full md:aspect-auto bg-[#ddd5c8]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-center text-4xl font-black text-[#4d4d4d]">
                Skelbimas
              </div>
            )}
          </div>
          <div className="px-4 pb-3 pt-2 text-center text-[22px] font-extrabold tracking-tight text-[#d24d3d] md:text-[34px]">
            {item.source}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-[24px] font-black leading-tight text-[#f18418] md:text-[34px]">
                {title}
              </h3>
              <div className="text-[40px] leading-none text-[#f18418]">♡</div>
            </div>

            {details ? (
              <p className="text-[18px] leading-[1.35] text-[#454545] md:text-[24px]">
                {details}
              </p>
            ) : (
              <p className="text-[18px] leading-[1.35] text-[#454545] md:text-[24px]">
                Atidaryti originalų skelbimą
              </p>
            )}
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-[18px] bg-[#f18418] px-5 py-3 text-[28px] font-black leading-none text-white md:text-[34px]">
              {clean(item.priceText) || "Žiūrėti"}
            </div>

            <div className="text-right text-sm font-semibold text-[#6a6a6a]">
              Atidaryti originalų skelbimą ↗
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
