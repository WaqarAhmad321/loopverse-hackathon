# Loopverse E-Commerce Marketplace — Engineering Plan

## Mode: HOLD SCOPE (build everything in SPEC-doc.md)

## Architecture

```
app/
├── (buyer)/                    # Buyer-facing pages
│   ├── layout.tsx              # Buyer layout (navbar, footer)
│   ├── page.tsx                # Home / Landing page
│   ├── products/
│   │   ├── page.tsx            # Product listing with filters
│   │   └── [id]/page.tsx       # Product detail
│   ├── cart/page.tsx           # Shopping cart
│   ├── wishlist/page.tsx       # Wishlist
│   ├── checkout/page.tsx       # Checkout flow
│   ├── payment/page.tsx        # Payment screen
│   ├── order-confirmation/[id]/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx            # Buyer dashboard (orders)
│   │   ├── orders/[id]/page.tsx
│   │   └── returns/page.tsx
│   ├── chat/page.tsx           # Buyer-seller chat
│   ├── login/page.tsx
│   └── register/page.tsx
├── (seller)/seller/
│   ├── layout.tsx              # Seller sidebar layout
│   ├── page.tsx                # Seller dashboard
│   ├── products/
│   │   ├── page.tsx            # Product management
│   │   └── [id]/edit/page.tsx
│   ├── inventory/page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── promotions/page.tsx
│   ├── analytics/page.tsx
│   ├── profile/page.tsx
│   ├── chat/page.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
├── (admin)/admin/
│   ├── layout.tsx              # Admin sidebar layout
│   ├── page.tsx                # Admin dashboard
│   ├── users/page.tsx
│   ├── products/page.tsx       # Product moderation
│   ├── orders/page.tsx
│   ├── transactions/page.tsx
│   ├── analytics/page.tsx
│   └── login/page.tsx
├── layout.tsx                  # Root layout
└── globals.css

lib/
├── types.ts                    # Shared TypeScript types
├── mock-data.ts                # Mock data for all screens
└── utils.ts                    # Utility functions

components/
├── ui/                         # shadcn components
└── shared/                     # App-specific shared components
```

## Phases

### Phase 1: Foundation
- [x] Install shadcn/ui + dependencies
- [ ] Set up route groups and layouts
- [ ] Auth pages (login/register) for all 3 portals
- [ ] Mock data layer

### Phase 2: Buyer Portal (11 screens)
- [ ] Home / Landing page
- [ ] Product listing with filters/sort
- [ ] Product detail
- [ ] Cart
- [ ] Wishlist
- [ ] Checkout
- [ ] Payment
- [ ] Order confirmation
- [ ] Buyer dashboard + orders
- [ ] Login / Register

### Phase 3: Seller Portal (9 screens)
- [ ] Seller dashboard with charts
- [ ] Product management (CRUD + Excel bulk)
- [ ] Inventory management
- [ ] Order management
- [ ] Promotions & coupons
- [ ] Sales analytics
- [ ] Profile & settings
- [ ] Login / Register

### Phase 4: Admin Portal (7 screens)
- [ ] Admin dashboard
- [ ] User management
- [ ] Product moderation
- [ ] Order management
- [ ] Payment & transaction logs
- [ ] Platform analytics
- [ ] Login

### Phase 5: Chat Module (2 screens)
- [ ] Buyer-seller chat
- [ ] Seller chat management

## Tech Decisions
- All data is mock (no backend) — structured for easy API replacement
- shadcn/ui for all components
- Route groups for portal separation
- Server Components by default, "use client" only for interactivity
- Tailwind 4 with shadcn theme tokens
