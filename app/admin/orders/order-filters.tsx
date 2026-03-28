"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      if ("status" in updates) {
        params.delete("page");
      }
      router.push(`/admin/orders?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Button
            key={s.value}
            variant={currentStatus === s.value ? "primary" : "outline"}
            size="sm"
            onPress={() => updateParams({ status: s.value })}
          >
            {s.label}
          </Button>
        ))}
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
