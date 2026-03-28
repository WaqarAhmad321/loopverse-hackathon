import { redirect } from "next/navigation";
import { createServerClient, getUser } from "@/lib/supabase/server";
import { Chip } from "@heroui/react";
import {
  Bell,
  Package,
  ShoppingBag,
  MessageSquare,
  Tag,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Notification } from "@/types/database";
import { MarkAsReadButton } from "./mark-as-read-button";

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  order: ShoppingBag,
  shipping: Package,
  message: MessageSquare,
  promotion: Tag,
  alert: AlertCircle,
  success: CheckCircle,
};

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createServerClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (notifications ?? []) as Notification[];
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10 lg:px-8">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Chip size="sm" color="accent" variant="soft">
                {unreadCount} new
              </Chip>
            )}
          </div>
          <p className="mt-1.5 text-base text-[var(--text-secondary,#475569)] font-body">
            Stay updated on your orders and messages
          </p>
        </div>
        {unreadCount > 0 && (
          <MarkAsReadButton userId={user.id} mode="all" />
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed border-border py-20">
          <Bell className="size-12 text-muted" strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              No notifications
            </p>
            <p className="mt-1 text-sm text-muted font-body">
              You&apos;re all caught up. We&apos;ll notify you when
              something important happens.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((notification) => {
            const IconComponent =
              NOTIFICATION_ICONS[notification.type] ?? Bell;

            return (
              <div
                key={notification.id}
                className={`
                  rounded-[10px] border bg-surface p-4 transition-all duration-150
                  ${
                    notification.is_read
                      ? "border-border opacity-70"
                      : "border-accent/20 shadow-[var(--surface-shadow)]"
                  }
                `}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      notification.is_read
                        ? "bg-[var(--background-secondary,#F8FAFC)] text-muted"
                        : "bg-accent/[0.08] text-accent"
                    }`}
                  >
                    <IconComponent className="size-4" strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-sm leading-snug font-body ${
                            notification.is_read
                              ? "font-normal text-foreground"
                              : "font-semibold text-foreground"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted font-body">
                          {notification.message}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted font-body">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>

                    {!notification.is_read && (
                      <div className="mt-2.5">
                        <MarkAsReadButton
                          notificationId={notification.id}
                          mode="single"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
