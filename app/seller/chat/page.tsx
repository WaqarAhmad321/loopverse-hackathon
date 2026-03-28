"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@heroui/react";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
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
  buyer_id: string;
  product_id: string | null;
  buyer: {
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

export default function SellerChatPage() {
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
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>({});
  const [isResolving, setIsResolving] = useState(false);

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
          `id, is_resolved, last_message_at, buyer_id, product_id,
          buyer:users!chat_conversations_buyer_id_fkey(id, full_name, avatar_url),
          product:products(name),
          messages:chat_messages(content, is_read, sender_id)`
        )
        .eq("seller_id", user.id)
        .order("last_message_at", { ascending: false });

      const rows = (data ?? []) as unknown as ConversationRow[];

      const nameMap: Record<string, string> = {};
      const resMap: Record<string, boolean> = {};

      const items: ConversationListItem[] = rows.map((row) => {
        const buyerName = row.buyer?.full_name ?? "Buyer";
        nameMap[row.id] = buyerName;
        resMap[row.id] = row.is_resolved;

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
          participantName: buyerName,
          participantAvatar: row.buyer?.avatar_url ?? null,
          lastMessage: lastMessage?.content ?? null,
          lastMessageAt: row.last_message_at,
          unreadCount,
          isResolved: row.is_resolved,
          productContext: row.product?.name ?? null,
        };
      });

      setParticipantNames(nameMap);
      setResolvedMap(resMap);
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

  const handleMarkResolved = useCallback(async () => {
    if (!selectedConvoId) return;

    setIsResolving(true);
    const supabase = createClient();
    const newStatus = !resolvedMap[selectedConvoId];

    await supabase
      .from("chat_conversations")
      .update({ is_resolved: newStatus })
      .eq("id", selectedConvoId);

    setResolvedMap((prev) => ({ ...prev, [selectedConvoId]: newStatus }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvoId ? { ...c, isResolved: newStatus } : c
      )
    );
    setIsResolving(false);
  }, [selectedConvoId, resolvedMap]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[color:var(--muted)]" />
      </div>
    );
  }

  if (!currentUserId) return null;

  const isCurrentResolved = selectedConvoId
    ? resolvedMap[selectedConvoId] ?? false
    : false;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Messages
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Conversations with buyers
        </p>
      </div>

      {/* Chat container */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Conversation List */}
          <div
            className={cn(
              "w-full border-r border-[var(--border)] lg:w-80 lg:shrink-0",
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
                {/* Chat header: back button + resolved controls */}
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 font-body text-sm font-medium text-[color:var(--muted)] transition-colors duration-150 hover:bg-[var(--default)] hover:text-[color:var(--foreground)] lg:hidden"
                  >
                    <ArrowLeft className="size-4" strokeWidth={2} />
                    Back
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="hidden font-body text-sm font-medium text-[color:var(--foreground)] lg:inline">
                      {participantNames[selectedConvoId] ?? "Buyer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrentResolved && (
                      <Chip color="success" variant="soft" size="sm">
                        Resolved
                      </Chip>
                    )}
                    <button
                      type="button"
                      onClick={handleMarkResolved}
                      disabled={isResolving}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 font-body text-xs font-medium transition-colors duration-150 disabled:opacity-50",
                        isCurrentResolved
                          ? "text-[color:var(--muted)] hover:bg-[var(--default)]"
                          : "border border-[var(--border)] text-[color:var(--foreground)] hover:bg-[var(--default)]"
                      )}
                    >
                      <CheckCircle className="size-3.5" strokeWidth={2} />
                      {isCurrentResolved ? "Reopen" : "Mark Resolved"}
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <ChatWindow
                    conversationId={selectedConvoId}
                    currentUserId={currentUserId}
                    participantName={
                      participantNames[selectedConvoId] ?? "Buyer"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
                    <MessageSquare
                      className="size-6 text-[color:var(--muted)]"
                      strokeWidth={2}
                    />
                  </div>
                  <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
                    Select a conversation
                  </p>
                  <p className="mt-1 font-body text-xs text-[color:var(--muted)]">
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
