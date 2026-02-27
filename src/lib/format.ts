export function eur(v?: number | null): string {
  if (typeof v !== "number" || !isFinite(v)) return "—";
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

export function compact(v?: number | null): string {
  if (typeof v !== "number" || !isFinite(v)) return "—";
  return new Intl.NumberFormat("lt-LT", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

export function cls(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}
