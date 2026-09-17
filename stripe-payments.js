const crypto = require("crypto");

const STRIPE_OFFERS = Object.freeze({
  "story-pass": {
    name: "StoriesLens Story Pass",
    description: "One private story project with 12 AI illustrations and a downloadable edition.",
    amountMinor: 1900,
    currency: "usd",
    packageId: "creator-story"
  },
  "cocreate-pack": {
    name: "StoriesLens Invited Co-creation Pack",
    description: "One private shared story project with 18 AI illustrations and five collaborator seats.",
    amountMinor: 3900,
    currency: "usd",
    packageId: "invite-cocreate"
  },
  "teacher-classroom": {
    name: "StoriesLens Teacher Classroom Project",
    description: "One teacher-controlled publishing project for up to 30 student works.",
    amountMinor: 7900,
    currency: "usd",
    packageId: "teacher-classroom"
  },
  "guided-squad": {
    name: "StoriesLens Guided Story Squad — Seat Deposit",
    description: "A one-time founding-cohort seat deposit applied to the final guided project price.",
    amountMinor: 4900,
    currency: "usd",
    packageId: ""
  },
  "movie-30": {
    name: "StoriesLens 30-second Movie Pack",
    description: "Six five-second AI film clips for a private 30-second story movie.",
    amountMinor: 3900,
    currency: "usd",
    packageId: "movie-30"
  },
  "movie-60": {
    name: "StoriesLens 60-second Movie Pack",
    description: "Twelve five-second AI film clips for a private 60-second story movie.",
    amountMinor: 6900,
    currency: "usd",
    packageId: "movie-60"
  }
});

function safeBaseUrl(value) {
  const url = new URL(String(value || ""));
  const isLocalTest = process.env.NODE_ENV === "test" && url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname);
  if (!isLocalTest && (url.protocol !== "https:" || url.hostname !== "api.stripe.com")) {
    throw new Error("Stripe API base URL must be https://api.stripe.com in production.");
  }
  return url.toString().replace(/\/+$/, "");
}

function publicOrigin(value) {
  const url = new URL(String(value || ""));
  const isLocal = ["127.0.0.1", "localhost"].includes(url.hostname);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && isLocal)) throw new Error("A secure public StoriesLens URL is required for checkout.");
  return url.origin;
}

async function createCheckoutSession({ secretKey, apiBaseUrl = "https://api.stripe.com", publicBaseUrl, order, offer, fetchImpl = fetch }) {
  if (!/^sk_(?:test|live)_/.test(String(secretKey || ""))) throw Object.assign(new Error("Stripe checkout is not configured yet."), { statusCode: 503, code: "STRIPE_NOT_CONFIGURED" });
  if (!order?.id || !order?.ownerId || !offer?.amountMinor) throw new Error("A valid account order is required.");
  const origin = publicOrigin(publicBaseUrl);
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/checkout.html?offer=${encodeURIComponent(order.offerId)}&cancelled=1`);
  form.set("client_reference_id", order.id);
  form.set("customer_creation", "always");
  form.set("locale", "auto");
  form.set("line_items[0][price_data][currency]", offer.currency);
  form.set("line_items[0][price_data][unit_amount]", String(offer.amountMinor));
  form.set("line_items[0][price_data][product_data][name]", offer.name);
  form.set("line_items[0][price_data][product_data][description]", offer.description);
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[order_id]", order.id);
  form.set("metadata[account_id]", order.ownerId);
  form.set("metadata[offer_id]", order.offerId);
  form.set("metadata[package_id]", offer.packageId || "");
  form.set("metadata[region]", order.region || "");
  form.set("payment_intent_data[metadata][order_id]", order.id);
  form.set("payment_intent_data[metadata][account_id]", order.ownerId);

  const response = await fetchImpl(`${safeBaseUrl(apiBaseUrl)}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `storieslens-checkout-${order.id}`
    },
    body: form.toString()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || "Stripe could not create this checkout.";
    throw Object.assign(new Error(message), { statusCode: response.status >= 500 ? 502 : 422, code: "STRIPE_CHECKOUT_FAILED" });
  }
  const checkoutUrl = new URL(String(payload.url || ""));
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com" || !/^cs_(?:test|live)_/.test(String(payload.id || ""))) {
    throw Object.assign(new Error("Stripe returned an invalid checkout session."), { statusCode: 502, code: "STRIPE_INVALID_SESSION" });
  }
  return { id: payload.id, url: checkoutUrl.toString(), expiresAt: payload.expires_at ? new Date(payload.expires_at * 1000).toISOString() : "" };
}

function signatureParts(header) {
  return String(header || "").split(",").reduce((result, pair) => {
    const index = pair.indexOf("=");
    if (index < 1) return result;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    (result[key] ||= []).push(value);
    return result;
  }, {});
}

function verifyWebhookSignature(rawBody, header, secret, { toleranceSeconds = 300, nowSeconds = Math.floor(Date.now() / 1000) } = {}) {
  if (!/^whsec_/.test(String(secret || ""))) throw Object.assign(new Error("Stripe webhook signing is not configured."), { statusCode: 503, code: "STRIPE_WEBHOOK_NOT_CONFIGURED" });
  const parts = signatureParts(header);
  const timestamp = Number(parts.t?.[0]);
  if (!Number.isSafeInteger(timestamp) || !parts.v1?.length) throw Object.assign(new Error("Stripe webhook signature is malformed."), { statusCode: 400, code: "STRIPE_SIGNATURE_INVALID" });
  if (toleranceSeconds > 0 && Math.abs(nowSeconds - timestamp) > toleranceSeconds) throw Object.assign(new Error("Stripe webhook signature has expired."), { statusCode: 400, code: "STRIPE_SIGNATURE_EXPIRED" });
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const valid = parts.v1.some((candidate) => {
    const left = Buffer.from(candidate, "hex");
    const right = Buffer.from(expected, "hex");
    return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
  });
  if (!valid) throw Object.assign(new Error("Stripe webhook signature did not match."), { statusCode: 400, code: "STRIPE_SIGNATURE_INVALID" });
  return true;
}

module.exports = { STRIPE_OFFERS, createCheckoutSession, verifyWebhookSignature };
