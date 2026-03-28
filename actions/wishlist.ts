"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type WishlistActionResult = {
  error?: string;
  success?: boolean;
  added?: boolean;
};

export async function toggleWishlist(
  productId: string
): Promise<WishlistActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to manage your wishlist" };
  }

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    // Remove from wishlist
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { error: "Failed to remove from wishlist" };
    }

    revalidatePath("/wishlist");
    revalidatePath("/products");
    return { success: true, added: false };
  } else {
    // Add to wishlist
    const { error } = await supabase.from("wishlist_items").insert({
      buyer_id: user.id,
      product_id: productId,
    });

    if (error) {
      return { error: "Failed to add to wishlist" };
    }

    revalidatePath("/wishlist");
    revalidatePath("/products");
    return { success: true, added: true };
  }
}

export async function removeFromWishlist(
  productId: string
): Promise<WishlistActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("buyer_id", user.id)
    .eq("product_id", productId);

  if (error) {
    return { error: "Failed to remove from wishlist" };
  }

  revalidatePath("/wishlist");
  revalidatePath("/products");
  return { success: true };
}
