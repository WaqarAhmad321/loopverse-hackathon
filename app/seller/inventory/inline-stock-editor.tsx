"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { updateStock } from "@/actions/inventory";

interface InlineStockEditorProps {
  productId: string;
  currentStock: number;
}

export function InlineStockEditor({
  productId,
  currentStock,
}: InlineStockEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentStock.toString());
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 0) {
      alert("Please enter a valid non-negative number");
      return;
    }

    startTransition(async () => {
      const result = await updateStock(productId, quantity);
      if (result.error) {
        alert(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleCancel() {
    setValue(currentStock.toString());
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 font-body text-xs font-medium text-[color:var(--accent)] transition-colors duration-150 hover:bg-[color:var(--accent)]/8"
        aria-label="Edit stock quantity"
      >
        <Pencil className="size-3.5" strokeWidth={2} />
        Edit
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-2 py-1.5 font-body text-sm tabular-nums text-[var(--field-foreground)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-[6px] p-1.5 text-[var(--success)] transition-colors duration-150 hover:bg-[var(--success)]/10 disabled:opacity-50"
        aria-label="Save stock"
      >
        <Check className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="rounded-[6px] p-1.5 text-[color:var(--muted)] transition-colors duration-150 hover:bg-[var(--default)] disabled:opacity-50"
        aria-label="Cancel edit"
      >
        <X className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
