import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only production readiness probe. Returns statuses only, never data, IDs, or credentials.
export async function GET() {
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const publicApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  let adminFirestore: boolean = false;
  try {
    const snap = await adminDb().collection("ads").limit(1).get();
    adminFirestore = typeof snap.empty === "boolean";
  } catch {
    adminFirestore = false;
  }

  const codes: Record<string, number | null> = {
    publicPartsList: null,
    unrestrictedAdsList: null,
    privateUsersList: null,
    filteredPaidAdsList: null,
  };

  if (publicProjectId && publicApiKey) {
    const root = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(publicProjectId)}/databases/(default)/documents`;
    const queryKey = `key=${encodeURIComponent(publicApiKey)}`;
    const options = { cache: "no-store" as const, signal: AbortSignal.timeout(8000) };

    async function statusOf(url: string, init?: RequestInit) {
      try {
        const res = await fetch(url, { ...options, ...init });
        return res.status;
      } catch {
        return null;
      }
    }

    const paidOnly = {
      structuredQuery: {
        from: [{ collectionId: "ads" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              { fieldFilter: { field: { fieldPath: "paymentStatus" }, op: "EQUAL", value: { stringValue: "paid" } } },
              { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "active" } } },
            ],
          },
        },
        limit: 1,
      },
    };

    const [parts, ads, users, paidAds] = await Promise.all([
      statusOf(`${root}/parts?pageSize=1&${queryKey}`),
      statusOf(`${root}/ads?pageSize=1&${queryKey}`),
      statusOf(`${root}/users?pageSize=1&${queryKey}`),
      statusOf(`${root}:runQuery?${queryKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paidOnly),
      }),
    ]);
    codes.publicPartsList = parts;
    codes.unrestrictedAdsList = ads;
    codes.privateUsersList = users;
    codes.filteredPaidAdsList = paidAds;
  }

  const rulesValidated = codes.publicPartsList === 200
    && codes.unrestrictedAdsList === 403
    && codes.privateUsersList === 403
    && codes.filteredPaidAdsList === 200;

  return NextResponse.json({
    adminFirestore,
    rulesValidated,
    publicReadStatus: codes,
    checkoutEnabled: process.env.STRIPE_CHECKOUT_ENABLED === "true",
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET,
    note: "Read-only health check; no listing or payment data is exposed.",
  }, { headers: { "Cache-Control": "no-store" } });
}
