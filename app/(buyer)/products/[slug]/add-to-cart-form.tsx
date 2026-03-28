"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Check, AlertCircle } from "lucide-react";
import type { ProductVariant } from "@/types/database";

interface AddToCartFormProps {
  productId: string;
  variants: ProductVariant[];
  inStock: boolean;
  maxQuantity: number;
}

export function AddToCartForm({
  productId,
  variants,
  inStock,
  maxQuantity,
}: AddToCartFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants.length > 0 ? variants[0].id : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const effectiveMaxQty = selectedVariant
    ? Math.min(maxQuantity, selectedVariant.stock_quantity)
    : maxQuantity;
  const effectiveInStock = selectedVariant
    ? selectedVariant.stock_quantity > 0
    : inStock;

  const handleDecrement = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity((prev) => Math.min(effectiveMaxQty, prev + 1));
  }, [effectiveMaxQty]);

  const handleAddToCart = useCallback(async () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            variant_id: selectedVariantId || null,
            quantity,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to add to cart");
          return;
        }

        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }, [productId, selectedVariantId, quantity, router]);

  // Group variants by name for display
  const variantGroups = variants.reduce<Record<string, ProductVariant[]>>(
    (acc, variant) => {
      if (!acc[variant.name]) acc[variant.name] = [];
      acc[variant.name].push(variant);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Variant Selection */}
      {Object.entries(variantGroups).map(([groupName, groupVariants]) => (
        <div key={groupName}>
          <h3 className="mb-2.5 font-display text-xs font-semibold uppercase tracking-wider text-muted">
            {groupName}
          </h3>
          <div className="flex flex-wrap gap-2">
            {groupVariants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1);
                }}
                disabled={variant.stock_quantity <= 0}
                className={`rounded-[6px] border px-3.5 py-2 text-sm font-medium transition-all duration-150 ease-out font-body ${
                  variant.id === selectedVariantId
                    ? "border-accent bg-accent/[0.08] text-accent"
                    : variant.stock_quantity <= 0
                      ? "border-border text-muted opacity-50 cursor-not-allowed"
                      : "border-border text-[var(--text-secondary,#475569)] hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {variant.value}
                {variant.price_modifier !== 0 && (
                  <span className="ml-1 text-xs text-muted">
                    {variant.price_modifier > 0 ? "+" : ""}$
                    {variant.price_modifier.toFixed(2)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity Selector */}
      <div>
        <h3 className="mb-2.5 font-display text-xs font-semibold uppercase tracking-wider text-muted">
          Quantity
        </h3>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-[10px] border border-border">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex size-10 items-center justify-center rounded-l-[10px] text-[var(--text-secondary,#475569)] transition-colors duration-150 hover:bg-[var(--background-tertiary,#F1F5F9)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="flex min-w-[3rem] items-center justify-center border-x border-border text-sm font-semibold tabular-nums text-foreground font-body">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= effectiveMaxQty}
              aria-label="Increase quantity"
              className="flex size-10 items-center justify-center rounded-r-[10px] text-[var(--text-secondary,#475569)] transition-colors duration-150 hover:bg-[var(--background-tertiary,#F1F5F9)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {effectiveMaxQty <= 5 && effectiveMaxQty > 0 && (
            <span className="text-xs text-warning font-body font-medium">
              Only {effectiveMaxQty} left
            </span>
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!effectiveInStock || isPending}
        className={`flex w-full items-center justify-center gap-2.5 rounded-[10px] px-6 py-3.5 text-base font-semibold transition-all duration-150 ease-out font-body ${
          effectiveInStock
            ? success
              ? "bg-success text-white"
              : "bg-accent text-white shadow-sm hover:bg-[var(--accent-hover,#0F766E)] hover:shadow-md active:scale-[0.98]"
            : "bg-[var(--background-tertiary,#F1F5F9)] text-muted cursor-not-allowed"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isPending ? (
          <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : success ? (
          <Check className="size-5" />
        ) : (
          <ShoppingCart className="size-5" />
        )}
        {isPending
          ? "Adding..."
          : success
            ? "Added to Cart"
            : effectiveInStock
              ? "Add to Cart"
              : "Out of Stock"}
      </button>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-[6px] bg-danger/[0.06] px-3 py-2.5">
          <AlertCircle className="size-4 shrink-0 text-danger" />
          <p className="text-sm text-danger font-body">{error}</p>
        </div>
      )}
    </div>
  );
}
