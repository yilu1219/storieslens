const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { PDFDocument } = require("pdf-lib");

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_ASSET_BYTES = 1_500_000;
const MAX_ASSETS = 8;
const EXTRACT_TIMEOUT_MS = 180_000;

function pdfCraftVendorKind(backend, model) {
  const name = String(backend || "deepseek").trim().toLowerCase();
  const modelName = String(model || "").toLowerCase();
  if (name === "deepseek2" || name === "deepseek-ocr-2" || name === "ocr2") return "deepseek2";
  if (name === "deepseek" && modelName.includes("ocr-2")) return "deepseek2";
  return "deepseek";
}

function pdfCraftOcrConfig(env = process.env) {
  const backend = String(env.PDF_CRAFT_OCR_BACKEND || "deepseek").trim().toLowerCase();
  if (backend === "unlimited") {
    const ak = String(env.PDF_CRAFT_UNLIMITED_OCR_AK || "").trim();
    const sk = String(env.PDF_CRAFT_UNLIMITED_OCR_SK || "").trim();
    if (!ak || !sk) {
      return {
        configured: false,
        backend: "unlimited",
        reason: "ocr_not_configured",
        missing: ["PDF_CRAFT_UNLIMITED_OCR_AK", "PDF_CRAFT_UNLIMITED_OCR_SK"]
      };
    }
    return {
      configured: true,
      backend: "unlimited",
      ak,
      sk,
      baseUrl: String(env.PDF_CRAFT_UNLIMITED_OCR_BASE_URL || "").trim()
    };
  }
  const baseUrl = String(env.PDF_CRAFT_OCR_BASE_URL || env.OPENROUTER_BASE_URL || "").trim().replace(/\/+$/, "");
  const apiKey = String(env.PDF_CRAFT_OCR_API_KEY || env.OPENROUTER_API_KEY || "").trim();
  // OPENROUTER_MODEL is a chat model, not a pdf-craft OCR model, so it is ignored.
  const model = String(env.PDF_CRAFT_OCR_MODEL || env.OPENROUTER_OCR_MODEL || "").trim();
  const missing = [];
  if (!baseUrl) missing.push("PDF_CRAFT_OCR_BASE_URL");
  if (!apiKey) missing.push("PDF_CRAFT_OCR_API_KEY");
  if (!model) missing.push("PDF_CRAFT_OCR_MODEL");
  if (missing.length) {
    return { configured: false, backend: "deepseek", reason: "ocr_not_configured", missing };
  }
  return { configured: true, backend: pdfCraftVendorKind(backend, model), baseUrl, apiKey, model };
}

function parseImageDataUrl(value) {
  const match = String(value || "").match(/^data:(image\/(?:jpeg|jpg|png));base64,([a-zA-Z0-9+/=\s]+)$/i);
  if (!match) return null;
  const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
  return { mimeType, buffer };
}

function separateCraftMarkdown(markdown) {
  const images = [];
  const text = String(markdown || "")
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, (_, src) => {
      images.push(String(src || "").trim());
      return "\n";
    })
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");
  return { text, images };
}

function clampUnit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}

function normalizeScanBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  const out = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const rawKind = String(block.kind || "").toLowerCase();
    const kind = rawKind === "image" || rawKind === "figure" ? "image" : rawKind === "text" ? "text" : "";
    if (!kind) continue;
    const source = block.box && typeof block.box === "object" ? block.box : null;
    const box = source ? {
      x: clampUnit(source.x),
      y: clampUnit(source.y),
      w: clampUnit(source.w),
      h: clampUnit(source.h)
    } : null;
    if (box && (box.w <= 0 || box.h <= 0)) continue;
    const text = kind === "text" ? String(block.text || "").trim().slice(0, 2000) : "";
    if (kind === "text" && !text) continue;
    out.push({
      kind,
      text,
      box,
      confidence: clampUnit(block.confidence == null ? 1 : block.confidence)
    });
    if (out.length >= 40) break;
  }
  return out;
}

function piecesToResult(text, images, blocks) {
  const faithful = String(text || "");
  const files = Array.isArray(images) ? images.filter(Boolean).slice(0, MAX_ASSETS) : [];
  const normalized = normalizeScanBlocks(blocks);
  if (!faithful.trim()) {
    return {
      engine: "pdf-craft",
      status: "uncertain",
      text: "",
      images: files,
      blocks: normalized.filter((block) => block.kind === "image").map((block) => ({ ...block, text: "" })),
      uncertain: true,
      rewritten: false,
      reason: "ocr_uncertain"
    };
  }
  return {
    engine: "pdf-craft",
    status: "ok",
    text: faithful,
    images: files,
    blocks: normalized.filter((block) => block.kind !== "text" || faithful.includes(block.text)),
    uncertain: false,
    rewritten: false,
    reason: "extracted"
  };
}

function redactExtractMessage(value) {
  return String(value || "")
    .replace(/bearer\s+[A-Za-z0-9._-]{6,}/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|token|secret)(["']?\s*[:=]\s*["']?)[^\s"',}]+/gi, "$1$2[redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "[redacted]")
    .replace(/\bnvapi-[A-Za-z0-9_-]{6,}\b/g, "[redacted]")
    .slice(0, 300);
}

function logExtractFailure(info = {}) {
  console.error("family-book extract failed", JSON.stringify({
    reason: String(info.reason || "pdf_craft_failed"),
    errorType: String(info.errorType || ""),
    message: redactExtractMessage(info.message)
  }));
}

function failureResult(reason) {
  const code = reason || "pdf_craft_failed";
  const unavailable = code === "ocr_not_configured" || code === "pdf_craft_unavailable" || code === "poppler_missing";
  return {
    engine: "pdf-craft",
    status: unavailable ? "unavailable" : "uncertain",
    text: "",
    images: [],
    blocks: [],
    uncertain: true,
    rewritten: false,
    reason: code
  };
}

function unavailableMessage(reason) {
  if (reason === "poppler_missing") {
    return "pdf-craft needs Poppler (pdftoppm) on this server. No text was recognized.";
  }
  if (reason === "pdf_craft_unavailable") {
    return "The pdf-craft Python library is not installed on this server. No text was recognized.";
  }
  return "pdf-craft remote OCR is not configured. Set PDF_CRAFT_OCR_BASE_URL, PDF_CRAFT_OCR_API_KEY, and PDF_CRAFT_OCR_MODEL. Use PDF_CRAFT_OCR_BACKEND=deepseek2, or a model name containing ocr-2, for DeepSeek-OCR 2. OPENROUTER_MODEL is not used. No text was recognized.";
}

async function imageToSinglePagePdf(buffer, mimeType) {
  const pdf = await PDFDocument.create();
  const image = mimeType === "image/png" ? await pdf.embedPng(buffer) : await pdf.embedJpg(buffer);
  // pdf-craft renders at 300 DPI. Size the page in points so that render stays near the
  // source pixels instead of treating every pixel as one point.
  const widthPt = Math.max(36, image.width * 72 / 300);
  const heightPt = Math.max(36, image.height * 72 / 300);
  const page = pdf.addPage([widthPt, heightPt]);
  page.drawImage(image, { x: 0, y: 0, width: widthPt, height: heightPt });
  return Buffer.from(await pdf.save());
}

function resolveAsset(rootDir, markdownPath, src) {
  if (!src || /^(?:[a-z]+:|\/\/)/i.test(src) || src.includes("\0")) return null;
  const full = path.resolve(path.dirname(markdownPath), src);
  const root = path.resolve(rootDir);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

function readCraftDirectory(rootDir, markdownPath) {
  if (!fs.existsSync(markdownPath)) return piecesToResult("", []);
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const separated = separateCraftMarkdown(markdown);
  const images = [];
  for (const src of separated.images) {
    if (images.length >= MAX_ASSETS) break;
    const file = resolveAsset(rootDir, markdownPath, src);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
    const bytes = fs.readFileSync(file);
    if (!bytes.length || bytes.length > MAX_ASSET_BYTES) continue;
    const ext = path.extname(file).toLowerCase();
    const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    images.push(`data:${mime};base64,${bytes.toString("base64")}`);
  }
  let blocks = [];
  const layoutPath = path.join(path.dirname(markdownPath), "layout.json");
  if (fs.existsSync(layoutPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(layoutPath, "utf8"));
      blocks = parsed && parsed.blocks;
    } catch (_error) {
      blocks = [];
    }
  }
  return piecesToResult(separated.text, images, blocks);
}

function runPdfCraftProcess({ python, scriptPath, pdfPath, markdownPath, assetsPath, env, spawnImpl }) {
  const spawnFn = spawnImpl || spawn;
  const args = ["--pdf", pdfPath, "--markdown", markdownPath, "--assets", assetsPath];
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnFn(python, [scriptPath, ...args], {
        env,
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch (_error) {
      resolve({ ok: false, reason: "pdf_craft_unavailable", stdout: "" });
      return;
    }
    if (!child || typeof child.on !== "function") {
      resolve({ ok: false, reason: "pdf_craft_unavailable", stdout: "" });
      return;
    }
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };
    const timer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch (_error) {}
      finish({ ok: false, reason: "pdf_craft_failed", stdout });
    }, EXTRACT_TIMEOUT_MS);
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > 200_000) stdout = stdout.slice(-200_000);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 8_000) stderr = stderr.slice(-8_000);
    });
    child.on("error", () => {
      clearTimeout(timer);
      finish({ ok: false, reason: "pdf_craft_unavailable", stdout });
    });
    child.on("close", () => {
      clearTimeout(timer);
      const line = stdout.trim().split(/\n/).filter(Boolean).pop() || "";
      try {
        const payload = JSON.parse(line);
        finish({
          ok: payload.ok === true,
          reason: payload.reason || (payload.ok ? "extracted" : "pdf_craft_failed"),
          errorType: payload.errorType || "",
          message: payload.message || stderr,
          stdout
        });
      } catch (_error) {
        finish({ ok: false, reason: "pdf_craft_failed", errorType: "InvalidExtractOutput", message: stderr || stdout, stdout });
      }
    });
  });
}

async function extractScanFromImage({ buffer, mimeType = "image/png", env = process.env, spawnImpl, python, scriptPath } = {}) {
  const config = pdfCraftOcrConfig(env);
  if (!config.configured) return failureResult("ocr_not_configured");
  if (!buffer || !buffer.length) return failureResult("pdf_craft_failed");
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-pdf-craft-"));
  const pdfPath = path.join(rootDir, "scan.pdf");
  const markdownPath = path.join(rootDir, "page.md");
  const assetsPath = path.join(rootDir, "assets");
  try {
    fs.mkdirSync(assetsPath);
    fs.writeFileSync(pdfPath, await imageToSinglePagePdf(buffer, mimeType));
    const ran = await runPdfCraftProcess({
      python: python || env.PDF_CRAFT_PYTHON || "python3",
      scriptPath: scriptPath || path.join(__dirname, "scripts", "pdf_craft_extract.py"),
      pdfPath,
      markdownPath,
      assetsPath,
      env,
      spawnImpl
    });
    if (!ran.ok) {
      logExtractFailure(ran);
      return failureResult(ran.reason);
    }
    return readCraftDirectory(rootDir, markdownPath);
  } catch (error) {
    logExtractFailure({ reason: "pdf_craft_failed", errorType: error?.name || "Error", message: error?.message || "" });
    return failureResult("pdf_craft_failed");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

module.exports = {
  EXTRACT_TIMEOUT_MS,
  extractScanFromImage,
  failureResult,
  logExtractFailure,
  redactExtractMessage,
  imageToSinglePagePdf,
  normalizeScanBlocks,
  parseImageDataUrl,
  pdfCraftOcrConfig,
  pdfCraftVendorKind,
  piecesToResult,
  readCraftDirectory,
  separateCraftMarkdown,
  unavailableMessage
};
