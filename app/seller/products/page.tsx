import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Chip } from "@heroui/react";
import { Plus, Package, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
} from "@/lib/constants";
import type { Product } from "@/types/database";
import { ProductDeleteButton } from "./product-delete-button";

/* -------------------------------------------------------------------------- */
/*  Status chip color mapping                                                  */
/* -------------------------------------------------------------------------- */

function statusChipColor(
  status: string
): "success" | "warning" | "danger" | "default" {
  const mapped = PRODUCT_STATUS_COLORS[status];
  if (mapped === "success") return "success";
  if (mapped === "warning") return "warning";
  if (mapped === "danger") return "danger";
  return "default";
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  const { data: products } = await query;
  const items = (products ?? []) as Product[];

  const activeStatus = params.status ?? "all";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            Products
          </h1>
          <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
            Manage your product catalog
          </p>
        </div>
        <Link href="/seller/products/new">
          <button className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent)] px-4 py-2.5 font-body text-sm font-medium text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[#0F766E]">
            <Plus className="size-4" strokeWidth={2} />
            Add Product
          </button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="space-y-4">
        {/* Search bar */}
        <form action="/seller/products" method="GET">
          {params.status && (
            <input type="hidden" name="status" value={params.status} />
          )}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted)]" strokeWidth={2} />
            <input
              type="text"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search products..."
              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] py-2 pl-9 pr-3 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </form>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {["all", "draft", "pending", "active", "rejected"].map((status) => {
            const isSelected = activeStatus === status;
            return (
              <Link
                key={status}
                href={`/seller/products${status === "all" ? "" : `?status=${status}`}${params.search ? `${status === "all" ? "?" : "&"}search=${params.search}` : ""}`}
              >
                <Chip
                  size="sm"
                  color={isSelected ? "accent" : "default"}
                  variant={isSelected ? "primary" : "soft"}
                  className="cursor-pointer font-body text-xs capitalize"
                >
                  {status === "all"
                    ? "All"
                    : PRODUCT_STATUS_LABELS[status] ?? status}
                </Chip>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
              <Package
                className="size-6 text-[color:var(--muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
              No products found
            </p>
            <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
              {params.status || params.search
                ? "Try changing your filters or search query"
                : "Start by adding your first product"}
            </p>
            {!params.status && !params.search && (
              <Link
                href="/seller/products/new"
                className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent)] px-4 py-2 font-body text-sm font-medium text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[#0F766E]"
              >
                <Plus className="size-4" strokeWidth={2} />
                Add Product
              </Link>
            )}
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
                    SKU
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Price
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Stock
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
                {items.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
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
                        <span className="font-body text-sm font-medium text-[color:var(--foreground)]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-[color:var(--muted)]">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.discount_price !== null && (
                          <span className="font-body text-xs tabular-nums text-[var(--success)]">
                            ${product.discount_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "font-display text-sm font-bold tabular-nums",
                          product.stock_quantity === 0 &&
                            "text-[var(--danger)]",
                          product.stock_quantity > 0 &&
                            product.stock_quantity < 10 &&
                            "text-[var(--warning)]",
                          product.stock_quantity >= 10 &&
                            "text-[color:var(--foreground)]"
                        )}
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Chip
                        size="sm"
                        color={statusChipColor(product.status)}
                        variant="soft"
                      >
                        {PRODUCT_STATUS_LABELS[product.status] ??
                          product.status}
                      </Chip>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <button
                            className="rounded-[6px] p-1.5 text-[color:var(--muted)] transition-colors duration-150 hover:bg-[var(--default)] hover:text-[color:var(--foreground)]"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="size-4" strokeWidth={2} />
                          </button>
                        </Link>
                        <ProductDeleteButton
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
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
