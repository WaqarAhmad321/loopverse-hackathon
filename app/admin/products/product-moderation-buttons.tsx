"use client";

import { useTransition } from "react";
import { Button } from "@heroui/react";
import { Check, X } from "lucide-react";
import { updateProductStatus } from "@/actions/admin";

interface ProductModerationButtonsProps {
  productId: string;
}

export function ProductModerationButtons({
  productId,
}: ProductModerationButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await updateProductStatus(productId, "active");
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await updateProductStatus(productId, "rejected");
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="primary"
        size="sm"
        onPress={handleApprove}
        isDisabled={isPending}
      >
        <Check className="size-3.5" strokeWidth={2} />
        Approve
      </Button>
      <Button
        variant="danger"
        size="sm"
        onPress={handleReject}
        isDisabled={isPending}
      >
        <X className="size-3.5" strokeWidth={2} />
        Reject
      </Button>
    </div>
  );
}
