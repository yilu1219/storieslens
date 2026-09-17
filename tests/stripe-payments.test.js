const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

const { STRIPE_OFFERS, createCheckoutSession, verifyWebhookSignature } = require("../stripe-payments");

test("Stripe Checkout binds a signed-in account order to an exact package and amount", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  let captured;
  try {
    const session = await createCheckoutSession({
      secretKey: "sk_test_private_key",
      apiBaseUrl: "http://127.0.0.1:4242",
      publicBaseUrl: "https://www.storieslens.com",
      order: { id: "order_123", ownerId: "account_456", offerId: "story-pass", region: "us" },
      offer: STRIPE_OFFERS["story-pass"],
      fetchImpl: async (url, options) => {
        captured = { url, options, form: new URLSearchParams(options.body) };
        return { ok: true, json: async () => ({ id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123", expires_at: 1_900_000_000 }) };
      }
    });
    assert.equal(session.id, "cs_test_123");
    assert.equal(captured.form.get("line_items[0][price_data][unit_amount]"), "1900");
    assert.equal(captured.form.get("metadata[account_id]"), "account_456");
    assert.equal(captured.form.get("metadata[package_id]"), "creator-story");
    assert.match(captured.options.headers.Authorization, /^Bearer sk_test_/);
    assert.match(captured.options.headers["Idempotency-Key"], /order_123/);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
});

test("Stripe webhook verification accepts the raw signed body and rejects tampering", () => {
  const secret = "whsec_test_signing_secret";
  const timestamp = 1_800_000_000;
  const rawBody = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const header = `t=${timestamp},v1=${signature}`;
  assert.equal(verifyWebhookSignature(rawBody, header, secret, { nowSeconds: timestamp }), true);
  assert.throws(() => verifyWebhookSignature(`${rawBody} `, header, secret, { nowSeconds: timestamp }), /did not match/);
  assert.throws(() => verifyWebhookSignature(rawBody, header, secret, { nowSeconds: timestamp + 301 }), /expired/);
});
