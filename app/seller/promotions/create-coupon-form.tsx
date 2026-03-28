"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { couponSchema, type CouponFormData } from "@/types/forms";
import { createCoupon } from "@/actions/promotions";
import { cn } from "@/lib/utils";

export function CreateCouponForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      discount_type: "percentage",
    },
  });

  function onSubmit(data: Record<string, unknown>) {
    const typedData = data as CouponFormData;
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("code", typedData.code);
      formData.set("discount_type", typedData.discount_type);
      formData.set("discount_value", typedData.discount_value.toString());
      if (
        typedData.min_order_amount !== undefined &&
        typedData.min_order_amount !== null
      ) {
        formData.set(
          "min_order_amount",
          typedData.min_order_amount.toString()
        );
      }
      formData.set("start_date", typedData.start_date);
      formData.set("end_date", typedData.end_date);
      if (
        typedData.max_usage !== undefined &&
        typedData.max_usage !== null
      ) {
        formData.set("max_usage", typedData.max_usage.toString());
      }

      const result = await createCoupon(formData);

      if (result.error) {
        setServerError(result.error);
      } else {
        setSuccessMessage("Coupon created successfully");
        reset();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
  }

  return (
    <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-150 hover:bg-[var(--default)]/30"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[6px] bg-[color:var(--accent)]/10">
            <Plus
              className="size-4 text-[color:var(--accent)]"
              strokeWidth={2}
            />
          </div>
          <span className="font-display text-base font-semibold text-[color:var(--foreground)]">
            Create New Coupon
          </span>
        </div>
        {isOpen ? (
          <ChevronUp
            className="size-5 text-[color:var(--muted)]"
            strokeWidth={2}
          />
        ) : (
          <ChevronDown
            className="size-5 text-[color:var(--muted)]"
            strokeWidth={2}
          />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-[var(--border)] px-6 py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="rounded-[6px] border border-[var(--danger)]/30 bg-[color:var(--danger)]/5 px-4 py-2.5">
                <p className="font-body text-sm text-[var(--danger)]">
                  {serverError}
                </p>
              </div>
            )}
            {successMessage && (
              <div className="rounded-[6px] border border-[var(--success)]/30 bg-[var(--success)]/5 px-4 py-2.5">
                <p className="font-body text-sm text-[var(--success)]">
                  {successMessage}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="code"
                  className="font-body text-sm font-medium text-[color:var(--foreground)]"
                >
                  Coupon Code
                </label>
                <input
                  id="code"
                  placeholder="e.g., SAVE20"
                  {...register("code")}
                  aria-invalid={!!errors.code}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-mono text-sm uppercase text-[var(--field-foreground)] placeholder:font-body placeholder:normal-case placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.code && (
                  <p className="font-body text-xs text-[var(--danger)]">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="discount_type"
                  className="font-body text-sm font-medium text-[color:var(--foreground)]"
                >
                  Discount Type
                </label>
                <select
                  id="discount_type"
                  {...register("discount_type")}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="discount_value"
                  className="font-body text-sm font-medium text-[color:var(--foreground)]"
                >
                  Discount Value
                </label>
                <input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 20"
                  {...register("discount_value")}
                  aria-invalid={!!errors.discount_value}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm tabular-nums text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.discount_value && (
                  <p className="font-body text-xs text-[var(--danger)]">
                    {errors.discount_value.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="min_order_amount"
                  className="font-body text-sm font-medium text-[color:var(--foreground)]"
                >
                  Min Order Amount
                  <span className="ml-1 font-normal text-[color:var(--muted)]">
                    (optional)
                  </span>
                </label>
                <input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 50.00"
                  {...register("min_order_amount")}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm tabular-nums text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="start_date"
                  className="font-body text-sm font-medium text-[color:var(--foreground)]"
                >
                  Start Date
                </label>
                <input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  aria-invalid={!!errors.start_date}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.start_date && (
                  <p className="font-body text-xs text-[var(--danger)]">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="end_date"
                  className="font-body text-sm font-medium text-[color:var(--foreground)]"
                >
                  End Date
                </label>
                <input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  aria-invalid={!!errors.end_date}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.end_date && (
                  <p className="font-body text-xs text-[var(--danger)]">
                    {errors.end_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="max_usage"
                  className="font-body text-sm font-medium text-[color:var(--foreground)]"
                >
                  Max Usage
                  <span className="ml-1 font-normal text-[color:var(--muted)]">
                    (optional)
                  </span>
                </label>
                <input
                  id="max_usage"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  {...register("max_usage")}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setIsOpen(false);
                }}
                className="inline-flex items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 font-body text-sm font-medium text-[color:var(--foreground)] transition-colors duration-150 hover:bg-[var(--default)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-[10px] bg-[var(--accent)] px-5 py-2.5 font-body text-sm font-medium text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[#0F766E] disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
