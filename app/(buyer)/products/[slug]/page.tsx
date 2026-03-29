import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";
import {
  Star,
  ShieldCheck,
  Package,
  Truck,
  ChevronRight,
  Home,
  Heart,
  Users,
} from "lucide-react";
import type {
  Product,
  ProductVariant,
  Review,
  SellerProfile,
  User,
  Category,
} from "@/types/database";
import { AddToCartForm } from "./add-to-cart-form";
import { AddToWishlistButton } from "./add-to-wishlist-button";
import { ImageGallery } from "./image-gallery";
import { ProductViewTracker } from "@/components/ui/product-view-tracker";
import { getCoPurchasedProducts } from "@/actions/recommendations";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

/* ------------------------------------------------------------------ */
/*  Gradient palette for related product placeholders                  */
/* ------------------------------------------------------------------ */
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

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Fetch product with category info (seller_id FK points to users, not
  // seller_profiles, so we query seller profile separately)
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      users:seller_id (
        id,
        full_name,
        avatar_url
      ),
      categories:category_id (
        name,
        slug
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch seller profile separately (seller_profiles.user_id = products.seller_id)
  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("id, user_id, store_name, store_logo_url, is_verified")
    .eq("user_id", product.seller_id)
    .single();

  // Fetch variants
  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .order("name");

  // Fetch reviews (no user join - RLS blocks cross-user reads)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // "Customers Also Bought" — powered by RPC co-purchase engine
  let coPurchaseProducts: Product[] = [];

  const coPurchaseData = await getCoPurchasedProducts(product.id);
  const coPurchaseProductIds = coPurchaseData.map((cp) => cp.product_id);

  if (coPurchaseProductIds.length > 0) {
    const { data: coProducts } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .in("id", coPurchaseProductIds);

    coPurchaseProducts = coProducts ?? [];
  }

  // Fallback: same-category products if no co-purchase data
  if (coPurchaseProducts.length === 0) {
    const { data: fallbackProducts } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .order("avg_rating", { ascending: false })
      .limit(4);

    coPurchaseProducts = fallbackProducts ?? [];
  }

  const relatedProducts = coPurchaseProducts;

  const typedProduct = product as Product & {
    users: Pick<User, "id" | "full_name" | "avatar_url">;
    categories: { name: string; slug: string };
  };
  const typedSellerProfile = sellerProfile as Pick<
    SellerProfile,
    "id" | "user_id" | "store_name" | "store_logo_url" | "is_verified"
  > | null;
  const typedVariants: ProductVariant[] = variants ?? [];
  const typedReviews: Review[] = (reviews ?? []) as Review[];
  const typedRelatedProducts: Product[] = relatedProducts ?? [];

  const hasDiscount =
    typedProduct.discount_price !== null &&
    typedProduct.discount_price < typedProduct.price;
  const displayPrice = hasDiscount
    ? typedProduct.discount_price!
    : typedProduct.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((typedProduct.price - typedProduct.discount_price!) /
          typedProduct.price) *
          100
      )
    : 0;

  const inStock = typedProduct.stock_quantity > 0;
  const lowStock = typedProduct.stock_quantity > 0 && typedProduct.stock_quantity < 10;

  // Rating distribution (approximate from reviews we have)
  const ratingDistribution = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
  typedReviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating - 1]++;
    }
  });
  const actualReviewCount = typedReviews.length;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
      {/* Track product view for AI recommendations */}
      <ProductViewTracker
        productId={typedProduct.id}
        categoryId={typedProduct.category_id}
      />

      {/* ── Breadcrumbs ── */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-1.5 text-sm font-body">
          <li>
            <Link
              href="/"
              className="flex items-center gap-1 text-muted transition-colors duration-150 hover:text-foreground"
            >
              <Home className="size-3.5" />
              Home
            </Link>
          </li>
          <li>
            <ChevronRight className="size-3.5 text-muted" />
          </li>
          <li>
            <Link
              href="/products"
              className="text-muted transition-colors duration-150 hover:text-foreground"
            >
              Products
            </Link>
          </li>
          {typedProduct.categories && (
            <>
              <li>
                <ChevronRight className="size-3.5 text-muted" />
              </li>
              <li>
                <Link
                  href={`/products?category=${typedProduct.categories.slug}`}
                  className="text-muted transition-colors duration-150 hover:text-foreground"
                >
                  {typedProduct.categories.name}
                </Link>
              </li>
            </>
          )}
          <li>
            <ChevronRight className="size-3.5 text-muted" />
          </li>
          <li>
            <span className="font-medium text-foreground line-clamp-1">
              {typedProduct.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* ── Two-Column Layout ── */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: Image Gallery */}
        <div>
          <ImageGallery
            images={typedProduct.images ?? []}
            productName={typedProduct.name}
          />
          {/* Discount badge overlaid if present */}
          {hasDiscount && (
            <div className="relative -mt-[calc(100%-2.5rem)]">
              {/* Badge handled inside gallery for simplicity, but we also have it in price section */}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col gap-6">
          {/* Seller Badge */}
          {typedSellerProfile && (
            <Link
              href={`/sellers/${typedSellerProfile.user_id}`}
              className="group inline-flex w-fit items-center gap-2.5 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4 transition-all duration-150 ease-out hover:border-accent/30 hover:shadow-sm"
            >
              <div className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-accent/[0.08]">
                {typedSellerProfile.store_logo_url ? (
                  <img
                    src={typedSellerProfile.store_logo_url}
                    alt={typedSellerProfile.store_name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-accent font-body">
                    {typedSellerProfile.store_name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary,#475569)] group-hover:text-foreground transition-colors duration-150 font-body">
                {typedSellerProfile.store_name}
              </span>
              {typedSellerProfile.is_verified && (
                <ShieldCheck className="size-4 text-accent" />
              )}
            </Link>
          )}

          {/* Product Name */}
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {typedProduct.name}
          </h1>

          {/* Rating */}
          {typedProduct.review_count > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < Math.round(typedProduct.avg_rating)
                        ? "fill-warning text-warning"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums font-body">
                {typedProduct.avg_rating.toFixed(1)}
              </span>
              <a
                href="#reviews"
                className="text-sm text-muted transition-colors duration-150 hover:text-accent font-body"
              >
                ({typedProduct.review_count}{" "}
                {typedProduct.review_count === 1 ? "review" : "reviews"})
              </a>
            </div>
          )}

          {/* Price Section */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold tabular-nums text-foreground">
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted line-through tabular-nums font-body">
                  ${typedProduct.price.toFixed(2)}
                </span>
                <span className="rounded-[6px] bg-success/10 px-2 py-0.5 text-xs font-semibold text-success font-body">
                  -{discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {inStock ? (
              lowStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning font-body">
                  <span className="size-1.5 rounded-full bg-warning" />
                  Low Stock ({typedProduct.stock_quantity} left)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success font-body">
                  <span className="size-1.5 rounded-full bg-success" />
                  In Stock
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger font-body">
                <span className="size-1.5 rounded-full bg-danger" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Description */}
          <div className="border-t border-border pt-5">
            <h2 className="mb-2.5 font-display text-xs font-semibold uppercase tracking-wider text-muted">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary,#475569)] whitespace-pre-line font-body">
              {typedProduct.description}
            </p>
          </div>

          {/* Separator */}
          <div className="border-t border-border pt-5">
            {/* Variant Selection & Add to Cart */}
            <AddToCartForm
              productId={typedProduct.id}
              variants={typedVariants}
              inStock={inStock}
              maxQuantity={typedProduct.stock_quantity}
            />
          </div>

          {/* Wishlist */}
          <AddToWishlistButton productId={typedProduct.id} />

          {/* Delivery & Trust Info */}
          {/* <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-[var(--background-secondary,#F8FAFC)] p-4">
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary,#475569)] font-body">
              <Truck className="size-4 shrink-0 text-muted" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary,#475569)] font-body">
              <Package className="size-4 shrink-0 text-muted" />
              <span>Usually ships within 2-3 business days</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary,#475569)] font-body">
              <ShieldCheck className="size-4 shrink-0 text-muted" />
              <span>Buyer protection on every purchase</span>
            </div>
          </div> */}
        </div>
      </div>

      {/* ================================================================ */}
      {/*  REVIEWS SECTION                                                 */}
      {/* ================================================================ */}
      <section id="reviews" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
          Customer Reviews
          {typedProduct.review_count > 0 && (
            <span className="ml-2 text-base font-normal text-muted font-body">
              ({typedProduct.review_count})
            </span>
          )}
        </h2>

        {/* Average Rating Summary */}
        {typedProduct.review_count > 0 && (
          <div className="mt-6 flex flex-col gap-6 rounded-[10px] border border-border bg-[var(--background-secondary,#F8FAFC)] p-6 sm:flex-row sm:items-center sm:gap-10">
            {/* Big Number */}
            <div className="flex flex-col items-center gap-1.5 sm:min-w-[120px]">
              <span className="font-display text-5xl font-bold text-foreground">
                {typedProduct.avg_rating.toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < Math.round(typedProduct.avg_rating)
                        ? "fill-warning text-warning"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted font-body">
                {typedProduct.review_count}{" "}
                {typedProduct.review_count === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Star Bar Chart */}
            <div className="flex flex-1 flex-col gap-2">
              {[5, 4, 3, 2, 1].map((starCount) => {
                const count = ratingDistribution[starCount - 1];
                const percentage =
                  typedReviews.length > 0
                    ? (count / typedReviews.length) * 100
                    : 0;
                return (
                  <div key={starCount} className="flex items-center gap-3">
                    <span className="w-8 text-right text-xs font-medium text-muted tabular-nums font-body">
                      {starCount}
                    </span>
                    <Star className="size-3 fill-warning text-warning" />
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-[var(--background-tertiary,#F1F5F9)]">
                      <div
                        className="h-full rounded-full bg-warning transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-muted tabular-nums font-body">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Reviews */}
        {typedReviews.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-border py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--background-secondary,#F8FAFC)]">
              <Star className="size-6 text-muted" />
            </div>
            <p className="font-display text-base font-semibold text-foreground">
              No reviews yet
            </p>
            <p className="text-sm text-muted font-body">
              Be the first to review this product!
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {typedReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-[10px] border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]"
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/[0.08]">
                    <span className="text-xs font-semibold text-accent font-body">
                      C
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground font-body">
                        Customer
                      </span>
                      <span className="shrink-0 text-xs text-muted tabular-nums font-body">
                        {new Date(review.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${
                            i < review.rating
                              ? "fill-warning text-warning"
                              : "text-border"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary,#475569)] font-body">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Write a review form */}
        <ReviewForm productId={typedProduct.id} productSlug={typedProduct.slug} />
      </section>

      {/* ================================================================ */}
      {/*  CUSTOMERS ALSO BOUGHT                                           */}
      {/* ================================================================ */}
      {typedRelatedProducts.length > 0 && (
        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Users className="size-5 text-accent" strokeWidth={2} />
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                  Customers Also Bought
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted font-body">
                Frequently purchased together
              </p>
            </div>
            {typedProduct.categories && (
              <Link
                href={`/products?category=${typedProduct.categories.slug}`}
                className="group flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-[var(--accent-hover,#0F766E)] font-body"
              >
                View all
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {typedRelatedProducts.map((relProduct) => (
              <RelatedProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Product Card — same style as home page cards               */
/* ------------------------------------------------------------------ */
function RelatedProductCard({
  product,
}: {
  product: Product;
}) {
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
        {/* Image -- 4:3 aspect ratio */}
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

          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 rounded-md bg-danger px-2 py-0.5 text-xs font-semibold text-white font-body">
              -{discountPercent}% OFF
            </span>
          )}

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
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground font-body">
            {product.name}
          </h3>
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
          <div className="mt-auto flex items-baseline gap-2 pt-1">
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
        </div>
      </div>
    </Link>
  );
}
