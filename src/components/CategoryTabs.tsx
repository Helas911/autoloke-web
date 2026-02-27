"use client";

import { VEHICLE_CATEGORIES, type VehicleCategory } from "@/lib/categories";
import { cls } from "@/lib/format";

export function CategoryTabs({
  value,
  onChange,
}: {
  value: VehicleCategory;
  onChange: (v: VehicleCategory) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {VEHICLE_CATEGORIES.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={cls(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition",
              active
                ? "border-white/25 bg-white/12 text-white"
                : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            )}
          >
            <span className="text-base">{c.icon}</span>
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
