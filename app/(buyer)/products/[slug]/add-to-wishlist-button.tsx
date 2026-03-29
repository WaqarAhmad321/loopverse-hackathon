"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, AlertCircle, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddToWishlistButtonProps {
  productId: string;
}

export function AddToWishlistButton({ productId }: AddToWishlistButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authPrompt, setAuthPrompt] = useState(false);

  const handleToggleWishlist = useCallback(async () => {
    setError(null);
    setAuthPrompt(false);

    // Check if user is logged in before calling server action
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAuthPrompt(true);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to update wishlist");
          return;
        }

        const data = await res.json();
        setAdded(data.added);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }, [productId, router]);

  return (
    <div>
      <button
        type="button"
        onClick={handleToggleWishlist}
        disabled={isPending}
        className={`flex w-full items-center justify-center gap-2.5 rounded-[10px] border px-6 py-3 text-sm font-semibold transition-all duration-150 ease-out font-body ${
          added
            ? "border-accent bg-accent/[0.06] text-accent"
            : "border-border bg-surface text-[var(--text-secondary,#475569)] hover:border-accent hover:text-accent"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isPending ? (
          <div className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        ) : (
          <Heart
            className={`size-5 ${added ? "fill-accent text-accent" : ""}`}
          />
        )}
        {added ? "Added to Wishlist" : "Add to Wishlist"}
      </button>
      {authPrompt && (
        <div className="mt-2 flex items-center gap-2 rounded-[6px] bg-accent/[0.06] px-3 py-2">
          <LogIn className="size-3.5 shrink-0 text-accent" />
          <p className="text-xs text-foreground font-body">
            Please{" "}
            <Link href="/login" className="font-semibold text-accent underline underline-offset-2 hover:text-[var(--accent-hover,#0F766E)]">
              sign in
            </Link>{" "}
            to add items to your wishlist.
          </p>
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-[6px] bg-danger/[0.06] px-3 py-2">
          <AlertCircle className="size-3.5 shrink-0 text-danger" />
          <p className="text-xs text-danger font-body">{error}</p>
        </div>
      )}
    </div>
  );
}
