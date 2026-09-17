const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createRegionalObjectStorage, createSignedRequest } = require("../regional-object-storage");

test("local development fallback keeps private media inside its dedicated directory", async (context) => {
  const mediaDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-media-"));
  context.after(() => fs.rmSync(mediaDirectory, { recursive: true, force: true }));
  const storage = createRegionalObjectStorage({ mediaDirectory });
  const body = Buffer.from("private artwork bytes");
  const stored = await storage.put({
    user: { id: "creator-1", primaryRegion: "us" },
    key: "creator-1/story-1/artwork.webp",
    buffer: body,
    contentType: "image/webp"
  });

  assert.strictEqual(stored.storageProvider, "local");
  assert.strictEqual(fs.statSync(stored.filePath).mode & 0o777, 0o600);
  const loaded = await storage.get({ ...stored, mimeType: "image/webp" });
  assert.deepStrictEqual(loaded.body, body);
  assert.strictEqual(loaded.contentType, "image/webp");
  await storage.remove(stored);
  assert.strictEqual(fs.existsSync(stored.filePath), false);
  assert.deepStrictEqual(storage.status(), { cn: "local-fallback", us: "local-fallback", intl: "local-fallback" });
});

test("regional storage rejects path traversal and unsafe launch configuration", async (context) => {
  const mediaDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-media-"));
  context.after(() => fs.rmSync(mediaDirectory, { recursive: true, force: true }));
  const storage = createRegionalObjectStorage({ mediaDirectory });

  await assert.rejects(
    storage.put({ user: {}, key: "../escape.jpg", buffer: Buffer.from("x"), contentType: "image/jpeg" }),
    /Invalid private-media storage key/
  );
  assert.throws(() => storage.assertReady("us"), /not configured for required regions: us/);
  assert.throws(() => storage.assertReady("moon"), /Unknown MEDIA_REQUIRED_REGIONS value/);
});

test("S3-compatible request signing never places credentials in the URL", () => {
  const signed = createSignedRequest({
    endpoint: "https://account.r2.cloudflarestorage.com",
    bucket: "storieslens-media-us",
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    sessionToken: "",
    signingRegion: "auto",
    service: "s3",
    protocol: "s3",
    addressingStyle: "path"
  }, "PUT", "creator/story/artwork.webp", Buffer.from("art"), "image/webp");

  assert.strictEqual(signed.url.protocol, "https:");
  assert.strictEqual(signed.url.pathname, "/storieslens-media-us/creator/story/artwork.webp");
  assert.match(signed.headers.authorization, /^AWS4-HMAC-SHA256 Credential=test-access-key\//);
  assert(!signed.url.toString().includes("test-access-key"));
  assert(!JSON.stringify(signed).includes("test-secret-key"));
});

test("Volcengine TOS signing uses native headers and virtual-hosted bucket URLs", () => {
  const signed = createSignedRequest({
    endpoint: "https://tos-cn-beijing.volces.com",
    bucket: "storieslens-cn-private-2026",
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    sessionToken: "",
    signingRegion: "cn-beijing",
    service: "tos",
    protocol: "tos",
    addressingStyle: "virtual"
  }, "PUT", "creator/story/artwork.webp", Buffer.from("art"), "image/webp");

  assert.strictEqual(signed.url.protocol, "https:");
  assert.strictEqual(signed.url.hostname, "storieslens-cn-private-2026.tos-cn-beijing.volces.com");
  assert.strictEqual(signed.url.pathname, "/creator/story/artwork.webp");
  assert.match(signed.headers.authorization, /^TOS4-HMAC-SHA256 Credential=test-access-key\/\d{8}\/cn-beijing\/tos\/request,/);
  assert.match(signed.headers["x-tos-date"], /^\d{8}T\d{6}Z$/);
  assert.match(signed.headers["x-tos-content-sha256"], /^[a-f0-9]{64}$/);
  assert(!("x-amz-date" in signed.headers));
  assert(!signed.url.toString().includes("test-access-key"));
  assert(!JSON.stringify(signed).includes("test-secret-key"));
});

test("Volcengine TOS signing matches the official fixed-date signature example", () => {
  const signed = createSignedRequest({
    endpoint: "https://tos-cn-beijing.volces.com",
    bucket: "examplebucket",
    accessKeyId: "testAK",
    secretAccessKey: "testSK",
    sessionToken: "",
    signingRegion: "cn-beijing",
    service: "tos",
    protocol: "tos",
    addressingStyle: "virtual"
  }, "GET", "exampleobject", null, "", new Date("2022-01-01T00:00:00Z"));

  assert.strictEqual(
    signed.headers.authorization,
    "TOS4-HMAC-SHA256 Credential=testAK/20220101/cn-beijing/tos/request,SignedHeaders=host;x-tos-content-sha256;x-tos-date, Signature=d40b66cf0054d1642843670d10fa095e1609c7896f25df217770b0abe717693b"
  );
});

test("China media storage sends a real TOS request when CN credentials are configured", async (context) => {
  const keys = [
    "MEDIA_CN_ENDPOINT",
    "MEDIA_CN_BUCKET",
    "MEDIA_CN_ACCESS_KEY_ID",
    "MEDIA_CN_SECRET_ACCESS_KEY",
    "MEDIA_CN_SIGNING_REGION",
    "MEDIA_CN_PROTOCOL",
    "MEDIA_CN_ADDRESSING_STYLE"
  ];
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const originalFetch = global.fetch;
  context.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    global.fetch = originalFetch;
  });
  Object.assign(process.env, {
    MEDIA_CN_ENDPOINT: "https://tos-cn-beijing.volces.com",
    MEDIA_CN_BUCKET: "storieslens-cn-private-2026",
    MEDIA_CN_ACCESS_KEY_ID: "test-access-key",
    MEDIA_CN_SECRET_ACCESS_KEY: "test-secret-key",
    MEDIA_CN_SIGNING_REGION: "cn-beijing",
    MEDIA_CN_PROTOCOL: "tos",
    MEDIA_CN_ADDRESSING_STYLE: "virtual"
  });
  let request;
  global.fetch = async (url, options) => {
    request = { url: String(url), options };
    return { ok: true, status: 200, headers: new Headers({ etag: '"stored-etag"' }) };
  };
  const mediaDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-media-cn-"));
  context.after(() => fs.rmSync(mediaDirectory, { recursive: true, force: true }));
  const storage = createRegionalObjectStorage({ mediaDirectory });

  const stored = await storage.put({
    user: { id: "creator-cn", primaryRegion: "cn" },
    key: "creator-cn/story/artwork.webp",
    buffer: Buffer.from("private artwork"),
    contentType: "image/webp"
  });

  assert.strictEqual(storage.status().cn, "cloud-private");
  assert.strictEqual(stored.storageProvider, "tos");
  assert.strictEqual(stored.storageRegion, "cn");
  assert.strictEqual(stored.storageEtag, "stored-etag");
  assert.strictEqual(request.url, "https://storieslens-cn-private-2026.tos-cn-beijing.volces.com/creator-cn/story/artwork.webp");
  assert.match(request.options.headers.authorization, /^TOS4-HMAC-SHA256 /);
});

test("regional storage reads the documented MEDIA_US environment names", (context) => {
  const original = {
    endpoint: process.env.MEDIA_US_ENDPOINT,
    bucket: process.env.MEDIA_US_BUCKET,
    access: process.env.MEDIA_US_ACCESS_KEY_ID,
    secret: process.env.MEDIA_US_SECRET_ACCESS_KEY
  };
  context.after(() => {
    for (const [suffix, value] of Object.entries({ ENDPOINT: original.endpoint, BUCKET: original.bucket, ACCESS_KEY_ID: original.access, SECRET_ACCESS_KEY: original.secret })) {
      const key = `MEDIA_US_${suffix}`;
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  process.env.MEDIA_US_ENDPOINT = "https://account.r2.cloudflarestorage.com";
  process.env.MEDIA_US_BUCKET = "storieslens-us";
  process.env.MEDIA_US_ACCESS_KEY_ID = "access";
  process.env.MEDIA_US_SECRET_ACCESS_KEY = "secret";
  const mediaDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-media-env-"));
  context.after(() => fs.rmSync(mediaDirectory, { recursive: true, force: true }));
  assert.strictEqual(createRegionalObjectStorage({ mediaDirectory }).status().us, "cloud-private");
});

test("a Railway persistent volume can hold a private US beta", async (context) => {
  const previous = process.env.MEDIA_VOLUME_REGIONS;
  process.env.MEDIA_VOLUME_REGIONS = "us";
  context.after(() => {
    if (previous === undefined) delete process.env.MEDIA_VOLUME_REGIONS;
    else process.env.MEDIA_VOLUME_REGIONS = previous;
  });
  const mediaDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-volume-"));
  context.after(() => fs.rmSync(mediaDirectory, { recursive: true, force: true }));
  const storage = createRegionalObjectStorage({ mediaDirectory });
  const stored = await storage.put({
    user: { id: "creator-volume", primaryRegion: "us" },
    key: "creator-volume/story/artwork.webp",
    buffer: Buffer.from("private volume artwork"),
    contentType: "image/webp"
  });
  assert.strictEqual(stored.storageProvider, "volume");
  assert.strictEqual(stored.storageRegion, "us");
  assert.strictEqual(storage.status().us, "persistent-private");
  assert.doesNotThrow(() => storage.assertReady("us"));
  const loaded = await storage.get({ ...stored, mimeType: "image/webp" });
  assert.strictEqual(loaded.body.toString(), "private volume artwork");
});
