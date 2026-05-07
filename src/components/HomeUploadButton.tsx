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
        className="flex items-center justify-center rounded-[28px] border border-white/10 bg-white px-6 py-5 text-lg font-black text-black shadow-xl transition hover:scale-[1.01] hover:bg-white/90"
      >
        ➕ Įkelti skelbimą
      </Link>
    </div>
  );
}
