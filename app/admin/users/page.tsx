import { Chip } from "@heroui/react";
import { Users, AlertCircle } from "lucide-react";
import { getAllUsers } from "@/actions/admin";
import type { UserRole } from "@/types/database";
import { UserActions } from "./user-actions";
import { UserToggleButton } from "./user-toggle-button";
import { UserDetailModal } from "./user-detail-modal";
import { UserDeleteButton } from "./user-delete-button";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRoleColor(
  role: UserRole
): "default" | "accent" | "success" | "warning" | "danger" {
  switch (role) {
    case "admin":
      return "danger";
    case "seller":
      return "accent";
    case "buyer":
      return "success";
    default:
      return "default";
  }
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? undefined;
  const roleFilter = (params.role as UserRole) ?? undefined;

  const result = await getAllUsers(page, search, roleFilter);

  if ("error" in result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--danger)]/10">
          <AlertCircle
            className="size-6 text-[var(--danger)]"
            strokeWidth={2}
          />
        </div>
        <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
          Failed to load users
        </p>
        <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          User Management
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Manage all platform users ({result.total} total)
        </p>
      </div>

      {/* Filters + pagination */}
      <UserActions
        currentSearch={search ?? ""}
        currentRole={roleFilter ?? ""}
        page={page}
        totalPages={result.totalPages}
      />

      {/* Users table */}
      <div className="overflow-hidden rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
        {result.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
              <Users
                className="size-6 text-[color:var(--muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
              No users found
            </p>
            <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
              {search
                ? `No results for "${search}"`
                : "No users on the platform yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Role(s)
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light,var(--separator))]">
                {result.users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors duration-150 hover:bg-[var(--default)]/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-[var(--accent)]/10 font-body text-xs font-medium text-[var(--accent)]">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-body text-sm font-medium text-[color:var(--foreground)]">
                          {user.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm text-[color:var(--muted)]">
                      {user.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="font-body text-sm text-[color:var(--muted)]">
                            None
                          </span>
                        ) : (
                          user.roles.map((role) => (
                            <Chip
                              key={role}
                              color={getRoleColor(role)}
                              variant="soft"
                              size="sm"
                            >
                              {role}
                            </Chip>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Chip
                        color={user.is_active ? "success" : "danger"}
                        variant="soft"
                        size="sm"
                      >
                        {user.is_active ? "Active" : "Blocked"}
                      </Chip>
                    </td>
                    <td className="px-5 py-3.5 font-body text-xs text-[color:var(--muted)]">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <UserDetailModal
                          userId={user.id}
                          userName={user.full_name}
                        />
                        <UserToggleButton
                          userId={user.id}
                          isActive={user.is_active}
                        />
                        <UserDeleteButton
                          userId={user.id}
                          userName={user.full_name}
                          isAdmin={user.roles.includes("admin")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
