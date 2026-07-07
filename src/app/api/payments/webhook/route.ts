import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { addDays, LISTING_ACTIVE_DAYS, LISTING_DELETE_AFTER_DAYS } from "@/lib/billing";
import { patchFirestoreDocument, type FirestoreCollectionName } from "@/lib/firebaseAdminRest";

export const runtime = "nodejs";

const ALLOWED_COLLECTIONS = new Set<FirestoreCollectionName>(["ads", "parts", "partRequests"]);

type StripeEvent = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      payment_status?: string;
      payment_intent?: string | null;
      metadata?: {
        collectionName?: string;
        listingId?: string;
      };
    };
  };
};

function parseStripeSignature(header: string) {
  const parts: Record<string, string[]> = {};
  header.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return;
    parts[key] = [...(parts[key] || []), value];
  });
  return parts;
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function verifyStripeWebhook(payload: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;

  const sig = parseStripeSignature(signatureHeader);
  const timestamp = sig.t?.[0];
  const signatures = sig.v1 || [];
  if (!timestamp || signatures.length === 0) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return signatures.some((candidate) => safeEqualHex(candidate, expected));
}

function isAllowedCollection(value: unknown): value is FirestoreCollectionName {
  return typeof value === "string" && ALLOWED_COLLECTIONS.has(value as FirestoreCollectionName);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Trūksta STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!verifyStripeWebhook(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Neteisingas Stripe parašas." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const collectionName = session?.metadata?.collectionName;
    const listingId = session?.metadata?.listingId;

    if (session?.payment_status === "paid" && isAllowedCollection(collectionName) && listingId) {
      const now = new Date();
      await patchFirestoreDocument(collectionName, listingId, {
        paymentStatus: "paid",
        status: "active",
        paidAt: now,
        activeUntil: addDays(now, LISTING_ACTIVE_DAYS),
        deleteAt: addDays(now, LISTING_DELETE_AFTER_DAYS),
        stripeSessionId: session.id || null,
        stripePaymentIntentId: session.payment_intent || null,
        updatedAt: now,
      });
    }
  }

  return NextResponse.json({ received: true });
}
