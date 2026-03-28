import { createServerClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import type { SellerProfile } from "@/types/database";
import { ProfileForm } from "./profile-form";

export default async function SellerProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("seller_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const sellerProfile = profile as SellerProfile | null;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">
          Store Profile
        </h1>
        <p className="mt-1 font-body text-sm text-[color:var(--muted)]">
          Manage your store details and settings
        </p>
      </div>

      {sellerProfile ? (
        <ProfileForm
          profile={{
            store_name: sellerProfile.store_name,
            store_description: sellerProfile.store_description ?? "",
            business_address: sellerProfile.business_address,
            store_logo_url: sellerProfile.store_logo_url,
          }}
          userId={user.id}
        />
      ) : (
        <div className="rounded-[10px] bg-[var(--surface)] shadow-[var(--surface-shadow)]">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[10px] bg-[var(--default)]">
              <Settings
                className="size-6 text-[color:var(--muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="font-body text-sm font-medium text-[color:var(--foreground)]">
              No seller profile found
            </p>
            <p className="mt-1 max-w-[280px] font-body text-xs text-[color:var(--muted)]">
              Please contact support to set up your seller profile
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
