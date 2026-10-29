# Qutlas: Materials, Parts and Fabrication

Qutlas is a Next.js application for material discovery, catalogue-led order requests, and custom manufacturing enquiries in Nigeria.

## Current customer journeys

- **Material discovery:** steel, wood and granite pages with enquiry entry points.
- **Catalogue:** searchable material and component entries with specification fields.
- **Shop selection:** add catalogue entries to a browser-persisted cart and adjust quantities.
- **Order request:** submit contact and delivery details to the server-side enquiry API. The API requires an idempotency key and persists requests to Supabase.
- **Project configurator:** submit a project brief and, when included, upload drawings or supporting files through signed Supabase Storage upload URLs.

## Important commercial boundaries

The catalogue is enquiry-led. Items marked `to-confirm` do not have verified prices or guaranteed availability. Qutlas must confirm specification, stock, pricing, lead time and delivery before a quotation or order is accepted.

Checkout currently submits an **order request**, not a paid order. Payment processing, stock reservation, fulfilment tracking and customer-facing order status are not implemented. Do not represent an order request as payment or purchase confirmation.

## Environment

The server-side enquiry routes require:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

The browser project configurator may also require the public Supabase URL and publishable key, as defined by its current implementation and `.env.example`.

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
corepack pnpm build
```

## Main structure

- `app/page.tsx`: homepage
- `app/materials/`: material catalogue and material pages
- `app/shop/`: shop catalogue
- `app/checkout/`: cart review and order-request submission
- `app/ProjectConfigurator.tsx`: project enquiry flow
- `app/api/enquiries/route.ts`: server-side enquiry creation and upload preparation
- `app/api/enquiries/[id]/complete/route.ts`: upload verification and completion
- `app/site-data.ts`: material, service, and catalogue content
- `app/storefront.css`: shared storefront styling
- `docs/`: workflow notes and benchmark research

## Commercial and operational gaps

Before treating this as a production commerce system, implement and test staff enquiry review, quotation creation and approval, stock/availability confirmation, notifications, role-protected administration, payment integration, fulfilment statuses, retention policies, and operational monitoring.
