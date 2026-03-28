"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Label,
  Separator,
} from "@heroui/react";
import { SmartSearch } from "@/components/ui/smart-search";
import {
  Search,
  ShoppingCart,
  Heart,
  Home,
  User,
  Package,
  LogOut,
  Sun,
  Moon,
  Store,
  LayoutDashboard,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  roles: string[];
}

interface BuyerNavbarProps {
  user: NavUser | null;
  cartCount: number;
}

export function BuyerNavbar({ user, cartCount }: BuyerNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  // Search is now handled by SmartSearch component

  const isSeller = user?.roles.includes("seller") ?? false;
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleDropdownAction = useCallback(
    (key: React.Key) => {
      switch (key) {
        case "dashboard":
          router.push("/dashboard");
          break;
        case "profile":
          router.push("/profile");
          break;
        case "orders":
          router.push("/orders");
          break;
        case "messages":
          router.push("/messages");
          break;
        case "seller-portal":
          router.push("/seller");
          break;
        case "logout":
          router.push("/api/auth/logout");
          break;
      }
    },
    [router]
  );

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <header
        className={cn(
          "sticky top-0 z-50 hidden md:block",
          "border-b border-default-200 dark:border-default-100",
          "bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-xl"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="mr-1 flex shrink-0 items-center gap-0 font-display text-xl font-bold tracking-tight transition-opacity duration-150 ease-out hover:opacity-80"
          >
            <span className="text-foreground">Loop</span>
            <span className="text-accent">Verse</span>
          </Link>

          {/* Search Bar — centered, takes available space */}
          <div className="flex-1 max-w-xl mx-auto">
            <SmartSearch
              placeholder="Search products, categories, sellers..."
              compact
            />
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            <Link href="/products">
              <Button
                variant="ghost"
                size="md"
                className={cn(
                  "font-body font-medium transition-colors duration-150 ease-out",
                  pathname === "/products" || pathname.startsWith("/products")
                    ? "text-accent"
                    : "text-foreground-500"
                )}
              >
                Products
              </Button>
            </Link>
            <Link href="/sellers">
              <Button
                variant="ghost"
                size="md"
                className={cn(
                  "font-body font-medium transition-colors duration-150 ease-out",
                  pathname.startsWith("/sellers")
                    ? "text-accent"
                    : "text-foreground-500"
                )}
              >
                Sellers
              </Button>
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {/* Wishlist */}
            <Link href="/wishlist">
              <Button
                variant="ghost"
                size="md"
                isIconOnly
                aria-label="Wishlist"
                className={cn(
                  "transition-colors duration-150 ease-out",
                  pathname.startsWith("/wishlist")
                    ? "text-accent"
                    : "text-foreground-500"
                )}
              >
                <Heart className="size-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              {cartCount > 0 ? (
                <Badge.Anchor>
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label={`Cart with ${cartCount} items`}
                    className={cn(
                      "transition-colors duration-150 ease-out",
                      pathname.startsWith("/cart")
                        ? "text-accent"
                        : "text-foreground-500"
                    )}
                  >
                    <ShoppingCart className="size-5" />
                  </Button>
                  <Badge color="danger" size="sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                </Badge.Anchor>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Cart"
                  className={cn(
                    "transition-colors duration-150 ease-out",
                    pathname.startsWith("/cart")
                      ? "text-accent"
                      : "text-foreground-500"
                  )}
                >
                  <ShoppingCart className="size-5" />
                </Button>
              )}
            </Link>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label="Toggle theme"
              onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-foreground-500 transition-colors duration-150 ease-out"
            >
              <Sun className="size-5 rotate-0 scale-100 transition-transform duration-150 ease-out dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-5 rotate-90 scale-0 transition-transform duration-150 ease-out dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu / Auth Buttons */}
            {user ? (
              <Dropdown>
                <Dropdown.Trigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/50 transition-opacity duration-150 ease-out hover:opacity-80 ml-1">
                  <Avatar size="sm">
                    {user.avatar_url ? (
                      <Avatar.Image src={user.avatar_url} alt={user.full_name} />
                    ) : null}
                    <Avatar.Fallback className="bg-accent/10 text-accent text-xs font-body font-semibold">
                      {initials || "U"}
                    </Avatar.Fallback>
                  </Avatar>
                </Dropdown.Trigger>
                <Dropdown.Popover className="min-w-[220px]">
                  <Dropdown.Menu onAction={handleDropdownAction}>
                    <Dropdown.Section>
                      <Dropdown.Item id="user-info" textValue={user.full_name}>
                        <div className="flex flex-col gap-0.5 py-1">
                          <span className="font-body font-semibold text-sm text-foreground">
                            {user.full_name}
                          </span>
                          <span className="font-body text-xs text-foreground-500">
                            Buyer Account
                          </span>
                        </div>
                      </Dropdown.Item>
                    </Dropdown.Section>
                    <Separator />
                    <Dropdown.Section>
                      <Dropdown.Item id="dashboard" textValue="Dashboard">
                        <LayoutDashboard className="size-4" />
                        <Label>Dashboard</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="profile" textValue="Profile">
                        <User className="size-4" />
                        <Label>Profile</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="orders" textValue="Orders">
                        <Package className="size-4" />
                        <Label>Orders</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="messages" textValue="Messages">
                        <MessageSquare className="size-4" />
                        <Label>Messages</Label>
                      </Dropdown.Item>
                    </Dropdown.Section>
                    {isSeller ? (
                      <>
                        <Separator />
                        <Dropdown.Section>
                          <Dropdown.Item id="seller-portal" textValue="Seller Portal">
                            <Store className="size-4" />
                            <Label>Seller Portal</Label>
                          </Dropdown.Item>
                        </Dropdown.Section>
                      </>
                    ) : null}
                    <Separator />
                    <Dropdown.Section>
                      <Dropdown.Item
                        id="logout"
                        textValue="Log out"
                        variant="danger"
                      >
                        <LogOut className="size-4" />
                        <Label>Log out</Label>
                      </Dropdown.Item>
                    </Dropdown.Section>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="md"
                    className="font-body font-medium text-foreground-500"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register/buyer">
                  <Button
                    size="sm"
                    className="font-body font-medium rounded-[10px] px-5 py-2.5"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "border-t border-default-200 dark:border-default-100",
          "bg-white/95 dark:bg-[#0B0F1A]/95 backdrop-blur-xl",
          "safe-area-inset-bottom"
        )}
      >
        <div className="flex h-16 items-center justify-around px-2">
          <MobileTabLink
            href="/"
            icon={Home}
            label="Home"
            active={pathname === "/"}
          />
          <MobileTabLink
            href="/products"
            icon={Search}
            label="Search"
            active={pathname.startsWith("/products")}
          />
          <MobileTabLink
            href="/cart"
            icon={ShoppingCart}
            label="Cart"
            active={pathname.startsWith("/cart")}
            badge={cartCount}
          />
          <MobileTabLink
            href="/wishlist"
            icon={Heart}
            label="Wishlist"
            active={pathname.startsWith("/wishlist")}
          />
          <MobileTabLink
            href={user ? "/dashboard" : "/login"}
            icon={User}
            label="Account"
            active={
              pathname.startsWith("/dashboard") ||
              pathname.startsWith("/profile")
            }
          />
        </div>
      </nav>
    </>
  );
}

/* ── Mobile Tab Link ── */

function MobileTabLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-1 font-body text-xs transition-colors duration-150 ease-out",
        active
          ? "text-accent"
          : "text-foreground-400 dark:text-foreground-500"
      )}
    >
      <div className="relative">
        <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
        {badge && badge > 0 ? (
          <span className="absolute -top-1.5 -right-2.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      <span className={cn("font-medium", active && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}
