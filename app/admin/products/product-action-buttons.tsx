"use client";

import { useState, useTransition } from "react";
import { Button } from "@heroui/react";
import { ExternalLink, Trash2, AlertTriangle, X } from "lucide-react";
import { deleteProduct } from "@/actions/admin";

interface ProductActionButtonsProps {
  productId: string;
  productName: string;
  productSlug: string;
}

export function ProductActionButtons({
  productId,
  productName,
  productSlug,
}: ProductActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <a
          href={`/products/${productSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-1.5 font-body text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[var(--default)]"
        >
          <ExternalLink className="size-3.5" strokeWidth={2} />
          View
        </a>
        <Button
          variant="outline"
          size="sm"
          onPress={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/10"
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
          Remove
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-[16px] bg-[var(--surface)] p-6 shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--danger)]/10">
                <AlertTriangle
                  className="size-5 text-[var(--danger)]"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[color:var(--foreground)]">
                  Remove Product
                </h3>
                <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
                  Are you sure you want to remove{" "}
                  <span className="font-medium text-[color:var(--foreground)]">
                    {productName}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-[6px] bg-[var(--danger)]/10 px-3 py-2">
                <p className="font-body text-xs text-[var(--danger)]">
                  {error}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onPress={() => setIsOpen(false)}
                isDisabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={handleDelete}
                isDisabled={isPending}
              >
                {isPending ? "Removing..." : "Remove Product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
