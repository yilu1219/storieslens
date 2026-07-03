const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const htmlFiles = [
  "index.html",
  "create-reading-project.html",
  "visual-write.html",
  "teacher-dashboard.html",
  "teacher-project.html",
  "project-output.html",
  "visual-read.html",
  "group-write.html"
].filter((file) => fs.existsSync(path.join(root, file)));

const htmlByFile = Object.fromEntries(htmlFiles.map((file) => [file, read(file)]));
const indexHtml = htmlByFile["index.html"];
const createHtml = htmlByFile["create-reading-project.html"];
const visualWriteHtml = htmlByFile["visual-write.html"];
const teacherHtml = htmlByFile["teacher-dashboard.html"];
const teacherProjectHtml = htmlByFile["teacher-project.html"];
const projectOutputHtml = htmlByFile["project-output.html"];
const packageJson = JSON.parse(read("package.json"));
const serverJs = read("server.js");
const scriptJs = read("script.js");
const envExample = read(".env.example");
const ccssStandards = JSON.parse(read("resources/ccss/ela-standards.json"));

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

[
  "Create from Reading Text",
  "Upload a reading passage and turn it into a ready-to-teach reading-to-writing lesson.",
  "Upload",
  "Review",
  "Assign",
  "Publish",
  "Reading Text",
  "Lesson Setup",
  "Paste Text",
  "Upload File",
  "Try Sample",
  "Recommended length: 300-1,200 words for classroom projects.",
  "Use Sample: The Mystery of the Lost Map",
  "Project Title",
  "Grade Level",
  "Teaching Framework",
  "K12 CCSS",
  "Creative Writing",
  "Custom Rubric",
  "Coming soon",
  "Output Type",
  "Class Book",
  "Class Movie",
  "Individual Writing",
  "project-output.html?type=class-book",
  "project-output.html?type=class-movie",
  "project-output.html?type=individual-writing",
  "Class Size",
  "CCSS Standards: Ready",
  "Skill focus will be recommended after text analysis.",
  "Create Lesson",
  "Your reading-to-writing lesson is ready.",
  "Review and adjust before assigning.",
  "Text & Skill Match",
  "Text Type",
  "Reading Focus",
  "Writing Focus",
  "Why this matches",
  "Model Sentences",
  "Student Writing Support",
  "Student Writing Task",
  "Rewrite Pattern",
  "Student Checklist",
  "Project Plan",
  "Class Science Explainer Book",
  "Class Science Documentary",
  "This lesson uses 1 project credit.",
  "Visual credits are only used later when images or videos are generated.",
  "Ready to assign this project?",
  "Assign to Students",
  "Regenerate Lesson",
  "Assign chapters or scenes.",
  "Student Names",
  "Auto Assign",
  "Generate Student Links",
  "Student links are ready.",
  "Class Code",
  "MAP-4832",
  "Copy Class Code",
  "Open Student View",
  "Go to Teacher Studio",
  "Teacher Pack",
  "Download Teacher Pack",
  "45-Minute Lesson Plan",
  "Download 45-Minute Lesson Plan",
  "TextTypeDetectionService",
  "CreateLessonService",
  "science_explainer_book",
  "documentary_movie",
  "RL.4.3",
  "W.4.3",
  "RI.4.3",
  "W.4.2"
].forEach((token) => {
  assert(createHtml.includes(token), `Create Reading Project page should include: ${token}`);
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
  "Join a class project.",
  "Enter Class Code",
  "Example: MAP-4832",
  "Open My Task",
  "Free Creation",
  "Start Free Writing",
  "Teacher Assignment",
  "Open Teacher Task",
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
  "Save Story"
].forEach((token) => {
  assert(visualWriteHtml.includes(token), `Visual Write page should include: ${token}`);
});

assert(!visualWriteHtml.includes("RL.4.3"), "Student Visual Write should not expose reading standard codes");
assert(!visualWriteHtml.includes("W.4.3"), "Student Visual Write should not expose writing standard codes");

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

[createHtml, visualWriteHtml, teacherProjectHtml, projectOutputHtml].forEach((pageHtml, index) => {
  const scripts = [...pageHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  scripts.forEach((script, scriptIndex) => {
    assert.doesNotThrow(() => new Function(script), `Inline script ${scriptIndex} on page ${index} should parse`);
  });
});

console.log("StoriesLens classroom co-creation structure checks passed.");
