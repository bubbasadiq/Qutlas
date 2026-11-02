# Qutlas Platform Audit

**Audit date:** 2026-11-01  
**Primary checkout:** `C:\Users\bubba\Projects\qutlas`  
**Baseline:** `95b740a6d0d1ce6d9920aab5e95e4a125205bfbe` (`new fixx`, 2026-10-29)  
**Scope:** Initial source/build/Supabase metadata review, followed by local implementation. No production database changes or customer submissions were made.

## Executive Summary

The primary checkout now contains both enquiry and commerce workflows in source. The commerce path is implemented locally but cannot operate against the configured live database until its migration is tested and applied. No commercial values have been fabricated; without verified catalogue, supplier, inventory, and fulfilment records, the shop intentionally returns no purchasable products.

Implemented in this turn: fixed-point pricing and tests; database-backed priced catalogue and cart APIs; authenticated checkout with atomic order snapshots and stock reservation; optional Paystack initialization plus signature-verified payment confirmation; customer accounts/order history; role-protected admin APIs/UI for core operations; inventory movement/history; persistent Qutters Lab submissions; flat-config lint; and corrected customer-facing purchasing copy.

Not complete or not end-to-end verified: migration application/local PostgreSQL validation; verified commercial records and first staff roles; payment credentials/provider testing; reservation-expiry automation, refunds/reconciliation, notification delivery, media upload, file malware/retention, promotion/content integration, and responsive browser tests. The configured Supabase project remains unchanged.

There are two local roots at different commits. The explicitly identified Projects checkout is the audit target; it has user-owned uncommitted changes. The Desktop checkout is clean at `aea952dbbc19abf032ef2686750450088bebf44d` (`Merge pull request #4 from bubbasadiq/v0/catalogue-reconciliation`, 2026-10-26). Do not combine changes from the two roots without an explicit checkout decision.

## What Exists Now

- **Application:** Next.js 16 App Router, React 19, TypeScript, and 35 generated/static routes in the latest production build.
- **Storefront:** Informational pages remain available; `/shop` now fetches only active published variants with current approved pricing. The four original static catalogue entries remain informational and unpriced.
- **Pricing/cart:** [app/lib/pricing.ts](../app/lib/pricing.ts) calculates with integer minor units and fixed-point quantities. Cart storage keeps variant IDs and quantities only; restore/add/change operations call server pricing.
- **Checkout/orders:** `/api/orders` authenticates customers, reprices, validates configured fulfilment and stock, then calls a transactional order/reservation RPC. Orders begin `pending_payment` and store immutable cost/price snapshots. Customer history is served through a user-scoped API.
- **Payments:** optional Paystack initialization and HMAC-verified `charge.success` webhook. The browser return never marks an order paid. Provider credentials and real transaction tests are not available in this environment.
- **Enquiries/files:** existing Supabase-backed enquiry flow and private signed-upload bucket remain. Project-help enquiries are separate from orders.
- **Qutters Lab:** host/participant submissions persist through `/api/qutters-lab`; support staff can review/status them through the admin API.
- **Database:** live project still has the original six public tables and zero rows. The additive schema, RLS/grants, order, inventory, payment and dashboard RPCs are checked in at [supabase/migrations/202611010001_core_commerce.sql](../supabase/migrations/202611010001_core_commerce.sql), but have not been applied or validated against local PostgreSQL.
- **Administration:** `/admin` plus role-checked APIs manage core catalogue, supplier cost, pricing, stock, order, customer, enquiry, Lab, fulfilment, staff, and audit records. Product media, bulk actions, full reporting, and promotion/content storefront integration remain incomplete.
- **Dependencies:** `@supabase/supabase-js` and Next/React are used. `three` is declared but not imported by the active TypeScript application; the separate root-level [qutlas_v4.html](../qutlas_v4.html) loads Three.js directly from a CDN. Confirm whether that prototype is still required before removing the package.

## Baseline Issue Register

These issues were confirmed before implementation. The current implementation and remaining blockers are summarized above and in the latest validation section below.

### High

1. **[Partially resolved during audit] No immediately priced, purchasable catalogue.** Evidence: all four products in [site-data.ts](../app/site-data.ts) have `status: 'to-confirm'` and no `price`. The prior card action said “Price on request” while allowing Add to cart. Correction completed: [ShopCart.tsx](../app/ShopCart.tsx) now labels price as unverified, removes the purchase action, and rejects unpriced items during add and local-cart restoration. The central server-side pricing service, verified selling prices, pricing admin, and order system remain absent. **Dependency:** verified supplier costs, valid units/conversions, margin, production rates, availability, and any tax/delivery rules. **Verify:** add tests for each unit/configuration and assert unpriced/unapproved products cannot be published or ordered; current production build passes.

2. **Checkout is an enquiry submission, not an order.** Evidence: [checkout/page.tsx](../app/checkout/page.tsx) sends `pricing: 'to_be_confirmed'` and `payment: 'not_collected'`; the API writes to `enquiries`. The cart total is calculated in the browser and becomes `null` for the current unpriced products. Root cause: no authoritative server cart/pricing/order service. Consequence: no order snapshot, payment state, reservation, transactional order creation, or customer order history. Correction: introduce server-authoritative repricing, persistent order and line-item snapshots, a payment abstraction that never self-confirms payment, and explicit order status transitions. **Dependency:** product/pricing model and selected payment/delivery policies. **Verify:** tamper-resistant price tests, transactional order tests, preserved price snapshots, and verified payment-webhook tests before claiming payments work.

3. **No operational management system or catalogue backend.** Evidence: no admin route or product/supplier/inventory/customer management modules; catalogue and categories are compiled into [site-data.ts](../app/site-data.ts). Legacy `orders` and `users` tables do not connect to the app. Root cause: storefront data and operational records have no shared management service. Consequence: routine product, cost, availability, order, and enquiry management requires source/DB changes and staff have no workflow. Correction: define a persistent relational model and backend-enforced staff roles before building connected admin modules. Prefer Supabase Auth for identity; do not adopt the existing custom password table without a separate security review. **Dependency:** phase-2 schema and permission design. **Verify:** role-denial tests at API/service boundaries and an end-to-end staff-to-customer workflow.

4. **Database privilege and RLS posture needs remediation before customer/admin expansion.** Evidence: Supabase security advisors report GraphQL discoverability and `SELECT` grants for `orders`, `profiles`, `user_profiles`, and `users`; five RLS-enabled tables have no policies. `users` contains a `password_hash` column. The live `profiles` table has self-row policies. RLS with no policies currently denies ordinary row access, so the advisor result is not proof that data is presently readable; however, public grants/schema exposure and sensitive legacy structures create a high-impact misconfiguration risk. The advisor also reports leaked-password protection disabled. Correction: review grants, exposed schemas, RLS policy intent, and Auth settings; minimize public privileges and keep supplier/customer/admin data server-only. **Dependency:** confirm intended table ownership/auth model; do not patch production permissions without a reviewed migration and backup plan. **Verify:** anonymous and authenticated negative access tests, owner/staff policy tests, and a fresh Supabase security-advisor run.

### Medium

5. **New enquiries have no connected staff notification or review queue.** Evidence: the API inserts `notification_status: 'pending'`; `qutlas_notification_jobs` exists remotely, but no app worker, mail provider, staff screen, or enqueue path is present. README and [manufacturing-workflow.md](manufacturing-workflow.md) acknowledge missing notifications/admin review. Root cause: persistence was implemented without the receiving operational workflow. Consequence: enquiries may be stored without staff being alerted or able to process them through the app. Correction: create a monitored, retryable notification and staff queue with ownership/status/history. **Dependency:** verified recipient, provider, data-retention and support procedures. **Verify:** submission-to-notification delivery, retry/dead-letter and staff status-change tests.

6. **Qutters Lab forms are inert by design.** Evidence: [LabInterestForms.tsx](../app/qutters-lab/LabInterestForms.tsx) prevents submission and displays “Preview only”; the page says submissions are previews. No backend table or admin review flow exists. Correction: create a separate submission model/API and staff workflow; do not route these into ecommerce enquiries. **Dependency:** required fields, recipient/owner, retention, and response process. **Verify:** valid/invalid submissions persist and staff can review/update them.

7. **[Resolved during audit] Customer instructions contradicted the current request/file flow.** Evidence: [faqs/page.tsx](../app/faqs/page.tsx), [how-it-works/page.tsx](../app/how-it-works/page.tsx), [drawings-and-files/page.tsx](../app/resources/drawings-and-files/page.tsx), and [manufacturing-workflow.md](manufacturing-workflow.md) described email drafts or no upload. The current configurator persists enquiries and uploads supported files through signed URLs. Correction: those four documents now describe the saved enquiry/reference and private upload flow, and explicitly avoid implying an order or payment. **Verify:** a focused search for the stale email-draft/no-upload claims returned no matches in `app/`.

8. **Contact destinations are unverified and configuration is stale.** Evidence: `.env.example` still defines `NEXT_PUBLIC_QUOTE_EMAIL=support@qutlas.com`, but the active source does not use it; the footer and business page default to `hello@qutlas.com`. The old `support@` FAQ reference was removed during this audit. No verified phone or social contacts were found in the inspected source. Correction: Qutlas must confirm inbox ownership, then use one centrally configured address and remove unused examples. **Dependency:** business confirmation. **Verify:** resolve each rendered `mailto:` destination and confirm receipt with the owner.

9. **Public enquiry endpoint has no visible abuse control.** Evidence: `/api/enquiries` is unauthenticated and accepts arbitrary valid idempotency UUIDs; source search found no rate limiting or CAPTCHA. Request size and fields are bounded, and file uploads use signed URLs, which are useful controls but do not limit repeated submissions. Correction: add provider/platform-appropriate rate limits and abuse monitoring before public production use. **Dependency:** hosting/runtime and acceptable customer friction. **Verify:** request-burst tests and observable throttling without breaking legitimate retries.

10. **[Partially resolved] Styling overrides caused visual regressions.** The late universal Rubik reset, hidden eyebrow labels, dark-teal `#152b3b` token, and mobile hero min-width override have been removed/corrected. The hero is now light, its display font is restored, mobile headings use stable sizes and zero negative letter spacing, and card radius is 8px. The materials catalogue also stacks its code/spec columns on mobile. **Remaining:** the global stylesheet still contains duplicate selector layers that should be consolidated in a careful follow-up. Homepage, materials, shop, checkout, account, admin, Qutters Lab, and project routes have been checked at 390px with no horizontal overflow.

11. **[Partially resolved] Quality gates.** ESLint 9 now runs with Next's native flat preset; pricing, Paystack signature, and role-permission tests are present. **Remaining:** order/API/database integration tests, migration checks, broader cart/configuration coverage, and CI integration.

### Low

12. **Potential dead prototype/dependency and duplicate checkout ambiguity.** Evidence: `three` is unused by app source but is loaded by [qutlas_v4.html](../qutlas_v4.html), which is not an App Router route or under `public/`; a clean second checkout exists at a different commit. Correction: designate the canonical root, classify the standalone HTML as archive or supported deliverable, then remove unused dependency/artifacts only with owner approval. **Verify:** repository-wide source import search and route/static-asset check after the decision.

13. **[Partially resolved] Catalogue discovery is shallow.** Shop mode now uses persisted products and priced variants with category/search filtering, structured specifications, and quantity controls. **Remaining:** price/availability attribute filters, sorting/pagination, product detail routes, and verified product imagery/media management.

14. **Legal, delivery and privacy content is incomplete.** Evidence: the footer has no terms, privacy, returns, or delivery-policy links; the project captures contact/location data and accepts technical files, while the repo documents no retention schedule, malware scan, or operational monitoring. Correction: obtain approved policies and implement retention/file safety controls before promoting the upload form broadly. **Dependency:** Qutlas legal/operations decisions. **Verify:** policy review, upload-security tests, retention-job test, and access review.

## Database Snapshot

Read-only inspection of Supabase project `Qutlas` (`lzgfbipfclzeiscgjfsy`) found:

- Six public tables; all reported zero rows at audit time.
- `enquiries` has structured contact/specification fields, upload manifest, status, timestamps, request fingerprint, and an effective partial unique index on non-null `idempotency_key_hash`. The API's duplicate-request recovery is supported by this index; no idempotency defect was confirmed.
- `qutlas_notification_jobs` has a queue-like schema and dedupe index, but no app consumer/enqueue code was found. Its `enquiry_id` foreign key lacks a covering index (performance advisor).
- Legacy `orders` has a numeric `final_price`, but only a file/material/quantity shape; it is not the checkout's order model and has no order items, customer snapshot, payment, shipment, or pricing breakdown.
- `users` is a custom password-based table separate from Supabase Auth; `profiles` references `auth.users`. Both identity models coexist without app integration.
- All six tables have RLS enabled. The advisor found no policies for five tables; `profiles` has self-row insert/update/select policies.
- The live project still has no commerce tables because the new checked-in migration has not been applied. Its current schema is not yet reproducible from this repository until the migration is validated and installed in a development database.

No table contents, customer records, secrets, or file objects were read. The metadata probe and advisor/SQL queries were read-only.

## Current Architecture

The implementation retains Next.js App Router and Supabase. Server-side services now own catalogue filtering, pricing, order creation, fulfilment validation, stock movements, payment verification, and admin authorization. Money is handled in minor units; order items snapshot price/rule references. Enquiries and Qutters Lab submissions remain separate from orders. Supabase Auth is the identity provider, with server-checked roles. The schema migration remains un-applied; local/isolated validation is the next deployment gate.

Do not seed prices, stock, supplier capabilities, delivery rates, or lead times. A product remains unavailable for purchase until verified inputs and a valid pricing rule exist.

## Recommended Sequence

1. **Schema validation:** install the migration in an isolated Supabase database, correct any SQL/runtime issues, and run RLS/grant tests before production consideration.
2. **Commercial setup:** add only Qutlas-verified categories, products, supplier prices, pricing rules, stock, fulfilment rules, and initial authorized staff roles.
3. **End-to-end tests:** exercise product publication through order, reservation, payment webhook, status history, cancellation, dispatch, account history, and Lab review.
4. **Operational setup:** configure payment credentials, reservation expiry, notifications, backups, file scanning/retention, monitoring, privacy/legal policies, and production support ownership.
5. **UI verification:** extend the mobile smoke pass from homepage/shop/account/admin/Lab to every route; consolidate remaining CSS layers and complete media, reporting, promotion, and content-management work.

## Validation Results

- `npm test`: **passed**, nine tests covering pricing arithmetic/validation, payment webhook signatures, and staff role decisions.
- `npm run lint`: **passed** with the Next flat config. Image optimization warnings may remain on existing remote-image usage.
- `npm run build`: **passed** with Next.js 16.1.6; 35 routes generated, including new catalogue, pricing, account, admin, order, payment, inventory, and Lab endpoints.
- Supabase schema/advisors: live project was inspected read-only; the new migration has **not** been applied or SQL-validated because no local Supabase CLI/PostgreSQL environment is available.
- Browser smoke: **passed** for homepage, materials, shop, checkout, account, admin entry, Qutters Lab, and project at 390px with no horizontal overflow. The homepage hero is cream, one-column, and uses the display font; the shop correctly shows unavailable until the migration is applied. Authenticated workflows, tablet/desktop route coverage, and API/database end-to-end tests were **not run**. No live order/payment/customer submission was performed.

## Worktree Preservation

The primary checkout was already dirty before implementation. Existing storefront/UI edits and CSS backups were preserved. This turn also changed application code, added migration/API/test files, updated README/workflow documentation, and updated this report. No production database, branch, deployment, or commit was changed.

## Decisions Needed from Qutlas

- Which checkout is canonical, and whether `qutlas_v4.html` remains supported.
- Verified product/variant specifications, supplier identities and prices, commercial units/conversions, minimum quantities, margins, processing rates, and current availability.
- Which fabrication processes and partners are actually approved, including capacity and quality criteria.
- Payment provider and settlement/refund rules; delivery/collection regions, rates, and promise policy.
- Verified contact inboxes, who owns enquiry/Lab response, and notification expectations.
- Customer account requirement, staff roles, legal/privacy terms, retention period, and file scanning policy.

Until those inputs are resolved, immediate-price commerce and production promises are correctly blocked rather than fabricated.