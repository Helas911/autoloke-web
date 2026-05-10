export type SellerSourceItem = {
  id?: string;
  ownerUid?: string;
  sellerId?: string;
  sellerName?: string;
  sellerType?: string;
  sellerCity?: string;
  sellerPhone?: string;
  sellerLogoUrl?: string;
  sellerCoverUrl?: string;
  city?: string;
  phone?: string;
  country?: string;
};

export function slugifySeller(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ą/g, "a")
    .replace(/č/g, "c")
    .replace(/ę/g, "e")
    .replace(/ė/g, "e")
    .replace(/į/g, "i")
    .replace(/š/g, "s")
    .replace(/ų/g, "u")
    .replace(/ū/g, "u")
    .replace(/ž/g, "z")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSellerId(item: SellerSourceItem) {
  const explicit = item.sellerId?.toString().trim();
  if (explicit) return slugifySeller(explicit);

  const name = item.sellerName?.toString().trim();
  if (name) return slugifySeller(name);

  const owner = item.ownerUid?.toString().trim();
  if (owner) return `u-${owner}`;

  return "";
}

export function getSellerName(item: SellerSourceItem) {
  return item.sellerName?.toString().trim() || "Privatus pardavėjas";
}

export function getSellerCity(item: SellerSourceItem) {
  return item.sellerCity?.toString().trim() || item.city?.toString().trim() || "";
}

export function getSellerPhone(item: SellerSourceItem) {
  return item.sellerPhone?.toString().trim() || item.phone?.toString().trim() || "";
}

export function isSameSeller(item: SellerSourceItem, sellerId: string) {
  const wanted = slugifySeller(sellerId);
  if (!wanted) return false;
  return getSellerId(item) === wanted;
}
