import { getUserWithRoles, createServerClient } from "@/lib/supabase/server";
import { BuyerNavbar } from "@/components/layouts/buyer-navbar";
import { Footer } from "@/components/layouts/footer";
import { ChatbotWidget } from "@/components/ui/chatbot-widget";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userWithRoles = await getUserWithRoles();
  const supabase = await createServerClient();

  let cartCount = 0;

  if (userWithRoles) {
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", userWithRoles.id);

    cartCount = count ?? 0;
  }

  const navUser = userWithRoles
    ? {
        id: userWithRoles.id,
        full_name: userWithRoles.profile?.full_name ?? "User",
        avatar_url: userWithRoles.profile?.avatar_url ?? null,
        roles: userWithRoles.roles,
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <BuyerNavbar user={navUser} cartCount={cartCount} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
