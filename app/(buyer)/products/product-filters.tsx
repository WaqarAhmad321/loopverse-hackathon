"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, ListBox, Select, Separator } from "@heroui/react";
import { Star, X } from "lucide-react";
import type { Category } from "@/types/database";

interface ProductFiltersProps {
  categories: Pick<Category, "id" | "name" | "slug">[];
  activeCategory: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  query: string;
  isMobile?: boolean;
  sortOnly?: boolean;
}

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "rating", label: "Top Rated" },
] as const;

const RATING_OPTIONS = [
  { value: 4, label: "4 stars & up" },
  { value: 3, label: "3 stars & up" },
  { value: 2, label: "2 stars & up" },
] as const;

function buildUrl(params: Record<string, string>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const qs = searchParams.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

export function ProductFilters({
  categories,
  activeCategory,
  minPrice,
  maxPrice,
  sort,
  query,
  isMobile = false,
  sortOnly = false,
}: ProductFiltersProps) {
  const router = useRouter();

  const baseParams = {
    q: query,
    category: activeCategory,
    min_price: minPrice,
    max_price: maxPrice,
    sort,
  };

  const handleSortChange = useCallback(
    (value: string) => {
      router.push(buildUrl({ ...baseParams, sort: value, page: "" }));
    },
    [router, baseParams]
  );

  const handleCategorySelect = useCallback(
    (slug: string) => {
      const newCategory = slug === activeCategory ? "" : slug;
      router.push(
        buildUrl({ ...baseParams, category: newCategory, page: "" })
      );
    },
    [router, baseParams, activeCategory]
  );

  const handlePriceSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const min = formData.get("min_price")?.toString() ?? "";
      const max = formData.get("max_price")?.toString() ?? "";
      router.push(
        buildUrl({ ...baseParams, min_price: min, max_price: max, page: "" })
      );
    },
    [router, baseParams]
  );

  const handleClearFilters = useCallback(() => {
    router.push(buildUrl({ q: query, sort: "newest" }));
  }, [router, query]);

  const hasActiveFilters = !!(activeCategory || minPrice || maxPrice);

  /* ── Sort-only mode (desktop top bar) ── */
  if (sortOnly) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted font-body">Sort by:</span>
        <Select
          aria-label="Sort products"
          className="w-48"
          selectedKey={sort}
          onSelectionChange={(key) => handleSortChange(key as string)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SORT_OPTIONS.map((opt) => (
                <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                  {opt.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    );
  }

  /* ── Mobile: compact filter row ── */
  if (isMobile) {
    return (
      <div className="flex w-full items-center gap-2 overflow-x-auto">
        <Select
          aria-label="Sort"
          className="min-w-32"
          selectedKey={sort}
          onSelectionChange={(key) => handleSortChange(key as string)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SORT_OPTIONS.map((opt) => (
                <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                  {opt.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {categories.length > 0 && (
          <Select
            aria-label="Category"
            className="min-w-32"
            selectedKey={activeCategory || undefined}
            onSelectionChange={(key) => handleCategorySelect(key as string)}
            placeholder="Category"
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {categories.map((cat) => (
                  <ListBox.Item
                    key={cat.slug}
                    id={cat.slug}
                    textValue={cat.name}
                  >
                    {cat.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex shrink-0 items-center gap-1 rounded-[6px] border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent hover:text-accent font-body"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>
    );
  }

  /* ── Desktop sidebar ── */
  return (
    <div className="flex flex-col gap-6">
      {/* Sort */}
      <div>
        <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted">
          Sort By
        </h3>
        <Select
          aria-label="Sort products"
          className="w-full"
          selectedKey={sort}
          onSelectionChange={(key) => handleSortChange(key as string)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SORT_OPTIONS.map((opt) => (
                <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                  {opt.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <Separator />

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted">
            Categories
          </h3>
          <div className="flex flex-col gap-0.5">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`rounded-[6px] px-3 py-2 text-left text-sm transition-all duration-150 ease-out font-body ${
                  cat.slug === activeCategory
                    ? "bg-accent/[0.08] font-medium text-accent"
                    : "text-[var(--text-secondary,#475569)] hover:bg-[var(--background-tertiary,#F1F5F9)] hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted">
          Price Range
        </h3>
        <form onSubmit={handlePriceSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                name="min_price"
                aria-label="Minimum price"
                placeholder="Min"
                defaultValue={minPrice}
                min={0}
                step={0.01}
                className="w-full rounded-[6px] border border-border bg-[var(--background-tertiary,#F1F5F9)] px-3 py-2 text-sm font-body text-foreground placeholder:text-muted outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
            <span className="text-sm text-muted">-</span>
            <div className="flex-1">
              <input
                type="number"
                name="max_price"
                aria-label="Maximum price"
                placeholder="Max"
                defaultValue={maxPrice}
                min={0}
                step={0.01}
                className="w-full rounded-[6px] border border-border bg-[var(--background-tertiary,#F1F5F9)] px-3 py-2 text-sm font-body text-foreground placeholder:text-muted outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent/20"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:border-accent hover:text-accent font-body"
          >
            Apply Price
          </button>
        </form>
      </div>

      <Separator />

      {/* Rating Filter */}
      <div>
        <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted">
          Rating
        </h3>
        <div className="flex flex-col gap-1">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                router.push(
                  buildUrl({
                    ...baseParams,
                    min_rating: opt.value.toString(),
                    page: "",
                  })
                )
              }
              className="flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-left text-sm transition-all duration-150 ease-out font-body text-[var(--text-secondary,#475569)] hover:bg-[var(--background-tertiary,#F1F5F9)] hover:text-foreground"
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${
                      i < opt.value
                        ? "fill-warning text-warning"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted">& up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-medium text-accent transition-all duration-150 hover:bg-accent/[0.06] font-body"
          >
            <X className="size-3.5" />
            Clear all filters
          </button>
        </>
      )}
    </div>
  );
}
