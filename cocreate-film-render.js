const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { resolveBinary } = require("./ffmpeg-movie-renderer");
const { cleanFilename, parseImageDataUrl } = require("./parent-book-pdf");

const FILM_WIDTH = 1280;
const FILM_HEIGHT = 720;
const DEFAULT_SECONDS = 3.5;
const MIN_SECONDS = 2.5;
const MAX_SECONDS = 6;
const MAX_SCENES = 12;
const FONT_CANDIDATES = [
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
  "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
  "/System/Library/Fonts/STHeiti Light.ttc",
  "/System/Library/Fonts/PingFang.ttc"
];

function run(binary, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, stdio: ["ignore", "ignore", "pipe"] });
    let logs = "";
    child.stderr.on("data", (chunk) => {
      logs = `${logs}${chunk}`.slice(-14_000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(logs.slice(-2200) || `FFmpeg exited with code ${code}.`));
    });
  });
}

function findCaptionFont() {
  return FONT_CANDIDATES.find((filePath) => fs.existsSync(filePath)) || "";
}

function imageExtension(mimeType, buffer) {
  if (mimeType === "image/png" || (buffer && buffer[0] === 0x89)) return ".png";
  return ".jpg";
}

function sceneDuration(value) {
  return Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, Number(value) || DEFAULT_SECONDS));
}

function escapeAss(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\N");
}

function writeAssCaption(root, index, text, seconds, { titleCard = false } = {}) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim().slice(0, 180);
  if (!cleaned) return "";
  const end = new Date(seconds * 1000).toISOString().substring(11, 23);
  const fontName = findCaptionFont() ? "Noto Sans CJK SC" : "Sans";
  const size = titleCard ? 52 : 34;
  const marginV = titleCard ? 280 : 48;
  const alignment = titleCard ? 5 : 2;
  const filePath = path.join(root, `caption-${String(index + 1).padStart(2, "0")}.ass`);
  const body = `[Script Info]
ScriptType: v4.00+
PlayResX: ${FILM_WIDTH}
PlayResY: ${FILM_HEIGHT}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${size},&H00E6F1F4,&H00000000,&H9914181A,&H6614181A,0,0,0,0,100,100,0,0,1,3,0,${alignment},48,48,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,${end},Default,,0,0,0,,${escapeAss(cleaned)}
`;
  fs.writeFileSync(filePath, body, { mode: 0o600 });
  return filePath;
}

function captionFilter(assPath) {
  if (!assPath) return "";
  const escaped = assPath.replaceAll("\\", "\\\\").replaceAll(":", "\\:").replaceAll("'", "\\'");
  return `subtitles='${escaped}'`;
}

async function renderStillScene({ binary, root, imagePath, outputPath, seconds, assPath }) {
  const frames = Math.round(seconds * 30);
  const filters = [
    "scale=1536:864:force_original_aspect_ratio=decrease",
    "pad=1536:864:(ow-iw)/2:(oh-ih)/2:color=0x1a1814",
    `zoompan=z='min(zoom+0.0012,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${FILM_WIDTH}x${FILM_HEIGHT}:fps=30`,
    "format=yuv420p"
  ];
  const caption = captionFilter(assPath);
  if (caption) filters.push(caption);
  await run(binary, [
    "-y",
    "-loop", "1",
    "-i", imagePath,
    "-f", "lavfi",
    "-t", String(seconds),
    "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-vf", filters.join(","),
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "22",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "96k",
    "-ar", "48000",
    "-ac", "2",
    "-t", String(seconds),
    "-shortest",
    "-movflags", "+faststart",
    outputPath
  ], root);
}

async function renderTitleCard({ binary, root, outputPath, seconds, assPath }) {
  const filters = ["format=yuv420p"];
  const caption = captionFilter(assPath);
  if (caption) filters.push(caption);
  await run(binary, [
    "-y",
    "-f", "lavfi",
    "-t", String(seconds),
    "-i", `color=c=0x1a1814:s=${FILM_WIDTH}x${FILM_HEIGHT}:r=30`,
    "-f", "lavfi",
    "-t", String(seconds),
    "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-vf", filters.join(","),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "22",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "96k",
    "-ar", "48000",
    "-ac", "2",
    "-t", String(seconds),
    "-shortest",
    "-movflags", "+faststart",
    outputPath
  ], root);
}

async function normalizeClip({ binary, root, inputPath, outputPath }) {
  await run(binary, [
    "-y",
    "-i", inputPath,
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-vf", `scale=${FILM_WIDTH}:${FILM_HEIGHT}:force_original_aspect_ratio=decrease,pad=${FILM_WIDTH}:${FILM_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x1a1814,setsar=1,fps=30,format=yuv420p`,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "22",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "96k",
    "-ar", "48000",
    "-ac", "2",
    "-shortest",
    "-movflags", "+faststart",
    outputPath
  ], root);
}

async function concatClips({ binary, root, files, outputPath }) {
  const listPath = path.join(root, "scenes.txt");
  const lines = files.map((filePath) => `file '${filePath.replaceAll("'", "'\\''")}'`);
  fs.writeFileSync(listPath, `${lines.join("\n")}\n`, { mode: 0o600 });
  await run(binary, [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listPath,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "22",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "96k",
    "-ar", "48000",
    "-ac", "2",
    "-movflags", "+faststart",
    outputPath
  ], root);
}

function modeFor(usedAiClips, total) {
  if (usedAiClips <= 0) {
    return {
      mode: "slideshow",
      generator: "ffmpeg-kenburns",
      labelZh: "画面运动短片（Ken Burns / 翻页），不是 Seedance 生成的 AI 镜头",
      labelEn: "Motion slideshow film (Ken Burns), not a Seedance-generated AI clip"
    };
  }
  if (usedAiClips < total) {
    return {
      mode: "mixed",
      generator: "seedance+ffmpeg-kenburns",
      labelZh: "部分场景使用了已接通的 AI 镜头，其余场景使用画面运动短片。备选部分不是 Seedance 生成。",
      labelEn: "Some scenes use connected AI clips; the rest use a motion slideshow. Fallback scenes are not Seedance-generated."
    };
  }
  return {
    mode: "ai_clips",
    generator: "seedance+ffmpeg",
    labelZh: "场景镜头由已接通的 AI 视频生成，并用 FFmpeg 拼接。",
    labelEn: "Scene clips were generated by the connected AI video service and stitched with FFmpeg."
  };
}

async function renderCocreateFilm({ scenes = [], secondsPerScene = DEFAULT_SECONDS, title = "", workDirectory, generateClip } = {}) {
  if (!Array.isArray(scenes) || !scenes.length) {
    throw Object.assign(new Error("scenes_required"), { statusCode: 400 });
  }
  if (scenes.length > MAX_SCENES) {
    throw Object.assign(new Error("too_many_scenes"), { statusCode: 400 });
  }

  const binary = resolveBinary();
  if (!binary) {
    throw Object.assign(new Error("ffmpeg_unavailable"), { statusCode: 503 });
  }

  const seconds = sceneDuration(secondsPerScene);
  const root = workDirectory || fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-cocreate-film-"));
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });

  try {
    const files = [];
    let usedAiClips = 0;

    for (let index = 0; index < scenes.length; index += 1) {
      const scene = scenes[index];
      const outputPath = path.join(root, `scene-${String(index + 1).padStart(2, "0")}.mp4`);
      let clipBuffer = scene.clipBuffer;
      if (!clipBuffer && typeof generateClip === "function") {
        try {
          const generated = await generateClip(scene, index);
          if (generated?.buffer) clipBuffer = generated.buffer;
        } catch (_error) {
          clipBuffer = null;
        }
      }

      if (clipBuffer && Buffer.isBuffer(clipBuffer) && clipBuffer.length > 1024) {
        const sourcePath = path.join(root, `clip-${String(index + 1).padStart(2, "0")}.mp4`);
        fs.writeFileSync(sourcePath, clipBuffer, { mode: 0o600 });
        await normalizeClip({ binary, root, inputPath: sourcePath, outputPath });
        usedAiClips += 1;
      } else {
        const image = scene.buffer
          ? { buffer: scene.buffer, mimeType: scene.mimeType || "image/jpeg" }
          : (scene.imageDataUrl ? parseImageDataUrl(scene.imageDataUrl) : null);
        const caption = [scene.text, scene.displayName].filter(Boolean).join("  ·  ");
        const assPath = writeAssCaption(root, index, caption, seconds, { titleCard: !image?.buffer });
        if (image?.buffer) {
          const imagePath = path.join(root, `still-${String(index + 1).padStart(2, "0")}${imageExtension(image.mimeType, image.buffer)}`);
          fs.writeFileSync(imagePath, image.buffer, { mode: 0o600 });
          await renderStillScene({ binary, root, imagePath, outputPath, seconds, assPath });
        } else {
          await renderTitleCard({ binary, root, outputPath, seconds, assPath });
        }
      }

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1024) {
        throw Object.assign(new Error("scene_render_failed"), { statusCode: 500 });
      }
      files.push(outputPath);
    }

    const outputPath = path.join(root, "storieslens-cocreate-film.mp4");
    await concatClips({ binary, root, files, outputPath });
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1024) {
      throw Object.assign(new Error("film_render_failed"), { statusCode: 500 });
    }

    const buffer = fs.readFileSync(outputPath);
    const info = modeFor(usedAiClips, scenes.length);
    return {
      buffer,
      filename: `${cleanFilename(title || "storieslens-cocreate-film")}.mp4`,
      mimeType: "video/mp4",
      width: FILM_WIDTH,
      height: FILM_HEIGHT,
      duration: seconds * scenes.length,
      sceneCount: files.length,
      usedAiClips,
      ...info
    };
  } finally {
    if (!workDirectory) fs.rmSync(root, { recursive: true, force: true });
  }
}

module.exports = {
  DEFAULT_SECONDS,
  FILM_HEIGHT,
  FILM_WIDTH,
  MAX_SCENES,
  findCaptionFont,
  renderCocreateFilm
};
