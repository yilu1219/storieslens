const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { assertPublicHttps, queueFfmpegRender, resolveBinary, segmentArgs } = require("../ffmpeg-movie-renderer");

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=", "base64");

test("FFmpeg assembly is available without HyperFrames", { skip: !resolveBinary() }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-ffmpeg-test-"));
  fs.mkdirSync(path.join(root, "assets"), { recursive: true });
  const imagePath = path.join(root, "assets", "scene.png");
  fs.writeFileSync(imagePath, png);
  const job = { id: "render-test", aspectRatio: "16:9", resolution: "720p" };
  const finalState = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("FFmpeg render timed out.")), 30_000);
    const result = queueFfmpegRender({
      root,
      project: { scenes: [{ id: "one", title: "One", imageUrl: "/assets/scene.png", duration: 2 }] },
      mediaRecords: [],
      job,
      onUpdate(update) {
        if (update.status === "completed" || update.status === "failed") {
          clearTimeout(timer);
          resolve(update);
        }
      }
    });
    assert.strictEqual(result.started, true);
    assert.strictEqual(result.provider, "seedance-scenes+ffmpeg");
  });
  assert.strictEqual(finalState.status, "completed", finalState.error);
  assert.strictEqual(finalState.provider, "seedance-scenes+ffmpeg");
  assert(fs.statSync(finalState.outputFilePath).size > 1024);
  fs.rmSync(root, { recursive: true, force: true });
});

test("movie segments are normalized to H.264 with AAC audio", () => {
  const args = segmentArgs({ mediaPath: "scene.png", narrationPath: "", isVideo: false, duration: 5, width: 1280, height: 720, outputPath: "segment.mp4" });
  assert(args.includes("libx264"));
  assert(args.includes("aac"));
  assert(args.some((entry) => entry.includes("scale=1280:720")));
  assert(!args.join(" ").toLowerCase().includes("hyperframes"));
});

test("remote render assets reject private and loopback addresses", async () => {
  await assert.rejects(() => assertPublicHttps("https://127.0.0.1/private.png"), /not allowed/);
  await assert.rejects(() => assertPublicHttps("http://example.com/public.png"), /HTTPS/);
});
