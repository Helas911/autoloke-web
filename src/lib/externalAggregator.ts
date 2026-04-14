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
          return `https://autoplius.lt/skelbimai/automobiliu-dalys-paieska?search_text=${enc(query)}`;
        }
        const base = (() => {
          switch (category) {
            case "motociklai":
              return "https://autoplius.lt/skelbimai/motociklai";
            case "sunkvezimiai":
              return "https://autoplius.lt/skelbimai/komerciniai-automobiliai";
            case "vandensTransportas":
              return "https://autoplius.lt/skelbimai/vandens-transportas";
            case "zemesUkioTechnika":
              return "https://autoplius.lt/skelbimai/zemes-ukio-technika";
            default:
              return "https://autoplius.lt/skelbimai/naudoti-automobiliai";
          }
        })();
        return `${base}?search_text=${enc(query)}`;
      },
      resultLinkPattern: /https?:\/\/autoplius\.lt\/skelbimai\/[^"]+/i,
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
      resultLinkPattern: /https?:\/\/autogidas\.lt\/[^"]*skelbimas[^"]+/i,
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

function stripTags(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
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

function looksLikeListing(url: string, source: SourceConfig) {
  if (!url || url.startsWith("#") || url.startsWith("javascript:")) return false;
  if (source.resultLinkPattern) return source.resultLinkPattern.test(url);
  return /\/\d{4,}|skelb|ad-|listing|auto\//i.test(url);
}

function extractBlocks(html: string) {
  const blocks: string[] = [];
  const articleMatches = html.match(/<article[\s\S]*?<\/article>/gi) || [];
  const divMatches = html.match(/<div[^>]+class="[^"]*(item|card|result|listing|announcement)[^"]*"[\s\S]*?<\/div>/gi) || [];
  blocks.push(...articleMatches.slice(0, 30));
  blocks.push(...divMatches.slice(0, 60));
  return blocks.length ? blocks : [html];
}

function extractListingsFromHtml(html: string, source: SourceConfig, pageUrl: string, section: ExternalSection, category?: string) {
  const blocks = extractBlocks(html);
  const results: ExternalListing[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const hrefMatches = [...block.matchAll(/href=["']([^"']+)["']/gi)];
    const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
    const priceMatch = block.match(/(\d[\d\s.,]{2,}\s?(?:€|eur|Eur|EUR|kr|Kč))/i);

    for (const hrefMatch of hrefMatches) {
      const rawHref = hrefMatch[1];
      const fullUrl = absUrl(rawHref, pageUrl);
      if (!looksLikeListing(fullUrl, source)) continue;
      if (seen.has(fullUrl)) continue;
      const anchorStart = Math.max(0, hrefMatch.index ?? 0 - 300);
      const excerpt = block.slice(anchorStart, anchorStart + 900);
      const title = stripTags(excerpt)
        .replace(/^(Žiūrėti|Skaityti daugiau|Plačiau)\s*/i, "")
        .split("|")[0]
        .trim()
        .slice(0, 110);
      if (!title || title.length < 4) continue;

      const cityMatch = excerpt.match(/(Vilnius|Kaunas|Klaipėda|Šiauliai|Panevėžys|Alytus|Marijampolė|Jonava|Mažeikiai|Utena|Palanga|Tauragė|Telšiai|Plungė|Kretinga|Rietavas)/i);

      seen.add(fullUrl);
      results.push({
        id: `${source.key}:${fullUrl}`,
        title,
        priceText: priceMatch?.[1]?.replace(/\s+/g, " ").trim(),
        city: cityMatch?.[1],
        imageUrl: imgMatch ? absUrl(imgMatch[1], pageUrl) : undefined,
        url: fullUrl,
        source: source.label,
        section,
        category,
      });
      break;
    }

    if (results.length >= 8) break;
  }

  return results;
}

async function fetchOne(source: SourceConfig, query: string, section: ExternalSection, category?: string) {
  const url = source.searchUrl({ query, section, category });
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AutolokeBot/1.0; +https://autoloke.lt)",
        accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 60 * 30 },
    });

    if (!res.ok) {
      return [
        {
          id: `${source.key}:fallback:${url}`,
          title: `${query} – ${source.label}`,
          url,
          source: source.label,
          section,
          category,
        },
      ] satisfies ExternalListing[];
    }

    const html = await res.text();
    const parsed = extractListingsFromHtml(html, source, url, section, category);
    if (parsed.length) return parsed;

    return [
      {
        id: `${source.key}:fallback:${url}`,
        title: `${query} – ${source.label}`,
        url,
        source: source.label,
        section,
        category,
      },
    ] satisfies ExternalListing[];
  } catch {
    return [
      {
        id: `${source.key}:fallback:${url}`,
        title: `${query} – ${source.label}`,
        url,
        source: source.label,
        section,
        category,
      },
    ] satisfies ExternalListing[];
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
