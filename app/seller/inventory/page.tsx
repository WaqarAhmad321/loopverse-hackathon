import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Chip } from "@heroui/react";
import { Warehouse, AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";
import { InlineStockEditor } from "./inline-stock-editor";
import { BulkUpdateButton } from "./bulk-update-button";

export default async function SellerInventoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createServerClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, stock_quantity, images, status")
    .eq("seller_id", user.id)
    .order("stock_quantity", { ascending: true });

  const items = (products ?? []) as Pick<
    Product,
    "id" | "name" | "sku" | "stock_quantity" | "images" | "status"
  >[];

  const lowStockCount = items.filter((p) => p.stock_quantity < 10).length;
  const outOfStockCount = items.filter((p) => p.stock_quantity === 0).length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            Inventory
          </h1>
          <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
            {items.length} product{items.length !== 1 ? "s" : ""} in stock
            {lowStockCount > 0 && (
              <span className="ml-1 text-[var(--warning)]">
                ({lowStockCount} low stock)
              </span>
            )}
          </p>
        </div>
        {/*<BulkUpdateButton /> */}
      </div>

      {/* Summary stat cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]">
            <p className="font-body text-sm font-medium text-[color:var(--muted)]">
              Total Products
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[color:var(--foreground)]">
              {items.length}
            </p>
          </div>
          <div
            className={cn(
              "rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]",
              lowStockCount > 0 && "ring-1 ring-[var(--warning)]/30"
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="size-4 text-[var(--warning)]"
                strokeWidth={2}
              />
              <p className="font-body text-sm font-medium text-[color:var(--muted)]">
                Low Stock
              </p>
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-[var(--warning)]">
              {lowStockCount}
            </p>
          </div>
          <div
            className={cn(
              "rounded-[10px] bg-[var(--surface)] p-5 shadow-[var(--surface-shadow)]",
              outOfStockCount > 0 && "ring-1 ring-[var(--danger)]/30"
            )}
          >
            <p className="font-body text-sm font-medium text-[color:var(--muted)]">
              Out of Stock
            </p>
            <p
              className={cn(
                "mt-1 font-display text-2xl font-bold",
                outOfStockCount > 0
                  ? "text-[var(--danger)]"
                  : "text-[color:var(--foreground)]"
              )}
            >
              {outOfStockCount}
            </p>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
              <Warehouse
                className="size-6 text-[color:var(--muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
              No products in inventory
            </p>
            <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
              Add products to start managing your inventory
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Product
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    SKU
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Stock
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
                    className={cn(
                      "transition-colors duration-150 hover:bg-[var(--default)]/50",
                      product.stock_quantity < 10 &&
                        product.stock_quantity > 0 &&
                        "bg-[var(--warning)]/5",
                      product.stock_quantity === 0 && "bg-[color:var(--danger)]/5"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="size-9 rounded-[6px] object-cover"
                          />
                        ) : (
                          <div className="flex size-9 items-center justify-center rounded-[6px] bg-[var(--default)]">
                            <Package
                              className="size-4 text-[color:var(--muted)]"
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
                      <Chip
                        size="sm"
                        color="default"
                        variant="soft"
                        className="font-body text-xs capitalize"
                      >
                        {product.status}
                      </Chip>
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
                        {product.stock_quantity === 0
                          ? "Out of stock"
                          : product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <InlineStockEditor
                        productId={product.id}
                        currentStock={product.stock_quantity}
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
