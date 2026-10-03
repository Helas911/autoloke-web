import { NextRequest, NextResponse } from "next/server";
import { addDays, LISTING_ACTIVE_DAYS, LISTING_DELETE_AFTER_DAYS } from "@/lib/billing";
import { adminDb } from "@/lib/firebaseAdmin";
import { stripeClient } from "@/lib/stripeServer";
import { validPaidSession } from "@/lib/paymentPolicy";
import type Stripe from "stripe";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payment configuration missing" }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") || "", secret);
  } catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return NextResponse.json({ received: true });
  const session = event.data.object as Stripe.Checkout.Session;
  if (!validPaidSession(session)) return NextResponse.json({ received: true });
  const id = session.metadata!.listingId;
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(id)) return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
  try {
    const ref = adminDb().collection("ads").doc(id);
    await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      // A delayed notification must not recreate a deleted listing or extend its life.
      if (!snap.exists) return;
      const listing = snap.data()!;
      if (listing.ownerUid !== session.metadata!.ownerUid || listing.paymentStatus === "paid" || listing.status === "deleting") return;
      const paidAt = new Date(event.created * 1000);
      tx.update(ref, {
        paymentStatus: "paid", status: "active", paidAt,
        activeUntil: addDays(paidAt, LISTING_ACTIVE_DAYS),
        deleteAt: addDays(paidAt, LISTING_DELETE_AFTER_DAYS),
        stripeSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        stripeEventId: event.id, updatedAt: new Date(),
      });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("payment activation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Activation failed; retry" }, { status: 500 });
  }
}
