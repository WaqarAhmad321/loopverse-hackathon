import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/stripe/webhooks";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        if (!orderId) {
          console.error("No order_id in checkout session metadata");
          break;
        }

        if (session.payment_status === "paid" && paymentIntentId) {
          await supabase
            .from("orders")
            .update({
              stripe_payment_intent_id: paymentIntentId,
              status: "confirmed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          // Upsert payment record
          await supabase.from("payments").upsert(
            {
              order_id: orderId,
              stripe_payment_intent_id: paymentIntentId,
              amount: (session.amount_total ?? 0) / 100,
              status: "succeeded" as const,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_payment_intent_id" }
          );

          console.log(
            `Checkout session completed for order ${orderId}, PI: ${paymentIntentId}`
          );
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.order_id;

        if (!orderId) {
          console.error("No order_id in payment intent metadata");
          break;
        }

        // Update payment record
        await supabase
          .from("payments")
          .update({
            status: "succeeded",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        // Update order status
        await supabase
          .from("orders")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        console.log(
          `Payment succeeded for order ${orderId}, PI: ${paymentIntent.id}`
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.order_id;

        // Update payment record
        await supabase
          .from("payments")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (orderId) {
          console.log(
            `Payment failed for order ${orderId}, PI: ${paymentIntent.id}`
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Webhook handler error";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
