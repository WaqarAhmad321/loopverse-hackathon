"use server";

import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function startConversation(sellerId: string, productId?: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to chat" };
  }

  // Check if conversation already exists between this buyer and seller
  let query = supabase
    .from("chat_conversations")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Conversation already exists, redirect to it
    redirect(`/chat?conversation=${existing.id}`);
  }

  // Create new conversation
  const insertData: Record<string, unknown> = {
    buyer_id: user.id,
    seller_id: sellerId,
  };
  if (productId) {
    insertData.product_id = productId;
  }

  const { data: newConvo, error } = await supabase
    .from("chat_conversations")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to start conversation" };
  }

  redirect(`/chat?conversation=${newConvo.id}`);
}
