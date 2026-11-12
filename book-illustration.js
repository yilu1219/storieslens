const { redactExtractMessage } = require("./pdf-craft-extract");

const ILLUSTRATION_TIMEOUT_MS = 90_000;
const MIN_PIXELS = 3_686_400;
const MAX_PIXELS = 16_777_216;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ARK_SEEDREAM_PRO_MODEL = "doubao-seedream-5-0-pro-260628";
const ARK_IMAGE_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

function cleanSecret(value) {
  const key = String(value || "").trim();
  if (!key || /[\s\u0000-\u001f\u007f]/.test(key)) return "";
  return key;
}

function arkApiKey(env = {}) {
  return cleanSecret(env.ARK_API_KEY) || cleanSecret(env.VOLCENGINE_ARK_API_KEY);
}

function arkIllustrationConfig(env, apiKey) {
  const model = String(env.ARK_IMAGE_MODEL || ARK_SEEDREAM_PRO_MODEL).trim() || ARK_SEEDREAM_PRO_MODEL;
  const requested = String(env.ARK_IMAGE_API_URL || "").trim().replace(/\/+$/, "");
  const endpoint = /^https:\/\/\S+$/i.test(requested) ? requested : ARK_IMAGE_ENDPOINT;
  if (!/^[\w.-]+$/.test(model)) {
    return { configured: false, provider: "ark", reason: "illustration_not_configured", model, endpoint };
  }
  return { configured: true, provider: "ark", apiKey, model, endpoint };
}

function illustrationConfig(env = process.env) {
  // Family-book polish uses its own Ark key. CHINA_ARK_API_KEY stays on the
  // signed-in Mainland image route and is not a fallback here.
  const arkKey = arkApiKey(env);
  if (arkKey) return arkIllustrationConfig(env, arkKey);

  const model = String(env.BOOK_ILLUSTRATION_MODEL || "seedream-4.5").trim() || "seedream-4.5";
  const baseUrl = String(env.BOOK_ILLUSTRATION_BASE_URL || "https://api.novita.ai").trim().replace(/\/+$/, "");
  if (!/^[\w.-]+$/.test(model)) {
    return { configured: false, provider: "novita", reason: "illustration_not_configured", model, baseUrl };
  }
  let apiKey = cleanSecret(env.BOOK_ILLUSTRATION_API_KEY);
  if (!apiKey && /novita\.ai/i.test(String(env.PDF_CRAFT_OCR_BASE_URL || ""))) {
    apiKey = cleanSecret(env.PDF_CRAFT_OCR_API_KEY);
  }
  if (!apiKey) return { configured: false, provider: "novita", reason: "illustration_not_configured", model, baseUrl };
  return {
    configured: true,
    provider: "novita",
    apiKey,
    model,
    baseUrl,
    endpoint: `${baseUrl}/v3/${model}`
  };
}

function illustrationPrompt(text) {
  const note = String(text || "").replace(/\s+/g, " ").trim().slice(0, 280);
  const base = "Polish the attached child's drawing into a finished print illustration. Preserve the same composition, characters, colors, and subject. Do not invent a new story, a different scene, or extra characters. Do not draw any words, letters, captions, signatures, logos, or watermarks.";
  if (!note) return base;
  return `${base} The drawing relates to this note, but do not render the note as text: ${note}`;
}

// Floor matches Seedream 4.5's minimum (3,686,400) and stays under Seedream
// 5.0 Pro's maximum (4,624,220), so one pixel size fits both providers.
function illustrationSize(width, height) {
  let aspect = Math.max(1, Number(width) || 148) / Math.max(1, Number(height) || 210);
  aspect = Math.min(16, Math.max(1 / 16, aspect));
  let outHeight = Math.ceil(Math.sqrt(MIN_PIXELS / aspect));
  let outWidth = Math.ceil(outHeight * aspect);
  while (outWidth * outHeight < MIN_PIXELS) {
    outHeight += 1;
    outWidth = Math.ceil(outHeight * aspect);
  }
  if (outWidth * outHeight > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / (outWidth * outHeight));
    outWidth = Math.max(1, Math.floor(outWidth * scale));
    outHeight = Math.max(1, Math.floor(outHeight * scale));
  }
  return { width: outWidth, height: outHeight, size: `${outWidth}x${outHeight}` };
}

function pngSize(buffer) {
  if (!buffer || buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegSize(buffer) {
  if (!buffer || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (!length) break;
    offset += 2 + length;
  }
  return null;
}

function imageSize(buffer, mimeType) {
  const mime = String(mimeType || "").toLowerCase();
  return mime.includes("png") ? pngSize(buffer) : jpegSize(buffer);
}

function upstreamErrorMessage(payload, status) {
  const error = payload && typeof payload === "object" ? payload.error : null;
  if (typeof payload?.message === "string" && payload.message) return payload.message;
  if (typeof error === "string" && error) return error;
  if (error && typeof error.message === "string" && error.message) return error.message;
  return `status ${status}`;
}

function logIllustrationFailure(info = {}) {
  let message = redactExtractMessage(info.message);
  const secret = String(info.apiKey || "");
  if (secret) message = message.split(secret).join("[redacted]");
  console.error("family-book illustration failed", JSON.stringify({
    provider: String(info.provider || ""),
    reason: String(info.reason || "illustration_failed"),
    message
  }));
}

function firstImageValue(payload) {
  const images = payload && Array.isArray(payload.images) ? payload.images : [];
  if (images.length) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.url || first.image_url || first.b64_json || "";
  }
  const data = payload && Array.isArray(payload.data) ? payload.data : [];
  if (data[0] && typeof data[0] === "object") return data[0].b64_json || data[0].url || "";
  return "";
}

function asDataUrl(value, mimeType = "image/png") {
  const raw = String(value || "").trim();
  if (/^data:image\/(?:png|jpeg|jpg);base64,[a-z0-9+/=\s]+$/i.test(raw)) {
    return raw.replace(/\s+/g, "");
  }
  const mime = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
  if (/^[a-z0-9+/=\s]+$/i.test(raw) && raw.replace(/\s+/g, "").length > 32) {
    return `data:${mime};base64,${raw.replace(/\s+/g, "")}`;
  }
  return "";
}

function outputMime(payload) {
  const format = String(payload?.data?.[0]?.output_format || "").toLowerCase();
  return format === "jpeg" || format === "jpg" ? "image/jpeg" : "image/png";
}

function illustrationRequestBody(config, { prompt, dataUrl, size }) {
  if (config.provider === "ark") {
    return {
      model: config.model,
      prompt,
      image: dataUrl,
      size,
      output_format: "png",
      response_format: "b64_json",
      watermark: false
    };
  }
  return {
    prompt,
    image: [dataUrl],
    size,
    watermark: false,
    sequential_image_generation: "disabled"
  };
}

async function normalizeIllustrationImage(payload, fetchFn) {
  const value = firstImageValue(payload);
  const inline = asDataUrl(value, outputMime(payload));
  if (inline) return inline.length < MAX_IMAGE_BYTES * 2 ? inline : "";
  if (!/^https:\/\//i.test(value) || typeof fetchFn !== "function") return "";
  const response = await fetchFn(value, { signal: AbortSignal.timeout(ILLUSTRATION_TIMEOUT_MS) });
  if (!response.ok) return "";
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return "";
  const type = String(response.headers?.get?.("content-type") || "image/png").split(";")[0].toLowerCase();
  const mime = type === "image/jpeg" || type === "image/jpg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function illustrateFromReference({ buffer, mimeType = "image/png", text = "", env = process.env, fetchImpl = fetch, timeoutMs = ILLUSTRATION_TIMEOUT_MS } = {}) {
  const config = illustrationConfig(env);
  if (!config.configured) {
    return { status: "unavailable", reason: "illustration_not_configured", imageDataUrl: "" };
  }
  if (!buffer || !buffer.length) {
    return { status: "failed", reason: "illustration_failed", imageDataUrl: "" };
  }
  const dimensions = imageSize(buffer, mimeType) || { width: 148, height: 210 };
  const size = illustrationSize(dimensions.width, dimensions.height);
  const fetchFn = fetchImpl || fetch;
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  try {
    const response = await fetchFn(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(illustrationRequestBody(config, {
        prompt: illustrationPrompt(text),
        dataUrl,
        size: size.size
      })),
      signal: AbortSignal.timeout(timeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      logIllustrationFailure({
        provider: config.provider,
        apiKey: config.apiKey,
        reason: "illustration_failed",
        message: upstreamErrorMessage(payload, response.status)
      });
      return { status: "failed", reason: "illustration_failed", imageDataUrl: "" };
    }
    const imageDataUrl = await normalizeIllustrationImage(payload, fetchFn);
    if (!imageDataUrl) return { status: "failed", reason: "illustration_failed", imageDataUrl: "" };
    return { status: "ok", reason: "illustrated", imageDataUrl };
  } catch (error) {
    logIllustrationFailure({
      provider: config.provider,
      apiKey: config.apiKey,
      reason: "illustration_failed",
      message: error?.message || ""
    });
    return { status: "failed", reason: "illustration_failed", imageDataUrl: "" };
  }
}

module.exports = {
  ILLUSTRATION_TIMEOUT_MS,
  illustrateFromReference,
  illustrationConfig,
  illustrationPrompt,
  illustrationSize
};
