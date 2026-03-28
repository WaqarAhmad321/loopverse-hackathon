"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeChatOptions {
  conversationId: string;
  currentUserId: string;
}

interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useRealtimeChat({
  conversationId,
  currentUserId,
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseRef.current
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      setMessages(data ?? []);
      setIsLoading(false);

      // Mark unread messages from the other party as read
      const unreadIds = (data ?? [])
        .filter((m) => !m.is_read && m.sender_id !== currentUserId)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabaseRef.current
          .from("chat_messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    };

    fetchMessages();
  }, [conversationId, currentUserId]);

  // Subscribe to realtime changes
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Mark as read if from the other party
          if (newMessage.sender_id !== currentUserId) {
            supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMessage.id)
              .then();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!content.trim() && !imageUrl) return;

      const { error: insertError } = await supabaseRef.current
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content.trim(),
          image_url: imageUrl ?? null,
          is_read: false,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Update conversation's last_message_at
      await supabaseRef.current
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    [conversationId, currentUserId]
  );

  return { messages, sendMessage, isConnected, isLoading, error };
}
