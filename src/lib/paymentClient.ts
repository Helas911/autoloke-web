export type PaymentCollectionName = "ads" | "parts" | "partRequests";

export async function startListingPayment({
  collectionName,
  listingId,
}: {
  collectionName: PaymentCollectionName;
  listingId: string;
}) {
  const res = await fetch("/api/payments/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collectionName, listingId }),
  });

  let data: { url?: string; error?: string } = {};
  try {
    data = (await res.json()) as { url?: string; error?: string };
  } catch {
    data = {};
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error || "Nepavyko pradėti apmokėjimo.");
  }

  window.location.href = data.url;
}
