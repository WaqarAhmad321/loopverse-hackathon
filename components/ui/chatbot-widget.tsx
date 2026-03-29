"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { MessageCircle, X, Send, Loader2, Minus, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionId(): string {
  const key = "loopverse_chatbot_session";
  if (typeof window === "undefined") return generateId();

  let id = localStorage.getItem(key);
  if (!id) {
    id = generateId();
    localStorage.setItem(key, id);
  }
  return id;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>("");

  // Initialize session
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const assistantId = generateId();

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            sessionId: sessionIdRef.current,
          }),
        });

        if (!res.ok) throw new Error("Request failed");

        const contentType = res.headers.get("content-type") ?? "";

        if (contentType.includes("text/plain") || contentType.includes("text/event-stream") || contentType.includes("octet-stream")) {
          // Streaming response — plain text stream from Vercel AI SDK toTextStreamResponse()
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No reader");

          const decoder = new TextDecoder();
          let fullText = "";

          // Add streaming message
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: "", isStreaming: true },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: fullText }
                  : m
              )
            );
          }

          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false }
                : m
            )
          );
        } else {
          // JSON response (fallback mode)
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: data.response || "Sorry, something went wrong.",
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content:
              "Sorry, I am having trouble connecting right now. Please try again in a moment.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const toggleOpen = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);

      // Show welcome message on first open
      if (messages.length === 0) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hello! I am LoopCommerce's support assistant. I can help you with order tracking, returns, shipping, and general questions. How can I help you today?",
          },
        ]);
      }
    }
  }, [isOpen, messages.length]);

  return (
    <>
      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-36 sm:bottom-24 right-4 sm:right-6 z-[60] flex flex-col overflow-hidden",
          "rounded-[16px] border border-border bg-surface",
          "shadow-[0_16px_48px_rgba(15,23,42,0.12)]",
          "transition-all duration-250 ease-out origin-bottom-right",
          "w-[min(400px,calc(100vw-48px))]",
          isOpen && !isMinimized
            ? "opacity-100 scale-100 pointer-events-auto h-[min(500px,calc(100dvh-160px))]"
            : isOpen && isMinimized
              ? "opacity-100 scale-100 pointer-events-auto h-14"
              : "opacity-0 scale-95 pointer-events-none h-0"
        )}
        role="dialog"
        aria-label="Customer support chat"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-accent/[0.04] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-accent/10">
              <Bot className="size-4 text-accent" strokeWidth={2} />
            </div>
            <div>
              <span className="font-display text-sm font-semibold text-foreground">
                LoopCommerce Support
              </span>
              <p className="font-body text-[11px] text-muted">
                Typically replies instantly
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized((prev) => !prev)}
              className="flex size-7 items-center justify-center rounded-[6px] text-muted transition-colors duration-150 hover:bg-default-100 hover:text-foreground"
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              <Minus className="size-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className="flex size-7 items-center justify-center rounded-[6px] text-muted transition-colors duration-150 hover:bg-default-100 hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 mt-0.5">
                      <Bot className="size-3.5 text-accent" strokeWidth={2} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-[10px] px-4 py-2.5",
                      msg.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-[var(--background-secondary,#F8FAFC)] text-foreground border border-border-light"
                    )}
                  >
                    <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block ml-0.5 w-1.5 h-4 bg-current animate-pulse rounded-sm" />
                      )}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading &&
                !messages.some((m) => m.isStreaming) && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 mt-0.5">
                      <Bot className="size-3.5 text-accent" strokeWidth={2} />
                    </div>
                    <div className="rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] border border-border-light px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer: Input + Branding */}
            <div className="shrink-0 border-t border-border">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 px-4 py-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  aria-label="Chat message input"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none font-body disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-[8px]",
                    "transition-all duration-150 ease-out",
                    input.trim() && !isLoading
                      ? "bg-accent text-accent-foreground hover:bg-[var(--accent-hover,#0F766E)]"
                      : "bg-default-100 text-muted cursor-not-allowed"
                  )}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" strokeWidth={2} />
                  )}
                </button>
              </form>

              {/* Powered by */}
              <div className="flex items-center justify-center pb-2.5 px-4">
                <span className="font-body text-[10px] text-muted">
                  Powered by LoopCommerce AI
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Bubble Button */}
      <button
        onClick={toggleOpen}
        className={cn(
          "fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[60] flex size-14 items-center justify-center",
          "rounded-full shadow-[0_4px_16px_rgba(13,148,136,0.3)]",
          "transition-all duration-250 ease-out",
          "hover:scale-105 hover:shadow-[0_8px_24px_rgba(13,148,136,0.35)]",
          "active:scale-95",
          isOpen
            ? "bg-foreground text-background"
            : "bg-accent text-accent-foreground"
        )}
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
      >
        {isOpen ? (
          <X className="size-6" strokeWidth={2} />
        ) : (
          <MessageCircle className="size-6" strokeWidth={2} />
        )}
      </button>
    </>
  );
}
