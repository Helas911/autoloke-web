import { auth } from "./firebase";

export type PaymentCollectionName = "ads" | "parts" | "partRequests";

export async function startListingPayment({
  collectionName,
  listingId,
}: {
  collectionName: PaymentCollectionName;
  listingId: string;
}) {
  const user = auth?.currentUser;
  if (!user) throw new Error("Prisijunkite, kad galėtumėte apmokėti.");
  // Request a freshly issued Firebase ID token to avoid stale sessions during checkout.
  const token = await user.getIdToken(true);
  const res = await fetch("/api/payments/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ collectionName, listingId }),
  });

  let data: { url?: string; error?: string; authError?: string } = {};
  try {
    data = (await res.json()) as { url?: string; error?: string; authError?: string };
  } catch {
    data = {};
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error || "Nepavyko pradėti apmokėjimo.");
  }

  window.location.href = data.url;
}
