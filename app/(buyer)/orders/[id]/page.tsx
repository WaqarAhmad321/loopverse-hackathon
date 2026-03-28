import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient, getUser } from "@/lib/supabase/server";
import { Chip } from "@heroui/react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  CircleDot,
} from "lucide-react";
import type {
  Order,
  OrderItem,
  Product,
  FulfillmentStatus,
} from "@/types/database";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";
import { ReturnRequestButton } from "./return-request-button";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

type OrderItemWithProduct = OrderItem & {
  products: Pick<Product, "id" | "name" | "slug" | "images">;
};

const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

const FULFILLMENT_COLORS: Record<FulfillmentStatus, string> = {
  pending: "warning",
  confirmed: "default",
  packed: "default",
  shipped: "default",
  delivered: "success",
};

const ORDER_TIMELINE_STEPS: {
  status: string;
  label: string;
  icon: typeof Clock;
}[] = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle },
  { status: "packed", label: "Packed", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle },
];

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products:product_id (
          id, name, slug, images
        )
      )
    `
    )
    .eq("id", id)
    .eq("buyer_id", user.id)
    .single();

  if (error || !order) {
    notFound();
  }

  const typedOrder = order as Order & {
    order_items: OrderItemWithProduct[];
  };

  const isCancelled = typedOrder.status === "cancelled";
  const isReturned = typedOrder.status === "returned";

  // Determine current step index for timeline
  const currentStepIndex = isCancelled || isReturned
    ? -1
    : ORDER_TIMELINE_STEPS.findIndex((s) => s.status === typedOrder.status);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm font-body">
        <Link
          href="/"
          className="text-muted transition-colors hover:text-foreground"
        >
          Home
        </Link>
        <span className="text-muted">/</span>
        <Link
          href="/orders"
          className="text-muted transition-colors hover:text-foreground"
        >
          Orders
        </Link>
        <span className="text-muted">/</span>
        <span className="font-mono text-foreground">
          #{typedOrder.id.slice(0, 8).toUpperCase()}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
            Order #{typedOrder.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-muted font-body">
            Placed on{" "}
            {new Date(typedOrder.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Chip
          size="md"
          color={
            (ORDER_STATUS_COLORS[typedOrder.status] ?? "default") as
              | "warning"
              | "success"
              | "danger"
              | "default"
          }
          variant="soft"
        >
          {ORDER_STATUS_LABELS[typedOrder.status] ?? typedOrder.status}
        </Chip>
      </div>

      {/* Order Status Timeline */}
      {!isCancelled && !isReturned && (
        <div className="mb-8 rounded-[10px] border border-border bg-surface p-6 shadow-[var(--surface-shadow)]">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-muted font-body">
            Order Progress
          </h2>
          <div className="flex items-center justify-between">
            {ORDER_TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.status}
                  className="flex flex-1 flex-col items-center"
                >
                  <div className="relative flex w-full items-center justify-center">
                    {/* Connecting line */}
                    {index > 0 && (
                      <div
                        className={`absolute right-1/2 h-0.5 w-full transition-colors ${
                          isCompleted
                            ? "bg-accent"
                            : "bg-border"
                        }`}
                      />
                    )}
                    {/* Icon circle */}
                    <div
                      className={`relative z-10 flex size-9 items-center justify-center rounded-full transition-colors sm:size-10 ${
                        isCurrent
                          ? "bg-accent text-white shadow-[0_0_0_4px_rgba(13,148,136,0.15)]"
                          : isCompleted
                            ? "bg-accent text-white"
                            : "border-2 border-border bg-surface text-muted"
                      }`}
                    >
                      <StepIcon className="size-4 sm:size-[18px]" strokeWidth={2} />
                    </div>
                  </div>
                  <span
                    className={`mt-2.5 text-center text-[11px] leading-tight sm:text-xs font-body ${
                      isCompleted || isCurrent
                        ? "font-medium text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled / Returned notice */}
      {(isCancelled || isReturned) && (
        <div className="mb-8 flex items-center gap-3 rounded-[10px] border border-danger/30 bg-danger/5 px-5 py-4">
          <CircleDot className="size-5 shrink-0 text-danger" />
          <p className="text-sm font-medium text-danger font-body">
            {isCancelled
              ? "This order has been cancelled."
              : "This order has been returned."}
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="rounded-[10px] border border-border bg-surface shadow-[var(--surface-shadow)]">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-display text-base font-semibold text-foreground">
                Items ({typedOrder.order_items.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {typedOrder.order_items.map((item) => {
                const primaryImage = item.products?.images?.[0];

                return (
                  <div key={item.id} className="flex gap-4 px-6 py-5">
                    {/* Product Image */}
                    <Link
                      href={`/products/${item.products?.slug ?? "#"}`}
                      className="shrink-0"
                    >
                      <div className="size-16 overflow-hidden rounded-[10px] border border-border sm:size-20">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={item.products?.name ?? "Product"}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                            <Package className="size-6 text-accent/40" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Item Details */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Link
                        href={`/products/${item.products?.slug ?? "#"}`}
                        className="line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-accent font-body"
                      >
                        {item.products?.name ?? "Unknown Product"}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted font-body">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-xs text-muted font-body">
                          @ ${item.unit_price.toFixed(2)}
                        </span>
                        <Chip
                          size="sm"
                          color={
                            (FULFILLMENT_COLORS[item.fulfillment_status] ??
                              "default") as
                              | "warning"
                              | "success"
                              | "default"
                          }
                          variant="soft"
                        >
                          {FULFILLMENT_LABELS[item.fulfillment_status] ??
                            item.fulfillment_status}
                        </Chip>
                      </div>

                      {item.tracking_id && (
                        <p className="text-xs text-muted font-body">
                          Tracking:{" "}
                          <span className="font-mono">{item.tracking_id}</span>
                        </p>
                      )}

                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-semibold tabular-nums text-foreground font-body">
                          ${item.total_price.toFixed(2)}
                        </span>

                        {item.fulfillment_status === "delivered" &&
                          !isReturned && (
                            <ReturnRequestButton orderItemId={item.id} />
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Summary + Shipping + Payment */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          {/* Order Summary */}
          <div className="rounded-[10px] border border-border bg-surface p-5 shadow-[var(--surface-shadow)]">
            <h2 className="font-display text-base font-semibold text-foreground">
              Summary
            </h2>
            <div className="mt-4 flex flex-col gap-2.5 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="tabular-nums text-foreground">
                  ${typedOrder.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tax</span>
                <span className="tabular-nums text-foreground">
                  ${typedOrder.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span className="tabular-nums text-foreground">
                  {typedOrder.shipping_cost === 0
                    ? "Free"
                    : `$${typedOrder.shipping_cost.toFixed(2)}`}
                </span>
              </div>
              {typedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    -${typedOrder.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="my-1 h-px bg-border" />
              <div className="flex justify-between text-base font-semibold">
                <span className="text-foreground">Total</span>
                <span className="tabular-nums text-foreground">
                  ${typedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-[10px] border border-border bg-surface p-5 shadow-[var(--surface-shadow)]">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-4 text-muted" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-foreground font-body">
                Shipping Address
              </h2>
            </div>
            {typedOrder.shipping_address ? (
              <div className="text-sm leading-relaxed text-muted font-body">
                <p className="font-medium text-foreground">
                  {typedOrder.shipping_address.full_name}
                </p>
                <p>{typedOrder.shipping_address.address_line1}</p>
                {typedOrder.shipping_address.address_line2 && (
                  <p>{typedOrder.shipping_address.address_line2}</p>
                )}
                <p>
                  {typedOrder.shipping_address.city},{" "}
                  {typedOrder.shipping_address.state}{" "}
                  {typedOrder.shipping_address.zip_code}
                </p>
                <p>{typedOrder.shipping_address.country}</p>
                <p className="mt-1.5">{typedOrder.shipping_address.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-muted font-body">
                No shipping address available
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-[10px] border border-border bg-surface p-5 shadow-[var(--surface-shadow)]">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-muted" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-foreground font-body">
                Payment
              </h2>
            </div>
            <div className="text-sm text-muted font-body">
              <p>
                {typedOrder.stripe_payment_intent_id
                  ? `Payment ID: `
                  : "Payment information unavailable"}
                {typedOrder.stripe_payment_intent_id && (
                  <span className="font-mono text-xs">
                    {typedOrder.stripe_payment_intent_id.slice(0, 16)}...
                  </span>
                )}
              </p>
              <p className="mt-1">
                Method: {typedOrder.delivery_method ?? "Standard"}
              </p>
            </div>
          </div>

          <Link
            href="/orders"
            className="
              flex items-center justify-center gap-2 rounded-[10px] border border-border
              px-4 py-2.5 text-sm font-medium text-foreground font-body
              transition-colors hover:bg-accent/[0.04] hover:border-accent/30
            "
          >
            <ArrowLeft className="size-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
