const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { resolveBinary } = require("./ffmpeg-movie-renderer");
const { A5_HEIGHT_MM, A5_WIDTH_MM, MAX_PAGES, parseImageDataUrl, cleanFilename } = require("./parent-book-pdf");

const FILM_WIDTH = 1080;
const FILM_HEIGHT = Math.round(FILM_WIDTH * (A5_HEIGHT_MM / A5_WIDTH_MM) / 2) * 2;
const DEFAULT_SECONDS = 3;
const MIN_SECONDS = 2;
const MAX_SECONDS = 8;

function run(binary, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, stdio: ["ignore", "ignore", "pipe"] });
    let logs = "";
    child.stderr.on("data", (chunk) => {
      logs = `${logs}${chunk}`.slice(-12_000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(logs.slice(-2200) || `FFmpeg exited with code ${code}.`));
    });
  });
}

function imageExtension(mimeType, buffer) {
  if (mimeType === "image/png" || (buffer && buffer[0] === 0x89)) return ".png";
  return ".jpg";
}

function filmArgs({ concatPath, duration, outputPath }) {
  return [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-f", "lavfi",
    "-t", String(duration),
    "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-vf", `scale=${FILM_WIDTH}:${FILM_HEIGHT}:force_original_aspect_ratio=decrease,pad=${FILM_WIDTH}:${FILM_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0xf4efe6,setsar=1,fps=30,format=yuv420p`,
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
    "-t", String(duration),
    "-movflags", "+faststart",
    outputPath
  ];
}

function concatList(files, secondsPerPage) {
  const lines = [];
  files.forEach((filePath, index) => {
    const escaped = filePath.replaceAll("'", "'\\''");
    lines.push(`file '${escaped}'`);
    lines.push(`duration ${secondsPerPage}`);
    if (index === files.length - 1) lines.push(`file '${escaped}'`);
  });
  return `${lines.join("\n")}\n`;
}

async function renderParentBookFilm({ pages = [], secondsPerPage = DEFAULT_SECONDS, title = "", workDirectory } = {}) {
  if (!Array.isArray(pages) || !pages.length) {
    throw Object.assign(new Error("pages_required"), { statusCode: 400 });
  }
  if (pages.length > MAX_PAGES) {
    throw Object.assign(new Error("too_many_pages"), { statusCode: 400 });
  }

  const binary = resolveBinary();
  if (!binary) {
    throw Object.assign(new Error("ffmpeg_unavailable"), { statusCode: 503 });
  }

  const duration = Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, Number(secondsPerPage) || DEFAULT_SECONDS));
  const root = workDirectory || fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-parent-book-"));
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });

  try {
    const files = [];
    for (let index = 0; index < pages.length; index += 1) {
      const image = pages[index].buffer && pages[index].mimeType
        ? { buffer: pages[index].buffer, mimeType: pages[index].mimeType }
        : parseImageDataUrl(pages[index].imageDataUrl);
      if (!image?.buffer) {
        throw Object.assign(new Error("invalid_image"), { statusCode: 400 });
      }
      const filename = `page-${String(index + 1).padStart(2, "0")}${imageExtension(image.mimeType, image.buffer)}`;
      const filePath = path.join(root, filename);
      fs.writeFileSync(filePath, image.buffer, { mode: 0o600 });
      files.push(filePath);
    }

    const concatPath = path.join(root, "pages.txt");
    fs.writeFileSync(concatPath, concatList(files, duration), { mode: 0o600 });
    const outputPath = path.join(root, "storieslens-parent-book.mp4");
    const totalDuration = duration * files.length;
    await run(binary, filmArgs({ concatPath, duration: totalDuration, outputPath }), root);

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1024) {
      throw Object.assign(new Error("film_render_failed"), { statusCode: 500 });
    }

    const buffer = fs.readFileSync(outputPath);
    return {
      buffer,
      filename: `${cleanFilename(title || "storieslens-book")}.mp4`,
      mimeType: "video/mp4",
      width: FILM_WIDTH,
      height: FILM_HEIGHT,
      duration: totalDuration,
      pageCount: files.length
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

module.exports = {
  DEFAULT_SECONDS,
  FILM_HEIGHT,
  FILM_WIDTH,
  MAX_SECONDS,
  MIN_SECONDS,
  concatList,
  filmArgs,
  renderParentBookFilm
};
