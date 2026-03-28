import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { BadgeCheck, MapPin, Store } from "lucide-react";

export default async function SellersPage() {
  const supabase = await createServerClient();

  const { data: sellers } = await supabase
    .from("seller_profiles")
    .select("*, users!inner(full_name, avatar_url)")
    .eq("is_verified", false)
    .order("created_at", { ascending: false });

  // Also get unverified sellers (all sellers for now)
  const { data: allSellers } = await supabase
    .from("seller_profiles")
    .select("*, users!inner(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  const sellerList = allSellers ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Our Sellers
        </h1>
        <p className="mt-2 font-body text-base text-[var(--text-secondary,#475569)]">
          Browse verified sellers and discover their unique products
        </p>
      </div>

      {sellerList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--default)] mb-4">
            <Store className="size-7 text-[var(--muted)]" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            No sellers yet
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)] font-body">
            Be the first to open a store on LoopVerse
          </p>
          <Link
            href="/register/seller"
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover,#0F766E)]"
          >
            Start Selling
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sellerList.map((seller) => {
            const user = seller.users as { full_name: string; avatar_url: string | null };
            const initials = user.full_name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "S";

            return (
              <Link
                key={seller.id}
                href={`/sellers/${seller.user_id}`}
                className="group rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--surface-shadow)] transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] hover:border-accent/30"
              >
                <div className="flex items-start gap-4">
                  {seller.store_logo_url ? (
                    <img
                      src={seller.store_logo_url}
                      alt={seller.store_name}
                      className="size-14 rounded-[10px] object-cover"
                    />
                  ) : (
                    <div className="flex size-14 items-center justify-center rounded-[10px] bg-accent/[0.08] text-accent font-display font-bold text-lg">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-foreground truncate">
                        {seller.store_name}
                      </h3>
                      {seller.is_verified && (
                        <BadgeCheck className="size-4 text-accent shrink-0" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--muted)] font-body">
                      by {user.full_name}
                    </p>
                  </div>
                </div>

                {seller.store_description && (
                  <p className="mt-3 text-sm text-[var(--text-secondary,#475569)] font-body line-clamp-2 leading-relaxed">
                    {seller.store_description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted)] font-body">
                  <MapPin className="size-3.5" />
                  <span className="truncate">{seller.business_address}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
