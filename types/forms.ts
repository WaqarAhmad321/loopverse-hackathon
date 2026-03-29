import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const buyerRegisterSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const sellerRegisterSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone must be at least 10 digits").optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
    store_name: z.string().min(2, "Store name is required"),
    business_address: z.string().min(5, "Business address is required"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category_id: z.string().uuid("Select a category"),
  price: z.coerce.number().positive("Price must be positive"),
  discount_price: z.coerce.number().positive().optional().nullable(),
  sku: z.string().min(1, "SKU is required"),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
});

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .toUpperCase(),
  discount_type: z.enum(["percentage", "flat"]),
  discount_value: z.coerce.number().positive("Discount value must be positive"),
  min_order_amount: z.coerce.number().min(0).optional().nullable(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  max_usage: z.coerce.number().int().positive().optional().nullable(),
});

export const addressSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip_code: z.string().min(3, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().min(10, "Phone is required"),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
});

export const sellerProfileSchema = z.object({
  store_name: z.string().min(2, "Store name is required"),
  store_description: z.string().optional(),
  business_address: z.string().min(5, "Address is required"),
});

export const returnRequestSchema = z.object({
  reason: z.string().min(10, "Please provide a detailed reason"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type BuyerRegisterFormData = z.infer<typeof buyerRegisterSchema>;
export type SellerRegisterFormData = z.infer<typeof sellerRegisterSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type CouponFormData = z.infer<typeof couponSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SellerProfileFormData = z.infer<typeof sellerProfileSchema>;
export type ReturnRequestFormData = z.infer<typeof returnRequestSchema>;
