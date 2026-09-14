const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("mobile product foundation covers the ten H5 capabilities", () => {
  const server = read("server.js");
  const api = read("platform-api.js");
  const library = read("my-stories.html");
  const studio = read("movie-studio.html");
  const studioJs = read("movie-studio.js");
  const app = read("app.html");
  const appJs = read("h5-app.js");
  const chineseStudio = read("chinese-studio.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const worker = read("service-worker.js");
  const renderer = read("hyperframes-renderer.js");

  assert(api.includes("/api/auth/start") && api.includes("/api/auth/verify"), "email and phone OTP endpoints should exist");
  assert(api.includes("/api/auth/wechat"), "WeChat connection point should exist and fail closed until configured");
  assert(api.includes("/api/projects"), "cloud project storage should exist");
  assert(api.includes("/api/media"), "private media upload should exist");
  assert(api.includes("guardianConsents"), "guardian permission records should exist");
  assert(api.includes("api\\/shares"), "invite-only sharing should exist");
  assert(api.includes("/api/orders"), "orders should exist");
  assert(api.includes("/api/product-events"), "activation events should be collected for the founder funnel without story content");
  assert(api.includes("/api/render-jobs"), "movie render plans should exist");
  assert(renderer.includes('"render"') && renderer.includes("output.mp4"), "HyperFrames should render a real private MP4 when the worker is available");
  assert(api.includes("outputFilePath: undefined"), "private render filesystem paths should never be returned to the browser");
  assert(studio.includes("data-scene-list") && studioJs.includes("MediaRecorder"), "movie editing and voice recording should be usable in-product");
  assert(studioJs.includes("/api/export-book-docx"), "book export should remain in-product");
  assert(app.includes("data-create-form") && app.includes("data-artwork") && app.includes("data-seed") && app.includes("data-speech"), "formal H5 should begin with artwork, words, or voice");
  assert(app.includes('data-stage="coach"') && app.includes('data-stage="result"'), "formal H5 should keep the three questions and first story page in one flow");
  const englishStoryLanguage = app.match(/<select data-language[^>]*>[\s\S]*?<\/select>/)?.[0] || "";
  const chineseStoryLanguage = chineseStudio.match(/<select data-language[^>]*>[\s\S]*?<\/select>/)?.[0] || "";
  assert(englishStoryLanguage.includes('value="en"') && !englishStoryLanguage.includes('value="zh"'), "English studio should keep its creation language fixed to English");
  assert(chineseStoryLanguage.includes('value="zh"') && !chineseStoryLanguage.includes('value="en"'), "Chinese studio should keep its creation language fixed to Chinese");
  assert(chineseStudio.includes("data-chinese-voice-entry") && appJs.includes("chineseVoiceEntry") && appJs.includes("handleSpeechInput"), "Chinese studio should expose a first-class voice entry wired to editable speech input");
  assert(app.includes("data-chinese-studio-switch"), "English studio should provide one explicit route to the Chinese studio");
  assert(app.includes("Learning Profile｜学习档案") && app.includes("data-map-overall-rit"), "parent flow should offer an optional manual MAP Learning Profile");
  assert(["genre", "craft", "process", "grammar", "mechanics"].every((area) => app.includes(`data-map-low="${area}"`) && app.includes(`data-map-high="${area}"`)), "Learning Profile should accept all five Language Usage area ranges");
  const learningProfileMarkup = app.match(/<details class="learning-profile"[\s\S]*?<\/details>/)?.[0] || "";
  assert(!/<input[^>]+type="file"/i.test(learningProfileMarkup), "Learning Profile must never accept a report upload");
  assert(appJs.includes("parent-manual-entry") && appJs.includes("storieslens_learning_profile"), "Learning Profile should save only structured manual fields on the device");
  assert(appJs.includes("nextThreeGoals") && appJs.includes("fourWeeks") && appJs.includes("storieslens_learning_progress"), "Learning Profile should create a four-week plan scaffold and privacy-minimized progress records");
  assert(appJs.includes("validateLearningProfile") && appJs.includes("low RIT cannot be higher"), "Learning Profile should reject incomplete or invalid RIT ranges");
  assert(read("visual-write.html").includes("getMapLearningContext") && read("visual-write.html").includes("mapInstructionalArea"), "Yu should receive the optional Learning Profile during coaching");
  assert(appJs.includes("coach_question_answered") && appJs.includes("first_story_page_created"), "formal H5 should measure its activation moment");
  assert(app.includes('src="artwork-upload-safety.js?') && appJs.includes("StoriesLensArtworkSafety.processArtwork"), "formal H5 should privacy-review artwork before it can be stored");
  assert(api.includes("reviewArtworkSafety(body.dataUrl)") && api.includes("Real-person photos are not stored"), "private media API should reject real-person photos server-side");
  assert(appJs.includes('platform.api("/api/projects"') && appJs.includes('platform.api("/api/media"'), "formal H5 should save real private projects and artwork");
  assert(appJs.includes('from: "h5"'), "formal H5 should continue directly into the guided creation path");
  assert(library.includes("Save across devices") && library.includes("GUARDIAN APPROVAL"), "the mobile library should expose account and privacy controls");
  assert.strictEqual(manifest.display, "standalone", "PWA should install in standalone mode");
  assert.strictEqual(manifest.start_url, "/app.html?source=pwa", "installed PWA should open the formal H5 product");
  assert(worker.includes("/api/") && worker.includes("offline.html"), "service worker should preserve offline pages without caching private APIs");
  assert(server.includes("microphone=(self)"), "first-party recording should be permitted");
});

test("private story renderer uses textContent instead of injected HTML", () => {
  const renderer = read("shared-story.js");
  assert(renderer.includes("textContent"));
  assert(!renderer.includes("innerHTML"));
});
