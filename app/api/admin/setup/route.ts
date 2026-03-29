import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_SETUP_SECRET =
  process.env.ADMIN_SETUP_SECRET ?? "loopcommerce-admin-2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, secret } = body as { email?: string; secret?: string };

    if (!email || !secret) {
      return NextResponse.json(
        { error: "Missing required fields: email and secret" },
        { status: 400 }
      );
    }

    if (secret !== ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { error: "Invalid setup secret" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (existingRole) {
      return NextResponse.json(
        {
          message: "User already has admin role",
          user: { id: user.id, email: user.email, full_name: user.full_name },
        },
        { status: 200 }
      );
    }

    // Add admin role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: "admin" });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to assign admin role: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Admin role assigned successfully",
        user: { id: user.id, email: user.email, full_name: user.full_name },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
