"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Button, TextField, Label, Input } from "@heroui/react";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";

interface OrderFiltersProps {
  currentStatus: string;
  page: number;
  totalPages: number;
}

const statuses = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Returned", value: "returned" },
];

export function OrderFilters({
  currentStatus,
  page,
  totalPages,
}: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") ?? "";
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      if ("status" in updates || "search" in updates) {
        params.delete("page");
      }
      router.push(`/admin/orders?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateParams({ search: searchValue });
  };

  const hasFilters = !!currentStatus || !!currentSearch;

  const clearFilters = useCallback(() => {
    setSearchValue("");
    router.push("/admin/orders");
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Order ID search */}
        <div className="flex flex-1 gap-2 sm:max-w-[320px]">
          <TextField className="flex-1">
            <Label className="sr-only">Search orders</Label>
            <Input
              placeholder="Search by order ID..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="rounded-[6px]"
            />
          </TextField>
          <Button variant="primary" size="md" onPress={handleSearch}>
            <Search className="size-4" strokeWidth={2} />
          </Button>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s) => {
            const isActive = currentStatus === s.value;
            return (
              <button
                key={s.value}
                onClick={() => updateParams({ status: s.value })}
                className={`
                  inline-flex items-center rounded-full px-3 py-1.5
                  font-body text-xs font-medium transition-all duration-150
                  ${
                    isActive
                      ? "bg-accent/10 text-accent border border-accent"
                      : "bg-[var(--background-tertiary,#F1F5F9)] text-[color:var(--muted)] border border-transparent hover:border-[var(--border)] hover:text-[color:var(--foreground)]"
                  }
                `}
              >
                {s.label}
              </button>
            );
          })}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-body text-xs font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10"
            >
              <X className="size-3" strokeWidth={2} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-[color:var(--muted)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              isDisabled={page <= 1}
              onPress={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="size-4" strokeWidth={2} />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              isDisabled={page >= totalPages}
              onPress={() => updateParams({ page: String(page + 1) })}
            >
              Next
              <ChevronRight className="size-4" strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
