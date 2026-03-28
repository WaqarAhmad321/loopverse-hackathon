"use client";

import { useState, useTransition } from "react";
import { Power, Trash2 } from "lucide-react";
import { toggleCouponActive, deleteCoupon } from "@/actions/promotions";

interface CouponActionsProps {
  couponId: string;
  isActive: boolean;
  couponCode: string;
}

export function CouponActions({
  couponId,
  isActive,
  couponCode,
}: CouponActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCouponActive(couponId);
      if (result.error) {
        alert(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCoupon(couponId);
      if (result.error) {
        alert(result.error);
      }
      setConfirmDelete(false);
    });
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          disabled={isPending}
          className="rounded-[6px] px-2.5 py-1.5 font-body text-xs font-medium text-[color:var(--muted)] transition-colors duration-150 hover:bg-[var(--default)] hover:text-[color:var(--foreground)] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-[6px] px-2.5 py-1.5 font-body text-xs font-medium text-[var(--danger)] transition-colors duration-150 hover:bg-[color:var(--danger)]/8 disabled:opacity-50"
          aria-label={`Confirm delete coupon ${couponCode}`}
        >
          {isPending ? "..." : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded-[6px] p-1.5 transition-colors duration-150 disabled:opacity-50 ${
          isActive
            ? "text-[var(--warning)] hover:bg-[var(--warning)]/10"
            : "text-[var(--success)] hover:bg-[var(--success)]/10"
        }`}
        aria-label={isActive ? "Deactivate coupon" : "Activate coupon"}
      >
        <Power className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        disabled={isPending}
        className="rounded-[6px] p-1.5 text-[var(--danger)] transition-colors duration-150 hover:bg-[color:var(--danger)]/8 disabled:opacity-50"
        aria-label={`Delete coupon ${couponCode}`}
      >
        <Trash2 className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
