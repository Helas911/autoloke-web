export type BrandCategory = "automobiliai" | "motociklai" | "sunkvezimiai" | "vandens" | "zu_technika";

const CAR_BRANDS: Record<string, string[]> = {
  "Abarth": ["500", "595", "695", "Grande Punto"],
  "Alfa Romeo": ["145", "146", "147", "156", "159", "166", "Brera", "Giulietta", "Giulia", "GT", "MiTo", "Spider", "Stelvio", "Tonale"],
  "Audi": ["80", "90", "100", "A1", "A2", "A3", "A4", "A4 allroad", "A5", "A6", "A6 allroad", "A7", "A8", "e-tron", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "RS3", "RS4", "RS5", "RS6", "S3", "S4", "S5", "S6", "SQ5", "SQ7", "TT", "TTS", "R8"],
  "BMW": ["1 Series", "2 Series", "2 Series Active Tourer", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX3", "M2", "M3", "M4", "M5", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z3", "Z4"],
  "BYD": ["Atto 3", "Dolphin", "Han", "Seal", "Tang"],
  "Cadillac": ["BLS", "CT5", "CTS", "Escalade", "SRX", "XT4", "XT5"],
  "Chevrolet": ["Aveo", "Camaro", "Captiva", "Corvette", "Cruze", "Epica", "Kalos", "Lacetti", "Malibu", "Matiz", "Nubira", "Orlando", "Spark", "Tahoe", "Trax"],
  "Chrysler": ["200", "300C", "Grand Voyager", "Pacifica", "PT Cruiser", "Sebring", "Voyager"],
  "Citroën": ["Berlingo", "C-Crosser", "C-Elysee", "C1", "C2", "C3", "C3 Aircross", "C4", "C4 Cactus", "C4 Picasso", "C5", "C5 Aircross", "C6", "C8", "DS3", "DS4", "DS5", "Jumper", "Jumpy", "Saxo", "Xantia", "Xsara"],
  "Cupra": ["Ateca", "Born", "Formentor", "Leon", "Tavascan"],
  "DS": ["DS 3", "DS 4", "DS 7", "DS 9"],
  "Dacia": ["Dokker", "Duster", "Jogger", "Lodgy", "Logan", "Sandero", "Spring"],
  "Daewoo": ["Kalos", "Lacetti", "Lanos", "Leganza", "Matiz", "Nubira", "Tacuma"],
  "Daihatsu": ["Cuore", "Sirion", "Terios"],
  "Dodge": ["Avenger", "Caliber", "Challenger", "Charger", "Durango", "Journey", "Nitro", "RAM"],
  "Fiat": ["124 Spider", "500", "500L", "500X", "Albea", "Bravo", "Croma", "Doblo", "Ducato", "Fiorino", "Freemont", "Grande Punto", "Linea", "Panda", "Punto", "Qubo", "Scudo", "Sedici", "Stilo", "Talento", "Tipo"],
  "Ford": ["B-Max", "C-Max", "EcoSport", "Edge", "Escort", "Explorer", "Fiesta", "Focus", "Fusion", "Galaxy", "Ka", "Kuga", "Maverick", "Mondeo", "Mustang", "Puma", "Ranger", "S-Max", "Tourneo Connect", "Tourneo Custom", "Transit", "Transit Connect", "Transit Custom"],
  "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  "Honda": ["Accord", "CR-V", "CR-Z", "Civic", "City", "FR-V", "HR-V", "Insight", "Jazz", "Legend", "Prelude", "Stream"],
  "Hyundai": ["Accent", "Coupe", "Elantra", "Galloper", "Getz", "H-1", "i10", "i20", "i30", "i40", "Ioniq", "Ioniq 5", "Ioniq 6", "ix20", "ix35", "Kona", "Matrix", "Santa Fe", "Sonata", "Terracan", "Trajet", "Tucson", "Veloster"],
  "Infiniti": ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX70"],
  "Isuzu": ["D-Max", "Trooper"],
  "Iveco": ["Daily", "Massif"],
  "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "XE", "XF", "XJ", "X-Type"],
  "Jeep": ["Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Patriot", "Renegade", "Wrangler"],
  "Kia": ["Carens", "Carnival", "Ceed", "Cerato", "EV6", "EV9", "Niro", "Optima", "Picanto", "Proceed", "Rio", "Sorento", "Soul", "Sportage", "Stinger", "Venga", "XCeed"],
  "Lada": ["Niva", "Samara", "Vesta"],
  "Lancia": ["Delta", "Lybra", "Musa", "Phedra", "Thema", "Thesis", "Ypsilon"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Lexus": ["CT", "ES", "GS", "GX", "IS", "LC", "LS", "LX", "NX", "RC", "RX", "SC", "UX"],
  "Lincoln": ["Aviator", "Navigator"],
  "MG": ["HS", "Marvel R", "MG4", "ZS"],
  "MINI": ["Clubman", "Cooper", "Countryman", "Coupe", "Paceman"],
  "Maserati": ["Ghibli", "GranTurismo", "Levante", "Quattroporte"],
  "Mazda": ["2", "3", "5", "6", "121", "323", "626", "929", "BT-50", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-80", "CX-9", "Demio", "MPV", "MX-5", "Premacy", "RX-8", "Tribute"],
  "Mercedes-Benz": ["A-Class", "AMG GT", "B-Class", "C-Class", "CLA", "CLC", "CLK", "CLS", "E-Class", "EQB", "EQC", "EQE", "EQS", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLK", "GLS", "M-Class", "R-Class", "S-Class", "SL", "SLK", "Sprinter", "V-Class", "Vaneo", "Viano", "Vito"],
  "Mitsubishi": ["ASX", "Carisma", "Colt", "Eclipse Cross", "Galant", "Grandis", "L200", "L300", "Lancer", "Outlander", "Pajero", "Pajero Sport", "Space Star"],
  "Nissan": ["100NX", "200SX", "350Z", "370Z", "Almera", "Interstar", "Juke", "Leaf", "Maxima", "Micra", "Murano", "Navara", "Note", "NV200", "Pathfinder", "Patrol", "Primastar", "Primera", "Pulsar", "Qashqai", "Terrano", "Tiida", "X-Trail"],
  "Opel": ["Adam", "Agila", "Antara", "Astra", "Calibra", "Combo", "Corsa", "Crossland", "Frontera", "Grandland", "Insignia", "Kadett", "Meriva", "Mokka", "Movano", "Omega", "Signum", "Tigra", "Vectra", "Vivaro", "Zafira"],
  "Peugeot": ["1007", "106", "107", "108", "2008", "205", "206", "207", "208", "3008", "301", "306", "307", "308", "4007", "406", "407", "408", "5008", "508", "607", "806", "807", "Bipper", "Boxer", "Expert", "Partner", "RCZ", "Rifter"],
  "Polestar": ["2", "3", "4"],
  "Porsche": ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Renault": ["Arkana", "Austral", "Captur", "Clio", "Espace", "Fluence", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Latitude", "Master", "Megane", "Modus", "Scenic", "Symbol", "Talisman", "Trafic", "Twingo", "Vel Satis", "Zoe"],
  "Rover": ["25", "45", "75"],
  "SEAT": ["Alhambra", "Altea", "Arona", "Ateca", "Cordoba", "Exeo", "Ibiza", "Leon", "Mii", "Toledo"],
  "Saab": ["9-3", "9-5", "900", "9000"],
  "Skoda": ["Citigo", "Enyaq", "Fabia", "Favorit", "Felicia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Roomster", "Scala", "Superb", "Yeti"],
  "Smart": ["Forfour", "Fortwo", "Roadster"],
  "SsangYong": ["Korando", "Musso", "Rexton", "Tivoli"],
  "Subaru": ["BRZ", "Forester", "Impreza", "Justy", "Legacy", "Levorg", "Outback", "Tribeca", "XV"],
  "Suzuki": ["Across", "Alto", "Baleno", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "S-Cross", "Splash", "Swift", "SX4", "Vitara", "Wagon R"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y"],
  "Toyota": ["Auris", "Avensis", "Aygo", "bZ4X", "C-HR", "Camry", "Carina", "Celica", "Corolla", "GT86", "Highlander", "Hilux", "Land Cruiser", "Prius", "Proace", "RAV4", "Supra", "Urban Cruiser", "Verso", "Yaris"],
  "Volkswagen": ["Amarok", "Arteon", "Beetle", "Bora", "Caddy", "Caravelle", "CC", "Crafter", "Eos", "Fox", "Golf", "Golf Plus", "ID.3", "ID.4", "ID.5", "Jetta", "Lupo", "Multivan", "Passat", "Passat Alltrack", "Phaeton", "Polo", "Scirocco", "Sharan", "Taigo", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Touran", "Transporter", "Up"],
  "Volvo": ["240", "440", "460", "740", "760", "850", "C30", "C40", "C70", "EX30", "S40", "S60", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"],
};

const MOTO_BRANDS: Record<string, string[]> = {
  "Aprilia": ["RS 125", "RS 660", "SR GT 125", "Tuareg 660", "Tuono 660"],
  "BMW": ["C 400 GT", "F 750 GS", "F 900 R", "F 900 XR", "R 1250 GS", "R 1300 GS", "S 1000 RR"],
  "Ducati": ["DesertX", "Diavel", "Hypermotard", "Monster", "Multistrada", "Panigale V4", "Scrambler"],
  "Harley-Davidson": ["Breakout", "Fat Bob", "Road Glide", "Softail", "Sportster", "Street Bob", "Touring"],
  "Honda": ["Africa Twin", "CB125R", "CB500F", "CB650R", "CBR600RR", "CBR1000RR", "Forza 350", "NC750X", "PCX 125", "Transalp", "X-ADV"],
  "Husqvarna": ["701 Enduro", "Svartpilen 401", "Vitpilen 401"],
  "KTM": ["125 Duke", "390 Duke", "690 SMC R", "790 Duke", "890 Adventure", "1290 Super Duke R"],
  "Kawasaki": ["Ninja 650", "Ninja ZX-6R", "Ninja ZX-10R", "Versys 650", "Vulcan S", "Z650", "Z900", "Z H2"],
  "Moto Guzzi": ["V7", "V85 TT"],
  "Piaggio": ["Beverly 350", "Liberty 125", "MP3", "Vespa GTS", "Vespa Primavera"],
  "Royal Enfield": ["Classic 350", "Himalayan", "Interceptor 650"],
  "Suzuki": ["Burgman 400", "GSX-8S", "GSX-R600", "GSX-S750", "Hayabusa", "V-Strom 650"],
  "Triumph": ["Bonneville", "Daytona", "Speed Triple", "Street Triple", "Tiger 900", "Tiger 1200", "Trident 660"],
  "Yamaha": ["Aerox", "MT-07", "MT-09", "NMAX 125", "R1", "R6", "Tenere 700", "Tracer 9", "XMAX 300", "YZF-R125"],
};

const TRUCK_BRANDS: Record<string, string[]> = {
  "DAF": ["CF", "LF", "XF", "XG", "XG+"],
  "Ford": ["F-Max", "Transit", "Transit Custom"],
  "Iveco": ["Daily", "Eurocargo", "S-Way", "Stralis", "Trakker"],
  "MAN": ["TGA", "TGE", "TGL", "TGM", "TGS", "TGX"],
  "Mercedes-Benz": ["Actros", "Antos", "Arocs", "Atego", "Axor", "Sprinter", "Vario"],
  "Renault Trucks": ["C", "D", "K", "Magnum", "Master", "Premium", "T"],
  "Scania": ["G-Series", "L-Series", "P-Series", "R-Series", "S-Series"],
  "Volvo": ["FE", "FH", "FH16", "FL", "FM", "FMX"],
};

const WATER_BRANDS: Record<string, string[]> = {
  "Bayliner": ["Element E16", "VR4", "VR5", "VR6"],
  "Beneteau": ["Antares", "Barracuda", "Flyer", "Oceanis"],
  "Brig": ["Eagle", "Falcon", "Navigator"],
  "Honda": ["BF20", "BF50", "BF90", "BF150"],
  "Jeanneau": ["Cap Camarat", "Leader", "Merry Fisher"],
  "Mercury": ["FourStroke 60", "FourStroke 115", "FourStroke 150", "Verado 200", "Verado 300"],
  "Sea-Doo": ["GTI", "GTR", "RXP-X", "Spark", "Wake Pro"],
  "Suzuki": ["DF20A", "DF70A", "DF140A", "DF200A"],
  "Yamaha": ["F20", "F50", "F100", "F150", "F200", "VX Cruiser"],
};

const AGRO_BRANDS: Record<string, string[]> = {
  "Case IH": ["Farmall", "Magnum", "Maxxum", "Optum", "Puma"],
  "Claas": ["Arion", "Axion", "Dominion", "Lexion", "Xerion"],
  "Deutz-Fahr": ["Agrotron", "Series 5", "Series 6", "Series 7"],
  "Fendt": ["300 Vario", "500 Vario", "700 Vario", "900 Vario", "1000 Vario"],
  "JCB": ["Fastrac", "Loadall", "TM"],
  "John Deere": ["5R", "6M", "6R", "7R", "8R", "T660", "W540"],
  "Kubota": ["B Series", "L Series", "M5", "M6", "M7"],
  "Massey Ferguson": ["5S", "6S", "7S", "8S"],
  "New Holland": ["T5", "T6", "T7", "T8", "TX"],
  "Valtra": ["A Series", "G Series", "N Series", "Q Series", "T Series"],
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