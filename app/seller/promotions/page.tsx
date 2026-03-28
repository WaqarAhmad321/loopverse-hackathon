import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Chip } from "@heroui/react";
import { Tag } from "lucide-react";
import type { Coupon } from "@/types/database";
import { CouponActions } from "./coupon-actions";
import { CreateCouponForm } from "./create-coupon-form";

/* -------------------------------------------------------------------------- */
/*  Status helpers                                                             */
/* -------------------------------------------------------------------------- */

function couponStatusLabel(coupon: {
  is_active: boolean;
  start_date: string;
  end_date: string;
}): string {
  const now = new Date();
  const endDate = new Date(coupon.end_date);
  const startDate = new Date(coupon.start_date);
  if (endDate < now) return "Expired";
  if (startDate > now) return "Upcoming";
  if (coupon.is_active) return "Active";
  return "Inactive";
}

function couponStatusColor(coupon: {
  is_active: boolean;
  start_date: string;
  end_date: string;
}): "success" | "warning" | "danger" | "default" {
  const now = new Date();
  const endDate = new Date(coupon.end_date);
  const startDate = new Date(coupon.start_date);
  if (endDate < now) return "danger";
  if (startDate > now) return "warning";
  if (coupon.is_active) return "success";
  return "default";
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SellerPromotionsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createServerClient();

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const items = (coupons ?? []) as Coupon[];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Promotions
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Manage your discount coupons
        </p>
      </div>

      {/* Create Coupon Form */}
      <CreateCouponForm />

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
            Your Coupons
          </h2>
          <p className="mt-0.5 font-body text-sm text-[color:var(--muted)]">
            {items.length} coupon{items.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
              <Tag
                className="size-6 text-[color:var(--muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
              No coupons yet
            </p>
            <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
              Create your first coupon to attract more buyers
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Code
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Value
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Min Order
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Valid Period
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Usage
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
                {items.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-bold text-[color:var(--foreground)]">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs capitalize text-[color:var(--muted)]">
                        {coupon.discount_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-display text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `$${coupon.discount_value.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs tabular-nums text-[color:var(--muted)]">
                        {coupon.min_order_amount !== null
                          ? `$${coupon.min_order_amount.toFixed(2)}`
                          : "None"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-body text-xs text-[color:var(--muted)]">
                        <p>
                          {new Date(coupon.start_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </p>
                        <p>
                          to{" "}
                          {new Date(coupon.end_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-body text-xs tabular-nums text-[color:var(--muted)]">
                        {coupon.usage_count}
                        {coupon.max_usage !== null
                          ? ` / ${coupon.max_usage}`
                          : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Chip
                        size="sm"
                        color={couponStatusColor(coupon)}
                        variant="soft"
                      >
                        {couponStatusLabel(coupon)}
                      </Chip>
                    </td>
                    <td className="px-5 py-3.5">
                      <CouponActions
                        couponId={coupon.id}
                        isActive={coupon.is_active}
                        couponCode={coupon.code}
                      />
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
