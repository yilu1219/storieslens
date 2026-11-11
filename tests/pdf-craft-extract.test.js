const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { PDFDocument } = require("pdf-lib");
const { createFamilyBookApi } = require("../family-book-api");
const { createFamilyBookStore } = require("../family-book-store");
const { buildInformalPreviewPdf } = require("../parent-book-pdf");
const {
  extractScanFromImage,
  imageToSinglePagePdf,
  redactExtractMessage,
  pdfCraftOcrConfig,
  pdfCraftVendorKind,
  piecesToResult,
  separateCraftMarkdown
} = require("../pdf-craft-extract");

const root = path.resolve(__dirname, "..");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=",
  "base64"
);
const pngDataUrl = `data:image/png;base64,${png.toString("base64")}`;

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function fakeChild(payload) {
  const stdout = new EventEmitter();
  const child = new EventEmitter();
  child.stdout = stdout;
  child.stderr = new EventEmitter();
  child.kill = () => {};
  process.nextTick(() => {
    stdout.emit("data", Buffer.from(`${JSON.stringify(payload)}\n`));
    child.emit("close", payload.ok ? 0 : 1);
  });
  return child;
}

function apiWith({ extractScan, env } = {}) {
  let lastBody = null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-craft-api-"));
  const api = createFamilyBookApi({
    store: createFamilyBookStore({ root: dir }),
    env: env || {},
    extractScan,
    sendJson(response, status, body) {
      response.statusCode = status;
      response.body = body;
    },
    sendBinary(response, file) {
      response.statusCode = 200;
      response.buffer = file.buffer;
      response.contentType = file.contentType;
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

test("pdf-craft OCR config reuses a compatible OCR model and ignores the chat model", () => {
  const chatOnly = pdfCraftOcrConfig({
    OPENROUTER_API_KEY: "secret-ocr-key",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    OPENROUTER_MODEL: "openai/gpt-4o-mini"
  });
  assert.equal(chatOnly.configured, false);
  assert.equal(chatOnly.reason, "ocr_not_configured");
  const reused = pdfCraftOcrConfig({
    OPENROUTER_API_KEY: "secret-ocr-key",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    OPENROUTER_OCR_MODEL: "deepseek-ocr"
  });
  assert.equal(reused.configured, true);
  assert.equal(reused.model, "deepseek-ocr");
  assert.equal(reused.backend, "deepseek");
});

test("DeepSeek-OCR 2 is selected for an ocr-2 model or deepseek2 backend, and gen 1 stays gen 1", () => {
  const novita = pdfCraftOcrConfig({
    PDF_CRAFT_OCR_BASE_URL: "https://api.novita.ai/openai",
    PDF_CRAFT_OCR_API_KEY: "test-key",
    PDF_CRAFT_OCR_MODEL: "deepseek/deepseek-ocr-2",
    OPENROUTER_MODEL: "openai/gpt-4o-mini"
  });
  assert.equal(novita.configured, true);
  assert.equal(novita.backend, "deepseek2");
  assert.equal(novita.model, "deepseek/deepseek-ocr-2");
  assert.equal(pdfCraftVendorKind("deepseek2", "deepseek-ai/DeepSeek-OCR"), "deepseek2");

  const silicon = pdfCraftOcrConfig({
    PDF_CRAFT_OCR_BACKEND: "deepseek",
    PDF_CRAFT_OCR_BASE_URL: "https://api.siliconflow.cn/v1",
    PDF_CRAFT_OCR_API_KEY: "test-key",
    PDF_CRAFT_OCR_MODEL: "deepseek-ai/DeepSeek-OCR"
  });
  assert.equal(silicon.configured, true);
  assert.equal(silicon.backend, "deepseek");

  const chatNamedLikeOcr = pdfCraftOcrConfig({
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    OPENROUTER_MODEL: "deepseek/deepseek-ocr-2"
  });
  assert.equal(chatNamedLikeOcr.configured, false);

  const script = `
import importlib.util, json, os
spec = importlib.util.spec_from_file_location("pdf_craft_extract", "scripts/pdf_craft_extract.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
kind, settings = mod.configured()
print(json.dumps({"kind": kind, "model": settings.get("model", "")}))
`;
  const pythonKind = (env) => JSON.parse(execFileSync("python3", ["-c", script], {
    cwd: root,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      PDF_CRAFT_OCR_BACKEND: env.backend || "deepseek",
      PDF_CRAFT_OCR_BASE_URL: env.baseUrl || "",
      PDF_CRAFT_OCR_API_KEY: "test-key",
      PDF_CRAFT_OCR_MODEL: env.model || "",
      OPENROUTER_MODEL: "openai/gpt-4o-mini"
    }
  }));
  assert.deepEqual(pythonKind({
    baseUrl: "https://api.novita.ai/openai",
    model: "deepseek/deepseek-ocr-2"
  }), { kind: "deepseek2", model: "deepseek/deepseek-ocr-2" });
  assert.deepEqual(pythonKind({
    backend: "deepseek2",
    baseUrl: "https://api.novita.ai/openai",
    model: "deepseek-ai/DeepSeek-OCR"
  }), { kind: "deepseek2", model: "deepseek-ai/DeepSeek-OCR" });
  assert.deepEqual(pythonKind({
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "deepseek-ai/DeepSeek-OCR"
  }), { kind: "deepseek", model: "deepseek-ai/DeepSeek-OCR" });
});

test("markdown from pdf-craft keeps the child's words and separates figure files", () => {
  const separated = separateCraftMarkdown("teh catt sat\n\n![](assets/figure.png)\n");
  assert.equal(separated.text, "teh catt sat");
  assert.deepEqual(separated.images, ["assets/figure.png"]);
  const kept = piecesToResult(separated.text, ["data:image/png;base64,aaaa"], [
    { kind: "text", text: "teh catt sat", confidence: 1, box: { x: 0.1, y: 0.7, w: 0.5, h: 0.1 } },
    { kind: "text", text: "invented extra", confidence: 0.4, box: { x: 0, y: 0, w: 0.2, h: 0.1 } },
    { kind: "image", text: "do not keep", box: { x: 0.05, y: 0.05, w: 0.7, h: 0.4 } },
    { kind: "note", text: "skip" }
  ]);
  assert.equal(kept.text, "teh catt sat");
  assert.equal(kept.rewritten, false);
  assert.equal(kept.status, "ok");
  assert.equal(kept.blocks.length, 2);
  assert.equal(kept.blocks[0].text, "teh catt sat");
  assert.equal(kept.blocks[1].kind, "image");
  assert.equal(kept.blocks[1].text, "");
  const uncertain = piecesToResult("   ", ["data:image/png;base64,aaaa"]);
  assert.equal(uncertain.text, "");
  assert.equal(uncertain.status, "uncertain");
  assert.equal(uncertain.images.length, 1);
});

test("a phone photo becomes a one-page PDF and pdf-craft output is recomposed without inventing text", async () => {
  const pdfBuffer = await imageToSinglePagePdf(png, "image/png");
  assert.equal(pdfBuffer.subarray(0, 5).toString("ascii"), "%PDF-");
  const sized = await PDFDocument.load(pdfBuffer);
  const pageSize = sized.getPages()[0].getSize();
  assert.ok(pageSize.width <= 36.1, `phone pixels were treated as PDF points: ${pageSize.width}`);
  assert.equal(redactExtractMessage("OCR failed sk-supersecretkeyvalue"), "OCR failed [redacted]");

  let spawned = false;
  const missing = await extractScanFromImage({
    buffer: png,
    mimeType: "image/png",
    env: {},
    spawnImpl() {
      spawned = true;
      throw new Error("should not run");
    }
  });
  assert.equal(spawned, false);
  assert.equal(missing.status, "unavailable");
  assert.equal(missing.text, "");
  assert.equal(missing.reason, "ocr_not_configured");
  assert.equal(missing.rewritten, false);

  const extracted = await extractScanFromImage({
    buffer: png,
    mimeType: "image/png",
    env: {
      PDF_CRAFT_OCR_BASE_URL: "https://ocr.example/v1",
      PDF_CRAFT_OCR_API_KEY: "secret-ocr-key",
      PDF_CRAFT_OCR_MODEL: "deepseek-ocr"
    },
    spawnImpl(_python, args) {
      assert.match(args[0], /pdf_craft_extract\.py$/);
      assert.equal(args.join(" ").includes("secret-ocr-key"), false);
      const markdown = args[args.indexOf("--markdown") + 1];
      const assets = args[args.indexOf("--assets") + 1];
      fs.mkdirSync(assets, { recursive: true });
      fs.writeFileSync(path.join(assets, "figure.png"), png);
      fs.writeFileSync(markdown, "teh catt sat\n\n![](assets/figure.png)\n");
      return fakeChild({ ok: true, engine: "pdf-craft", reason: "extracted" });
    }
  });
  assert.equal(extracted.engine, "pdf-craft");
  assert.equal(extracted.status, "ok");
  assert.equal(extracted.text, "teh catt sat");
  assert.equal(extracted.rewritten, false);
  assert.equal(extracted.images.length, 1);
  assert.match(extracted.images[0], /^data:image\/png;base64,/);

  const unreadable = await extractScanFromImage({
    buffer: png,
    mimeType: "image/png",
    env: {
      PDF_CRAFT_OCR_BASE_URL: "https://ocr.example/v1",
      PDF_CRAFT_OCR_API_KEY: "secret-ocr-key",
      PDF_CRAFT_OCR_MODEL: "deepseek-ocr"
    },
    spawnImpl(_python, args) {
      const markdown = args[args.indexOf("--markdown") + 1];
      const assets = args[args.indexOf("--assets") + 1];
      fs.mkdirSync(assets, { recursive: true });
      fs.writeFileSync(path.join(assets, "figure.png"), png);
      fs.writeFileSync(markdown, "![](assets/figure.png)\n");
      return fakeChild({ ok: true, engine: "pdf-craft", reason: "extracted" });
    }
  });
  assert.equal(unreadable.status, "uncertain");
  assert.equal(unreadable.text, "");
  assert.equal(unreadable.images.length, 1);
});

test("the extract API fails clearly without OCR, keeps faithful text, and does not unlock a paid download", async () => {
  const unconfigured = apiWith({});
  const missing = await unconfigured.call("POST", "/api/family-book/extract", { imageDataUrl: pngDataUrl });
  assert.equal(missing.statusCode, 501);
  assert.equal(missing.body.engine, "pdf-craft");
  assert.equal(missing.body.text, "");
  assert.equal(missing.body.rewritten, false);
  assert.match(missing.body.error, /PDF_CRAFT_OCR_MODEL|not configured/);

  const configured = apiWith({
    extractScan: async () => ({
      engine: "pdf-craft",
      status: "ok",
      text: "teh catt",
      images: [pngDataUrl],
      uncertain: false,
      rewritten: false,
      reason: "extracted"
    })
  });
  const ok = await configured.call("POST", "/api/family-book/extract", { imageDataUrl: pngDataUrl });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.text, "teh catt");
  assert.equal(ok.body.images.length, 1);
  assert.equal(ok.body.rewritten, false);

  const blocked = await configured.call("POST", "/api/family-book/download?paid=1&success=true", {
    orderId: "not-paid",
    grantToken: "",
    pages: [{ imageDataUrl: pngDataUrl }]
  });
  assert.equal(blocked.statusCode, 402);
  assert.equal(blocked.body.paid, false);

  const preview = await buildInformalPreviewPdf({
    title: "preview",
    pages: [{ buffer: png, mimeType: "image/png" }]
  });
  assert.equal(preview.preview, true);
  assert.equal(preview.paid, false);
  assert.equal(preview.official, false);
});

test("parent and teacher books call pdf-craft and rebuild pages instead of a full-bleed photo", () => {
  const parent = read("parent-book.js");
  const teacher = read("teacher-book.js");
  const script = read("scripts/pdf_craft_extract.py");
  const requirements = read("requirements.txt");
  const nixpacks = read("nixpacks.toml");
  const envExample = read(".env.example");
  for (const source of [parent, teacher]) {
    assert.match(source, /requestPdfCraftExtraction/);
    assert.match(source, /drawRebuiltPage/);
    assert.match(source, /pdf-craft/);
    assert.doesNotMatch(source, /drawImageFullBleed/);
  }
  assert.match(read("artwork-prepare.js"), /\/api\/family-book\/extract/);
  assert.match(script, /from pdf_craft import/);
  assert.match(script, /DeepSeekOCRVendorConfig/);
  assert.match(script, /DeepSeekOCR2VendorConfig/);
  assert.match(script, /convert_pdf_to_markdown/);
  assert.match(script, /max_page_image_file_size/);
  assert.match(script, /def redact/);
  assert.match(read("pdf-craft-extract.js"), /logExtractFailure/);
  assert.match(read("family-book-api.js"), /logExtractFailure/);
  assert.doesNotMatch(script, /XMLTranslator/);
  assert.match(requirements, /pdf-craft==2\.6\.7/);
  assert.match(nixpacks, /poppler-utils/);
  assert.match(nixpacks, /pdf-craft|requirements\.txt/);
  const railpack = JSON.parse(read("railpack.json"));
  const railway = JSON.parse(read("railway.json"));
  assert.equal(railpack.provider, "node");
  assert.equal(railpack.deploy.startCommand, "npm start");
  assert.equal(railpack.packages.python, "3.12");
  assert.equal(railpack.deploy.variables.PDF_CRAFT_PYTHON, "/app/.venv/bin/python");
  assert.ok(railpack.deploy.aptPackages.includes("poppler-utils"));
  assert.match(railpack.steps.build.commands.join("\n"), /pip install --no-cache-dir -r requirements\.txt/);
  assert.equal(railway.build.builder, "RAILPACK");
  assert.equal(railway.deploy.startCommand, "npm start");
  assert.match(read("package.json"), /"start": "node server\.js"/);
  assert.match(envExample, /PDF_CRAFT_OCR_API_KEY=/);
  assert.match(envExample, /PDF_CRAFT_OCR_MODEL=/);
  assert.match(envExample, /PDF_CRAFT_OCR_BACKEND=deepseek2/);
  assert.match(envExample, /https:\/\/api\.novita\.ai\/openai/);
  assert.match(envExample, /deepseek\/deepseek-ocr-2/);
  assert.doesNotMatch(envExample, /nvapi-|sk-or-v1-/);
  assert.doesNotMatch(script, /api_key\s*=\s*["'][A-Za-z0-9]{8,}["']/);
});
