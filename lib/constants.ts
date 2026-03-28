export const SITE_NAME = "LoopVerse";
export const SITE_DESCRIPTION = "Multi-vendor marketplace for everyone";

export const ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
  ADMIN: "admin",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "warning",
  confirmed: "accent",
  packed: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
  returned: "danger",
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending Review",
  active: "Active",
  rejected: "Rejected",
};

export const PRODUCT_STATUS_COLORS: Record<string, string> = {
  draft: "default",
  pending: "warning",
  active: "success",
  rejected: "danger",
};

export const ITEMS_PER_PAGE = 20;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/login",
  "/register",
];

export const AUTH_ROUTES = ["/login", "/register"];

export const BUYER_ROUTES = /^\/(buyer)\//;
export const SELLER_ROUTES = /^\/(seller)\//;
export const ADMIN_ROUTES = /^\/(admin)\//;
