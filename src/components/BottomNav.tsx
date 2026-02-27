"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cls } from "@/lib/format";

const items = [
  { href: "/transportas", label: "Auto", icon: "🚗" },
  { href: "/dalys", label: "Dalys", icon: "🧩" },
  { href: "/ikelti", label: "Įkelti", icon: "➕" },
  { href: "/mano", label: "Mano", icon: "👤" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/70 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-4 px-2 py-2">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href} className="flex flex-col items-center gap-1 py-1">
              <div
                className={cls(
                  "grid h-9 w-10 place-items-center rounded-2xl text-lg transition",
                  active ? "bg-white/12" : "bg-transparent"
                )}
              >
                {it.icon}
              </div>
              <div className={cls("text-[11px] font-semibold", active ? "text-white" : "text-white/60")}>
                {it.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
