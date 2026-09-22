const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createPlatformApi } = require("../platform-api");

test("a mobile guest can create a private project, store approved artwork, and read it back", async (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-upload-flow-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  let cookie = "";

  const handle = createPlatformApi({
    root,
    readJsonBody: async (request) => request.body || {},
    sendJson(response, statusCode, payload) {
      response.statusCode = statusCode;
      response.payload = payload;
    },
    enforceTextSafety: async () => {},
    enforceImageSafety: async () => {},
    reviewArtworkSafety: async () => ({ approved: true, reasonCode: "approved", statusCode: 200 })
  });

  async function request(method, pathname, body) {
    const response = {
      headers: {},
      setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
      writeHead(statusCode, headers = {}) {
        this.statusCode = statusCode;
        Object.entries(headers).forEach(([name, value]) => this.setHeader(name, value));
      },
      end(bodyValue) { this.body = bodyValue; }
    };
    const handled = await handle({ method, headers: { cookie }, socket: {}, body }, response, new URL(pathname, "http://localhost"));
    assert.strictEqual(handled, true);
    if (response.headers["set-cookie"]) cookie = response.headers["set-cookie"].split(";")[0];
    return response;
  }

  const projectResponse = await request("POST", "/api/projects", {
    title: "Untitled story",
    language: "en",
    ageGroup: "adult",
    mode: "solo",
    visibility: "private",
    sourceType: "artwork"
  });
  assert.strictEqual(projectResponse.statusCode, 201);
  assert.match(cookie, /^storieslens_session=/);

  const projectId = projectResponse.payload.project.id;
  const mediaResponse = await request("POST", "/api/media", {
    projectId,
    dataUrl: "data:image/webp;base64,UklGRgAAAAA=",
    metadataRemoved: true,
    purpose: "artwork"
  });
  assert.strictEqual(mediaResponse.statusCode, 201);
  assert.strictEqual(mediaResponse.payload.media.private, true);
  assert.strictEqual(mediaResponse.payload.media.projectId, projectId);

  const patchResponse = await request("PATCH", `/api/projects/${projectId}`, {
    title: "The Star Keeper",
    draft: "A child follows a small light into the night.",
    coverImageUrl: mediaResponse.payload.media.url,
    scenes: [{ id: "scene-1", text: "A child follows a small light into the night.", imageUrl: mediaResponse.payload.media.url }]
  });
  assert.strictEqual(patchResponse.statusCode, 200);
  assert.strictEqual(patchResponse.payload.project.coverImageUrl, mediaResponse.payload.media.url);

  const libraryResponse = await request("GET", "/api/projects");
  assert.strictEqual(libraryResponse.statusCode, 200);
  assert.strictEqual(libraryResponse.payload.projects.length, 1);
  assert.strictEqual(libraryResponse.payload.projects[0].title, "The Star Keeper");

  const guestCredits = await request("GET", "/api/credits");
  assert.strictEqual(guestCredits.payload.wallet.resources.imageGenerations.remaining, 1);
  assert.strictEqual(guestCredits.payload.freeGift.firstIllustration, true);

  const privateMediaResponse = await request("GET", mediaResponse.payload.media.url);
  assert.strictEqual(privateMediaResponse.statusCode, 200);
  assert.deepStrictEqual(privateMediaResponse.body, Buffer.from("RIFF\0\0\0\0"));
});

test("an adult can consent to a personal photo and revocation or permanent deletion removes the stored copy", async (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-personal-photo-flow-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const previousEnvironment = Object.fromEntries([
    "NODE_ENV",
    "ALLOWED_ACCOUNT_REGIONS",
    "BETA_INVITE_ONLY",
    "BETA_ADULT_ACCOUNT_OWNER_ONLY",
    "REAL_PERSON_PHOTO_UPLOADS_ENABLED",
    "REAL_PERSON_PHOTO_REQUIRE_ACCOUNT",
    "REQUIRE_PERSONAL_PHOTO_CONSENT"
  ].map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    NODE_ENV: "test",
    ALLOWED_ACCOUNT_REGIONS: "cn",
    BETA_INVITE_ONLY: "false",
    BETA_ADULT_ACCOUNT_OWNER_ONLY: "true",
    REAL_PERSON_PHOTO_UPLOADS_ENABLED: "false",
    REAL_PERSON_PHOTO_REQUIRE_ACCOUNT: "true",
    REQUIRE_PERSONAL_PHOTO_CONSENT: "true"
  });
  context.after(() => {
    Object.entries(previousEnvironment).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  let cookie = "";
  const handle = createPlatformApi({
    root,
    readJsonBody: async (request) => request.body || {},
    sendJson(response, statusCode, payload) {
      response.statusCode = statusCode;
      response.payload = payload;
    },
    enforceTextSafety: async () => {},
    enforceImageSafety: async () => {},
    reviewArtworkSafety: async () => ({ approved: true, reasonCode: "approved", statusCode: 200, checks: { realPerson: true } })
  });

  async function request(method, pathname, body) {
    const response = {
      headers: {},
      setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
      writeHead(statusCode, headers = {}) {
        this.statusCode = statusCode;
        Object.entries(headers).forEach(([name, value]) => this.setHeader(name, value));
      },
      end(bodyValue) { this.body = bodyValue; }
    };
    const handled = await handle({ method, headers: { cookie }, socket: {}, body }, response, new URL(pathname, "http://localhost"));
    assert.strictEqual(handled, true);
    if (response.headers["set-cookie"]) cookie = response.headers["set-cookie"].split(";")[0];
    return response;
  }

  const destination = "parent@example.test";
  const started = await request("POST", "/api/auth/start", { method: "email", destination });
  assert.strictEqual(started.statusCode, 200);
  assert.match(started.payload.devCode, /^\d{6}$/);
  const verified = await request("POST", "/api/auth/verify", {
    method: "email",
    destination,
    challengeId: started.payload.challengeId,
    code: started.payload.devCode,
    primaryRegion: "cn",
    countryCode: "CN",
    ageGroup: "adult",
    displayName: "Parent"
  });
  assert.strictEqual(verified.statusCode, 200);
  assert.strictEqual(verified.payload.authenticated, true);

  const registeredCredits = await request("GET", "/api/credits");
  assert.strictEqual(registeredCredits.payload.wallet.resources.imageGenerations.remaining, 1);
  assert.strictEqual(registeredCredits.payload.freeGift.firstIllustration, true);

  const created = await request("POST", "/api/projects", {
    title: "Private family story",
    language: "zh",
    ageGroup: "under18",
    mode: "family",
    visibility: "private",
    sourceType: "artwork"
  });
  assert.strictEqual(created.statusCode, 201);
  const projectId = created.payload.project.id;

  const missingProcessingConsent = await request("POST", `/api/projects/${projectId}/photo-consent`, {
    confirmedAdult: true,
    approvedPrivateMedia: true,
    approvedPersonalPhoto: true,
    guardianName: "Parent",
    relationship: "parent"
  });
  assert.strictEqual(missingProcessingConsent.statusCode, 400);

  const consentResponse = await request("POST", `/api/projects/${projectId}/photo-consent`, {
    confirmedAdult: true,
    approvedPrivateMedia: true,
    approvedPersonalPhoto: true,
    acknowledgedRegionalProcessing: true,
    guardianName: "Parent",
    relationship: "parent"
  });
  assert.strictEqual(consentResponse.statusCode, 201);
  assert(consentResponse.payload.consent.scopes.includes("regional_ai_processing"));
  const consentId = consentResponse.payload.consent.id;

  const personalPhoto = await request("POST", "/api/media", {
    projectId,
    dataUrl: "data:image/webp;base64,UklGRgAAAAA=",
    metadataRemoved: true,
    personalPhotoConsentId: consentId,
    purpose: "personal-photo-reference"
  });
  assert.strictEqual(personalPhoto.statusCode, 201);
  const firstMediaUrl = personalPhoto.payload.media.url;
  assert.strictEqual((await request("GET", firstMediaUrl)).statusCode, 200);

  const revoked = await request("DELETE", `/api/projects/${projectId}/consents/${consentId}`);
  assert.strictEqual(revoked.statusCode, 200);
  assert.strictEqual(revoked.payload.personalPhotoMediaDeleted, 1);
  assert.strictEqual((await request("GET", firstMediaUrl)).statusCode, 404);

  const secondConsent = await request("POST", `/api/projects/${projectId}/photo-consent`, {
    confirmedAdult: true,
    approvedPrivateMedia: true,
    approvedPersonalPhoto: true,
    acknowledgedRegionalProcessing: true,
    guardianName: "Parent",
    relationship: "parent"
  });
  const secondPhoto = await request("POST", "/api/media", {
    projectId,
    dataUrl: "data:image/webp;base64,UklGRgAAAAA=",
    metadataRemoved: true,
    personalPhotoConsentId: secondConsent.payload.consent.id,
    purpose: "personal-photo-reference"
  });
  const secondMediaUrl = secondPhoto.payload.media.url;
  const permanentlyDeleted = await request("DELETE", `/api/projects/${projectId}?permanent=true`, { confirmation: "DELETE PROJECT AND MEDIA" });
  assert.strictEqual(permanentlyDeleted.statusCode, 200);
  assert.strictEqual(permanentlyDeleted.payload.mediaDeleted, 1);
  assert.strictEqual((await request("GET", secondMediaUrl)).statusCode, 404);
  assert.strictEqual((await request("GET", `/api/projects/${projectId}`)).statusCode, 404);
});
