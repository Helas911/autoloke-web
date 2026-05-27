"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalListingCard } from "@/components/ExternalListingCard";
import type { ExternalListing, ExternalSection } from "@/lib/externalAggregator";

type SearchSection = ExternalSection | "visi";

type PortalLink = {
  name: string;
  url: string;
  note: string;
};

function normalizeSection(section: SearchSection): ExternalSection {
  return section === "dalys" ? "dalys" : "transportas";
}

function portalLinks(query: string, section: SearchSection): PortalLink[] {
  const q = encodeURIComponent(query.trim());
  const isParts = section === "dalys";

  if (isParts) {
    return [
      {
        name: "Autoplius dalys",
        url: `https://autoplius.lt/skelbimai/automobiliu-dalys?search_text=${q}`,
        note: "Ieškoti dalių Autoplius portale",
      },
      {
        name: "Autogidas dalys",
        url: `https://autogidas.lt/auto-dalys/paieska?keywords=${q}`,
        note: "Ieškoti dalių Autogidas portale",
      },
      {
        name: "Skelbiu",
        url: `https://www.skelbiu.lt/skelbimai/?keywords=${q}`,
        note: "Ieškoti Skelbiu portale",
      },
    ];
  }

  return [
    {
      name: "Autoplius",
      url: `https://autoplius.lt/skelbimai/naudoti-automobiliai?search_text=${q}`,
      note: "Ieškoti transporto Autoplius portale",
    },
    {
      name: "Autogidas",
      url: `https://autogidas.lt/skelbimai/automobiliai/?keywords=${q}`,
      note: "Ieškoti transporto Autogidas portale",
    },
    {
      name: "Skelbiu",
      url: `https://www.skelbiu.lt/skelbimai/?keywords=${q}`,
      note: "Ieškoti Skelbiu portale",
    },
  ];
}

export default function BendraPaieskaPage() {
  const [q, setQ] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [section, setSection] = useState<SearchSection>("transportas");
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [items, setItems] = useState<ExternalListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  const visibleItems = useMemo(() => {
    if (!onlyWithPhotos) return items;
    return items.filter((item) => Boolean(item.imageUrl));
  }, [items, onlyWithPhotos]);

  const links = useMemo(() => (lastQuery ? portalLinks(lastQuery, section) : []), [lastQuery, section]);

  async function runSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const query = q.trim();
    if (query.length < 2 || loading) return;

    setLoading(true);
    setSearched(true);
    setLastQuery(query);
    setFallbackMode(false);

    try {
      const sections: ExternalSection[] = section === "visi" ? ["transportas", "dalys"] : [normalizeSection(section)];

      const responses = await Promise.all(
        sections.map(async (searchSection) => {
          const params = new URLSearchParams({
            q: query,
            section: searchSection,
            category: searchSection === "dalys" ? "dalys" : "automobiliai",
          });

          const res = await fetch(`/api/external-search?${params.toString()}`);
          if (!res.ok) return [];

          const data = (await res.json()) as ExternalListing[];
          return Array.isArray(data) ? data : [];
        })
      );

      const merged = responses.flat();
      const unique = Array.from(new Map(merged.map((item) => [item.url, item])).values());

      setItems(unique);
      setFallbackMode(unique.length === 0);
    } catch {
      setItems([]);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  function openAllPortals() {
    links.forEach((link, index) => {
      window.setTimeout(() => window.open(link.url, "_blank", "noopener,noreferrer"), index * 120);
    });
  }

  const sourceCount = useMemo(() => new Set(visibleItems.map((item) => item.source)).size, [visibleItems]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl md:p-8">
        <div className="mb-5 inline-flex rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-100">
          🔎 Autoloke bendra paieška
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-6xl">
              Viena paieška – visi portalai vienoje vietoje.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/65 md:text-lg">
              Įvesk markę, modelį ar dalį. Pirmiausia bandome parodyti skelbimus čia, o jei portalai blokuoja – duodame tiesiogines paieškos nuorodas.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
            <div className="text-sm font-black text-white/75">Kodėl naudoti?</div>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-white/60">
              <div>✅ viena vieta paieškai</div>
              <div>✅ greitos nuorodos į portalus</div>
              <div>✅ šalia gali įkelti skelbimą į Autoloke</div>
            </div>
          </div>
        </div>

        <form onSubmit={runSearch} className="mt-7 rounded-3xl border border-white/10 bg-black/45 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pvz.: BMW E60, Audi A6, Passat"
              className="min-h-14 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-base font-bold text-white outline-none placeholder:text-white/35 focus:border-blue-400/60"
            />
            <button
              type="submit"
              disabled={loading || q.trim().length < 2}
              className="min-h-14 rounded-2xl bg-white px-6 text-base font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? "Ieškoma..." : "Ieškoti"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["transportas", "Transportas"],
              ["dalys", "Dalys"],
              ["visi", "Viskas"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSection(value as SearchSection)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  section === value
                    ? "border-blue-300/50 bg-blue-500/25 text-blue-50"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08]"
                }`}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setOnlyWithPhotos((v) => !v)}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                onlyWithPhotos
                  ? "border-emerald-300/45 bg-emerald-500/20 text-emerald-50"
                  : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08]"
              }`}
            >
              Tik su nuotraukomis
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black text-white/80">
            {searched ? (fallbackMode ? "Portalų paieškos nuorodos" : `${visibleItems.length} rezultatų`) : "Įvesk paiešką ir spausk „Ieškoti“"}
          </div>
          <div className="mt-1 text-xs font-semibold text-white/45">
            {searched && !fallbackMode && visibleItems.length ? `Šaltiniai: ${sourceCount}` : "Pvz.: BMW E60, Audi A6"}
          </div>
        </div>

        <Link
          href="/ikelti"
          className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-blue-500 sm:w-auto"
        >
          + Įkelti skelbimą į Autoloke
        </Link>
      </section>

      {loading ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-lg font-black text-white/70">
          Ieškoma per portalus...
        </div>
      ) : null}

      {!loading && fallbackMode && links.length ? (
        <section className="mt-5 rounded-[28px] border border-yellow-400/20 bg-yellow-500/10 p-4">
          <div className="text-lg font-black text-yellow-50">Portalai neleido parodyti skelbimų čia</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-yellow-50/70">
            Todėl pateikiame tiesiogines veikiančias paieškos nuorodas. Tai nėra netikri rezultatai – paspaudus atsidarys tikra paieška pasirinktame portale.
          </p>

          <button
            type="button"
            onClick={openAllPortals}
            className="mt-4 w-full rounded-2xl bg-white px-5 py-4 text-center text-base font-black text-black transition hover:bg-white/90"
          >
            Atidaryti visus portalus
          </button>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-blue-300/50 hover:bg-black/50"
              >
                <div className="text-xl font-black text-white">{link.name}</div>
                <div className="mt-2 min-h-10 text-sm font-semibold text-white/55">{link.note}</div>
                <div className="mt-4 rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-black">
                  Ieškoti „{lastQuery}“ ↗
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !fallbackMode && visibleItems.length ? (
        <div className="mt-5 grid gap-3">
          {visibleItems.map((item) => (
            <ExternalListingCard key={`${item.source}-${item.url}`} item={item} />
          ))}
        </div>
      ) : null}
    </main>
  );
}
