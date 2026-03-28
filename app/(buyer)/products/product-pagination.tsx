"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  query: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

function buildUrl(
  page: number,
  params: Omit<ProductPaginationProps, "currentPage" | "totalPages">
) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("q", params.query);
  if (params.category) searchParams.set("category", params.category);
  if (params.minPrice) searchParams.set("min_price", params.minPrice);
  if (params.maxPrice) searchParams.set("max_price", params.maxPrice);
  if (params.sort) searchParams.set("sort", params.sort);
  if (page > 1) searchParams.set("page", page.toString());
  const qs = searchParams.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

export function ProductPagination({
  currentPage,
  totalPages,
  query,
  category,
  minPrice,
  maxPrice,
  sort,
}: ProductPaginationProps) {
  const router = useRouter();
  const filterParams = { query, category, minPrice, maxPrice, sort };

  const goToPage = useCallback(
    (page: number) => {
      router.push(buildUrl(page, filterParams));
    },
    [router, filterParams]
  );

  const visiblePages = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "ellipsis") {
        pages.push("ellipsis");
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 font-body">
      {/* Previous */}
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="flex size-9 items-center justify-center rounded-[10px] border border-border text-[var(--text-secondary,#475569)] transition-all duration-150 ease-out hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Page numbers */}
      {visiblePages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex size-9 items-center justify-center text-sm text-muted"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
            className={`flex size-9 items-center justify-center rounded-[10px] text-sm font-medium transition-all duration-150 ease-out ${
              p === currentPage
                ? "bg-accent text-white shadow-sm"
                : "border border-border text-[var(--text-secondary,#475569)] hover:border-accent hover:text-accent"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="flex size-9 items-center justify-center rounded-[10px] border border-border text-[var(--text-secondary,#475569)] transition-all duration-150 ease-out hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
