import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Chip } from "@heroui/react";
import {
  BadgeCheck,
  MapPin,
  Star,
  Store,
  Package,
  Heart,
  Calendar,
} from "lucide-react";
import type { Product, SellerProfile, User } from "@/types/database";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

type SellerWithUser = SellerProfile & {
  users: Pick<User, "id" | "full_name" | "avatar_url">;
};

/** Category-based gradient palettes for image placeholders */
const PLACEHOLDER_GRADIENTS = [
  "from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20",
  "from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20",
  "from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20",
  "from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20",
  "from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20",
  "from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20",
];

function getPlaceholderGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length];
}

export default async function SellerStorePage({ params }: SellerPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch seller profile with user info
  const { data: sellerData } = await supabase
    .from("seller_profiles")
    .select(
      `
      *,
      users!seller_profiles_user_id_fkey (id, full_name, avatar_url)
    `
    )
    .eq("user_id", id)
    .single();

  if (!sellerData) {
    notFound();
  }

  const seller = sellerData as unknown as SellerWithUser;

  // Fetch seller's active products
  const { data: productsData } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const products: Product[] = productsData ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
      {/* Store Header */}
      <div
        className="
          mb-10 rounded-[10px] border border-border bg-surface
          p-6 shadow-[var(--surface-shadow)] sm:p-8
        "
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {/* Store Logo */}
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-accent/[0.08]">
            {seller.store_logo_url ? (
              <img
                src={seller.store_logo_url}
                alt={seller.store_name}
                className="size-full object-cover"
              />
            ) : (
              <Store className="size-9 text-accent" strokeWidth={1.5} />
            )}
          </div>

          {/* Store Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                {seller.store_name}
              </h1>
              {seller.is_verified && (
                <BadgeCheck className="size-5 text-accent" strokeWidth={2} />
              )}
            </div>

            {seller.store_description && (
              <p className="mt-2 max-w-[600px] text-sm leading-relaxed text-[var(--text-secondary,#475569)] font-body">
                {seller.store_description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {seller.is_verified && (
                <Chip color="success" variant="soft" size="sm">
                  Verified Seller
                </Chip>
              )}
              {seller.business_address && (
                <span className="flex items-center gap-1.5 text-xs text-muted font-body">
                  <MapPin className="size-3.5" strokeWidth={2} />
                  {seller.business_address}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-muted font-body">
                <Package className="size-3.5" strokeWidth={2} />
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted font-body">
                <Calendar className="size-3.5" strokeWidth={2} />
                Joined{" "}
                {new Date(seller.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
            Products
          </h2>
          <p className="mt-1 text-sm text-muted font-body">
            Browse all products from {seller.store_name}
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed border-border py-20">
          <Store className="size-12 text-muted" strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              No products yet
            </p>
            <p className="mt-1 text-sm text-muted font-body">
              This seller hasn&apos;t listed any products.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <SellerProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function SellerProductCard({ product }: { product: Product }) {
  const hasDiscount =
    product.discount_price !== null && product.discount_price < product.price;
  const displayPrice = hasDiscount ? product.discount_price! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discount_price!) / product.price) * 100
      )
    : 0;

  const primaryImage = product.images?.[0];
  const gradient = getPlaceholderGradient(product.id);

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div
        className="
          flex h-full flex-col overflow-hidden rounded-[10px] border border-border
          bg-surface transition-all duration-150 ease-out
          shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]
          group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]
          group-hover:border-transparent
        "
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--background-secondary,#F8FAFC)]">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div
              className={`flex size-full items-center justify-center bg-gradient-to-br ${gradient}`}
            >
              <Package className="size-10 text-muted/50" strokeWidth={1.5} />
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 rounded-md bg-danger px-2 py-0.5 text-xs font-semibold text-white font-body">
              -{discountPercent}% OFF
            </span>
          )}

          {/* Wishlist heart */}
          <div
            className="
              absolute top-2.5 right-2.5 flex size-8 items-center justify-center
              rounded-full bg-white/80 backdrop-blur-sm text-muted
              opacity-0 transition-all duration-150 ease-out
              group-hover:opacity-100
              hover:text-danger hover:bg-white
              shadow-sm
            "
            aria-label="Add to wishlist"
          >
            <Heart className="size-4" strokeWidth={2} />
          </div>

          {/* Out of stock overlay */}
          {product.stock_quantity <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <span className="rounded-md bg-foreground/80 px-3 py-1 text-xs font-semibold text-white font-body">
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground font-body">
            {product.name}
          </h3>

          {product.review_count > 0 && (
            <div className="flex items-center gap-1">
              <Star className="size-3.5 fill-warning text-warning" />
              <span className="text-xs font-medium tabular-nums text-foreground font-body">
                {product.avg_rating.toFixed(1)}
              </span>
              <span className="text-xs text-muted font-body">
                ({product.review_count})
              </span>
            </div>
          )}

          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="text-base font-bold tabular-nums text-foreground font-body">
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-muted line-through tabular-nums font-body">
                  ${product.price.toFixed(2)}
                </span>
                <span className="rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success font-body">
                  Save {discountPercent}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
