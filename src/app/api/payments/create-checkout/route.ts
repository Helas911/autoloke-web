import { NextRequest, NextResponse } from "next/server";
import { BILLING_CURRENCY, LISTING_ACTIVE_DAYS, LISTING_DELETE_AFTER_DAYS, LISTING_PRICE_CENTS, LISTING_PRICE_EUR } from "@/lib/billing";
import { getFirestoreDocument, patchFirestoreDocument, type FirestoreCollectionName } from "@/lib/firebaseAdminRest";

export const runtime = "nodejs";

const ALLOWED_COLLECTIONS = new Set<FirestoreCollectionName>(["ads", "parts", "partRequests"]);

function getOrigin(req: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || req.headers.get("origin") || new URL(req.url).origin;
}

function isAllowedCollection(value: unknown): value is FirestoreCollectionName {
  return typeof value === "string" && ALLOWED_COLLECTIONS.has(value as FirestoreCollectionName);
}

export async function POST(req: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: "Trūksta STRIPE_SECRET_KEY Vercel aplinkoje." }, { status: 500 });
    }

    const body = (await req.json()) as { collectionName?: unknown; listingId?: unknown };
    const { collectionName, listingId } = body;

    if (!isAllowedCollection(collectionName) || typeof listingId !== "string" || !listingId.trim()) {
      return NextResponse.json({ error: "Neteisingas skelbimo ID." }, { status: 400 });
    }

    const listing = await getFirestoreDocument(collectionName, listingId);
    if (!listing) {
      return NextResponse.json({ error: "Skelbimas nerastas." }, { status: 404 });
    }

    await patchFirestoreDocument(collectionName, listingId, {
      paymentStatus: "pending",
      status: "pending_payment",
      listingPriceCents: LISTING_PRICE_CENTS,
      listingPriceEur: LISTING_PRICE_EUR,
      currency: BILLING_CURRENCY,
      activeDays: LISTING_ACTIVE_DAYS,
      deleteAfterDays: LISTING_DELETE_AFTER_DAYS,
      updatedAt: new Date(),
    });

    const origin = getOrigin(req);
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${origin}/moketa`);
    params.append("cancel_url", `${origin}/ikelti?payment=cancelled`);
    params.append("line_items[0][price_data][currency]", BILLING_CURRENCY);
    params.append("line_items[0][price_data][unit_amount]", String(LISTING_PRICE_CENTS));
    params.append("line_items[0][price_data][product_data][name]", "Autoloke.lt skelbimas 30 dienų");
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[collectionName]", collectionName);
    params.append("metadata[listingId]", listingId);
    params.append("payment_intent_data[metadata][collectionName]", collectionName);
    params.append("payment_intent_data[metadata][listingId]", listingId);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = (await stripeRes.json()) as { id?: string; url?: string; error?: { message?: string } };

    if (!stripeRes.ok || !session.url || !session.id) {
      return NextResponse.json({ error: session.error?.message || "Stripe mokėjimo sukurti nepavyko." }, { status: 500 });
    }

    await patchFirestoreDocument(collectionName, listingId, {
      stripeSessionId: session.id,
      updatedAt: new Date(),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mokėjimo klaida.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
