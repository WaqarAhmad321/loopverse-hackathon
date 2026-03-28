"use client";

import { useState, useTransition } from "react";
import { Button, Spinner } from "@heroui/react";
import { Tag } from "lucide-react";

export function CouponForm() {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleApplyCoupon() {
    if (!code.trim()) return;
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim().toUpperCase() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage({ type: "error", text: data.error ?? "Invalid coupon code" });
          return;
        }

        setMessage({
          type: "success",
          text: `Coupon applied! ${data.discount_type === "percentage" ? `${data.discount_value}% off` : `$${data.discount_value} off`}`,
        });
      } catch {
        setMessage({ type: "error", text: "Failed to apply coupon" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            aria-label="Coupon code"
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setMessage(null);
            }}
            className="
              h-9 w-full rounded-[6px] border border-border bg-[var(--background-tertiary,#F1F5F9)]
              pl-9 pr-3 text-sm text-foreground font-body
              placeholder:text-muted
              transition-colors duration-150
              focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30
            "
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onPress={handleApplyCoupon}
          isDisabled={!code.trim() || isPending}
          className="shrink-0"
        >
          {isPending && <Spinner size="sm" />}
          Apply
        </Button>
      </div>
      {message && (
        <p
          className={`text-xs font-body ${
            message.type === "success" ? "text-success" : "text-danger"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
