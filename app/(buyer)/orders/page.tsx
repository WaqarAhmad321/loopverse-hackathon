import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient, getUser } from "@/lib/supabase/server";
import { Chip } from "@heroui/react";
import { Package, ArrowRight, ShoppingBag } from "lucide-react";
import type { Order } from "@/types/database";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (id)
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const typedOrders = (orders ?? []) as (Order & {
    order_items: { id: string }[];
  })[];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
          My Orders
        </h1>
        <p className="mt-1.5 text-base text-[var(--text-secondary,#475569)] font-body">
          Track and manage all your purchases
        </p>
      </div>

      {typedOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed border-border py-20">
          <Package className="size-12 text-muted" strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              No orders yet
            </p>
            <p className="mt-1 text-sm text-muted font-body">
              When you place an order, it will appear here.
            </p>
          </div>
          <Link
            href="/products"
            className="
              mt-2 inline-flex items-center gap-2 rounded-[10px] bg-accent
              px-5 py-2.5 text-sm font-medium text-white font-body
              transition-colors hover:bg-[var(--accent-hover,#0F766E)]
            "
          >
            Start Shopping
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <div className="rounded-[10px] border border-border bg-surface shadow-[var(--surface-shadow)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-[var(--background-secondary,#F8FAFC)] dark:bg-default">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted font-body">
                      Order ID
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted font-body">
                      Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted font-body">
                      Items
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted font-body">
                      Total
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted font-body">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted font-body">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {typedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-accent/[0.02]"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-medium text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-[var(--text-secondary,#475569)] font-body">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-[var(--text-secondary,#475569)] font-body">
                          {order.order_items.length}{" "}
                          {order.order_items.length === 1 ? "item" : "items"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold tabular-nums text-foreground font-body">
                          ${order.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Chip
                          size="sm"
                          color={
                            (ORDER_STATUS_COLORS[order.status] ?? "default") as
                              | "warning"
                              | "success"
                              | "danger"
                              | "default"
                          }
                          variant="soft"
                        >
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </Chip>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="group inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-[var(--accent-hover,#0F766E)] font-body"
                        >
                          View
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="flex flex-col gap-3 sm:hidden">
            {typedOrders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div
                  className="
                    rounded-[10px] border border-border bg-surface p-4
                    shadow-[var(--surface-shadow)]
                    transition-all duration-150 ease-out
                    hover:border-accent/30 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]
                    hover:-translate-y-0.5
                  "
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-sm font-medium text-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs text-muted font-body">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Chip
                      size="sm"
                      color={
                        (ORDER_STATUS_COLORS[order.status] ?? "default") as
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
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted font-body">
                      {order.order_items.length}{" "}
                      {order.order_items.length === 1 ? "item" : "items"}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground font-body">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
