import Link from "next/link";
import { createServerClient, getUser } from "@/lib/supabase/server";
import { Button } from "@heroui/react";
import { Heart, Star, Package, ArrowRight } from "lucide-react";
import type { Product, WishlistItem } from "@/types/database";
import { WishlistActions } from "./wishlist-actions";

type WishlistItemWithProduct = WishlistItem & {
  products: Pick<
    Product,
    | "id"
    | "name"
    | "slug"
    | "price"
    | "discount_price"
    | "images"
    | "stock_quantity"
    | "avg_rating"
    | "review_count"
  >;
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

export default async function WishlistPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--background-tertiary,#F1F5F9)]">
            <Heart className="size-7 text-muted" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-foreground">
            Sign in to view your wishlist
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary,#475569)] font-body">
            Save your favorite products by signing in.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="primary" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createServerClient();

  const { data: wishlistItems } = await supabase
    .from("wishlist_items")
    .select(
      `
      *,
      products:product_id (
        id, name, slug, price, discount_price, images,
        stock_quantity, avg_rating, review_count
      )
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const items = (wishlistItems ?? []) as WishlistItemWithProduct[];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--background-tertiary,#F1F5F9)]">
            <Heart className="size-7 text-muted" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-foreground">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary,#475569)] font-body">
            Browse products and add your favorites here.
          </p>
          <Link href="/products" className="mt-6 inline-block">
            <Button variant="primary">
              Browse Products
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          My Wishlist
        </h1>
        <p className="mt-1 text-sm text-muted font-body">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const product = item.products;
          const hasDiscount =
            product.discount_price !== null &&
            product.discount_price < product.price;
          const displayPrice = hasDiscount
            ? product.discount_price!
            : product.price;
          const discountPercent = hasDiscount
            ? Math.round(
                ((product.price - product.discount_price!) / product.price) *
                  100
              )
            : 0;
          const primaryImage = product.images?.[0];
          const inStock = product.stock_quantity > 0;
          const gradient = getPlaceholderGradient(product.id);

          return (
            <div key={item.id} className="group">
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
                <Link href={`/products/${product.slug}`}>
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
                        <Package
                          className="size-10 text-muted/50"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Discount badge */}
                    {hasDiscount && (
                      <span className="absolute top-2.5 left-2.5 rounded-md bg-danger px-2 py-0.5 text-xs font-semibold text-white font-body">
                        -{discountPercent}% OFF
                      </span>
                    )}

                    {/* Out of stock overlay */}
                    {!inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/50">
                        <span className="rounded-md bg-danger px-3 py-1 text-xs font-semibold text-white font-body">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-accent font-body">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {product.review_count > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-warning text-warning" />
                      <span className="text-xs font-medium text-foreground tabular-nums font-body">
                        {product.avg_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted font-body">
                        ({product.review_count})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-base font-bold text-foreground tabular-nums font-body">
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

                  {/* Actions */}
                  <WishlistActions
                    productId={product.id}
                    inStock={inStock}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
