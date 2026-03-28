"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import { updateCartQuantity, removeFromCart } from "@/actions/cart";

interface CartItemRowProps {
  cartItemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

export function CartItemRow({
  cartItemId,
  productName,
  productSlug,
  productImage,
  variantLabel,
  unitPrice,
  quantity,
  maxQuantity,
}: CartItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const [currentQuantity, setCurrentQuantity] = useState(quantity);
  const [error, setError] = useState<string | null>(null);

  const lineTotal = unitPrice * currentQuantity;

  function handleQuantityChange(newQuantity: number) {
    if (newQuantity < 1 || newQuantity > maxQuantity) return;
    setCurrentQuantity(newQuantity);
    setError(null);

    startTransition(async () => {
      const result = await updateCartQuantity(cartItemId, newQuantity);
      if (result.error) {
        setError(result.error);
        setCurrentQuantity(quantity); // revert
      }
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeFromCart(cartItemId);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div
      className={`
        rounded-[10px] border border-border bg-surface p-4 sm:p-5
        shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]
        transition-opacity duration-150
        ${isPending ? "opacity-50" : ""}
      `}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <Link href={`/products/${productSlug}`} className="shrink-0">
          <div className="size-20 overflow-hidden rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] sm:size-24">
            {productImage ? (
              <img
                src={productImage}
                alt={productName}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20">
                <Package className="size-6 text-muted/50" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/products/${productSlug}`}
            className="line-clamp-2 text-sm font-semibold text-foreground transition-colors hover:text-accent font-body sm:text-base"
          >
            {productName}
          </Link>

          {variantLabel && (
            <span className="text-xs text-muted font-body">
              {variantLabel}
            </span>
          )}

          <span className="text-sm font-medium text-[var(--text-secondary,#475569)] tabular-nums font-body">
            ${unitPrice.toFixed(2)} each
          </span>

          {/* Quantity & Actions */}
          <div className="mt-2 flex items-center justify-between gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-[6px] border border-border">
              <button
                type="button"
                onClick={() => handleQuantityChange(currentQuantity - 1)}
                disabled={currentQuantity <= 1 || isPending}
                aria-label="Decrease quantity"
                className="flex size-8 items-center justify-center text-[var(--text-secondary,#475569)] transition-colors hover:bg-[var(--background-tertiary,#F1F5F9)] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-l-[5px]"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="flex min-w-[2.5rem] items-center justify-center text-sm font-medium text-foreground tabular-nums font-body border-x border-border">
                {currentQuantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(currentQuantity + 1)}
                disabled={currentQuantity >= maxQuantity || isPending}
                aria-label="Increase quantity"
                className="flex size-8 items-center justify-center text-[var(--text-secondary,#475569)] transition-colors hover:bg-[var(--background-tertiary,#F1F5F9)] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-r-[5px]"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Line Total */}
              <span className="font-display text-base font-bold text-foreground tabular-nums sm:text-lg">
                ${lineTotal.toFixed(2)}
              </span>

              {/* Remove Button */}
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                aria-label="Remove from cart"
                className="flex size-8 items-center justify-center rounded-[6px] text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-danger font-body">{error}</p>
      )}
    </div>
  );
}
