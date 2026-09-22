const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createPlatformApi } = require("../platform-api");

function responseHarness() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode;
      Object.entries(headers).forEach(([name, value]) => this.setHeader(name, value));
    },
    end(body) { this.body = body; }
  };
}

test("teacher classroom publishing records permission, meters approved work, and shares private images", async (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-teacher-classroom-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const environmentKeys = ["NODE_ENV", "ADMIN_ACCESS_KEY", "ALLOWED_ACCOUNT_REGIONS", "BETA_INVITE_ONLY", "INVITE_CODE_AUTH_ENABLED"];
  const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    NODE_ENV: "test",
    ADMIN_ACCESS_KEY: "Teacher-E2E-Admin-Key",
    ALLOWED_ACCOUNT_REGIONS: "us",
    BETA_INVITE_ONLY: "true",
    INVITE_CODE_AUTH_ENABLED: "true"
  });
  context.after(() => {
    Object.entries(previousEnvironment).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

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

  async function request(method, pathname, body, cookie = "") {
    const response = responseHarness();
    const handled = await handle({
      method,
      headers: { ...(cookie ? { cookie } : {}), origin: "http://localhost", host: "localhost" },
      socket: {},
      body
    }, response, new URL(pathname, "http://localhost"));
    assert.equal(handled, true);
    return response;
  }

  const adminLogin = await request("POST", "/api/admin/session", { accessKey: process.env.ADMIN_ACCESS_KEY });
  assert.equal(adminLogin.statusCode, 200);
  const adminCookie = adminLogin.headers["set-cookie"].split(";")[0];
  const invite = await request("POST", "/api/admin/invites", {
    region: "us",
    packageId: "teacher-classroom",
    count: 1,
    maxRedemptions: 1,
    expiresInDays: 7,
    label: "Teacher classroom test",
    commercialType: "complimentary",
    currency: "USD",
    unitAmountMinor: 0
  }, adminCookie);
  assert.equal(invite.statusCode, 201);

  const guestSession = await request("GET", "/api/auth/session");
  const guestCookie = guestSession.headers["set-cookie"].split(";")[0];
  const signedIn = await request("POST", "/api/auth/invite", {
    displayName: "Teacher Test",
    ageGroup: "adult",
    locale: "en",
    primaryRegion: "us",
    countryCode: "US",
    betaInviteCode: invite.payload.codes[0]
  }, guestCookie);
  assert.equal(signedIn.statusCode, 200);
  const teacherCookie = signedIn.headers["set-cookie"]?.split(";")[0] || guestCookie;

  const created = await request("POST", "/api/projects", {
    title: "Room 12 Stories",
    language: "en",
    ageGroup: "adult",
    mode: "classroom",
    visibility: "invite",
    sourceType: "classroom"
  }, teacherCookie);
  assert.equal(created.statusCode, 201);
  assert.equal(created.payload.wallet.resources.classroomProjects.remaining, 0);
  const projectId = created.payload.project.id;

  const incompletePermission = await request("POST", `/api/projects/${projectId}/classroom-consent`, {
    attesterName: "Teacher Test",
    confirmedAdult: true
  }, teacherCookie);
  assert.equal(incompletePermission.statusCode, 400);

  const permission = await request("POST", `/api/projects/${projectId}/classroom-consent`, {
    attesterName: "Teacher Test",
    confirmedAdult: true,
    documentedGuardianPermission: true,
    approvedPrivateMedia: true,
    approvedFamilySharing: true,
    approvedPrinting: true,
    approvedClassFilm: true,
    acknowledgedRegionalProcessing: true
  }, teacherCookie);
  assert.equal(permission.statusCode, 201);
  assert(permission.payload.consent.scopes.includes("class_film"));

  const mediaBody = {
    projectId,
    dataUrl: "data:image/webp;base64,UklGRgAAAAA=",
    metadataRemoved: true,
    purpose: "classroom-work",
    personalPhotoConsentId: permission.payload.consent.id,
    uploadId: "student-work-1"
  };
  const uploaded = await request("POST", "/api/media", mediaBody, teacherCookie);
  assert.equal(uploaded.statusCode, 201);
  const duplicate = await request("POST", "/api/media", mediaBody, teacherCookie);
  assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.payload.media.id, uploaded.payload.media.id);

  const credits = await request("GET", "/api/credits", undefined, teacherCookie);
  assert.equal(credits.payload.wallet.resources.studentWorks.remaining, 29);
  assert.equal(credits.payload.usage.resources.studentWorks.consumed, 1);

  const patched = await request("PATCH", `/api/projects/${projectId}`, {
    coverImageUrl: uploaded.payload.media.url,
    scenes: [{ id: "page-1", title: "A student story", text: "Creator nickname", imageUrl: uploaded.payload.media.url }]
  }, teacherCookie);
  assert.equal(patched.statusCode, 200);

  const shared = await request("POST", `/api/projects/${projectId}/share`, {}, teacherCookie);
  assert.equal(shared.statusCode, 201);
  const sharePath = new URL(shared.payload.shareUrl, "http://localhost").pathname;
  const shareToken = sharePath.split("/").filter(Boolean).pop();
  const familyView = await request("GET", `/api/shares/${shareToken}`);
  assert.equal(familyView.statusCode, 200);
  assert.match(familyView.payload.project.scenes[0].imageUrl, /^\/api\/shares\/[^/]+\/media\//);
  const privateImage = await request("GET", familyView.payload.project.scenes[0].imageUrl);
  assert.equal(privateImage.statusCode, 200);
  assert.deepEqual(privateImage.body, Buffer.from("RIFF\0\0\0\0"));

  const revoked = await request("DELETE", `/api/projects/${projectId}/consents/${permission.payload.consent.id}`, undefined, teacherCookie);
  assert.equal(revoked.statusCode, 200);
  assert.equal(revoked.payload.personalPhotoMediaDeleted, 1);
  assert.equal((await request("GET", sharePath)).statusCode, 404);
});
