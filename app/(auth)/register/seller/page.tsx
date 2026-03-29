"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Form,
  TextField,
  Label,
  Input,
  FieldError,
  Separator,
} from "@heroui/react";
import { AlertCircle, Store } from "lucide-react";
import { registerSellerAction, type AuthResult } from "@/actions/auth";

const initialState: AuthResult = {};

export default function RegisterSellerPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerSellerAction,
    initialState
  );

  useEffect(() => {
    if (state.redirect) {
      router.push(state.redirect);
    }
  }, [state.redirect, router]);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Start selling on LoopCommerce
        </h2>
        <p className="mt-1 font-body text-sm text-[var(--muted)]">
          Create your seller account and open your store
        </p>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-[10px] bg-[#FEF2F2] px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
          <p className="font-body text-sm text-[var(--danger)]">
            {state.error}
          </p>
        </div>
      )}

      <Form action={formAction} className="flex flex-col gap-5">
        {/* Personal details */}
        <TextField isRequired name="full_name">
          <Label className="font-body text-sm font-medium text-[var(--foreground)]">
            Full name
          </Label>
          <Input
            placeholder="Jane Doe"
            className="mt-1.5 rounded-[6px]"
          />
          <FieldError />
        </TextField>

        <TextField isRequired name="email" type="email">
          <Label className="font-body text-sm font-medium text-[var(--foreground)]">
            Email address
          </Label>
          <Input
            placeholder="you@example.com"
            className="mt-1.5 rounded-[6px]"
          />
          <FieldError />
        </TextField>

        <TextField name="phone" type="tel">
          <Label className="font-body text-sm font-medium text-[var(--foreground)]">
            Phone
            <span className="ml-1 text-[var(--muted)] font-normal">(optional)</span>
          </Label>
          <Input
            placeholder="+1 234 567 8900"
            className="mt-1.5 rounded-[6px]"
          />
          <FieldError />
        </TextField>

        <TextField isRequired name="password" type="password" minLength={8}>
          <Label className="font-body text-sm font-medium text-[var(--foreground)]">
            Password
          </Label>
          <Input
            placeholder="At least 8 characters"
            className="mt-1.5 rounded-[6px]"
          />
          <FieldError />
        </TextField>

        <TextField isRequired name="confirm_password" type="password" minLength={8}>
          <Label className="font-body text-sm font-medium text-[var(--foreground)]">
            Confirm password
          </Label>
          <Input
            placeholder="Re-enter your password"
            className="mt-1.5 rounded-[6px]"
          />
          <FieldError />
        </TextField>

        {/* Business details section */}
        <div className="mt-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex size-8 items-center justify-center rounded-[10px] bg-[rgba(13,148,136,0.1)]">
              <Store className="size-4 text-[var(--accent)]" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-[var(--foreground)]">
                Business Details
              </p>
              <p className="font-body text-xs text-[var(--muted)]">
                Tell us about your store
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <TextField isRequired name="store_name">
              <Label className="font-body text-sm font-medium text-[var(--foreground)]">
                Store name
              </Label>
              <Input
                placeholder="My Awesome Store"
                className="mt-1.5 rounded-[6px]"
              />
              <FieldError />
            </TextField>

            <TextField isRequired name="business_address">
              <Label className="font-body text-sm font-medium text-[var(--foreground)]">
                Business address
              </Label>
              <Input
                placeholder="123 Main St, City, Country"
                className="mt-1.5 rounded-[6px]"
              />
              <FieldError />
            </TextField>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-1 w-full rounded-[10px] font-body font-medium"
          isDisabled={isPending}
        >
          {isPending ? "Creating account..." : "Create seller account"}
        </Button>
      </Form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="font-body text-xs text-[var(--muted)]">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Links */}
      <div className="flex flex-col items-center gap-2.5 text-center">
        <p className="font-body text-sm text-[var(--muted)]">
          Just want to buy?{" "}
          <Link
            href="/register/buyer"
            className="font-medium text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-hover,#0F766E)]"
          >
            Register as buyer
          </Link>
        </p>
        <p className="font-body text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-hover,#0F766E)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
