const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { resolveBinary } = require("./ffmpeg-movie-renderer");

async function reviewVideoOutput(video, reviewFrame) {
  if (!Buffer.isBuffer(video) || !video.length || video.length > 50_000_000) throw new Error("invalid_video_output");
  const binary = resolveBinary();
  if (!binary) throw new Error("ffmpeg_unavailable_for_video_review");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-video-review-"));
  try {
    const input = path.join(directory, "output.mp4");
    fs.writeFileSync(input, video, { mode: 0o600 });
    await new Promise((resolve, reject) => {
      const child = spawn(binary, ["-hide_banner", "-loglevel", "error", "-i", input, "-vf", "fps=1/2,scale=512:-2", "-frames:v", "8", "-q:v", "5", path.join(directory, "frame-%02d.jpg")], { stdio: "ignore" });
      const timeout = setTimeout(() => child.kill("SIGKILL"), 30_000);
      child.on("error", (error) => { clearTimeout(timeout); reject(error); });
      child.on("close", (code) => { clearTimeout(timeout); code === 0 ? resolve() : reject(new Error("video_frame_review_failed")); });
    });
    const frames = fs.readdirSync(directory).filter((name) => /^frame-\d+\.jpg$/.test(name)).sort();
    if (!frames.length) throw new Error("video_frame_review_failed");
    for (const frame of frames) {
      const image = `data:image/jpeg;base64,${fs.readFileSync(path.join(directory, frame)).toString("base64")}`;
      await reviewFrame(image);
    }
    return frames.length;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

module.exports = { reviewVideoOutput };
