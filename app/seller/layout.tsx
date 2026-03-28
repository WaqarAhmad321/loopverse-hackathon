import { redirect } from "next/navigation";
import { getUserWithRoles } from "@/lib/supabase/server";
import { SellerSidebar } from "@/components/layouts/seller-sidebar";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithRoles();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("seller")) {
    redirect("/");
  }

  const sidebarUser = {
    full_name: user.profile?.full_name ?? user.email ?? "Seller",
    avatar_url: user.profile?.avatar_url ?? null,
  };

  return (
    <div className="min-h-screen bg-[var(--background-secondary,#F8FAFC)] dark:bg-[var(--background)]">
      <SellerSidebar user={sidebarUser} />
      <main className="lg:ml-60">
        <div className="mx-auto max-w-[1200px] px-6 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
