const { getFamilyBookOffer, listFamilyBookOffers } = require("./family-book-catalog");

function stripeObjectId(value, prefix) {
  const id = String(value || "").trim();
  // Stripe IDs look like price_1Abc, cs_test_..., or cs_live_...
  return new RegExp(`^${prefix}_(?:test_|live_)?[A-Za-z0-9]+$`).test(id) ? id : "";
}

function priceIdForOffer(offer, env = process.env) {
  if (!offer) return "";
  const primary = stripeObjectId(env[offer.priceEnv], "price");
  if (primary) return primary;
  if (offer.priceEnvFallback) return stripeObjectId(env[offer.priceEnvFallback], "price");
  return "";
}

function publicOrigin(value, env = process.env) {
  const raw = String(value || env.PUBLIC_BASE_URL || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const isLocal = ["127.0.0.1", "localhost"].includes(url.hostname);
    if (url.protocol !== "https:" && !(env.NODE_ENV !== "production" && isLocal)) return "";
    return url.origin;
  } catch {
    return "";
  }
}

function familyCheckoutStatus(env = process.env) {
  const secretKey = String(env.STRIPE_SECRET_KEY || "").trim();
  const keyMode = secretKey.match(/^(?:sk|rk)_(test|live)_/)?.[1] || "";
  const liveExpected = env.STRIPE_LIVE_MODE === "true";
  const origin = publicOrigin(env.PUBLIC_BASE_URL, env);
  const offers = listFamilyBookOffers().map((offer) => {
    const full = getFamilyBookOffer(offer.id);
    const priceId = priceIdForOffer(full, env);
    let checkoutReady = Boolean(keyMode) && Boolean(origin) && (keyMode === "test" || Boolean(priceId));
    if (liveExpected && keyMode !== "live") checkoutReady = false;
    if (!liveExpected && keyMode === "live") checkoutReady = false;
    return {
      ...offer,
      checkoutReady,
      hasPriceId: Boolean(priceId)
    };
  });
  const configured = offers.some((offer) => offer.checkoutReady);
  return {
    checkoutConfigured: configured,
    liveMode: liveExpected,
    hasPublicOrigin: Boolean(origin),
    offers,
    noticeZh: configured
      ? "付款由 Stripe 托管结账完成。成功页本身不会解锁下载或印刷订单，必须等服务器确认付款。"
      : "预览和短片仍然免费。电子版 ¥19.9（约 $2.99）。印刷请先选择：软壳 ¥129（约 $17.99），精美硬壳 ¥199（约 $27.99）。需要服务器确认付款后才能完成。当前还没有接通可用的收款，因此不会把订单标记为已支付，也不会假装已经下单成功。",
    noticeEn: configured
      ? "Payment uses Stripe hosted checkout. A success page alone will not unlock a download or print order; the server must confirm the payment."
      : "Preview and the short film stay free. The digital edition is ¥19.9 (about $2.99). Printed books are a choice: softcover ¥129 (about $17.99) or premium hardcover ¥199 (about $27.99). Each requires a confirmed payment. Checkout is not connected yet, so an order will not be marked paid and we will not pretend it succeeded."
  };
}

function offerCheckoutReady(offerId, env = process.env) {
  const status = familyCheckoutStatus(env);
  return status.offers.find((item) => item.id === offerId) || null;
}

function entitlementFromQuery(query) {
  const params = query && typeof query.get === "function" ? query : new URLSearchParams(query || "");
  const claimed = ["1", "true", "yes", "paid", "success"].includes(String(params.get("paid") || params.get("success") || params.get("checkout") || "").toLowerCase());
  return {
    claimedByPage: claimed,
    sessionId: stripeObjectId(params.get("session_id"), "cs"),
    paid: false,
    reason: "A checkout success page or query string is never proof of payment."
  };
}

module.exports = {
  entitlementFromQuery,
  familyCheckoutStatus,
  offerCheckoutReady,
  priceIdForOffer,
  publicOrigin,
  stripeObjectId
};

function stripeApiBase(env = process.env) {
  const raw = String(env.STRIPE_API_BASE_URL || "https://api.stripe.com").trim() || "https://api.stripe.com";
  const url = new URL(raw);
  const isLocalTest = env.NODE_ENV === "test" && url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname);
  if (!isLocalTest && (url.protocol !== "https:" || url.hostname !== "api.stripe.com")) {
    throw Object.assign(new Error("Stripe API base URL must be https://api.stripe.com in production."), { statusCode: 503 });
  }
  return url.toString().replace(/\/+$/, "");
}

async function createFamilyCheckoutSession({ env = process.env, order, offer, successPath, cancelPath, fetchImpl = fetch }) {
  const status = familyCheckoutStatus(env);
  const offerStatus = status.offers.find((item) => item.id === offer?.id);
  if (!status.checkoutConfigured || !offerStatus?.checkoutReady) {
    throw Object.assign(new Error("Secure checkout is not connected yet."), { statusCode: 503, code: "STRIPE_NOT_CONFIGURED" });
  }
  const secretKey = String(env.STRIPE_SECRET_KEY || "").trim();
  const keyMode = secretKey.match(/^(?:sk|rk)_(test|live)_/)?.[1];
  const origin = publicOrigin(env.PUBLIC_BASE_URL, env);
  const priceId = priceIdForOffer(offer, env);
  if (keyMode === "live" && !priceId) {
    throw Object.assign(new Error("This live Stripe product price is not configured yet."), { statusCode: 503, code: "STRIPE_PRICE_NOT_CONFIGURED" });
  }
  const successUrl = new URL(successPath || "/照片成为电子书", origin);
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  successUrl.searchParams.set("order", order.id);
  const cancelUrl = new URL(cancelPath || successPath || "/照片成为电子书", origin);
  cancelUrl.searchParams.set("cancelled", "1");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  // Stripe requires the literal placeholder in success_url.
  const success = `${origin}${successUrl.pathname}${successUrl.search.replace(encodeURIComponent("{CHECKOUT_SESSION_ID}"), "{CHECKOUT_SESSION_ID}")}`;
  form.set("success_url", success);
  form.set("cancel_url", `${origin}${cancelUrl.pathname}${cancelUrl.search}`);
  form.set("client_reference_id", order.id);
  form.set("customer_creation", "always");
  form.set("customer_email", order.contactEmail || "");
  form.set("locale", "auto");
  if (priceId) {
    form.set("line_items[0][price]", priceId);
  } else {
    form.set("line_items[0][price_data][currency]", "cny");
    form.set("line_items[0][price_data][unit_amount]", String(offer.amountMinorCny));
    form.set("line_items[0][price_data][product_data][name]", offer.nameEn);
    form.set("line_items[0][price_data][product_data][description]", offer.descriptionEn);
  }
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[order_id]", order.id);
  form.set("metadata[offer_id]", offer.id);
  form.set("metadata[cover]", offer.cover || "");
  form.set("metadata[family_book]", "1");
  form.set("payment_intent_data[metadata][order_id]", order.id);
  const apiVersion = String(env.STRIPE_API_VERSION || "").trim();
  const response = await fetchImpl(`${stripeApiBase(env)}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(apiVersion ? { "Stripe-Version": apiVersion } : {}),
      "Idempotency-Key": `storieslens-family-${order.id}`
    },
    body: form.toString()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(payload?.error?.message || "Stripe could not create this checkout."), { statusCode: response.status >= 500 ? 502 : 422, code: "STRIPE_CHECKOUT_FAILED" });
  }
  const checkoutUrl = new URL(String(payload.url || ""));
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com" || !new RegExp(`^cs_${keyMode}_`).test(String(payload.id || ""))) {
    throw Object.assign(new Error("Stripe returned an invalid checkout session."), { statusCode: 502, code: "STRIPE_INVALID_SESSION" });
  }
  return { id: payload.id, url: checkoutUrl.toString() };
}

async function retrieveStripeCheckoutSession({ env = process.env, sessionId, fetchImpl = fetch }) {
  const id = stripeObjectId(sessionId, "cs");
  if (!id) throw Object.assign(new Error("invalid_session"), { statusCode: 400 });
  const secretKey = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!/^(?:sk|rk)_(test|live)_/.test(secretKey)) {
    throw Object.assign(new Error("Secure checkout is not connected yet."), { statusCode: 503, code: "STRIPE_NOT_CONFIGURED" });
  }
  const apiVersion = String(env.STRIPE_API_VERSION || "").trim();
  const response = await fetchImpl(`${stripeApiBase(env)}/v1/checkout/sessions/${id}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(apiVersion ? { "Stripe-Version": apiVersion } : {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error("The checkout session could not be verified."), { statusCode: 502, code: "STRIPE_SESSION_LOOKUP_FAILED" });
  const paid = payload.payment_status === "paid" && (payload.status === "complete" || payload.status === "complete".toString());
  return {
    id: payload.id,
    paid: Boolean(paid),
    paymentStatus: payload.payment_status || "",
    status: payload.status || "",
    orderId: String(payload.metadata?.order_id || payload.client_reference_id || "")
  };
}

module.exports.createFamilyCheckoutSession = createFamilyCheckoutSession;
module.exports.retrieveStripeCheckoutSession = retrieveStripeCheckoutSession;
