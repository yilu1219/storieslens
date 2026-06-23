const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const html = read("index.html");
const visibleHtml = html.replace(/&amp;/g, "&");
const css = read("styles.css");
const js = read("script.js");

const requiredAssets = [
  "assets/storieslens-logo.png",
  "assets/hero-full-scene-portal-book.png",
  "assets/vocab-lighthouse-card.png",
  "assets/movie-scene.png",
  "assets/book-spread.png",
  "assets/avatar-scene.png",
  "assets/lobster-ai-tutor.png",
  "assets/ccss-skill-card.png",
  "assets/storybook-portal-book.png",
  "assets/showcase-star-keeper.png",
  "assets/showcase-block-castle.png",
  "assets/showcase-dragon-movie.png",
  "assets/showcase-space-adventure.png",
  "assets/showcase-ocean-lantern.png",
  "assets/showcase-robot-friend.png",
  "assets/showcase-garden-door.png",
  "assets/showcase-time-train.png"
];

requiredAssets.forEach((assetPath) => {
  assert(fs.existsSync(path.join(root, assetPath)), `Missing image asset: ${assetPath}`);
  assert(html.includes(assetPath), `Homepage does not reference image asset: ${assetPath}`);
});

const brandMarkup = html.match(/<a class="brand"[\s\S]*?<\/a>/)?.[0] || "";
assert(brandMarkup.includes('src="assets/storieslens-logo.png"'), "Brand should use the provided StoriesLens logo image");
assert(brandMarkup.includes('alt="StoriesLens logo"'), "Brand logo image should include accessible alt text");
const headerMarkup = html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0] || "";
assert(headerMarkup.includes('class="header-actions"'), "Header should group Subscription and Start Creating side by side");
assert(headerMarkup.includes('class="subscription-entry"'), "Header should include a Subscription entry for the future paid entrance");
assert(headerMarkup.includes('id="subscription"'), "Subscription entry should expose a future payment anchor target");
assert(headerMarkup.includes('href="#subscription"'), "Subscription entry should link to the future payment anchor");
assert(headerMarkup.includes("Subscription"), "Subscription entry should use the Subscription label");
assert(!headerMarkup.includes('class="subscription-icon"'), "Subscription entry should be a clean text-only button");
const topCtaMarkup = headerMarkup.match(/<a class="top-cta"[\s\S]*?<\/a>/)?.[0] || "";
assert(!topCtaMarkup.includes('class="spark-icon"'), "Start Creating should be a clean text-only button");
assert(headerMarkup.indexOf('class="subscription-entry"') < headerMarkup.indexOf('class="top-cta"'), "Subscription entry should appear to the left of Start Creating");
const headerActionsBlock = css.match(/\.header-actions\s*\{([\s\S]*?)\}/)?.[1] || "";
assert(headerActionsBlock.includes("flex-direction: row"), "Header actions should place Subscription to the left of Start Creating");
assert(/\.subscription-entry,\s*\.top-cta,\s*\.primary-button,\s*\.panel-button\s*\{[\s\S]*?background:\s*linear-gradient\(135deg, var\(--blue\), var\(--purple\)\)/.test(css), "Subscription should share the same blue-purple background as Start Creating");
assert(!css.includes(".subscription-icon"), "Unused subscription icon CSS should be removed");
assert(html.includes("<title>StoriesLens 语镜故事</title>"), "Page title should use the updated Chinese brand name");
assert(brandMarkup.includes("<span>StoriesLens 语镜故事</span>"), "Header brand should use the updated Chinese brand name");
assert(html.includes("© StoriesLens 语镜故事 ·"), "Footer copyright should use the updated Chinese brand name");
assert(!html.includes("<title>StoriesLens 语镜</title>"), "Old page title should be removed");
assert(!brandMarkup.includes("<span>StoriesLens 语镜</span>"), "Old header brand should be removed");
assert(!html.includes("© StoriesLens 语镜 ·"), "Old footer brand should be removed");
assert(!brandMarkup.includes("brand-star"), "Old star logo markup should be removed");
assert(!css.includes("brand-star"), "Old star logo CSS should be removed");

assert(!html.includes('class="companion"'), "Homepage should not render the lobster companion container");

[
  {
    name: "hero composite boy and screens image",
    pattern: /<div class="hero-stage"[\s\S]*src="assets\/hero-full-scene-portal-book\.png"[\s\S]*alt="Student writing with Visual Vocabulary, Movie Scene, Illustrated Book, and Avatar Animation preview cards"/
  },
  {
    name: "Visual Read Storybook Image blocky portal book",
    pattern: /<div class="flow-visual storybook-image"[\s\S]*src="assets\/storybook-portal-book\.png"[\s\S]*<span>Storybook Image<\/span>/
  },
  {
    name: "Visual Read Visual Vocabulary word card",
    pattern: /<div class="flow-visual vocabulary-image"[\s\S]*src="assets\/vocab-lighthouse-card\.png"[\s\S]*<span>Visual Vocabulary<\/span>/
  },
  {
    name: "Visual Read CCSS imitation writing card before Storybook Image",
    pattern: /<span>Quiz &amp; Practice<\/span>[\s\S]*<div class="flow-visual ccss-skill-card"[\s\S]*src="assets\/ccss-skill-card\.png"[\s\S]*<span>CCSS Skill Card · Imitate Writing<\/span>[\s\S]*<div class="flow-visual storybook-image"/
  },
  {
    name: "Visual Write Real-person Animation girl image",
    pattern: /<div class="flow-visual real-person-image"[\s\S]*src="assets\/avatar-scene\.png"[\s\S]*<span>Real-person Animation<\/span>/
  },
  {
    name: "Visual Write publishing output after Real-person Animation",
    pattern: /<span>Real-person Animation<\/span>[\s\S]*<div class="flow-visual publish-share-card"[\s\S]*<span class="publish-book">Print Your Book<\/span>[\s\S]*<span class="publish-video">Share Your Video<\/span>[\s\S]*<span>Print Your Book · Share Your Video<\/span>/
  }
].forEach(({ name, pattern }) => {
  assert(pattern.test(html), `Wrong image mapping for ${name}`);
});

const heroMarkup = html.match(/<div class="hero-stage"[\s\S]*?<\/div>\s*<\/section>/)?.[0] || "";
assert(!heroMarkup.includes("assets/hero-student.png"), "Hero should not use the old separated student image");
assert(!heroMarkup.includes("assets/scene-stack.png"), "Hero should not use the old separated screen image");
assert(!heroMarkup.includes("assets/lobster-ai-tutor.png"), "Hero should not show the tutor image outside the Lobster AI Tutor card");
assert(!heroMarkup.includes('class="student-scene"'), "Hero should not render separated student layer");
assert(!heroMarkup.includes('class="scene-stack"'), "Hero should not render separated screen layer");
assert(!heroMarkup.includes('class="vocab-card'), "Hero should not render separated vocabulary card layer");
assert(heroMarkup.includes('class="hero-artboard"'), "Hero image should be wrapped by an artboard for aligned overlays");
assert(!heroMarkup.includes('class="writing-animation"'), "Hero should return to a static image without writing animation");
assert(!heroMarkup.includes('class="writing-svg"'), "Hero should not render the animated writing SVG");
assert(!heroMarkup.includes('id="light-write-path"'), "Hero should not render the Light writing path");
assert(!heroMarkup.includes('class="animated-pen'), "Hero should not render an animated pen overlay");

const visualReadPanel = html.match(/<article class="workflow-panel read-panel" id="visual-read"[\s\S]*?<\/article>/)?.[0] || "";
const visualReadHeading = visualReadPanel.match(/<div class="panel-heading">[\s\S]*?<\/div>\s*<\/div>/)?.[0] || "";
assert(!visualReadHeading.includes('class="panel-icon read"'), "Visual Read heading should not show the white book icon");
const visualWritePanel = html.match(/<article class="workflow-panel write-panel" id="visual-write"[\s\S]*?<\/article>/)?.[0] || "";
const visualWriteHeading = visualWritePanel.match(/<div class="panel-heading">[\s\S]*?<\/div>\s*<\/div>/)?.[0] || "";
assert(!visualWriteHeading.includes('class="panel-icon write"'), "Visual Write heading should not show the white pencil icon");

[
  "StoriesLens 语镜故事",
  "Visual Read",
  "Visual Write",
  "Student Story Showcase",
  "孩子的英文故事作品集",
  "Illustrated books, AI movies, avatar stories, and visual worlds created from English writing.",
  "View all works",
  "The Star Keeper",
  "Block Castle Quest",
  "Dragon Movie Scene",
  "My Space Adventure",
  "The Ocean Lantern",
  "Robot's First Friend",
  "The Secret Garden Door",
  "Time Train to Tomorrow",
  "Storybook style",
  "Block World style",
  "Cinematic Fantasy",
  "Sci-Fi Avatar",
  "Watercolor",
  "Comic",
  "Classic Fairy Tale",
  "Futuristic",
  "CCSS-Aligned. K12 Literacy. Full Stop.",
  "From Reading to AI Movies",
  "In One Class.",
  "Upload Any Text",
  "Teachers and parents can upload reading text and turn it into visual lessons.",
  "Lobster AI Tutor",
  "Feedback in Seconds.",
  "Start Visual Read",
  "Create a Story",
  "Movie Scene",
  "Illustrated Book",
  "Avatar Animation",
  "A full literacy loop",
  "CCSS Learning",
  "Teacher Text",
  "Visual Vocabulary",
  "Quiz & Practice",
  "CCSS Skill Card",
  "Imitate Writing",
  "Storybook Image",
  "CCSS Prompts",
  "AI Movie",
  "Real-person Animation",
  "Print Your Book",
  "Share Your Video"
].forEach((text) => {
  assert(visibleHtml.includes(text), `Missing required homepage text: ${text}`);
});

const visualReadFlow = visualReadPanel.match(/<div class="flow-steps">[\s\S]*?<\/div>\s*<a class="panel-button blue"/)?.[0] || "";
assert(!visualReadFlow.includes("CCSS技能卡"), "Visual Read flow should use English for the CCSS skill card label");
assert(!visualReadFlow.includes("仿写"), "Visual Read flow should use English for the imitation writing label");

[
  "Read English.",
  "Write Worlds.",
  "Direct Your Story.",
  "读英文，写世界，导演自己的故事",
  "Visual English Learning, Be the Director of Your Story"
].forEach((text) => {
  assert(!visibleHtml.includes(text), `Old homepage text should be removed: ${text}`);
});

const heroSection = html.match(/<section class="hero[^"]*"[\s\S]*?<\/section>/)?.[0] || "";
assert(!heroSection.includes('class="badge-row"'), "Top hero icon badge row should be removed");
assert(!heroSection.includes('class="mini-badge"'), "Top hero icon badges should be removed");
assert(!heroSection.includes("K12 Ages 7-17"), "Top K12 Ages badge should be removed");
assert(!heroSection.includes("Privacy First"), "Top Privacy First badge should be removed");
assert(!heroSection.includes('class="hero-actions"'), "Hero top action buttons should be removed");
assert(!heroSection.includes('class="primary-button blue"'), "Hero Start Visual Read button should be removed");
assert(!heroSection.includes('class="primary-button purple"'), "Hero Create a Story button should be removed");
assert(html.includes('class="panel-button blue"'), "Bottom Visual Read panel button should remain");
assert(html.includes('class="panel-button purple"'), "Bottom Visual Write panel button should remain");
assert(!heroSection.includes("<h1"), "Hero should not carry the four advertising lines");
[
  "CCSS-Aligned. K12 Literacy. Full Stop.",
  "From Reading to AI Movies",
  "In One Class.",
  "Upload Any Text",
  "Teachers and parents can upload reading text and turn it into visual lessons.",
  "Lobster AI Tutor",
  "Feedback in Seconds."
].forEach((text) => {
  assert(!heroSection.includes(text), `Advertising line should move out of hero: ${text}`);
});

const heroIndex = html.indexOf('<section class="hero');
const showcaseIndex = html.indexOf('<section class="student-showcase"');
const loopIndex = html.indexOf('<section class="literacy-loop"');
const featureGridIndex = html.indexOf('<section class="feature-grid"');
const workflowIndex = html.indexOf('<section class="workflow-grid"');
const footerIndex = html.indexOf('<footer class="site-footer"');
assert(workflowIndex > heroIndex && workflowIndex < loopIndex, "Visual Read and Visual Write entrances should move into the showcase position below the hero");
assert(loopIndex > workflowIndex && featureGridIndex > loopIndex, "Literacy loop and feature cards should remain after the entrance panels");
assert(showcaseIndex > featureGridIndex && showcaseIndex < footerIndex, "Student story showcase should move to the bottom above the footer");
const showcaseMarkup = html.match(/<section class="student-showcase"[\s\S]*?<\/section>/)?.[0] || "";
assert(showcaseMarkup.includes('class="showcase-header"'), "Student showcase should include a rich header");
assert(showcaseMarkup.includes('class="showcase-controls"'), "Student showcase should include top navigation controls");
assert((showcaseMarkup.match(/class="showcase-nav"/g) || []).length === 2, "Student showcase should include previous and next controls");
assert((showcaseMarkup.match(/class="showcase-dot/g) || []).length >= 5, "Student showcase should include pagination dots");
assert(showcaseMarkup.includes('class="showcase-all-works"'), "Student showcase should include a View all works button");
assert(showcaseMarkup.includes('class="story-film-reel"'), "Student showcase should render as a large story film reel");
assert(showcaseMarkup.includes('class="story-card-track"'), "Student showcase should include the card track");
assert((showcaseMarkup.match(/class="story-card"/g) || []).length === 16, "Student showcase should duplicate eight story cards for seamless scrolling");
assert((showcaseMarkup.match(/class="story-card" aria-hidden="true"/g) || []).length === 8, "Duplicated story cards should be hidden from assistive technology");
[
  "assets/showcase-star-keeper.png",
  "assets/showcase-block-castle.png",
  "assets/showcase-dragon-movie.png",
  "assets/showcase-space-adventure.png",
  "assets/showcase-ocean-lantern.png",
  "assets/showcase-robot-friend.png",
  "assets/showcase-garden-door.png",
  "assets/showcase-time-train.png"
].forEach((assetPath) => {
  assert(showcaseMarkup.includes(assetPath), `Student showcase should include image asset: ${assetPath}`);
});
assert((showcaseMarkup.match(/class="story-kind"/g) || []).length >= 8, "Each story card should include a type label");
assert((showcaseMarkup.match(/class="story-style"/g) || []).length >= 8, "Each story card should include a style label");
assert(!showcaseMarkup.includes("assets/book-spread.png"), "Student showcase Illustrated Book frame should use the new provided image");

const featureGrid = html.match(/<section class="feature-grid"[\s\S]*?<\/section>/)?.[0] || "";
assert.strictEqual((featureGrid.match(/class="feature-card"/g) || []).length, 5, "Middle feature grid should show five ad-message cards");
[
  "CCSS Learning",
  "CCSS-Aligned. K12 Literacy. Full Stop.",
  "From Reading to AI Movies",
  "In One Class.",
  "Upload Any Text",
  "Teachers and parents can upload reading text and turn it into visual lessons.",
  "Lobster AI Tutor",
  "Feedback in Seconds.",
  "Privacy Protection",
  "Choose to store work on your own computer."
].forEach((text) => {
  assert(featureGrid.includes(text), `Middle feature grid should include: ${text}`);
});
assert(/Lobster AI Tutor[\s\S]*Privacy Protection/.test(featureGrid), "Privacy Protection card should appear after Lobster AI Tutor");
assert(!featureGrid.includes("Teacher Upload"), "Teacher Upload card title should be replaced");
assert(!featureGrid.includes("Upload Anything"), "Upload card should use the parent-and-teacher text upload message");
assert(!featureGrid.includes("Teach Everything."), "Upload card should use the parent-and-teacher text upload message");
assert(!featureGrid.includes("Local Privacy"), "Local Privacy card should be replaced by the simpler ad-message layout");
assert(featureGrid.includes("movie-icon"), "Feature grid should include a visual icon for the AI movie message");
assert(featureGrid.includes("homework-icon"), "Upload card should use a homework paper icon");
assert(!featureGrid.includes("upload-icon"), "Upload card should not use the old upload arrow icon");
assert(featureGrid.includes("tutor-image"), "Feature grid should include an image slot for the Lobster AI Tutor message");
assert(featureGrid.includes('src="assets/lobster-ai-tutor.png"'), "Lobster AI Tutor card should use the provided tutor image");
assert(!featureGrid.includes("assets/companion-crab.png"), "Lobster AI Tutor card should not use the previous tutor image");
assert(!featureGrid.includes("tutor-icon"), "Lobster AI Tutor card should not use the old CSS-drawn icon");
assert(featureGrid.includes("privacy-protection-icon"), "Privacy Protection card should include a dedicated icon");

[
  ".hero",
  ".scene-card",
  ".workflow-panel",
  ".feature-card",
  ".privacy-protection-icon",
  ".student-showcase",
  ".showcase-header",
  ".showcase-controls",
  ".story-film-reel",
  ".story-card-track",
  ".story-card",
  ".story-kind",
  ".story-style",
  "@keyframes story-showcase-scroll",
  "animation: story-showcase-scroll",
  ".story-film-reel:hover .story-card-track",
  ".publish-share-card",
  ".publish-book-icon",
  ".publish-play-icon",
  "@media (max-width: 900px)",
  "@media (prefers-reduced-motion: reduce)",
  "linear-gradient",
  "radial-gradient"
].forEach((token) => {
  assert(css.includes(token), `Missing required CSS token: ${token}`);
});

const reducedMotionBlock = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/)?.[1] || "";
assert(reducedMotionBlock.includes("animation: none"), "Writing animation should respect reduced motion preferences");

const studentShowcaseBlock = css.match(/\.student-showcase\s*\{([\s\S]*?)\}/)?.[1] || "";
assert(studentShowcaseBlock.includes("width: min(100vw - 64px, 1640px)"), "Student Story Showcase should extend wider than the standard content column");
assert(studentShowcaseBlock.includes("left: 50%"), "Student Story Showcase should be centered after expanding");
assert(studentShowcaseBlock.includes("transform: translateX(-50%)"), "Student Story Showcase should stay centered when wider than page shell");
const smallStudentShowcaseBlock = css.match(/@media \(max-width: 640px\) \{[\s\S]*?\.student-showcase\s*\{([\s\S]*?)\}/)?.[1] || "";
assert(smallStudentShowcaseBlock.includes("width: 100%"), "Student Story Showcase should avoid horizontal overflow on mobile");
assert(smallStudentShowcaseBlock.includes("transform: none"), "Student Story Showcase should not use wide centering transform on mobile");
[
  ".writing-animation",
  ".writing-svg",
  ".light-stroke",
  ".hand-grip",
  ".pen-body",
  "@keyframes draw-light",
  "@keyframes dot-light",
  "@keyframes pen-write-light"
].forEach((token) => {
  assert(!css.includes(token), `Static hero should not keep writing animation CSS: ${token}`);
});

const heroArtboardBlock = css.match(/\.hero-artboard\s*\{([\s\S]*?)\}/)?.[1] || "";
const heroImageBlock = css.match(/\.hero-composite-image\s*\{([\s\S]*?)\}/)?.[1] || "";
assert(heroArtboardBlock.includes("mask-image"), "Hero artboard should feather the image edges into the star background");
assert(heroArtboardBlock.includes("-webkit-mask-image"), "Hero artboard should include WebKit edge feathering for browser support");
assert(heroImageBlock.includes("mix-blend-mode"), "Hero image should blend dark pixels with the animated star background");
assert(!heroArtboardBlock.includes("background: #000"), "Hero artboard should not use a black rectangle background");
assert(!heroImageBlock.includes("background: #000"), "Hero image should not use a black rectangle background");

const h1Block = css.match(/h1\s*\{([\s\S]*?)\}/)?.[1] || "";
const h1FontSize = Number(h1Block.match(/font-size:\s*(\d+)px/)?.[1] || 0);
assert(h1FontSize > 0 && h1FontSize <= 28, `Hero headline font size should be smaller, got ${h1FontSize}px`);

const mobileH1Sizes = [...css.matchAll(/h1\s*\{[\s\S]*?font-size:\s*(\d+)px;[\s\S]*?\}/g)].map((match) => Number(match[1]));
assert(mobileH1Sizes.every((size) => size <= 28), `All hero headline font sizes should stay small: ${mobileH1Sizes.join(", ")}`);

const gradientLineBlock = css.match(/\.gradient-line\s*\{([\s\S]*?)\}/)?.[1] || "";
assert(gradientLineBlock.includes("color: #fff"), "Former gradient headline text should be white");
assert(!gradientLineBlock.includes("color: transparent"), "Former gradient headline text should not be transparent");
assert(!gradientLineBlock.includes("background-clip: text"), "Former gradient headline text should not use clipped gradient text");

assert(js.includes("mousemove"), "Expected subtle pointer/parallax interaction");
assert(js.includes("requestAnimationFrame"), "Expected animated star field");

console.log("Homepage structure checks passed.");
