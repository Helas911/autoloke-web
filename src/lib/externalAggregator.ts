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
  listingPathHints?: RegExp[];
};

type Candidate = {
  url: string;
  title?: string;
  priceText?: string;
  city?: string;
  imageUrl?: string;
  score: number;
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
      hostPattern: /(^|\.)autoplius\.lt$/i,
      listingPathHints: [/\/skelbimai\//i, /-\d+\.html?$/i],
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
      hostPattern: /(^|\.)autogidas\.lt$/i,
      listingPathHints: [/\/skelbimas/i, /\/automobiliai\//i, /\/motociklai\//i, /-\d+\.html?$/i],
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
      hostPattern: /(^|\.)autobilis\.lt$/i,
      listingPathHints: [/\/skelbimas/i, /\/automobilis/i, /\/motociklas/i, /\/naudotas/i, /-\d+\/?$/i],
      searchUrl: ({ query, section, category }) => {
        const q = section === "dalys" ? `${query} auto dalys` : `${query} ${categoryTerm(category)}`;
        return `https://autobilis.lt/?s=${enc(q)}`;
      },
    },
    {
      key: "autosel",
      label: "autosel.lt",
      hostPattern: /(^|\.)autosel\.lt$/i,
      listingPathHints: [/\/skelbimas/i, /\/transportas/i, /-\d+\/?$/i],
      searchUrl: ({ query, section, category }) => {
        const q = section === "dalys" ? `${query} dalys` : `${query} ${categoryTerm(category)}`;
        return `https://autosel.lt/?s=${enc(q)}`;
      },
    },
    {
      key: "autobonus",
      label: "autobonus.lt",
      hostPattern: /(^|\.)autobonus\.lt$/i,
      listingPathHints: [/\/skelbimas/i, /\/transportas/i, /-\d+\/?$/i],
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

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  const attrRe = /([:\w-]+)\s*=\s*(["'])(.*?)\2/gi;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(tag))) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[3]);
  }
  return attrs;
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
  const clean = absUrl(url.trim(), baseUrl);
  if (!/^https?:\/\//i.test(clean)) return undefined;
  if (/logo|sprite|icon|avatar|favicon|placeholder|blank\.gif|base64|data:image\/svg\+xml/i.test(clean)) return undefined;
  return clean;
}

function imageFromTag(tag: string, baseUrl: string) {
  const attrs = parseAttributes(tag);
  const srcset = attrs["srcset"] || attrs["data-srcset"];
  const src =
    (srcset ? pickBestSrc(srcset) : undefined) ||
    attrs["data-src"] ||
    attrs["data-lazy-src"] ||
    attrs["data-original"] ||
    attrs["data-image"] ||
    attrs["src"];
  return cleanupImageUrl(src, baseUrl);
}

function extractMetaImage(html: string, baseUrl: string) {
  const metaRe = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRe.exec(html))) {
    const attrs = parseAttributes(match[0]);
    const key = `${attrs.property || ""}|${attrs.name || ""}`.toLowerCase();
    if (/(^|\|)(og:image|twitter:image)(\||$)/i.test(key)) {
      const img = cleanupImageUrl(attrs.content, baseUrl);
      if (img) return img;
    }
  }
  return undefined;
}

function extractPrice(context: string) {
  const text = stripTags(context);
  const patterns = [
    /(\d[\d\s.]{2,})\s?(€|eur|Eur|EUR)/,
    /(€)\s?(\d[\d\s.]{2,})/,
    /(\d[\d\s.]{2,})\s?(kr|KR|Kč|zl)/,
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (!m) continue;
    const raw = m.slice(1).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (raw) return raw;
  }
  return undefined;
}

function extractCity(context: string) {
  const text = stripTags(context);
  const m = text.match(/\b(Vilnius|Kaunas|Klaipėda|Klaipeda|Šiauliai|Siauliai|Panevėžys|Panevezys|Alytus|Marijampolė|Marijampole|Jonava|Mažeikiai|Mazeikiai|Utena|Palanga|Tauragė|Taurage|Telšiai|Telsiai|Plungė|Plunge|Kretinga|Rietavas|Raseiniai|Ukmergė|Ukmerge|Jurbarkas)\b/i);
  return m?.[1];
}

function cleanTitle(input: string) {
  const text = normalizeWhitespace(stripTags(input))
    .replace(/^Žiūrėti\s*/i, "")
    .replace(/^Plačiau\s*/i, "")
    .replace(/^Skaityti daugiau\s*/i, "")
    .replace(/^Peržiūrėti\s*/i, "")
    .replace(/^Parduodama\s*/i, "")
    .replace(/^Parduodu\s*/i, "")
    .replace(/^Skelbimas\s*/i, "")
    .replace(/^Atidaryti originalų\s*/i, "")
    .trim();

  if (!text) return "";
  if (/href\s*=|src\s*=|class\s*=|target\s*=|onclick\s*=/i.test(text)) return "";
  if (/^(autoplius|autogidas|autobilis|autosel|autobonus)\.?lt$/i.test(text)) return "";
  if (/^(prisijungti|registruotis|ieškoti|paieška|pridėti skelbimą|prideti skelbima)$/i.test(text)) return "";
  return text.slice(0, 140);
}

function titleFromBlock(block: string) {
  const attrTitle = block.match(/\btitle=["']([^"']+)["']/i)?.[1];
  const heading = block.match(/<(h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/i)?.[2];
  const imgAlt = block.match(/<img\b[^>]*\balt=["']([^"']+)["']/i)?.[1];
  const strong = block.match(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/i)?.[2];

  for (const candidate of [attrTitle, heading, imgAlt, strong, block]) {
    const clean = cleanTitle(candidate || "");
    if (clean && clean.length >= 4) return clean;
  }

  return "";
}

function unwrapRedirectUrl(raw: string, pageUrl: string) {
  const full = absUrl(raw, pageUrl);
  try {
    const url = new URL(full);
    for (const key of ["url", "u", "redirect", "r"]) {
      const nested = url.searchParams.get(key);
      if (nested && /^https?:/i.test(nested)) return nested;
    }
    return url.toString();
  } catch {
    return full;
  }
}

function looksLikeListingUrl(url: string, source: SourceConfig) {
  if (!url || url.startsWith("#") || url.startsWith("javascript:")) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!source.hostPattern.test(parsed.hostname)) return false;
  if (/\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i.test(parsed.pathname)) return false;
  if (/\/paieska|\/search|\/prisijungti|\/registr|\/kontakt|\/prideti|\/pridėti|\/about|\/terms|\/privacy|\/tag\//i.test(parsed.pathname)) return false;
  if (parsed.pathname === "/" || parsed.pathname.length < 8) return false;

  if (source.listingPathHints?.some((hint) => hint.test(parsed.pathname))) return true;
  if (/\d{4,}/.test(parsed.pathname)) return true;

  const segments = parsed.pathname.split("/").filter(Boolean);
  return segments.length >= 2 && segments.some((segment) => segment.length >= 8 && /[a-zA-Z]/.test(segment));
}

function scoreCandidate(candidate: Candidate) {
  let score = 0;
  if (candidate.imageUrl) score += 4;
  if (candidate.priceText) score += 3;
  if (candidate.city) score += 1;
  if (candidate.title && candidate.title.length >= 6) score += 3;
  if (candidate.title && /\d{4,}/.test(candidate.title)) score += 1;
  return score + candidate.score;
}

function extractCandidatesFromHtml(html: string, source: SourceConfig, pageUrl: string) {
  const candidates: Candidate[] = [];
  const normalizedHtml = html.replace(/\n/g, " ");

  const blockRe = /<(article|li|div|section)\b[^>]*>([\s\S]{120,5000}?)<\/\1>/gi;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockRe.exec(normalizedHtml))) {
    const block = blockMatch[0];
    const hrefs = [...block.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
    if (!hrefs.length) continue;

    const imageTags = block.match(/<(img|source)\b[^>]*>/gi) || [];
    const title = titleFromBlock(block);
    const priceText = extractPrice(block);
    const city = extractCity(block);
    const imageUrl = imageTags.map((tag) => imageFromTag(tag, pageUrl)).find(Boolean);

    for (const rawHref of hrefs) {
      const fullUrl = unwrapRedirectUrl(rawHref, pageUrl);
      if (!looksLikeListingUrl(fullUrl, source)) continue;
      candidates.push({
        url: fullUrl,
        title,
        priceText,
        city,
        imageUrl,
        score: imageUrl ? 5 : priceText ? 3 : 0,
      });
    }
  }

  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch: RegExpExecArray | null;

  while ((anchorMatch = anchorRe.exec(normalizedHtml))) {
    const rawHref = anchorMatch[1];
    const fullUrl = unwrapRedirectUrl(rawHref, pageUrl);
    if (!looksLikeListingUrl(fullUrl, source)) continue;

    const start = Math.max(0, anchorMatch.index - 500);
    const end = Math.min(normalizedHtml.length, anchorMatch.index + anchorMatch[0].length + 1500);
    const context = normalizedHtml.slice(start, end);
    const title = cleanTitle(anchorMatch[2]) || titleFromBlock(context);
    const imageTags = context.match(/<(img|source)\b[^>]*>/gi) || [];
    const imageUrl = imageTags.map((tag) => imageFromTag(tag, pageUrl)).find(Boolean);

    candidates.push({
      url: fullUrl,
      title,
      priceText: extractPrice(context),
      city: extractCity(context),
      imageUrl,
      score: imageUrl ? 2 : 0,
    });
  }

  return candidates;
}

function dedupeAndFinalize(candidates: Candidate[], source: SourceConfig, section: ExternalSection, category?: string) {
  const best = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const title = cleanTitle(candidate.title || "");
    if (title.length < 3) continue;

    const existing = best.get(candidate.url);
    const next: Candidate = {
      ...candidate,
      title,
      score: scoreCandidate({ ...candidate, title }),
    };

    if (!existing || next.score > scoreCandidate(existing)) {
      best.set(candidate.url, next);
    }
  }

  return [...best.values()]
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
    .slice(0, 10)
    .map((item) => ({
      id: `${source.key}:${item.url}`,
      title: item.title || `${source.label} skelbimas`,
      priceText: item.priceText,
      city: item.city,
      imageUrl: item.imageUrl,
      url: item.url,
      source: source.label,
      section,
      category,
    } satisfies ExternalListing));
}

async function enrichMissingImages(items: ExternalListing[]) {
  const subset = items.filter((item) => !item.imageUrl).slice(0, 3);

  await Promise.all(
    subset.map(async (item) => {
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
        const fromMeta = extractMetaImage(html, item.url);
        if (fromMeta) {
          item.imageUrl = fromMeta;
          return;
        }

        const imgTags = html.match(/<(img|source)\b[^>]*>/gi) || [];
        item.imageUrl = imgTags.map((tag) => imageFromTag(tag, item.url)).find(Boolean);
      } catch {
        // ignore individual enrichment failures
      }
    })
  );
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
      }] satisfies ExternalListing[];
    }

    const html = await res.text();
    const parsed = dedupeAndFinalize(extractCandidatesFromHtml(html, source, url), source, section, category);

    if (parsed.length) {
      await enrichMissingImages(parsed);
      return parsed;
    }

    return [{
      id: `${source.key}:fallback:${url}`,
      title: `${query} – ${source.label}`,
      url,
      source: source.label,
      section,
      category,
    }] satisfies ExternalListing[];
  } catch {
    return [{
      id: `${source.key}:fallback:${url}`,
      title: `${query} – ${source.label}`,
      url,
      source: source.label,
      section,
      category,
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
