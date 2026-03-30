"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { startConversation } from "@/actions/chat";
import Link from "next/link";

interface ChatWithSellerButtonProps {
  sellerId: string;
  productId: string;
  storeName: string;
}

export function ChatWithSellerButton({
  sellerId,
  productId,
  storeName,
}: ChatWithSellerButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authPrompt, setAuthPrompt] = useState(false);

  const handleClick = async () => {
    setAuthPrompt(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setAuthPrompt(true);
      return;
    }

    startTransition(async () => {
      await startConversation(sellerId, productId);
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary,#475569)] transition-all duration-150 hover:border-accent/30 hover:text-accent disabled:opacity-50"
      >
        <MessageSquare className="size-4" />
        {isPending ? "Opening chat..." : `Chat with ${storeName}`}
      </button>

      {authPrompt && (
        <div className="mt-2 flex items-center gap-2 rounded-[6px] bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <LogIn className="size-3.5 shrink-0" />
          <span>
            Please{" "}
            <Link href="/login" className="font-semibold underline">
              sign in
            </Link>{" "}
            to chat with sellers
          </span>
        </div>
      )}
    </div>
  );
}
