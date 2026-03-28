"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/products";

interface ProductDeleteButtonProps {
  productId: string;
  productName: string;
}

export function ProductDeleteButton({
  productId,
  productName,
}: ProductDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        alert(result.error);
      }
      setShowConfirm(false);
    });
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
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
          aria-label={`Confirm delete ${productName}`}
        >
          {isPending ? "..." : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className="rounded-[6px] p-1.5 text-[var(--danger)] transition-colors duration-150 hover:bg-[color:var(--danger)]/8"
      aria-label={`Delete ${productName}`}
    >
      <Trash2 className="size-4" strokeWidth={2} />
    </button>
  );
}
