import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, after, test } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc, getDocs, collection, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-autoloke", firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
});
after(async () => { await env?.cleanup(); });
test("payment status cannot be forged, pending ads are private, owners can edit", async () => {
  const owner = env.authenticatedContext("owner").firestore();
  const stranger = env.authenticatedContext("other").firestore();
  const guest = env.unauthenticatedContext().firestore();
  const ref = doc(owner, "ads", "pending");
  await assertSucceeds(setDoc(ref, { ownerUid: "owner", paymentStatus: "pending", status: "pending_payment", paidAt: null, activeUntil: null, createdAt: serverTimestamp(), deleteAt: Timestamp.fromMillis(Date.now() + 31 * 86400000) }));
  await assertFails(updateDoc(ref, { paymentStatus: "paid", status: "active" }));
  await assertFails(updateDoc(ref, { stripeSessionId: "cs_fake" }));
  await assertFails(getDoc(doc(guest, "ads", "pending")));
  await assertFails(getDoc(doc(stranger, "ads", "pending")));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(updateDoc(ref, { title: "Updated" }));
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "ads", "pending"), { paymentStatus: "paid", status: "active" });
  });
  await assertSucceeds(getDocs(query(collection(guest, "ads"), where("paymentStatus", "==", "paid"), where("status", "==", "active"))));
  await assertFails(getDocs(collection(guest, "ads")));
});

test("signed Stripe notifications activate once; duplicates and deleted ads stay safe", async () => {
  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const { default: Stripe } = await import("stripe");
  const { NextRequest } = await import("next/server");
  const { POST } = await import("../src/app/api/payments/webhook/route");
  const app = initializeApp({ projectId: "demo-autoloke" }, "autoloke-server");
  process.env.STRIPE_SECRET_KEY = "sk_test_local_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_placeholder";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const ref = getFirestore(app).doc("ads/webhook");
  try {
    await ref.set({ ownerUid: "owner", paymentStatus: "pending", status: "pending_payment" });
    const event = { id: "evt_local", type: "checkout.session.completed", created: Math.floor(Date.now() / 1000), data: { object: { id: "cs_local", mode: "payment", payment_status: "paid", amount_total: 100, currency: "eur", metadata: { collectionName: "ads", listingId: "webhook", ownerUid: "owner" } } } };
    async function send(value: unknown, validSignature = true) {
      const payload = JSON.stringify(value);
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
      return POST(new NextRequest("http://localhost/api/payments/webhook", { method: "POST", body: payload, headers: { "stripe-signature": validSignature ? signature : "invalid" } }));
    }
    assert.equal((await send(event, false)).status, 400);
    assert.equal((await ref.get()).data()?.paymentStatus, "pending");
    const responses = await Promise.all([send(event), send(event)]);
    assert.ok(responses.every((r) => r.status === 200));
    const first = (await ref.get()).data()!;
    assert.equal(first.paymentStatus, "paid");
    await send({ ...event, id: "evt_duplicate", created: event.created + 20 });
    assert.equal((await ref.get()).data()!.activeUntil.toMillis(), first.activeUntil.toMillis());
    // Existing production Checkout sessions were created without ownerUid metadata.
    // Honor them only when the session ID matches the one persisted on the listing.
    const legacyRef = getFirestore(app).doc("ads/legacy");
    await legacyRef.set({ ownerUid: "owner", paymentStatus: "pending", status: "pending_payment", stripeSessionId: "cs_old" });
    const legacyEvent = { ...event, id: "evt_legacy", data: { object: { ...event.data.object, id: "cs_old", metadata: { collectionName: "ads", listingId: "legacy" } } } };
    await send({ ...legacyEvent, id: "evt_legacy_unmatched", data: { object: { ...legacyEvent.data.object, id: "cs_not_bound" } } });
    assert.equal((await legacyRef.get()).data()?.paymentStatus, "pending");
    await send(legacyEvent);
    assert.equal((await legacyRef.get()).data()?.paymentStatus, "paid"); // legacy webhook session
    await ref.delete();
    await send(event);
    assert.equal((await ref.get()).exists, false);
  } finally { await deleteApp(app); }
});
