
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

type SearchArgs = {
  query: string;
  section: ExternalSection;
  category?: VehicleCategory | "dalys" | string;
  brand?: string;
  model?: string;
  city?: string;
};

type SourceConfig = {
  key: string;
  label: string;
  searchUrl: (args: ResolvedSearchArgs) => string;
  parse: (html: string, pageUrl: string, source: SourceConfig, args: ResolvedSearchArgs) => ExternalListing[];
};

type ResolvedSearchArgs = SearchArgs & {
  brand: string;
  model: string;
  city: string;
  query: string;
};

const CITY_RE = /(Vilnius|Kaunas|Klaipėda|Klaipeda|Šiauliai|Siauliai|Panevėžys|Panevezys|Alytus|Marijampolė|Marijampole|Jonava|Mažeikiai|Mazeikiai|Utena|Palanga|Tauragė|Taurage|Telšiai|Telsiai|Plungė|Plunge|Kretinga|Rietavas|Raseiniai|Ukmergė|Ukmerge|Jurbarkas|Kelmė|Kelme|Jonava|Prienai|Anykščiai|Anyksciai|Elektrėnai|Elektrenai|Kėdainiai|Kedainiai|Radviliškis|Radviliskis|Šilalė|Silale|Šilutė|Silute|Skuodas|Visaginas|Druskininkai|Varėna|Varena|Ukmergė|Ukmerge)/i;
const DEFAULT_LIMIT_PER_SOURCE = 24;

function enc(v: string) {
  return encodeURIComponent(v.trim());
}

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&euro;|&#8364;/gi, "€");
}

function stripTags(input: string) {
  return decodeHtml(input)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWhitespace(input: string) {
  return decodeHtml(input).replace(/\s+/g, " ").trim();
}

function absUrl(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function cleanTitle(input: string) {
  const text = normalizeWhitespace(stripTags(input))
    .replace(/^Žiūrėti\s*/i, "")
    .replace(/^Plačiau\s*/i, "")
    .replace(/^Skaityti daugiau\s*/i, "")
    .replace(/^Peržiūrėti\s*/i, "")
    .replace(/^Parduodu\s*/i, "")
    .replace(/^Parduodama\s*/i, "")
    .replace(/^Skelbimas\s*/i, "")
    .replace(/\b\d[\d\s]{0,12}(?:[.,]\d{2})?\s*(?:€|eur)\s*\/?\s*m[ėe]n\.?\b/gi, "")
    .replace(/\bFinansavimo sąlygos.*$/i, "")
    .replace(/\bŠi skaičiuoklė.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (/prisijung|registr|slapuk|naujien|kontakt|pagalba|reklam|taisyk|privatum|kainos/i.test(text) && text.length < 80) return "";
  if (/(?:^| )originalas(?: |$)|atidaryti original/i.test(text)) return "";
  return text.slice(0, 140);
}

function findAttr(context: string, attrName: string) {
  const m = context.match(new RegExp(`${attrName}=["']([^"']+)["']`, "i"));
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
  if (/logo|sprite|icon|avatar|favicon|placeholder|blank\.gif|data:image\/svg\+xml/i.test(clean)) return undefined;
  return clean;
}

function extractImg(context: string, baseUrl: string) {
  const metaOg = context.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const metaTw = context.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

  for (const candidate of [metaOg, metaTw]) {
    const clean = cleanupImageUrl(candidate, baseUrl);
    if (clean) return clean;
  }

  const tagMatches = context.match(/<(img|source)\b[^>]*>/gi) || [];
  for (const tag of tagMatches) {
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

function parseEuroAmount(raw: string) {
  const normalized = raw
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/(?:€|eur)$/i, "")
    .trim();

  const numeric = normalized
    .replace(/\s+/g, "")
    .replace(/,(\d{2})$/, "")
    .replace(/\.(\d{2})$/, "")
    .replace(/[^\d]/g, "");

  const value = Number(numeric);
  if (!Number.isFinite(value)) return null;
  return value;
}

function formatEuroAmount(value: number) {
  return `${new Intl.NumberFormat("lt-LT").format(value)} €`;
}

function extractPrice(context: string) {
  const cleaned = stripTags(context)
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return undefined;

  const withoutMonthly = cleaned
    .replace(/\b\d[\d\s]{0,12}(?:[.,]\d{2})?\s*(?:€|eur)\s*\/?\s*m[ėe]n\.?\b/gi, " ")
    .replace(/\bnuo\s+\d[\d\s]{0,12}(?:[.,]\d{2})?\s*(?:€|eur)\s*\/?\s*m[ėe]n\.?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const candidateRegex = /\b(\d{1,3}(?:\s\d{3})+|\d{3,6})(?:[.,]\d{2})?\s*(?:€|eur)\b/gi;
  const candidates: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = candidateRegex.exec(withoutMonthly))) {
    const value = parseEuroAmount(match[0]);
    if (value === null) continue;
    if (value < 100 || value > 300000) continue;
    candidates.push(value);
  }

  if (!candidates.length) return undefined;

  return formatEuroAmount(candidates[0]);
}

function extractCity(context: string) {
  const cleaned = stripTags(context);
  return cleaned.match(CITY_RE)?.[1];
}

function textContainsTerms(text: string, args: ResolvedSearchArgs) {
  const hay = normalizeForMatch(text);
  const brand = normalizeForMatch(args.brand);
  const model = normalizeForMatch(args.model);
  const query = normalizeForMatch(args.query);

  if (brand && !hay.includes(brand)) return false;
  if (model && !hay.includes(model)) return false;

  if (!brand && !model && query) {
    const terms = query.split(" ").filter((t) => t.length > 1).slice(0, 3);
    if (!terms.every((t) => hay.includes(t))) return false;
  }
  return true;
}

function parseQueryParts(args: SearchArgs): ResolvedSearchArgs {
  const words = args.query.trim().split(/\s+/).filter(Boolean);
  const brand = (args.brand || words[0] || "").trim();
  let model = (args.model || "").trim();

  if (!model && words.length > 1) {
    model = words.slice(1, 3).join(" ").trim();
  }

  return {
    ...args,
    query: args.query.trim(),
    brand,
    model,
    city: (args.city || "").trim(),
  };
}

function buildSkelbiuUrl(args: ResolvedSearchArgs) {
  const b = slugify(args.brand);
  const m = slugify(args.model);
  if (args.section === "transportas" && b && m) return `https://www.skelbiu.lt/skelbimai/transportas/automobiliai/${b}/${m}/`;
  if (args.section === "transportas" && b) return `https://www.skelbiu.lt/skelbimai/transportas/automobiliai/${b}/`;
  return `https://www.skelbiu.lt/skelbimai/?keywords=${enc(args.query)}&search=1`;
}

function buildAutopliusUrl(args: ResolvedSearchArgs) {
  const b = slugify(args.brand);
  const m = slugify(args.model);
  if (args.section === "transportas" && b && m) return `https://m.autoplius.lt/skelbimai/naudoti-automobiliai/${b}/${m}`;
  if (args.section === "transportas" && b) return `https://m.autoplius.lt/skelbimai/naudoti-automobiliai/${b}?qt=${enc(args.query)}`;
  if (args.section === "dalys") return `https://m.autoplius.lt/skelbimai/automobiliu-dalys?search_text=${enc(args.query)}`;
  return `https://m.autoplius.lt/skelbimai/naudoti-automobiliai?search_text=${enc(args.query)}`;
}

function buildAutogidasUrl(args: ResolvedSearchArgs) {
  const b = slugify(args.brand);
  const m = slugify(args.model);
  if (args.section === "transportas" && b && m) return `https://autogidas.lt/skelbimai/automobiliai/${b}/${m}/`;
  if (args.section === "transportas" && b) return `https://autogidas.lt/skelbimai/automobiliai/${b}/`;
  if (args.section === "dalys") return `https://autogidas.lt/auto-dalys/paieska?keywords=${enc(args.query)}`;
  return `https://autogidas.lt/skelbimai/automobiliai/?keywords=${enc(args.query)}`;
}

function genericContext(html: string, index: number, len: number, before = 900, after = 1400) {
  const start = Math.max(0, index - before);
  const end = Math.min(html.length, index + len + after);
  return html.slice(start, end);
}

function buildListing(source: SourceConfig, pageUrl: string, args: ResolvedSearchArgs, url: string, title: string, context: string): ExternalListing | null {
  const fullUrl = absUrl(url, pageUrl);
  if (!/^https?:\/\//i.test(fullUrl)) return null;
  if (!/\/skelbim/i.test(fullUrl) && source.key !== "autoplius") return null;

  const clean = cleanTitle(title);
  if (!clean || clean.length < 4) return null;
  if (!textContainsTerms(`${clean} ${stripTags(context)}`, args)) return null;

  return {
    id: `${source.key}:${fullUrl}`,
    title: clean,
    priceText: extractPrice(context),
    city: extractCity(context),
    imageUrl: extractImg(context, pageUrl),
    url: fullUrl,
    source: source.label,
    section: args.section,
    category: args.category,
  };
}

function parseSkelbiu(html: string, pageUrl: string, source: SourceConfig, args: ResolvedSearchArgs) {
  const results: ExternalListing[] = [];
  const seen = new Set<string>();

  const re = /<a\b[^>]*href=["']([^"']*\/skelbimai\/[^"']+?-\d+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) && results.length < DEFAULT_LIMIT_PER_SOURCE) {
    const url = match[1];
    const inner = match[2];
    const context = genericContext(html, match.index, match[0].length);
    const listing = buildListing(source, pageUrl, args, url, inner, context);
    if (!listing || seen.has(listing.url)) continue;
    seen.add(listing.url);
    results.push(listing);
  }

  return results;
}

function parseAutogidas(html: string, pageUrl: string, source: SourceConfig, args: ResolvedSearchArgs) {
  const results: ExternalListing[] = [];
  const seen = new Set<string>();

  const re = /<a\b[^>]*href=["']([^"']*\/skelbimas\/[^"']+?\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) && results.length < DEFAULT_LIMIT_PER_SOURCE) {
    const url = match[1];
    const inner = match[2];
    const context = genericContext(html, match.index, match[0].length);
    const listing = buildListing(source, pageUrl, args, url, inner, context);
    if (!listing || seen.has(listing.url)) continue;
    seen.add(listing.url);
    results.push(listing);
  }

  return results;
}

function parseAutoplius(html: string, pageUrl: string, source: SourceConfig, args: ResolvedSearchArgs) {
  const results: ExternalListing[] = [];
  const seen = new Set<string>();

  const pushListing = (url: string, title: string, context: string) => {
    const fullUrl = absUrl(url, pageUrl).replace("://autoplius.lt", "://m.autoplius.lt");
    if (!/\/skelbimai\/.+-\d+\.html(?:\?|#|$)/i.test(fullUrl)) return;
    if (/\/naudoti-automobiliai\/[^/]+\/?$/i.test(fullUrl)) return;
    const listing = buildListing(source, pageUrl, args, fullUrl, title, context);
    if (!listing || seen.has(listing.url)) return;

    const priceFromTitle = title.match(/\b\d{1,3}(?:\s\d{3})*\s*(?:€|eur)\b/i)?.[0];
    if (priceFromTitle) {
      const value = parseEuroAmount(priceFromTitle);
      if (value && value >= 100 && value <= 300000) {
        listing.priceText = formatEuroAmount(value);
      }
    }

    if (!listing.imageUrl) {
      const imgBlock = context.match(/<img\b[^>]+(?:src|data-src|data-original)=["'][^"']+["'][^>]*>/i)?.[0] || "";
      const img = extractImg(imgBlock || context, pageUrl);
      if (img) listing.imageUrl = img;
    }

    seen.add(listing.url);
    results.push(listing);
  };

  const itemRe = /<a\b[^>]*href=["']([^"']*\/skelbimai\/[^"']+?-\d+\.html[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(html)) && results.length < DEFAULT_LIMIT_PER_SOURCE) {
    const href = match[1];
    const anchorText = cleanTitle(match[2]);
    const context = genericContext(html, match.index, match[0].length, 800, 1800);
    const mergedTitle = cleanTitle(`${anchorText} ${stripTags(context)}`);
    pushListing(href, mergedTitle || anchorText || stripTags(context), context);
  }

  if (results.length < 6) {
    const compactRe = /<a\b[^>]*href=["']([^"']*\/skelbimai\/[^"']+?-\d+\.html[^"']*)["'][^>]*>\s*\[?\s*\d+\s*([^\]]+?)\s*\]?<\/a>/gi;
    while ((match = compactRe.exec(html)) && results.length < DEFAULT_LIMIT_PER_SOURCE) {
      const href = match[1];
      const context = genericContext(html, match.index, match[0].length, 200, 500);
      pushListing(href, match[2], context);
    }
  }

  return results;
}

function sourceConfigs(): SourceConfig[] {
  return [
    { key: "skelbiu", label: "skelbiu.lt", searchUrl: buildSkelbiuUrl, parse: parseSkelbiu },
    { key: "autoplius", label: "autoplius.lt", searchUrl: buildAutopliusUrl, parse: parseAutoplius },
    { key: "autogidas", label: "autogidas.lt", searchUrl: buildAutogidasUrl, parse: parseAutogidas },
  ];
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; AutolokeBot/1.0; +https://autoloke.lt)",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "lt,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    redirect: "follow",
    next: { revalidate: 60 * 15 },
  });

  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  return await res.text();
}

async function enrichMissingImages(items: ExternalListing[]) {
  const need = items.filter((i) => !i.imageUrl).slice(0, 6);

  await Promise.all(
    need.map(async (item) => {
      try {
        const html = await fetchText(item.url);
        const img = extractImg(html, item.url);
        if (img) item.imageUrl = img;
      } catch {
        // ignore
      }
    })
  );

  return items;
}

async function fetchOne(source: SourceConfig, args: ResolvedSearchArgs) {
  const url = source.searchUrl(args);

  try {
    const html = await fetchText(url);
    const parsed = source.parse(html, url, source, args);
    if (parsed.length) {
      return await enrichMissingImages(parsed);
    }
    return [] as ExternalListing[];
  } catch {
    return [] as ExternalListing[];
  }
}

export async function searchExternalListings(args: SearchArgs) {
  const resolved = parseQueryParts(args);
  if (!resolved.query || resolved.query.length < 2) return [] as ExternalListing[];

  const settled = await Promise.all(sourceConfigs().map((source) => fetchOne(source, resolved)));
  const deduped: ExternalListing[] = [];
  const seen = new Set<string>();

  for (const item of settled.flat()) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    deduped.push(item);
  }

  return deduped.slice(0, 24);
}
