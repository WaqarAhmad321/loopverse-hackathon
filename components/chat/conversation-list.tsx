"use client";

import { Avatar, Card } from "@heroui/react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConversationListItem {
  id: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  isResolved: boolean;
  productContext: string | null;
}

interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="mb-3 size-12 text-muted-foreground" />
        <p className="text-base font-medium">No conversations yet</p>
        <p className="text-sm text-muted-foreground">
          Start a conversation from a product or order page
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-default">
      {conversations.map((convo) => (
        <button
          key={convo.id}
          type="button"
          onClick={() => onSelect(convo.id)}
          className={cn(
            "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-default/30",
            selectedId === convo.id && "bg-primary/5",
            convo.unreadCount > 0 && selectedId !== convo.id && "bg-primary/5"
          )}
        >
          <Avatar className="size-10 shrink-0">
            {convo.participantAvatar ? (
              <img
                src={convo.participantAvatar}
                alt={convo.participantName}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {convo.participantName.charAt(0).toUpperCase()}
              </span>
            )}
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  "truncate text-sm",
                  convo.unreadCount > 0
                    ? "font-bold text-foreground"
                    : "font-medium text-foreground"
                )}
              >
                {convo.participantName}
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeDate(convo.lastMessageAt)}
              </span>
            </div>

            {convo.productContext && (
              <p className="truncate text-xs text-primary">
                Re: {convo.productContext}
              </p>
            )}

            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-muted-foreground">
                {convo.lastMessage ?? "No messages yet"}
              </p>
              {convo.unreadCount > 0 && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
