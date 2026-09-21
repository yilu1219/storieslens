const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server.address().port;
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Test server stopped with exit code ${child.exitCode}.`);
    try {
      const response = await fetch(`${baseUrl}/api/platform/status`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the test server.");
}

test("production email authentication sends and verifies a real provider code", { timeout: 20_000 }, async (t) => {
  const deliveries = [];
  const provider = http.createServer((request, response) => {
    let rawBody = "";
    request.on("data", (chunk) => { rawBody += chunk; });
    request.on("end", () => {
      deliveries.push({ url: request.url, headers: request.headers, body: JSON.parse(rawBody) });
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ id: "email_test_123" }));
    });
  });
  const providerPort = await listen(provider);

  const portProbe = http.createServer();
  const productPort = await listen(portProbe);
  await new Promise((resolve) => portProbe.close(resolve));
  const baseUrl = `http://127.0.0.1:${productPort}`;
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-email-auth-"));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(productPort),
      NODE_ENV: "production",
      PLATFORM_DATA_DIR: dataDirectory,
      RESEND_API_KEY: "re_test_key",
      RESEND_API_URL: `http://127.0.0.1:${providerPort}/emails`,
      AUTH_EMAIL_FROM: "StoriesLens <login@storieslens.test>",
      ADMIN_ACCESS_KEY: "StoriesLens-Email-Test-Admin",
      AUTH_DELIVERY_WEBHOOK_URL: "",
      BETA_INVITE_ONLY: "false",
      BETA_ADULT_ACCOUNT_OWNER_ONLY: "false",
      ALLOWED_ACCOUNT_REGIONS: "",
      MEDIA_REQUIRED_REGIONS: "",
      ENFORCE_LAUNCH_GATES: "false"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverOutput = "";
  child.stdout.on("data", (chunk) => { serverOutput += chunk; });
  child.stderr.on("data", (chunk) => { serverOutput += chunk; });
  t.after(() => {
    child.kill("SIGTERM");
    provider.close();
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  });

  try {
    await waitForServer(baseUrl, child);
    const startResponse = await fetch(`${baseUrl}/api/auth/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "email", destination: "creator@example.com" })
    });
    const challenge = await startResponse.json();
    assert.equal(startResponse.status, 200);
    assert.equal(challenge.delivery, "sent");
    assert.equal(Object.hasOwn(challenge, "devCode"), false);
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].url, "/emails");
    assert.equal(deliveries[0].headers.authorization, "Bearer re_test_key");
    assert.match(deliveries[0].headers["idempotency-key"], /^storieslens-auth-/);
    assert.deepEqual(deliveries[0].body.to, ["creator@example.com"]);
    const code = deliveries[0].body.text.match(/\b\d{6}\b/)?.[0];
    assert.match(code, /^\d{6}$/);

    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: challenge.challengeId,
        code,
        method: "email",
        destination: "creator@example.com",
        displayName: "Test Creator",
        ageGroup: "adult",
        primaryRegion: "us",
        countryCode: "US",
        locale: "en"
      })
    });
    const verified = await verifyResponse.json();
    assert.equal(verifyResponse.status, 200);
    assert.equal(verified.authenticated, true);
    assert.equal(verified.user.displayName, "Test Creator");
    const accountCookie = (verifyResponse.headers.get("set-cookie") || "").split(";")[0];
    const creditsResponse = await fetch(`${baseUrl}/api/credits`, { headers: { Cookie: accountCookie } });
    const credits = await creditsResponse.json();
    assert.equal(creditsResponse.status, 200);
    assert.equal(credits.wallet.resources.imageGenerations.remaining, 1);
    assert.equal(credits.freeGift.firstIllustration, true);

    const adminLoginResponse = await fetch(`${baseUrl}/api/admin/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ accessKey: "StoriesLens-Email-Test-Admin" })
    });
    const adminCookie = (adminLoginResponse.headers.get("set-cookie") || "").split(";")[0];
    assert.equal(adminLoginResponse.status, 200);
    const inviteResponse = await fetch(`${baseUrl}/api/admin/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl, Cookie: adminCookie },
      body: JSON.stringify({ region: "us", packageId: "creator-story", count: 1, maxRedemptions: 1, expiresInDays: 7, label: "Email invite test", commercialType: "complimentary", currency: "USD", unitAmountMinor: 0 })
    });
    const invite = await inviteResponse.json();
    assert.equal(inviteResponse.status, 201);
    const sendInviteResponse = await fetch(`${baseUrl}/api/admin/invites/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl, Cookie: adminCookie },
      body: JSON.stringify({ deliveries: [{ email: "parent@example.com", code: invite.codes[0] }] })
    });
    const sentInvite = await sendInviteResponse.json();
    assert.equal(sendInviteResponse.status, 200);
    assert.equal(sentInvite.delivered, 1);
    assert.equal(deliveries.length, 2);
    assert.deepEqual(deliveries[1].body.to, ["parent@example.com"]);
    assert.match(deliveries[1].body.subject, /invitation/i);
    assert.match(deliveries[1].headers["idempotency-key"], /^storieslens-invite-/);
  } catch (error) {
    throw new Error(`${error.message}\nServer output:\n${serverOutput}`);
  }
});
