import Stripe from "stripe";
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe configuration missing");
  return new Stripe(key, { maxNetworkRetries: 2 });
}
