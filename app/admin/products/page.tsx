import { Chip } from "@heroui/react";
import { Package, AlertCircle } from "lucide-react";
import { createServerClient, getUserWithRoles } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
} from "@/lib/constants";
import type { ProductStatus } from "@/types/database";
import { ProductModerationButtons } from "./product-moderation-buttons";
import { ProductTabs } from "./product-tabs";

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

function getStatusChipColor(
  status: string
): "default" | "accent" | "success" | "warning" | "danger" {
  const color = PRODUCT_STATUS_COLORS[status];
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

interface ProductRow {
  id: string;
  name: string;
  price: number;
  status: ProductStatus;
  created_at: string;
  seller_name: string;
  store_name: string;
}

/* -------------------------------------------------------------------------- */
/*  Data fetching                                                              */
/* -------------------------------------------------------------------------- */

async function getProducts(): Promise<{
  pending: ProductRow[];
  all: ProductRow[];
} | null> {
  const user = await getUserWithRoles();
  if (!user || !user.roles.includes("admin")) {
    redirect("/");
  }

  const supabase = await createServerClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, status, created_at, seller_id")
    .order("created_at", { ascending: false });

  if (!products) {
    return { pending: [], all: [] };
  }

  const sellerIds = [...new Set(products.map((p) => p.seller_id))];
  const { data: sellers } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", sellerIds.length > 0 ? sellerIds : ["__none__"]);

  const { data: sellerProfiles } = await supabase
    .from("seller_profiles")
    .select("user_id, store_name")
    .in("user_id", sellerIds.length > 0 ? sellerIds : ["__none__"]);

  const sellerNameMap = new Map<string, string>();
  for (const s of sellers ?? []) {
    sellerNameMap.set(s.id, s.full_name);
  }

  const storeNameMap = new Map<string, string>();
  for (const sp of sellerProfiles ?? []) {
    storeNameMap.set(sp.user_id, sp.store_name);
  }

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    status: p.status as ProductStatus,
    created_at: p.created_at,
    seller_name: sellerNameMap.get(p.seller_id) ?? "Unknown",
    store_name: storeNameMap.get(p.seller_id) ?? "Unknown Store",
  }));

  return {
    pending: rows.filter((r) => r.status === "pending"),
    all: rows,
  };
}

/* -------------------------------------------------------------------------- */
/*  Pending Table                                                              */
/* -------------------------------------------------------------------------- */

function PendingTable({ products }: { products: ProductRow[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
          <Package
            className="size-6 text-[color:var(--muted)]"
            strokeWidth={2}
          />
        </div>
        <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
          No products pending review
        </p>
        <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
          All product submissions have been reviewed
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Product
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Seller
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Price
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Submitted
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
          {products.map((product) => (
            <tr
              key={product.id}
              className="transition-colors duration-150 hover:bg-[var(--default)]/50"
            >
              <td className="px-5 py-3.5 font-body text-sm font-medium text-[color:var(--foreground)]">
                {product.name}
              </td>
              <td className="px-5 py-3.5">
                <div>
                  <p className="font-body text-sm text-[color:var(--foreground)]">
                    {product.store_name}
                  </p>
                  <p className="font-body text-xs text-[color:var(--muted)]">
                    {product.seller_name}
                  </p>
                </div>
              </td>
              <td className="px-5 py-3.5 font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                {formatCurrency(product.price)}
              </td>
              <td className="px-5 py-3.5 font-body text-xs text-[color:var(--muted)]">
                {formatDate(product.created_at)}
              </td>
              <td className="px-5 py-3.5">
                <ProductModerationButtons productId={product.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  All Products Table                                                         */
/* -------------------------------------------------------------------------- */

function AllProductsTable({ products }: { products: ProductRow[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
          <Package
            className="size-6 text-[color:var(--muted)]"
            strokeWidth={2}
          />
        </div>
        <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
          No products on the platform
        </p>
        <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
          Products will appear here once sellers list them
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Product
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Seller
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Price
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Status
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Listed
            </th>
            <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
          {products.map((product) => (
            <tr
              key={product.id}
              className="transition-colors duration-150 hover:bg-[var(--default)]/50"
            >
              <td className="px-5 py-3.5 font-body text-sm font-medium text-[color:var(--foreground)]">
                {product.name}
              </td>
              <td className="px-5 py-3.5">
                <div>
                  <p className="font-body text-sm text-[color:var(--foreground)]">
                    {product.store_name}
                  </p>
                  <p className="font-body text-xs text-[color:var(--muted)]">
                    {product.seller_name}
                  </p>
                </div>
              </td>
              <td className="px-5 py-3.5 font-body text-sm font-medium tabular-nums text-[color:var(--foreground)]">
                {formatCurrency(product.price)}
              </td>
              <td className="px-5 py-3.5">
                <Chip
                  color={getStatusChipColor(product.status)}
                  variant="soft"
                  size="sm"
                >
                  {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                </Chip>
              </td>
              <td className="px-5 py-3.5 font-body text-xs text-[color:var(--muted)]">
                {formatDate(product.created_at)}
              </td>
              <td className="px-5 py-3.5">
                {product.status === "pending" ? (
                  <ProductModerationButtons productId={product.id} />
                ) : (
                  <span className="font-body text-xs text-[color:var(--muted)]">
                    --
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function AdminProductsPage() {
  const data = await getProducts();

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
          Failed to load products
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Product Moderation
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Review and moderate seller product listings
        </p>
      </div>

      {/* Tabs + content */}
      <ProductTabs
        pendingCount={data.pending.length}
        allCount={data.all.length}
        pendingTable={<PendingTable products={data.pending} />}
        allTable={<AllProductsTable products={data.all} />}
      />
    </div>
  );
}
