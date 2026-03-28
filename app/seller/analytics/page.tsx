import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Chip } from "@heroui/react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
} from "lucide-react";
import Link from "next/link";
import {
  RevenueChart,
  OrdersChart,
  TopProductsChart,
} from "@/components/ui/charts";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface TopProduct {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/*  Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="font-body text-sm font-medium text-[color:var(--muted)]">
            {title}
          </p>
          <p className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            {value}
          </p>
          <p className="font-body text-xs text-[color:var(--muted)]">
            {subtitle}
          </p>
        </div>
        <div
          className={`flex size-10 items-center justify-center rounded-[10px] ${iconBg}`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SellerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const supabase = await createServerClient();

  // Determine date range
  const range = params.range ?? "30";
  const days = parseInt(range, 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Fetch analytics data in parallel
  const [
    revenueResult,
    orderCountResult,
    topProductsResult,
    recentSalesResult,
    dailyItemsResult,
  ] = await Promise.all([
    // Total revenue in range
    supabase
      .from("order_items")
      .select("total_price, created_at:orders!inner(created_at)")
      .eq("seller_id", user.id)
      .gte("orders.created_at", startDateStr),

    // Order count in range
    supabase
      .from("order_items")
      .select("order_id", { count: "exact" })
      .eq("seller_id", user.id)
      .gte("order_id", ""),

    // Top selling products
    supabase
      .from("order_items")
      .select(
        "product_id, quantity, total_price, product:products!inner(name)"
      )
      .eq("seller_id", user.id),

    // Delivered revenue
    supabase
      .from("order_items")
      .select("total_price, fulfillment_status")
      .eq("seller_id", user.id)
      .eq("fulfillment_status", "delivered"),

    // Daily items for charts (within range)
    supabase
      .from("order_items")
      .select("total_price, order_id, orders!inner(created_at)")
      .eq("seller_id", user.id)
      .gte("orders.created_at", startDateStr)
      .order("orders(created_at)", { ascending: true }),
  ]);

  // Calculate total revenue
  const totalRevenue =
    revenueResult.data?.reduce(
      (sum, item) => sum + (item.total_price ?? 0),
      0
    ) ?? 0;

  // Calculate unique order count
  const allOrderItems = orderCountResult.data ?? [];
  const uniqueOrders = new Set(allOrderItems.map((i) => i.order_id));
  const totalOrderCount = uniqueOrders.size;

  // Build top products
  const productMap = new Map<string, TopProduct>();

  for (const item of topProductsResult.data ?? []) {
    const raw = item as unknown as {
      product_id: string;
      quantity: number;
      total_price: number;
      product: { name: string };
    };
    const existing = productMap.get(raw.product_id);
    if (existing) {
      existing.total_sold += raw.quantity;
      existing.total_revenue += raw.total_price;
    } else {
      productMap.set(raw.product_id, {
        product_id: raw.product_id,
        product_name: raw.product.name,
        total_sold: raw.quantity,
        total_revenue: raw.total_price,
      });
    }
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10);

  const deliveredRevenue =
    recentSalesResult.data?.reduce(
      (sum, item) => sum + (item.total_price ?? 0),
      0
    ) ?? 0;

  // Build daily chart data
  const dailyItems = (dailyItemsResult.data ?? []).map((item) => {
    const raw = item as unknown as {
      total_price: number;
      order_id: string;
      orders: { created_at: string };
    };
    return {
      total_price: raw.total_price,
      created_at: raw.orders.created_at,
      order_id: raw.order_id,
    };
  });

  // Build revenue and order charts from daily items
  const now = new Date();
  const revenueDayMap = new Map<string, number>();
  const orderDayMap = new Map<string, Set<string>>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    revenueDayMap.set(key, 0);
    orderDayMap.set(key, new Set());
  }

  for (const item of dailyItems) {
    const key = item.created_at.slice(0, 10);
    if (revenueDayMap.has(key)) {
      revenueDayMap.set(
        key,
        (revenueDayMap.get(key) ?? 0) + (item.total_price ?? 0)
      );
    }
    if (orderDayMap.has(key)) {
      orderDayMap.get(key)!.add(item.order_id);
    }
  }

  const revenueChartData: { date: string; revenue: number }[] = [];
  const ordersChartData: { date: string; orders: number }[] = [];

  for (const [date, revenue] of revenueDayMap) {
    const label = formatShortDate(date);
    revenueChartData.push({
      date: label,
      revenue: Math.round(revenue * 100) / 100,
    });
    ordersChartData.push({
      date: label,
      orders: orderDayMap.get(date)?.size ?? 0,
    });
  }

  // Top products chart data
  const topProductsChartData = topProducts.slice(0, 5).map((p) => ({
    name:
      p.product_name.length > 20
        ? p.product_name.slice(0, 20) + "..."
        : p.product_name,
    revenue: Math.round(p.total_revenue * 100) / 100,
    orders: p.total_sold,
  }));

  const dateRanges = [
    { label: "7 days", value: "7" },
    { label: "30 days", value: "30" },
    { label: "90 days", value: "90" },
    { label: "1 year", value: "365" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header + date filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            Analytics
          </h1>
          <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
            Track your store performance
          </p>
        </div>
        <div className="flex gap-2">
          {dateRanges.map((r) => {
            const isSelected = range === r.value;
            return (
              <Link key={r.value} href={`/seller/analytics?range=${r.value}`}>
                <Chip
                  size="sm"
                  color={isSelected ? "accent" : "default"}
                  variant={isSelected ? "primary" : "soft"}
                  className="cursor-pointer font-body text-xs"
                >
                  {r.label}
                </Chip>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Period Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`Last ${range} days`}
          icon={<DollarSign className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--success)]/10"
          iconColor="text-[var(--success)]"
        />
        <StatCard
          title="Orders"
          value={totalOrderCount.toLocaleString()}
          subtitle="Total orders"
          icon={<ShoppingBag className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--accent)]/10"
          iconColor="text-[var(--accent)]"
        />
        <StatCard
          title="Completed Revenue"
          value={`$${deliveredRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="From delivered orders"
          icon={<TrendingUp className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--accent)]/10"
          iconColor="text-[var(--accent)]"
        />
        <StatCard
          title="Products Sold"
          value={topProducts
            .reduce((sum, p) => sum + p.total_sold, 0)
            .toLocaleString()}
          subtitle="Total units"
          icon={<Package className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--warning)]/10"
          iconColor="text-[var(--warning)]"
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart3
              className="size-5 text-[color:var(--muted)]"
              strokeWidth={2}
            />
            <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
              Revenue Over Time
            </h2>
          </div>
          <p className="mt-0.5 font-body text-sm text-[color:var(--muted)]">
            Last {range} days
          </p>
        </div>
        <div className="p-6">
          <RevenueChart data={revenueChartData} />
        </div>
      </div>

      {/* Orders Chart */}
      <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
            Orders Over Time
          </h2>
          <p className="mt-0.5 font-body text-sm text-[color:var(--muted)]">
            Daily order count for the last {range} days
          </p>
        </div>
        <div className="p-6">
          <OrdersChart data={ordersChartData} />
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
            Top Selling Products
          </h2>
          <p className="mt-0.5 font-body text-sm text-[color:var(--muted)]">
            Top 5 products ranked by revenue
          </p>
        </div>
        <div className="p-6">
          <TopProductsChart data={topProductsChartData} />
        </div>
      </div>
    </div>
  );
}
