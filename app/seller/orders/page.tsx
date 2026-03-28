import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Chip } from "@heroui/react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface SellerOrderRow {
  order_id: string;
  fulfillment_status: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order: {
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer: { full_name: string } | null;
  };
  product: { name: string };
}

/* -------------------------------------------------------------------------- */
/*  Fulfillment chip color                                                     */
/* -------------------------------------------------------------------------- */

function fulfillmentChipColor(
  status: string
): "success" | "warning" | "accent" | "default" {
  if (status === "delivered") return "success";
  if (status === "pending") return "warning";
  if (["confirmed", "packed", "shipped"].includes(status)) return "accent";
  return "default";
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from("order_items")
    .select(
      `order_id, fulfillment_status, quantity, unit_price, total_price,
      order:orders!inner(id, status, total, created_at, buyer:users!orders_buyer_id_fkey(full_name)),
      product:products!inner(name)`
    )
    .eq("seller_id", user.id)
    .order("order_id", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("fulfillment_status", params.status);
  }

  const { data: orderItems } = await query;
  const items = (orderItems ?? []) as unknown as SellerOrderRow[];

  // Group by order
  const orderMap = new Map<
    string,
    {
      orderId: string;
      buyerName: string;
      items: {
        name: string;
        quantity: number;
        total: number;
        fulfillmentStatus: string;
      }[];
      orderTotal: number;
      status: string;
      createdAt: string;
    }
  >();

  for (const item of items) {
    const existing = orderMap.get(item.order_id);
    const itemData = {
      name: item.product.name,
      quantity: item.quantity,
      total: item.total_price,
      fulfillmentStatus: item.fulfillment_status,
    };

    if (existing) {
      existing.items.push(itemData);
    } else {
      orderMap.set(item.order_id, {
        orderId: item.order_id,
        buyerName: item.order.buyer?.full_name ?? "Unknown",
        items: [itemData],
        orderTotal: item.order.total,
        status: item.order.status,
        createdAt: item.order.created_at,
      });
    }
  }

  const orders = Array.from(orderMap.values());

  const fulfillmentStatuses = [
    "all",
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
  ];

  const activeStatus = params.status ?? "all";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Orders
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Manage orders containing your products
        </p>
      </div>

      {/* Fulfillment status filter */}
      <div className="flex flex-wrap gap-2">
        {fulfillmentStatuses.map((status) => {
          const isSelected = activeStatus === status;
          return (
            <Link
              key={status}
              href={`/seller/orders${status === "all" ? "" : `?status=${status}`}`}
            >
              <Chip
                size="sm"
                color={isSelected ? "accent" : "default"}
                variant={isSelected ? "primary" : "soft"}
                className="cursor-pointer font-body text-xs capitalize"
              >
                {status === "all" ? "All" : status}
              </Chip>
            </Link>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
              <ShoppingBag
                className="size-6 text-[color:var(--muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
              No orders found
            </p>
            <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
              {params.status
                ? "Try changing your filter"
                : "Orders will appear here once buyers purchase your products"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Order ID
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Buyer
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Items
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Fulfillment
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
                {orders.map((order) => {
                  // Show the "worst" fulfillment status for multi-item orders
                  const statuses = order.items.map(
                    (i) => i.fulfillmentStatus
                  );
                  const displayStatus = statuses.includes("pending")
                    ? "pending"
                    : statuses.includes("confirmed")
                      ? "confirmed"
                      : statuses.includes("packed")
                        ? "packed"
                        : statuses.includes("shipped")
                          ? "shipped"
                          : "delivered";

                  return (
                    <tr
                      key={order.orderId}
                      className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/seller/orders/${order.orderId}`}
                          className="font-mono text-xs font-medium text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-hover,#0F766E)]"
                        >
                          {order.orderId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm text-[color:var(--foreground)]">
                        {order.buyerName}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p
                              key={idx}
                              className="font-body text-xs text-[color:var(--muted)]"
                            >
                              {item.name} x{item.quantity}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="font-body text-xs text-[color:var(--muted)]">
                              +{order.items.length - 2} more
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                        ${order.orderTotal.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Chip
                          size="sm"
                          color={fulfillmentChipColor(displayStatus)}
                          variant="soft"
                          className="capitalize"
                        >
                          {displayStatus}
                        </Chip>
                      </td>
                      <td className="px-5 py-3.5 font-body text-xs text-[color:var(--muted)]">
                        {new Date(order.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
