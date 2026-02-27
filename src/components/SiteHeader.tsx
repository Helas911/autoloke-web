"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cls } from "@/lib/format";

const links = [
  { href: "/transportas", label: "Transportas" },
  { href: "/dalys", label: "Dalys" },
  { href: "/ikelti", label: "Įkelti" },
  { href: "/mano", label: "Mano" },
];

export function SiteHeader() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">🚗</span>
          <span className="text-lg">Autoloke</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = path === l.href || path.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cls(
                  "rounded-full px-3 py-2 text-sm font-semibold transition",
                  active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex">
          <Link
            href="/prisijungti"
            className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            Prisijungti
          </Link>
        </div>
      </div>
    </header>
  );
}
