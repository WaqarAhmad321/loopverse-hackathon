"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    }
  }, [value, router]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="relative w-full"
    >
      <div
        className={`
          flex items-center gap-3 rounded-[14px] bg-white/90 backdrop-blur-sm
          border px-5 h-14 transition-all duration-150 ease-out
          shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]
          dark:bg-surface/90
          ${isFocused
            ? "border-accent ring-2 ring-accent/20 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
            : "border-border hover:border-accent/40"
          }
        `}
      >
        <Search className="size-5 shrink-0 text-muted" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What are you looking for?"
          aria-label="Search products"
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted outline-none font-body"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="
            shrink-0 rounded-[10px] bg-accent px-5 py-2 text-sm font-semibold
            text-accent-foreground transition-colors duration-150 ease-out
            hover:bg-[var(--accent-hover,#0F766E)]
            disabled:opacity-40 disabled:cursor-not-allowed
            font-body
          "
        >
          Search
        </button>
      </div>
    </form>
  );
}
