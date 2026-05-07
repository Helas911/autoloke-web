"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HomeUploadButton() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
      <Link
        href="/ikelti"
        className="flex items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 text-base font-black text-black shadow-lg transition hover:bg-white/90"
      >
        ➕ Įkelti skelbimą
      </Link>
    </div>
  );
}
