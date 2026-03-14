export type SiteCountry = "LT" | "DK";

export const LT_CENTER = { lat: 55.1694, lng: 23.8813 };
export const DK_CENTER = { lat: 56.2639, lng: 9.5018 };

const LT_CITIES = [
  "Vilnius",
  "Kaunas",
  "Klaipėda",
  "Šiauliai",
  "Panevėžys",
  "Alytus",
  "Marijampolė",
  "Mažeikiai",
  "Jonava",
  "Utena",
];

const DK_CITIES = [
  "Copenhagen",
  "Aarhus",
  "Odense",
  "Aalborg",
  "Esbjerg",
  "Randers",
  "Kolding",
  "Horsens",
  "Vejle",
  "Roskilde",
];

export function getSiteCountry(hostname?: string | null): SiteCountry {
  const host = (hostname ?? (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return host.includes(".dk") || host.endsWith("autoloke.dk") ? "DK" : "LT";
}

export function getSiteCenter(country: SiteCountry) {
  return country === "DK" ? DK_CENTER : LT_CENTER;
}

export function getSiteCurrency(country: SiteCountry) {
  return country === "DK" ? "DKK" : "EUR";
}

export function getSiteLocale(country: SiteCountry) {
  return country === "DK" ? "da-DK" : "lt-LT";
}

export function formatMoney(value?: number | null, country: SiteCountry = "LT") {
  if (typeof value !== "number" || !isFinite(value)) return "—";
  return new Intl.NumberFormat(getSiteLocale(country), {
    style: "currency",
    currency: getSiteCurrency(country),
    maximumFractionDigits: 0,
  }).format(value);
}

export function priceShort(value?: number | null, country: SiteCountry = "LT") {
  if (typeof value !== "number" || !isFinite(value)) return "•";
  const suffix = country === "DK" ? "kr" : "€";
  return `${Math.round(value)}${suffix}`;
}

export function normalizeItemCountry(country?: string | null): SiteCountry {
  return String(country || "LT").toUpperCase() === "DK" ? "DK" : "LT";
}

export function citySuggestions(country: SiteCountry) {
  return country === "DK" ? DK_CITIES : LT_CITIES;
}
