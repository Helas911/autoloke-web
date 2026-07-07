export const BILLING_CURRENCY = "eur" as const;
export const LISTING_PRICE_CENTS = 100;
export const LISTING_PRICE_EUR = 1;
export const LISTING_ACTIVE_DAYS = 30;
export const LISTING_DELETE_AFTER_DAYS = 31;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ListingPaymentStatus = "pending" | "paid" | "failed";
export type ListingStatus = "pending_payment" | "active" | "expired";

type TimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  _seconds?: number;
};

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function createPendingListingPaymentFields(now = new Date()) {
  return {
    paymentStatus: "pending" as ListingPaymentStatus,
    status: "pending_payment" as ListingStatus,
    listingPriceCents: LISTING_PRICE_CENTS,
    listingPriceEur: LISTING_PRICE_EUR,
    currency: BILLING_CURRENCY,
    activeDays: LISTING_ACTIVE_DAYS,
    deleteAfterDays: LISTING_DELETE_AFTER_DAYS,
    activeUntil: null,
    paidAt: null,
    deleteAt: addDays(now, LISTING_DELETE_AFTER_DAYS),
  };
}

export function listingDateFrom(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object") {
    const ts = value as TimestampLike;
    if (typeof ts.toDate === "function") return ts.toDate();
    const seconds = typeof ts.seconds === "number" ? ts.seconds : ts._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }
  return null;
}

export function isPublicPaidListing(listing: unknown, now = new Date()) {
  const item = listing as { paymentStatus?: string; status?: string; activeUntil?: unknown } | null;
  if (!item) return false;
  if (item.paymentStatus !== "paid") return false;
  if (item.status !== "active") return false;
  const activeUntil = listingDateFrom(item.activeUntil);
  if (!activeUntil) return false;
  return activeUntil.getTime() > now.getTime();
}
