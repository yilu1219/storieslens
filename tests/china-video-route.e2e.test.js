const assert = require("node:assert/strict");
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
    try { if ((await fetch(`${baseUrl}/api/admin/session`)).ok) return; } catch {}
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

test("a Mainland account uses Ark Seedance and saves the result in private regional media", { timeout: 20_000 }, async (t) => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-cn-video-"));
  let submittedPayload;
  const provider = http.createServer((request, response) => {
    if (request.url === "/contents/generations/tasks" && request.method === "POST") {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => {
        submittedPayload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ id: "cgt-cn-test-1", status: "queued" }));
      });
      return;
    }
    if (request.url === "/contents/generations/tasks/cgt-cn-test-1" && request.method === "GET") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        id: "cgt-cn-test-1",
        status: "succeeded",
        content: { video_url: `http://127.0.0.1:${provider.address().port}/result.mp4` }
      }));
      return;
    }
    if (request.url === "/result.mp4") {
      const video = Buffer.from("private-test-video");
      response.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": video.length });
      response.end(video);
      return;
    }
    response.writeHead(404).end();
  });
  await new Promise((resolve) => provider.listen(0, "127.0.0.1", resolve));

  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const accessKey = "StoriesLens-China-Video-E2E";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      PLATFORM_DATA_DIR: dataDirectory,
      ADMIN_ACCESS_KEY: accessKey,
      INVITE_CODE_AUTH_ENABLED: "true",
      BETA_INVITE_ONLY: "true",
      ALLOWED_ACCOUNT_REGIONS: "cn",
      REQUIRE_EXTERNAL_MEDIA_MODERATION: "false",
      SAFE_VIDEO_GENERATION_ENABLED: "true",
      CHINA_ARK_BASE_URL: `http://127.0.0.1:${provider.address().port}`,
      CHINA_ARK_API_KEY: "test-ark-key",
      CHINA_ARK_VIDEO_ENABLED: "true",
      CHINA_ARK_VIDEO_MODEL: "doubao-seedance-2-0-mini-260615",
      CHINA_ARK_VIDEO_API_URL: `http://127.0.0.1:${provider.address().port}/contents/generations/tasks`,
      CHINA_ARK_VIDEO_COST_CNY_PER_SECOND: "0.10",
      CHINA_CNY_PER_USD: "7.20",
      MEDIA_VOLUME_REGIONS: "cn"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  t.after(() => {
    child.kill("SIGTERM");
    provider.close();
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  });

  try {
    await waitForServer(baseUrl, child);
    const adminLogin = await jsonRequest(baseUrl, "/api/admin/session", { method: "POST", body: { accessKey }, origin: true });
    const adminCookie = cookieValue(adminLogin.response);
    const invite = await jsonRequest(baseUrl, "/api/admin/invites", {
      method: "POST", cookie: adminCookie, origin: true,
      body: { region: "cn", packageId: "movie-30", count: 1, maxRedemptions: 1, expiresInDays: 2, label: "China video test", commercialType: "complimentary", currency: "CNY", unitAmountMinor: 0 }
    });
    assert.equal(invite.response.status, 201);
    const guest = await jsonRequest(baseUrl, "/api/auth/session");
    const guestCookie = cookieValue(guest.response);
    const auth = await jsonRequest(baseUrl, "/api/auth/invite", {
      method: "POST", cookie: guestCookie,
      body: { displayName: "Mainland Parent", ageGroup: "adult", locale: "zh", primaryRegion: "cn", countryCode: "CN", betaInviteCode: invite.payload.codes[0] }
    });
    assert.equal(auth.response.status, 200);
    const accountCookie = cookieValue(auth.response) || guestCookie;

    const started = await jsonRequest(baseUrl, "/api/generate-video", {
      method: "POST", cookie: accountCookie,
      body: {
        imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        prompt: "A child-safe paper bird opens its wings.",
        duration: 5,
        projectId: "cn-test-story"
      }
    });
    assert.equal(started.response.status, 202);
    assert.equal(started.payload.jobId, "cgt-cn-test-1");
    assert.equal(submittedPayload.model, "doubao-seedance-2-0-mini-260615");
    assert.equal(submittedPayload.content[1].role, "first_frame");
    assert.equal(submittedPayload.generate_audio, false);
    assert.equal(submittedPayload.watermark, true);

    const completed = await jsonRequest(baseUrl, started.payload.pollUrl, { cookie: accountCookie });
    assert.equal(completed.response.status, 200);
    assert.equal(completed.payload.status, "completed");
    assert.match(completed.payload.videoUrl, /^\/api\/media\//);
    const privateVideo = await fetch(`${baseUrl}${completed.payload.videoUrl}`, { headers: { Cookie: accountCookie } });
    assert.equal(privateVideo.status, 200);
    assert.equal(privateVideo.headers.get("content-type"), "video/mp4");
    assert.equal(await privateVideo.text(), "private-test-video");
  } catch (error) {
    throw new Error(`${error.message}\nServer output:\n${output}`);
  }
});
