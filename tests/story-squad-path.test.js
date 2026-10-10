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
  const css = read("squad-board.css");

  assert(html.includes("data-story-dna") && html.includes("data-story-path"), "the shared plan and six-scene route should be visible in the real squad board");
  assert(html.includes("data-cast-form") && html.includes("data-generate-cast-poster"), "each creator should add one private reference before the owner makes the shared cast poster");
  ["STORIESLENS PRESENTS", "data-cast-poster-title", "data-cast-poster-names", "data-cast-poster-date"].forEach((token) => assert(html.includes(token), `Hollywood poster template is missing ${token}`));
  assert(html.includes("data-project-tools-toggle") && html.includes("data-opening-poster-copy"), "a loaded squad should lead with one shared poster while keeping character settings available on demand");
  assert(html.includes("data-poster-title-form") && html.includes("data-poster-director") && html.includes("data-poster-prompt") && html.includes("data-poster-reference") && html.includes("data-opening-poster-director") && html.includes("data-anchor-format"), "the owner should name the A4 poster, add a director, prompt and safe reference, and credit its director");
  assert(script.includes("has-loaded-squad") && script.includes("projectToolsOpen") && script.includes("Make our movie poster"), "the project board should enter a simplified poster-first co-creation view");
  assert(css.includes("body [hidden]{display:none!important}"), "hidden setup and join forms must never remain visible after a project loads");
  assert.strictEqual((script.match(/enTitle:/g) || []).length, 6, "the guided story path should contain exactly six core beats");
  ["Meet the heroes", "Trouble arrives", "The first try", "A bigger surprise", "The brave choice", "The ending"].forEach((beat) => {
    assert(script.includes(beat), `missing shared-story beat: ${beat}`);
  });
  assert(script.includes("activeStoryBeat(activeSquad)"), "Yu should guide the scene the squad is currently making");
  assert(script.includes("/scenes/${sceneNumber}/claim") && api.includes("SQUAD_SCENE_ALREADY_CLAIMED"), "one approved creator should be able to claim the current scene without adding a separate task system");
  assert(script.includes("data-draw-scene") && script.includes("data-confirm-assignment") && script.includes("自由报名"), "teachers should be able to draw, assign, or leave each scene open for voluntary sign-up");
  assert(read("start.html").includes('data-collaboration-mode="family"') && read("start.html").includes('data-collaboration-mode="classroom"'), "squad creators should choose family or classroom mode once during setup");
  assert(read("start.html").includes('<label class="work-file-picker">') && !read("start.css").includes('.wuxia-quick-mode [data-work-file-field]'), "Wuxia squads should offer a working direct upload for text or images");
  assert(read("start.html").indexOf("data-collaboration-mode-picker") < read("start.html").indexOf('class="setup-fields step-panel"'), "family and classroom modes should be visible before the detailed setup screen");
  assert(script.includes('squad.collaborationMode === "classroom"') && api.includes('collaborationMode: squad.collaborationMode === "classroom"'), "classroom-only teacher assignment should follow the saved collaboration mode");
  assert(api.includes("assigneeMemberId") && api.includes("SQUAD_ASSIGNMENT_FORBIDDEN"), "only the project owner should be able to assign an approved student or group to a scene");
  assert(script.includes("generateCastPoster") && script.includes("personalPhotoConsentIds"), "the poster should combine consented cast references through the existing anchor generator");
  assert(html.includes("data-wuxia-poster-templates") && ["群侠长卷", "流金山河", "大漠镖影", "墨染江湖"].every((name) => html.includes(name)), "Wuxia film squads should offer four original poster moods before creating the first poster");
  assert(script.includes("WUXIA_POSTER_TEMPLATES") && script.includes("do not imitate any existing film"), "Wuxia poster prompts should use original high-level cinematic direction rather than copying an existing film poster");
  assert(html.indexOf("data-wuxia-poster-templates") > html.indexOf("data-poster-title-form") && script.includes("wuxiaTemplate"), "Wuxia cover choices should appear immediately before the owner spends an image credit to generate the shared cover");
  assert(script.includes("characterCardIds = activeSquad.members") && script.includes("封面会用它保留主角身份"), "Wuxia cover generation should use at least one locked character reference instead of inventing the hero");
  assert(script.includes('portraitPoster ? "2:3"') && script.includes('resolution: "2K"') && script.includes('data-poster-title-form'), "film posters should use the stable portrait generation request and persist the creator title");
  assert(script.includes("pendingPosterReference") && script.includes("CREATOR'S POSTER DIRECTION") && script.includes("posterDirector"), "poster generation should include the owner's prompt, safe reference and saved director credit");
  assert(script.includes("posterDetailsDirty") && html.includes("data-poster-reference-preview") && script.includes("参考图已上传"), "live squad polling should not overwrite poster edits and a prepared reference should show an immediate preview");
  assert(html.includes("生成成功扣 1 个图片额度；失败或安全拦截不扣"), "the poster button should explain successful, failed and regenerated image allowance use");
  assert(api.includes("SQUAD_RENAME_FORBIDDEN") && api.includes("squad.title = title"), "only the owner should be able to save a poster title");
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
  assert(script.includes("我们的武侠故事") && script.includes("有人的地方，就有江湖"), "Chinese Wuxia squads should use their fixed board title and Jianghu tagline");
  assert(script.includes('activeSquad.theme === "sports"') && script.includes("团队做出了什么选择") && script.includes("Do not invent an injury"), "a sports squad should ask about authentic teamwork and never invent unsafe or unreported events");
});
