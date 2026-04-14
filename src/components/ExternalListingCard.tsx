import type { ExternalListing } from "@/lib/externalAggregator";

function line(item: ExternalListing) {
  return [item.engine || item.fuel, item.year, item.gearbox, item.power, item.mileage, item.body, item.city]
    .filter(Boolean)
    .join(" | ");
}

export function ExternalListingCard({ item }: { item: ExternalListing }) {
  const details = line(item);
  const image = item.imageUrl || "https://placehold.co/640x420/e7dfd1/565656?text=Skelbimas";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-[26px] border border-[#f39a1b]/20 bg-[#efe5d6] text-[#2f2f2f] shadow-sm transition hover:scale-[1.005] hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-[42%]">
          <img src={image} alt="" loading="lazy" decoding="async" className="h-[240px] w-full object-cover md:h-full" />
          <div className="px-4 pb-3 pt-2 text-center text-[22px] font-black tracking-tight text-[#d64f3d] md:text-[34px]">
            {item.source}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-[24px] font-black leading-tight text-[#f18418] md:text-[34px]">{item.title}</h3>
              <div className="text-[36px] leading-none text-[#f18418]">♡</div>
            </div>

            {details ? <p className="text-[18px] leading-[1.35] text-[#4e4e4e] md:text-[22px]">{details}</p> : null}
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="inline-flex rounded-[18px] bg-[#f18418] px-5 py-3 text-[24px] font-black leading-none text-white md:text-[34px]">
              {item.priceText || "Žiūrėti"}
            </div>
            <div className="text-right text-sm font-semibold text-[#6a6a6a]">Atidaryti originalų skelbimą ↗</div>
          </div>
        </div>
      </div>
    </a>
  );
}
