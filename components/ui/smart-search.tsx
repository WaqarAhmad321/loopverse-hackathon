"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  /** Compact mode for navbar — smaller height */
  compact?: boolean;
}

interface SearchResults {
  suggestions: string[];
  popular: string[];
}

export function SmartSearch({
  placeholder = "What are you looking for?",
  className,
  compact = false,
}: SmartSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResults>({
    suggestions: [],
    popular: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // All items in the dropdown for keyboard nav
  const allItems = [
    ...results.suggestions.map((s) => ({ type: "suggestion" as const, text: s })),
    ...results.popular.map((p) => ({ type: "popular" as const, text: p })),
  ];

  // Debounced fetch
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setResults({ suggestions: [], popular: [] });
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) throw new Error("Search failed");

      const data: SearchResults = await res.json();
      setResults(data);
      setIsOpen(
        data.suggestions.length > 0 || data.popular.length > 0
      );
      setActiveIndex(-1);
    } catch {
      setResults({ suggestions: [], popular: [] });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    },
    [fetchSuggestions]
  );

  const navigateToSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setValue(trimmed);
      setIsOpen(false);
      inputRef.current?.blur();
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    },
    [router]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allItems.length) {
        navigateToSearch(allItems[activeIndex].text);
      } else {
        navigateToSearch(value);
      }
    },
    [value, activeIndex, allItems, navigateToSearch]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < allItems.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : allItems.length - 1
          );
          break;
        case "Escape":
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, allItems.length]
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /** Highlight matching characters in suggestion text */
  function highlightMatch(text: string, query: string) {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-semibold text-accent">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  const showSuggestions = results.suggestions.length > 0;
  const showPopular = results.popular.length > 0;
  let suggestionOffset = 0;
  const popularOffset = results.suggestions.length;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={cn(
            "flex items-center gap-3 bg-white/90 backdrop-blur-sm",
            "border transition-all duration-150 ease-out",
            "shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]",
            "dark:bg-surface/90",
            compact
              ? "rounded-full px-4 h-10"
              : "rounded-[14px] px-5 h-14",
            isFocused
              ? "border-accent ring-2 ring-accent/20 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
              : "border-border hover:border-accent/40"
          )}
        >
          <Search className={cn("shrink-0 text-muted", compact ? "size-4" : "size-5")} />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="search-listbox"
            aria-activedescendant={
              activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
            }
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (allItems.length > 0) setIsOpen(true);
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search products"
            className={cn(
              "flex-1 bg-transparent text-foreground placeholder:text-muted outline-none font-body",
              compact ? "text-sm" : "text-base"
            )}
          />

          {/* Loading spinner */}
          {isLoading && (
            <Loader2
              className={cn(
                "shrink-0 animate-spin text-muted",
                compact ? "size-4" : "size-5"
              )}
            />
          )}

          {/* Clear button */}
          {value && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setResults({ suggestions: [], popular: [] });
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className={cn(
                "shrink-0 rounded-full p-1 text-muted transition-colors duration-150 hover:text-foreground hover:bg-default-100",
              )}
              aria-label="Clear search"
            >
              <X className={compact ? "size-3.5" : "size-4"} />
            </button>
          )}

          {/* Search button (only in non-compact mode) */}
          {!compact && (
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
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (showSuggestions || showPopular) && (
        <div
          id="search-listbox"
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[10px]",
            "border border-border bg-surface",
            "shadow-[0_16px_48px_rgba(15,23,42,0.12)]",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Suggestions section */}
          {showSuggestions && (
            <div className="py-2">
              <div className="px-4 py-1.5">
                <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Suggestions
                </span>
              </div>
              {results.suggestions.map((suggestion, i) => {
                const itemIndex = suggestionOffset + i;
                return (
                  <button
                    key={`suggestion-${i}`}
                    id={`search-item-${itemIndex}`}
                    role="option"
                    aria-selected={activeIndex === itemIndex}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigateToSearch(suggestion);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-body",
                      "transition-colors duration-100",
                      activeIndex === itemIndex
                        ? "bg-accent/[0.06] text-foreground"
                        : "text-[var(--text-secondary,#475569)] hover:bg-default-50"
                    )}
                  >
                    <Search className="size-4 shrink-0 text-muted" />
                    <span className="truncate">
                      {highlightMatch(suggestion, value)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider */}
          {showSuggestions && showPopular && (
            <div className="mx-4 border-t border-border-light" />
          )}

          {/* Popular searches section */}
          {showPopular && (
            <div className="py-2">
              <div className="px-4 py-1.5">
                <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Trending
                </span>
              </div>
              {results.popular.map((item, i) => {
                const itemIndex = popularOffset + i;
                return (
                  <button
                    key={`popular-${i}`}
                    id={`search-item-${itemIndex}`}
                    role="option"
                    aria-selected={activeIndex === itemIndex}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigateToSearch(item);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-body",
                      "transition-colors duration-100",
                      activeIndex === itemIndex
                        ? "bg-accent/[0.06] text-foreground"
                        : "text-[var(--text-secondary,#475569)] hover:bg-default-50"
                    )}
                  >
                    <TrendingUp className="size-4 shrink-0 text-accent" />
                    <span className="truncate">{item}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
