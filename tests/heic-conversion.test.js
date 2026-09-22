const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { isHeicBuffer, parseHeicDataUrl } = require("../heic-conversion");

test("HEIC fallback accepts real HEIF container signatures and rejects renamed files", () => {
  const heic = Buffer.from("000000186674797068656963000000006d696631", "hex");
  assert.equal(isHeicBuffer(heic), true);
  assert.equal(isHeicBuffer(Buffer.from("not an image")), false);
  assert.deepEqual(parseHeicDataUrl(`data:image/heic;base64,${heic.toString("base64")}`), heic);
  assert.throws(() => parseHeicDataUrl("data:image/heic;base64,bm90IGFuIGltYWdl"), /invalid_heic/);
});

test("SOLO exposes an explicit, opt-in server fallback without weakening safety review", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.html"), "utf8");
  const browserSafety = fs.readFileSync(path.join(__dirname, "..", "artwork-upload-safety.js"), "utf8");
  const preview = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(html, /data-heic-auto-convert/);
  assert.match(html, /The converted picture still passes the same Safety Check/);
  assert.match(browserSafety, /processArtworkWithServerFallback/);
  assert.match(browserSafety, /reviewSanitizedArtwork\(sanitized\.dataUrl\)/);
  assert.match(preview, /pendingHeicFiles/);
  assert.match(server, /\/api\/convert-heic/);
  assert.match(server, /heic-conversion.*limit: 6/);
});

test("all phone-photo entry points inherit automatic HEIC fallback and fresh PWA assets", () => {
  const browserSafety = fs.readFileSync(path.join(__dirname, "..", "artwork-upload-safety.js"), "utf8");
  const serviceWorker = fs.readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");
  assert.match(browserSafety, /options\.allowServerFallback === false/);
  assert.match(browserSafety, /return convertHeicOnServer\(file\)/);
  assert.match(browserSafety, /processArtworkLocalOnly/);
  assert.match(browserSafety, /image\/avif/);
  assert.match(serviceWorker, /v95-clear-yu-voice-20260922/);
  assert.match(serviceWorker, /artwork-upload-safety\.js\?v=20260922-mobile-heic-1/);

  for (const filename of ["index.html", "app.html", "chinese-studio.html", "start.html", "classroom-archive.html", "movie-studio.html", "solo-delight-preview.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", filename), "utf8");
    assert.match(html, /accept="[^"]*image\/\*/i, `${filename} should accept phone photo libraries`);
  }
});
