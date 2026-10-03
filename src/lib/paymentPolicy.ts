import { BILLING_CURRENCY, LISTING_PRICE_CENTS, listingDateFrom } from "./billing";
export function payableListing(listing: Record<string, unknown>, uid: string, now = new Date()) {
  if (listing.ownerUid !== uid) return "forbidden";
  if (listing.paymentStatus === "paid") return "already_paid";
  const deletion = listingDateFrom(listing.deleteAt);
  if (listing.status === "deleting" || (deletion && deletion.getTime() <= now.getTime() + 25 * 60 * 60 * 1000)) return "expired";
  return null;
}
export function validPaidSession(session: {
  mode?: string | null; payment_status?: string; amount_total?: number | null;
  currency?: string | null; metadata?: Record<string, string> | null;
}) {
  return session.mode === "payment" && session.payment_status === "paid"
    && session.amount_total === LISTING_PRICE_CENTS && session.currency === BILLING_CURRENCY
    && session.metadata?.collectionName === "ads" && !!session.metadata.listingId && !!session.metadata.ownerUid;
}
export function safePaymentOrigin(requestUrl: string) {
  // Never trust an Origin header for the payment return URL.
  const configured = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const origin = new URL(configured || requestUrl).origin;
  const url = new URL(origin);
  const allowedHosts = new Set(["autoloke.lt", "www.autoloke.lt", "autoloke.dk", "www.autoloke.dk"]);
  if (process.env.VERCEL_URL) allowedHosts.add(process.env.VERCEL_URL);
  if (configured) allowedHosts.add(new URL(configured).hostname);
  if ((url.protocol === "https:" && allowedHosts.has(url.hostname)) || (process.env.NODE_ENV !== "production" && url.hostname === "localhost")) return origin;
  throw new Error("Invalid site URL");
}
