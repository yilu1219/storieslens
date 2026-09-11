const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function resolveBinary(root) {
  const candidates = [
    process.env.HYPERFRAMES_BIN,
    path.join(root, "node_modules", ".bin", "hyperframes"),
    path.join(os.homedir(), ".codex", "skills", "hyperframes", ".runtime", "node_modules", ".bin", "hyperframes")
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
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

function copyAsset(sourcePath, assetDirectory, name) {
  if (!sourcePath || !fs.existsSync(sourcePath)) return "";
  const extension = path.extname(sourcePath).toLowerCase() || ".bin";
  const targetName = `${name}${extension}`;
  fs.copyFileSync(sourcePath, path.join(assetDirectory, targetName));
  return `assets/${targetName}`;
}

function compositionHtml(project, job, mediaRecords, root, workingDirectory) {
  const portrait = job.aspectRatio === "9:16";
  const width = portrait ? 1080 : 1920;
  const height = portrait ? 1920 : 1080;
  const assetDirectory = path.join(workingDirectory, "assets");
  fs.mkdirSync(assetDirectory, { recursive: true, mode: 0o700 });
  let cursor = 0;
  const clips = [];
  const audios = [];

  project.scenes.forEach((scene, index) => {
    const duration = Math.max(2, Math.min(12, Number(scene.duration) || 5));
    const videoPath = localMediaPath(root, mediaRecords, scene.videoUrl);
    const imagePath = localMediaPath(root, mediaRecords, scene.imageUrl);
    const video = copyAsset(videoPath, assetDirectory, `scene-${index + 1}-video`);
    const image = copyAsset(imagePath, assetDirectory, `scene-${index + 1}-image`);
    const media = video
      ? `<video id="scene-${index + 1}-video" src="${escapeHtml(video)}" muted playsinline></video>`
      : image
        ? `<img id="scene-${index + 1}-image" src="${escapeHtml(image)}" alt="">`
        : `<div class="fallback">${escapeHtml(scene.title || project.title)}</div>`;
    clips.push(`<section id="scene-${index + 1}" class="clip" data-track-index="1" data-start="${cursor}" data-duration="${duration}">${media}<div class="shade"></div><p data-layout-allow-caption-zone>${escapeHtml(scene.caption || scene.text || "")}</p></section>`);
    const narrationPath = localMediaPath(root, mediaRecords, "", scene.narrationMediaId);
    const narration = copyAsset(narrationPath, assetDirectory, `scene-${index + 1}-narration`);
    if (narration) audios.push(`<audio id="scene-${index + 1}-narration" src="${escapeHtml(narration)}" data-start="${cursor}" data-duration="${duration}"></audio>`);
    cursor += duration;
  });

  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=${width},height=${height}"><title>${escapeHtml(project.title)} · StoriesLens</title><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>
@font-face{font-family:StorySong;src:local("Songti SC"),local("SimSun"),local("Times New Roman")}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#080b14;color:#fff;font-family:StorySong,serif}#root{position:relative;width:${width}px;height:${height}px;overflow:hidden;background:#080b14}.clip{position:absolute;inset:0;overflow:hidden;background:#080b14}.clip img,.clip video{width:100%;height:100%;object-fit:cover}.fallback{display:grid;width:100%;height:100%;place-items:center;padding:8%;box-sizing:border-box;font-size:${portrait ? 76 : 92}px;text-align:center;background:radial-gradient(circle at 50% 30%,#374d6d,#080b14 70%)}.shade{position:absolute;inset:0;background:linear-gradient(transparent 54%,rgba(0,0,0,.78))}.clip p{position:absolute;z-index:2;left:7%;right:7%;bottom:7%;margin:0;color:#fff;font-size:${portrait ? 58 : 54}px;line-height:1.3;text-align:center;text-shadow:0 3px 18px #000} 
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-width="${width}" data-height="${height}" data-duration="${cursor}">${clips.join("")}${audios.join("")}</div><script>const tl=gsap.timeline({paused:true});document.querySelectorAll('.clip img').forEach((el,index)=>tl.fromTo(el,{scale:1},{scale:1.055,duration:Number(el.closest('.clip').dataset.duration),ease:'none'},Number(el.closest('.clip').dataset.start)));window.__timelines.main=tl;</script></body></html>`;
}

function queueHyperframesRender({ root, project, mediaRecords, job, onUpdate }) {
  const binary = resolveBinary(root);
  if (!binary) return { started: false, reason: "HyperFrames is not installed on this server." };
  const workingDirectory = path.join(root, ".data", "render-jobs", job.id);
  fs.mkdirSync(workingDirectory, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(workingDirectory, "index.html"), compositionHtml(project, job, mediaRecords, root, workingDirectory), { mode: 0o600 });
  const outputPath = path.join(workingDirectory, "output.mp4");
  const quality = job.resolution === "1080p" ? "high" : "draft";
  const modulePath = path.resolve(path.dirname(binary), "..", "hyperframes", "bin", "hyperframes.mjs");
  const command = fs.existsSync(modulePath) ? process.execPath : binary;
  const commandArgs = [...(command === process.execPath ? [modulePath] : []), "render", workingDirectory, "--quality", quality, "--output", outputPath, "--quiet"];
  const child = spawn(command, commandArgs, {
    cwd: workingDirectory,
    env: { ...process.env, HYPERFRAMES_RUN_ID: job.id },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", (chunk) => { logs = `${logs}${chunk}`.slice(-6000); });
  child.stderr.on("data", (chunk) => { logs = `${logs}${chunk}`.slice(-6000); });
  child.on("error", (error) => onUpdate({ status: "failed", error: error.message }));
  child.on("close", (code) => {
    if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      onUpdate({ status: "completed", outputUrl: `/api/render-jobs/${job.id}/output`, outputFilePath: outputPath, completedAt: new Date().toISOString(), error: "" });
    } else {
      onUpdate({ status: "failed", error: logs.replaceAll(root, "[workspace]").slice(-1400) || `HyperFrames exited with code ${code}.` });
    }
  });
  return { started: true, pid: child.pid };
}

module.exports = { compositionHtml, queueHyperframesRender, resolveBinary };
