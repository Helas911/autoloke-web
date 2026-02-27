import Link from "next/link";
import { eur, cls } from "@/lib/format";

export function ListingCard({
  href,
  title,
  subtitle,
  price,
  img,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string;
  price?: number | null;
  img?: string | null;
  badge?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="relative aspect-[16/10] bg-white/5">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full w-full place-items-center text-white/45">Be nuotraukos</div>
        )}
        {badge ? (
          <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-extrabold text-white">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <div className="line-clamp-1 text-sm font-extrabold">{title}</div>
        {subtitle ? <div className="mt-1 line-clamp-1 text-xs text-white/65">{subtitle}</div> : null}
        <div className={cls("mt-2 text-sm font-black", typeof price === "number" ? "text-white" : "text-white/60")}>
          {typeof price === "number" ? eur(price) : "Kaina nenurodyta"}
        </div>
      </div>
    </Link>
  );
}
