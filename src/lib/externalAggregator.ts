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
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
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

function titleCaseWord(word: string) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function cleanupTitleEdges(input: string) {
  return input
    .replace(/^[-–—|•:]+/, "")
    .replace(/[-–—|•:]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function prettifyTitle(input: string) {
  const words = input.split(" ").filter(Boolean);
  if (!words.length) return "";

  return cleanupTitleEdges(words.map((word) => {
    if (/^[A-Z0-9-]{2,}$/.test(word)) return word;
    if (/^\d/.test(word)) return word;
    if (word.includes("/")) return word;
    return titleCaseWord(word);
  }).join(" "));
}

function cleanTitle(input: string) {
  let text = normalizeWhitespace(stripTags(input))
    .replace(/^Žiūrėti\s*/i, "")
    .replace(/^Plačiau\s*/i, "")
    .replace(/^Skaityti daugiau\s*/i, "")
    .replace(/^Peržiūrėti\s*/i, "")
    .replace(/^Parduodama\s*/i, "")
    .replace(/^Parduodu\s*/i, "")
    .replace(/^Skelbimas\s*/i, "")
    .replace(/\b(Atidaryti originalų?|Originalas|Plačiau|Daugiau|Žiūrėti)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (/href\s*=|src\s*=|class\s*=|target\s*=|onclick\s*=/i.test(text)) return "";
  if (/prideti skelbima|pridėti skelbimą|registruotis|prisijungti|skelbimu|paieska/i.test(text) && text.length < 35) return "";

  const separators = ["|", "•", "\n"];
  for (const sep of separators) {
    if (text.includes(sep)) {
      const parts = text.split(sep).map((p) => p.trim()).filter(Boolean);
      const best = parts.find((part) => /\d/.test(part) || /[a-zA-Ząčęėįšųūž]/i.test(part));
      if (best) {
        text = best;
        break;
      }
    }
  }

  text = text.replace(/\b(?:Vilnius|Kaunas|Klaipėda|Šiauliai|Panevėžys|Alytus|Marijampolė|Jonava|Mažeikiai|Utena)\b.*$/i, "").trim();
  text = text.replace(/\b\d[\d\s.,]{2,}\s?(?:€|eur|Eur|EUR|kr)\b.*$/i, "").trim();
  text = cleanupTitleEdges(text);
  text = prettifyTitle(text);

  if (text.length < 4) return "";
  return text.slice(0, 120);
}

function looksLikeListingUrl(url: string, source: SourceConfig) {
  if (!url || url.startsWith("#") || url.startsWith("javascript:")) return false;
  if (!source.hostPattern.test(url)) return false;
  if (/\/paieska|\/search|\/prisijungti|\/registr|\/kontakt|\/prideti|\/pridėti|\/about|\/terms|\/privacy/i.test(url)) return false;
  return /skelb|naudoti|automobil|motocikl|komerc|transport|dalys|auto\/|\/\d{4,}|\/ad\//i.test(url);
}

function normalizePrice(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  const currency = /kr/i.test(clean) ? "kr" : "€";
  const numberPart = clean
    .replace(/[^\d.,\s]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, " ")
    .replace(/,(?=\d{3}(\D|$))/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!numberPart || !/\d/.test(numberPart)) return undefined;
  return `${numberPart} ${currency}`.trim();
}

function extractPrice(context: string) {
  const metaCandidate = context.match(/(?:class|data-testid|itemprop|aria-label)=["'][^"']*(?:price|kaina)[^"']*["'][^>]*>([^<]{2,32})</i)?.[1];
  if (metaCandidate) {
    const normalized = normalizePrice(metaCandidate);
    if (normalized) return normalized;
  }

  const m = context.match(/(\d[\d\s.,]{1,18}\s?(?:€|eur|Eur|EUR|kr))/i);
  return m ? normalizePrice(m[1]) : undefined;
}

function normalizeCity(text: string) {
  return cleanupTitleEdges(normalizeWhitespace(text))
    .replace(/^Miestas:?\s*/i, "")
    .replace(/^Vieta:?\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractCity(context: string) {
  const labelled = context.match(/(?:Miestas|Vieta|Miestelis)[:\s<]+([^<\n]{2,40})/i)?.[1];
  if (labelled) return normalizeCity(labelled);

  const m = context.match(/(Vilnius|Kaunas|Klaipėda|Siauliai|Šiauliai|Panevėžys|Panevezys|Alytus|Marijampolė|Marijampole|Jonava|Mažeikiai|Mazeikiai|Utena|Palanga|Tauragė|Taurage|Telšiai|Telsiai|Plungė|Plunge|Kretinga|Rietavas|Raseiniai|Ukmergė|Ukmerge|Jurbarkas)/i);
  return m ? normalizeCity(m[1]) : undefined;
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

function findAttr(context: string, attrPattern: string) {
  const m = context.match(new RegExp(`${attrPattern}=["']([^"']+)["']`, "i"));
  return m?.[1];
}

function extractImg(context: string, baseUrl: string) {
  const ogImage = context.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || context.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
  const twitterImage = context.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || context.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i)?.[1];

  for (const candidate of [ogImage, twitterImage]) {
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

  const bg = context.match(/background-image\s*:\s*url\((['"]?)([^)'"\s]+)\1\)/i)?.[2];
  const cleanBg = cleanupImageUrl(bg, baseUrl);
  if (cleanBg) return cleanBg;

  return undefined;
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

  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRe.exec(cleanedHtml)) && results.length < 12) {
    const href = match[1];
    const inner = match[2];
    const title = cleanTitle(inner);
    if (!title) continue;

    const start = Math.max(0, match.index - 1000);
    const end = Math.min(cleanedHtml.length, match.index + match[0].length + 1800);
    const context = cleanedHtml.slice(start, end);

    pushResult(results, seen, source, href, title, context, pageUrl, section, category);
  }

  if (results.length < 6) {
    const cardRe = /<(article|div|li)\b[^>]*>([\s\S]{140,5000}?)<\/\1>/gi;
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
