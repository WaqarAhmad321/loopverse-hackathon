import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Chip } from "@heroui/react";
import { ArrowLeft, MapPin, Package, User, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";
import type { ShippingAddress, FulfillmentStatus } from "@/types/database";
import { FulfillmentUpdateForm } from "./fulfillment-update-form";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface OrderDetail {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount_amount: number;
  shipping_address: ShippingAddress;
  delivery_method: string;
  created_at: string;
  buyer: { full_name: string; email: string } | null;
}

interface SellerOrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  fulfillment_status: FulfillmentStatus;
  tracking_id: string | null;
  product: {
    id: string;
    name: string;
    images: string[];
    sku: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  Status chip color                                                          */
/* -------------------------------------------------------------------------- */

function statusChipColor(
  status: string
): "success" | "warning" | "danger" | "accent" | "default" {
  const mapped = ORDER_STATUS_COLORS[status];
  if (mapped === "success") return "success";
  if (mapped === "warning") return "warning";
  if (mapped === "danger") return "danger";
  if (mapped === "accent") return "accent";
  return "default";
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { id: orderId } = await params;
  const supabase = await createServerClient();

  // Fetch order details
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, total, subtotal, tax, shipping_cost, discount_amount,
      shipping_address, delivery_method, created_at,
      buyer:users!orders_buyer_id_fkey(full_name, email)`
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    notFound();
  }

  const orderData = order as unknown as OrderDetail;

  // Fetch seller's items in this order
  const { data: sellerItems } = await supabase
    .from("order_items")
    .select(
      `id, quantity, unit_price, total_price, fulfillment_status, tracking_id,
      product:products!inner(id, name, images, sku)`
    )
    .eq("order_id", orderId)
    .eq("seller_id", user.id);

  if (!sellerItems || sellerItems.length === 0) {
    notFound();
  }

  const items = sellerItems as unknown as SellerOrderItem[];
  const address = orderData.shipping_address;

  const sellerItemsTotal = items.reduce((s, i) => s + i.total_price, 0);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          href="/seller/orders"
          className="flex size-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] transition-colors duration-150 hover:bg-[var(--default)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            Order Details
          </h1>
          <p className="mt-0.5 font-mono text-xs text-[color:var(--muted)]">
            #{orderId.slice(0, 8)}
          </p>
        </div>
        <Chip
          size="sm"
          color={statusChipColor(orderData.status)}
          variant="soft"
        >
          {ORDER_STATUS_LABELS[orderData.status] ?? orderData.status}
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Order Items */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
            <div className="border-b border-[var(--border)] px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                Your Items in This Order
              </h2>
              <p className="mt-0.5 font-body text-sm text-[color:var(--muted)]">
                Only showing items from your store
              </p>
            </div>
            <div className="divide-y divide-[var(--border-light,var(--separator))] px-6">
              {items.map((item) => (
                <div key={item.id} className="py-5">
                  <div className="flex gap-4">
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="size-16 rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-[10px] bg-[var(--default)]">
                        <Package
                          className="size-6 text-[color:var(--muted)]"
                          strokeWidth={2}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                        {item.product.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[color:var(--muted)]">
                        SKU: {item.product.sku}
                      </p>
                      <div className="mt-2 flex items-center gap-4 font-body text-sm text-[color:var(--foreground)]">
                        <span className="text-[color:var(--muted)]">
                          Qty: {item.quantity}
                        </span>
                        <span className="tabular-nums text-[color:var(--muted)]">
                          ${item.unit_price.toFixed(2)} each
                        </span>
                        <span className="font-medium tabular-nums">
                          ${item.total_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] p-4">
                    <FulfillmentUpdateForm
                      orderItemId={item.id}
                      currentStatus={item.fulfillment_status}
                      currentTrackingId={item.tracking_id}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Sidebar info */}
        <div className="space-y-6">
          {/* Buyer Information */}
          <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
              <User className="size-4 text-[color:var(--muted)]" strokeWidth={2} />
              <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                Buyer Information
              </h3>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div>
                <p className="font-body text-xs text-[color:var(--muted)]">
                  Name
                </p>
                <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                  {orderData.buyer?.full_name ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="font-body text-xs text-[color:var(--muted)]">
                  Email
                </p>
                <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                  {orderData.buyer?.email ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="font-body text-xs text-[color:var(--muted)]">
                  Order Date
                </p>
                <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                  {new Date(orderData.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
              <MapPin className="size-4 text-[color:var(--muted)]" strokeWidth={2} />
              <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                Shipping Address
              </h3>
            </div>
            <div className="px-5 py-4 font-body text-sm">
              <p className="font-medium text-[color:var(--foreground)]">
                {address.full_name}
              </p>
              <p className="mt-1 text-[color:var(--muted)]">
                {address.address_line1}
              </p>
              {address.address_line2 && (
                <p className="text-[color:var(--muted)]">
                  {address.address_line2}
                </p>
              )}
              <p className="text-[color:var(--muted)]">
                {address.city}, {address.state} {address.zip_code}
              </p>
              <p className="text-[color:var(--muted)]">{address.country}</p>
              <p className="mt-2 text-[color:var(--muted)]">
                Phone: {address.phone}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
              <FileText className="size-4 text-[color:var(--muted)]" strokeWidth={2} />
              <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
                Order Summary
              </h3>
            </div>
            <div className="space-y-2.5 px-5 py-4 font-body text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Subtotal</span>
                <span className="tabular-nums text-[color:var(--foreground)]">
                  ${orderData.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Tax</span>
                <span className="tabular-nums text-[color:var(--foreground)]">
                  ${orderData.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Shipping</span>
                <span className="tabular-nums text-[color:var(--foreground)]">
                  ${orderData.shipping_cost.toFixed(2)}
                </span>
              </div>
              {orderData.discount_amount > 0 && (
                <div className="flex justify-between text-[var(--success)]">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    -${orderData.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-[var(--border)] pt-2.5">
                <div className="flex justify-between font-bold">
                  <span className="text-[color:var(--foreground)]">Total</span>
                  <span className="font-display tabular-nums text-[color:var(--foreground)]">
                    ${orderData.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[color:var(--muted)]">Delivery</span>
                <span className="capitalize text-[color:var(--foreground)]">
                  {orderData.delivery_method}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[color:var(--muted)]">Your items</span>
                <span className="font-medium tabular-nums text-[color:var(--accent)]">
                  ${sellerItemsTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
