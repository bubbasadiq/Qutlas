# Qutlas: Materials, Parts and Fabrication

Qutlas is a Next.js application for material discovery, priced catalogue sales, customer orders, and custom manufacturing enquiries in Nigeria.

## Current customer journeys

- **Material discovery:** steel, wood and granite pages with enquiry entry points.
- **Catalogue:** the information catalogue is separate from purchasable products. `/api/catalogue` returns only active, published variants with a current approved price and an active supplier cost.
- **Shop and cart:** select a verified variant, request its price from the server, and keep only variant IDs and quantities in browser storage. Prices are recalculated on restore, quantity change, and checkout.
- **Checkout:** signed-in customers submit an idempotent order request. The server rechecks pricing, fulfilment rules, and stock, then creates the unpaid order and reserves stock transactionally.
- **Customer accounts:** Supabase Auth sign-up/sign-in, customer profile storage, and order history.
- **Admin:** role-checked APIs and staff UI for catalogue, supplier costs, pricing rules, inventory, orders, customers, enquiries, Qutters Lab, fulfilment, content, promotions, and staff roles.
- **Payments:** optional Paystack initialization with a signature-verified webhook. An order remains unpaid unless the provider confirms it.
- **Qutters Lab:** host and participant forms persist submissions separately from commerce enquiries.
- **Project configurator:** submit a project brief and, when included, upload drawings or supporting files through signed Supabase Storage upload URLs.

## Important commercial boundaries

No prices, supplier costs, inventory, delivery charges, or lead times are seeded. The shop remains empty until catalogue records, an active supplier price, an approved pricing rule, inventory, and applicable fulfilment rules are configured. Never activate products or publish commercial values without verified Qutlas inputs.

Orders are created with `pending_payment` status; a browser return is not proof of payment. Payment confirmation comes only from the verified provider webhook. Refunds, payment reconciliation, reservation expiry automation, supplier notification, and production capacity planning still require operational setup.

## Database Setup

Commerce tables and security policies are defined in `supabase/migrations/202611010001_core_commerce.sql`. The migration has **not** been applied to the configured Supabase project. Apply it first to a local/isolated development database, validate it, and review it before any production rollout. The Supabase CLI was not available during implementation; no remote schema changes were made.

After applying the migration in development, create the initial super-admin role using a reviewed server-side process, then configure categories, products/variants, suppliers, supplier prices, approved pricing rules, inventory, and fulfilment rules through the admin tools. Do not use the legacy custom `public.users` table for authentication.

## Environment

The server-side enquiry routes require:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional payments require `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL`. Paystack support is currently limited to NGN. Without those values, order creation still works but payment initialization returns unavailable; no payment is simulated.

Never commit `.env` files or service-role/secret keys. Use a separate Supabase project for integration testing. Avoid test submissions against production data.

## Getting started

Install dependencies using the package manager represented by `pnpm-lock.yaml`:

```powershell
corepack pnpm install
corepack pnpm dev
```

Open `http://localhost:3000` unless another process is using that port.

## Validation

```powershell
corepack pnpm lint
corepack pnpm exec tsc --noEmit
corepack pnpm test
corepack pnpm build
```

## Main structure

- `app/page.tsx`: homepage
- `app/materials/`: material catalogue and material pages
- `app/shop/`: shop catalogue
- `app/checkout/`: cart review, authoritative order creation, and payment initialization
- `app/account/`: customer sign-in and order history
- `app/admin/`: staff dashboard and management UI
- `app/lib/pricing.ts`: fixed-point pricing calculation
- `app/lib/pricing-service.ts`: approved database cost/rule lookup
- `app/api/orders/route.ts`: authenticated order creation and stock validation
- `app/api/payments/paystack/route.ts`: verified payment webhook
- `supabase/migrations/`: commerce schema and RPCs
- `app/ProjectConfigurator.tsx`: project enquiry flow
- `app/api/enquiries/route.ts`: server-side enquiry creation and upload preparation
- `app/api/enquiries/[id]/complete/route.ts`: upload verification and completion
- `app/site-data.ts`: material, service, and catalogue content
- `app/storefront.css`: shared storefront styling
- `docs/`: workflow notes and benchmark research

## Remaining Setup and Gaps

Before production use: apply and test the migration on an isolated database; configure verified commercial data and the first staff role; set Paystack and site URL if payments are enabled; configure a scheduled process to release expired unpaid reservations; set up backups, file malware scanning and retention, notification delivery, and monitoring. Promotion/content records are stored, but are not yet applied to storefront rendering or price calculations. The migration and end-to-end flows have not been tested against a local Supabase stack because the CLI was unavailable.
