import { Chip } from "@heroui/react";
import {
  ArrowLeft,
  AlertCircle,
  User,
  MapPin,
  Package,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { getOrderDetail } from "@/actions/admin";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getOrderStatusColor(
  status: string
): "default" | "accent" | "success" | "warning" | "danger" {
  const color = ORDER_STATUS_COLORS[status];
  if (
    color === "default" ||
    color === "accent" ||
    color === "success" ||
    color === "warning" ||
    color === "danger"
  ) {
    return color;
  }
  return "default";
}

function getFulfillmentColor(
  status: string
): "default" | "accent" | "success" | "warning" | "danger" {
  switch (status) {
    case "delivered":
      return "success";
    case "shipped":
      return "accent";
    case "packed":
    case "confirmed":
      return "warning";
    default:
      return "default";
  }
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderDetail(id);

  if ("error" in order) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--accent)] transition-colors hover:text-[var(--accent-hover,#0F766E)]"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to Orders
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--danger)]/10">
            <AlertCircle
              className="size-6 text-[var(--danger)]"
              strokeWidth={2}
            />
          </div>
          <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
            {order.error}
          </p>
        </div>
      </div>
    );
  }

  const shippingAddr = order.shipping_address as Record<string, string> | null;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--accent)] transition-colors hover:text-[var(--accent-hover,#0F766E)]"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            Order Detail
          </h1>
          <p className="mt-1 font-mono text-sm text-[color:var(--muted)]">
            {order.id}
          </p>
        </div>
        <Chip
          color={getOrderStatusColor(order.status)}
          variant="soft"
          size="lg"
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Chip>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Buyer info */}
        <div className="rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]">
          <div className="mb-3 flex items-center gap-2">
            <User
              className="size-4 text-[var(--accent)]"
              strokeWidth={2}
            />
            <span className="font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Buyer
            </span>
          </div>
          <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
            {order.buyer_name}
          </p>
          <p className="mt-0.5 font-body text-xs text-[color:var(--muted)]">
            {order.buyer_email}
          </p>
        </div>

        {/* Shipping address */}
        <div className="rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]">
          <div className="mb-3 flex items-center gap-2">
            <MapPin
              className="size-4 text-[var(--accent)]"
              strokeWidth={2}
            />
            <span className="font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Shipping Address
            </span>
          </div>
          {shippingAddr ? (
            <div className="space-y-0.5 font-body text-sm text-[color:var(--foreground)]">
              <p>{shippingAddr.full_name}</p>
              <p className="text-xs text-[color:var(--muted)]">
                {shippingAddr.address_line1}
                {shippingAddr.address_line2 && `, ${shippingAddr.address_line2}`}
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                {shippingAddr.city}, {shippingAddr.state}{" "}
                {shippingAddr.zip_code}
              </p>
            </div>
          ) : (
            <p className="font-body text-sm text-[color:var(--muted)]">
              No address on file
            </p>
          )}
        </div>

        {/* Payment summary */}
        <div className="rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard
              className="size-4 text-[var(--accent)]"
              strokeWidth={2}
            />
            <span className="font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Payment Summary
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between font-body text-xs text-[color:var(--muted)]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-body text-xs text-[color:var(--muted)]">
              <span>Tax</span>
              <span className="tabular-nums">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between font-body text-xs text-[color:var(--muted)]">
              <span>Shipping</span>
              <span className="tabular-nums">{formatCurrency(order.shipping_cost)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between font-body text-xs text-[var(--success)]">
                <span>Discount</span>
                <span className="tabular-nums">
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            )}
            <div className="border-t border-[var(--border)] pt-1.5">
              <div className="flex justify-between font-body text-sm font-semibold text-[color:var(--foreground)]">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order date */}
      <p className="font-body text-xs text-[color:var(--muted)]">
        Placed on {formatDate(order.created_at)}
      </p>

      {/* Order items */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Package className="size-5 text-[var(--accent)]" strokeWidth={2} />
          <h2 className="font-display text-lg font-bold text-[color:var(--foreground)]">
            Order Items ({order.items.length})
          </h2>
        </div>

        <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
          {order.items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-body text-sm text-[color:var(--muted)]">
                No items found for this order
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Product
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Seller
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Qty
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Unit Price
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Total
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Fulfillment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                    >
                      <td className="px-5 py-3.5">
                        {item.product_slug ? (
                          <Link
                            href={`/products/${item.product_slug}`}
                            className="font-body text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover,#0F766E)]"
                          >
                            {item.product_name}
                          </Link>
                        ) : (
                          <span className="font-body text-sm font-medium text-[color:var(--foreground)]">
                            {item.product_name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm text-[color:var(--foreground)]">
                        {item.seller_name}
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm tabular-nums text-[color:var(--foreground)]">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm tabular-nums text-[color:var(--muted)]">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                        {formatCurrency(item.total_price)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Chip
                          color={getFulfillmentColor(item.fulfillment_status)}
                          variant="soft"
                          size="sm"
                        >
                          {item.fulfillment_status}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
