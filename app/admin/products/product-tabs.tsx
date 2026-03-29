"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, TextField, Label, Input } from "@heroui/react";
import { Search, X } from "lucide-react";
import type { ReactNode } from "react";

interface ProductTabsProps {
  pendingCount: number;
  allCount: number;
  pendingTable: ReactNode;
  allTable: ReactNode;
  currentSearch?: string;
}

export function ProductTabs({
  pendingCount,
  allCount,
  pendingTable,
  allTable,
  currentSearch = "",
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [searchValue, setSearchValue] = useState(currentSearch);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    router.push(`/admin/products?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchValue("");
    router.push("/admin/products");
  };

  const tabs = [
    { id: "pending" as const, label: "Pending Review", count: pendingCount },
    { id: "all" as const, label: "All Products", count: allCount },
  ];

  return (
    <div className="space-y-5">
      {/* Filter bar: tabs as chips + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  inline-flex items-center gap-1.5 rounded-full px-3 py-1.5
                  font-body text-xs font-medium transition-all duration-150
                  ${
                    isActive
                      ? "bg-accent/10 text-accent border border-accent"
                      : "bg-[var(--background-tertiary,#F1F5F9)] text-[color:var(--muted)] border border-transparent hover:border-[var(--border)] hover:text-[color:var(--foreground)]"
                  }
                `}
              >
                {tab.label}
                <span
                  className={`
                    inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold
                    ${
                      isActive
                        ? "bg-accent/20 text-accent"
                        : "bg-[var(--border)] text-[color:var(--muted)]"
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 sm:max-w-[320px]">
          <TextField className="flex-1">
            <Label className="sr-only">Search products</Label>
            <Input
              placeholder="Search products..."
              className="rounded-[6px]"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </TextField>
          <Button variant="primary" size="md" onPress={handleSearch}>
            <Search className="size-4" strokeWidth={2} />
          </Button>
          {currentSearch && (
            <button
              onClick={clearSearch}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-body text-xs font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10"
            >
              <X className="size-3" strokeWidth={2} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {activeTab === "pending" ? pendingTable : allTable}
      </div>
    </div>
  );
}
