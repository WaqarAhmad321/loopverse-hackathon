"use client";

import { useState, useTransition } from "react";
import { Chip } from "@heroui/react";
import { Truck } from "lucide-react";
import { updateFulfillmentStatus } from "@/actions/orders";
import type { FulfillmentStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface FulfillmentUpdateFormProps {
  orderItemId: string;
  currentStatus: FulfillmentStatus;
  currentTrackingId: string | null;
}

const statusFlow: FulfillmentStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

function fulfillmentChipColor(
  status: FulfillmentStatus
): "success" | "warning" | "accent" | "default" {
  if (status === "delivered") return "success";
  if (status === "pending") return "warning";
  if (["confirmed", "packed", "shipped"].includes(status)) return "accent";
  return "default";
}

export function FulfillmentUpdateForm({
  orderItemId,
  currentStatus,
  currentTrackingId,
}: FulfillmentUpdateFormProps) {
  const [status, setStatus] = useState<FulfillmentStatus>(currentStatus);
  const [trackingId, setTrackingId] = useState(currentTrackingId ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleUpdate() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateFulfillmentStatus(
        orderItemId,
        status,
        trackingId || undefined
      );

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Status updated successfully" });
      }
    });
  }

  const currentIndex = statusFlow.indexOf(currentStatus);
  const isCompleted = currentStatus === "delivered";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck
            className="size-4 text-[color:var(--muted)]"
            strokeWidth={2}
          />
          <span className="font-body text-sm font-medium text-[color:var(--muted)]">
            Fulfillment
          </span>
        </div>
        <Chip
          size="sm"
          color={fulfillmentChipColor(currentStatus)}
          variant="soft"
          className="capitalize"
        >
          {currentStatus}
        </Chip>
      </div>

      {!isCompleted && (
        <div className="space-y-3">
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as FulfillmentStatus)
            }
            className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 font-body text-sm text-[var(--field-foreground)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            disabled={isPending}
          >
            {statusFlow.map((s, idx) => (
              <option key={s} value={s} disabled={idx < currentIndex}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {(status === "shipped" || currentStatus === "shipped") && (
            <input
              type="text"
              placeholder="Tracking ID (optional)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 font-mono text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              disabled={isPending}
            />
          )}

          <button
            type="button"
            onClick={handleUpdate}
            disabled={isPending || status === currentStatus}
            className="inline-flex items-center rounded-[10px] bg-[var(--accent)] px-4 py-2 font-body text-sm font-medium text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[#0F766E] disabled:opacity-50"
          >
            {isPending ? "Updating..." : "Update Status"}
          </button>
        </div>
      )}

      {currentTrackingId && (
        <p className="font-body text-xs text-[color:var(--muted)]">
          Tracking:{" "}
          <span className="font-mono">{currentTrackingId}</span>
        </p>
      )}

      {message && (
        <p
          className={cn(
            "font-body text-xs",
            message.type === "success"
              ? "text-[var(--success)]"
              : "text-[var(--danger)]"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
