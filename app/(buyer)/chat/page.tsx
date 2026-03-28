"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "@/components/chat/chat-window";
import {
  ConversationList,
  type ConversationListItem,
} from "@/components/chat/conversation-list";

interface ConversationRow {
  id: string;
  is_resolved: boolean;
  last_message_at: string;
  seller_id: string;
  product_id: string | null;
  seller_profile: {
    store_name: string;
    store_logo_url: string | null;
  };
  seller_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  product: {
    name: string;
  } | null;
  messages: {
    content: string;
    is_read: boolean;
    sender_id: string;
  }[];
}

export default function BuyerChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [participantNames, setParticipantNames] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchConversations = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data } = await supabase
        .from("chat_conversations")
        .select(
          `id, is_resolved, last_message_at, seller_id, product_id,
          seller_profile:seller_profiles!chat_conversations_seller_id_fkey(store_name, store_logo_url),
          seller_user:users!chat_conversations_seller_id_fkey(id, full_name, avatar_url),
          product:products(name),
          messages:chat_messages(content, is_read, sender_id)`
        )
        .eq("buyer_id", user.id)
        .order("last_message_at", { ascending: false });

      const rows = (data ?? []) as unknown as ConversationRow[];

      const nameMap: Record<string, string> = {};

      const items: ConversationListItem[] = rows.map((row) => {
        const storeName =
          row.seller_profile?.store_name ?? row.seller_user?.full_name ?? "Seller";
        nameMap[row.id] = storeName;

        const sortedMessages = [...row.messages];
        const lastMessage =
          sortedMessages.length > 0
            ? sortedMessages[sortedMessages.length - 1]
            : null;

        const unreadCount = row.messages.filter(
          (m) => !m.is_read && m.sender_id !== user.id
        ).length;

        return {
          id: row.id,
          participantName: storeName,
          participantAvatar: row.seller_profile?.store_logo_url ?? null,
          lastMessage: lastMessage?.content ?? null,
          lastMessageAt: row.last_message_at,
          unreadCount,
          isResolved: row.is_resolved,
          productContext: row.product?.name ?? null,
        };
      });

      setParticipantNames(nameMap);
      setConversations(items);
      setIsLoading(false);
    };

    fetchConversations();
  }, [router]);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConvoId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedConvoId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted" />
      </div>
    );
  }

  if (!currentUserId) return null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
          Messages
        </h1>
        <p className="mt-1.5 text-base text-[var(--text-secondary,#475569)] font-body">
          Chat with sellers about products and orders
        </p>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[var(--surface-shadow)]">
        <div className="flex h-[calc(100vh-260px)] min-h-[500px]">
          {/* Conversation List */}
          <div
            className={cn(
              "w-full border-r border-border lg:w-80 lg:shrink-0",
              selectedConvoId ? "hidden lg:block" : "block"
            )}
          >
            <div className="h-full overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedId={selectedConvoId}
                onSelect={handleSelectConversation}
              />
            </div>
          </div>

          {/* Chat Window */}
          <div
            className={cn(
              "flex-1",
              selectedConvoId ? "block" : "hidden lg:block"
            )}
          >
            {selectedConvoId ? (
              <div className="flex h-full flex-col">
                {/* Mobile back button */}
                <div className="border-b border-border px-4 py-2.5 lg:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleBack}
                    className="rounded-[10px] font-body"
                  >
                    <ArrowLeft className="size-4" />
                    Back to conversations
                  </Button>
                </div>
                <div className="flex-1">
                  <ChatWindow
                    conversationId={selectedConvoId}
                    currentUserId={currentUserId}
                    participantName={
                      participantNames[selectedConvoId] ?? "Seller"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent/[0.08]">
                    <MessageSquare className="size-6 text-accent" strokeWidth={2} />
                  </div>
                  <p className="font-display text-base font-semibold text-foreground">
                    Select a conversation
                  </p>
                  <p className="mt-1 text-sm text-muted font-body">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
