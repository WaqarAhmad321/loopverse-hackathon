import { redirect } from "next/navigation";
import { createServerClient, getUserWithRoles } from "@/lib/supabase/server";
import { User, Lock, Calendar } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";

export default async function ProfilePage() {
  const userWithRoles = await getUserWithRoles();
  if (!userWithRoles) redirect("/login");

  const profile = userWithRoles.profile;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
          My Profile
        </h1>
        <p className="mt-1.5 text-base text-[var(--text-secondary,#475569)] font-body">
          Manage your personal information and security
        </p>
      </div>

      {/* Avatar Section */}
      <div
        className="
          mb-6 flex items-center gap-5 rounded-[10px] border border-border
          bg-surface p-6 shadow-[var(--surface-shadow)]
        "
      >
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/[0.08]">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? "User"}
              className="size-full object-cover"
            />
          ) : (
            <span className="font-display text-xl font-bold text-accent">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          )}
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {profile?.full_name ?? "User"}
          </h2>
          <p className="text-sm text-muted font-body">
            {userWithRoles.email}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted font-body">
            <Calendar className="size-3" strokeWidth={2} />
            <span>
              Member since{" "}
              {new Date(
                profile?.created_at ?? userWithRoles.created_at ?? ""
              ).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div
        className="
          mb-6 rounded-[10px] border border-border
          bg-surface shadow-[var(--surface-shadow)]
        "
      >
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent/[0.08] text-accent">
            <User className="size-4" strokeWidth={2} />
          </div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Personal Information
          </h2>
        </div>
        <div className="p-6">
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            email={userWithRoles.email ?? ""}
            phone={profile?.phone ?? ""}
          />
        </div>
      </div>

      {/* Change Password */}
      <div
        className="
          rounded-[10px] border border-border
          bg-surface shadow-[var(--surface-shadow)]
        "
      >
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent/[0.08] text-accent">
            <Lock className="size-4" strokeWidth={2} />
          </div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Change Password
          </h2>
        </div>
        <div className="p-6">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
