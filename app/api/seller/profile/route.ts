import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { store_name, store_description, business_address, store_logo_url } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData: Record<string, unknown> = {};
    if (store_name !== undefined) updateData.store_name = store_name;
    if (store_description !== undefined) updateData.store_description = store_description;
    if (business_address !== undefined) updateData.business_address = business_address;
    if (store_logo_url !== undefined) updateData.store_logo_url = store_logo_url;

    const { error } = await supabase
      .from("seller_profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
