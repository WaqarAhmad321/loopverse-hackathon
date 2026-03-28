"use client";

import { useActionState } from "react";
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
import { AlertCircle } from "lucide-react";
import { loginAction, type AuthResult } from "@/actions/auth";

const initialState: AuthResult = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">
          Welcome back
        </h2>
        <p className="mt-1 font-body text-sm text-[var(--muted)]">
          Sign in to your LoopVerse account
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

        <div>
          <TextField isRequired name="password" type="password">
            <Label className="font-body text-sm font-medium text-[var(--foreground)]">
              Password
            </Label>
            <Input
              placeholder="Enter your password"
              className="mt-1.5 rounded-[6px]"
            />
            <FieldError />
          </TextField>
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="font-body text-xs text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-hover,#0F766E)]"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-1 w-full rounded-[10px] font-body font-medium"
          isDisabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </Form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="font-body text-xs text-[var(--muted)]">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Registration links */}
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-body text-sm text-[var(--muted)]">
          Don&apos;t have an account?
        </p>
        <div className="flex gap-4">
          <Link
            href="/register/buyer"
            className="font-body text-sm font-medium text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-hover,#0F766E)]"
          >
            Create a buyer account
          </Link>
          <span className="text-[var(--border)]">|</span>
          <Link
            href="/register/seller"
            className="font-body text-sm font-medium text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-hover,#0F766E)]"
          >
            Register as seller
          </Link>
        </div>
      </div>
    </>
  );
}
