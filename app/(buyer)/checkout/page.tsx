"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Spinner } from "@heroui/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addressSchema, type AddressFormData } from "@/types/forms";
import { createOrder } from "@/actions/orders";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Product, ProductVariant } from "@/types/database";

type CartItemWithProduct = CartItem & {
  products: Pick<
    Product,
    "id" | "name" | "slug" | "price" | "discount_price" | "images" | "stock_quantity"
  >;
  product_variants: Pick<
    ProductVariant,
    "id" | "name" | "value" | "price_modifier"
  > | null;
};

interface DeliveryOption {
  id: string;
  label: string;
  description: string;
  price: number;
  estimatedDays: string;
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: "standard",
    label: "Standard Delivery",
    description: "Regular shipping via ground",
    price: 5.99,
    estimatedDays: "5-7 business days",
  },
  {
    id: "express",
    label: "Express Delivery",
    description: "Priority shipping",
    price: 12.99,
    estimatedDays: "2-3 business days",
  },
];

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Delivery", icon: Truck },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Confirmation", icon: Check },
] as const;

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 50;

/* ------------------------------------------------------------------ */
/*  Input Field Helper                                                 */
/* ------------------------------------------------------------------ */
const inputClasses = (hasError: boolean) =>
  cn(
    "h-10 w-full rounded-[6px] border bg-[var(--background-tertiary,#F1F5F9)] px-3 text-sm text-foreground font-body",
    "placeholder:text-muted",
    "transition-colors duration-150",
    "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30",
    hasError ? "border-danger" : "border-border"
  );

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: "US",
    },
  });

  // Detect ?cancelled=true from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cancelled") === "true") {
      setCancelled(true);
      // Clean up URL without reload
      window.history.replaceState({}, "", "/checkout");
    }
  }, []);

  // Fetch cart items on mount
  useEffect(() => {
    const fetchCart = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
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

      const items = (data ?? []) as CartItemWithProduct[];

      if (items.length === 0) {
        router.push("/cart");
        return;
      }

      setCartItems(items);
      setIsLoadingCart(false);
    };

    fetchCart();
  }, [router]);

  // Compute price breakdown
  const priceBreakdown = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const basePrice =
        item.products.discount_price !== null &&
        item.products.discount_price < item.products.price
          ? item.products.discount_price
          : item.products.price;
      const modifier = item.product_variants?.price_modifier ?? 0;
      return sum + (basePrice + modifier) * item.quantity;
    }, 0);

    const deliveryOption = DELIVERY_OPTIONS.find(
      (d) => d.id === selectedDelivery
    );
    const shippingCost =
      subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : (deliveryOption?.price ?? 5.99);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shippingCost + tax;

    return { subtotal, shippingCost, tax, total };
  }, [cartItems, selectedDelivery]);

  const handleAddressSubmit = handleSubmit(() => {
    setCurrentStep(2);
  });

  const handleDeliverySubmit = () => {
    setCurrentStep(3);
  };

  const handlePlaceOrder = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const address = getValues();

      // 1. Create the order in the database
      const result = await createOrder({
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          full_name: address.full_name,
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          city: address.city,
          state: address.state,
          zip_code: address.zip_code,
          country: address.country,
          phone: address.phone,
        },
        deliveryMethod: selectedDelivery,
      });

      if (result.error) {
        setSubmitError(result.error);
        setIsSubmitting(false);
        return;
      }

      const newOrderId = result.orderId;
      if (!newOrderId) {
        setSubmitError("Order created but no ID returned.");
        setIsSubmitting(false);
        return;
      }

      // 2. Build line items for Stripe Checkout
      const stripeItems = cartItems.map((item) => {
        const basePrice =
          item.products.discount_price !== null &&
          item.products.discount_price < item.products.price
            ? item.products.discount_price
            : item.products.price;
        const modifier = item.product_variants?.price_modifier ?? 0;
        const unitPrice = basePrice + modifier;

        return {
          name: item.products.name +
            (item.product_variants ? ` (${item.product_variants.value})` : ""),
          price: unitPrice,
          quantity: item.quantity,
          image: item.products.images?.[0],
        };
      });

      // 3. Create Stripe Checkout Session
      const sessionRes = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: stripeItems,
          orderId: newOrderId,
          shippingCost: priceBreakdown.shippingCost,
          tax: priceBreakdown.tax,
        }),
      });

      const sessionData = await sessionRes.json();

      if (!sessionRes.ok || !sessionData.url) {
        setSubmitError(sessionData.error ?? "Failed to start payment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // 4. Redirect to Stripe Checkout
      window.location.href = sessionData.url;
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }, [cartItems, getValues, selectedDelivery, priceBreakdown.shippingCost, priceBreakdown.tax]);

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */
  if (isLoadingCart) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted" />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
      {/* Page Header */}
      <h1 className="mb-8 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Checkout
      </h1>

      {/* ============================================================ */}
      {/*  Step Indicator                                               */}
      {/* ============================================================ */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-250",
                      isCompleted
                        ? "border-accent bg-accent text-white"
                        : isActive
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-[var(--background-tertiary,#F1F5F9)] text-muted"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-5" strokeWidth={2.5} />
                    ) : (
                      <StepIcon className="size-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs font-medium font-body sm:block",
                      isActive
                        ? "text-accent"
                        : isCompleted
                          ? "text-accent"
                          : "text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-3 h-0.5 flex-1 rounded-full transition-colors duration-250",
                      currentStep > step.id ? "bg-accent" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancelled payment banner */}
      {cancelled && (
        <div className="mb-6 rounded-[10px] border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground font-body">
                Payment cancelled
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-secondary,#475569)] font-body">
                Your payment was cancelled. You can review your order and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ============================================================ */}
        {/*  Main Content                                                */}
        {/* ============================================================ */}
        <div className="lg:col-span-1">
          {/* -------------------------------------------------------------- */}
          {/*  Step 1: Address                                                */}
          {/* -------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="rounded-[10px] border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]">
              <div className="mb-6">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Shipping Address
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary,#475569)] font-body">
                  Enter the address where you want your order delivered
                </p>
              </div>

              <form
                onSubmit={handleAddressSubmit}
                className="flex flex-col gap-4"
              >
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="full_name" className="text-sm font-medium text-foreground font-body">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    {...register("full_name")}
                    className={inputClasses(!!errors.full_name)}
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="text-xs text-danger font-body">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="address_line1" className="text-sm font-medium text-foreground font-body">
                    Address Line 1
                  </label>
                  <input
                    id="address_line1"
                    type="text"
                    {...register("address_line1")}
                    className={inputClasses(!!errors.address_line1)}
                    placeholder="123 Main Street"
                  />
                  {errors.address_line1 && (
                    <p className="text-xs text-danger font-body">{errors.address_line1.message}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="address_line2" className="text-sm font-medium text-foreground font-body">
                    Address Line 2 <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="address_line2"
                    type="text"
                    {...register("address_line2")}
                    className={inputClasses(false)}
                    placeholder="Apt, Suite, Unit"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="city" className="text-sm font-medium text-foreground font-body">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      {...register("city")}
                      className={inputClasses(!!errors.city)}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <p className="text-xs text-danger font-body">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="state" className="text-sm font-medium text-foreground font-body">
                      State / Province
                    </label>
                    <input
                      id="state"
                      type="text"
                      {...register("state")}
                      className={inputClasses(!!errors.state)}
                      placeholder="NY"
                    />
                    {errors.state && (
                      <p className="text-xs text-danger font-body">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                {/* ZIP & Country */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="zip_code" className="text-sm font-medium text-foreground font-body">
                      ZIP / Postal Code
                    </label>
                    <input
                      id="zip_code"
                      type="text"
                      {...register("zip_code")}
                      className={inputClasses(!!errors.zip_code)}
                      placeholder="10001"
                    />
                    {errors.zip_code && (
                      <p className="text-xs text-danger font-body">{errors.zip_code.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="country" className="text-sm font-medium text-foreground font-body">
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      {...register("country")}
                      className={inputClasses(!!errors.country)}
                      placeholder="US"
                    />
                    {errors.country && (
                      <p className="text-xs text-danger font-body">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground font-body">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    className={inputClasses(!!errors.phone)}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phone && (
                    <p className="text-xs text-danger font-body">{errors.phone.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="primary" size="lg">
                    Continue to Delivery
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/*  Step 2: Delivery                                               */}
          {/* -------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="rounded-[10px] border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]">
              <div className="mb-6">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Delivery Method
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary,#475569)] font-body">
                  Choose how you want your order shipped
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {DELIVERY_OPTIONS.map((option) => {
                  const isFree =
                    priceBreakdown.subtotal >= FREE_SHIPPING_THRESHOLD &&
                    option.id === "standard";
                  const isSelected = selectedDelivery === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedDelivery(option.id)}
                      className={cn(
                        "flex items-start gap-4 rounded-[10px] border p-4 text-left transition-all duration-150",
                        isSelected
                          ? "border-accent bg-accent/[0.05] shadow-[0_0_0_1px_rgba(13,148,136,0.3)]"
                          : "border-border hover:border-accent/40 hover:bg-[var(--background-secondary,#F8FAFC)]"
                      )}
                    >
                      {/* Radio indicator */}
                      <div
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isSelected
                            ? "border-accent bg-accent"
                            : "border-border"
                        )}
                      >
                        {isSelected && (
                          <div className="size-2 rounded-full bg-white" />
                        )}
                      </div>

                      {/* Truck icon */}
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                          isSelected
                            ? "bg-accent/10 text-accent"
                            : "bg-[var(--background-tertiary,#F1F5F9)] text-muted"
                        )}
                      >
                        <Truck className="size-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground font-body">
                            {option.label}
                          </p>
                          <p className="text-sm font-bold tabular-nums font-body">
                            {isFree ? (
                              <span className="text-success">Free</span>
                            ) : (
                              <span className="text-foreground">${option.price.toFixed(2)}</span>
                            )}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-muted font-body">
                          {option.description} &middot; {option.estimatedDays}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {priceBreakdown.subtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-xs text-muted font-body">
                    Spend $
                    {(FREE_SHIPPING_THRESHOLD - priceBreakdown.subtotal).toFixed(2)}{" "}
                    more for free standard shipping!
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="ghost"
                  size="lg"
                  onPress={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onPress={handleDeliverySubmit}
                >
                  Continue to Payment
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/*  Step 3: Review & Pay                                           */}
          {/* -------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="rounded-[10px] border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.03)]">
              <div className="mb-6">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Review &amp; Pay
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary,#475569)] font-body">
                  Review your order details and place your order
                </p>
              </div>

              {/* Address summary */}
              <div className="mb-4 rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="size-4 text-accent" />
                  <p className="text-sm font-semibold text-foreground font-body">Shipping Address</p>
                </div>
                <div className="text-sm text-[var(--text-secondary,#475569)] font-body leading-relaxed">
                  <p>{getValues("full_name")}</p>
                  <p>{getValues("address_line1")}</p>
                  {getValues("address_line2") && (
                    <p>{getValues("address_line2")}</p>
                  )}
                  <p>
                    {getValues("city")}, {getValues("state")}{" "}
                    {getValues("zip_code")}
                  </p>
                  <p>{getValues("country")}</p>
                  <p>{getValues("phone")}</p>
                </div>
              </div>

              {/* Delivery summary */}
              <div className="mb-4 rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Truck className="size-4 text-accent" />
                  <p className="text-sm font-semibold text-foreground font-body">Delivery Method</p>
                </div>
                <p className="text-sm text-[var(--text-secondary,#475569)] font-body">
                  {DELIVERY_OPTIONS.find((d) => d.id === selectedDelivery)
                    ?.label ?? "Standard Delivery"}{" "}
                  &middot;{" "}
                  {DELIVERY_OPTIONS.find((d) => d.id === selectedDelivery)
                    ?.estimatedDays ?? "5-7 business days"}
                </p>
              </div>

              {/* Items summary */}
              <div className="mb-4 rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="size-4 text-accent" />
                  <p className="text-sm font-semibold text-foreground font-body">
                    Items ({cartItems.length})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {cartItems.map((item) => {
                    const price =
                      item.products.discount_price !== null &&
                      item.products.discount_price < item.products.price
                        ? item.products.discount_price
                        : item.products.price;
                    const modifier =
                      item.product_variants?.price_modifier ?? 0;
                    const unitPrice = price + modifier;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm font-body"
                      >
                        <span className="text-[var(--text-secondary,#475569)]">
                          {item.products.name}
                          {item.product_variants
                            ? ` (${item.product_variants.value})`
                            : ""}{" "}
                          x {item.quantity}
                        </span>
                        <span className="font-medium text-foreground tabular-nums">
                          ${(unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {submitError && (
                <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger/5 p-3">
                  <p className="text-sm text-danger font-body">{submitError}</p>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="lg"
                  onPress={() => setCurrentStep(2)}
                  isDisabled={isSubmitting}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onPress={handlePlaceOrder}
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Redirecting to Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Pay with Stripe &middot; ${priceBreakdown.total.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/*  Cart Summary Sidebar (steps 1-3)                            */}
        {/* ============================================================ */}
        {currentStep <= 3 && (
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

              {/* Item list */}
              <div className="mt-4 max-h-60 space-y-3 overflow-y-auto">
                {cartItems.map((item) => {
                  const price =
                    item.products.discount_price !== null &&
                    item.products.discount_price < item.products.price
                      ? item.products.discount_price
                      : item.products.price;
                  const modifier =
                    item.product_variants?.price_modifier ?? 0;
                  const unitPrice = price + modifier;
                  const image = item.products.images?.[0];

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-[6px] bg-[var(--background-tertiary,#F1F5F9)]">
                        {image ? (
                          <img
                            src={image}
                            alt={item.products.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-4 text-muted/50" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground font-body">
                          {item.products.name}
                        </p>
                        {item.product_variants && (
                          <p className="text-xs text-muted font-body">
                            {item.product_variants.name}:{" "}
                            {item.product_variants.value}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted font-body">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-sm font-medium text-foreground tabular-nums font-body">
                            ${(unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="my-4 h-px bg-border" />

              {/* Price breakdown */}
              <div className="flex flex-col gap-2 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary,#475569)]">
                    Subtotal ({cartItems.length}{" "}
                    {cartItems.length === 1 ? "item" : "items"})
                  </span>
                  <span className="text-foreground tabular-nums">${priceBreakdown.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary,#475569)]">Shipping</span>
                  <span>
                    {priceBreakdown.shippingCost === 0 ? (
                      <span className="text-success">Free</span>
                    ) : (
                      <span className="text-foreground tabular-nums">${priceBreakdown.shippingCost.toFixed(2)}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary,#475569)]">Tax (8%)</span>
                  <span className="text-foreground tabular-nums">${priceBreakdown.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="my-4 h-px bg-border" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground font-body">Total</span>
                <span className="font-display text-xl font-bold text-foreground tabular-nums">
                  ${priceBreakdown.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
