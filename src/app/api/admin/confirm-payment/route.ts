import { NextRequest, NextResponse } from "next/server";
import { addDays, LISTING_ACTIVE_DAYS, LISTING_DELETE_AFTER_DAYS } from "@/lib/billing";
import { getFirestoreDocument, patchFirestoreDocument, type FirestoreCollectionName } from "@/lib/firebaseAdminRest";

export const runtime = "nodejs";

const ALLOWED_COLLECTIONS = new Set<FirestoreCollectionName>(["ads", "parts", "partRequests"]);

function isAllowedCollection(value: unknown): value is FirestoreCollectionName {
  return typeof value === "string" && ALLOWED_COLLECTIONS.has(value as FirestoreCollectionName);
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.ADMIN_PAYMENT_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const urlSecret = new URL(req.url).searchParams.get("secret");
  return auth === `Bearer ${secret}` || urlSecret === secret;
}

async function confirm(collectionName: FirestoreCollectionName, listingId: string) {
  const listing = await getFirestoreDocument(collectionName, listingId);
  if (!listing) throw new Error("Skelbimas nerastas.");

  const now = new Date();
  return patchFirestoreDocument(collectionName, listingId, {
    paymentStatus: "paid",
    status: "active",
    paidAt: now,
    activeUntil: addDays(now, LISTING_ACTIVE_DAYS),
    deleteAt: addDays(now, LISTING_DELETE_AFTER_DAYS),
    manualPaymentConfirmed: true,
    updatedAt: now,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Nėra leidimo." }, { status: 401 });

  try {
    const body = (await req.json()) as { collectionName?: unknown; listingId?: unknown };
    if (!isAllowedCollection(body.collectionName) || typeof body.listingId !== "string") {
      return NextResponse.json({ error: "Neteisingi duomenys." }, { status: 400 });
    }

    const doc = await confirm(body.collectionName, body.listingId);
    return NextResponse.json({ ok: true, listing: doc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Patvirtinti nepavyko.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Nėra leidimo." }, { status: 401 });

  try {
    const params = new URL(req.url).searchParams;
    const collectionName = params.get("collectionName");
    const listingId = params.get("listingId");

    if (!isAllowedCollection(collectionName) || !listingId) {
      return NextResponse.json({ error: "Neteisingi duomenys." }, { status: 400 });
    }

    const doc = await confirm(collectionName, listingId);
    return NextResponse.json({ ok: true, listing: doc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Patvirtinti nepavyko.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
