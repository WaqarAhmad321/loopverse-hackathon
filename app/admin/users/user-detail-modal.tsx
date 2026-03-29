"use client";

import { useState, useTransition } from "react";
import { Button } from "@heroui/react";
import {
  Eye,
  X,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  Shield,
} from "lucide-react";
import { getUserDetail } from "@/actions/admin";
import type { UserDetail } from "@/actions/admin";
import type { UserRole } from "@/types/database";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getRoleBadgeClass(role: UserRole): string {
  switch (role) {
    case "admin":
      return "bg-[var(--danger)]/10 text-[var(--danger)]";
    case "seller":
      return "bg-[var(--accent)]/10 text-[var(--accent)]";
    case "buyer":
      return "bg-[var(--success)]/10 text-[var(--success)]";
    default:
      return "bg-[var(--default)] text-[color:var(--muted)]";
  }
}

interface UserDetailModalProps {
  userId: string;
  userName: string;
}

export function UserDetailModal({ userId, userName }: UserDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
    startTransition(async () => {
      const result = await getUserDetail(userId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setUserDetail(result);
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setUserDetail(null);
    setError(null);
  };

  return (
    <>
      <Button variant="outline" size="sm" onPress={handleOpen}>
        <Eye className="size-3.5" strokeWidth={2} />
        View
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-[16px] bg-[var(--surface)] p-6 shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[color:var(--foreground)]">
                User Details
              </h2>
              <button
                onClick={handleClose}
                className="flex size-8 items-center justify-center rounded-full text-[color:var(--muted)] transition-colors hover:bg-[var(--default)] hover:text-[color:var(--foreground)]"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            {isPending && (
              <div className="flex items-center justify-center py-12">
                <div className="size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
              </div>
            )}

            {error && (
              <div className="rounded-[10px] bg-[var(--danger)]/10 p-4">
                <p className="font-body text-sm text-[var(--danger)]">
                  {error}
                </p>
              </div>
            )}

            {userDetail && !isPending && (
              <div className="space-y-5">
                {/* User identity */}
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-[var(--accent)]/10 font-display text-xl font-bold text-[var(--accent)]">
                    {userDetail.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-[color:var(--foreground)]">
                      {userDetail.full_name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {userDetail.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${getRoleBadgeClass(role)}`}
                        >
                          {role}
                        </span>
                      ))}
                      {userDetail.roles.length === 0 && (
                        <span className="font-body text-xs text-[color:var(--muted)]">
                          No roles
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-3 rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-[color:var(--muted)]" strokeWidth={2} />
                    <span className="font-body text-sm text-[color:var(--foreground)]">
                      {userDetail.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-[color:var(--muted)]" strokeWidth={2} />
                    <span className="font-body text-sm text-[color:var(--foreground)]">
                      {userDetail.phone ?? "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-[color:var(--muted)]" strokeWidth={2} />
                    <span className="font-body text-sm text-[color:var(--foreground)]">
                      Joined {formatDate(userDetail.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="size-4 text-[color:var(--muted)]" strokeWidth={2} />
                    <span
                      className={`font-body text-sm font-medium ${
                        userDetail.is_active
                          ? "text-[var(--success)]"
                          : "text-[var(--danger)]"
                      }`}
                    >
                      {userDetail.is_active ? "Active" : "Blocked"}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] p-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag
                        className="size-4 text-[var(--accent)]"
                        strokeWidth={2}
                      />
                      <span className="font-body text-xs text-[color:var(--muted)]">
                        Orders
                      </span>
                    </div>
                    <p className="mt-1 font-display text-xl font-bold text-[color:var(--foreground)]">
                      {userDetail.order_count}
                    </p>
                  </div>
                  <div className="rounded-[10px] bg-[var(--background-secondary,#F8FAFC)] p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign
                        className="size-4 text-[var(--accent)]"
                        strokeWidth={2}
                      />
                      <span className="font-body text-xs text-[color:var(--muted)]">
                        Total Spent
                      </span>
                    </div>
                    <p className="mt-1 font-display text-xl font-bold text-[color:var(--foreground)]">
                      {formatCurrency(userDetail.total_spent)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
