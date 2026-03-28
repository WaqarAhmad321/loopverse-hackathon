import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Chip } from "@heroui/react";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";
import { SalesOverviewChart } from "./sales-overview-chart";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
  alert?: boolean;
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer: { full_name: string } | null;
  items: { quantity: number }[];
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  images: string[];
}

/* -------------------------------------------------------------------------- */
/*  Stat Card                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
  trendUp,
  alert,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]",
        alert && "ring-1 ring-[var(--warning)]/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="font-body text-sm font-medium text-[color:var(--muted)]">
            {title}
          </p>
          <p className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1">
              {trendUp !== undefined && (
                <TrendingUp
                  className={cn(
                    "size-3.5",
                    trendUp
                      ? "text-[var(--success)]"
                      : "rotate-180 text-[var(--danger)]"
                  )}
                  strokeWidth={2.5}
                />
              )}
              <span
                className={cn(
                  "font-body text-xs font-medium",
                  trendUp
                    ? "text-[var(--success)]"
                    : trendUp === false
                      ? "text-[var(--danger)]"
                      : "text-[color:var(--muted)]"
                )}
              >
                {trend}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-[10px]",
            iconBg
          )}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status badge color mapping                                                */
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
/*  Greeting helper                                                           */
/* -------------------------------------------------------------------------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function SellerDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createServerClient();

  // Fetch seller profile for store name
  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("store_name")
    .eq("user_id", user.id)
    .single();

  // Fetch stats in parallel
  // Build the last 7 days date range
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    revenueResult,
    ordersResult,
    pendingResult,
    lowStockResult,
    recentOrdersResult,
    salesChartResult,
  ] = await Promise.all([
    supabase
      .from("order_items")
      .select("total_price")
      .eq("seller_id", user.id)
      .eq("fulfillment_status", "delivered"),

    supabase
      .from("order_items")
      .select("order_id")
      .eq("seller_id", user.id),

    supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .eq("fulfillment_status", "pending"),

    supabase
      .from("products")
      .select("id, name, sku, stock_quantity, images")
      .eq("seller_id", user.id)
      .lt("stock_quantity", 10)
      .order("stock_quantity", { ascending: true })
      .limit(10),

    supabase
      .from("orders")
      .select(
        `id, status, total, created_at,
        buyer:users!orders_buyer_id_fkey(full_name),
        items:order_items!inner(quantity)`
      )
      .eq("order_items.seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("order_items")
      .select("total_price, created_at:orders!inner(created_at)")
      .eq("seller_id", user.id)
      .gte("orders.created_at", sevenDaysAgo.toISOString()),
  ]);

  const totalRevenue =
    revenueResult.data?.reduce(
      (sum, item) => sum + (item.total_price ?? 0),
      0
    ) ?? 0;

  const uniqueOrderIds = new Set(
    ordersResult.data?.map((item) => item.order_id) ?? []
  );
  const totalOrders = uniqueOrderIds.size;
  const pendingCount = pendingResult.count ?? 0;
  const lowStockProducts = (lowStockResult.data ?? []) as LowStockProduct[];
  const recentOrders = (recentOrdersResult.data ??
    []) as unknown as RecentOrder[];

  // Build sales chart data for last 7 days
  const salesByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    salesByDay.set(key, 0);
  }

  if (salesChartResult.data) {
    for (const item of salesChartResult.data) {
      const record = item as unknown as {
        total_price: number;
        created_at: { created_at: string };
      };
      const dateStr = new Date(record.created_at.created_at).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" }
      );
      if (salesByDay.has(dateStr)) {
        salesByDay.set(dateStr, (salesByDay.get(dateStr) ?? 0) + (record.total_price ?? 0));
      }
    }
  }

  const salesChartData = Array.from(salesByDay.entries()).map(
    ([date, revenue]) => ({ date, revenue })
  );

  const storeName = sellerProfile?.store_name ?? "your store";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Dashboard
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          {getGreeting()}, {storeName}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--success)]/10"
          iconColor="text-[var(--success)]"
          trend="from delivered orders"
          trendUp={true}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders.toLocaleString()}
          icon={<ShoppingBag className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--accent)]/10"
          iconColor="text-[var(--accent)]"
        />
        <StatCard
          title="Pending Orders"
          value={pendingCount.toLocaleString()}
          icon={<Clock className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--warning)]/10"
          iconColor="text-[var(--warning)]"
          alert={pendingCount > 0}
          trend={pendingCount > 0 ? "Requires attention" : undefined}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length.toLocaleString()}
          icon={<AlertTriangle className="size-5" strokeWidth={2} />}
          iconBg={
            lowStockProducts.length > 0
              ? "bg-[var(--danger)]/10"
              : "bg-[var(--default)]"
          }
          iconColor={
            lowStockProducts.length > 0
              ? "text-[var(--danger)]"
              : "text-[color:var(--muted)]"
          }
          alert={lowStockProducts.length > 0}
          trend={
            lowStockProducts.length > 0
              ? `${lowStockProducts.length} product${lowStockProducts.length > 1 ? "s" : ""} below threshold`
              : undefined
          }
        />
      </div>

      {/* Sales Overview */}
      <section>
        <div className="rounded-[10px] bg-[var(--surface)] p-6 shadow-[var(--surface-shadow)]">
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
              Sales Overview
            </h2>
            <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
              Last 7 days
            </p>
          </div>
          <SalesOverviewChart data={salesChartData} />
        </div>
      </section>

      {/* Recent Orders */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
              Recent Orders
            </h2>
            <p className="font-body text-sm text-[color:var(--muted)]">
              Your latest orders across all statuses
            </p>
          </div>
          {recentOrders.length > 0 && (
            <Link
              href="/seller/orders"
              className="inline-flex items-center gap-1 font-body text-sm font-medium text-[color:var(--accent)] transition-colors duration-150 hover:text-[color:var(--accent-hover,#0F766E)]"
            >
              View all
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
                <ShoppingBag
                  className="size-6 text-[color:var(--muted)]"
                  strokeWidth={2}
                />
              </div>
              <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                No orders yet
              </p>
              <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
                Orders will appear here once buyers purchase your products
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Order ID
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                      Items
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
                  {recentOrders.map((order) => {
                    const itemCount = order.items.reduce(
                      (s, i) => s + i.quantity,
                      0
                    );
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/seller/orders/${order.id}`}
                            className="font-mono text-xs font-medium text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-hover,#0F766E)]"
                          >
                            {order.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 font-body text-sm text-[color:var(--foreground)]">
                          {order.buyer?.full_name ?? "Unknown"}
                        </td>
                        <td className="px-5 py-3.5 font-body text-sm tabular-nums text-[color:var(--foreground)]">
                          {itemCount}
                        </td>
                        <td className="px-5 py-3.5 font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Chip
                            size="sm"
                            color={statusChipColor(order.status)}
                            variant="soft"
                          >
                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </Chip>
                        </td>
                        <td className="px-5 py-3.5 font-body text-xs text-[color:var(--muted)]">
                          {new Date(order.created_at).toLocaleDateString(
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
      </section>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-[6px] bg-[var(--warning)]/10">
                <AlertTriangle
                  className="size-4 text-[var(--warning)]"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                  Low Stock Alerts
                </h2>
                <p className="font-body text-sm text-[color:var(--muted)]">
                  Products with fewer than 10 units remaining
                </p>
              </div>
            </div>
            <Link
              href="/seller/inventory"
              className="inline-flex items-center gap-1 font-body text-sm font-medium text-[color:var(--accent)] transition-colors duration-150 hover:text-[color:var(--accent-hover,#0F766E)]"
            >
              Manage inventory
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--border-light,var(--separator))] overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-5 py-4 transition-colors duration-150 hover:bg-[var(--default)]/50"
              >
                <div className="flex items-center gap-4">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="size-10 rounded-[6px] object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-[6px] bg-[var(--default)]">
                      <Package
                        className="size-5 text-[color:var(--muted)]"
                        strokeWidth={2}
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                      {product.name}
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      {product.sku}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "font-display text-sm font-bold tabular-nums",
                      product.stock_quantity === 0
                        ? "text-[var(--danger)]"
                        : "text-[var(--warning)]"
                    )}
                  >
                    {product.stock_quantity === 0
                      ? "Out of stock"
                      : `${product.stock_quantity} left`}
                  </span>
                  <Link
                    href="/seller/inventory"
                    className="rounded-[6px] px-3 py-1.5 font-body text-xs font-medium text-[color:var(--accent)] transition-colors duration-150 hover:bg-[color:var(--accent)]/8"
                  >
                    Update
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
