"use client";

import { useTransition } from "react";
import { Button, Spinner } from "@heroui/react";
import { ShoppingCart, X } from "lucide-react";
import { removeFromWishlist } from "@/actions/wishlist";
import { addToCart } from "@/actions/cart";

interface WishlistActionsProps {
  productId: string;
  inStock: boolean;
}

export function WishlistActions({ productId, inStock }: WishlistActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await removeFromWishlist(productId);
    });
  }

  function handleMoveToCart() {
    startTransition(async () => {
      await addToCart(productId, null, 1);
      await removeFromWishlist(productId);
    });
  }

  return (
    <div className="mt-auto flex flex-col gap-1.5 pt-2">
      <Button
        size="sm"
        variant="primary"
        className="w-full"
        onPress={handleMoveToCart}
        isDisabled={!inStock || isPending}
      >
        {isPending ? (
          <Spinner size="sm" />
        ) : (
          <ShoppingCart className="size-3.5" />
        )}
        <span className="text-xs font-body">Move to Cart</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onPress={handleRemove}
        isDisabled={isPending}
      >
        <X className="size-3.5" />
        <span className="text-xs font-body">Remove</span>
      </Button>
    </div>
  );
}
