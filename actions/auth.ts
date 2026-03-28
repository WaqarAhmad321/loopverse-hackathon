"use server";

import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginSchema, buyerRegisterSchema, sellerRegisterSchema } from "@/types/forms";

export type AuthResult = {
  error?: string;
  success?: boolean;
};

export async function loginAction(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user roles to redirect appropriately
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Login failed" };

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const userRoles = roles?.map((r) => r.role) ?? [];

  if (userRoles.includes("admin")) {
    redirect("/admin/dashboard");
  } else if (userRoles.includes("seller")) {
    redirect("/seller/dashboard");
  } else {
    redirect("/");
  }
}

export async function registerBuyerAction(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    password: formData.get("password") as string,
    confirm_password: formData.get("confirm_password") as string,
  };

  const parsed = buyerRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Update phone if provided
    if (parsed.data.phone) {
      await supabase
        .from("users")
        .update({ phone: parsed.data.phone })
        .eq("id", authData.user.id);
    }

    // Assign buyer role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authData.user.id,
      role: "buyer",
    });

    if (roleError) {
      return { error: "Failed to assign role. Please contact support." };
    }
  }

  redirect("/");
}

export async function registerSellerAction(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirm_password: formData.get("confirm_password") as string,
    store_name: formData.get("store_name") as string,
    business_address: formData.get("business_address") as string,
  };

  const parsed = sellerRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Update phone
    await supabase
      .from("users")
      .update({ phone: parsed.data.phone })
      .eq("id", authData.user.id);

    // Assign seller + buyer roles
    const { error: roleError } = await supabase.from("user_roles").insert([
      { user_id: authData.user.id, role: "seller" },
      { user_id: authData.user.id, role: "buyer" },
    ]);

    if (roleError) {
      return { error: "Failed to assign roles. Please contact support." };
    }

    // Create seller profile
    await supabase.from("seller_profiles").insert({
      user_id: authData.user.id,
      store_name: parsed.data.store_name,
      business_address: parsed.data.business_address,
    });
  }

  redirect("/seller/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfileAction(formData: FormData): Promise<AuthResult> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  if (!full_name || full_name.length < 2) {
    return { error: "Name must be at least 2 characters" };
  }

  const { error } = await supabase
    .from("users")
    .update({ full_name, phone: phone || null })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
