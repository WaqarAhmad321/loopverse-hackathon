"use client";

import { useState, useTransition } from "react";
import { Button, TextField, Label, Input, Spinner } from "@heroui/react";
import { Save, CheckCircle, AlertCircle } from "lucide-react";
import { updateProfileAction } from "@/actions/auth";

interface ProfileFormProps {
  fullName: string;
  email: string;
  phone: string;
}

export function ProfileForm({ fullName, email, phone }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);

    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully" });
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <TextField defaultValue={fullName} name="full_name" isRequired>
        <Label className="text-sm font-medium text-foreground font-body">
          Full Name
        </Label>
        <Input
          placeholder="Your full name"
          className="mt-1.5 rounded-[6px] font-body"
        />
      </TextField>

      <TextField defaultValue={email} isReadOnly>
        <Label className="text-sm font-medium text-foreground font-body">
          Email
        </Label>
        <Input className="mt-1.5 rounded-[6px] font-body opacity-60" />
        <p className="mt-1 text-xs text-muted font-body">
          Email address cannot be changed
        </p>
      </TextField>

      <TextField defaultValue={phone} name="phone">
        <Label className="text-sm font-medium text-foreground font-body">
          Phone
        </Label>
        <Input
          placeholder="Your phone number"
          type="tel"
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
          variant="primary"
          isDisabled={isPending}
          className="rounded-[10px] font-body"
        >
          {isPending ? <Spinner size="sm" /> : <Save className="size-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
