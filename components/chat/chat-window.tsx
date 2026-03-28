"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card } from "@heroui/react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { MessageBubble } from "./message-bubble";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  participantName: string;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  participantName,
}: ChatWindowProps) {
  const { messages, sendMessage, isConnected, isLoading, error } =
    useRealtimeChat({ conversationId, currentUserId });

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputValue("");
    try {
      await sendMessage(trimmed);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isSending, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card>
          <Card.Content>
            <p className="text-sm text-danger">
              Failed to load messages: {error}
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-default px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {participantName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{participantName}</p>
          <p className="text-xs text-muted-foreground">
            {isConnected ? "Online" : "Connecting..."}
          </p>
        </div>
        {/* Connection indicator */}
        <div
          className={cn(
            "size-2 rounded-full",
            isConnected ? "bg-success" : "bg-warning"
          )}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              senderName={
                msg.sender_id === currentUserId ? null : participantName
              }
              timestamp={msg.created_at}
              isOwn={msg.sender_id === currentUserId}
              imageUrl={msg.image_url}
              isRead={msg.is_read}
            />
          ))
        )}

        {/* Typing indicator placeholder */}
        {/* Future: show typing dots when other user is typing */}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-default px-4 py-3">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Attach image"
            className="shrink-0"
          >
            <Paperclip className="size-4" />
          </Button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                "w-full resize-none rounded-lg border border-default bg-default/30 px-3 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              )}
              style={{ maxHeight: "120px" }}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            isIconOnly
            isDisabled={!inputValue.trim() || isSending}
            onPress={handleSend}
            aria-label="Send message"
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
