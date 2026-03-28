"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Check, CheckCheck } from "lucide-react";

interface MarkAsReadButtonProps {
  mode: "single" | "all";
  notificationId?: string;
  userId?: string;
}

export function MarkAsReadButton({
  mode,
  notificationId,
  userId,
}: MarkAsReadButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkAsRead() {
    startTransition(async () => {
      try {
        const body =
          mode === "single"
            ? { notification_id: notificationId }
            : { user_id: userId, mark_all: true };

        const res = await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          router.refresh();
        }
      } catch {
        // Silently fail - non-critical action
      }
    });
  }

  if (mode === "all") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onPress={handleMarkAsRead}
        isDisabled={isPending}
        className="rounded-[10px] font-body text-accent"
      >
        <CheckCheck className="size-4" />
        Mark all read
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleMarkAsRead}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-[var(--accent-hover,#0F766E)] font-body disabled:opacity-50"
    >
      <Check className="size-3" />
      Mark as read
    </button>
  );
}
