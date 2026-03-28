"use client";

import { RefreshCw } from "lucide-react";

export function BulkUpdateButton() {
  return (
    <button
      type="button"
      onClick={() => {
        // Bulk update modal will be implemented in a future iteration
        alert("Bulk update feature coming soon");
      }}
      className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 font-body text-sm font-medium text-[color:var(--foreground)] transition-colors duration-150 hover:bg-[var(--default)]"
    >
      <RefreshCw className="size-4" strokeWidth={2} />
      Bulk Update
    </button>
  );
}
