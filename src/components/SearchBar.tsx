"use client";

import { cls } from "@/lib/format";

export function SearchBar({
  value,
  onChange,
  placeholder,
  right,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
      <span className="text-white/70">🔎</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cls(
          "w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
        )}
      />
      {right}
    </div>
  );
}
