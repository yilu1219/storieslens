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

  const privateMediaResponse = await request("GET", mediaResponse.payload.media.url);
  assert.strictEqual(privateMediaResponse.statusCode, 200);
  assert.deepStrictEqual(privateMediaResponse.body, Buffer.from("RIFF\0\0\0\0"));
});
