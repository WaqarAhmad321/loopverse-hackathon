"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, getUser } from "@/lib/supabase/server";
import { couponSchema } from "@/types/forms";

export async function createCoupon(formData: FormData) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const raw = {
    code: formData.get("code"),
    discount_type: formData.get("discount_type"),
    discount_value: formData.get("discount_value"),
    min_order_amount: formData.get("min_order_amount") || null,
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    max_usage: formData.get("max_usage") || null,
  };

  const parsed = couponSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  // Validate date range
  if (parsed.data.end_date <= parsed.data.start_date) {
    return { error: "End date must be after start date" };
  }

  // Check for duplicate code for this seller
  const { data: existingCoupon } = await supabase
    .from("coupons")
    .select("id")
    .eq("seller_id", user.id)
    .eq("code", parsed.data.code)
    .single();

  if (existingCoupon) {
    return { error: "A coupon with this code already exists" };
  }

  const { error } = await supabase.from("coupons").insert({
    seller_id: user.id,
    code: parsed.data.code,
    discount_type: parsed.data.discount_type,
    discount_value: parsed.data.discount_value,
    min_order_amount: parsed.data.min_order_amount ?? null,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    max_usage: parsed.data.max_usage ?? null,
    is_active: true,
    usage_count: 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/promotions");
  return { success: true };
}

export async function updateCoupon(couponId: string, formData: FormData) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("coupons")
    .select("id, seller_id")
    .eq("id", couponId)
    .single();

  if (!existing || existing.seller_id !== user.id) {
    return { error: "Coupon not found or access denied" };
  }

  const raw = {
    code: formData.get("code"),
    discount_type: formData.get("discount_type"),
    discount_value: formData.get("discount_value"),
    min_order_amount: formData.get("min_order_amount") || null,
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    max_usage: formData.get("max_usage") || null,
  };

  const parsed = couponSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  if (parsed.data.end_date <= parsed.data.start_date) {
    return { error: "End date must be after start date" };
  }

  const { error } = await supabase
    .from("coupons")
    .update({
      code: parsed.data.code,
      discount_type: parsed.data.discount_type,
      discount_value: parsed.data.discount_value,
      min_order_amount: parsed.data.min_order_amount ?? null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      max_usage: parsed.data.max_usage ?? null,
    })
    .eq("id", couponId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/promotions");
  return { success: true };
}

export async function deleteCoupon(couponId: string) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: existing } = await supabase
    .from("coupons")
    .select("id, seller_id")
    .eq("id", couponId)
    .single();

  if (!existing || existing.seller_id !== user.id) {
    return { error: "Coupon not found or access denied" };
  }

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/promotions");
  return { success: true };
}

export async function toggleCouponActive(couponId: string) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: existing } = await supabase
    .from("coupons")
    .select("id, seller_id, is_active")
    .eq("id", couponId)
    .single();

  if (!existing || existing.seller_id !== user.id) {
    return { error: "Coupon not found or access denied" };
  }

  const { error } = await supabase
    .from("coupons")
    .update({ is_active: !existing.is_active })
    .eq("id", couponId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/promotions");
  return { success: true };
}
