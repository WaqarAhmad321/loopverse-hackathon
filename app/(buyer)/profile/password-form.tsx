"use client";

import { useState, useTransition } from "react";
import { Button, TextField, Label, Input, Spinner } from "@heroui/react";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (!newPassword || newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        });

        if (!res.ok) {
          const data = await res.json();
          setMessage({
            type: "error",
            text: data.error ?? "Failed to change password",
          });
          return;
        }

        setMessage({
          type: "success",
          text: "Password changed successfully",
        });

        // Clear form
        const form = document.querySelector(
          "[data-password-form]"
        ) as HTMLFormElement | null;
        form?.reset();
      } catch {
        setMessage({
          type: "error",
          text: "Something went wrong. Please try again.",
        });
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      data-password-form
      className="flex flex-col gap-5"
    >
      <TextField name="new_password" isRequired>
        <Label className="text-sm font-medium text-foreground font-body">
          New Password
        </Label>
        <Input
          type="password"
          placeholder="Enter new password"
          className="mt-1.5 rounded-[6px] font-body"
        />
      </TextField>

      <TextField name="confirm_password" isRequired>
        <Label className="text-sm font-medium text-foreground font-body">
          Confirm Password
        </Label>
        <Input
          type="password"
          placeholder="Confirm new password"
          className="mt-1.5 rounded-[6px] font-body"
        />
      </TextField>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-[6px] px-3 py-2.5 text-sm font-body ${
            message.type === "success"
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          variant="outline"
          isDisabled={isPending}
          className="rounded-[10px] font-body"
        >
          {isPending ? <Spinner size="sm" /> : <Lock className="size-4" />}
          Change Password
        </Button>
      </div>
    </form>
  );
}
