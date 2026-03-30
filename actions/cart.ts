"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type CartActionResult = {
  error?: string;
  success?: boolean;
};

export async function addToCart(
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to add items to cart" };
  }

  if (quantity < 1) {
    return { error: "Quantity must be at least 1" };
  }

  // Check if item already exists in cart
  let query = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("buyer_id", user.id)
    .eq("product_id", productId);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Update existing cart item quantity
    const newQuantity = existing.quantity + quantity;
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existing.id);

    if (error) {
      return { error: "Failed to update cart" };
    }
  } else {
    // Insert new cart item
    const { error } = await supabase.from("cart_items").insert({
      buyer_id: user.id,
      product_id: productId,
      variant_id: variantId,
      quantity,
    });

    if (error) {
      return { error: "Failed to add to cart" };
    }
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

export async function updateCartQuantity(
  cartItemId: string,
  quantity: number
): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  if (quantity < 1) {
    return { error: "Quantity must be at least 1" };
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .eq("buyer_id", user.id);

  if (error) {
    return { error: "Failed to update quantity" };
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

export async function removeFromCart(
  cartItemId: string
): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("buyer_id", user.id);

  if (error) {
    return { error: "Failed to remove item" };
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

export async function clearCart(): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("buyer_id", user.id);

  if (error) {
    return { error: "Failed to clear cart" };
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

/**
 * Clear cart for a specific user by ID.
 * Uses the admin client to bypass RLS — intended for server-side
 * post-payment flows (e.g. checkout success page, webhooks).
 */
export async function clearCartForUser(userId: string): Promise<CartActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("buyer_id", userId);

  if (error) {
    return { error: "Failed to clear cart" };
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}
