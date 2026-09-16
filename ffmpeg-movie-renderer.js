const dns = require("dns").promises;
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function resolveBinary() {
  const configured = String(process.env.FFMPEG_BIN || "").trim();
  if (configured && fs.existsSync(configured)) return configured;
  try {
    const bundled = require("ffmpeg-static");
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {}
  const candidates = ["/usr/local/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/bin/ffmpeg"];
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function privateIp(address) {
  if (!net.isIP(address)) return true;
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return privateIp(mappedIpv4);
  if (["::", "::1"].includes(normalized) || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("127.") || normalized.startsWith("10.") || normalized.startsWith("192.168.") || normalized.startsWith("169.254.")) return true;
  const parts = normalized.split(".").map(Number);
  return parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

async function assertPublicHttps(rawUrl) {
  const parsed = new URL(String(rawUrl || ""));
  if (parsed.protocol !== "https:") throw new Error("Remote movie assets must use HTTPS.");
  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => privateIp(entry.address))) throw new Error("Remote movie asset host is not allowed.");
  return parsed;
}

async function fetchPublicHttps(rawUrl, { timeoutMs = 45_000 } = {}) {
  let currentUrl = (await assertPublicHttps(rawUrl)).toString();
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const response = await fetch(currentUrl, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("A remote asset redirect was missing its destination.");
    currentUrl = (await assertPublicHttps(new URL(location, currentUrl).toString())).toString();
    if (redirects === 5) throw new Error("A remote asset followed too many redirects.");
  }
  throw new Error("A remote asset could not be downloaded.");
}

function localMediaPath(root, mediaRecords, url, narrationMediaId) {
  if (narrationMediaId) return mediaRecords.find((item) => item.id === narrationMediaId)?.filePath || "";
  const value = String(url || "");
  const privateMatch = value.match(/^\/api\/media\/([^/?#]+)/);
  if (privateMatch) return mediaRecords.find((item) => item.id === privateMatch[1])?.filePath || "";
  if (/^\/(?:assets|public\/generated)\//.test(value)) {
    const filePath = path.resolve(root, value.replace(/^\/+/, ""));
    return filePath.startsWith(root) && fs.existsSync(filePath) ? filePath : "";
  }
  return "";
}

function extensionFor(contentType, sourceUrl) {
  const known = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/webm": ".webm"
  };
  if (known[String(contentType || "").split(";")[0]]) return known[String(contentType || "").split(";")[0]];
  const extension = path.extname(new URL(sourceUrl).pathname).toLowerCase();
  return /^\.[a-z0-9]{2,5}$/.test(extension) ? extension : ".bin";
}

async function downloadRemoteAsset(sourceUrl, targetBase) {
  const response = await fetchPublicHttps(sourceUrl);
  if (!response.ok) throw new Error(`A movie asset could not be downloaded (${response.status}).`);
  await assertPublicHttps(response.url);
  const declaredBytes = Number(response.headers.get("content-length") || 0);
  if (declaredBytes > 120 * 1024 * 1024) throw new Error("A movie asset is larger than the 120 MB beta limit.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 120 * 1024 * 1024) throw new Error("A movie asset is larger than the 120 MB beta limit.");
  const targetPath = `${targetBase}${extensionFor(response.headers.get("content-type"), response.url)}`;
  fs.writeFileSync(targetPath, buffer, { mode: 0o600 });
  return targetPath;
}

async function stageAsset({ root, mediaRecords, url, narrationMediaId, targetBase }) {
  const localPath = localMediaPath(root, mediaRecords, url, narrationMediaId);
  if (localPath && fs.existsSync(localPath)) return localPath;
  if (/^https:\/\//i.test(String(url || ""))) return downloadRemoteAsset(url, targetBase);
  return "";
}

function run(binary, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, stdio: ["ignore", "ignore", "pipe"] });
    let logs = "";
    child.stderr.on("data", (chunk) => { logs = `${logs}${chunk}`.slice(-10_000); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(logs.slice(-2200) || `FFmpeg exited with code ${code}.`)));
  });
}

function segmentArgs({ mediaPath, narrationPath, isVideo, duration, width, height, outputPath }) {
  const args = ["-y"];
  if (isVideo) args.push("-stream_loop", "-1", "-i", mediaPath);
  else args.push("-loop", "1", "-framerate", "30", "-i", mediaPath);
  if (narrationPath) args.push("-i", narrationPath);
  else args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");
  args.push(
    "-map", "0:v:0", "-map", "1:a:0",
    "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x08110f,setsar=1,fps=30`,
    "-af", `apad=whole_dur=${duration}`,
    "-t", String(duration),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
    "-movflags", "+faststart", outputPath
  );
  return args;
}

function concatLine(filePath) {
  return `file '${filePath.replaceAll("'", "'\\''")}'`;
}

function queueFfmpegRender({ root, project, mediaRecords, job, onUpdate }) {
  const binary = resolveBinary();
  if (!binary) return { started: false, reason: "FFmpeg is not installed on this server." };
  const workingDirectory = path.join(root, ".data", "render-jobs", job.id);
  fs.mkdirSync(workingDirectory, { recursive: true, mode: 0o700 });

  (async () => {
    try {
      const portrait = job.aspectRatio === "9:16";
      const width = portrait ? (job.resolution === "1080p" ? 1080 : 720) : (job.resolution === "1080p" ? 1920 : 1280);
      const height = portrait ? (job.resolution === "1080p" ? 1920 : 1280) : (job.resolution === "1080p" ? 1080 : 720);
      const segments = [];
      for (let index = 0; index < project.scenes.length; index += 1) {
        const scene = project.scenes[index];
        const duration = Math.max(2, Math.min(12, Number(scene.duration) || 5));
        const visualUrl = scene.videoUrl || scene.imageUrl;
        const mediaPath = await stageAsset({ root, mediaRecords, url: visualUrl, targetBase: path.join(workingDirectory, `scene-${index + 1}-visual`) });
        if (!mediaPath) throw new Error(`Scene ${index + 1} has no downloadable approved image or video.`);
        const narrationPath = await stageAsset({ root, mediaRecords, narrationMediaId: scene.narrationMediaId, targetBase: path.join(workingDirectory, `scene-${index + 1}-narration`) });
        const segmentPath = path.join(workingDirectory, `segment-${String(index + 1).padStart(2, "0")}.mp4`);
        await run(binary, segmentArgs({ mediaPath, narrationPath, isVideo: Boolean(scene.videoUrl), duration, width, height, outputPath: segmentPath }), workingDirectory);
        segments.push(segmentPath);
        onUpdate({ progress: Math.round(((index + 1) / (project.scenes.length + 1)) * 100) });
      }
      const concatPath = path.join(workingDirectory, "segments.txt");
      fs.writeFileSync(concatPath, `${segments.map(concatLine).join(os.EOL)}${os.EOL}`, { mode: 0o600 });
      const outputPath = path.join(workingDirectory, "storieslens-final.mp4");
      await run(binary, ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", "-movflags", "+faststart", outputPath], workingDirectory);
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1024) throw new Error("FFmpeg finished without a usable movie file.");
      onUpdate({ status: "completed", provider: "seedance-scenes+ffmpeg", progress: 100, outputUrl: `/api/render-jobs/${job.id}/output`, outputFilePath: outputPath, completedAt: new Date().toISOString(), error: "" });
    } catch (error) {
      onUpdate({ status: "failed", error: String(error.message || error).replaceAll(root, "[workspace]").slice(-1800) });
    }
  })();

  return { started: true, provider: "seedance-scenes+ffmpeg" };
}

module.exports = { assertPublicHttps, fetchPublicHttps, queueFfmpegRender, resolveBinary, segmentArgs };
