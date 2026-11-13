const assert = require("node:assert/strict");
const test = require("node:test");
const { assembleFamilyAiFilm, movieArgs } = require("../family-ai-film");

test("AI film compositor produces a vertical H.264 movie with six five-second scenes", () => {
  const args = movieArgs(Array.from({ length: 6 }, (_, index) => `scene-${index}.mp4`), "movie.mp4");
  const graph = args[args.indexOf("-filter_complex") + 1];
  assert.match(graph, /scale=720:1280/);
  assert.equal((graph.match(/trim=duration=5/g) || []).length, 6);
  assert.match(graph, /concat=n=6:v=1:a=0/);
  assert.deepEqual(args.slice(-7), ["-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", "movie.mp4"]);
  assert(args.includes("libx264"));
});

test("AI film compositor rejects missing and oversized clips before encoding", async () => {
  await assert.rejects(() => assembleFamilyAiFilm([]), /invalid_video_clips/);
  await assert.rejects(() => assembleFamilyAiFilm([Buffer.alloc(0)]), /invalid_video_clips/);
  await assert.rejects(() => assembleFamilyAiFilm(Array.from({ length: 7 }, () => Buffer.from("x"))), /invalid_video_clips/);
});
