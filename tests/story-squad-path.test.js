const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Story Squad guides one shared story through six child-friendly scenes", () => {
  const html = read("squad-board.html");
  const script = read("squad-board.js");
  const api = read("platform-api.js");

  assert(html.includes("data-story-dna") && html.includes("data-story-path"), "the shared plan and six-scene route should be visible in the real squad board");
  assert(html.includes("data-cast-form") && html.includes("data-generate-cast-poster"), "each creator should add one private reference before the owner makes the shared cast poster");
  ["STORIESLENS PRESENTS", "data-cast-poster-title", "data-cast-poster-names", "data-cast-poster-date"].forEach((token) => assert(html.includes(token), `Hollywood poster template is missing ${token}`));
  assert.strictEqual((script.match(/enTitle:/g) || []).length, 6, "the guided story path should contain exactly six core beats");
  ["Meet the heroes", "Trouble arrives", "The first try", "A bigger surprise", "The brave choice", "The ending"].forEach((beat) => {
    assert(script.includes(beat), `missing shared-story beat: ${beat}`);
  });
  assert(script.includes("activeStoryBeat(activeSquad)"), "Yu should guide the scene the squad is currently making");
  assert(script.includes("/scenes/${sceneNumber}/claim") && api.includes("SQUAD_SCENE_ALREADY_CLAIMED"), "one approved creator should be able to claim the current scene without adding a separate task system");
  assert(script.includes("generateCastPoster") && script.includes("personalPhotoConsentIds"), "the poster should combine consented cast references through the existing anchor generator");
  assert(api.includes("castReferenceMatch") && api.includes("member.castReferenceMediaId = media.id"), "each approved member should save only their own private cast reference");
  assert(api.includes("castLockMatch") && api.includes("member.castLockedAt = nowIso()"), "the owner should permanently confirm each project character card");
  assert(script.includes("data-lock-character") && script.includes("data-scene-character"), "the board should lock character cards and let creators choose who appears in each scene");
  assert(api.includes("characterCardIds") && api.includes("characterReferences.push"), "scene generation should resolve only selected locked character cards on the server");
  assert(read("server.js").includes("ONLY THESE CHARACTERS APPEAR IN THIS SCENE") && read("server.js").includes("do not add anyone else"), "image prompts should exclude unselected recurring characters");
  assert(api.includes("coverImageUrl: storedSquad.visualAnchorImageUrl"), "the approved cast poster should become the assembled project cover");
  assert(api.includes('presenter: "StoriesLens Presents"') && api.includes("storyBackground: storedSquad.characterRules"), "the assembled project should retain exact poster text instead of asking the image model to spell it");
  assert(script.includes('squad.outputType === "film" ? "movie-studio.html" : "book-studio.html"'), "assembled books and films should open their matching studio");
  assert(api.includes('theme: squad.theme || ""') && script.includes('theme: setup.theme'), "the selected creation theme should survive entry into the real private squad");
  assert(script.includes("assets/yu-wuxia-master-v1.png") && script.includes("Speak as 小羽大侠") && script.includes("古琴声从哪里传来"), "a wuxia squad should show Hero Yu and keep both live and fallback guidance in the original guqin story world");
});
