"use client";

import { SmartSearch } from "@/components/ui/smart-search";

export function HeroSearch() {
  return (
    <SmartSearch
      placeholder="What are you looking for?"
      compact={false}
    />
  );
}
