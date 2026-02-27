export type VehicleCategory =
  | "automobiliai"
  | "motociklai"
  | "sunkvezimiai"
  | "vandensTransportas"
  | "zemesUkioTechnika";

export const VEHICLE_CATEGORIES: { id: VehicleCategory; label: string; icon: string }[] = [
  { id: "automobiliai", label: "Auto", icon: "🚗" },
  { id: "vandensTransportas", label: "Vandens", icon: "🚤" },
  { id: "motociklai", label: "Motociklai", icon: "🏍️" },
  { id: "sunkvezimiai", label: "Sunkvežimiai", icon: "🚚" },
  { id: "zemesUkioTechnika", label: "Ž.Ū. technika", icon: "🚜" },
];

export const VEHICLE_TYPES: Record<VehicleCategory, string[]> = {
  automobiliai: ["Sedanas", "Universalas", "Hečbekas", "Visureigis", "Kupė", "Kabrioletas", "Vienatūris", "Komercinis"],
  motociklai: ["Keturračiai", "Krosiniai", "Kelioniniai", "Sportiniai", "Čioperiai", "Enduro", "Motoroleriai"],
  sunkvezimiai: ["Vilkikai", "Sunkvežimiai", "Mikroautobusai", "Autobusai", "Priekabos", "Speciali technika"],
  vandensTransportas: ["Valtys", "Kateriai", "Jachtos", "Vandens motociklai", "Varikliai", "Kita"],
  zemesUkioTechnika: ["Traktoriai", "Kombainai", "Padargai", "Krautuvai", "Miškininkystės", "Kita"],
};

export function categoryLabel(cat?: string | null): string {
  const found = VEHICLE_CATEGORIES.find((c) => c.id === cat);
  return found?.label ?? (cat ? cat : "Transportas");
}

export function categoryIcon(cat?: string | null): string {
  const found = VEHICLE_CATEGORIES.find((c) => c.id === cat);
  return found?.icon ?? "🚗";
}
