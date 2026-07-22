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
  "group-write.html"
  ,"group-project-studio.html"
].filter((file) => fs.existsSync(path.join(root, file)));

const htmlByFile = Object.fromEntries(htmlFiles.map((file) => [file, read(file)]));
const indexHtml = htmlByFile["index.html"];
const createHtml = htmlByFile["create-reading-project.html"];
const reviewHtml = htmlByFile["create-reading-review.html"];
const assignHtml = htmlByFile["create-reading-assign.html"];
const publishHtml = htmlByFile["create-reading-publish.html"];
const visualWriteHtml = htmlByFile["visual-write.html"];
const groupProjectStudioHtml = htmlByFile["group-project-studio.html"];
const teacherHtml = htmlByFile["teacher-dashboard.html"];
const teacherProjectHtml = htmlByFile["teacher-project.html"];
const projectOutputHtml = htmlByFile["project-output.html"];
const packageJson = JSON.parse(read("package.json"));
const serverJs = read("server.js");
const scriptJs = read("script.js");
const envExample = read(".env.example");
const ccssStandards = JSON.parse(read("resources/ccss/ela-standards.json"));
const createProjectFlowJs = read("create-project-flow.js");

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

assert.strictEqual(packageJson.scripts?.start, "node server.js", "Railway/Railpack should have a start command");
assert.strictEqual(packageJson.main, "server.js", "Package entry should point to the static server");
assert(serverJs.includes("process.env.PORT"), "Static server should bind to Railway's PORT environment variable");
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
assert(scriptJs.includes("StoriesLensQuota"), "Global quota model should be available for plan and credit checks");
assert(scriptJs.includes("Generate 1 image = 1 image credit") || scriptJs.includes("imageCost"), "Quota model should include image credit cost");
assert(scriptJs.includes("estimateClassMovie"), "Quota model should estimate class movie video credit cost");

[
  "assets/storieslens-logo.png",
  "assets/hero-student.png",
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
  "Turn reading into writing, and writing into visual stories.",
  "Classroom Co-Creation Studio",
  "Create from Reading Text",
  "From one reading text to a whole-class visual story.",
  "Students write scenes, generate visuals, and publish a shared book or movie.",
  "For Teachers",
  "Create a CCSS-aligned class book or movie from any reading text.",
  "Upload reading text",
  "Generate scene or chapter tasks",
  "For Students",
  "Join your class project or start your own visual story.",
  "Enter a class code",
  "Submit to teacher or save your story",
  "visual-write.html?mode=assignment",
  "visual-write.html?mode=free",
  "Enter Class Code",
  "Start Free Writing",
  "Pricing built around publishing.",
  "Core value comes from class books, class movies, exports, and share links.",
  "1 visual writing project / month",
  "12 image credits",
  "$19 / month",
  "200 image credits",
  "24 video credits",
  "$69 / month",
  "1,000 image credits",
  "120 video credits",
  "Start Free",
  "Upgrade to Pro",
  "Contact / Start Studio",
  "Designed for classroom writing."
].forEach((token) => {
  assert(indexHtml.includes(token), `Homepage should include: ${token}`);
});

assert(!indexHtml.includes('id="class-movie"'), "Homepage should not include the standalone Class Movie section");
assert(!indexHtml.includes("Turn student writing into a class movie."), "Homepage should not include the removed Class Movie section title");
assert(!indexHtml.includes('id="works"'), "Homepage should not include the standalone Works section");
assert(!indexHtml.includes("Works become class projects."), "Homepage should not include the removed Works section title");

const teacherFlowHtml = [createHtml, reviewHtml, assignHtml, publishHtml, createProjectFlowJs].join("\n");
[
  "Create from Reading Text",
  "Upload a reading passage and turn it into a ready-to-teach reading-to-writing lesson.",
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
  "Visual Write",
  "Start your own visual story.",
  "Write your own story, get feedback, and turn it into images or video.",
  "Let's write and create together.",
  "Class Code · MAP-4832",
  "Join Project",
  "Free Creation",
  "Start Free Writing",
  "Create Together",
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
  "Save Story",
  "Write your part. Build one story together.",
  "Student Name",
  "18 students writing",
  "Class Progress",
  "You are here",
  "Complete all 5 scenes to publish the class movie",
  "Start Free Writing"
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
  "Teacher Studio",
  "Create reading-based writing projects, review student work, and publish class books or movies.",
  "Create from Reading Text",
  "Start from Writing Prompt",
  "Create Class Movie",
  "Class Projects",
  "Writing Assignments",
  "Student Submissions",
  "Publish Queue",
  "Current Plan",
  "Teacher Pro",
  "Projects",
  "8 / 20",
  "Class Books",
  "3 / 8",
  "Image Credits",
  "142 / 200",
  "Video Credits",
  "18 / 24",
  "This movie has 8 scenes and needs 8 video credits.",
  "You have 18 video credits.",
  "The Mystery of the Lost Map",
  "Review Scenes",
  "Generate Missing Videos",
  "Generate Class Movie",
  "Export Report"
].forEach((token) => {
  assert(teacherHtml.includes(token), `Teacher Studio should include: ${token}`);
});

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
