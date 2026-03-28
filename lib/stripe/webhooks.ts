import type Stripe from "stripe";
import { getStripe } from "./client";

export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set in environment variables");
  }
  return getStripe().webhooks.constructEvent(body, signature, webhookSecret);
}

export function extractPaymentIntentData(event: Stripe.Event): {
  paymentIntentId: string;
  amount: number;
  metadata: Stripe.Metadata;
} | null {
  if (
    event.type !== "payment_intent.succeeded" &&
    event.type !== "payment_intent.payment_failed"
  ) {
    return null;
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  return {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    metadata: paymentIntent.metadata,
  };
}
