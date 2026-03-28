import Link from "next/link";
import { createServerClient, getUser } from "@/lib/supabase/server";
import { Button } from "@heroui/react";
import { ShoppingCart, ArrowRight, ArrowLeft, Heart, Package } from "lucide-react";
import type { CartItem, Product, ProductVariant } from "@/types/database";
import { CartItemRow } from "./cart-item-row";
import { CouponForm } from "./coupon-form";

type CartItemWithProduct = CartItem & {
  products: Pick<
    Product,
    "id" | "name" | "slug" | "price" | "discount_price" | "images" | "stock_quantity"
  >;
  product_variants: Pick<ProductVariant, "id" | "name" | "value" | "price_modifier"> | null;
};

export default async function CartPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--background-tertiary,#F1F5F9)]">
            <ShoppingCart className="size-7 text-muted" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-foreground">
            Sign in to view your cart
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary,#475569)] font-body">
            You need to be logged in to manage your shopping cart.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="primary" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createServerClient();

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      products:product_id (
        id, name, slug, price, discount_price, images, stock_quantity
      ),
      product_variants:variant_id (
        id, name, value, price_modifier
      )
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const items = (cartItems ?? []) as CartItemWithProduct[];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--background-tertiary,#F1F5F9)]">
            <ShoppingCart className="size-7 text-muted" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-foreground">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary,#475569)] font-body">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link href="/products" className="mt-6 inline-block">
            <Button variant="primary">
              Continue Shopping
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate price breakdown
  const subtotal = items.reduce((sum, item) => {
    const basePrice =
      item.products.discount_price !== null &&
      item.products.discount_price < item.products.price
        ? item.products.discount_price
        : item.products.price;
    const modifier = item.product_variants?.price_modifier ?? 0;
    return sum + (basePrice + modifier) * item.quantity;
  }, 0);

  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const shippingThreshold = 50;
  const shippingCost = subtotal >= shippingThreshold ? 0 : 5.99;
  const total = subtotal + tax + shippingCost;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Shopping Cart
        </h1>
        <p className="mt-1 text-sm text-muted font-body">
          {items.length} {items.length === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Cart Items Column */}
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const basePrice =
              item.products.discount_price !== null &&
              item.products.discount_price < item.products.price
                ? item.products.discount_price
                : item.products.price;
            const modifier = item.product_variants?.price_modifier ?? 0;
            const unitPrice = basePrice + modifier;

            return (
              <CartItemRow
                key={item.id}
                cartItemId={item.id}
                productId={item.products.id}
                productName={item.products.name}
                productSlug={item.products.slug}
                productImage={item.products.images?.[0] ?? null}
                variantLabel={
                  item.product_variants
                    ? `${item.product_variants.name}: ${item.product_variants.value}`
                    : null
                }
                unitPrice={unitPrice}
                quantity={item.quantity}
                maxQuantity={item.products.stock_quantity}
              />
            );
          })}

          <div className="mt-2">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-1">
          <div
            className="
              sticky top-24 rounded-[10px] border border-border bg-surface p-6
              shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]
            "
          >
            <h2 className="font-display text-lg font-bold text-foreground">
              Order Summary
            </h2>

            <div className="mt-5 flex flex-col gap-3 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary,#475569)]">
                  Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary,#475569)]">Shipping</span>
                <span className="font-medium tabular-nums">
                  {shippingCost === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    <span className="text-foreground">${shippingCost.toFixed(2)}</span>
                  )}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-muted">
                  Free shipping on orders over ${shippingThreshold.toFixed(2)}
                </p>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary,#475569)]">Tax (8%)</span>
                <span className="font-medium text-foreground tabular-nums">
                  ${tax.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-border" />

            {/* Coupon */}
            <CouponForm />

            {/* Divider */}
            <div className="my-4 h-px bg-border" />

            {/* Total */}
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground font-body">Total</span>
              <span className="font-display text-xl font-bold text-foreground tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>

            <Link href="/checkout" className="mt-5 block">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
              >
                Proceed to Checkout
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
