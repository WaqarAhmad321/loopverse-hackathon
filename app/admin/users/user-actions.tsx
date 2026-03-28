"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Button, TextField, Label, Input } from "@heroui/react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface UserActionsProps {
  currentSearch: string;
  currentRole: string;
  page: number;
  totalPages: number;
}

export function UserActions({
  currentSearch,
  currentRole,
  page,
  totalPages,
}: UserActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      if ("search" in updates || "role" in updates) {
        params.delete("page");
      }
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateParams({ search: searchValue });
  };

  const roles = [
    { label: "All Roles", value: "" },
    { label: "Buyer", value: "buyer" },
    { label: "Seller", value: "seller" },
    { label: "Admin", value: "admin" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Search */}
        <div className="flex flex-1 gap-2">
          <TextField className="flex-1">
            <Label className="sr-only">Search users</Label>
            <Input
              placeholder="Search by name or email..."
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
            Search
          </Button>
        </div>

        {/* Role filter */}
        <div className="flex gap-2">
          {roles.map((role) => (
            <Button
              key={role.value}
              variant={currentRole === role.value ? "primary" : "outline"}
              size="sm"
              onPress={() => updateParams({ role: role.value })}
            >
              {role.label}
            </Button>
          ))}
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
