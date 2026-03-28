"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, getUserWithRoles } from "@/lib/supabase/server";
import type { ProductStatus, UserRole } from "@/types/database";
import { ITEMS_PER_PAGE } from "@/lib/constants";

async function verifyAdmin() {
  const user = await getUserWithRoles();
  if (!user || !user.roles.includes("admin")) {
    return null;
  }
  return user;
}

export async function toggleUserStatus(userId: string) {
  const admin = await verifyAdmin();
  if (!admin) {
    return { error: "Unauthorized: admin access required" };
  }

  const supabase = await createServerClient();

  // Get current status
  const { data: targetUser, error: fetchError } = await supabase
    .from("users")
    .select("id, is_active")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) {
    return { error: "User not found" };
  }

  // Prevent admin from deactivating themselves
  if (userId === admin.id) {
    return { error: "Cannot deactivate your own account" };
  }

  const { error } = await supabase
    .from("users")
    .update({ is_active: !targetUser.is_active })
    .eq("id", userId);

  if (error) {
    return { error: "Failed to update user status" };
  }

  revalidatePath("/admin/users");
  return { success: true, is_active: !targetUser.is_active };
}

export async function updateProductStatus(
  productId: string,
  status: "active" | "rejected"
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return { error: "Unauthorized: admin access required" };
  }

  const validStatuses: ProductStatus[] = ["active", "rejected"];
  if (!validStatuses.includes(status)) {
    return { error: "Invalid product status" };
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", productId);

  if (error) {
    return { error: "Failed to update product status" };
  }

  revalidatePath("/admin/products");
  return { success: true };
}

interface GetAllUsersResult {
  users: {
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    avatar_url: string | null;
    roles: UserRole[];
  }[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getAllUsers(
  page: number = 1,
  search?: string,
  roleFilter?: UserRole
): Promise<GetAllUsersResult | { error: string }> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { error: "Unauthorized: admin access required" };
  }

  const supabase = await createServerClient();
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Build the query
  let query = supabase
    .from("users")
    .select("id, full_name, email, is_active, created_at, avatar_url", {
      count: "exact",
    });

  if (search) {
    // Strip PostgREST metacharacters to prevent filter injection
    const sanitized = search.replace(/[,.()"'\\]/g, "");
    if (sanitized.length > 0) {
      query = query.or(
        `full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`
      );
    }
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const { data: users, error, count } = await query;

  if (error) {
    return { error: "Failed to fetch users" };
  }

  // Fetch roles for all returned users
  const userIds = (users ?? []).map((u) => u.id);
  const { data: roleRecords } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const roleMap = new Map<string, UserRole[]>();
  for (const r of roleRecords ?? []) {
    const existing = roleMap.get(r.user_id) ?? [];
    existing.push(r.role as UserRole);
    roleMap.set(r.user_id, existing);
  }

  let usersWithRoles = (users ?? []).map((u) => ({
    ...u,
    roles: roleMap.get(u.id) ?? [],
  }));

  // Client-side role filtering (since roles are in a separate table)
  if (roleFilter) {
    usersWithRoles = usersWithRoles.filter((u) =>
      u.roles.includes(roleFilter)
    );
  }

  const total = roleFilter ? usersWithRoles.length : (count ?? 0);

  return {
    users: usersWithRoles,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  };
}

interface PlatformStats {
  totalBuyers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingProducts: number;
  recentOrders: {
    id: string;
    buyer_name: string;
    total: number;
    status: string;
    created_at: string;
  }[];
}

export async function getPlatformStats(): Promise<
  PlatformStats | { error: string }
> {
  const admin = await verifyAdmin();
  if (!admin) {
    return { error: "Unauthorized: admin access required" };
  }

  const supabase = await createServerClient();

  // Count buyers
  const { count: buyerCount } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "buyer");

  // Count sellers
  const { count: sellerCount } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "seller");

  // Count orders
  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  // Total revenue (sum of completed orders)
  const { data: revenueData } = await supabase
    .from("orders")
    .select("total")
    .in("status", ["confirmed", "packed", "shipped", "delivered"]);

  const totalRevenue = (revenueData ?? []).reduce(
    (sum, o) => sum + (o.total ?? 0),
    0
  );

  // Pending products count
  const { count: pendingProducts } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // Recent orders with buyer name
  const { data: recentOrdersRaw } = await supabase
    .from("orders")
    .select("id, buyer_id, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch buyer names
  const buyerIds = [
    ...new Set((recentOrdersRaw ?? []).map((o) => o.buyer_id)),
  ];
  const { data: buyers } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", buyerIds.length > 0 ? buyerIds : ["__none__"]);

  const buyerNameMap = new Map<string, string>();
  for (const b of buyers ?? []) {
    buyerNameMap.set(b.id, b.full_name);
  }

  const recentOrders = (recentOrdersRaw ?? []).map((o) => ({
    id: o.id,
    buyer_name: buyerNameMap.get(o.buyer_id) ?? "Unknown",
    total: o.total,
    status: o.status,
    created_at: o.created_at,
  }));

  return {
    totalBuyers: buyerCount ?? 0,
    totalSellers: sellerCount ?? 0,
    totalOrders: orderCount ?? 0,
    totalRevenue,
    pendingProducts: pendingProducts ?? 0,
    recentOrders,
  };
}
