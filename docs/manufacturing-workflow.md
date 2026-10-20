# Qutlas Manufacturing Workflow

## Reference: SendCutSend

This is a reference for customer-experience patterns, not evidence that Qutlas has the same equipment, pricing, capacity, or delivery performance. The facts below were checked against SendCutSend's publicly available pages on 2026-10-19.

### Verified public facts

- SendCutSend offers instant pricing for supported files and parts within its size criteria. Its published custom-quote process is started while logged in; the customer uploads a file and confirms details such as material thickness and CAD software. Its team reviews the file and, if it meets its guidelines, sends a link to add the part to cart and check out. [Custom quote FAQ](https://sendcutsend.com/faq/how-to-get-a-custom-quote/)
- The FAQ lists custom-quote formats including 3DM, AI, DXF, DWG, EPS, F3D, PDF, SLDPRT, SVG, STEP, and STP. It distinguishes custom quote files from the narrower file types accepted for instant pricing. [Custom quote FAQ](https://sendcutsend.com/faq/how-to-get-a-custom-quote/)
- SendCutSend says its applications team reviews instant-priced part files for manufacturability after an order is placed and contacts the customer if concerns arise. [Custom quote FAQ](https://sendcutsend.com/faq/how-to-get-a-custom-quote/)
- For sheet cutting, SendCutSend says its system routes parts to a cutting method based on material and geometry; it publishes file-preparation rules, dimensions, and process-specific design guidelines. [Sheet-cutting guidelines](https://sendcutsend.com/guidelines/sheet-cutting/) and [sheet-cutting service](https://sendcutsend.com/services/sheet-cutting/)
- Formal quotes produce a payment link and PDF. The FAQ says an order remains pending and will not enter production until funded; it also describes address, shipping, quote validity, and payment steps. [Formal quote FAQ](https://sendcutsend.com/faq/how-does-a-formal-quote-work/)
- Customers can use an account order tracker and receive email updates, including order confirmation, production progress, and shipment/tracking information. [Order status FAQ](https://sendcutsend.com/faq/what-is-my-order-status/)
- A PDF design cannot be used for instant pricing, but can be submitted through SendCutSend's custom quote form. [PDF FAQ](https://sendcutsend.com/faq/can-i-send-you-a-pdf/)

### Not established by the reference

These public pages do not establish Qutlas's own partner roster, equipment, current stock, pricing, quality system, payment methods, lead times, or shipping coverage. SendCutSend's account, upload, quote, and status features are its own; this document does not imply that Qutlas has equivalent systems. The proposed Qutlas steps below are operational recommendations, not verified current practice.

## Proposed Qutlas workflow

1. **Enquiry:** Let a customer start with a material, drawing, description, or idea. Collect a name, email, phone, optional organisation, project description, quantity, and delivery location progressively.
2. **File submission:** Ask the customer to attach a drawing or design file to the enquiry email when available. For this first increment, the website does not upload or retain attachments. Accept files only through a Qutlas-controlled channel once one has been configured; use a defined size limit, permitted file types, access controls, retention period, and malware scanning before adding server-side uploads.
3. **Specification:** Ask only relevant questions for the chosen category: steel form/grade and dimensions; wood type/board and cut/edge needs; tile application, size/style, area or box quantity; granite application, finish, dimensions, cut-outs, and installation interest. Confirm tolerances, applicable standards, and site constraints where relevant. Mark unknowns rather than guessing.
4. **Technical review:** Review manufacturability and safety-critical requirements with Ladja and/or an approved manufacturing partner. Confirm supply availability and partner capability for this particular job. Do not imply a partner has accepted work before explicit confirmation.
5. **Quotation:** Send a written scope and price only after the review. Identify assumptions, exclusions, quote validity, taxes/transport, payment terms, and a delivery estimate supported by current partner and logistics information. Do not show an instant price on the site.
6. **Customer approval:** Obtain documented acceptance of the final scope, drawing/revision, quantity, price, and delivery terms before booking production.
7. **Payment:** Issue payment instructions only under Qutlas's confirmed process. State whether a deposit or full payment is due and when; do not assume SendCutSend's payment methods or conditions apply.
8. **Workshop assignment:** After approval and any required payment, confirm the partner/workshop, job reference, planned start, and production slot. Communicate assignment only after the partner accepts the job.
9. **Quality checks:** Agree measurable checks before production: dimensions/tolerances, material evidence where required, weld/finish inspection, quantity, and acceptance criteria. Record results and escalate deviations before dispatch. The appropriate checks depend on the job and applicable standards.
10. **Delivery:** Confirm packaging, destination, access, transport cost, and a realistic delivery window with the partner/logistics provider before promising a date. Share proof of dispatch or receipt when available.
11. **Status updates:** Send updates at confirmed milestones: enquiry received (once a real inbox/workflow exists), specification questions, quote issued, approval/payment, workshop acceptance, production/quality status, dispatch, and delivery. Report delays promptly and distinguish estimates from confirmed milestones.

## Current app behavior and configuration

There is no Supabase client, API route, database integration, upload service, price engine, or order tracking in the repository. The project configurator has progressive steps for material/need, project description/files, material-specific details, customer/location, and review. It keeps data and selected files in browser memory while navigating the steps. It checks filenames/types/sizes locally, but does not upload or persist files or request data. Quote drafts default to `support@qutlas.com`; business enquiry links default to `hello@qutlas.com`. `.env.example` documents both public recipient overrides.

The final step downloads a local text summary and offers an explicit `mailto:` draft to Qutlas Support. The customer must still review/send the message and attach selected files manually. This is not reliable persistence or a delivery receipt. Change recipients at build/deployment time with `NEXT_PUBLIC_QUOTE_EMAIL` and `NEXT_PUBLIC_BUSINESS_EMAIL`. The material configurator and current app limitations are benchmarked in [sendcutsend-benchmark.md](sendcutsend-benchmark.md).

Before treating the site as a live lead channel, configure and test a controlled server-side submission path or a monitored inbox, define privacy/retention and file-safety practices, and verify the operational workflow with Ladja and each approved partner. Any future database credentials must be server-side secrets; never expose a service-role key through `NEXT_PUBLIC_*` or browser code.
