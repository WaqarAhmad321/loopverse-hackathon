import {
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { createServerClient, getUserWithRoles } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  RevenueChart,
  OrdersChart,
  CategoryPieChart,
  ActiveUsersChart,
} from "@/components/ui/charts";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/*  Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon, iconBg, iconColor }: StatCardProps) {
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
/*  Chart Card                                                                 */
/* -------------------------------------------------------------------------- */

interface ChartCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
      <div className="px-5 pt-5">
        <h3 className="font-display text-base font-semibold text-[color:var(--foreground)]">
          {title}
        </h3>
        <p className="mt-0.5 font-body text-xs text-[color:var(--muted)]">
          {description}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  topCategories: { name: string; count: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number }[];
  ordersByDay: { date: string; orders: number }[];
  categoryPieData: { name: string; value: number }[];
  activeUsersTrend: { date: string; users: number }[];
}

/* -------------------------------------------------------------------------- */
/*  Data fetching                                                              */
/* -------------------------------------------------------------------------- */

async function getAnalyticsData(): Promise<AnalyticsData | null> {
  const user = await getUserWithRoles();
  if (!user || !user.roles.includes("admin")) {
    redirect("/");
  }

  const supabase = await createServerClient();

  const days = 30;
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const [
    revenueDataResult,
    orderCountResult,
    activeUsersResult,
    productsResult,
    categoriesResult,
    ordersTimelineResult,
    usersTimelineResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .in("status", ["confirmed", "packed", "shipped", "delivered"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("products")
      .select("category_id, price")
      .eq("status", "active"),
    supabase.from("categories").select("id, name"),
    supabase
      .from("orders")
      .select("total, created_at, status")
      .gte("created_at", startDateStr)
      .order("created_at", { ascending: true }),
    supabase
      .from("users")
      .select("created_at, is_active")
      .gte("created_at", startDateStr)
      .order("created_at", { ascending: true }),
  ]);

  const totalRevenue = (revenueDataResult.data ?? []).reduce(
    (sum, o) => sum + (o.total ?? 0),
    0
  );

  // Category data
  const categoryMap = new Map<string, string>();
  for (const cat of categoriesResult.data ?? []) {
    categoryMap.set(cat.id, cat.name);
  }

  const categoryStats = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();
  for (const product of productsResult.data ?? []) {
    const catName = categoryMap.get(product.category_id) ?? "Uncategorized";
    const existing = categoryStats.get(product.category_id) ?? {
      name: catName,
      count: 0,
      revenue: 0,
    };
    existing.count += 1;
    existing.revenue += product.price;
    categoryStats.set(product.category_id, existing);
  }

  const topCategories = [...categoryStats.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Daily maps
  const revenueDayMap = new Map<string, number>();
  const orderDayMap = new Map<string, number>();
  const userDayMap = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    revenueDayMap.set(key, 0);
    orderDayMap.set(key, 0);
    userDayMap.set(key, 0);
  }

  const validStatuses = new Set([
    "confirmed",
    "packed",
    "shipped",
    "delivered",
  ]);
  for (const order of ordersTimelineResult.data ?? []) {
    const key = (order.created_at as string).slice(0, 10);
    if (orderDayMap.has(key)) {
      orderDayMap.set(key, (orderDayMap.get(key) ?? 0) + 1);
    }
    if (validStatuses.has(order.status) && revenueDayMap.has(key)) {
      revenueDayMap.set(
        key,
        (revenueDayMap.get(key) ?? 0) + (order.total ?? 0)
      );
    }
  }

  for (const u of usersTimelineResult.data ?? []) {
    const key = (u.created_at as string).slice(0, 10);
    if (userDayMap.has(key)) {
      userDayMap.set(key, (userDayMap.get(key) ?? 0) + 1);
    }
  }

  const revenueByDay: { date: string; revenue: number }[] = [];
  const ordersByDay: { date: string; orders: number }[] = [];
  const activeUsersTrend: { date: string; users: number }[] = [];

  for (const [date, revenue] of revenueDayMap) {
    revenueByDay.push({
      date: formatShortDate(date),
      revenue: Math.round(revenue * 100) / 100,
    });
  }
  for (const [date, orders] of orderDayMap) {
    ordersByDay.push({ date: formatShortDate(date), orders });
  }
  for (const [date, users] of userDayMap) {
    activeUsersTrend.push({ date: formatShortDate(date), users });
  }

  const categoryPieData = topCategories.map((c) => ({
    name: c.name,
    value: Math.round(c.revenue * 100) / 100,
  }));

  return {
    totalRevenue,
    totalOrders: orderCountResult.count ?? 0,
    activeUsers: activeUsersResult.count ?? 0,
    topCategories,
    revenueByDay,
    ordersByDay,
    categoryPieData,
    activeUsersTrend,
  };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--danger)]/10">
          <AlertCircle
            className="size-6 text-[var(--danger)]"
            strokeWidth={2}
          />
        </div>
        <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
          Failed to load analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Platform Analytics
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Insights and trends across the marketplace (last 30 days)
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={<TrendingUp className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--accent)]/10"
          iconColor="text-[var(--accent)]"
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders.toLocaleString()}
          icon={<BarChart3 className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--success)]/10"
          iconColor="text-[var(--success)]"
        />
        <StatCard
          title="Active Users"
          value={data.activeUsers.toLocaleString()}
          icon={<Users className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--warning)]/10"
          iconColor="text-[var(--warning)]"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Revenue Over Time"
          description="Daily revenue trends (last 30 days)"
        >
          <RevenueChart data={data.revenueByDay} />
        </ChartCard>

        <ChartCard
          title="Order Trends"
          description="Daily order volume"
        >
          <OrdersChart data={data.ordersByDay} />
        </ChartCard>

        <ChartCard
          title="Sales by Category"
          description="Revenue distribution across top categories"
        >
          <CategoryPieChart data={data.categoryPieData} />
        </ChartCard>

        <ChartCard
          title="New User Registrations"
          description="Daily new user signups"
        >
          <ActiveUsersChart data={data.activeUsersTrend} />
        </ChartCard>
      </div>
    </div>
  );
}
