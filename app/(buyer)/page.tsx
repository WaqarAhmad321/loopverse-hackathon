import Link from "next/link";
import { createServerClient, getUser } from "@/lib/supabase/server";
import {
  Search,
  Star,
  ArrowRight,
  Heart,
  Zap,
  Shirt,
  Home as HomeIcon,
  Dumbbell,
  BookOpen,
  Gamepad2,
  Wrench,
  UtensilsCrossed,
  Gem,
  Package,
  Sparkles,
  Monitor,
  Music,
  PawPrint,
  Baby,
  Car,
  Flame,
} from "lucide-react";
import type { Category, Product } from "@/types/database";
import { HeroSearch } from "./hero-search";
import { getPersonalizedRecommendations } from "@/actions/recommendations";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Icon mapping -- maps category names (lowercased) to Lucide icons   */
/* ------------------------------------------------------------------ */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  electronics: Zap,
  clothing: Shirt,
  "home & garden": HomeIcon,
  home: HomeIcon,
  fitness: Dumbbell,
  sports: Dumbbell,
  books: BookOpen,
  gaming: Gamepad2,
  tools: Wrench,
  kitchen: UtensilsCrossed,
  food: UtensilsCrossed,
  jewelry: Gem,
  accessories: Gem,
  beauty: Sparkles,
  health: Sparkles,
  toys: Baby,
  kids: Baby,
  pets: PawPrint,
  music: Music,
  automotive: Car,
  computers: Monitor,
  technology: Monitor,
};

function getCategoryIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return Package;
}

/* ------------------------------------------------------------------ */
/*  Product type (no seller join — seller_id FK points to users, not   */
/*  seller_profiles, so we fetch seller info separately when needed)   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function BuyerHomePage() {
  const supabase = await createServerClient();
  const currentUser = await getUser();

  /* --- Fetch featured products + categories in parallel --- */
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, image_url")
      .is("parent_id", null)
      .order("name"),
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const categories: Pick<Category, "id" | "name" | "slug" | "image_url">[] =
    categoriesResult.data ?? [];
  const products: Product[] = productsResult.data ?? [];
  const featuredProductIds = new Set(products.map((p) => p.id));

  /* --- Recommended products (AI-powered via RPC) --- */
  let recommendedProducts: Product[] = [];

  const recommendations = await getPersonalizedRecommendations();
  const recommendedIds = recommendations
    .map((r) => r.product_id)
    .filter((id) => !featuredProductIds.has(id));

  if (recommendedIds.length > 0) {
    const { data: recProducts } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .in("id", recommendedIds)
      .limit(8);

    recommendedProducts = recProducts ?? [];
  }

  // Fallback: if no AI recommendations, show top-rated products not in featured
  if (recommendedProducts.length === 0) {
    const { data: fallbackProducts } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("avg_rating", { ascending: false })
      .limit(12);

    recommendedProducts = (fallbackProducts ?? [])
      .filter((p) => !featuredProductIds.has(p.id))
      .slice(0, 4);
  }

  return (
    <div className="flex flex-col">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-b from-teal-50/40 to-white dark:from-accent/[0.04] dark:to-background">
        <div className="mx-auto max-w-[1200px] px-6 pt-20 pb-16 text-center sm:pt-24 sm:pb-16 lg:px-8">
          <h1 className="mx-auto max-w-[720px] font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Discover unique products from{" "}
            <span className="text-accent">independent sellers</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[520px] text-base leading-relaxed text-[var(--text-secondary,#475569)] sm:text-lg font-body">
            Shop thousands of curated items from verified sellers.
            Quality guaranteed.
          </p>

          <div className="mx-auto mt-10 max-w-[540px]">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CATEGORIES -- compact horizontal pills                      */}
      {/* ============================================================ */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-[1200px] px-6 pt-12 pb-4 lg:px-8">
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Shop by Category
          </h2>

          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="
                    group inline-flex shrink-0 items-center gap-2 rounded-full
                    border border-border bg-surface px-4 py-2
                    font-body text-sm font-medium text-foreground
                    transition-all duration-150 ease-out
                    hover:border-accent hover:bg-accent/[0.06] hover:text-accent
                  "
                >
                  <IconComponent className="size-4 text-muted transition-colors duration-150 group-hover:text-accent" strokeWidth={2} />
                  {category.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  FEATURED PRODUCTS                                           */}
      {/* ============================================================ */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-12 pb-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-muted font-body">
              Fresh picks from our sellers
            </p>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-[var(--accent-hover,#0F766E)] font-body"
          >
            View all
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed border-border py-20">
            <Search className="size-10 text-muted" />
            <p className="text-muted font-body">
              No products available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  RECOMMENDED FOR YOU                                         */}
      {/* ============================================================ */}
      {recommendedProducts.length > 0 && (
        <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Flame className="size-5 text-accent" strokeWidth={2} />
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                  Recommended for You
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted font-body">
                {currentUser
                  ? "Based on your shopping history"
                  : "Popular picks across the marketplace"}
              </p>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-[var(--accent-hover,#0F766E)] font-body"
            >
              Explore more
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card                                                       */
/* ------------------------------------------------------------------ */

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

function ProductCard({ product }: { product: Product }) {
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
              <Package
                className="size-10 text-muted/50"
                strokeWidth={1.5}
              />
            </div>
          )}

          {/* Discount badge -- top left */}
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 rounded-md bg-danger px-2 py-0.5 text-xs font-semibold text-white font-body">
              -{discountPercent}% OFF
            </span>
          )}

          {/* Wishlist heart -- top right, visible on hover */}
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
          {/* Product name -- 2-line clamp */}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground font-body">
            {product.name}
          </h3>

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
