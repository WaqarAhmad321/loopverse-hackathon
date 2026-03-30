"use client";

import { useState, useTransition } from "react";
import { Button, Modal, Label, Spinner } from "@heroui/react";
import { RotateCcw, CheckCircle, AlertCircle } from "lucide-react";

interface ReturnRequestButtonProps {
  orderItemId: string;
}

export function ReturnRequestButton({ orderItemId }: ReturnRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (reason.trim().length < 10) {
      setError("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_item_id: orderItemId,
            reason: reason.trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to submit return request");
          return;
        }

        setSubmitted(true);
        setIsOpen(false);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <span className="flex items-center gap-1 text-xs text-success font-body">
        <CheckCircle className="size-3" />
        Return requested
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-col">
      <Button
        size="sm"
        variant="outline"
        onPress={() => setIsOpen(true)}
        className="rounded-[6px] font-body"
      >
        <RotateCcw className="size-3" />
        <span className="text-xs">Return</span>
      </Button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop />
        <Modal.Header>
          <Modal.Heading className="font-display">
            Request a Return
          </Modal.Heading>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-4 text-sm text-muted font-body">
            Please describe why you would like to return this item.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground font-body">
              Reason
            </Label>
            <textarea
              aria-label="Reason for return"
              placeholder="Describe the reason for your return..."
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setReason(e.target.value);
                setError(null);
              }}
              className="
                w-full rounded-[6px] border border-[var(--field-border)]
                bg-[var(--field-background)] px-3 py-2.5 text-sm font-body
                text-foreground placeholder:text-[var(--field-placeholder)]
                focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20
                transition-colors
              "
              rows={4}
            />
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-[6px] bg-danger/10 px-3 py-2.5 text-sm text-danger font-body">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            onPress={() => setIsOpen(false)}
            className="rounded-[10px] font-body"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            isDisabled={isPending}
            className="rounded-[10px] font-body"
          >
            {isPending && <Spinner size="sm" />}
            Submit Request
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
