import { type SiteCountry } from "./site";

export type Lang = "lt" | "dk";

export function langFromCountry(country: SiteCountry): Lang {
  return country === "DK" ? "dk" : "lt";
}

export function otherLabel(country: SiteCountry) {
  return country === "DK" ? "Andet" : "Kita";
}

const dictionary = {
  lt: {
    siteTagline: "Autoloke – lengvai rask transportą ir dalis aplink save",
    login: "Prisijungti",
    logout: "Atsijungti",
    register: "Registruotis",
    myAccount: "Mano",
    myListings: "Mano skelbimai",
    transport: "Transportas",
    parts: "Dalys",
    vehiclesMap: "Transportas • Žemėlapis",
    partsMap: "Dalys • Žemėlapis",
    mapLoading: "Kraunamas žemėlapis…",
    nearMe: "Aplink mane",
    filterByMap: "Filtruoti pagal žemėlapį",
    on: "ON",
    off: "OFF",
    searchFilters: "Paieškos filtrai",
    filters: "Filtrai",
    clear: "Išvalyti",
    typeAll: "Tipas (visi)",
    brandAll: "Markė (visi)",
    brand: "Markė",
    enterBrand: "Įrašyk markę",
    modelAll: "Modelis (visi)",
    modelFirstBrand: "Modelis (pirmiau markė)",
    enterModel: "Įrašyk modelį",
    city: "Miestas",
    priceFrom: "Kaina nuo",
    priceTo: "Kaina iki",
    yearFrom: "Metai nuo",
    yearTo: "Metai iki",
    mileageFrom: "Rida nuo",
    mileageTo: "Rida iki",
    fuelAll: "Kuras (visi)",
    driveAll: "Varomi (visi)",
    gearboxAll: "Pavarų dėžė (visos)",
    adsCount: "skelb.",
    noPhoto: "Be nuotraukos",
    priceNotSpecified: "Kaina nenurodyta",
    home: "Pradžia",
    map: "Žemėlapis",
    upload: "Įkelti",
    uploadListing: "Įkelti skelbimą",
    uploadPhotos: "Nuotraukos",
    needOnePhoto: "Reikia bent 1.",
    choosePhotos: "Pasirinkti nuotraukas",
    uploading: "Įkeliama...",
    partsUploaded: "Dalys įkeltos ✅",
    adUploaded: "Skelbimas įkeltas ✅",
    photoTitle: "Nuotraukos",
    locationOnMap: "Vieta žemėlapyje",
    useMyLocation: "Naudoti mano vietą",
    loading: "Kraunasi...",
    searchingVehicle: "Ieškoti transporto",
    searchingParts: "Ieškoti dalių",
    searchVehiclePlaceholder: "Ieškoti transporto (markė, modelis, miestas...)",
    searchPartsPlaceholder: "Ieškoti dalių (pavadinimas, markė, miestas...)",
    by: "Miestas",
    save: "Išsaugoti",
    saved: "Išsaugota ✅",
    delete: "Ištrinti",
    edit: "Redaguoti",
    yourListingsNeedLogin: "Kad matytum savo skelbimus, reikia prisijungti.",
    loginGoogle: "Prisijungti su Google",
    registerGoogle: "Registruotis su Google",
    joining: "Jungiasi...",
    createAccount: "Sukurti paskyrą",
    creating: "Kuriama...",
    noAccount: "Neturi paskyros?",
    haveAccount: "Jau turi paskyrą?",
    email: "El. paštas",
    password: "Slaptažodis",
    passwordMin: "Slaptažodis (min. 6)",
    phone: "Telefonas (+370...)",
    description: "Aprašymas (būklė, komplektacija, pastabos...)",
    titleParts: "Dalių pavadinimas (pvz. žibintas, variklis...)",
    vehicleTypePick: "Tipas (pasirinkti)",
    gearboxPick: "Pavarų dėžė (pasirinkti)",
    fuelPick: "Kuro tipas (pasirinkti)",
    drivePick: "Varomieji ratai (pasirinkti)",
    engineCapacity: "Variklio tūris (l)",
    powerKw: "Galia (kW)",
    mileage: "Rida (km)",
    year: "Metai",
    titleNoPhoto: "No photo",
    firestoreAds: "Skelbimai iš Firestore",
    activeSeparate: "arti rodo atskirai",
  },
  dk: {
    siteTagline: "Autoloke – find nemt køretøjer og reservedele i nærheden",
    login: "Log ind",
    logout: "Log ud",
    register: "Opret konto",
    myAccount: "Min konto",
    myListings: "Mine annoncer",
    transport: "Køretøjer",
    parts: "Reservedele",
    vehiclesMap: "Køretøjer • Kort",
    partsMap: "Reservedele • Kort",
    mapLoading: "Kortet indlæses…",
    nearMe: "Omkring mig",
    filterByMap: "Filtrer efter kort",
    on: "TIL",
    off: "FRA",
    searchFilters: "Søgefiltre",
    filters: "Filtre",
    clear: "Ryd",
    typeAll: "Type (alle)",
    brandAll: "Mærke (alle)",
    brand: "Mærke",
    enterBrand: "Skriv mærke",
    modelAll: "Model (alle)",
    modelFirstBrand: "Model (vælg først mærke)",
    enterModel: "Skriv model",
    city: "By",
    priceFrom: "Pris fra",
    priceTo: "Pris til",
    yearFrom: "År fra",
    yearTo: "År til",
    mileageFrom: "Kilometer fra",
    mileageTo: "Kilometer til",
    fuelAll: "Brændstof (alle)",
    driveAll: "Træk (alle)",
    gearboxAll: "Gearkasse (alle)",
    adsCount: "annoncer",
    noPhoto: "Ingen billede",
    priceNotSpecified: "Pris ikke angivet",
    home: "Forside",
    map: "Kort",
    upload: "Opret",
    uploadListing: "Opret annonce",
    uploadPhotos: "Billeder",
    needOnePhoto: "Mindst 1 billede kræves.",
    choosePhotos: "Vælg billeder",
    uploading: "Uploader...",
    partsUploaded: "Reservedele oprettet ✅",
    adUploaded: "Annonce oprettet ✅",
    photoTitle: "Billeder",
    locationOnMap: "Placering på kort",
    useMyLocation: "Brug min placering",
    loading: "Indlæser...",
    searchingVehicle: "Søg køretøj",
    searchingParts: "Søg reservedele",
    searchVehiclePlaceholder: "Søg køretøj (mærke, model, by...)",
    searchPartsPlaceholder: "Søg reservedele (navn, mærke, by...)",
    by: "By",
    save: "Gem",
    saved: "Gemt ✅",
    delete: "Slet",
    edit: "Rediger",
    yourListingsNeedLogin: "Du skal logge ind for at se dine annoncer.",
    loginGoogle: "Log ind med Google",
    registerGoogle: "Opret med Google",
    joining: "Logger ind...",
    createAccount: "Opret konto",
    creating: "Opretter...",
    noAccount: "Har du ingen konto?",
    haveAccount: "Har du allerede en konto?",
    email: "E-mail",
    password: "Adgangskode",
    passwordMin: "Adgangskode (min. 6)",
    phone: "Telefon (+45...)",
    description: "Beskrivelse (stand, udstyr, noter...)",
    titleParts: "Navn på reservedele (fx lygte, motor...)",
    vehicleTypePick: "Type (vælg)",
    gearboxPick: "Gearkasse (vælg)",
    fuelPick: "Brændstof (vælg)",
    drivePick: "Træk (vælg)",
    engineCapacity: "Motorvolumen (l)",
    powerKw: "Effekt (kW)",
    mileage: "Kilometer (km)",
    year: "År",
    titleNoPhoto: "Ingen billede",
    firestoreAds: "Annoncer fra Firestore",
    activeSeparate: "vises separat tæt på",
  },
} as const;

export type I18nKey = keyof typeof dictionary.lt;

export function t(country: SiteCountry, key: I18nKey): string {
  return dictionary[langFromCountry(country)][key];
}

const categoryLabels = {
  LT: {
    automobiliai: "Auto",
    motociklai: "Motociklai",
    sunkvezimiai: "Sunkvežimiai",
    vandensTransportas: "Vandens",
    zemesUkioTechnika: "Ž.Ū. technika",
  },
  DK: {
    automobiliai: "Biler",
    motociklai: "Motorcykler",
    sunkvezimiai: "Lastbiler",
    vandensTransportas: "Vand",
    zemesUkioTechnika: "Landbrug",
  },
} as const;

export function categoryLabelLocalized(category: string | undefined | null, country: SiteCountry) {
  if (!category) return country === "DK" ? "Køretøjer" : "Transportas";
  return (categoryLabels[country] as Record<string, string>)[category] || category;
}

const fuelLabels: Record<string, { LT: string; DK: string }> = {
  "Benzinas": { LT: "Benzinas", DK: "Benzin" },
  "Dyzelis": { LT: "Dyzelis", DK: "Diesel" },
  "Benzinas+dujos": { LT: "Benzinas+dujos", DK: "Benzin+gas" },
  "Dujos": { LT: "Dujos", DK: "Gas" },
  "Hibridas": { LT: "Hibridas", DK: "Hybrid" },
  "Plug-in hibridas": { LT: "Plug-in hibridas", DK: "Plug-in hybrid" },
  "Elektra": { LT: "Elektra", DK: "El" },
  "Kita": { LT: "Kita", DK: "Andet" },
};

const driveLabels: Record<string, { LT: string; DK: string }> = {
  "Priekis": { LT: "Priekis", DK: "Forhjul" },
  "Galas": { LT: "Galas", DK: "Baghjul" },
  "4x4": { LT: "4x4", DK: "4x4" },
};

const gearboxLabels: Record<string, { LT: string; DK: string }> = {
  "Mechaninė": { LT: "Mechaninė", DK: "Manuel" },
  "Automatinė": { LT: "Automatinė", DK: "Automatisk" },
  "Robotizuota": { LT: "Robotizuota", DK: "Robotgearkasse" },
  "Kita": { LT: "Kita", DK: "Andet" },
};

export function labelFuel(value: string, country: SiteCountry) {
  return fuelLabels[value]?.[country] || value;
}
export function labelDrive(value: string, country: SiteCountry) {
  return driveLabels[value]?.[country] || value;
}
export function labelGearbox(value: string, country: SiteCountry) {
  return gearboxLabels[value]?.[country] || value;
}

export const canonicalFuelOptions = Object.keys(fuelLabels);
export const canonicalDriveOptions = Object.keys(driveLabels);
export const canonicalGearboxOptions = Object.keys(gearboxLabels);
