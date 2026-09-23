"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("live Yu prompt locks the original story and requires teachable grammar changes", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(source, /Apply ORIGINAL LOCK/);
  assert.match(source, /Never add, remove, replace, combine, reinterpret, or infer any character/);
  assert.match(source, /exact keys before, after, skill, explanation/);
  assert.match(source, /If one clause is ambiguous, preserve its facts and make the smallest grammatical repair possible/);
  assert.match(source, /creatorSafetyText/);
  assert.match(source, /coachSafetyText/);
  assert.match(source, /originalLockedSuggestion/);
  assert.match(source, /grammarChanges\.length === 0/);
  assert.match(source, /requestedGrammarCategory === "clear"/);
  assert.match(source, /Yu's final grammar verifier/);
  assert.match(source, /grammarSuggestionNeedsRepair/);
  assert.match(source, /applyDeclaredGrammarChanges/);
  assert.match(source, /silently proofread suggestion twice/i);
  assert.match(source, /stage: "creator-input"/);
  assert.match(source, /stage: "coach-output"/);
  assert.match(source, /safetyStage: error\.safetyStage/);
  assert.match(source, /detailed coaching response did not pass its safety review/);
  assert.match(source, /suggestion: originalSentence/);
  assert.match(source, /reviewFallback: true/);
  assert.doesNotMatch(source, /enforceTextSafety\(userPrompt\)/);
});

test("seven-year-old preview preserves the ancient Egypt story instead of substituting a new plot", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(source, /My mom, my brother Leo, and I can't find our way back/);
  assert.match(source, /Metropolitan Museum in New York City/);
  assert.doesNotMatch(source.match(/function buildRevision[\s\S]*?function finishRevision/)?.[0] || "", /tiny dragon|giant library|secret map/i);
});

test("the character question supports words, a private upload, and a real credit-backed visual preview", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.html"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(html, /data-character-maker/);
  assert.match(html, /Add my story characters/);
  assert.match(html, /Use 1–3 pictures/);
  assert.match(html, /Upload each protagonist separately/);
  assert.match(html, /Describe my hero/);
  assert.match(html, /Make a character picture from my description/);
  assert.match(html, /up to three protagonists/);
  assert.match(html, /upload up to three protagonists together/i);
  assert.match(html, /Name &amp; age/);
  assert.match(html, /How they look/);
  assert.match(html, /What they are like/);
  assert.match(html, /What they want/);
  assert.match(script, /data-character-clue/);
  assert.match(script, /data-character-describe/);
  assert.match(script, /\/api\/generate-image/);
  assert.match(html, /Making a character picture uses 1 picture credit/);
  assert.match(script, /Try another · 1 credit/);
  assert.match(script, /state\.characterImageUrl/);
});

test("Yu lists every grammar correction and explains them one by one", () => {
  const script = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.css"), "utf8");
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(script, /All grammar changes · explained one by one/);
  assert.match(script, /data-hear-change/);
  assert.match(script, /Hear Yu explain #/);
  assert.match(script, /START HERE · FIRST GRAMMAR POINT/);
  assert.match(script, /YU IS CHECKING EACH SENTENCE/);
  assert.match(script, /data-yu-checking-status/);
  assert.match(script, /window\.setInterval/);
  assert.match(css, /@keyframes yu-orbit/);
  assert.match(script, /data-hear-grammar/);
  assert.match(script, /Use “I” when you are doing the action/);
  assert.match(script, /explains every one below/);
  assert.match(server, /grammarChanges\.slice\(0, 40\)/);
  assert.match(server, /every genuine correction can be listed and explained/);
});

test("SOLO offers four age-guided creation paths and grows one consistent multi-page book", () => {
  const script = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.css"), "utf8");
  assert.match(script, /Picture & Voice/);
  assert.match(script, /My First Book/);
  assert.match(script, /Story Builder/);
  assert.match(script, /Author & Film Studio/);
  assert.match(script, /Ages 5–6/);
  assert.match(script, /Ages 7–9/);
  assert.match(script, /Ages 10–12/);
  assert.match(script, /Ages 13–16/);
  assert.match(script, /Who, Where, What, Why, and When/);
  assert.match(script, /targetPages: 10/);
  assert.match(script, /maxPages: 24/);
  assert.match(script, /function showCreationStageChooser/);
  assert.match(script, /function showBookContinuation/);
  assert.match(script, /function startNextPage/);
  assert.match(script, /state\.bookScenes\.push/);
  assert.match(script, /approved Page 1 world-and-style anchor/);
  assert.match(script, /movie-studio\.html\?project=/);
  assert.match(css, /\.creation-stage-grid/);
  assert.match(css, /\.book-progress/);
});

test("a completed SOLO book can generate a cover and a private child-authored About the Author page", () => {
  const script = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.css"), "utf8");
  const api = fs.readFileSync(path.join(__dirname, "..", "platform-api.js"), "utf8");
  assert.match(script, /Design my cover &amp; author page/);
  assert.match(script, /function generateBookCover/);
  assert.match(script, /Create a polished vertical children’s book cover illustration/);
  assert.match(script, /Do not draw any words, letters, captions, logos/);
  assert.match(script, /quiet space near the top/);
  assert.match(script, /uncluttered band near the bottom/);
  assert.match(script, /Written by/);
  assert.match(script, /data-cover-title-text/);
  assert.match(script, /data-cover-author-text/);
  assert.match(script, /FIRST INSIDE PAGE · ABOUT THE AUTHOR/);
  assert.match(script, /What do you love making or learning/);
  assert.match(script, /What gave you the idea for this story/);
  assert.match(script, /What do you hope readers feel/);
  assert.match(script, /data-about-photo-input/);
  assert.match(script, /purpose: 'author-photo'/);
  assert.match(script, /data-author-photo-consent/);
  assert.match(script, /authorProfile: state\.authorProfile/);
  assert.match(api, /"personal-photo"/);
  assert.match(css, /\.book-finisher/);
  assert.match(css, /\.cover-builder-preview/);
});

test("picture surprise chooses book or film before a six-style visual direction", () => {
  const script = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(script, /data-output-type="book"/);
  assert.match(script, /data-output-type="film"/);
  assert.match(script, /Block world/);
  assert.match(script, /Cyber future/);
  assert.match(script, /style-cyber-future-ultramodern-v1\.png/);
  assert.match(script, /Future world/);
  assert.match(script, /style-movie-magic-blockbuster-v2\.webp/);
  assert.match(script, /Big-screen cinematic adventure/);
  assert.match(script, /cinematic blockbuster key art/);
  assert.doesNotMatch(script, /showcase-robot-friend\.png/);
  assert.match(script, /Real-life story/);
  assert.match(script, /Choose a style first/);
  assert.match(script, /YOUR FIRST MOVIE FRAME/);
});

test("image creation is reference-led and forbids embedded playback or brand overlays", () => {
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  const preview = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(server, /Treat the first image as the primary visual anchor/);
  assert.match(server, /Preserve the same person or character identity/);
  assert.match(server, /play triangle, play button, video controls/);
  assert.match(server, /cyber-future/);
  assert.match(server, /ultra-modern optimistic future-world/);
  assert.doesNotMatch(preview, /showcase-(?:dragon-movie|time-train)\.png/);
});

test("Change something opens a type-or-speak edit and confirms cost before regenerating", () => {
  const script = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(script, /function startPictureChange/);
  assert.match(script, /picture-change/);
  assert.match(script, /Type your change or hold the green button/);
  assert.match(script, /Use 1 gift &amp; update/);
  assert.match(script, /same characters, faces, clothes, story facts, and selected style/);
});

test("Yu uses an energetic but clear child-friendly voice profile", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.html"), "utf8");
  const preview = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  const voice = fs.readFileSync(path.join(__dirname, "..", "natural-voice.js"), "utf8");
  assert.match(html, /Hear Yu perform/);
  assert.match(html, /natural-voice\.js/);
  assert.match(preview, /performanceChunks/);
  assert.match(preview, /'celebration'/);
  assert.match(preview, /'lesson'/);
  assert.match(voice, /theatrical/);
  assert.match(voice, /guide/);
  assert.match(voice, /clearNarrator/);
  assert.match(voice, /eddy\|rocko\|grandma\|grandpa/);
  assert.match(voice, /question/);
  assert.match(voice, /story/);
  assert.match(voice, /lesson/);
  assert.match(voice, /celebration/);
});

test("picture results are square, text stays outside the artwork, and real-life mode requires an upload", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.css"), "utf8");
  const preview = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(css, /\.result-picture-wrap[^}]*aspect-ratio:\s*1/);
  assert.match(css, /\.drawing-stage[^}]*aspect-ratio:\s*1/);
  assert.match(preview, /result-origin/);
  assert.doesNotMatch(preview, /result-badge/);
  assert.match(preview, /Real-life story/);
  assert.match(preview, /real-life-block-world-poster-v1\.jpg/);
  assert.match(preview, /Movie-style example/);
  assert.match(preview, /Choose 1–3 character photos/);
  assert.match(preview, /state\.userUploadedReference/);
  assert.match(server, /"real-life-story"/);
  assert.match(server, /preserve the exact people, facial identity, age, skin tone, hairstyle, clothing/);
});

test("real-life SOLO converts HEIC, requires adult consent, and calls the real image API", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.html"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(html, /artwork-upload-safety\.js/);
  assert.match(script, /StoriesLensArtworkSafety\.processArtwork/);
  assert.match(script, /convertedFromHeic/);
  assert.match(script, /data-photo-permission/);
  assert.match(script, /data-photo-processing/);
  assert.match(script, /No handwritten signature is needed/);
  assert.match(script, /function personalPhotoConsentRequired/);
  assert.match(script, /state\.uploadContainsRealPerson \|\| state\.selectedStyle === 'Real-life story'/);
  assert.match(script, /consentPanel\.hidden = !personalPhotoConsentRequired\(\)/);
  assert.match(script, /data-style-upload/);
  assert.match(script, /Upload 1–3 photos here/);
  assert.match(script, /state\.refreshStyleReferenceChoice/);
  assert.match(script, /selectStyleCard\(realLifeCard\)/);
  assert.match(script, /\/photo-consent/);
  assert.match(script, /\/api\/generate-image/);
  assert.match(script, /referenceImageUrls: referenceImages/);
  assert.match(script, /personalPhotoConsentId/);
  assert.match(html, /data-upload multiple/);
  assert.match(script, /files\.length > 3/);
  assert.match(script, /Promise\.all\(files\.map/);
  assert.match(script, /do not blend or swap faces/);
});

test("the finished picture replaces the progress card and always has a visible fallback", () => {
  const preview = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(preview, /data-picture-reveal/);
  assert.match(preview, /showResult\(drawing, makeButton\)/);
  assert.match(preview, /Your story just became a picture!/);
  assert.match(preview, /My free first picture is ready below/);
  assert.match(preview, /progressMessage\.remove\(\)/);
  assert.match(preview, /data-result-image/);
  assert.match(preview, /handleResultImageError/);
  assert.match(preview, /original-garden-door-hd-v2\.png/);
  assert.match(preview, /result\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
});

test("every visitor makes one first picture before registration and registers only to continue or download", () => {
  const preview = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  const credits = fs.readFileSync(path.join(__dirname, "..", "credit-system.js"), "utf8");
  const login = fs.readFileSync(path.join(__dirname, "..", "login.js"), "utf8");
  assert.match(credits, /"guest-story-start"[\s\S]*grants: \{ storyProjects: 1, imageGenerations: 1 \}/);
  assert.match(credits, /"free-preview"[\s\S]*grants: \{ storyProjects: 1, imageGenerations: 1 \}/);
  assert.match(preview, /Your first picture is free—no sign-up needed/);
  assert.match(preview, /Continue creating with Yu/);
  assert.match(preview, /Download my picture/);
  assert.match(preview, /storieslens_pending_guest_creation/);
  assert.match(preview, /downloadFinishedPicture/);
  assert.match(preview, /const credits = await apiJson\('\/api\/credits'\)/);
  assert.doesNotMatch(preview, /!state\.session\.authenticated \|\| state\.session\.user\?\.kind !== 'account'/);
  assert.match(login, /solo-story/);
});

test("founder beta access stays visibly unlimited and never disables picture retries", () => {
  const preview = fs.readFileSync(path.join(__dirname, "..", "solo-delight-preview.js"), "utf8");
  assert.match(preview, /betaUnlimitedCreation/);
  assert.match(preview, /giftCount\.textContent = state\.betaUnlimitedCreation \? '∞'/);
  assert.match(preview, /function hasPictureAllowance\(\)/);
  assert.match(preview, /Try again · beta access/);
  assert.match(preview, /Update with beta access/);
});
