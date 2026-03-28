"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient, getUser } from "@/lib/supabase/server";
import type { FulfillmentStatus } from "@/types/database";
import { addressSchema } from "@/types/forms";

export async function updateFulfillmentStatus(
  orderItemId: string,
  status: FulfillmentStatus,
  trackingId?: string
) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify seller role
  const { data: roleRecord } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "seller")
    .single();

  if (!roleRecord) {
    return { error: "Unauthorized" };
  }

  const validStatuses: FulfillmentStatus[] = [
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
  ];

  if (!validStatuses.includes(status)) {
    return { error: "Invalid fulfillment status" };
  }

  // Verify seller owns this order item
  const { data: orderItem } = await supabase
    .from("order_items")
    .select("id, seller_id, order_id")
    .eq("id", orderItemId)
    .single();

  if (!orderItem || orderItem.seller_id !== user.id) {
    return { error: "Order item not found or access denied" };
  }

  const updateData: Record<string, unknown> = {
    fulfillment_status: status,
  };

  if (trackingId !== undefined) {
    updateData.tracking_id = trackingId;
  }

  const { error } = await supabase
    .from("order_items")
    .update(updateData)
    .eq("id", orderItemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderItem.order_id}`);
  return { success: true };
}

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "No items in order"),
  shippingAddress: addressSchema,
  deliveryMethod: z.enum(["standard", "express"]),
  couponCode: z.string().optional(),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export async function createOrder(input: unknown) {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;

  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Fetch all products for pricing and stock check
  const productIds = data.items.map((item) => item.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price, discount_price, stock_quantity, seller_id, name, status")
    .in("id", productIds);

  if (productsError || !products) {
    return { error: "Failed to fetch products" };
  }

  // Validate products and build order items
  const orderItems: {
    product_id: string;
    variant_id: string | null;
    seller_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[] = [];

  let subtotal = 0;

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.product_id);

    if (!product) {
      return { error: `Product not found: ${item.product_id}` };
    }

    if (product.status !== "active") {
      return { error: `Product "${product.name}" is not available` };
    }

    const unitPrice = product.discount_price ?? product.price;
    const totalPrice = unitPrice * item.quantity;

    orderItems.push({
      product_id: item.product_id,
      variant_id: item.variant_id,
      seller_id: product.seller_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    });

    subtotal += totalPrice;
  }

  // Decrement stock atomically BEFORE creating the order
  // If any decrement fails (e.g. insufficient stock), abort the entire order
  const decrementedItems: { product_id: string; quantity: number }[] = [];

  for (const item of data.items) {
    const { data: rpcResult, error: stockError } = await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });

    if (stockError || rpcResult === false) {
      // Rollback already-decremented stock
      for (const decremented of decrementedItems) {
        await supabase.rpc("decrement_stock", {
          p_product_id: decremented.product_id,
          p_quantity: -decremented.quantity,
        });
      }
      const product = products.find((p) => p.id === item.product_id);
      return {
        error: stockError?.message ?? `Insufficient stock for "${product?.name ?? item.product_id}"`,
      };
    }

    decrementedItems.push({ product_id: item.product_id, quantity: item.quantity });
  }

  // Handle coupon
  let discountAmount = 0;
  let couponId: string | null = null;

  if (data.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", data.couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (coupon) {
      const now = new Date().toISOString();
      const isValid =
        coupon.start_date <= now &&
        coupon.end_date >= now &&
        (coupon.max_usage === null || coupon.usage_count < coupon.max_usage);

      if (isValid) {
        if (
          coupon.min_order_amount === null ||
          subtotal >= coupon.min_order_amount
        ) {
          discountAmount =
            coupon.discount_type === "percentage"
              ? (subtotal * coupon.discount_value) / 100
              : coupon.discount_value;

          discountAmount = Math.min(discountAmount, subtotal);
          couponId = coupon.id;
        }
      }
    }
  }

  const tax = subtotal * 0.08; // 8% tax
  const shippingCost = data.deliveryMethod === "express" ? 15 : 5;
  const total = subtotal + tax + shippingCost - discountAmount;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      status: "pending" as const,
      shipping_address: data.shippingAddress,
      delivery_method: data.deliveryMethod,
      subtotal,
      tax,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      total,
      coupon_id: couponId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Failed to create order" };
  }

  // Insert order items
  const itemsToInsert = orderItems.map((item) => ({
    ...item,
    order_id: order.id,
    fulfillment_status: "pending" as const,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsToInsert);

  if (itemsError) {
    return { error: itemsError.message };
  }

  // Update coupon usage
  if (couponId) {
    await supabase.rpc("increment_coupon_usage", { p_coupon_id: couponId });
  }

  revalidatePath("/seller/orders");
  revalidatePath("/seller/dashboard");
  return { success: true, orderId: order.id };
}
