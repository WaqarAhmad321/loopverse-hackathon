"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, getUser } from "@/lib/supabase/server";

export async function updateStock(productId: string, newQuantity: number) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (newQuantity < 0 || !Number.isInteger(newQuantity)) {
    return { error: "Quantity must be a non-negative integer" };
  }

  // Verify ownership
  const { data: product } = await supabase
    .from("products")
    .select("id, seller_id")
    .eq("id", productId)
    .single();

  if (!product || product.seller_id !== user.id) {
    return { error: "Product not found or access denied" };
  }

  const { error } = await supabase
    .from("products")
    .update({
      stock_quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/inventory");
  revalidatePath("/seller/dashboard");
  return { success: true };
}

export async function bulkUpdateStock(
  items: { productId: string; quantity: number }[]
) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (items.length === 0) {
    return { error: "No items provided" };
  }

  // Validate all quantities
  for (const item of items) {
    if (item.quantity < 0 || !Number.isInteger(item.quantity)) {
      return { error: `Invalid quantity for product ${item.productId}` };
    }
  }

  // Verify ownership of all products
  const productIds = items.map((item) => item.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, seller_id")
    .in("id", productIds);

  if (!products || products.length !== items.length) {
    return { error: "Some products were not found" };
  }

  const unauthorized = products.find((p) => p.seller_id !== user.id);
  if (unauthorized) {
    return { error: "Access denied to one or more products" };
  }

  // Update each product
  const errors: string[] = [];

  for (const item of items) {
    const { error } = await supabase
      .from("products")
      .update({
        stock_quantity: item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.productId);

    if (error) {
      errors.push(`Failed to update ${item.productId}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return { error: errors.join("; ") };
  }

  revalidatePath("/seller/inventory");
  revalidatePath("/seller/dashboard");
  return { success: true };
}
