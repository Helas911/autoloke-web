import { NextRequest, NextResponse } from "next/server";
import { BILLING_CURRENCY, LISTING_PRICE_CENTS } from "@/lib/billing";
import { adminDb, authenticatedUid } from "@/lib/firebaseAdmin";
import { stripeClient } from "@/lib/stripeServer";
import { payableListing, safePaymentOrigin } from "@/lib/paymentPolicy";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const uid = await authenticatedUid(req);
  if (!uid) return NextResponse.json({ error: "Prisijunkite iš naujo." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Neteisingi duomenys." }, { status: 400 }); }
  const { collectionName, listingId } = body || {};
  if (collectionName !== "ads" || typeof listingId !== "string" || !/^[a-zA-Z0-9_-]{1,150}$/.test(listingId)) {
    return NextResponse.json({ error: "Neteisingas skelbimas." }, { status: 400 });
  }
  try {
    const ref = adminDb().collection("ads").doc(listingId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Skelbimas nerastas." }, { status: 404 });
    const listing = snap.data()!;
    const problem = payableListing(listing, uid);
    if (problem) return NextResponse.json({ error: problem === "forbidden" ? "Tai ne jūsų skelbimas." : problem === "already_paid" ? "Skelbimas jau apmokėtas." : "Skelbimo galiojimas baigiasi. Sukurkite naują skelbimą." }, { status: problem === "forbidden" ? 403 : 409 });
    const stripe = stripeClient();
    const origin = safePaymentOrigin(req.url);
    let generation = 0;
    if (listing.stripeSessionId) {
      const previous = await stripe.checkout.sessions.retrieve(listing.stripeSessionId);
      if (previous.status === "open" && previous.url) return NextResponse.json({ url: previous.url });
      if (previous.status === "complete") return NextResponse.json({ error: "Mokėjimas tikrinamas. Patikrinkite „Mano skelbimai“." }, { status: 409 });
      generation = previous.created;
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allowed_payment_method_types: ["card"],
      success_url: `${origin}/moketa?listingId=${encodeURIComponent(listingId)}`,
      cancel_url: `${origin}/mano?payment=cancelled`,
      client_reference_id: listingId,
      line_items: [{ price_data: { currency: BILLING_CURRENCY, unit_amount: LISTING_PRICE_CENTS,
        product_data: { name: "Autoloke – 30 dienų / 30 dage" } }, quantity: 1 }],
      metadata: { collectionName: "ads", listingId, ownerUid: uid },
    }, { idempotencyKey: `listing:${listingId}:${generation}` });
    // Never reset paid status: a webhook can arrive before this write completes.
    await adminDb().runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.exists && current.data()?.paymentStatus !== "paid") tx.update(ref, { stripeSessionId: session.id });
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("checkout failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Apmokėjimas šiuo metu nepasiekiamas. Skelbimas išsaugotas skiltyje „Mano skelbimai“." }, { status: 503 });
  }
}
