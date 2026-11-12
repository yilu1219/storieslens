const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createFamilyBookApi } = require("../family-book-api");
const { createFamilyBookStore } = require("../family-book-store");
const { buildParentBookPdf, isPrintReadyPageSize, readPdfPageSize } = require("../parent-book-pdf");
const {
  illustrateFromReference,
  illustrationConfig,
  illustrationPrompt,
  illustrationSize
} = require("../book-illustration");

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=",
  "base64"
);
const pngDataUrl = `data:image/png;base64,${png.toString("base64")}`;

function apiWith({ env, illustrate, fetchImpl } = {}) {
  let lastBody = null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "book-illustration-"));
  const api = createFamilyBookApi({
    store: createFamilyBookStore({ root: dir }),
    env: env || {},
    illustrate,
    fetchImpl,
    sendJson(response, status, body) {
      response.statusCode = status;
      response.body = body;
    },
    sendBinary(response, file) {
      response.statusCode = 200;
      response.buffer = file.buffer;
    },
    async readJsonBody() {
      return lastBody;
    },
    consumeRateLimit() {
      return true;
    }
  });
  return {
    async call(method, pathName, body) {
      lastBody = body || {};
      const response = { statusCode: 200, headers: {}, setHeader() {} };
      await api.handle({ method }, response, new URL(pathName, "http://127.0.0.1"));
      return response;
    }
  };
}

test("illustration config stays in server env and prefers the Novita key already used for OCR", () => {
  const missing = illustrationConfig({});
  assert.equal(missing.configured, false);
  assert.equal(missing.reason, "illustration_not_configured");
  const direct = illustrationConfig({
    BOOK_ILLUSTRATION_API_KEY: "test-illustration-key",
    BOOK_ILLUSTRATION_MODEL: "seedream-4.5"
  });
  assert.equal(direct.configured, true);
  assert.equal(direct.provider, "novita");
  assert.equal(direct.endpoint, "https://api.novita.ai/v3/seedream-4.5");
  const reused = illustrationConfig({
    PDF_CRAFT_OCR_BASE_URL: "https://api.novita.ai/openai",
    PDF_CRAFT_OCR_API_KEY: "test-ocr-key"
  });
  assert.equal(reused.configured, true);
  assert.equal(reused.apiKey, "test-ocr-key");
  const otherVendor = illustrationConfig({
    PDF_CRAFT_OCR_BASE_URL: "https://api.siliconflow.cn/v1",
    PDF_CRAFT_OCR_API_KEY: "test-ocr-key"
  });
  assert.equal(otherVendor.configured, false);
  const example = fs.readFileSync(path.join(__dirname, "../.env.example"), "utf8");
  assert.match(example, /BOOK_ILLUSTRATION_API_KEY=/);
  assert.match(example, /BOOK_ILLUSTRATION_MODEL=seedream-4\.5/);
  assert.match(example, /^ARK_API_KEY=$/m);
  assert.match(example, /^VOLCENGINE_ARK_API_KEY=$/m);
  assert.match(example, /ARK_IMAGE_MODEL=doubao-seedream-5-0-pro-260628/);
  assert.doesNotMatch(example, /nvapi-[A-Za-z0-9]/);
  assert.doesNotMatch(example, /sk-[A-Za-z0-9]/);
});

test("Ark Seedream 5.0 Pro is selected when an Ark key is set, and watermark is requested false", async () => {
  const ark = illustrationConfig({
    ARK_API_KEY: "ark-test-key",
    BOOK_ILLUSTRATION_API_KEY: "novita-key",
    CHINA_ARK_API_KEY: "china-route-key"
  });
  assert.equal(ark.configured, true);
  assert.equal(ark.provider, "ark");
  assert.equal(ark.model, "doubao-seedream-5-0-pro-260628");
  assert.equal(ark.endpoint, "https://ark.cn-beijing.volces.com/api/v3/images/generations");
  assert.equal(ark.apiKey, "ark-test-key");

  const alias = illustrationConfig({ VOLCENGINE_ARK_API_KEY: "ark-alias-key" });
  assert.equal(alias.provider, "ark");
  assert.equal(alias.apiKey, "ark-alias-key");

  const blank = illustrationConfig({
    ARK_API_KEY: "   ",
    BOOK_ILLUSTRATION_API_KEY: "test-illustration-key"
  });
  assert.equal(blank.provider, "novita");
  const chinaOnly = illustrationConfig({
    CHINA_ARK_API_KEY: "china-route-key",
    BOOK_ILLUSTRATION_API_KEY: "test-illustration-key"
  });
  assert.equal(chinaOnly.provider, "novita");
  const unsafeUrl = illustrationConfig({
    ARK_API_KEY: "ark-test-key",
    ARK_IMAGE_API_URL: "http://127.0.0.1/images"
  });
  assert.equal(unsafeUrl.endpoint, "https://ark.cn-beijing.volces.com/api/v3/images/generations");

  let captured = null;
  const made = await illustrateFromReference({
    buffer: png,
    mimeType: "image/png",
    text: "小猫在下雨",
    env: { ARK_API_KEY: "ark-test-key" },
    fetchImpl: async (url, options) => {
      captured = { url, options, body: JSON.parse(options.body) };
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [{ b64_json: png.toString("base64"), output_format: "png" }] })
      };
    }
  });
  assert.equal(made.status, "ok");
  assert.equal(made.imageDataUrl, pngDataUrl);
  assert.equal(captured.url, "https://ark.cn-beijing.volces.com/api/v3/images/generations");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.headers.Authorization, "Bearer ark-test-key");
  assert.equal(captured.body.model, "doubao-seedream-5-0-pro-260628");
  assert.equal(captured.body.watermark, false);
  assert.equal(captured.body.output_format, "png");
  assert.equal(captured.body.response_format, "b64_json");
  assert.equal(captured.body.sequential_image_generation, undefined);
  assert.equal(typeof captured.body.image, "string");
  assert.match(captured.body.image, /^data:image\/png;base64,/);
  assert.match(captured.body.prompt, /Preserve the same composition/);
  assert.match(captured.body.prompt, /Do not draw any words/);
  assert.equal(JSON.stringify(captured.body).includes("ark-test-key"), false);
  const [width, height] = captured.body.size.split("x").map(Number);
  const pixels = width * height;
  assert.ok(pixels >= 3_686_400);
  assert.ok(pixels <= 4_624_220);

  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(" "));
  const failed = await illustrateFromReference({
    buffer: png,
    mimeType: "image/png",
    env: { VOLCENGINE_ARK_API_KEY: "ark-supersecret-token" },
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "rejected ark-supersecret-token" } })
    })
  });
  console.error = original;
  assert.equal(failed.status, "failed");
  assert.equal(failed.imageDataUrl, "");
  assert.equal(JSON.stringify(failed).includes("ark-supersecret-token"), false);
  assert.equal(logs.join("\n").includes("ark-supersecret-token"), false);
  assert.match(logs.join("\n"), /illustration_failed/);
});

test("Novita Seedream stays selected when the Ark key is absent, and watermark is requested false", async () => {
  const novita = illustrationConfig({ BOOK_ILLUSTRATION_API_KEY: "test-illustration-key" });
  assert.equal(novita.provider, "novita");
  assert.equal(novita.endpoint, "https://api.novita.ai/v3/seedream-4.5");

  let captured = null;
  const made = await illustrateFromReference({
    buffer: png,
    mimeType: "image/png",
    env: { BOOK_ILLUSTRATION_API_KEY: "test-illustration-key" },
    fetchImpl: async (url, options) => {
      captured = { url, body: JSON.parse(options.body) };
      return { ok: true, status: 200, json: async () => ({ images: [pngDataUrl] }) };
    }
  });
  assert.equal(made.status, "ok");
  assert.equal(made.imageDataUrl, pngDataUrl);
  assert.equal(captured.url, "https://api.novita.ai/v3/seedream-4.5");
  assert.equal(captured.body.watermark, false);
  assert.equal(captured.body.sequential_image_generation, "disabled");
  assert.equal(Array.isArray(captured.body.image), true);
  assert.match(captured.body.image[0], /^data:image\/png;base64,/);
  assert.equal(captured.body.model, undefined);
});

test("the illustration prompt keeps the child's subject and does not ask for drawn words", () => {
  const prompt = illustrationPrompt("小猫在下雨");
  assert.match(prompt, /小猫在下雨/);
  assert.match(prompt, /Do not draw any words/);
  assert.match(prompt, /do not render the note as text/i);
  const quiet = illustrationPrompt("");
  assert.doesNotMatch(quiet, /note as text/);
  const size = illustrationSize(148, 210);
  const [width, height] = size.size.split("x").map(Number);
  assert.ok(width * height >= 3686400);
  assert.ok(width * height <= 4624220);
  assert.ok(Math.abs(width / height - 148 / 210) < 0.02);
});

test("generation failure is honest, logs no secret, and print boxes still require the paid grant", async () => {
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(" "));
  const failed = await illustrateFromReference({
    buffer: png,
    mimeType: "image/png",
    text: "小猫",
    env: { BOOK_ILLUSTRATION_API_KEY: "nvapi-supersecret" },
    fetchImpl: async () => {
      throw new Error("upstream nvapi-supersecret sk-abcdef");
    }
  });
  console.error = original;
  assert.equal(failed.status, "failed");
  assert.equal(failed.imageDataUrl, "");
  assert.equal(logs.join("\n").includes("nvapi-supersecret"), false);
  assert.equal(logs.join("\n").includes("sk-abcdef"), false);

  const made = await illustrateFromReference({
    buffer: png,
    mimeType: "image/png",
    env: { BOOK_ILLUSTRATION_API_KEY: "test-illustration-key" },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ images: [pngDataUrl] })
    })
  });
  assert.equal(made.status, "ok");
  assert.equal(made.imageDataUrl, pngDataUrl);

  const unconfigured = apiWith();
  const missing = await unconfigured.call("POST", "/api/family-book/illustrate", { imageDataUrl: pngDataUrl, text: "小猫" });
  assert.equal(missing.statusCode, 501);
  assert.equal(missing.body.reason, "illustration_not_configured");
  assert.equal(missing.body.imageDataUrl, "");
  assert.match(missing.body.error, /ARK_API_KEY/);
  assert.match(missing.body.error, /straightened original artwork/);
  assert.equal(JSON.stringify(missing.body).includes("test-illustration-key"), false);

  let arkCall = null;
  const arkRoute = apiWith({
    env: { ARK_API_KEY: "ark-route-key", BOOK_ILLUSTRATION_API_KEY: "novita-key" },
    fetchImpl: async (url, options) => {
      arkCall = { url, body: JSON.parse(options.body) };
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [{ b64_json: png.toString("base64"), output_format: "png" }] })
      };
    }
  });
  const viaArk = await arkRoute.call("POST", "/api/family-book/illustrate", { imageDataUrl: pngDataUrl, text: "小猫" });
  assert.equal(viaArk.statusCode, 200);
  assert.equal(viaArk.body.imageDataUrl, pngDataUrl);
  assert.equal(arkCall.url, "https://ark.cn-beijing.volces.com/api/v3/images/generations");
  assert.equal(arkCall.body.watermark, false);
  assert.equal(arkCall.body.model, "doubao-seedream-5-0-pro-260628");
  assert.equal(JSON.stringify(viaArk.body).includes("ark-route-key"), false);

  const ready = apiWith({
    illustrate: async () => ({ status: "ok", reason: "illustrated", imageDataUrl: pngDataUrl })
  });
  const illustrated = await ready.call("POST", "/api/family-book/illustrate", { imageDataUrl: pngDataUrl });
  assert.equal(illustrated.statusCode, 200);
  assert.equal(illustrated.body.imageDataUrl, pngDataUrl);

  const blocked = await ready.call("POST", "/api/family-book/download?paid=1&success=true", {
    orderId: "not-paid",
    grantToken: "",
    pages: [{ imageDataUrl: pngDataUrl }]
  });
  assert.equal(blocked.statusCode, 402);
  assert.equal(blocked.body.paid, false);

  const pdf = await buildParentBookPdf({
    title: "小羽的画",
    pages: [{ imageDataUrl: pngDataUrl }]
  });
  const measured = await readPdfPageSize(pdf.buffer);
  assert.equal(isPrintReadyPageSize(measured), true);
  assert.ok(Math.abs(measured.widthMm - 154) < 0.05);
  assert.ok(Math.abs(measured.heightMm - 216) < 0.05);
  assert.ok(Math.abs(measured.trim.widthMm - 148) < 0.05);
  assert.ok(Math.abs(measured.trim.heightMm - 210) < 0.05);

  const parent = fs.readFileSync(path.join(__dirname, "../parent-book.js"), "utf8");
  const unlock = parent.slice(parent.indexOf("function officialPrintUnlocked"), parent.indexOf("function fillPrintRoot"));
  assert.match(unlock, /paid === true/);
  assert.match(unlock, /kind === "digital"/);
  assert.match(unlock, /deliveryEmail/);
});
