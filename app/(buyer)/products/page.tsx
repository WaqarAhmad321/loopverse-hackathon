import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Star, Search, Package, Heart, ChevronRight, Home } from "lucide-react";
import type { Product, Category } from "@/types/database";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { ProductFilters } from "./product-filters";
import { ProductPagination } from "./product-pagination";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
    page?: string;
  }>;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

/* Product type — no seller join (seller_id FK points to users, not
   seller_profiles, so PostgREST cannot resolve the join) */

/* ------------------------------------------------------------------ */
/*  Gradient palette for product image placeholders                    */
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

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const categorySlug = params.category ?? "";
  const minPrice = params.min_price ? parseFloat(params.min_price) : undefined;
  const maxPrice = params.max_price ? parseFloat(params.max_price) : undefined;
  const sort = (params.sort as SortOption) ?? "newest";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const supabase = await createServerClient();

  // Fetch categories for filter sidebar
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, slug")
    .is("parent_id", null)
    .order("name");

  const categories: Pick<Category, "id" | "name" | "slug">[] =
    categoriesData ?? [];

  // Build product query
  let productQuery = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("status", "active");

  // Full-text search
  if (query) {
    productQuery = productQuery.textSearch("search_vector", query);
  }

  // Category filter
  if (categorySlug) {
    const matchingCategory = categories.find((c) => c.slug === categorySlug);
    if (matchingCategory) {
      productQuery = productQuery.eq("category_id", matchingCategory.id);
    }
  }

  // Price filters
  if (minPrice !== undefined && !isNaN(minPrice)) {
    productQuery = productQuery.gte("price", minPrice);
  }
  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    productQuery = productQuery.lte("price", maxPrice);
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      productQuery = productQuery.order("price", { ascending: true });
      break;
    case "price_desc":
      productQuery = productQuery.order("price", { ascending: false });
      break;
    case "rating":
      productQuery = productQuery.order("avg_rating", { ascending: false });
      break;
    case "newest":
    default:
      productQuery = productQuery.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  productQuery = productQuery.range(from, to);

  const { data: productsData, count } = await productQuery;
  const products: Product[] = productsData ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const activeCategoryName = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name
    : undefined;

  const hasActiveFilters = !!(categorySlug || params.min_price || params.max_price);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
      {/* ── Breadcrumbs ── */}
      <nav aria-label="Breadcrumb" className="mb-6">
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
          {activeCategoryName ? (
            <>
              <li>
                <Link
                  href="/products"
                  className="text-muted transition-colors duration-150 hover:text-foreground"
                >
                  Products
                </Link>
              </li>
              <li>
                <ChevronRight className="size-3.5 text-muted" />
              </li>
              <li>
                <span className="font-medium text-foreground">
                  {activeCategoryName}
                </span>
              </li>
            </>
          ) : (
            <li>
              <span className="font-medium text-foreground">Products</span>
            </li>
          )}
        </ol>
      </nav>

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {query
            ? `Results for "${query}"`
            : activeCategoryName
              ? activeCategoryName
              : "All Products"}
        </h1>
        <p className="mt-1.5 text-sm text-muted font-body">
          {totalCount} {totalCount === 1 ? "product" : "products"} found
        </p>
      </div>

      <div className="flex gap-8">
        {/* ── Desktop Sidebar Filters ── */}
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <div className="sticky top-24">
            <ProductFilters
              categories={categories}
              activeCategory={categorySlug}
              minPrice={params.min_price ?? ""}
              maxPrice={params.max_price ?? ""}
              sort={sort}
              query={query}
            />
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="min-w-0 flex-1">
          {/* Mobile Filter Bar */}
          <div className="mb-5 flex items-center gap-2 lg:hidden">
            <ProductFilters
              categories={categories}
              activeCategory={categorySlug}
              minPrice={params.min_price ?? ""}
              maxPrice={params.max_price ?? ""}
              sort={sort}
              query={query}
              isMobile
            />
          </div>

          {/* Desktop Sort Bar */}
          <div className="mb-5 hidden items-center justify-between lg:flex">
            <span className="text-sm text-muted font-body">
              Showing {products.length} of {totalCount} products
            </span>
            <ProductFilters
              categories={[]}
              activeCategory={categorySlug}
              minPrice={params.min_price ?? ""}
              maxPrice={params.max_price ?? ""}
              sort={sort}
              query={query}
              sortOnly
            />
          </div>

          {/* ── Product Grid ── */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed border-border py-20">
              <div className="flex size-16 items-center justify-center rounded-full bg-[var(--background-secondary,#F8FAFC)]">
                <Search className="size-7 text-muted" />
              </div>
              <div className="text-center">
                <p className="font-display text-lg font-semibold text-foreground">
                  No products found
                </p>
                <p className="mt-1 text-sm text-muted font-body">
                  Try adjusting your filters or search terms.
                </p>
              </div>
              {hasActiveFilters && (
                <Link
                  href={query ? `/products?q=${encodeURIComponent(query)}` : "/products"}
                  className="mt-2 text-sm font-medium text-accent transition-colors hover:text-[var(--accent-hover,#0F766E)] font-body"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-10">
              <ProductPagination
                currentPage={page}
                totalPages={totalPages}
                query={query}
                category={categorySlug}
                minPrice={params.min_price ?? ""}
                maxPrice={params.max_price ?? ""}
                sort={sort}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card — matches home page card design exactly               */
/* ------------------------------------------------------------------ */
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

          {/* Out of stock overlay */}
          {product.stock_quantity <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40">
              <span className="rounded-md bg-[var(--background-tertiary,#F1F5F9)] px-3 py-1 text-xs font-semibold text-muted font-body">
                Out of Stock
              </span>
            </div>
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
