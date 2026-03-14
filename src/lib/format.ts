import { formatMoney, type SiteCountry } from "./site";

export function eur(v?: number | null): string {
  return formatMoney(v, "LT");
}

export function formatPrice(v?: number | null, country: SiteCountry = "LT"): string {
  return formatMoney(v, country);
}

export function compact(v?: number | null): string {
  if (typeof v !== "number" || !isFinite(v)) return "—";
  return new Intl.NumberFormat("lt-LT", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

export function cls(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}
