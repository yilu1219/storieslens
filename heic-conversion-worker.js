const { parentPort } = require("node:worker_threads");
const convert = require("heic-convert");

parentPort.once("message", async ({ bytes, quality }) => {
  try {
    const jpeg = await convert({
      buffer: Buffer.from(bytes),
      format: "JPEG",
      quality: Number(quality) || 0.86
    });
    const exact = jpeg.buffer.slice(jpeg.byteOffset, jpeg.byteOffset + jpeg.byteLength);
    parentPort.postMessage({ ok: true, jpeg: exact }, [exact]);
  } catch (error) {
    parentPort.postMessage({ ok: false, error: String(error?.message || error || "heic_decode_failed") });
  }
});
