const path = require("node:path");
const { Worker } = require("node:worker_threads");

const MAX_HEIC_BYTES = 12 * 1024 * 1024;
const MAX_JPEG_BYTES = 16 * 1024 * 1024;
const CONVERSION_TIMEOUT_MS = 20_000;
const MAX_CONCURRENT_CONVERSIONS = 2;
let activeConversions = 0;

function isHeicBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const brands = buffer.subarray(8, Math.min(buffer.length, 64)).toString("ascii");
  return /(?:heic|heix|hevc|hevx|heim|heis|mif1|msf1)/.test(brands);
}

function parseHeicDataUrl(value) {
  const match = String(value || "").match(/^data:image\/(?:heic|heif|heic-sequence|heif-sequence);base64,([a-z0-9+/=]+)$/i);
  if (!match) throw Object.assign(new Error("invalid_heic"), { statusCode: 400 });
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length || buffer.length > MAX_HEIC_BYTES || !isHeicBuffer(buffer)) {
    throw Object.assign(new Error(buffer.length > MAX_HEIC_BYTES ? "heic_too_large" : "invalid_heic"), { statusCode: 400 });
  }
  return buffer;
}

function convertHeicBuffer(buffer) {
  if (!isHeicBuffer(buffer)) return Promise.reject(Object.assign(new Error("invalid_heic"), { statusCode: 400 }));
  if (buffer.length > MAX_HEIC_BYTES) return Promise.reject(Object.assign(new Error("heic_too_large"), { statusCode: 400 }));
  if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
    return Promise.reject(Object.assign(new Error("heic_converter_busy"), { statusCode: 503 }));
  }

  activeConversions += 1;
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "heic-conversion-worker.js"), {
      resourceLimits: { maxOldGenerationSizeMb: 384, stackSizeMb: 4 }
    });
    let settled = false;
    const finish = (error, jpeg) => {
      if (settled) return;
      settled = true;
      activeConversions = Math.max(0, activeConversions - 1);
      clearTimeout(timer);
      worker.terminate().catch(() => {});
      if (error) reject(error);
      else resolve(jpeg);
    };
    const timer = setTimeout(() => finish(Object.assign(new Error("heic_conversion_timeout"), { statusCode: 504 })), CONVERSION_TIMEOUT_MS);
    worker.once("error", () => finish(Object.assign(new Error("heic_conversion_failed"), { statusCode: 422 })));
    worker.once("exit", (code) => {
      if (!settled && code !== 0) finish(Object.assign(new Error("heic_conversion_failed"), { statusCode: 422 }));
    });
    worker.once("message", (message) => {
      if (!message?.ok) return finish(Object.assign(new Error("heic_conversion_failed"), { statusCode: 422 }));
      const jpeg = Buffer.from(message.jpeg);
      if (!jpeg.length || jpeg.length > MAX_JPEG_BYTES || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
        return finish(Object.assign(new Error("heic_conversion_failed"), { statusCode: 422 }));
      }
      finish(null, jpeg);
    });
    const exactInput = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    worker.postMessage({ bytes: exactInput, quality: 0.86 }, [exactInput]);
  });
}

module.exports = { CONVERSION_TIMEOUT_MS, MAX_HEIC_BYTES, convertHeicBuffer, isHeicBuffer, parseHeicDataUrl };
