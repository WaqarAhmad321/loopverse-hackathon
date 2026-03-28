"use client";

import { useTransition } from "react";
import { Button } from "@heroui/react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { toggleUserStatus } from "@/actions/admin";

interface UserToggleButtonProps {
  userId: string;
  isActive: boolean;
}

export function UserToggleButton({ userId, isActive }: UserToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleUserStatus(userId);
    });
  };

  return (
    <Button
      variant={isActive ? "danger" : "primary"}
      size="sm"
      onPress={handleToggle}
      isDisabled={isPending}
    >
      {isActive ? (
        <>
          <ShieldOff className="size-3.5" strokeWidth={2} />
          Block
        </>
      ) : (
        <>
          <ShieldCheck className="size-3.5" strokeWidth={2} />
          Unblock
        </>
      )}
    </Button>
  );
}
