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
  isFallback?: boolean;
};

type SourceConfig = {
  key: string;
  label: string;
  searchUrl: (args: { query: string; section: ExternalSection; category?: string }) => string;
  hostPattern: RegExp;
};

function enc(v: string) {
  return encodeURIComponent(v.trim());
}

function categoryTerm(category?: string) {
  switch (category) {
    case "motociklai":
      return "motociklai";
    case "sunkvezimiai":
      return "sunkvežimiai";
    case "vandensTransportas":
      return "vandens transportas";
    case "zemesUkioTechnika":
      return "žemės ūkio technika";
    default:
      return "automobiliai";
  }
}

function sourceConfigs(): SourceConfig[] {
  return [
    {
      key: "autoplius",
      label: "autoplius.lt",
      hostPattern: /autoplius\.lt/i,
      searchUrl: ({ query, section, category }) => {
        if (section === "dalys") {
          return `https://m.autoplius.lt/skelbimai/automobiliu-dalys?search_text=${enc(query)}`;
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
    },
    {
      key: "autogidas",
      label: "autogidas.lt",
      hostPattern: /autogidas\.lt/i,
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
    },
    {
      key: "autobilis",
      label: "autobilis.lt",
      hostPattern: /autobilis\.lt/i,
      searchUrl: ({ query, section, category }) => {
        const q = section === "dalys" ? `${query} auto dalys` : `${query} ${categoryTerm(category)}`;
        return `https://autobilis.lt/?s=${enc(q)}`;
      },
    },
    {
      key: "autosel",
      label: "autosel.lt",
      hostPattern: /autosel\.lt/i,
      searchUrl: ({ query, section, category }) => {
        const q = section === "dalys" ? `${query} dalys` : `${query} ${categoryTerm(category)}`;
        return `https://autosel.lt/?s=${enc(q)}`;
      },
    },
    {
      key: "autobonus",
      label: "autobonus.lt",
      hostPattern: /autobonus\.lt/i,
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
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(input: string) {
  return decodeHtml(input)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
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

function normalizeWhitespace(input: string) {
  return decodeHtml(input).replace(/\s+/g, " ").trim();
}

function cleanTitle(input: string) {
  const text = normalizeWhitespace(stripTags(input))
    .replace(/^Žiūrėti\s*/i, "")
    .replace(/^Plačiau\s*/i, "")
    .replace(/^Skaityti daugiau\s*/i, "")
    .replace(/^Peržiūrėti\s*/i, "")
    .replace(/^(Parduodama|Parduodu)\s*/i, "")
    .trim();

  if (!text) return "";
  if (/href\s*=|src\s*=|class\s*=|target\s*=|onclick\s*=/i.test(text)) return "";
  if (/prideti skelbima|pridėti skelbimą|registruotis|prisijungti|skelbimu|paieska/i.test(text) && text.length < 35) return "";
  return text.slice(0, 120);
}

function looksLikeListingUrl(url: string, source: SourceConfig) {
  if (!url || url.startsWith("#") || url.startsWith("javascript:")) return false;
  if (!source.hostPattern.test(url)) return false;
  if (/\/paieska|\/search|\/prisijungti|\/registr|\/kontakt|\/prideti|\/pridėti|\/about|\/terms|\/privacy/i.test(url)) return false;
  return /skelb|naudoti|automobil|motocikl|komerc|transport|dalys|auto\/|\/\d{4,}|\/ad\//i.test(url);
}

function extractPrice(context: string) {
  const m = context.match(/(\d[\d\s.,]{2,}\s?(?:€|eur|Eur|EUR|kr))/i);
  return m?.[1]?.replace(/\s+/g, " ").trim();
}

function extractCity(context: string) {
  const m = context.match(/(Vilnius|Kaunas|Klaipėda|Siauliai|Šiauliai|Panevėžys|Panevezys|Alytus|Marijampolė|Marijampole|Jonava|Mažeikiai|Mazeikiai|Utena|Palanga|Tauragė|Taurage|Telšiai|Telsiai|Plungė|Plunge|Kretinga|Rietavas|Raseiniai|Ukmergė|Ukmerge|Jurbarkas)/i);
  return m?.[1];
}

function extractImg(context: string, baseUrl: string) {
  const m = context.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
  return m ? absUrl(m[1], baseUrl) : undefined;
}

function pushResult(results: ExternalListing[], seen: Set<string>, source: SourceConfig, url: string, title: string, context: string, pageUrl: string, section: ExternalSection, category?: string) {
  const fullUrl = absUrl(url, pageUrl);
  if (!looksLikeListingUrl(fullUrl, source)) return;
  if (seen.has(fullUrl)) return;

  const clean = cleanTitle(title || context);
  if (!clean || clean.length < 4) return;

  seen.add(fullUrl);
  results.push({
    id: `${source.key}:${fullUrl}`,
    title: clean,
    priceText: extractPrice(context),
    city: extractCity(context),
    imageUrl: extractImg(context, pageUrl),
    url: fullUrl,
    source: source.label,
    section,
    category,
  });
}

function extractListingsFromHtml(html: string, source: SourceConfig, pageUrl: string, section: ExternalSection, category?: string) {
  const results: ExternalListing[] = [];
  const seen = new Set<string>();
  const cleanedHtml = html.replace(/\n/g, " ");

  // Prefer anchor inner text instead of surrounding HTML.
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRe.exec(cleanedHtml)) && results.length < 12) {
    const href = match[1];
    const inner = match[2];
    const title = cleanTitle(inner);
    if (!title) continue;

    const start = Math.max(0, match.index - 300);
    const end = Math.min(cleanedHtml.length, match.index + match[0].length + 500);
    const context = cleanedHtml.slice(start, end);

    pushResult(results, seen, source, href, title, context, pageUrl, section, category);
  }

  // Fallback for sites where title is in heading nearby.
  if (results.length < 6) {
    const cardRe = /<(article|div|li)\b[^>]*>([\s\S]{120,2500}?)<\/\1>/gi;
    while ((match = cardRe.exec(cleanedHtml)) && results.length < 12) {
      const block = match[2];
      const href = (block.match(/href=["']([^"']+)["']/i) || [])[1];
      if (!href) continue;

      const heading = (block.match(/<(h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/i) || [])[2]
        || (block.match(/class=["'][^"']*(?:title|name|model)[^"']*["'][^>]*>([\s\S]*?)</i) || [])[1]
        || "";
      const title = cleanTitle(heading || block);
      if (!title) continue;

      pushResult(results, seen, source, href, title, block, pageUrl, section, category);
    }
  }

  return results;
}

async function fetchOne(source: SourceConfig, query: string, section: ExternalSection, category?: string) {
  const url = source.searchUrl({ query, section, category });
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AutolokeBot/1.0; +https://autoloke.lt)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 60 * 30 },
    });

    if (!res.ok) {
      return [{
        id: `${source.key}:fallback:${url}`,
        title: `${query} – ${source.label}`,
        url,
        source: source.label,
        section,
        category,
        isFallback: true,
      }] satisfies ExternalListing[];
    }

    const html = await res.text();
    const parsed = extractListingsFromHtml(html, source, url, section, category);
    if (parsed.length) return parsed;

    return [{
      id: `${source.key}:fallback:${url}`,
      title: `${query} – ${source.label}`,
      url,
      source: source.label,
      section,
      category,
      isFallback: true,
    }] satisfies ExternalListing[];
  } catch {
    return [{
      id: `${source.key}:fallback:${url}`,
      title: `${query} – ${source.label}`,
      url,
      source: source.label,
      section,
      category,
      isFallback: true,
    }] satisfies ExternalListing[];
  }
}

export async function searchExternalListings(args: {
  query: string;
  section: ExternalSection;
  category?: VehicleCategory | "dalys" | string;
}) {
  const cleanQuery = args.query.trim();
  if (!cleanQuery) return [] as ExternalListing[];

  const configs = sourceConfigs();
  const settled = await Promise.all(
    configs.map((source) => fetchOne(source, cleanQuery, args.section, args.category))
  );

  return settled.flat().slice(0, 24);
}
