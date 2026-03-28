"use client";

import { useState, type ReactNode } from "react";

interface ProductTabsProps {
  pendingCount: number;
  allCount: number;
  pendingTable: ReactNode;
  allTable: ReactNode;
}

export function ProductTabs({
  pendingCount,
  allCount,
  pendingTable,
  allTable,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  const tabs = [
    { id: "pending" as const, label: `Pending Review (${pendingCount})` },
    { id: "all" as const, label: `All Products (${allCount})` },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-4 py-2.5 font-body text-sm font-medium transition-colors duration-150
              ${
                activeTab === tab.id
                  ? "text-[color:var(--accent)]"
                  : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {activeTab === "pending" ? pendingTable : allTable}
      </div>
    </div>
  );
}
