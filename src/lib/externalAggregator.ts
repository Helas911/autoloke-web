import type { VehicleCategory } from "@/lib/categories";

export type ExternalSection = "transportas" | "dalys";

export type ExternalListing = {
  id: string;
  title: string;
  priceText?: string;
  city?: string;
  imageUrl?: string;
  url: string;
  source: string;
  section: ExternalSection;
  category?: string;
  year?: string;
  mileage?: string;
  fuel?: string;
  engine?: string;
  power?: string;
  gearbox?: string;
  body?: string;
};

type SourceConfig = {
  key: string;
  label: string;
  searchUrl: (args: { query: string; section: ExternalSection; category?: string }) => string;
  resultLinkPattern?: RegExp;
};

function enc(v: string) {
  return encodeURIComponent(v.trim());
}

function categoryTerm(category?: string) {
  switch (category) {
    case "motociklai":
      return "motociklai";
    case "sunkvezimiai":
      return "sunkvezimiai";
    case "vandensTransportas":
      return "vandens transportas";
    case "zemesUkioTechnika":
      return "zemes ukio technika";
    default:
      return "automobiliai";
  }
}

function sourceConfigs(): SourceConfig[] {
  return [
    {
      key: "autoplius",
      label: "autoplius.lt",
      searchUrl: ({ query, section, category }) => {
        if (section === "dalys") {
          return `https://m.autoplius.lt/skelbimai/automobiliu-dalys-paieska?search_text=${enc(query)}`;
        }
        const base = (() => {
          switch (category) {
            case "motociklai":
              return "https://m.autoplius.lt/skelbimai/motociklai";
            case "sunkvezimiai":
              return "https://m.autoplius.lt/skelbimai/komerciniai-automobiliai";
            case "vandensTransportas":
              return "https://m.autoplius.lt/skelbimai/vandens-transportas";
            case "zemesUkioTechnika":
              return "https://m.autoplius.lt/skelbimai/zemes-ukio-technika";
            default:
              return "https://m.autoplius.lt/skelbimai/naudoti-automobiliai";
          }
        })();
        return `${base}?search_text=${enc(query)}`;
      },
      resultLinkPattern: /https?:\/\/(?:m\.)?autoplius\.lt\/skelbimai\/[^"'\s]+/i,
    },
    {
      key: "autogidas",
      label: "autogidas.lt",
      searchUrl: ({ query, section, category }) => {
        if (section === "dalys") {
          return `https://autogidas.lt/auto-dalys/paieska?keywords=${enc(query)}`;
        }
        const kind = (() => {
          switch (category) {
            case "motociklai":
              return "motociklai";
            case "sunkvezimiai":
              return "sunkvezimiai";
            case "vandensTransportas":
              return "vandens-transportas";
            case "zemesUkioTechnika":
              return "zemes-ukio-technika";
            default:
              return "automobiliai";
          }
        })();
        return `https://autogidas.lt/${kind}/paieska?keywords=${enc(query)}`;
      },
      resultLinkPattern: /https?:\/\/autogidas\.lt\/[^"'\s]*skelbimas[^"'\s]*/i,
    },
    {
      key: "autobilis",
      label: "autobilis.lt",
      searchUrl: ({ query, section, category }) => {
        const q = section === "dalys" ? `${query} auto dalys` : `${query} ${categoryTerm(category)}`;
        return `https://autobilis.lt/?s=${enc(q)}`;
      },
    },
    {
      key: "autosel",
      label: "autosel.lt",
      searchUrl: ({ query, section, category }) => {
        const q = section === "dalys" ? `${query} dalys` : `${query} ${categoryTerm(category)}`;
        return `https://autosel.lt/?s=${enc(q)}`;
      },
    },
    {
      key: "autobonus",
      label: "autobonus.lt",
      searchUrl: ({ query, section, category }) => {
        const q = section === "dalys" ? `${query} auto dalys` : `${query} ${categoryTerm(category)}`;
        return `https://autobonus.lt/?s=${enc(q)}`;
      },
    },
  ];
}

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&euro;|&#8364;/gi, "€");
}

function stripTags(input: string) {
  return decodeHtml(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/href\s*=\s*["'][^"']*["']/gi, " ")
    .replace(/target\s*=\s*["'][^"']*["']/gi, " ")
    .replace(/rel\s*=\s*["'][^"']*["']/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absUrl(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function uniqueByUrl(items: ExternalListing[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function looksLikeListing(url: string, source: SourceConfig) {
  if (!url || url.startsWith("#") || url.startsWith("javascript:")) return false;
  if (source.resultLinkPattern && source.resultLinkPattern.test(url)) return true;
  return /\/\d{4,}|skelb|listing|auto\//i.test(url);
}

function findPrice(text: string) {
  const m = text.match(/(\d[\d\s.,]{2,}\s?(?:€|eur|Eur|EUR))/i);
  return m?.[1]?.replace(/\s+/g, " ").trim();
}

function findYear(text: string) {
  return text.match(/\b(19\d{2}|20\d{2})(?:[-/.]\d{1,2})?\b/)?.[1];
}

function findMileage(text: string) {
  return text.match(/\b\d[\d\s]{2,}\s?km\b/i)?.[0]?.replace(/\s+/g, " ").trim();
}

function findFuel(text: string) {
  return text.match(/Dyzelinas|Benzinas|Elektra|Hibridas|Dujos/i)?.[0];
}

function findGearbox(text: string) {
  return text.match(/Mechanin(?:ė|e)|Automatin(?:ė|e)|CVT/i)?.[0];
}

function findEngine(text: string) {
  return text.match(/\b\d\.\d\s?l\b/i)?.[0];
}

function findPower(text: string) {
  return text.match(/\b\d{2,4}\s?kW\b/i)?.[0];
}

function findCity(text: string) {
  return text.match(/(Vilnius|Kaunas|Klaipėda|Šiauliai|Panevėžys|Alytus|Marijampolė|Jonava|Mažeikiai|Utena|Palanga|Tauragė|Telšiai|Plungė|Kretinga|Rietavas|Raseiniai|Utena|Jurbarkas|Panevezys|Siauliai|Klaipeda|Kauno r\.|Vilniaus r\.)/i)?.[1];
}

function cleanTitle(text: string, sourceLabel: string) {
  let t = stripTags(text)
    .replace(new RegExp(sourceLabel.replace('.', '\\.'), 'ig'), ' ')
    .replace(/Atidaryti originalų skelbimą/ig, ' ')
    .replace(/Naujas langas/ig, ' ')
    .replace(/Žiūrėti/ig, ' ')
    .replace(/Skelbimas/ig, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Prefer concise first sentence/line.
  t = t.split('|')[0].split('•')[0].trim();
  if (t.length > 90) t = t.slice(0, 90).trim();
  return t;
}

function extractListingsFromHtml(html: string, source: SourceConfig, pageUrl: string, section: ExternalSection, category?: string) {
  const items: ExternalListing[] = [];

  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const rawHref = match[1];
    const fullUrl = absUrl(rawHref, pageUrl);
    if (!looksLikeListing(fullUrl, source)) continue;

    const outer = match[0];
    const surrounding = html.slice(Math.max(0, match.index - 1200), Math.min(html.length, match.index + outer.length + 1600));
    const text = stripTags(`${outer} ${surrounding}`);
    const title = cleanTitle(text, source.label);
    if (!title || title.length < 4) continue;

    const imageMatch = surrounding.match(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/i);
    const imageUrl = imageMatch ? absUrl(imageMatch[1], pageUrl) : undefined;
    const priceText = findPrice(text);

    items.push({
      id: `${source.key}:${fullUrl}`,
      title,
      priceText,
      city: findCity(text),
      imageUrl,
      url: fullUrl,
      source: source.label,
      section,
      category,
      year: findYear(text),
      mileage: findMileage(text),
      fuel: findFuel(text),
      engine: findEngine(text),
      power: findPower(text),
      gearbox: findGearbox(text),
    });
  }

  const cleaned = uniqueByUrl(items).filter((item) => {
    const low = item.title.toLowerCase();
    if (low.includes('prideti skelbima') || low.includes('prisijungti') || low.includes('registruotis')) return false;
    return true;
  });

  return cleaned.slice(0, 8);
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "lt-LT,lt;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    next: { revalidate: 60 * 15 },
  });
  if (!res.ok) throw new Error(`fetch-failed-${res.status}`);
  return await res.text();
}

function buildQueryVariants(query: string) {
  const normalized = query.replace(/\s+/g, ' ').trim();
  const parts = normalized.split(' ').filter(Boolean);
  const variants = [normalized];
  if (parts.length >= 3) variants.push(parts.slice(0, 2).join(' '));
  if (parts.length >= 2) variants.push(parts[0]);
  return [...new Set(variants.filter((v) => v.length >= 2))];
}

async function fetchOne(source: SourceConfig, query: string, section: ExternalSection, category?: string) {
  const variants = buildQueryVariants(query);
  for (const variant of variants) {
    const url = source.searchUrl({ query: variant, section, category });
    try {
      const html = await fetchHtml(url);
      const parsed = extractListingsFromHtml(html, source, url, section, category)
        .filter((item) => !variant || item.title.toLowerCase().includes(variant.split(' ')[0].toLowerCase()));
      if (parsed.length) return parsed;
    } catch {
      // try broader variant
    }
  }
  return [] as ExternalListing[];
}

export async function searchExternalListings(args: {
  query: string;
  section: ExternalSection;
  category?: VehicleCategory | "dalys" | string;
}) {
  const cleanQuery = args.query.trim();
  if (!cleanQuery) return [] as ExternalListing[];

  const configs = sourceConfigs();
  const settled = await Promise.all(configs.map((source) => fetchOne(source, cleanQuery, args.section, args.category)));

  return uniqueByUrl(settled.flat()).slice(0, 20);
}
