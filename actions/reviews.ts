"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(
  productId: string,
  productSlug: string,
  rating: number,
  comment: string
) {
  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to leave a review" };
  }

  // Check if user already reviewed this product
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", user.id)
    .single();

  if (existing) {
    // Update existing review
    const { error } = await supabase
      .from("reviews")
      .update({ rating, comment: comment || null })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    // Insert new review
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      buyer_id: user.id,
      rating,
      comment: comment || null,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/products/${productSlug}`);
  return { success: true };
}
