"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, Upload, Lock } from "lucide-react";
import {
  sellerProfileSchema,
  type SellerProfileFormData,
} from "@/types/forms";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  profile: {
    store_name: string;
    store_description: string;
    business_address: string;
    store_logo_url: string | null;
  };
  userId: string;
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(
    profile.store_logo_url
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SellerProfileFormData>({
    resolver: zodResolver(sellerProfileSchema),
    defaultValues: {
      store_name: profile.store_name,
      store_description: profile.store_description,
      business_address: profile.business_address,
    },
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const url = URL.createObjectURL(file);
    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(url);
  }

  function onSubmit(data: SellerProfileFormData) {
    setMessage(null);

    startTransition(async () => {
      try {
        let logoUrl = profile.store_logo_url;

        // Upload logo if changed
        if (logoFile) {
          const formData = new FormData();
          formData.append("file", logoFile);
          formData.append("bucket", "store-logos");
          formData.append("path", `${userId}/logo`);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            logoUrl = uploadData.url;
          }
        }

        const res = await fetch("/api/seller/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_name: data.store_name,
            store_description: data.store_description ?? null,
            business_address: data.business_address,
            store_logo_url: logoUrl,
          }),
        });

        if (res.ok) {
          setMessage({
            type: "success",
            text: "Profile updated successfully",
          });
        } else {
          const err = await res.json();
          setMessage({
            type: "error",
            text: err.error ?? "Failed to update profile",
          });
        }
      } catch {
        setMessage({ type: "error", text: "An unexpected error occurred" });
      }
    });
  }

  function handlePasswordChange() {
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Passwords do not match",
      });
      return;
    }

    startPasswordTransition(async () => {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (res.ok) {
          setPasswordMessage({
            type: "success",
            text: "Password changed successfully",
          });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          const err = await res.json();
          setPasswordMessage({
            type: "error",
            text: err.error ?? "Failed to change password",
          });
        }
      } catch {
        setPasswordMessage({
          type: "error",
          text: "An unexpected error occurred",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Store Details */}
      <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-6 py-4">
          <Store
            className="size-5 text-[color:var(--muted)]"
            strokeWidth={2}
          />
          <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
            Store Details
          </h2>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {message && (
              <div
                className={cn(
                  "rounded-[6px] border px-4 py-2.5",
                  message.type === "success"
                    ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                    : "border-[var(--danger)]/30 bg-[color:var(--danger)]/5"
                )}
              >
                <p
                  className={cn(
                    "font-body text-sm",
                    message.type === "success"
                      ? "text-[var(--success)]"
                      : "text-[var(--danger)]"
                  )}
                >
                  {message.text}
                </p>
              </div>
            )}

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="font-body text-sm font-medium text-[color:var(--foreground)]">
                Store Logo
              </label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Store logo"
                    className="size-20 rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-[10px] bg-[var(--default)]">
                    <Store
                      className="size-8 text-[color:var(--muted)]"
                      strokeWidth={1.5}
                    />
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] px-3 py-2.5 font-body text-sm text-[color:var(--muted)] transition-colors duration-150 hover:bg-[var(--default)]">
                    <Upload className="size-4" strokeWidth={2} />
                    Upload Logo
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="store_name"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Store Name
              </label>
              <input
                id="store_name"
                placeholder="Your store name"
                {...register("store_name")}
                aria-invalid={!!errors.store_name}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {errors.store_name && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.store_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="store_description"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Store Description
              </label>
              <textarea
                id="store_description"
                placeholder="Tell buyers about your store..."
                rows={4}
                {...register("store_description")}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="business_address"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Business Address
              </label>
              <input
                id="business_address"
                placeholder="Your business address"
                {...register("business_address")}
                aria-invalid={!!errors.business_address}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {errors.business_address && (
                <p className="font-body text-xs text-[var(--danger)]">
                  {errors.business_address.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-[10px] bg-[var(--accent)] px-5 py-2.5 font-body text-sm font-medium text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[#0F766E] disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-6 py-4">
          <Lock
            className="size-5 text-[color:var(--muted)]"
            strokeWidth={2}
          />
          <h2 className="font-display text-lg font-semibold text-[color:var(--foreground)]">
            Change Password
          </h2>
        </div>
        <div className="space-y-5 px-6 py-5">
          {passwordMessage && (
            <div
              className={cn(
                "rounded-[6px] border px-4 py-2.5",
                passwordMessage.type === "success"
                  ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                  : "border-[var(--danger)]/30 bg-[color:var(--danger)]/5"
              )}
            >
              <p
                className={cn(
                  "font-body text-sm",
                  passwordMessage.type === "success"
                    ? "text-[var(--success)]"
                    : "text-[var(--danger)]"
                )}
              >
                {passwordMessage.text}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="current_password"
              className="font-body text-sm font-medium text-[color:var(--foreground)]"
            >
              Current Password
            </label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="new_password"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                New Password
              </label>
              <input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm_new_password"
                className="font-body text-sm font-medium text-[color:var(--foreground)]"
              >
                Confirm New Password
              </label>
              <input
                id="confirm_new_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--field-background)] px-3 py-2.5 font-body text-sm text-[var(--field-foreground)] placeholder:text-[var(--field-placeholder)] transition-colors duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={
                isPasswordPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="inline-flex items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 font-body text-sm font-medium text-[color:var(--foreground)] transition-colors duration-150 hover:bg-[var(--default)] disabled:opacity-50"
            >
              {isPasswordPending ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
