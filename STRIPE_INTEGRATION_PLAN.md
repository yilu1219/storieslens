# StoriesLens Stripe integration plan

Updated: 2026-09-18

## Executive decision

Use Stripe Checkout as the only card-entry surface. Keep the current one-time project packs for the private beta, then add recurring Billing only after paid-project demand is validated. Use Invoicing for schools and organizations, not for ordinary family checkout. Configure Stripe Tax only after the Stripe legal entity and business origin are final and the relevant tax registrations actually exist.

The current Stripe account and website integration are in sandbox/test mode. They must not be described as live payments until Stripe business verification, payout banking, live restricted keys, a live webhook destination, and end-to-end live-mode checks are complete.

## Product and payment map

| Customer/job | Stripe product | Charging model | StoriesLens fulfillment |
| --- | --- | --- | --- |
| Parent buys one finished story | Payments + Checkout | One-time project pack | Grant a server-defined creation allowance after a verified webhook |
| Family wants ongoing creation | Billing + Checkout | Monthly or annual flat subscription with included allowances | Refresh entitlements only after `invoice.paid` |
| Teacher buys one classroom project | Payments + Checkout | One-time classroom pack | Grant teacher-controlled project capacity |
| School or education organization | Invoicing | Quote/PO followed by hosted invoice, normally net terms | Provision only after signed pilot terms and payment state permit it |
| Printed portfolio | Payments + Checkout | Separate physical line item plus shipping | Create a print-production order; do not treat it as a digital allowance |
| Extra image/video generation | Payments or Billing | Prepaid credit pack; avoid uncapped usage billing during beta | Add credits from a verified payment event with an idempotency key |

## What is already implemented

- Server-created Stripe Checkout Sessions for exact, server-owned offers.
- Adult account sign-in required before checkout.
- Stripe-hosted card collection; StoriesLens does not store card data.
- Restricted test key and webhook signing secret supplied through Railway environment variables.
- Raw-body webhook signature verification with a five-minute tolerance.
- Idempotent fulfillment for `checkout.session.completed` and delayed payment success.
- Failure/expiry tracking and refund recording.
- Amount, currency, account, offer, package, and live/test mode validation before credit grant.
- A payment-return page that reads server fulfillment state and never grants credits itself.
- Automated tests for session creation, tamper rejection, duplicate events, and one-time allowance fulfillment.

## Gaps against the requested Stripe products

### Payments

1. Replace inline `price_data` with stable Stripe Products and Prices before live launch. Stable IDs improve reporting, tax-code assignment, refunds, and price-version control.
2. Store `stripe_customer_id` on the adult account and reuse it for later purchases.
3. Add dispute and fraud-event handling, especially `charge.dispute.created` and relevant early-fraud events.
4. Confirm the production database/volume is durable. Order, event-id, allowance, refund, and cost ledgers must survive redeploys.
5. Pin and record the Stripe API version used by the integration.

### Billing

Billing is not implemented yet. Add it only after finalizing the subscription promise and included limits.

Recommended first recurring products:

- `Family Creator Monthly` and `Family Creator Annual`: one adult-owned family account, a clearly stated monthly allowance, no unlimited image or video generation.
- `Teacher Workspace Monthly/Annual`: a teacher workspace and stated active-class/project capacity. Do not charge minors or create student-owned billing accounts.

Implementation requirements:

- Create stable recurring Prices in Stripe Dashboard; pass only allow-listed Price IDs from the server.
- Create Checkout Sessions with `mode=subscription` and a mapped Stripe Customer.
- Store the Stripe customer, subscription, price, status, and entitlement-expiry fields.
- Provision or renew access from `invoice.paid`, not from the browser success URL.
- Handle `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_action_required`, and `invoice.finalization_failed`.
- Add the Stripe-hosted Customer Portal for payment-method changes, invoices, plan changes, and cancellation.
- Prevent duplicate subscriptions for the same adult account.

### Invoicing

Use Stripe Invoicing for signed teacher/school pilots, purchase orders, and organization billing. Do not put the invoicing workflow in the normal family checkout path.

Required workflow:

1. An administrator creates or confirms the organization Customer.
2. Store the school billing contact and organization identity separately from student data.
3. Create invoice items from an approved server-side offer or signed quote.
4. Create and finalize the invoice with the agreed payment terms.
5. Track `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`, `invoice.voided`, and credit notes.
6. Provision seats/project capacity according to the contract and payment policy.

### Tax

Stripe Tax calculation is not implemented yet. Do not enable collection globally until the legal seller, business origin, and registrations are confirmed.

Required sequence:

1. Finalize whether the seller is the intended US entity, Hong Kong entity, or another entity. The current Stripe onboarding country must match the real seller.
2. Set the correct head-office/origin address in Stripe Tax.
3. Ask a qualified tax adviser which registrations are required. Adding a Stripe Tax registration does not itself register the business with a tax authority.
4. Assign a specific Stripe product tax code to every stable Product. Family digital service, school SaaS/service, downloadable ebook, and printed portfolio may require different codes.
5. Enable `automatic_tax[enabled]=true` only after the relevant Tax setup is ready.
6. Collect billing location for digital purchases. Collect shipping address only when a physical portfolio is actually ordered.
7. Store and display tax-inclusive totals returned by Stripe; never calculate tax from a client-side estimate.
8. Test taxable, non-taxable, unregistered, refund, subscription-renewal, and physical-shipping scenarios in sandbox.

## Recommended technical architecture

```text
StoriesLens account
  -> server allow-lists offer or Stripe Price ID
  -> server creates Checkout Session / Invoice
  -> Stripe-hosted payment or invoice page
  -> signed Stripe event destination
  -> idempotent payment ledger
  -> entitlement/credit/print-order fulfillment
  -> account page and administrator cost/revenue dashboard
```

The internal allowance ledger remains the source of truth for consumption. Stripe is the source of truth for payment, invoice, subscription, refund, dispute, and tax state. Never use Stripe metadata or a return-page query parameter as the sole source of fulfillment truth.

## Minimum data additions

- Adult account: `stripeCustomerId`.
- Subscription: `stripeSubscriptionId`, `stripePriceId`, status, current period end, cancellation state.
- Invoice: Stripe invoice ID, customer ID, organization ID, status, amount, tax, currency, hosted invoice URL reference.
- Order: Stripe product/price IDs, subtotal, tax, shipping, total, payment intent, fulfillment type.
- Product catalog: internal offer ID, Stripe product ID, Stripe price ID, tax code, fulfillment policy, region availability.
- Event ledger: Stripe event ID, type, object ID, received time, processed time, result, retry/error state.

## Secret and permission model

- Keep sandbox and live credentials separate.
- Keep all secret/restricted keys in Railway secrets; never in source, browser code, screenshots, email, or chat.
- Continue using a restricted key with least privilege. Add permissions only when the corresponding server feature is deployed.
- A Billing/Invoicing build will need scoped access to Customers, Checkout Sessions, Subscriptions, Prices/Products (read if Dashboard-managed), Billing Portal Sessions, Invoices, and Invoice Items.
- Tax settings and registrations should normally be configured by an authorized adult in Stripe Dashboard; the runtime service should not receive tax-registration write access unless there is a justified automated workflow.
- Keep Stripe MCP OAuth separate from the website runtime key. MCP is an operator/development tool, not a production application credential.

## Phased delivery

### Phase 1 — private beta, already substantially built

- One-time Checkout for project packs.
- Sandbox webhook fulfillment and allowance ledger.
- Test success, cancel, delayed success, failure, duplicate webhook, refund, and dispute handling.
- Resolve the Stripe legal entity/country and payout bank before switching to live mode.

### Phase 2 — production-hardening

- Stable Products/Prices, saved Stripe Customers, dispute handling, durable persistence, API-version pinning, receipts/refund operations, and reconciliation dashboard.
- Live restricted key and live webhook destination created only after account verification.

### Phase 3 — recurring families and teachers

- Subscription Checkout, Customer Portal, subscription/invoice webhooks, entitlement expiry, failed-payment recovery, and cancellation policy.
- Start with fixed included allowances; do not offer unlimited generation.

### Phase 4 — institutions and tax

- School customer/invoice workflow and signed-pilot provisioning.
- Tax registrations and automatic tax after professional review.
- Separate digital and physical fulfillment, tax code, address collection, and refund handling.

## Launch acceptance tests

- A sandbox card payment grants the exact package once.
- Duplicate or reordered events do not duplicate fulfillment.
- An incorrect amount, currency, mode, account, offer, or package is rejected.
- A canceled/expired/failed payment grants nothing.
- A full or partial refund updates the revenue ledger and flags entitlement review.
- A dispute freezes further paid consumption according to policy and alerts an administrator.
- A subscription renews only from `invoice.paid`; failed payment and cancellation change access predictably.
- Customer Portal actions reconcile back to StoriesLens through webhooks.
- An invoice can be finalized, paid, voided, or credited without exposing student data.
- Tax appears only in registered jurisdictions and uses the intended billing/shipping location.
- Printed products generate a shipping fulfillment record and never silently consume digital credits.

## Decisions required before the next code phase

1. Which legal entity and Stripe country will receive the money?
2. Keep beta one-time only, or launch a recurring Family/Teacher plan immediately?
3. Exact subscription names, prices, included monthly limits, cancellation/refund policy, and annual discount.
4. Which countries will receive physical portfolios at launch?
5. Which schools, if any, require invoices or purchase-order terms?

