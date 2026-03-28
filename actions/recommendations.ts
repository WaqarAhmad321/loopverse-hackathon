"use server";

import { createServerClient, getUser } from "@/lib/supabase/server";

/**
 * Get personalized product recommendations for the current user.
 * Falls back to trending products for guests.
 * Returns an array of product IDs with scores.
 */
export async function getPersonalizedRecommendations(): Promise<
  { product_id: string; score: number }[]
> {
  const supabase = await createServerClient();
  const user = await getUser();

  if (user) {
    const { data, error } = await supabase.rpc(
      "get_personalized_recommendations",
      {
        p_user_id: user.id,
        limit_count: 8,
      }
    );

    if (!error && data && data.length > 0) {
      return data as { product_id: string; score: number }[];
    }
  }

  // Fallback: trending products (highest-rated active products)
  const { data: trending } = await supabase
    .from("products")
    .select("id, avg_rating")
    .eq("status", "active")
    .order("avg_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(8);

  return (trending ?? []).map((p) => ({
    product_id: p.id,
    score: p.avg_rating,
  }));
}

/**
 * Get products frequently bought together with a given product.
 * Returns product IDs ordered by co-purchase frequency.
 */
export async function getCoPurchasedProducts(
  productId: string
): Promise<{ product_id: string; copurchase_count: number }[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("get_copurchased_products", {
    p_product_id: productId,
    limit_count: 4,
  });

  if (error || !data) {
    return [];
  }

  return data as { product_id: string; copurchase_count: number }[];
}

/**
 * Track a product view for the current user.
 * Used to feed the recommendation engine.
 */
export async function trackProductView(
  productId: string,
  categoryId: string
): Promise<void> {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) return;

  try {
    await supabase.from("product_views").insert({
      user_id: user.id,
      product_id: productId,
      category_id: categoryId,
      viewed_at: new Date().toISOString(),
    });
  } catch {
    // Non-critical — silently fail
  }
}
