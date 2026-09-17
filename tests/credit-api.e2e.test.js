const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const nodeBinary = process.execPath;

function cookieValue(response) {
  const value = response.headers.get("set-cookie") || "";
  return value.split(";")[0];
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

async function request(baseUrl, pathname, { method = "GET", body, cookies = [], origin = false } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookies.length ? { Cookie: cookies.join("; ") } : {}),
      ...(origin ? { Origin: baseUrl } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  return { response, payload };
}

test("founder can issue a regional invite, onboard a creator, and grant auditable allowances", { timeout: 20_000 }, async (t) => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-credit-api-"));
  const port = 3137;
  const baseUrl = `http://127.0.0.1:${port}`;
  const accessKey = "StoriesLens-E2E-Admin-2026";
  const provider = http.createServer((request, response) => {
    if (request.url !== "/chat/completions" || request.method !== "POST") {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        reply: "Your opening gives the reader a clear place to begin.",
        strength: "A clear opening image.",
        priority: "Add one sensory detail.",
        microLesson: "Specific details help readers picture a scene.",
        question: "What can the character hear?",
        task: "Add one sound in your own words.",
        suggestion: "",
        readyForVisual: false,
        visualBrief: "",
        authorshipCheck: "pass"
      }) } }],
      usage: { prompt_tokens: 120, completion_tokens: 36, cost: 0.0123 }
    }));
  });
  await new Promise((resolve) => provider.listen(0, "127.0.0.1", resolve));
  const providerPort = provider.address().port;
  const child = spawn(nodeBinary, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      PLATFORM_DATA_DIR: dataDirectory,
      ADMIN_ACCESS_KEY: accessKey,
      INVITE_CODE_AUTH_ENABLED: "true",
      BETA_INVITE_ONLY: "true",
      ALLOWED_ACCOUNT_REGIONS: "us",
      OPENROUTER_API_KEY: "test-openrouter-key",
      OPENROUTER_BASE_URL: `http://127.0.0.1:${providerPort}`,
      OPENROUTER_MODEL: "test/yu-cost-model"
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

    const adminLogin = await request(baseUrl, "/api/admin/session", {
      method: "POST",
      body: { accessKey },
      origin: true
    });
    assert.equal(adminLogin.response.status, 200);
    const adminCookie = cookieValue(adminLogin.response);
    assert.match(adminCookie, /^storieslens_admin=/);

    const inviteCreation = await request(baseUrl, "/api/admin/invites", {
      method: "POST",
      cookies: [adminCookie],
      origin: true,
      body: {
        region: "us",
        packageId: "creator-story",
        count: 2,
        maxRedemptions: 1,
        expiresInDays: 14,
        label: "Founding creator beta",
        commercialType: "paid",
        currency: "USD",
        unitAmountMinor: 1900
      }
    });
    assert.equal(inviteCreation.response.status, 201);
    assert.equal(inviteCreation.payload.codes.length, 2);
    const inviteCode = inviteCreation.payload.codes[0];

    const guestSession = await request(baseUrl, "/api/auth/session");
    const userCookie = cookieValue(guestSession.response);
    assert.match(userCookie, /^storieslens_session=/);

    const authVerify = await request(baseUrl, "/api/auth/invite", {
      method: "POST",
      cookies: [userCookie],
      body: {
        displayName: "Beta Creator",
        ageGroup: "adult",
        locale: "en",
        primaryRegion: "us",
        countryCode: "US",
        betaInviteCode: inviteCode
      }
    });
    assert.equal(authVerify.response.status, 200);
    const accountCookie = cookieValue(authVerify.response) || userCookie;

    const initialCredits = await request(baseUrl, "/api/credits", { cookies: [accountCookie] });
    assert.equal(initialCredits.payload.wallet.resources.storyProjects.remaining, 2);
    assert.equal(initialCredits.payload.wallet.resources.imageGenerations.remaining, 15);

    const users = await request(baseUrl, "/api/admin/users?query=Beta%20Creator", { cookies: [adminCookie] });
    assert.equal(users.payload.users.length, 1);
    const userId = users.payload.users[0].id;

    const grant = await request(baseUrl, "/api/admin/grants", {
      method: "POST",
      cookies: [adminCookie],
      origin: true,
      body: { userId, packageId: "movie-30", idempotencyKey: "e2e-manual-grant-1", note: "Founder beta" }
    });
    assert.equal(grant.response.status, 201);
    assert.equal(grant.payload.wallet.resources.videoClips.remaining, 6);

    const project = await request(baseUrl, "/api/projects", {
      method: "POST",
      cookies: [accountCookie],
      body: { title: "Allowance Test Story", mode: "solo", sourceText: "A child follows a lantern into a library." }
    });
    assert.equal(project.response.status, 201);
    assert.equal(project.payload.wallet.resources.storyProjects.remaining, 1);

    const coaching = await request(baseUrl, "/api/writing-assistant", {
      method: "POST",
      cookies: [accountCookie],
      body: { action: "hint", storyLanguage: "en", grade: "3", studentDraft: "A child follows a lantern into a library." }
    });
    assert.equal(coaching.response.status, 200);

    const usage = await request(baseUrl, "/api/credits", { cookies: [accountCookie] });
    assert.equal(usage.payload.usage.resources.storyProjects.consumed, 1);
    assert.equal(usage.payload.purchases[0].amountMinor, 1900);
    assert.equal(usage.payload.purchases[0].currency, "USD");
    assert.equal(Object.hasOwn(usage.payload.recentActivity.find((entry) => entry.type === "consumption"), "costUsd"), false);

    const refreshedUsers = await request(baseUrl, "/api/admin/users?query=Beta%20Creator", { cookies: [adminCookie] });
    assert.equal(refreshedUsers.payload.users[0].usage.totals.consumedUnits, 1);
    assert.equal(refreshedUsers.payload.users[0].usage.totals.recordedRevenueMinor.usd, 1900);
    assert.equal(refreshedUsers.payload.users[0].usage.totals.modelOperations, 1);
    assert.equal(refreshedUsers.payload.users[0].usage.totals.recordedCostUsd, 0.0123);

    const summary = await request(baseUrl, "/api/admin/summary", { cookies: [adminCookie] });
    assert.equal(summary.payload.recordedRevenueMinor.usd, 1900);
    assert.equal(summary.payload.unpricedConsumptions, 0);
    assert.equal(summary.payload.modelOperations, 1);
    assert.equal(summary.payload.recordedModelCostUsd, 0.0123);

    const ledger = await request(baseUrl, "/api/admin/ledger", { cookies: [adminCookie] });
    assert.equal(ledger.payload.sales.length, 1);
    assert.equal(ledger.payload.modelUsage.length, 1);
    assert.equal(ledger.payload.modelUsage[0].model, "OPENROUTER:test/yu-cost-model");
    assert.equal(ledger.payload.modelUsage[0].costUsd, 0.0123);

    const batches = await request(baseUrl, "/api/admin/invites", { cookies: [adminCookie] });
    assert.equal(batches.payload.batches[0].totalRedemptions, 1);

    const database = JSON.parse(fs.readFileSync(path.join(dataDirectory, "platform.json"), "utf8"));
    assert.equal(JSON.stringify(database).includes(inviteCode), false, "raw invitation codes must never be stored");
    assert.ok(database.creditTransactions.some((entry) => entry.type === "consumption" && entry.resource === "storyProjects"));
    assert.equal(database.creditSales[0].amountMinor, 1900);
  } catch (error) {
    error.message += `\nServer output:\n${serverOutput}`;
    throw error;
  }
});
