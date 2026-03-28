import { Chip } from "@heroui/react";
import {
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPlatformStats } from "@/actions/admin";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";

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
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function AdminDashboardPage() {
  const result = await getPlatformStats();

  if ("error" in result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--danger)]/10">
          <AlertCircle
            className="size-6 text-[var(--danger)]"
            strokeWidth={2}
          />
        </div>
        <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
          Failed to load dashboard
        </p>
        <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Platform Overview
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Key metrics and recent activity across the marketplace
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Buyers"
          value={result.totalBuyers.toLocaleString()}
          icon={<Users className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--accent)]/10"
          iconColor="text-[var(--accent)]"
        />
        <StatCard
          title="Total Sellers"
          value={result.totalSellers.toLocaleString()}
          icon={<Store className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--success)]/10"
          iconColor="text-[var(--success)]"
        />
        <StatCard
          title="Total Orders"
          value={result.totalOrders.toLocaleString()}
          icon={<ShoppingBag className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--warning)]/10"
          iconColor="text-[var(--warning)]"
        />
        <StatCard
          title="Total Revenue"
          value={`$${result.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="size-5" strokeWidth={2} />}
          iconBg="bg-[var(--success)]/10"
          iconColor="text-[var(--success)]"
          trend="from confirmed orders"
          trendUp={true}
        />
      </div>

      {/* Products Awaiting Review */}
      {result.pendingProducts > 0 && (
        <section>
          <div className="flex items-center justify-between rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)] ring-1 ring-[var(--warning)]/30">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--warning)]/10">
                <AlertCircle
                  className="size-5 text-[var(--warning)]"
                  strokeWidth={2}
                />
              </div>
              <div>
                <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                  Products Awaiting Review
                </p>
                <p className="font-body text-xs text-[color:var(--muted)]">
                  {result.pendingProducts} product
                  {result.pendingProducts !== 1 ? "s" : ""} pending moderation
                </p>
              </div>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 font-body text-sm font-medium text-[color:var(--accent)] transition-colors duration-150 hover:text-[color:var(--accent-hover,#0F766E)]"
            >
              Review now
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      )}

      {/* Recent Orders */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
              Recent Orders
            </h2>
            <p className="font-body text-sm text-[color:var(--muted)]">
              Last 10 orders across the platform
            </p>
          </div>
          {result.recentOrders.length > 0 && (
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 font-body text-sm font-medium text-[color:var(--accent)] transition-colors duration-150 hover:text-[color:var(--accent-hover,#0F766E)]"
            >
              View all
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
          {result.recentOrders.length === 0 ? (
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
                Orders will appear here once buyers start purchasing
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
                      Buyer
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
                  {result.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/orders`}
                          className="font-mono text-xs font-medium text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-hover,#0F766E)]"
                        >
                          {order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm text-[color:var(--foreground)]">
                        {order.buyer_name}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
