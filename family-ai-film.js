const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { resolveBinary } = require("./ffmpeg-movie-renderer");

function movieArgs(inputs, output) {
  const filters = inputs.map((_, index) => `[${index}:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0xf4efe6,fps=24,setsar=1,trim=duration=5,setpts=PTS-STARTPTS[v${index}]`);
  filters.push(`${inputs.map((_, index) => `[v${index}]`).join("")}concat=n=${inputs.length}:v=1:a=0[outv]`);
  return ["-y", ...inputs.flatMap((input) => ["-i", input]), "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000", "-filter_complex", filters.join(";"), "-map", "[outv]", "-map", `${inputs.length}:a:0`, "-shortest", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", output];
}

async function assembleFamilyAiFilm(clips) {
  if (!Array.isArray(clips) || clips.length < 1 || clips.length > 6 || clips.some((clip) => !Buffer.isBuffer(clip) || !clip.length || clip.length > 50_000_000)) {
    throw Object.assign(new Error("invalid_video_clips"), { statusCode: 400 });
  }
  const binary = resolveBinary();
  if (!binary) throw Object.assign(new Error("ffmpeg_unavailable"), { statusCode: 503 });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-ai-film-"));
  try {
    const inputs = clips.map((clip, index) => {
      const filename = path.join(directory, `scene-${index}.mp4`);
      fs.writeFileSync(filename, clip, { mode: 0o600 });
      return filename;
    });
    const output = path.join(directory, "movie.mp4");
    await new Promise((resolve, reject) => {
      const child = spawn(binary, movieArgs(inputs, output), { stdio: ["ignore", "ignore", "pipe"] });
      let error = "";
      child.stderr.on("data", (chunk) => { error = `${error}${chunk}`.slice(-1000); });
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(error || "movie_assembly_failed")));
    });
    const movie = fs.readFileSync(output);
    if (!movie.length || movie.length > 100_000_000) throw Object.assign(new Error("movie_too_large"), { statusCode: 413 });
    return movie;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

module.exports = { assembleFamilyAiFilm, movieArgs };
