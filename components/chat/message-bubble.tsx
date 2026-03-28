"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  senderName: string | null;
  timestamp: string;
  isOwn: boolean;
  imageUrl: string | null;
  isRead: boolean;
}

export function MessageBubble({
  content,
  senderName,
  timestamp,
  isOwn,
  imageUrl,
  isRead,
}: MessageBubbleProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className={cn(
        "flex w-full",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {/* Sender name for others' messages */}
        {!isOwn && senderName && (
          <span className="px-1 text-xs font-medium text-muted-foreground">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2",
            isOwn
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-default/60 text-foreground"
          )}
        >
          {/* Image attachment */}
          {imageUrl && (
            <div className="mb-2 overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt="Attached image"
                className="max-h-60 w-full object-cover"
              />
            </div>
          )}

          {/* Message text */}
          {content && (
            <p className="whitespace-pre-wrap break-words text-sm">
              {content}
            </p>
          )}
        </div>

        {/* Timestamp and read status */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formattedTime}
          </span>
          {isOwn && (
            isRead ? (
              <CheckCheck className="size-3 text-primary" />
            ) : (
              <Check className="size-3 text-muted-foreground" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
