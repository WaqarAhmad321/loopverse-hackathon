"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, Button, Separator } from "@heroui/react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingBag,
  Tag,
  BarChart3,
  Settings,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarUser {
  full_name: string;
  avatar_url: string | null;
}

interface SellerSidebarProps {
  user: SidebarUser;
}

const navItems = [
  { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Inventory", href: "/seller/inventory", icon: Warehouse },
  { label: "Orders", href: "/seller/orders", icon: ShoppingBag },
  { label: "Promotions", href: "/seller/promotions", icon: Tag },
  { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
  { label: "Profile", href: "/seller/profile", icon: Settings },
  { label: "Chat", href: "/seller/chat", icon: MessageSquare },
] as const;

function NavContent({
  user,
  pathname,
  onItemClick,
}: {
  user: SidebarUser;
  pathname: string;
  onItemClick?: () => void;
}) {
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      {/* Logo + Portal Label */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/seller/dashboard" className="block" onClick={onItemClick}>
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-[var(--foreground)]">Loop</span>
            <span className="text-[var(--accent)]">Verse</span>
          </span>
        </Link>
        <span className="mt-1.5 block font-body text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Seller Portal
        </span>
      </div>

      <div className="px-5">
        <Separator />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/seller/dashboard" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-body text-sm font-medium transition-all duration-150 ease-out",
                    isActive
                      ? "bg-[color:var(--accent)]/8 text-[color:var(--accent)]"
                      : "text-[color:var(--muted)] hover:bg-[var(--default)] hover:text-[color:var(--foreground)]"
                  )}
                >
                  {/* Active indicator — teal left bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />
                  )}
                  <Icon className="size-5 shrink-0" strokeWidth={2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-5">
        <Separator />
      </div>

      {/* User section */}
      <div className="px-3 py-4">
        <Link
          href="/seller/profile"
          onClick={onItemClick}
          className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-[var(--default)]"
        >
          <Avatar className="size-9 shrink-0">
            {user.avatar_url ? (
              <Avatar.Image src={user.avatar_url} alt={user.full_name} />
            ) : null}
            <Avatar.Fallback className="bg-[color:var(--accent)]/10 font-body text-xs font-semibold text-[color:var(--accent)]">
              {initials}
            </Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-sm font-medium text-[color:var(--foreground)]">
              {user.full_name}
            </p>
            <p className="font-body text-xs text-[color:var(--muted)]">
              View profile
            </p>
          </div>
        </Link>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 font-body text-sm font-medium text-[color:var(--danger)] transition-colors duration-150 ease-out hover:bg-[color:var(--danger)]/8"
          >
            <LogOut className="size-5 shrink-0" strokeWidth={2} />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export function SellerSidebar({ user }: SellerSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, handleKeyDown]);

  return (
    <>
      {/* Desktop sidebar — fixed left, 240px (w-60) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[var(--border)] bg-[var(--surface)] lg:block">
        <NavContent user={user} pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" strokeWidth={2} />
        </Button>
        <Link href="/seller/dashboard">
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-[var(--foreground)]">Loop</span>
            <span className="text-[var(--accent)]">Verse</span>
          </span>
        </Link>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-250"
            onClick={() => setMobileOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close navigation menu"
          />
          {/* Drawer panel */}
          <aside
            className="absolute inset-y-0 left-0 w-[280px] bg-[var(--surface)] shadow-[var(--overlay-shadow)] animate-in slide-in-from-left duration-250"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Close button */}
            <div className="absolute right-3 top-5 z-10">
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="size-5" strokeWidth={2} />
              </Button>
            </div>
            <NavContent
              user={user}
              pathname={pathname}
              onItemClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
