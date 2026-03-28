export type UserRole = "buyer" | "seller" | "admin";

export type ProductStatus = "draft" | "pending" | "active" | "rejected";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type FulfillmentStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type DiscountType = "percentage" | "flat";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  business_address: string;
  stripe_connect_account_id: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  sku: string;
  stock_quantity: number;
  images: string[];
  status: ProductStatus;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  sku: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  shipping_address: ShippingAddress;
  delivery_method: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  coupon_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  seller_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  fulfillment_status: FulfillmentStatus;
  tracking_id: string | null;
}

export interface Coupon {
  id: string;
  seller_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_count: number;
  max_usage: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  buyer_id: string;
  product_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  buyer_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  order_id: string | null;
  is_resolved: boolean;
  last_message_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  status: PaymentStatus;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReturnRequest {
  id: string;
  order_item_id: string;
  buyer_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ProductWithSeller extends Product {
  seller: Pick<User, "id" | "full_name">;
  seller_profile: Pick<SellerProfile, "store_name" | "store_logo_url">;
  category: Pick<Category, "name" | "slug">;
  variants?: ProductVariant[];
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    product: Pick<Product, "id" | "name" | "slug" | "images">;
  })[];
}

export interface ConversationWithParticipants extends ChatConversation {
  buyer: Pick<User, "id" | "full_name" | "avatar_url">;
  seller: Pick<User, "id" | "full_name" | "avatar_url">;
  seller_profile: Pick<SellerProfile, "store_name" | "store_logo_url">;
}
