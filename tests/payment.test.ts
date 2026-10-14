import test from "node:test";
import assert from "node:assert/strict";
import { payableListing, validPaidSession, validLegacyPaidSession, safePaymentOrigin } from "../src/lib/paymentPolicy";
import { createPendingListingPaymentFields, isPublicPaidListing, addDays } from "../src/lib/billing";
const now = new Date("2026-10-03T10:00:00Z");
test("only the owner can pay and paid listings cannot be reset", () => {
  const listing = { ...createPendingListingPaymentFields(now), ownerUid: "owner" };
  assert.equal(payableListing(listing, "intruder", now), "forbidden");
  assert.equal(payableListing(listing, "owner", now), null);
  assert.equal(payableListing({ ...listing, paymentStatus: "paid" }, "owner", now), "already_paid");
  assert.equal(payableListing({ ...listing, status: "deleting" }, "owner", now), "expired");
});
test("pending and expired listings are not public", () => {
  assert.equal(isPublicPaidListing(createPendingListingPaymentFields(now), now), false);
  assert.equal(isPublicPaidListing({ paymentStatus: "paid", status: "active", activeUntil: addDays(now, 30) }, now), true);
  assert.equal(isPublicPaidListing({ paymentStatus: "paid", status: "active", activeUntil: now }, now), false);
});
test("fulfillment requires exact amount, currency, ownership metadata and paid state", () => {
  const session = { mode: "payment", payment_status: "paid", amount_total: 100, currency: "eur", metadata: { collectionName: "ads", listingId: "ad1", ownerUid: "owner" } };
  assert.equal(validPaidSession(session), true);
  for (const change of [{ amount_total: 1 }, { currency: "dkk" }, { payment_status: "unpaid" }, { mode: "subscription" }, { metadata: { collectionName: "parts", listingId: "x", ownerUid: "owner" } }]) {
    assert.equal(validPaidSession({ ...session, ...change }), false);
  }
});
test("return URL uses canonical origin", () => {
  assert.equal(safePaymentOrigin("https://autoloke.dk/api/payments/create-checkout"), "https://autoloke.dk");
});

test("legacy checkout accepts only an exact paid ad, and must be bound to stored Stripe session in webhook", () => {
  const legacy = { mode: "payment", payment_status: "paid", amount_total: 100, currency: "eur", metadata: { collectionName: "ads", listingId: "old-ad" } };
  assert.equal(validLegacyPaidSession(legacy), true);
  assert.equal(validLegacyPaidSession({ ...legacy, amount_total: 2 }), false);
  assert.equal(validLegacyPaidSession({ ...legacy, payment_status: "unpaid" }), false);
  assert.equal(validLegacyPaidSession({ ...legacy, metadata: { collectionName: "parts", listingId: "old-ad" } }), false);
  assert.equal(validLegacyPaidSession({ ...legacy, metadata: { ...legacy.metadata, ownerUid: "someone" } }), false);
});
