const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

function cookieValue(response) {
  return (response.headers.get("set-cookie") || "").split(";")[0];
}

async function request(baseUrl, pathname, { method = "GET", body, cookies = [], origin = false, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookies.length ? { Cookie: cookies.join("; ") } : {}),
      ...(origin ? { Origin: baseUrl } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { response, payload: await response.json() };
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Test server stopped with exit code ${child.exitCode}.`);
    try { if ((await fetch(`${baseUrl}/api/admin/session`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the test server.");
}

test("private squad supports approval, shared contributions and credited assembly", { timeout: 20_000 }, async (t) => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-squad-api-"));
  const port = 3149;
  const baseUrl = `http://127.0.0.1:${port}`;
  const accessKey = "StoriesLens-Squad-E2E-2026";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      PLATFORM_DATA_DIR: dataDirectory,
      ADMIN_ACCESS_KEY: accessKey,
      INVITE_CODE_AUTH_ENABLED: "true",
      ALLOWED_ACCOUNT_REGIONS: "us"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  });

  try {
    await waitForServer(baseUrl, child);
    const adminLogin = await request(baseUrl, "/api/admin/session", { method: "POST", origin: true, body: { accessKey } });
    const adminCookie = cookieValue(adminLogin.response);
    const invites = await request(baseUrl, "/api/admin/invites", {
      method: "POST", origin: true, cookies: [adminCookie],
      body: { region: "us", packageId: "invite-cocreate", count: 2, maxRedemptions: 1, expiresInDays: 7, label: "Squad test", commercialType: "complimentary", currency: "USD", unitAmountMinor: 0 }
    });
    assert.equal(invites.response.status, 201);

    async function createAccount(code, displayName) {
      const guest = await request(baseUrl, "/api/auth/session");
      const guestCookie = cookieValue(guest.response);
      const verified = await request(baseUrl, "/api/auth/invite", {
        method: "POST", cookies: [guestCookie],
        body: { betaInviteCode: code, displayName, ageGroup: "adult", locale: "en", primaryRegion: "us", countryCode: "US" }
      });
      assert.equal(verified.response.status, 200);
      return cookieValue(verified.response) || guestCookie;
    }

    const ownerCookie = await createAccount(invites.payload.codes[0], "Parent Owner");
    const memberCookie = await createAccount(invites.payload.codes[1], "Friend Parent");
    const created = await request(baseUrl, "/api/squads", {
      method: "POST", cookies: [ownerCookie],
      body: { title: "The Lantern Team", displayName: "Mia", language: "en", outputType: "book", visualStyle: "storybook-watercolor", characterRules: "Leo has short black hair and carries a silver lantern.", ageGroup: "under18", guardianConfirmed: true }
    });
    assert.equal(created.response.status, 201);
    assert.match(created.payload.squad.joinCode, /^SQ[A-F0-9]{10}$/);
    const squadId = created.payload.squad.id;

    const incompletePhotoConsent = await request(baseUrl, `/api/squads/${squadId}/photo-consent`, {
      method: "POST", origin: true, cookies: [ownerCookie], body: { confirmedAdult: true }
    });
    assert.equal(incompletePhotoConsent.response.status, 400);
    const photoConsent = await request(baseUrl, `/api/squads/${squadId}/photo-consent`, {
      method: "POST", origin: true, cookies: [ownerCookie],
      body: { guardianName: "Parent Owner", relationship: "parent", confirmedAdult: true, approvedPrivateMedia: true, approvedPersonalPhoto: true, acknowledgedRegionalProcessing: true }
    });
    assert.equal(photoConsent.response.status, 201);
    assert.equal(photoConsent.payload.consent.squadId, squadId);
    assert(photoConsent.payload.consent.scopes.includes("regional_ai_processing"));

    const joined = await request(baseUrl, "/api/squads/join", {
      method: "POST", cookies: [memberCookie],
      body: { code: created.payload.squad.joinCode, displayName: "Leo", youngCreator: true, guardianConfirmed: true }
    });
    assert.equal(joined.response.status, 201);
    assert.equal(joined.payload.squad.viewer.status, "pending");

    const ownerView = await request(baseUrl, `/api/squads/${squadId}`, { cookies: [ownerCookie] });
    const pendingMember = ownerView.payload.squad.members.find((member) => member.status === "pending");
    assert.ok(pendingMember);
    const ownerCreditsBeforeApproval = await request(baseUrl, "/api/credits", { cookies: [ownerCookie] });
    const approvedMember = await request(baseUrl, `/api/squads/${squadId}/members/${pendingMember.id}/approve`, { method: "POST", origin: true, cookies: [ownerCookie], body: {} });
    assert.equal(approvedMember.response.status, 200);
    const ownerCreditsAfterApproval = await request(baseUrl, "/api/credits", { cookies: [ownerCookie] });
    assert.equal(
      ownerCreditsAfterApproval.payload.usage.resources.collaboratorSeats.consumed,
      ownerCreditsBeforeApproval.payload.usage.resources.collaboratorSeats.consumed,
      "approving a collaborator is free; each creator pays only for their own generation"
    );

    const posted = await request(baseUrl, `/api/squads/${squadId}/cards`, {
      method: "POST", cookies: [memberCookie], body: { text: "Leo finds a silver feather beside the lantern.", yuGuided: true }
    });
    assert.equal(posted.response.status, 201);
    assert.equal(posted.payload.squad.cards[0].status, "pending");
    assert.equal(posted.payload.squad.cards[0].yuGuided, true);

    const ownerWithCard = await request(baseUrl, `/api/squads/${squadId}`, { cookies: [ownerCookie] });
    const card = ownerWithCard.payload.squad.cards[0];
    const approvedCard = await request(baseUrl, `/api/squads/${squadId}/cards/${card.id}/approve`, { method: "POST", origin: true, cookies: [ownerCookie], body: {} });
    assert.equal(approvedCard.response.status, 200);

    const memberView = await request(baseUrl, `/api/squads/${squadId}`, { cookies: [memberCookie] });
    assert.equal(memberView.payload.squad.cards[0].status, "approved");
    assert.equal(memberView.payload.squad.cards[0].authorName, "Leo");

    const blockedBeforeAnchor = await request(baseUrl, "/api/generate-image", {
      method: "POST", origin: true, cookies: [memberCookie],
      body: { squadId, cardId: card.id, projectId: squadId, prompt: "Leo finds a silver feather." }
    });
    assert.equal(blockedBeforeAnchor.response.status, 409);
    assert.equal(blockedBeforeAnchor.payload.code, "SQUAD_VISUAL_ANCHOR_REQUIRED");

    const memberCannotLockAnchor = await request(baseUrl, `/api/squads/${squadId}/visual-anchor`, {
      method: "POST", origin: true, cookies: [memberCookie],
      body: { imageUrl: "/public/generated/member-candidate.png" }
    });
    assert.equal(memberCannotLockAnchor.response.status, 403);

    const approvedAnchor = await request(baseUrl, `/api/squads/${squadId}/visual-anchor`, {
      method: "POST", origin: true, cookies: [ownerCookie],
      body: { imageUrl: "/public/generated/lantern-team-anchor.png" }
    });
    assert.equal(approvedAnchor.response.status, 200);
    assert.equal(approvedAnchor.payload.squad.visualAnchorReady, true);
    assert.equal(approvedAnchor.payload.squad.visualAnchorImageUrl, "/public/generated/lantern-team-anchor.png");

    const visualAdded = await request(baseUrl, `/api/squads/${squadId}/cards/${card.id}/visual`, {
      method: "POST", cookies: [memberCookie],
      body: { imageUrl: "/public/generated/leo-lantern-scene.png" }
    });
    assert.equal(visualAdded.response.status, 200);
    assert.equal(visualAdded.payload.squad.cards[0].visualStatus, "pending");
    assert.equal(visualAdded.payload.squad.cards[0].imageUrl, "/public/generated/leo-lantern-scene.png");

    const ownerVisualReview = await request(baseUrl, `/api/squads/${squadId}`, { cookies: [ownerCookie] });
    assert.equal(ownerVisualReview.payload.squad.cards[0].visualStatus, "pending");
    assert.equal(ownerVisualReview.payload.squad.cards[0].imageUrl, "/public/generated/leo-lantern-scene.png");

    const approvedVisual = await request(baseUrl, `/api/squads/${squadId}/cards/${card.id}/approve`, {
      method: "POST", origin: true, cookies: [ownerCookie], body: {}
    });
    assert.equal(approvedVisual.response.status, 200);
    assert.equal(approvedVisual.payload.squad.cards[0].visualStatus, "approved");

    const sharedVisual = await request(baseUrl, `/api/squads/${squadId}`, { cookies: [memberCookie] });
    assert.equal(sharedVisual.payload.squad.cards[0].imageUrl, "/public/generated/leo-lantern-scene.png");
    assert.equal(sharedVisual.payload.squad.visualAnchorReady, true);
    assert.equal(sharedVisual.payload.squad.visualAnchorImageUrl, "/public/generated/lantern-team-anchor.png");
    assert.equal(sharedVisual.payload.squad.visualStyle, "storybook-watercolor");
    assert.match(sharedVisual.payload.squad.characterRules, /silver lantern/);

    const assembled = await request(baseUrl, `/api/squads/${squadId}/assemble`, {
      method: "POST", origin: true, cookies: [ownerCookie], body: {}, headers: { "Idempotency-Key": `assemble-${squadId}` }
    });
    assert.equal(assembled.response.status, 201);
    assert.equal(assembled.payload.project.scenes[0].text, "Leo finds a silver feather beside the lantern.");
    assert.equal(assembled.payload.project.scenes[0].imageUrl, "/public/generated/leo-lantern-scene.png");
    assert.equal(assembled.payload.project.clientSnapshot.credits[0].authorName, "Leo");
    assert.equal(assembled.payload.project.clientSnapshot.credits[0].yuGuided, true);
  } catch (error) {
    error.message += `\nServer output:\n${output}`;
    throw error;
  }
});
