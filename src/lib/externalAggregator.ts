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

function sourceConfigs(): SourceConfig[] {
  return [
    {
      key: "skelbiu",
      label: "skelbiu.lt",
      hostPattern: /skelbiu\.lt/i,
      searchUrl: ({ query }) => `https://www.skelbiu.lt/skelbimai/?keywords=${enc(query)}`,
    },
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
  ];
}

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#160;/gi, " ");
}

function stripTags(input: string) {
  return decodeHtml(input)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWhitespace(input: string) {
  return decodeHtml(stripTags(input)).replace(/\s+/g, " ").trim();
}

function absUrl(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function cleanTitle(input: string) {
  const text = normalizeWhitespace(input)
    .replace(/^Žiūrėti\s*/i, "")
    .replace(/^Plačiau\s*/i, "")
    .replace(/^Peržiūrėti\s*/i, "")
    .replace(/^Atidaryti\s*/i, "")
    .replace(/^Skelbimas\s*/i, "")
    .trim();

  if (!text) return "";
  if (text.length < 4) return "";
  if (/^originalas/i.test(text)) return "";
  if (/prisijungti|registruotis|įdėti skelbimą|idet[iy] skelbim|paieška|paieska/i.test(text) && text.length < 40) return "";
  if (/email protected|protected/i.test(text)) return "";
  return text.slice(0, 140);
}

function looksLikeListingUrl(url: string, source: SourceConfig) {
  if (!url || url.startsWith("#") || url.startsWith("javascript:")) return false;
  if (!source.hostPattern.test(url)) return false;

  try {
    const parsed = new URL(url);
    if (/\/skelbimai\/?$/.test(parsed.pathname) && parsed.search) return false;
    if (/\/paieska\/?$/.test(parsed.pathname) && parsed.search) return false;
  } catch {}

  if (/\/paieska|\/search|\/prisijungti|\/registr|\/kontakt|\/prideti|\/pridėti|\/about|\/terms|\/privacy|\/category\//i.test(url)) return false;
  if (/autobonus|autosel|autobilis/i.test(url)) return false;
  return /\/skelbimai\/|\/skelbimas\/|\/naudoti-automobiliai\/|\/automobiliai\/|\/auto-dalys\/|\/komerciniai-automobiliai\/|\/motociklai\/|\/ad\//i.test(url);
}

function extractPrice(context: string) {
  const matches = context.match(/(\d[\d\s.,]{1,}\s?(?:€|eur|Eur|EUR|kr))/gi) || [];
  const usable = matches
    .map((m) => m.replace(/\s+/g, " ").trim())
    .filter((m) => /\d/.test(m) && !/^\d{1,2}\s?(€|eur)$/i.test(m));
  return usable[0];
}

function extractCity(context: string) {
  const normalized = normalizeWhitespace(context);
  const m = normalized.match(/\b(Vilnius|Kaunas|Klaipėda|Klaipeda|Šiauliai|Siauliai|Panevėžys|Panevezys|Alytus|Marijampolė|Marijampole|Jonava|Utena|Palanga|Tauragė|Taurage|Telšiai|Telsiai|Plungė|Plunge|Kretinga|Rietavas|Raseiniai|Ukmergė|Ukmerge|Jurbarkas|Mažeikiai|Mazeikiai)\b/i);
  return m?.[1];
}

function pickBestSrc(srcset: string) {
  const candidates = srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
  return candidates[candidates.length - 1];
}

function cleanupImageUrl(url: string | undefined, baseUrl: string) {
  if (!url) return undefined;
  const clean = absUrl(decodeHtml(url).trim(), baseUrl);
  if (!/^https?:\/\//i.test(clean)) return undefined;
  if (/logo|sprite|icon|avatar|favicon|placeholder|blank\.gif|data:image\/svg\+xml|googleads|doubleclick/i.test(clean)) return undefined;
  return clean;
}

function findAttr(context: string, attrName: string) {
  const m = context.match(new RegExp(`${attrName}=["']([^"']+)["']`, "i"));
  return m?.[1];
}

function extractImg(context: string, baseUrl: string) {
  const metaCandidates = [
    context.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1],
    context.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1],
  ].filter(Boolean) as string[];

  for (const candidate of metaCandidates) {
    const clean = cleanupImageUrl(candidate, baseUrl);
    if (clean) return clean;
  }

  const imgTagMatches = context.match(/<(img|source)\b[^>]*>/gi) || [];
  for (const tag of imgTagMatches) {
    const srcset = findAttr(tag, "srcset") || findAttr(tag, "data-srcset");
    const src =
      (srcset ? pickBestSrc(srcset) : undefined) ||
      findAttr(tag, "data-src") ||
      findAttr(tag, "data-lazy-src") ||
      findAttr(tag, "data-original") ||
      findAttr(tag, "src");
    const clean = cleanupImageUrl(src, baseUrl);
    if (clean) return clean;
  }

  return undefined;
}

function addResult(results: ExternalListing[], seen: Set<string>, source: SourceConfig, item: Omit<ExternalListing, "id" | "source" | "section" | "category">, section: ExternalSection, category?: string) {
  const fullUrl = absUrl(item.url, source.searchUrl({ query: "", section, category }));
  if (!looksLikeListingUrl(fullUrl, source)) return;
  if (seen.has(fullUrl)) return;

  const title = cleanTitle(item.title);
  if (!title) return;

  seen.add(fullUrl);
  results.push({
    id: `${source.key}:${fullUrl}`,
    title,
    priceText: item.priceText?.replace(/\s+/g, " ").trim(),
    city: item.city?.trim(),
    imageUrl: item.imageUrl,
    url: fullUrl,
    source: source.label,
    section,
    category,
  });
}

function parseSkelbiu(html: string, pageUrl: string, source: SourceConfig, section: ExternalSection, category?: string) {
  const results: ExternalListing[] = [];
  const seen = new Set<string>();
  const anchorRe = /<a\b[^>]*href=["']([^"']*\/skelbimai\/[^"']+)["'][^>]*>([\s\S]{60,2500}?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRe.exec(html)) && results.length < 12) {
    const href = absUrl(match[1], pageUrl);
    if (/\?keywords=/.test(href)) continue;
    const inner = match[2];
    const title =
      inner.match(/<(h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ||
      inner.match(/title=["']([^"']+)["']/i)?.[1] ||
      inner;
    const imageUrl = extractImg(inner, pageUrl);
    const priceText = extractPrice(inner);
    const city = extractCity(inner);
    addResult(results, seen, source, { title, url: href, imageUrl, priceText, city }, section, category);
  }

  return results;
}

function parseAutoplius(html: string, pageUrl: string, source: SourceConfig, section: ExternalSection, category?: string) {
  const results: ExternalListing[] = [];
  const seen = new Set<string>();
  const blockRe = /<(article|div)\b[^>]*>([\s\S]{120,3200}?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(html)) && results.length < 12) {
    const block = match[2];
    const href = block.match(/href=["']([^"']*(?:\/skelbimai\/|\/naudoti-automobiliai\/)[^"']+)["']/i)?.[1];
    if (!href) continue;
    const title =
      block.match(/<(h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ||
      block.match(/title=["']([^"']+)["']/i)?.[1] ||
      block;
    const imageUrl = extractImg(block, pageUrl);
    const priceText = extractPrice(block);
    const city = extractCity(block);
    addResult(results, seen, source, { title, url: href, imageUrl, priceText, city }, section, category);
  }

  return results;
}

function parseAutogidas(html: string, pageUrl: string, source: SourceConfig, section: ExternalSection, category?: string) {
  const results: ExternalListing[] = [];
  const seen = new Set<string>();
  const blockRe = /<(article|div|li)\b[^>]*>([\s\S]{120,3200}?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(html)) && results.length < 12) {
    const block = match[2];
    const href = block.match(/href=["']([^"']*(?:\/skelbimas\/|\/automobiliai\/|\/auto-dalys\/)[^"']+)["']/i)?.[1];
    if (!href) continue;
    const title =
      block.match(/<(h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ||
      block.match(/title=["']([^"']+)["']/i)?.[1] ||
      block;
    const imageUrl = extractImg(block, pageUrl);
    const priceText = extractPrice(block);
    const city = extractCity(block);
    addResult(results, seen, source, { title, url: href, imageUrl, priceText, city }, section, category);
  }

  return results;
}

function parseBySource(html: string, source: SourceConfig, pageUrl: string, section: ExternalSection, category?: string) {
  switch (source.key) {
    case "skelbiu":
      return parseSkelbiu(html, pageUrl, source, section, category);
    case "autoplius":
      return parseAutoplius(html, pageUrl, source, section, category);
    case "autogidas":
      return parseAutogidas(html, pageUrl, source, section, category);
    default:
      return [];
  }
}

async function enrichMissingImages(items: ExternalListing[]) {
  const missing = items.filter((item) => !item.imageUrl).slice(0, 5);

  await Promise.all(
    missing.map(async (item) => {
      try {
        const res = await fetch(item.url, {
          headers: {
            "user-agent": "Mozilla/5.0 (compatible; AutolokeBot/1.0; +https://autoloke.lt)",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          next: { revalidate: 60 * 60 * 6 },
        });
        if (!res.ok) return;
        const html = await res.text();
        item.imageUrl = extractImg(html, item.url);
        if (!item.priceText) item.priceText = extractPrice(html);
        if (!item.city) item.city = extractCity(html);
      } catch {}
    })
  );

  return items;
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

    if (!res.ok) return [] as ExternalListing[];

    const html = await res.text();
    const parsed = parseBySource(html, source, url, section, category);
    return enrichMissingImages(parsed);
  } catch {
    return [] as ExternalListing[];
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

  const merged = settled.flat();

  const dedup = new Map<string, ExternalListing>();
  for (const item of merged) {
    if (!dedup.has(item.url)) dedup.set(item.url, item);
  }

  return Array.from(dedup.values()).filter((item) => !!item.title).slice(0, 24);
}
