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
  "visual-read.html",
  "group-write.html"
].filter((file) => fs.existsSync(path.join(root, file)));

const htmlByFile = Object.fromEntries(htmlFiles.map((file) => [file, read(file)]));
const indexHtml = htmlByFile["index.html"];
const createHtml = htmlByFile["create-reading-project.html"];
const visualWriteHtml = htmlByFile["visual-write.html"];
const teacherHtml = htmlByFile["teacher-dashboard.html"];
const packageJson = JSON.parse(read("package.json"));
const serverJs = read("server.js");
const scriptJs = read("script.js");

assert.strictEqual(packageJson.scripts?.start, "node server.js", "Railway/Railpack should have a start command");
assert.strictEqual(packageJson.main, "server.js", "Package entry should point to the static server");
assert(serverJs.includes("process.env.PORT"), "Static server should bind to Railway's PORT environment variable");
assert(serverJs.includes("/api/generate-image"), "Static server should keep the image generation proxy route");
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
  "Turn reading into writing, and writing into visual stories.",
  "Classroom Co-Creation Studio",
  "Create from Reading Text",
  "Start Visual Writing",
  "From one reading text to a whole-class visual story.",
  "Students write scenes, generate visuals, and publish a shared book or movie.",
  "For Teachers",
  "For Students",
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
  "Upload any reading passage and turn it into a CCSS-aligned class book or class movie project.",
  "Project Title",
  "Grade Level",
  "Reading Text",
  "Project Type",
  "Class Size",
  "Writing Goal",
  "Generate Project",
  "Reading Summary",
  "Text Level",
  "Vocabulary Focus",
  "CCSS Reading Focus",
  "CCSS Writing Focus",
  "Why this text matches",
  "Imitation Writing Prompt",
  "Student Checklist",
  "Class Book Plan",
  "Class Movie Plan",
  "RL.4.3",
  "W.4.3"
].forEach((token) => {
  assert(createHtml.includes(token), `Create Reading Project page should include: ${token}`);
});

[
  "Visual Write",
  "Choose how you want to start writing today.",
  "Free Creation",
  "Start Free Writing",
  "Teacher Assignment",
  "Open Teacher Task",
  "Continue a chapter or scene assigned by your teacher.",
  "My Role in the Class Project",
  "Scene 3: The Hidden Door",
  "Generate Image",
  "Generate Scene Video",
  "1 image credit",
  "1 video credit",
  "Get AI Feedback",
  "Glow",
  "Grow",
  "Next Step",
  "Submit to Teacher"
].forEach((token) => {
  assert(visualWriteHtml.includes(token), `Visual Write page should include: ${token}`);
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

[createHtml, visualWriteHtml].forEach((pageHtml, index) => {
  const scripts = [...pageHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  scripts.forEach((script, scriptIndex) => {
    assert.doesNotThrow(() => new Function(script), `Inline script ${scriptIndex} on page ${index} should parse`);
  });
});

console.log("StoriesLens classroom co-creation structure checks passed.");
