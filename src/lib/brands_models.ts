export type BrandCategory = "automobiliai" | "motociklai" | "sunkvezimiai" | "vandens" | "zu_technika";

const CAR_BRANDS: Record<string, string[]> = {
  "Audi": ["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT"],
  "BMW": ["1","2","3","4","5","6","7","X1","X3","X5","X6","X7","Z4","i3","i4","iX"],
  "Mercedes-Benz": ["A","B","C","E","S","CLA","CLS","GLA","GLC","GLE","GLS","Vito","Sprinter"],
  "Volkswagen": ["Golf","Passat","Polo","Tiguan","Touareg","Touran","Sharan","Transporter","Caddy"],
  "Toyota": ["Yaris","Corolla","Avensis","Camry","RAV4","Land Cruiser","Prius"],
  "Honda": ["Civic","Accord","CR-V","Jazz","HR-V"],
  "Ford": ["Focus","Mondeo","Fiesta","Kuga","S-Max","Galaxy","Transit"],
  "Opel": ["Astra","Insignia","Vectra","Zafira","Corsa","Meriva"],
  "Volvo": ["S60","S80","V40","V60","V70","XC60","XC90"],
  "Skoda": ["Octavia","Superb","Fabia","Kodiaq","Karoq"],
  "Kia": ["Ceed","Sportage","Sorento","Rio"],
  "Hyundai": ["i30","i20","Tucson","Santa Fe"],
  "Nissan": ["Qashqai","X-Trail","Micra","Juke"],
  "Peugeot": ["206","207","208","307","308","407","508","Partner"],
  "Renault": ["Clio","Megane","Laguna","Scenic","Kangoo","Trafic"],
  "Mazda": ["3","6","CX-3","CX-5","CX-9"],
  "Subaru": ["Impreza","Legacy","Outback","Forester"],
  "Lexus": ["IS","GS","ES","RX","NX"],
  "Porsche": ["Cayenne","Macan","Panamera","911"],
  "Tesla": ["Model S","Model 3","Model X","Model Y"],
  "SEAT": ["Ibiza","Leon","Ateca","Arona"],
  "MINI": ["Cooper","Countryman","Clubman"],
  "Suzuki": ["Swift","Vitara","SX4","Jimny"],
  "Mitsubishi": ["Outlander","Lancer","ASX","Pajero"],
  "Land Rover": ["Range Rover","Discovery","Defender","Evoque"],
  "Jaguar": ["XE","XF","F-Pace","E-Pace"],
  "Citroën": ["C3","C4","C5","Berlingo"],
  "Fiat": ["500","Panda","Tipo","Ducato"],
  "Alfa Romeo": ["Giulia","Stelvio","159","147"],
  "Jeep": ["Grand Cherokee","Compass","Renegade","Wrangler"],
  "Dacia": ["Duster","Sandero","Logan","Jogger"],
  "Cupra": ["Formentor","Leon"],
  "Infiniti": ["Q50","QX70"],
  "Saab": ["9-3","9-5"],
  "Smart": ["Fortwo","Forfour"],
};

const MOTO_BRANDS: Record<string, string[]> = {
  "Yamaha": ["MT-07","MT-09","R6","R1","Tenere 700","XMAX 300"],
  "Honda": ["CBR600RR","CB650R","CBR1000RR","Africa Twin","PCX 125"],
  "Kawasaki": ["Z650","Z900","Ninja 650","Ninja ZX-6R","Versys 650"],
  "Suzuki": ["GSX-R600","GSX-S750","V-Strom 650","Hayabusa"],
  "BMW": ["F 900 R","R 1250 GS","S 1000 RR"],
  "KTM": ["390 Duke","690 SMC R","1290 Super Duke R"],
  "Ducati": ["Monster","Panigale V4","Multistrada"],
  "Harley-Davidson": ["Sportster","Softail","Touring"],
  "Triumph": ["Street Triple","Tiger 900","Bonneville"],
  "Piaggio": ["Vespa Primavera","Vespa GTS","MP3"],
};

const TRUCK_BRANDS: Record<string, string[]> = {
  "MAN": ["TGX","TGS","TGL"],
  "Scania": ["R-Series","S-Series","G-Series"],
  "Volvo": ["FH","FM","FL"],
  "Mercedes-Benz": ["Actros","Arocs","Atego"],
  "DAF": ["XF","CF","LF"],
  "Iveco": ["Stralis","S-Way","Daily"],
  "Renault Trucks": ["T","C","D"],
};

const WATER_BRANDS: Record<string, string[]> = {
  "Yamaha": ["F100","F150","F200"],
  "Mercury": ["FourStroke 60","FourStroke 115","Verado 200"],
  "Honda": ["BF50","BF90","BF150"],
  "Suzuki": ["DF70A","DF140A","DF200A"],
  "Sea-Doo": ["Spark","GTI","RXP-X"],
  "Bayliner": ["Element E16","VR5","VR6"],
  "Jeanneau": ["Merry Fisher","Cap Camarat"],
  "Beneteau": ["Antares","Flyer"],
};

const AGRO_BRANDS: Record<string, string[]> = {
  "John Deere": ["6R","7R","8R"],
  "New Holland": ["T6","T7","T8"],
  "Case IH": ["Puma","Magnum","Optum"],
  "Claas": ["Arion","Axion","Lexion"],
  "Massey Ferguson": ["5S","6S","7S"],
  "Fendt": ["700 Vario","900 Vario"],
  "Valtra": ["A Series","N Series","T Series"],
  "JCB": ["Fastrac","TM"],
  "Kubota": ["M5","M6","M7"],
};

export const BRANDS_BY_CATEGORY: Record<BrandCategory, Record<string, string[]>> = {
  automobiliai: CAR_BRANDS,
  motociklai: MOTO_BRANDS,
  sunkvezimiai: TRUCK_BRANDS,
  vandens: WATER_BRANDS,
  zu_technika: AGRO_BRANDS,
};

export function brandsForCategory(cat: BrandCategory): string[] {
  return Object.keys(BRANDS_BY_CATEGORY[cat] ?? {}).sort((a, b) => a.localeCompare(b, "lt"));
}

export function modelsForBrand(cat: BrandCategory, brand: string): string[] {
  const key = brand?.trim();
  if (!key) return [];
  const m = BRANDS_BY_CATEGORY[cat] ?? {};
  return m[key] ?? [];
}
