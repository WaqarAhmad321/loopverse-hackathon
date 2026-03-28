"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, getUser } from "@/lib/supabase/server";
import { productSchema } from "@/types/forms";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .concat("-", Date.now().toString(36));
}

async function verifySellerRole(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
) {
  const { data: roleRecord } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "seller")
    .single();
  return !!roleRecord;
}

export async function createProduct(formData: FormData) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!(await verifySellerRole(supabase, user.id))) {
    return { error: "Unauthorized" };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    price: formData.get("price"),
    discount_price: formData.get("discount_price") || null,
    sku: formData.get("sku"),
    stock_quantity: formData.get("stock_quantity"),
  };

  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const slug = generateSlug(parsed.data.name);
  const imagesRaw = formData.get("images");
  let images: string[] = [];
  if (imagesRaw) {
    try {
      images = JSON.parse(imagesRaw as string);
    } catch {
      return { error: "Invalid image data" };
    }
  }

  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!sellerProfile) {
    return { error: "Seller profile not found" };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      category_id: parsed.data.category_id,
      price: parsed.data.price,
      discount_price: parsed.data.discount_price ?? null,
      sku: parsed.data.sku,
      stock_quantity: parsed.data.stock_quantity,
      slug,
      images,
      status: "draft" as const,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Handle variants
  const variantsRaw = formData.get("variants");
  if (variantsRaw) {
    try {
      const variants = JSON.parse(variantsRaw as string) as {
        name: string;
        value: string;
        price_modifier: number;
        stock_quantity: number;
        sku: string;
      }[];

      const validVariants = variants.filter((v) => v.name && v.value);
      if (validVariants.length > 0) {
        await supabase.from("product_variants").insert(
          validVariants.map((v) => ({
            product_id: data.id,
            name: v.name,
            value: v.value,
            price_modifier: v.price_modifier,
            stock_quantity: v.stock_quantity,
            sku: v.sku,
          }))
        );
      }
    } catch {
      // Ignore variant parse errors — product was already created
    }
  }

  revalidatePath("/seller/products");
  return { success: true, productId: data.id };
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!(await verifySellerRole(supabase, user.id))) {
    return { error: "Unauthorized" };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("products")
    .select("id, seller_id")
    .eq("id", productId)
    .single();

  if (!existing || existing.seller_id !== user.id) {
    return { error: "Product not found or access denied" };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    price: formData.get("price"),
    discount_price: formData.get("discount_price") || null,
    sku: formData.get("sku"),
    stock_quantity: formData.get("stock_quantity"),
  };

  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const imagesRaw = formData.get("images");
  let images: string[] | undefined = undefined;
  if (imagesRaw) {
    try {
      images = JSON.parse(imagesRaw as string);
    } catch {
      return { error: "Invalid image data" };
    }
  }

  const updateData: Record<string, unknown> = {
    name: parsed.data.name,
    description: parsed.data.description,
    category_id: parsed.data.category_id,
    price: parsed.data.price,
    discount_price: parsed.data.discount_price ?? null,
    sku: parsed.data.sku,
    stock_quantity: parsed.data.stock_quantity,
    updated_at: new Date().toISOString(),
  };

  if (images) {
    updateData.images = images;
  }

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  // Handle variants
  const variantsRaw = formData.get("variants");
  const removedVariantIdsRaw = formData.get("removed_variant_ids");

  if (removedVariantIdsRaw) {
    try {
      const removedIds = JSON.parse(removedVariantIdsRaw as string) as string[];
      if (removedIds.length > 0) {
        await supabase
          .from("product_variants")
          .delete()
          .in("id", removedIds)
          .eq("product_id", productId);
      }
    } catch {
      // Ignore parse errors for removed variant ids
    }
  }

  if (variantsRaw) {
    try {
      const variants = JSON.parse(variantsRaw as string) as {
        id?: string;
        name: string;
        value: string;
        price_modifier: number;
        stock_quantity: number;
        sku: string;
      }[];

      for (const variant of variants) {
        if (variant.id) {
          // Update existing variant
          await supabase
            .from("product_variants")
            .update({
              name: variant.name,
              value: variant.value,
              price_modifier: variant.price_modifier,
              stock_quantity: variant.stock_quantity,
              sku: variant.sku,
            })
            .eq("id", variant.id)
            .eq("product_id", productId);
        } else if (variant.name && variant.value) {
          // Insert new variant
          await supabase.from("product_variants").insert({
            product_id: productId,
            name: variant.name,
            value: variant.value,
            price_modifier: variant.price_modifier,
            stock_quantity: variant.stock_quantity,
            sku: variant.sku,
          });
        }
      }
    } catch {
      // Ignore parse errors for variants
    }
  }

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}`);
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!(await verifySellerRole(supabase, user.id))) {
    return { error: "Unauthorized" };
  }

  const { data: existing } = await supabase
    .from("products")
    .select("id, seller_id")
    .eq("id", productId)
    .single();

  if (!existing || existing.seller_id !== user.id) {
    return { error: "Product not found or access denied" };
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/products");
  return { success: true };
}

export async function uploadProductImages(formData: FormData) {
  const supabase = await createServerClient();
  const user = await getUser();

  if (!user) {
    return { error: "Unauthorized", urls: [] };
  }

  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return { error: "No files provided", urls: [] };
  }

  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return { error: `Failed to upload ${file.name}: ${error.message}`, urls };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    urls.push(publicUrl);
  }

  return { success: true, urls };
}
