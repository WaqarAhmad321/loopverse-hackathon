import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { Card, Button, Chip } from "@heroui/react";
import {
  Search,
  Star,
  ArrowRight,
  Heart,
  Shield,
  Truck,
  BadgeCheck,
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
} from "lucide-react";
import type { Category, Product, SellerProfile } from "@/types/database";
import { SITE_NAME } from "@/lib/constants";
import { HeroSearch } from "./hero-search";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Icon mapping — maps category names (lowercased) to Lucide icons   */
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
/*  Product type with seller join                                      */
/* ------------------------------------------------------------------ */
type ProductWithSeller = Product & {
  seller_profiles: Pick<SellerProfile, "store_name"> | null;
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default async function BuyerHomePage() {
  const supabase = await createServerClient();

  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, image_url")
      .is("parent_id", null)
      .order("name"),
    supabase
      .from("products")
      .select("*, seller_profiles(store_name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const categories: Pick<Category, "id" | "name" | "slug" | "image_url">[] =
    categoriesResult.data ?? [];
  const products: ProductWithSeller[] = productsResult.data ?? [];

  return (
    <div className="flex flex-col">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/50 to-white dark:from-accent/[0.06] dark:to-background">
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

          {/* Trust line */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-medium text-muted font-body">
            <span className="flex items-center gap-1.5">
              <Shield className="size-3.5" />
              Buyer protection
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Truck className="size-3.5" />
              Free shipping over $50
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-3.5" />
              Verified sellers
            </span>
          </div>
        </div>

        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 size-[500px] rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-[300px] rounded-full bg-accent/[0.04] blur-3xl" />
      </section>

      {/* ============================================================ */}
      {/*  CATEGORIES                                                  */}
      {/* ============================================================ */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-[1200px] px-6 pt-16 pb-4 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                Shop by Category
              </h2>
              <p className="mt-1 text-sm text-muted font-body">
                Browse what interests you
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group"
                >
                  <div
                    className="
                      flex flex-col items-center gap-3 rounded-[10px] border border-border
                      bg-surface p-5 transition-all duration-150 ease-out cursor-pointer
                      hover:border-accent hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]
                      hover:-translate-y-0.5
                    "
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-accent/[0.08] text-accent transition-colors duration-150 group-hover:bg-accent/[0.15]">
                      <IconComponent className="size-5" strokeWidth={2} />
                    </div>
                    <span className="text-center text-sm font-medium leading-tight text-foreground font-body">
                      {category.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  FEATURED PRODUCTS                                           */}
      {/* ============================================================ */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16 pb-16 lg:px-8">
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
      {/*  VALUE PROPS                                                 */}
      {/* ============================================================ */}
      <section className="border-t border-border bg-[var(--background-secondary,#F8FAFC)] dark:bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-16 sm:grid-cols-3 lg:px-8">
          <ValueProp
            icon={Shield}
            title="Buyer Protection"
            description="Every purchase is backed by our guarantee. Shop with complete confidence."
          />
          <ValueProp
            icon={Truck}
            title="Fast Shipping"
            description="Free shipping on orders over $50. Most items arrive within 3-5 business days."
          />
          <ValueProp
            icon={BadgeCheck}
            title="Verified Sellers"
            description="Only approved, quality sellers. Every store is reviewed before going live."
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Value Prop                                                         */
/* ------------------------------------------------------------------ */
function ValueProp({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex size-10 items-center justify-center rounded-[10px] bg-accent/[0.08] text-accent">
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-[var(--text-secondary,#475569)] font-body">
        {description}
      </p>
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

function ProductCard({ product }: { product: ProductWithSeller }) {
  const hasDiscount =
    product.discount_price !== null && product.discount_price < product.price;
  const displayPrice = hasDiscount ? product.discount_price! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discount_price!) / product.price) * 100
      )
    : 0;

  const primaryImage = product.images?.[0];
  const storeName = product.seller_profiles?.store_name;
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
        {/* Image — 4:3 aspect ratio */}
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

          {/* Discount badge — top left */}
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 rounded-md bg-danger px-2 py-0.5 text-xs font-semibold text-white font-body">
              -{discountPercent}% OFF
            </span>
          )}

          {/* Wishlist heart — top right, visible on hover */}
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
          {/* Seller store name */}
          {storeName && (
            <span className="text-xs text-muted truncate font-body">
              {storeName}
            </span>
          )}

          {/* Product name — 2-line clamp */}
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
