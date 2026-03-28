import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient, getUserWithRoles } from "@/lib/supabase/server";
import { Card, Chip } from "@heroui/react";
import {
  Package,
  Heart,
  ShoppingBag,
  Clock,
  ArrowRight,
  User,
  MessageSquare,
} from "lucide-react";
import type { Order } from "@/types/database";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";

export default async function BuyerDashboardPage() {
  const userWithRoles = await getUserWithRoles();
  if (!userWithRoles) redirect("/login");

  const supabase = await createServerClient();

  // Fetch stats in parallel
  const [ordersResult, pendingOrdersResult, wishlistResult, recentOrdersResult] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", userWithRoles.id),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", userWithRoles.id)
        .in("status", ["pending", "confirmed", "packed", "shipped"]),
      supabase
        .from("wishlist_items")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", userWithRoles.id),
      supabase
        .from("orders")
        .select(
          `
          *,
          order_items (id)
        `
        )
        .eq("buyer_id", userWithRoles.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const totalOrders = ordersResult.count ?? 0;
  const pendingOrders = pendingOrdersResult.count ?? 0;
  const wishlistCount = wishlistResult.count ?? 0;
  const recentOrders = (recentOrdersResult.data ?? []) as (Order & {
    order_items: { id: string }[];
  })[];

  const userName =
    userWithRoles.profile?.full_name ?? userWithRoles.email ?? "there";

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      accent: "bg-accent/[0.08] text-accent",
    },
    {
      label: "Active Orders",
      value: pendingOrders,
      icon: Clock,
      accent: "bg-warning/10 text-warning",
    },
    {
      label: "Wishlist Items",
      value: wishlistCount,
      icon: Heart,
      accent: "bg-danger/10 text-danger",
    },
  ];

  const quickLinks = [
    { href: "/orders", label: "My Orders", icon: Package, desc: "Track and manage your orders" },
    { href: "/wishlist", label: "Wishlist", icon: Heart, desc: "Saved items you love" },
    { href: "/profile", label: "Profile", icon: User, desc: "Account settings" },
    { href: "/chat", label: "Messages", icon: MessageSquare, desc: "Chat with sellers" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
          My Dashboard
        </h1>
        <p className="mt-1.5 text-base text-[var(--text-secondary,#475569)] font-body">
          Welcome back, {userName.split(" ")[0]}. Here is an overview of your account.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="
                flex items-center gap-4 rounded-[10px] border border-border
                bg-surface p-5
                shadow-[var(--surface-shadow)]
              "
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${stat.accent}`}
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted font-body">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div
            className="
              rounded-[10px] border border-border bg-surface
              shadow-[var(--surface-shadow)]
            "
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Recent Orders
              </h2>
              <Link
                href="/orders"
                className="group flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-[var(--accent-hover,#0F766E)] font-body"
              >
                View all
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="p-6">
              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Package className="size-10 text-muted" strokeWidth={1.5} />
                  <p className="text-sm text-muted font-body">
                    No orders yet. Start shopping to see them here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentOrders.map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div
                        className="
                          flex items-center justify-between rounded-[10px] border border-border
                          px-4 py-3 transition-all duration-150 ease-out
                          hover:border-accent/30 hover:bg-accent/[0.02]
                          hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                        "
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-sm font-medium text-foreground">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs text-muted font-body">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}{" "}
                            &middot;{" "}
                            {order.order_items.length}{" "}
                            {order.order_items.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold tabular-nums text-foreground font-body">
                            ${order.total.toFixed(2)}
                          </span>
                          <Chip
                            size="sm"
                            color={
                              (ORDER_STATUS_COLORS[order.status] ??
                                "default") as
                                | "warning"
                                | "success"
                                | "danger"
                                | "default"
                            }
                            variant="soft"
                          >
                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </Chip>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-1">
          <div
            className="
              rounded-[10px] border border-border bg-surface
              shadow-[var(--surface-shadow)]
            "
          >
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Quick Links
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-1">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <div
                      className="
                        flex items-center gap-3 rounded-[10px] border border-border
                        px-4 py-3 transition-all duration-150 ease-out
                        hover:border-accent/30 hover:bg-accent/[0.02]
                        hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                      "
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/[0.08] text-accent">
                        <Icon className="size-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground font-body">
                          {link.label}
                        </p>
                        <p className="hidden text-xs text-muted font-body lg:block">
                          {link.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
