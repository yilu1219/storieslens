const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

async function freePort() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function cookieValue(response) {
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Test server stopped with exit code ${child.exitCode}.`);
    try {
      const response = await fetch(`${baseUrl}/api/admin/session`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the test server.");
}

async function jsonRequest(baseUrl, pathname, { method = "GET", body, cookie, origin = false } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: baseUrl } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { response, payload: await response.json() };
}

test("a verified Stripe webhook grants the purchased allowance exactly once", { timeout: 20_000 }, async (t) => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-stripe-"));
  const stripeSigningSecret = "whsec_test_checkout_fulfillment";
  let checkoutForm;
  const stripeProvider = http.createServer((request, response) => {
    if (request.url !== "/v1/checkout/sessions" || request.method !== "POST") return response.writeHead(404).end();
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      checkoutForm = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ id: "cs_test_storieslens_123", url: "https://checkout.stripe.com/c/pay/cs_test_storieslens_123", expires_at: Math.floor(Date.now() / 1000) + 1800 }));
    });
  });
  await new Promise((resolve) => stripeProvider.listen(0, "127.0.0.1", resolve));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const accessKey = "StoriesLens-Stripe-E2E-Admin";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      PUBLIC_BASE_URL: baseUrl,
      PLATFORM_DATA_DIR: dataDirectory,
      ADMIN_ACCESS_KEY: accessKey,
      INVITE_CODE_AUTH_ENABLED: "true",
      BETA_INVITE_ONLY: "true",
      ALLOWED_ACCOUNT_REGIONS: "us",
      STRIPE_SECRET_KEY: "rk_test_server_only",
      STRIPE_WEBHOOK_SECRET: stripeSigningSecret,
      STRIPE_LIVE_MODE: "false",
      STRIPE_API_BASE_URL: `http://127.0.0.1:${stripeProvider.address().port}`
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverOutput = "";
  child.stdout.on("data", (chunk) => { serverOutput += chunk; });
  child.stderr.on("data", (chunk) => { serverOutput += chunk; });
  t.after(() => {
    child.kill("SIGTERM");
    stripeProvider.close();
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  });

  try {
    await waitForServer(baseUrl, child);
    const adminLogin = await jsonRequest(baseUrl, "/api/admin/session", { method: "POST", body: { accessKey }, origin: true });
    const adminCookie = cookieValue(adminLogin.response);
    const invite = await jsonRequest(baseUrl, "/api/admin/invites", {
      method: "POST",
      cookie: adminCookie,
      origin: true,
      body: { region: "us", packageId: "free-preview", count: 1, maxRedemptions: 1, expiresInDays: 2, label: "Stripe test", commercialType: "complimentary", currency: "USD", unitAmountMinor: 0 }
    });
    assert.equal(invite.response.status, 201);
    const guest = await jsonRequest(baseUrl, "/api/auth/session");
    const guestCookie = cookieValue(guest.response);
    const auth = await jsonRequest(baseUrl, "/api/auth/invite", {
      method: "POST",
      cookie: guestCookie,
      body: { displayName: "Stripe Parent", ageGroup: "adult", locale: "en", primaryRegion: "us", countryCode: "US", betaInviteCode: invite.payload.codes[0] }
    });
    assert.equal(auth.response.status, 200);
    const accountCookie = cookieValue(auth.response) || guestCookie;
    const accountId = auth.payload.user.id;
    const before = await jsonRequest(baseUrl, "/api/credits", { cookie: accountCookie });

    const checkout = await jsonRequest(baseUrl, "/api/checkout-link", { method: "POST", cookie: accountCookie, body: { offer: "story-pass" } });
    assert.equal(checkout.response.status, 201);
    assert.match(checkout.payload.checkoutUrl, /^https:\/\/checkout\.stripe\.com\//);
    assert.equal(checkoutForm.get("metadata[account_id]"), accountId);
    assert.equal(checkoutForm.get("line_items[0][price_data][unit_amount]"), "1900");

    const event = {
      id: "evt_test_storieslens_paid_123",
      type: "checkout.session.completed",
      data: { object: {
        id: checkout.payload.sessionId,
        client_reference_id: checkout.payload.orderId,
        metadata: {
          order_id: checkout.payload.orderId,
          account_id: accountId,
          offer_id: "story-pass",
          package_id: "creator-story",
          region: "us"
        },
        amount_total: 1900,
        currency: "usd",
        livemode: false,
        payment_status: "paid",
        payment_intent: "pi_test_storieslens_123",
        customer_details: { email: "parent@example.test" }
      } }
    };
    const rawEvent = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac("sha256", stripeSigningSecret).update(`${timestamp}.${rawEvent}`).digest("hex");
    const sendWebhook = () => fetch(`${baseUrl}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${timestamp},v1=${signature}` }, body: rawEvent });
    assert.equal((await sendWebhook()).status, 200);
    assert.equal((await sendWebhook()).status, 200);

    const after = await jsonRequest(baseUrl, "/api/credits", { cookie: accountCookie });
    assert.equal(after.payload.wallet.resources.storyProjects.remaining, before.payload.wallet.resources.storyProjects.remaining + 1);
    assert.equal(after.payload.wallet.resources.imageGenerations.remaining, before.payload.wallet.resources.imageGenerations.remaining + 12);
    assert.equal(after.payload.purchases.filter((item) => item.packageId === "creator-story").length, 1);
    const status = await jsonRequest(baseUrl, `/api/payments/checkout-status?session_id=${checkout.payload.sessionId}`, { cookie: accountCookie });
    assert.equal(status.payload.order.status, "paid");

    async function sendSignedStripeEvent(stripeEvent) {
      const body = JSON.stringify(stripeEvent);
      const signedAt = Math.floor(Date.now() / 1000);
      const signed = crypto.createHmac("sha256", stripeSigningSecret).update(`${signedAt}.${body}`).digest("hex");
      return fetch(`${baseUrl}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${signedAt},v1=${signed}` }, body });
    }
    assert.equal((await sendSignedStripeEvent({
      id: "evt_test_storieslens_dispute_created_123",
      type: "charge.dispute.created",
      data: { object: { id: "dp_test_storieslens_123", payment_intent: "pi_test_storieslens_123", status: "needs_response" } }
    })).status, 200);
    const frozen = await jsonRequest(baseUrl, "/api/credits", { cookie: accountCookie });
    assert.equal(frozen.payload.wallet.resources.storyProjects.remaining, before.payload.wallet.resources.storyProjects.remaining);
    assert.equal(frozen.payload.wallet.resources.imageGenerations.remaining, before.payload.wallet.resources.imageGenerations.remaining);
    assert.equal(frozen.payload.wallet.resources.storyProjects.reserved, 1);
    assert.equal(frozen.payload.wallet.resources.imageGenerations.reserved, 12);

    assert.equal((await sendSignedStripeEvent({
      id: "evt_test_storieslens_dispute_won_123",
      type: "charge.dispute.closed",
      data: { object: { id: "dp_test_storieslens_123", payment_intent: "pi_test_storieslens_123", status: "won" } }
    })).status, 200);
    const restored = await jsonRequest(baseUrl, "/api/credits", { cookie: accountCookie });
    assert.equal(restored.payload.wallet.resources.storyProjects.remaining, before.payload.wallet.resources.storyProjects.remaining + 1);
    assert.equal(restored.payload.wallet.resources.imageGenerations.remaining, before.payload.wallet.resources.imageGenerations.remaining + 12);
    assert.equal(restored.payload.wallet.resources.storyProjects.reserved, 0);
    assert.equal(restored.payload.wallet.resources.imageGenerations.reserved, 0);

    const refundEvent = {
      id: "evt_test_storieslens_refund_123",
      type: "charge.refunded",
      data: { object: {
        id: "ch_test_storieslens_123",
        payment_intent: "pi_test_storieslens_123",
        amount: 1900,
        amount_refunded: 1900,
        refunded: true
      } }
    };
    const rawRefund = JSON.stringify(refundEvent);
    const refundTimestamp = Math.floor(Date.now() / 1000);
    const refundSignature = crypto.createHmac("sha256", stripeSigningSecret).update(`${refundTimestamp}.${rawRefund}`).digest("hex");
    const sendRefund = () => fetch(`${baseUrl}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${refundTimestamp},v1=${refundSignature}` }, body: rawRefund });
    assert.equal((await sendRefund()).status, 200);
    assert.equal((await sendRefund()).status, 200);

    const refunded = await jsonRequest(baseUrl, "/api/credits", { cookie: accountCookie });
    assert.equal(refunded.payload.wallet.resources.storyProjects.remaining, before.payload.wallet.resources.storyProjects.remaining);
    assert.equal(refunded.payload.wallet.resources.imageGenerations.remaining, before.payload.wallet.resources.imageGenerations.remaining);
    assert.equal(refunded.payload.wallet.resources.storyProjects.reversed, 1);
    assert.equal(refunded.payload.wallet.resources.imageGenerations.reversed, 12);
    const refundedStatus = await jsonRequest(baseUrl, `/api/payments/checkout-status?session_id=${checkout.payload.sessionId}`, { cookie: accountCookie });
    assert.equal(refundedStatus.payload.order.status, "refunded");
  } catch (error) {
    error.message += `\nServer output:\n${serverOutput}`;
    throw error;
  }
});
