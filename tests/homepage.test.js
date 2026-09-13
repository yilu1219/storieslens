const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const htmlFiles = [
  "index.html",
  "create-reading-project.html",
  "create-reading-review.html",
  "create-reading-assign.html",
  "create-reading-publish.html",
  "visual-write.html",
  "teacher-dashboard.html",
  "teacher-project.html",
  "project-output.html",
  "visual-read.html",
  "group-write.html",
  "group-project-studio.html",
  "start.html",
  "story-dna.html",
  "trust.html",
  "founder-lab.html",
  "beta-interest.html",
  "yc-demo.html",
  "solo-premiere.html",
  "checkout.html",
  "classroom-archive.html",
  "app.html",
  "my-stories.html",
  "movie-studio.html",
  "showcase.html"
].filter((file) => fs.existsSync(path.join(root, file)));

const htmlByFile = Object.fromEntries(htmlFiles.map((file) => [file, read(file)]));
const indexHtml = htmlByFile["index.html"];
const createHtml = htmlByFile["create-reading-project.html"];
const reviewHtml = htmlByFile["create-reading-review.html"];
const assignHtml = htmlByFile["create-reading-assign.html"];
const publishHtml = htmlByFile["create-reading-publish.html"];
const visualWriteHtml = htmlByFile["visual-write.html"];
const groupProjectStudioHtml = htmlByFile["group-project-studio.html"];
const startHtml = htmlByFile["start.html"];
const storyDnaHtml = htmlByFile["story-dna.html"];
const teacherHtml = htmlByFile["teacher-dashboard.html"];
const classroomArchiveHtml = htmlByFile["classroom-archive.html"];
const classroomArchiveJs = read("classroom-archive.js");
const portalHomeJs = read("portal-home.js");
const h5AppJs = read("h5-app.js");
const artworkSafetyJs = read("artwork-upload-safety.js");
const teacherProjectHtml = htmlByFile["teacher-project.html"];
const projectOutputHtml = htmlByFile["project-output.html"];
const packageJson = JSON.parse(read("package.json"));
const serverJs = read("server.js");
const startJs = read("start.js");
const scriptJs = read("script.js");
const envExample = read(".env.example");
const ccssStandards = JSON.parse(read("resources/ccss/ela-standards.json"));
const createProjectFlowJs = read("create-project-flow.js");
const analyticsJs = read("analytics.js");
const trustHtml = htmlByFile["trust.html"];
const founderLabHtml = htmlByFile["founder-lab.html"];
const betaInterestHtml = htmlByFile["beta-interest.html"];
const ycDemoHtml = htmlByFile["yc-demo.html"];
const soloPremiereHtml = htmlByFile["solo-premiere.html"];
const checkoutHtml = htmlByFile["checkout.html"];
const checkoutJs = read("checkout.js");
const safetyClientJs = read("safety-client.js");
const showcaseHtml = htmlByFile["showcase.html"];

assert((indexHtml.match(/class="portal-card-case"/g) || []).length === 3, "Each creation mode should provide one real-case entrance");
assert((indexHtml.match(/href="showcase\.html#work"/g) || []).length === 3, "Each creation mode should link to the independent showcase");

[
  "STORIESLENS ORIGINALS",
  'data-format-filter="book"',
  'data-format-filter="film"',
  'data-language-filter="en"',
  'data-language-filter="zh"',
  "product examples",
  "app.html"
].forEach((token) => assert(showcaseHtml?.includes(token), `Showcase should organize honest bilingual proof: ${token}`));

[
  [createHtml, "Upload", "create-reading-review.html"],
  [reviewHtml, "Review", "create-reading-assign.html"],
  [assignHtml, "Assign", "create-reading-publish.html"],
  [publishHtml, "Publish", "teacher-project.html?id=map-4832"]
].forEach(([page, stage, nextHref]) => {
  assert(page, `${stage} should have its own HTML page`);
  assert(page.includes('src="create-project-flow.js"'), `${stage} should load the shared project flow`);
  assert(page.includes(`data-current-stage="${stage.toLowerCase()}"`), `${stage} should identify its current stage`);
  assert(page.includes(nextHref), `${stage} should link to its next destination`);
});

assert(!createHtml.includes("scrollIntoView"), "Upload should not scroll to later workflow stages");

[
  "Group Project Studio",
  "1 Story Setup",
  "2 Characters",
  "3 Chapters / Scenes",
  "4 Group Gallery",
  "5 Publish",
  "Generate Character",
  "Approve Character",
  "Character Reference Locked",
  "Generate Chapter Image",
  "Generate Scene Video",
  "Vote",
  "Use in Book",
  "Preview Group Book",
  "Create Share Link"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio should include: ${token}`));

[
  "Writing Assistant",
  "Story Bible + chapter continuity",
  "Check Continuity",
  "data-group-writing-tool",
  'fetch("/api/writing-assistant"'
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio should embed contextual writing help: ${token}`));

[
  "Lobster AI Tutor",
  "data-tutor-play",
  "data-tutor-pause",
  "data-tutor-replay",
  "data-tutor-voice",
  "Jenny",
  "Aria",
  "Samantha",
  "Zira",
  "SpeechSynthesisUtterance",
  "speechSynthesis.cancel()",
  "tutorUtterance.rate=.86",
  "tutorUtterance.pitch=1.12"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio should provide spoken Lobster Tutor feedback: ${token}`));

[
  "data-focus-writing",
  "data-toggle-writing-assistant",
  "data-word-count",
  "data-save-state",
  "min-height:440px",
  "grid-template-columns:minmax(0,3fr) minmax(300px,2fr)",
  "focus-writing"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio should prioritize the writing workspace: ${token}`));

[
  "Demo Preview",
  "Steps 3-5 are open",
  "data-demo-mode",
  "showcase-star-keeper.png",
  "showcase-block-castle.png"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio demo should include: ${token}`));

[
  "data-publish-assembly",
  "Writing complete",
  "Image selected",
  "Ready to publish",
  "showcase-space-adventure.png"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio publishing should include: ${token}`));

[
  "Illustrated Book",
  "Animated Movie",
  "Project Output",
  "Locked by Project Owner",
  "data-output-format"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio output choice should include: ${token}`));

[
  "Book Publisher",
  "Download Word",
  "Print Book",
  "Movie Editor",
  "Movie Timeline",
  "Add Subtitles",
  "Render Group Movie",
  "data-movie-editor"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Group Project Studio publish tools should include: ${token}`));

[
  "Movie Progress",
  "Trim Start",
  "Trim End",
  "Record My Narration",
  "Stop Recording",
  "MediaRecorder",
  "data-narration-player"
].forEach((token) => assert(groupProjectStudioHtml?.includes(token), `Movie Editor should include: ${token}`));

assert(serverJs.includes("/api/export-book-docx"), "Static server should export a real Word document");
assert(serverJs.includes("/api/checkout-link"), "Static server should expose an allowlisted checkout-link route");
assert(serverJs.includes("REQUIRE_EXTERNAL_MEDIA_MODERATION"), "Media generation should fail closed behind external moderation");
assert(serverJs.includes("SAFE_VIDEO_GENERATION_ENABLED"), "Video generation should remain gated until frame review exists");
assert(envExample.includes("OPENAI_MODERATION_MODEL=omni-moderation-latest"), "Environment example should configure the moderation model");
assert(startHtml.includes("data-age-group"), "Creator setup should collect an under-18 versus adult age group");
assert(startHtml.includes("data-supervision-confirm"), "Under-18 setup should require adult supervision confirmation");
assert(safetyClientJs.includes("StoriesLensSafety"), "Client flows should provide immediate safe-content feedback");
assert(serverJs.includes("buy.stripe.com"), "Checkout should only redirect to a trusted Stripe host");
assert(envExample.includes("STRIPE_STORY_PASS_URL="), "Environment example should document the Story Pass Payment Link");

assert.strictEqual(packageJson.scripts?.start, "node server.js", "Railway/Railpack should have a start command");
assert.strictEqual(packageJson.main, "server.js", "Package entry should point to the static server");
assert(serverJs.includes("process.env.PORT"), "Static server should bind to Railway's PORT environment variable");
assert(serverJs.includes('"X-Content-Type-Options", "nosniff"'), "Static server should prevent MIME sniffing");
assert(serverJs.includes('"Permissions-Policy", "camera=(self), microphone=(self), geolocation=(), payment=(self), usb=()"'), "Static server should scope camera, microphone, and payment access to the first-party mobile studio");
assert(serverJs.includes("/api/generate-image"), "Static server should keep the image generation proxy route");
assert(serverJs.includes("ImageProvider"), "Image generation should use a switchable provider abstraction");
assert(serverJs.includes("OPENROUTER_IMAGE_API_URL"), "Image generation should support the OpenRouter image endpoint through environment config");
assert(serverJs.includes("bytedance-seed/seedream-4.5"), "Image generation should default to the first selected image model");
assert(serverJs.includes("project-parts"), "Static server should expose the scene image task creation route");
assert(serverJs.includes("image-tasks"), "Static server should expose the image task polling route");
assert(!serverJs.includes("AIMS"), "Static server should not reference the retired AIMS provider");
assert(!serverJs.includes("aimodelshow"), "Static server should not reference the retired aimodelshow API");
assert(!scriptJs.includes("AIMS"), "Client script should not show retired AIMS wording");
assert(!scriptJs.includes("aimodelshow"), "Client script should not show retired aimodelshow wording");
assert(!envExample.includes("AIMS"), "Environment example should not include retired AIMS variables");
assert(!envExample.includes("aimodelshow"), "Environment example should not include the retired aimodelshow URL");
assert(envExample.includes("OPENROUTER_IMAGE_API_URL=https://openrouter.ai/api/v1/images"), "Environment example should include the OpenRouter image API URL");
assert(envExample.includes("OPENROUTER_IMAGE_MODEL=bytedance-seed/seedream-4.5"), "Environment example should include the selected image model");
assert(envExample.includes("IMAGE_SIZE=2560x1440"), "Environment example should use the minimum accepted 16:9 image size");
assert(envExample.includes("OPENROUTER_VIDEO_API_URL=https://openrouter.ai/api/v1/videos"), "Environment example should include the OpenRouter video API URL");
assert(envExample.includes("OPENROUTER_VIDEO_MODEL=bytedance/seedance-2.0-fast"), "Environment example should include the selected video model");
assert(envExample.includes("VIDEO_DURATION=5"), "Environment example should default scene videos to five seconds");
assert(envExample.includes("VIDEO_RESOLUTION=720p"), "Environment example should default scene videos to 720p");
assert(serverJs.includes("/api/generate-video"), "Static server should expose a real video generation route");
assert(serverJs.includes("/api/video-jobs/"), "Static server should expose video job polling");
assert(serverJs.includes("bytedance/seedance-2.0-fast"), "Video generation should default to Seedance 2.0 Fast");
assert(serverJs.includes("public\", \"generated\", \"videos"), "Completed videos should be persisted under public/generated/videos");
assert(visualWriteHtml.includes('fetch("/api/generate-video"'), "Visual Write should submit real video jobs");
assert(visualWriteHtml.includes('/api/video-jobs/'), "Visual Write should poll real video jobs");
assert(visualWriteHtml.includes("Generate Image First"), "Video action should require a generated source image");
assert(visualWriteHtml.includes("Preparing Video..."), "Visual Write should show video submission progress");
assert(visualWriteHtml.includes("Generating Video..."), "Visual Write should show asynchronous video progress");
assert(visualWriteHtml.includes("Regenerate Video"), "Visual Write should support video regeneration");
assert(visualWriteHtml.includes("Download Video"), "Visual Write should expose completed video downloads");
assert(visualWriteHtml.includes("<video controls playsinline"), "Visual Write should render a native video player");
assert(!visualWriteHtml.includes("Scene video preview prepared"), "Visual Write should not simulate successful video generation");
assert(serverJs.includes("/api/ai-report"), "Static server should keep the AI report proxy route");
assert(serverJs.includes("/api/writing-assistant"), "Static server should expose contextual writing assistance");
[
  "Writing Assistant",
  "Give a Hint",
  "Check Sentence",
  "Add Details",
  "Improve Dialogue",
  "Turn into a Scene",
  "Visual Story Brief",
  "data-visual-readiness"
].forEach((token) => assert(visualWriteHtml.includes(token), `Visual Write should embed AI in the writing flow: ${token}`));
assert(visualWriteHtml.includes('fetch("/api/ai-report"'), "Visual Write should request real structured AI feedback");
assert(visualWriteHtml.includes('fetch("/api/writing-assistant"'), "Visual Write should request contextual sentence help");
assert(scriptJs.includes("StoriesLensQuota"), "Global quota model should be available for plan and credit checks");
assert(scriptJs.includes("Generate 1 image = 1 image credit") || scriptJs.includes("imageCost"), "Quota model should include image credit cost");
assert(scriptJs.includes("estimateClassMovie"), "Quota model should estimate class movie video credit cost");

[
  "assets/storieslens-logo.png",
  "assets/hero-student.png",
  "assets/hero-co-create-v2.png",
  "assets/hero-en-cinematic-studio-v1.png",
  "assets/hero-en-global-cocreation-v2.png",
  "assets/hero-en-art-to-story-triptych-v1.jpg",
  "assets/hero-zh-ink-cocreation-hd-v2.png",
  "assets/original-garden-door-hd-v2.png",
  "assets/original-ocean-lantern-hd-v2.png",
  "assets/original-star-keeper-hd-v2.png",
  "assets/outcome-book-hd-v2.png",
  "assets/outcome-comic-hd-v2.png",
  "assets/outcome-comic-kid-ink-v3.png",
  "assets/outcome-trailer-hd-v2.png",
  "assets/outcome-film-hd-v2.png",
  "assets/hero-classroom-creation.png",
  "assets/storybook-portal-book.png",
  "assets/showcase-block-castle.png"
].forEach((assetPath) => {
  assert(fs.existsSync(path.join(root, assetPath)), `Missing image asset: ${assetPath}`);
});

[
  "resources/ccss/ela-standards.json",
  "scripts/extract-ccss.js",
  "resources/source/README.md"
].forEach((filePath) => {
  assert(fs.existsSync(path.join(root, filePath)), `Missing CCSS import artifact: ${filePath}`);
});

assert(ccssStandards.some((standard) => standard.code === "RL.4.3"), "CCSS library should include RL.4.3");
assert(ccssStandards.some((standard) => standard.code === "W.4.3"), "CCSS library should include W.4.3");
assert(ccssStandards.every((standard) => Array.isArray(standard.keywords)), "CCSS standards should include keyword arrays");

[
  "YOUR PERSONAL AI STORY MENTOR",
  "START WITH ONE CREATION",
  "Your next storybook or short film starts with",
  "something you made.",
  'data-home-locale="en"',
  'data-home-locale="zh"',
  'data-home-t="hero-title-one"',
  'data-home-upload',
  'magic-upload-icon',
  "Upload artwork or a photo",
  'data-home-speech',
  'magic-mouth-icon',
  "Speak one idea",
  'data-home-story-language',
  'data-story-language="en"',
  'data-story-language="zh"',
  "What language would you like to create in today?",
  'data-home-continue',
  "Let Yu ask me three questions",
  "Location and camera details removed",
  "CREATE YOUR WAY · 选择创作方式",
  "SOLO CREATOR · 个人创作",
  "Build a story world that is entirely yours.",
  "href=\"app.html\"",
  "PRIVATE STORY SQUAD · 私密共创",
  "Create with family or friends you invite.",
  "Invite 2–6 people by private link or Story Code. Every contribution keeps its author’s name.",
  "start.html?mode=squad",
  "FOR TEACHERS · 教师入口",
  "Turn bulletin boards and student work into a dated class book.",
  "Photograph the wall once—or upload each work—to create a digital or printed keepsake.",
  "Open Teacher Publisher",
  "classroom-archive.html",
  'class="company-family"',
  "Every age has a story worth keeping.",
  "Lightyear Story helps real lives be heard, organized, and passed on.",
  'href="https://lightyearstory.com/"',
  'data-audience="lightyear-story"',
  "Make writing an autobiography as easy as having a conversation.",
  "Turn your memories into a digital or printed autobiography.",
  "Turn your autobiography into an AI life film with one click.",
  "With your consent, clone 10 seconds of your own voice",
  "Create the world you imagine next.",
  "Preserve the life you have already lived.",
  "Real case showcase",
  'data-audience="showcase-solo"',
  'data-audience="showcase-cocreate"',
  'data-audience="showcase-teacher"',
  "data-audience=\"solo\"",
  "data-audience=\"cocreate\"",
  "data-audience=\"teacher\"",
  'href="portal-home.css?',
  'src="artwork-upload-safety.js"',
  'src="portal-home.js?'
].forEach((token) => {
  assert(indexHtml.includes(token), `Homepage should include: ${token}`);
});

assert(!indexHtml.includes("Or choose your studio."), "Homepage should not retain the retired three-studio section");
assert(!indexHtml.includes("simple-results"), "Homepage should avoid the retired results section");
assert(!indexHtml.includes("simple-price"), "Homepage should not place pricing beside the two audience entrances");
assert(!indexHtml.includes('class="outcome-proof"'), "Homepage should not show the retired flagship product example");
assert(!indexHtml.includes("The Star Keeper"), "Homepage should not retain the flagship showcase content");
assert(!indexHtml.includes('class="lightyear-mark"'), "Lightyear Story card should not retain the decorative character badge");
assert((indexHtml.match(/class="lightyear-feature-icon"/g) || []).length === 3, "Lightyear Story should use one restrained icon for each of its three outcomes");
assert(indexHtml.includes('class="lightyear-card-art"'), "Lightyear Story should carry a content-led watercolor illustration");
assert(indexHtml.includes("assets/lightyear-three-generations-family-watercolor-v4.jpg"), "Lightyear Story should load its updated three-generation watercolor image with a narrated autobiography book");
assert(indexHtml.indexOf('class="portal-spaces"') < indexHtml.indexOf('class="company-family"'), "Homepage should present creation modes before the sister product");
assert(portalHomeJs.includes("storyLanguage: preparedStoryLanguage"), "Homepage should carry the selected writing language into the three-question flow");
assert(h5AppJs.includes('spark.storyLanguage'), "Story flow should restore the writing language selected on the homepage");

[
  indexHtml,
  startHtml,
  htmlByFile["app.html"],
  classroomArchiveHtml,
  htmlByFile["movie-studio.html"]
].forEach((html) => {
  assert(html?.includes("image/heic") && html.includes(".heic"), "Every creation upload should accept iPhone HEIC photos");
});
assert(fs.existsSync(path.join(root, "vendor/heic2any-0.0.4.min.js")), "The HEIC converter should be served locally rather than loading from a third-party CDN");
[
  "isHeicFile",
  "isSupportedImage",
  "heic2any",
  "convertedFromHeic",
  "originalNotUploaded"
].forEach((token) => assert(artworkSafetyJs.includes(token), `HEIC privacy pipeline should include: ${token}`));
assert(classroomArchiveHtml.indexOf("artwork-upload-safety.js") < classroomArchiveHtml.indexOf("classroom-archive.js"), "Teacher Publisher should load HEIC sanitizing before classroom capture");

[
  'requestUrl.pathname === "/api/review-artwork"',
  "reviewArtworkImage",
  "privateByDefault: true"
].forEach((token) => {
  assert(serverJs.includes(token), `Artwork privacy server should include: ${token}`);
});

[
  'privacy: "private"',
  "guardianApprovalRequired",
  "StoriesLensArtworkSafety.processArtwork"
].forEach((token) => {
  assert(startJs.includes(token), `Creator setup should include: ${token}`);
});

[
  "Scan the board.",
  "PRIVATE BY DEFAULT",
  'capture="environment" data-board-photo',
  "multiple data-work-photos",
  "One bulletin-board photo",
  "Individual student works",
  "Collection date",
  "Cover theme",
  "data-page-editor",
  "data-approval-check",
  "data-book-page-panel",
  "data-download-book",
  "data-print-book",
  "Class film",
  'src="classroom-archive.js?',
  'href="classroom-archive.css?'
].forEach((token) => assert(classroomArchiveHtml?.includes(token), `Classroom archive should include: ${token}`));

[
  "sanitizeFile",
  "cropBoard",
  "indexedDB.open",
  "buildBookHtml",
  "downloadBook",
  "printBook",
  "metadata-free previews",
  "visibility: \"private-device\""
].forEach((token) => assert(classroomArchiveJs.includes(token), `Classroom archive app should include: ${token}`));

[
  "How do you want to create?",
  "Solo Story",
  "Story Squad",
  "Invent a world",
  "Tell my story",
  "Start from a picture",
  "Bring my own work",
  "Upload your work",
  'data-work-file',
  "Start a private squad",
  "Invite 1–5 family members or friends after setup",
  "Join with a code",
  "Writing level",
  "New storyteller · pictures and voice",
  "Growing writer · school and independent practice",
  "Teen or adult writer · deeper craft feedback",
  "Story Coach adapts its questions to your experience and goal—not just your age.",
  "Account & safety",
  "I am 18 or older · independent account",
  "I am under 18 · creating with adult support",
  "Display name",
  "Story language",
  "Bilingual · English + 中文",
  "Your story spark",
  "data-step-current",
  "data-step-next",
  "data-step-back",
  'src="start.js?',
  'href="start.css?'
].forEach((token) => assert(startHtml?.includes(token), `Start page should include: ${token}`));

assert(read("home.js").includes("storieslens_imported_work"), "Homepage should preserve an imported work on the current device");
assert(read("start.js").includes("storieslens_imported_work"), "Creator setup should preserve an imported work on the current device");

[
  "Discover your Story DNA",
  "What stayed with you most?",
  "A character’s choice",
  "The world",
  "The feeling",
  "The surprise",
  "If you could change one thing, what would it be?",
  "A completely new setting",
  "A different hero goal",
  "One impossible rule",
  "Your Story DNA is ready.",
  "Create it on my own",
  "Build it with others",
  'src="story-dna.js"',
  'href="story-dna.css"'
].forEach((token) => assert(storyDnaHtml?.includes(token), `Story DNA experience should include: ${token}`));

assert(visualWriteHtml.includes('src="i18n.js"'), "Story Studio should load the bilingual interface controller");
assert(visualWriteHtml.includes("storyLanguage: activeStoryLanguage"), "Story Studio should send the selected story language to AI coaching");
assert(visualWriteHtml.includes("data-live-story-language"), "Story Studio should let the creator change writing language without changing interface language");
assert(visualWriteHtml.includes("let activeStoryLanguage"), "Story Studio language should be changeable during creation");
assert(storyDnaHtml.includes("data-dna-story-language"), "Story DNA should keep writing-language choice visible");
assert(startHtml.includes('option value="zh">中文</option>'), "Creator setup should support Chinese story writing");
assert(startHtml.includes('option value="bilingual">Bilingual · English + 中文</option>'), "Creator setup should support bilingual story writing");

[
  "Your Story DNA",
  "Story Coach asks",
  "Ask my next question",
  'data-writing-tool="begin"',
  "storyDnaContext",
  "getStarterQuestion",
  "Story Coach asks and suggests. It never inserts story sentences into your writing."
].forEach((token) => assert(visualWriteHtml.includes(token), `Story Studio should preserve child authorship and Story DNA context: ${token}`));
assert(!visualWriteHtml.includes("data-use-suggestion"), "Solo Story Coach should not insert AI sentences into the child's draft");
assert(serverJs.includes('begin: "Ask exactly one vivid question'), "Writing assistant should support blank-page coaching without ghostwriting");
assert(serverJs.includes("Student-created Story DNA"), "Writing assistant should receive the child's Story DNA context");

[
  "Your squad begins with one shared Story DNA",
  "data-group-dna-context",
  'params.get("demo")!=="1"',
  "storyLanguage:project?.storyLanguage",
  "Idea to consider"
].forEach((token) => assert(groupProjectStudioHtml.includes(token), `Story Squad should inherit an original, real project context: ${token}`));
assert(groupProjectStudioHtml.includes("data-group-story-language"), "Story Squad should expose a project-level writing language");
assert(!groupProjectStudioHtml.includes("data-apply-group-suggestion"), "Story Squad coach should not insert AI prose into a creator's chapter");

[
  "story_dna_started",
  "story_dna_completed",
  "creator_setup_completed",
  "first_sentence_completed",
  "visual_generation_requested"
].forEach((eventName) => assert([indexHtml, read("home.js"), read("story-dna.js"), read("start.js"), visualWriteHtml].join("\n").includes(eventName), `Core funnel should track ${eventName}`));
assert(analyticsJs.includes("MAX_EVENTS = 500"), "Local analytics should cap retained events");
assert(!analyticsJs.includes("studentDraft"), "Local product analytics should never collect story drafts");
assert(trustHtml.includes("AI asks; the human writes"), "Creator trust page should state the authorship boundary");
assert(trustHtml.includes("not a claim of legal certification"), "Family trust page should avoid fabricated compliance claims");
assert(founderLabHtml.includes("Local validation only"), "Founder dashboard should label local events as non-traction");
assert(founderLabHtml.includes("Three experiments before building more"), "Founder dashboard should prioritize evidence-building experiments");
assert(betaInterestHtml.includes("it does not create an account or charge money"), "Pricing test should clearly disclose that it is not a live checkout");
assert(betaInterestHtml.includes("pricing_intent_recorded"), "Pricing test should record an explicit, non-revenue intent event");
assert(indexHtml.includes('href="app.html"'), "Homepage family entrance should lead directly to the mobile creation flow");
assert(checkoutHtml.includes("Creator or guardian checkout"), "Checkout should support adult creators and guardian purchases for minors");
assert(checkoutHtml.includes("No subscription"), "Checkout should clarify that Story Pass is not a subscription");
assert(checkoutJs.includes('fetch("/api/checkout-link"'), "Checkout should request a server-approved Payment Link");
assert(ycDemoHtml.includes("90-second founder demo"), "Founder demo should provide a timed pitch route");
assert(ycDemoHtml.includes("fictional demonstration data"), "Founder demo should clearly disclose fictional demo data");
assert(ycDemoHtml.includes("founder_demo_started"), "Founder demo should track demo activation separately from user traction");
assert(visualWriteHtml.includes('data-student-action="premiere"'), "Solo studio should lead a finished draft to a book or film preview");
assert(soloPremiereHtml.includes("AI guided, the creator authored."), "Solo premiere should preserve creator attribution");
assert(soloPremiereHtml.includes("storieslens_free_generated_video"), "Solo premiere should render a finished scene video when available");
assert(soloPremiereHtml.includes("Adults may purchase directly"), "Solo premiere should support adults while reserving minor purchases for guardians");

assert(!indexHtml.includes("CCSS-aligned"), "Consumer homepage should not lead with CCSS language");
assert(!indexHtml.includes("Meet strangers"), "Consumer homepage should not promise unsafe open stranger matching");

const teacherFlowHtml = [createHtml, reviewHtml, assignHtml, publishHtml, createProjectFlowJs].join("\n");
[
  "Create from a Reading",
  "Bring a Chinese or English passage and turn it into a ready-to-teach journey from close reading to original writing.",
  "Chinese Reading & Writing",
  "Reading Text",
  "Lesson Setup",
  "Paste Text",
  "Upload File",
  "Try Sample",
  "Recommended length: 300-1,200 words.",
  "Project Title",
  "Grade Level",
  "Teaching Framework",
  "K12 CCSS",
  "Creative Writing",
  "Output Type",
  "Class Book",
  "Class Movie",
  "Individual Writing",
  "Class Size",
  "Review the Lesson",
  "Text & Skill Match",
  "Reading Focus",
  "Writing Focus",
  "Why this matches",
  "Model Sentences",
  "Writing Support",
  "Required CCSS",
  "Student Writing Task",
  "Rewrite Pattern",
  "Project Plan",
  "45-Minute Lesson Plan",
  "Assign Chapters or Scenes",
  "Student Names",
  "Auto Assign",
  "Publish the Project",
  "Class Code",
  "MAP-4832",
  "Copy Class Code",
  "Open Student View",
  "Go to Teacher Studio",
  "Teacher Pack"
].forEach((token) => {
  assert(teacherFlowHtml.includes(token), `Four-page teacher flow should include: ${token}`);
});

assert(!createHtml.includes("Suggested Rewrite Template"), "Teacher cards should use Writing Support instead of Suggested Rewrite Template");
assert(!createHtml.includes("Import CCSS PDF"), "Teacher-facing Create page should not expose CCSS PDF import");
assert(!createHtml.includes("Recommended focus: narrative writing"), "Create page should not lock narrative focus before text analysis");
[
  "Generate Illustration",
  "Generate Photo Scene",
  "Generate Photo-style Scene",
  "Generate Scene Video",
  "Image Status",
  "Photo Status",
  "Video Status",
  "Review Status",
  "Generate Missing Images",
  "Generate Missing Videos"
].forEach((token) => {
  assert(!createHtml.includes(token), `Create page should not include visual generation control: ${token}`);
});

[
  "Story Studio",
  "Write something only you could tell.",
  "Story Coach helps without taking over.",
  "Build one world together.",
  "Class Code · MAP-4832",
  "Join Project",
  "Solo Story",
  "Start Solo Story",
  "Story Squad",
  "Join Teacher Project",
  "Create Friend Group",
  "Join Friend Group",
  "Invite Code",
  "Project Owner",
  "Copy Invite Link",
  "Claim an Open Scene",
  "You are writing Scene 3 for your class story movie.",
  "You are writing Page 3 for your class science explainer book.",
  "My Class Task",
  "My Role in the Class Project",
  "Scene / Chapter title",
  "Scene / Chapter goal",
  "Teacher Instructions",
  "Source text reminder",
  "Characters in your scene",
  "Approved Character References",
  "Model Sentence",
  "Try this pattern",
  "Your Task",
  "character, setting, sequence, descriptive details",
  "explaining scientific ideas with evidence",
  "Scientists used ______ to study ______.",
  "My Role in the Class Project",
  "Scene 3: The Hidden Door",
  "Generate Image",
  "Generate Scene Image",
  "Generate Scene Video",
  "Submit Image Candidate",
  "Mysterious",
  "1 image credit",
  "1 video credit",
  "Get AI Feedback",
  "Glow",
  "Grow",
  "Next Step",
  "Submit to Teacher",
  "Save now",
  "Write on your own or build one world together.",
  "Student Name",
  "18 students writing",
  "Class Progress",
  "You are here",
  "Complete all 5 scenes to publish the class movie"
].forEach((token) => {
  assert(visualWriteHtml.includes(token), `Visual Write page should include: ${token}`);
});

assert(!visualWriteHtml.includes("RL.4.3"), "Student Visual Write should not expose reading standard codes");
assert(!visualWriteHtml.includes("W.4.3"), "Student Visual Write should not expose writing standard codes");
assert(!visualWriteHtml.includes('resolution: "2K"'), "Visual Write image requests should not send a conflicting 2K resolution");

[
  "The Mystery of the Lost Map",
  "Consistent characters. Student-created scenes. Teacher-approved publishing.",
  "Overview",
  "Story Bible",
  "Characters",
  "Submissions",
  "Visuals",
  "Voting",
  "Book Builder",
  "Movie Board",
  "Publish",
  "Story Bible approved",
  "Approve Story Bible",
  "Character References",
  "Generate Character Card",
  "Approve Character",
  "approved character references",
  "Student Submissions",
  "Scene Visual Candidates",
  "Use as Scene Cover",
  "Class Vote",
  "Publish Checks",
  "CHARACTER_REFERENCE",
  "SCENE_IMAGE"
].forEach((token) => {
  assert(teacherProjectHtml.includes(token), `Teacher Project should include: ${token}`);
});

[
  "Project Output Workspace",
  "Class Book Workspace",
  "Create a class illustration book.",
  "Create a class movie together.",
  "Start individual visual writing.",
  "Class Book Production",
  "Class Movie Production",
  "Individual Writing Workspace",
  "Assign Chapters",
  "Generate Cover",
  "Assign Scenes",
  "Generate Scene Video",
  "Open Student Editor",
  "Save Story",
  "project-output.html?type=class-book",
  "project-output.html?type=class-movie",
  "project-output.html?type=individual-writing"
].forEach((token) => {
  assert(projectOutputHtml.includes(token), `Project Output workspace should include: ${token}`);
});

[
  "StoriesLens Bulletin Board Publisher",
  "Photograph the wall. Keep every story.",
  "One focused teacher workflow",
  "ONE SIMPLE WORKFLOW",
  "Turn one bulletin board into a class keepsake",
  "Create a free private proof",
  "Turn the wall into a book",
  "Free to begin",
  "Teacher controlled",
  "No inventory",
  "Private digital book",
  "Printed class book",
  "Class premiere",
  "classroom-archive.html",
  "teacher-dashboard.css"
].forEach((token) => {
  assert(teacherHtml.includes(token), `Teacher Studio should include: ${token}`);
});
assert(!teacherHtml.includes("create-reading-project.html"), "Teacher Studio should expose only the bulletin-board publishing workflow");

const forbiddenVisibleTokens = [
  "AI Feedback API Contract",
  "Raw Prompt",
  "Raw JSON",
  "OpenRouter ChatGPT model",
  "Mastra agent ready",
  "Seedance API key",
  "Seedance technical details",
  "Provider technical details",
  "Developer debug panel",
  "Internal schema",
  "Mock technical explanation"
];

Object.entries(htmlByFile).forEach(([file, contents]) => {
  forbiddenVisibleTokens.forEach((token) => {
    assert(!contents.includes(token), `${file} should not expose technical content: ${token}`);
  });
});

[createHtml, reviewHtml, assignHtml, publishHtml, visualWriteHtml, groupProjectStudioHtml, teacherProjectHtml, projectOutputHtml].forEach((pageHtml, index) => {
  const scripts = [...pageHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  scripts.forEach((script, scriptIndex) => {
    assert.doesNotThrow(() => new Function(script), `Inline script ${scriptIndex} on page ${index} should parse`);
  });
});

console.log("StoriesLens classroom co-creation structure checks passed.");
