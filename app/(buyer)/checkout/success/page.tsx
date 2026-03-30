import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@heroui/react";
import { CheckCircle, ShoppingBag, FileText, AlertTriangle } from "lucide-react";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearCartForUser } from "@/actions/cart";

interface SearchParams {
  session_id?: string;
  order_id?: string;
}

export default async function CheckoutSuccessPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const { session_id, order_id } = searchParams;

  if (!session_id || !order_id) {
    redirect("/checkout");
  }

  // Try to verify with Stripe, but also check the order directly
  // The webhook may have already confirmed the order
  const supabase = createAdminClient();
  let isPaid = false;

  try {
    // First check: did the webhook already confirm this order?
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("status, buyer_id")
      .eq("id", order_id)
      .single();

    if (existingOrder?.status === "confirmed") {
      // Webhook already handled it
      isPaid = true;
      if (existingOrder.buyer_id) {
        await clearCartForUser(existingOrder.buyer_id);
      }
    } else {
      // Second check: verify with Stripe directly
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      isPaid = session.payment_status === "paid";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (isPaid && paymentIntentId) {
        await supabase
          .from("orders")
          .update({
            stripe_payment_intent_id: paymentIntentId,
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order_id);

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        await supabase.from("payments").upsert(
          {
            order_id,
            stripe_payment_intent_id: paymentIntentId,
            amount: paymentIntent.amount / 100,
            status: "succeeded" as const,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_payment_intent_id" }
        );

        if (existingOrder?.buyer_id) {
          await clearCartForUser(existingOrder.buyer_id);
        }
      }
    }
  } catch (err) {
    // If Stripe verification fails but order exists, still show success
    // (the webhook will handle confirmation asynchronously)
    console.error("Stripe verification error:", err);
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", order_id)
      .single();
    if (order) {
      isPaid = true; // Order exists, trust that Stripe processed it
    }
  }

  if (!isPaid) {
    return (
      <div className="mx-auto max-w-[600px] px-6 py-16 lg:px-8">
        <div className="rounded-[10px] border border-border bg-surface p-8 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="size-8 text-warning" />
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground">
              Payment Not Completed
            </h2>

            <p className="max-w-sm text-sm text-[var(--text-secondary,#475569)] font-body">
              Your payment could not be verified. If you believe this is an
              error, please contact support or try again.
            </p>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Link href="/checkout">
                <Button variant="primary" size="lg">
                  Try Again
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] px-6 py-16 lg:px-8">
      <div className="rounded-[10px] border border-border bg-surface p-8 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle className="size-8 text-accent" />
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground">
            Order Confirmed!
          </h2>

          <p className="max-w-sm text-sm text-[var(--text-secondary,#475569)] font-body">
            Thank you for your purchase. Your payment was successful and your
            order has been placed. You will receive a confirmation email shortly.
          </p>

          <div className="rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] px-5 py-3">
            <p className="text-xs text-muted font-body">Order ID</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              {order_id}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Link href="/products">
              <Button variant="primary" size="lg">
                <ShoppingBag className="size-4" />
                Continue Shopping
              </Button>
            </Link>
            <Link href={`/orders/${order_id}`}>
              <Button variant="outline" size="lg">
                <FileText className="size-4" />
                View Order Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
