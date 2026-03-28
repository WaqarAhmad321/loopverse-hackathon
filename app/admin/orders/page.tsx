import { Chip } from "@heroui/react";
import { ShoppingBag, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createServerClient, getUserWithRoles } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";
import { OrderFilters } from "./order-filters";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface OrderRow {
  id: string;
  buyer_name: string;
  total: number;
  status: string;
  created_at: string;
  seller_names: string[];
}

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const page = Number(params.page) || 1;
  const perPage = 20;

  const user = await getUserWithRoles();
  if (!user || !user.roles.includes("admin")) {
    redirect("/");
  }

  const supabase = await createServerClient();

  /* -- Fetch orders -------------------------------------------------------- */
  let query = supabase
    .from("orders")
    .select("id, buyer_id, total, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const offset = (page - 1) * perPage;
  query = query.range(offset, offset + perPage - 1);

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  /* -- Buyer names --------------------------------------------------------- */
  const buyerIds = [...new Set((orders ?? []).map((o) => o.buyer_id))];
  const { data: buyers } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", buyerIds.length > 0 ? buyerIds : ["__none__"]);

  const buyerNameMap = new Map<string, string>();
  for (const b of buyers ?? []) {
    buyerNameMap.set(b.id, b.full_name);
  }

  /* -- Seller names per order ---------------------------------------------- */
  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id, seller_id")
    .in("order_id", orderIds.length > 0 ? orderIds : ["__none__"]);

  const orderSellerIds = new Map<string, Set<string>>();
  for (const item of orderItems ?? []) {
    const existing = orderSellerIds.get(item.order_id) ?? new Set<string>();
    existing.add(item.seller_id);
    orderSellerIds.set(item.order_id, existing);
  }

  const allSellerIds = [
    ...new Set((orderItems ?? []).map((i) => i.seller_id)),
  ];
  const { data: sellerUsers } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", allSellerIds.length > 0 ? allSellerIds : ["__none__"]);

  const sellerNameMap = new Map<string, string>();
  for (const s of sellerUsers ?? []) {
    sellerNameMap.set(s.id, s.full_name);
  }

  const rows: OrderRow[] = (orders ?? []).map((o) => {
    const sellerIdSet = orderSellerIds.get(o.id) ?? new Set<string>();
    const sellerNames = [...sellerIdSet].map(
      (sid) => sellerNameMap.get(sid) ?? "Unknown"
    );

    return {
      id: o.id,
      buyer_name: buyerNameMap.get(o.buyer_id) ?? "Unknown",
      total: o.total,
      status: o.status,
      created_at: o.created_at,
      seller_names: sellerNames,
    };
  });

  /* -- Render -------------------------------------------------------------- */
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Order Management
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          All platform orders ({count ?? 0} total)
        </p>
      </div>

      {/* Filters + pagination */}
      <OrderFilters
        currentStatus={statusFilter}
        page={page}
        totalPages={totalPages}
      />

      {/* Orders table */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {rows.length === 0 ? (
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
              {statusFilter
                ? `No orders with status "${ORDER_STATUS_LABELS[statusFilter] ?? statusFilter}"`
                : "No orders on the platform yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Order ID
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Buyer
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Seller(s)
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
                {rows.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-medium text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-hover,#0F766E)]"
                      >
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm text-[color:var(--foreground)]">
                      {order.buyer_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {order.seller_names.length === 0 ? (
                          <span className="font-body text-sm text-[color:var(--muted)]">
                            --
                          </span>
                        ) : (
                          order.seller_names.map((name, idx) => (
                            <span
                              key={`${order.id}-seller-${idx}`}
                              className="font-body text-sm text-[color:var(--foreground)]"
                            >
                              {name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Chip
                        color={getOrderStatusColor(order.status)}
                        variant="soft"
                        size="sm"
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </Chip>
                    </td>
                    <td className="px-5 py-3.5 font-body text-xs text-[color:var(--muted)]">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
