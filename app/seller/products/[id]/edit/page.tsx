"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { productSchema, type ProductFormData } from "@/types/forms";
import { updateProduct, uploadProductImages } from "@/actions/products";
import { createClient } from "@/lib/supabase/client";
import type { Category, ProductVariant } from "@/types/database";

interface VariantRow {
  id?: string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  sku: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [existingVariantIds, setExistingVariantIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  const fetchProduct = useCallback(async () => {
    const supabase = createClient();

    const [productResult, variantsResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single(),
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId),
    ]);

    if (productResult.data) {
      const p = productResult.data;
      reset({
        name: p.name,
        description: p.description,
        category_id: p.category_id,
        price: p.price,
        discount_price: p.discount_price ?? undefined,
        sku: p.sku,
        stock_quantity: p.stock_quantity,
      });
      setExistingImages(p.images ?? []);
    }

    if (variantsResult.data) {
      const mapped: VariantRow[] = variantsResult.data.map(
        (v: ProductVariant) => ({
          id: v.id,
          name: v.name,
          value: v.value,
          price_modifier: v.price_modifier,
          stock_quantity: v.stock_quantity,
          sku: v.sku,
        })
      );
      setVariants(mapped);
      setExistingVariantIds(mapped.map((v) => v.id).filter(Boolean) as string[]);
    }

    setLoading(false);
  }, [productId, reset]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch {
        // Categories will be empty
      }
    }
    fetchCategories();
    fetchProduct();
  }, [fetchProduct]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const totalSlots = 5 - existingImages.length;
    const newFiles = [...imageFiles, ...files].slice(0, totalSlots);
    setImageFiles(newFiles);

    const previews = newFiles.map((file) => URL.createObjectURL(file));
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews(previews);
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  }

  function removeExistingImage(index: number) {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  }

  function addVariant() {
    setVariants([
      ...variants,
      { name: "", value: "", price_modifier: 0, stock_quantity: 0, sku: "" },
    ]);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof VariantRow, val: string) {
    setVariants(
      variants.map((v, i) => {
        if (i !== index) return v;
        if (field === "price_modifier" || field === "stock_quantity") {
          return { ...v, [field]: Number(val) || 0 };
        }
        return { ...v, [field]: val };
      })
    );
  }

  function onSubmit(data: Record<string, unknown>) {
    const typedData = data as ProductFormData;
    setServerError(null);

    startTransition(async () => {
      let newImageUrls: string[] = [];

      if (imageFiles.length > 0) {
        setUploadProgress(true);
        const uploadForm = new FormData();
        imageFiles.forEach((file) => uploadForm.append("files", file));

        const uploadResult = await uploadProductImages(uploadForm);
        setUploadProgress(false);

        if (uploadResult.error) {
          setServerError(uploadResult.error);
          return;
        }
        newImageUrls = uploadResult.urls;
      }

      const allImages = [...existingImages, ...newImageUrls];

      const formData = new FormData();
      formData.set("name", typedData.name);
      formData.set("description", typedData.description);
      formData.set("category_id", typedData.category_id);
      formData.set("price", typedData.price.toString());
      if (typedData.discount_price) {
        formData.set("discount_price", typedData.discount_price.toString());
      }
      formData.set("sku", typedData.sku);
      formData.set("stock_quantity", typedData.stock_quantity.toString());
      formData.set("images", JSON.stringify(allImages));
      formData.set("variants", JSON.stringify(variants));
      formData.set(
        "removed_variant_ids",
        JSON.stringify(
          existingVariantIds.filter(
            (eid) => !variants.some((v) => v.id === eid)
          )
        )
      );

      const result = await updateProduct(productId, formData);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      router.push("/seller/products");
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="font-body text-sm text-[color:var(--muted)]">
          Loading product...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          href="/seller/products"
          className="flex size-9 items-center justify-center rounded-[10px] text-[color:var(--muted)] transition-colors duration-150 hover:bg-[var(--default)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
            Edit Product
          </h1>
          <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
            Update the details of your product
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Server error */}
        {serverError && (
          <div className="rounded-[10px] border border-[var(--danger)]/30 bg-[color:var(--danger)]/5 px-5 py-3">
            <p className="font-body text-sm text-[var(--danger)]">
              {serverError}
            </p>
          </div>
        )}

        {/* Basic Information */}
        <div className="rounded-[10px] bg-[var(--surface)] p-6 shadow-[var(--surface-shadow)]">
          <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
            Basic Information
          </h2>
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Product Name
              </label>
              <input
                id="name"
                placeholder="Enter product name"
                {...register("name")}
                aria-invalid={!!errors.name}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {errors.name && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Description
              </label>
              <textarea
                id="description"
                placeholder="Describe your product in detail..."
                rows={5}
                {...register("description")}
                aria-invalid={!!errors.description}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {errors.description && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="category_id"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Category
              </label>
              <select
                id="category_id"
                {...register("category_id")}
                aria-invalid={!!errors.category_id}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.category_id.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-[10px] bg-[var(--surface)] p-6 shadow-[var(--surface-shadow)]">
          <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
            Pricing & Inventory
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="price"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("price")}
                aria-invalid={!!errors.price}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm tabular-nums text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {errors.price && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="discount_price"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Discount Price ($)
                <span className="ml-1 font-normal text-[color:var(--muted)]">
                  (optional)
                </span>
              </label>
              <input
                id="discount_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("discount_price")}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm tabular-nums text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="sku"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                SKU
              </label>
              <input
                id="sku"
                placeholder="e.g., PROD-001"
                {...register("sku")}
                aria-invalid={!!errors.sku}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-mono text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {errors.sku && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="stock_quantity"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Stock Quantity
              </label>
              <input
                id="stock_quantity"
                type="number"
                min="0"
                placeholder="0"
                {...register("stock_quantity")}
                aria-invalid={!!errors.stock_quantity}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm tabular-nums text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {errors.stock_quantity && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.stock_quantity.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-[10px] bg-[var(--surface)] p-6 shadow-[var(--surface-shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
                Variants
              </h2>
              <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
                Add size, color, or other product variations
              </p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-body text-sm font-medium text-[color:var(--foreground)] transition-colors duration-150 hover:bg-[var(--default)]"
            >
              <Plus className="size-4" strokeWidth={2} />
              Add Variant
            </button>
          </div>

          {variants.length > 0 && (
            <div className="mt-5 space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.id ?? `new-${index}`}
                  className="grid grid-cols-1 gap-3 rounded-[6px] border border-[var(--border)] p-4 sm:grid-cols-6"
                >
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-medium text-[color:var(--muted)]">
                      Name
                    </label>
                    <input
                      placeholder="e.g., Size"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(index, "name", e.target.value)
                      }
                      className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-medium text-[color:var(--muted)]">
                      Value
                    </label>
                    <input
                      placeholder="e.g., XL"
                      value={variant.value}
                      onChange={(e) =>
                        updateVariant(index, "value", e.target.value)
                      }
                      className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-medium text-[color:var(--muted)]">
                      Price Modifier
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={variant.price_modifier}
                      onChange={(e) =>
                        updateVariant(index, "price_modifier", e.target.value)
                      }
                      className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 font-body text-sm tabular-nums text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-medium text-[color:var(--muted)]">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={variant.stock_quantity}
                      onChange={(e) =>
                        updateVariant(index, "stock_quantity", e.target.value)
                      }
                      className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 font-body text-sm tabular-nums text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-medium text-[color:var(--muted)]">
                      SKU
                    </label>
                    <input
                      placeholder="VAR-001"
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(index, "sku", e.target.value)
                      }
                      className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 font-mono text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="flex size-9 items-center justify-center rounded-[6px] text-[var(--danger)] transition-colors duration-150 hover:bg-[var(--danger)]/10"
                      aria-label={`Remove variant ${index + 1}`}
                    >
                      <Trash2 className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {variants.length === 0 && (
            <p className="mt-4 font-body text-sm text-[color:var(--muted)]">
              No variants added. Click &quot;Add Variant&quot; to create product
              variations.
            </p>
          )}
        </div>

        {/* Product Images */}
        <div className="rounded-[10px] bg-[var(--surface)] p-6 shadow-[var(--surface-shadow)]">
          <div>
            <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
              Product Images
            </h2>
            <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
              Upload up to 5 images. First image will be the cover.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="group relative aspect-square">
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="size-full rounded-[10px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-[var(--danger)] text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X className="size-3.5" strokeWidth={2.5} />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-[4px] bg-black/60 px-1.5 py-0.5 font-body text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
              </div>
            ))}

            {imagePreviews.map((preview, index) => (
              <div key={preview} className="group relative aspect-square">
                <img
                  src={preview}
                  alt={`New image ${index + 1}`}
                  className="size-full rounded-[10px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-[var(--danger)] text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100"
                  aria-label={`Remove new image ${index + 1}`}
                >
                  <X className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {existingImages.length + imageFiles.length < 5 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[var(--border)] bg-[var(--default)]/30 transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[color:var(--accent)]/5">
                <ImagePlus
                  className="mb-1.5 size-6 text-[color:var(--muted)]"
                  strokeWidth={1.5}
                />
                <span className="font-body text-xs text-[color:var(--muted)]">
                  Add Image
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/seller/products"
            className="inline-flex items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 font-body text-sm font-medium text-[color:var(--foreground)] transition-colors duration-150 hover:bg-[var(--default)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-[10px] bg-[var(--accent)] px-5 py-2.5 font-body text-sm font-medium text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[#0F766E] disabled:opacity-50"
          >
            {uploadProgress
              ? "Uploading images..."
              : isPending
                ? "Saving..."
                : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
