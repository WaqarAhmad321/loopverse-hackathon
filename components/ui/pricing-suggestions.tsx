"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingData {
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  p25_price: number;
  p75_price: number;
  product_count: number;
}

interface PricingSuggestionsProps {
  categoryId: string | null;
  currentPrice: number | null;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function getPriceInsight(
  price: number,
  data: PricingData
): { label: string; color: "green" | "amber" | "red"; suggestion: string } {
  const { avg_price, p25_price, p75_price, min_price, max_price } = data;

  // Within the interquartile range — competitive
  if (price >= p25_price && price <= p75_price) {
    return {
      label: "Your price is competitive",
      color: "green",
      suggestion: `Most products in this category are priced between ${formatPrice(p25_price)} and ${formatPrice(p75_price)}.`,
    };
  }

  // Slightly below p25 or slightly above p75
  const lowerBound = min_price;
  const upperBound = max_price;
  const range = upperBound - lowerBound || 1;

  if (price < p25_price && price >= lowerBound) {
    const deviation = ((p25_price - price) / range) * 100;
    if (deviation < 15) {
      return {
        label: "Your price is slightly below average",
        color: "amber",
        suggestion: `Consider pricing between ${formatPrice(p25_price)} and ${formatPrice(p75_price)} for optimal margins.`,
      };
    }
    return {
      label: "Your price is below average",
      color: "red",
      suggestion: `This price is significantly below the category range. Consider raising it to ${formatPrice(p25_price)} or higher.`,
    };
  }

  if (price > p75_price && price <= upperBound) {
    const deviation = ((price - p75_price) / range) * 100;
    if (deviation < 15) {
      return {
        label: "Your price is slightly above average",
        color: "amber",
        suggestion: `Consider pricing between ${formatPrice(p25_price)} and ${formatPrice(p75_price)} to stay competitive.`,
      };
    }
    return {
      label: "Your price is above average",
      color: "red",
      suggestion: `This price is significantly above the category range. Consider pricing closer to ${formatPrice(avg_price)}.`,
    };
  }

  // Way outside the range
  if (price < lowerBound) {
    return {
      label: "Your price is well below market",
      color: "red",
      suggestion: `Consider pricing between ${formatPrice(p25_price)} and ${formatPrice(p75_price)} for this category.`,
    };
  }

  return {
    label: "Your price is well above market",
    color: "red",
    suggestion: `Consider pricing between ${formatPrice(p25_price)} and ${formatPrice(p75_price)} for this category.`,
  };
}

export function PricingSuggestions({
  categoryId,
  currentPrice,
}: PricingSuggestionsProps) {
  const [data, setData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const fetchPricing = useCallback(async (catId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/pricing/suggestions?category_id=${encodeURIComponent(catId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch pricing");
      const json = await res.json();
      setData(json.data ?? null);

      // Trigger animation
      if (json.data) {
        requestAnimationFrame(() => setIsVisible(true));
      }
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setData(null);
      setIsVisible(false);
      return;
    }

    setIsVisible(false);
    fetchPricing(categoryId);
  }, [categoryId, fetchPricing]);

  if (!categoryId || isLoading || !data) return null;

  const insight =
    currentPrice !== null && currentPrice > 0
      ? getPriceInsight(currentPrice, data)
      : null;

  // Calculate the position of the seller's price on the range bar (0-100%)
  const range = data.max_price - data.min_price || 1;
  const pricePosition =
    currentPrice !== null && currentPrice > 0
      ? Math.max(0, Math.min(100, ((currentPrice - data.min_price) / range) * 100))
      : null;

  // IQR position for the "competitive zone"
  const iqrStart = ((data.p25_price - data.min_price) / range) * 100;
  const iqrEnd = ((data.p75_price - data.min_price) / range) * 100;

  const colorMap = {
    green: {
      bg: "bg-success/[0.06]",
      border: "border-success/20",
      text: "text-success",
      dot: "bg-success",
    },
    amber: {
      bg: "bg-warning/[0.06]",
      border: "border-warning/20",
      text: "text-warning",
      dot: "bg-warning",
    },
    red: {
      bg: "bg-danger/[0.06]",
      border: "border-danger/20",
      text: "text-danger",
      dot: "bg-danger",
    },
  } as const;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[10px] border bg-surface transition-all duration-350 ease-in-out",
        "shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]",
        insight ? colorMap[insight.color].border : "border-border",
        isVisible
          ? "opacity-100 translate-y-0 max-h-[500px]"
          : "opacity-0 -translate-y-2 max-h-0"
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex size-8 items-center justify-center rounded-[8px] bg-accent/[0.08]">
            <Sparkles className="size-4 text-accent" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              AI Pricing Insight
            </h3>
            <p className="font-body text-xs text-muted">
              Based on {data.product_count} product{data.product_count !== 1 ? "s" : ""} in this category
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <p className="font-body text-[11px] font-medium uppercase tracking-wider text-muted">
              Average
            </p>
            <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">
              {formatPrice(data.avg_price)}
            </p>
          </div>
          <div>
            <p className="font-body text-[11px] font-medium uppercase tracking-wider text-muted">
              Median
            </p>
            <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">
              {formatPrice(data.median_price)}
            </p>
          </div>
          <div>
            <p className="font-body text-[11px] font-medium uppercase tracking-wider text-muted">
              Range
            </p>
            <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">
              {formatPrice(data.min_price)}
              <span className="text-muted mx-0.5">-</span>
              {formatPrice(data.max_price)}
            </p>
          </div>
        </div>

        {/* Price range bar */}
        <div className="mb-4">
          <div className="relative h-3 rounded-full bg-[var(--background-tertiary,#F1F5F9)] overflow-hidden">
            {/* Competitive zone (IQR) */}
            <div
              className="absolute top-0 bottom-0 rounded-full bg-success/20"
              style={{ left: `${iqrStart}%`, width: `${iqrEnd - iqrStart}%` }}
            />
            {/* Seller's price marker */}
            {pricePosition !== null && (
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white shadow-sm transition-all duration-300",
                  insight ? colorMap[insight.color].dot : "bg-accent"
                )}
                style={{ left: `calc(${pricePosition}% - 8px)` }}
              />
            )}
          </div>
          {/* Labels below the bar */}
          <div className="flex justify-between mt-1.5">
            <span className="font-body text-[10px] tabular-nums text-muted">
              {formatPrice(data.min_price)}
            </span>
            <span className="font-body text-[10px] text-success font-medium">
              Competitive zone
            </span>
            <span className="font-body text-[10px] tabular-nums text-muted">
              {formatPrice(data.max_price)}
            </span>
          </div>
        </div>

        {/* Insight message */}
        {insight && (
          <div
            className={cn(
              "rounded-[6px] px-4 py-3",
              colorMap[insight.color].bg
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "size-2 rounded-full",
                  colorMap[insight.color].dot
                )}
              />
              <span
                className={cn(
                  "font-body text-sm font-semibold",
                  colorMap[insight.color].text
                )}
              >
                {insight.label}
              </span>
            </div>
            <p className="font-body text-xs text-[var(--text-secondary,#475569)] leading-relaxed">
              {insight.suggestion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
