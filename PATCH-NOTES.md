# Qutlas Phase 1 Fix Bundle

Extract this ZIP into the root of your existing `C:\Users\bubba\Projects\qutlas` repository and allow the listed files to be overwritten. The ZIP contains only these patched files plus this note. It does not include `.git`, `.env`, `.env.local`, `node_modules`, `.next`, or any secret values.

## Changes

- Checkout sends the API-required `Idempotency-Key`, reuses it only for identical retries, handles network/JSON failures, and shows errors as errors rather than as a success reference.
- Unsupported or mixed cart material categories are submitted as `unsure`, which the API accepts; the itemized description remains in the request.
- Cart contents persist in browser local storage across refreshes.
- Unverified sample hardware prices were removed from the catalogue. Items marked `to-confirm` display `Price on request`; checkout does not display an invented subtotal.
- Catalogue selections now prefill the item name in the project configurator.
- Shop wording is aligned with quote-led ordering, the lint script targets the app with ESLint, `.env.example` lists required Supabase placeholders, and stale workflow documentation was corrected.

## Validation

Static source checks passed for the changes listed above. A TypeScript check and production build were not run in this environment because dependencies were not present in the ZIP and dependency installation did not complete. Run these locally before committing:

```powershell
corepack pnpm lint
corepack pnpm exec tsc --noEmit
corepack pnpm build
```

Do not run test submissions against production Supabase. Use a separate test project for end-to-end validation.

## Known system gaps not solved by this patch

- No staff-facing enquiry/quotation console.
- No confirmed notification delivery. The API records notification status as pending, but this repository does not implement a notification worker.
- No payment processing, stock reservation, order status tracking, or customer account area.
- The ZIP does not contain Supabase schema migrations or storage-policy definitions, so database/bucket setup cannot be reproduced or fully audited from this source archive alone.
