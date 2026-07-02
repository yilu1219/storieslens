const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const html = read("index.html");
const visibleHtml = html.replace(/&amp;/g, "&");
const css = read("styles.css");
const js = read("script.js");
const packageJson = JSON.parse(read("package.json"));
const serverJs = fs.existsSync(path.join(root, "server.js")) ? read("server.js") : "";
const gitIgnore = fs.existsSync(path.join(root, ".gitignore")) ? read(".gitignore") : "";
const envExample = fs.existsSync(path.join(root, ".env.example")) ? read(".env.example") : "";
const visualReadHtml = fs.existsSync(path.join(root, "visual-read.html")) ? read("visual-read.html") : "";
const visualReadVisibleHtml = visualReadHtml.replace(/&amp;/g, "&");
const visualWriteHtml = fs.existsSync(path.join(root, "visual-write.html")) ? read("visual-write.html") : "";
const visualWriteVisibleHtml = visualWriteHtml.replace(/&amp;/g, "&");
const groupWriteHtml = fs.existsSync(path.join(root, "group-write.html")) ? read("group-write.html") : "";
const groupWriteVisibleHtml = groupWriteHtml.replace(/&amp;/g, "&");
const wxCallbackHtml = fs.existsSync(path.join(root, "wx-callback.html")) ? read("wx-callback.html") : "";
const teacherDashboardHtml = fs.existsSync(path.join(root, "teacher-dashboard.html")) ? read("teacher-dashboard.html") : "";
const teacherDashboardVisibleHtml = teacherDashboardHtml.replace(/&amp;/g, "&");

assert.strictEqual(packageJson.scripts?.start, "node server.js", "Railway/Railpack should have a start command");
assert.strictEqual(packageJson.main, "server.js", "Package entry should point to the static server");
assert(serverJs.includes("process.env.PORT"), "Static server should bind to Railway's PORT environment variable");
assert(serverJs.includes("createServer"), "Static server should create an HTTP server");
assert(serverJs.includes("index.html"), "Static server should serve the homepage");
[
  "/api/generate-image",
  "/api/ai-report",
  "AIMS_API_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "https://openrouter.ai/api/v1",
  "/chat/completions",
  "https://aimodelshow.com/api/v1",
  "/images/generations",
  "AIMS-2",
  "response_format",
  "Authorization",
  "handleAIReport",
  "readJsonBody",
  "sendJson",
  "loadLocalEnv"
].forEach((token) => {
  assert(serverJs.includes(token), `Image generation proxy should include: ${token}`);
});
assert(gitIgnore.includes(".env"), ".env should be ignored so the AIMS API key is not committed");
assert(envExample.includes("AIMS_API_KEY="), ".env.example should document the AIMS API key variable");
assert(envExample.includes("OPENROUTER_API_KEY="), ".env.example should document the OpenRouter API key variable");
assert(!envExample.includes("aims_"), ".env.example should not contain a real AIMS API key");

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
assert(html.includes('<a class="panel-button blue" href="visual-read.html">'), "Start Visual Read should open the new Visual Read page");
assert(headerMarkup.includes('href="visual-write.html"'), "Header Visual Write navigation should open the new Visual Write page");
assert(headerMarkup.includes('href="group-write.html"'), "Header navigation should include the Group Write classroom co-writing page");
assert(topCtaMarkup.includes('href="visual-write.html"'), "Start Creating should open the new Visual Write page");
assert(html.includes('<a class="panel-button purple" href="visual-write.html">'), "Create a Story should open the new Visual Write page");
assert(visualReadHtml.includes("<title>Visual Read | StoriesLens</title>"), "Visual Read page should exist with a clear title");
assert(visualReadHtml.includes('href="visual-write.html"'), "Visual Read page should link to the Visual Write page");
assert(visualReadHtml.includes("Visual Read · 可视化阅读"), "Visual Read page should show the reading workspace title");
assert(visualReadHtml.includes('href="index.html"'), "Visual Read page should include a link back to the homepage");
assert(visualWriteHtml.includes("<title>Visual Write | StoriesLens</title>"), "Visual Write page should exist with a clear title");
assert(visualWriteHtml.includes('href="index.html"'), "Visual Write page should include a link back to the homepage");
assert(visualWriteHtml.includes('href="group-write.html"'), "Visual Write page should link to the Group Write page");
[
  "visual-write-page",
  'class="write-hero"',
  "Visual Write",
  "故事艺术与动画创作",
  "CCSS Grade-Level Prompts",
  "4 Art Styles",
  "AI Pictures + Short Movies",
  "Select Grade Level",
  'class="mode-switch"',
  'data-mode-toggle="student"',
  'data-mode-toggle="teacher"',
  "Student Mode",
  "Teacher Mode",
  'data-mode-scope="teacher"',
  "Upload Writing Prompt for Class",
  'href="teacher-dashboard.html"',
  'class="user-avatar-menu"',
  "Personal Settings",
  "Log Out",
  'data-write-grade-selector',
  "Free Create Studio",
  "Write freely first. StoriesLens maps the draft to CCSS after the student has a real story.",
  "Story Draft",
  "Generate Image / Video",
  "Writing Window",
  "Visual Output Window",
  "Open Claw AI Tutor",
  "Check My Story",
  "CCSS Skill Check",
  "Automatically maps the draft to five grade-level writing skills.",
  "Strong",
  "Needs Work",
  "Missing",
  "Glow",
  "Grow",
  "Next Step",
  "Apply Suggestion",
  "AI Feedback API Contract",
  "studentDraft",
  "teacherTask",
  "skillScores",
  "sentenceComments",
  'data-write-action="check-story"',
  'data-write-action="apply-suggestion"',
  'data-ccss-diagnostic-grid',
  'data-open-claw-feedback',
  'data-free-create-studio',
  'data-media-output-panel',
  'class="write-skill-card',
  "Narrative Sequence",
  "Character & Setting",
  "Dialogue",
  "Descriptive Details",
  "Opinion + Reason",
  "CCSS.ELA-LITERACY.W.3.3a",
  "W.3.3",
  "W.4.3b",
  'id="story-draft"',
  "Auto-saved",
  "Keyboard",
  "Voice Input",
  "Read Aloud",
  "Ivy AI Report",
  "艾薇 AI Report",
  "OpenRouter ChatGPT model",
  "Mastra agent ready",
  "Digital human explainer",
  "Choose Ivy avatar",
  "Generate Ivy Report",
  "Generate Explainer Video Script",
  "Report Prompt",
  'data-ivy-report-panel',
  'data-ivy-prompt',
  'data-ivy-avatar-model',
  'data-ai-report-status',
  'data-ai-report-output',
  'data-report-video-script',
  'data-write-action="generate-ai-report"',
  'data-write-action="generate-report-video"',
  'data-input-status',
  'data-voice-playback',
  'class="input-status-panel"',
  'class="write-action-toolbar"',
  'data-write-action="generate-illustration"',
  'class="studio-window writing-window story-draft-panel"',
  'class="studio-window visual-output-window art-direction-panel media-output-panel"',
  'class="output-primary-actions"',
  'data-write-action="generate-movie"',
  'data-write-action="start-group-writing"',
  'data-write-action="switch-style"',
  'data-write-action="save-draft"',
  'data-write-action="final-save"',
  'data-write-action="clear-text"',
  "art-direction-panel",
  'class="art-style-card active"',
  'class="illustration-preview"',
  'data-image-status',
  'data-generated-image-save',
  'data-generated-image-download',
  "Save Image to Works",
  'class="movie-preview"',
  'class="media-strip"',
  'src="assets/showcase-ocean-lantern.png"',
  'src="assets/showcase-block-castle.png"',
  'src="assets/showcase-dragon-movie.png"',
  'class="video-editor-panel"',
  'class="video-preview-screen"',
  'class="video-timeline"',
  'class="timeline-clip active"',
  'data-video-action="play"',
  'data-video-action="trim"',
  'data-video-action="split"',
  'data-video-action="export"',
  'id="write-modal"',
  'class="write-modal"',
  'class="write-toast"',
  'src="assets/lobster-ai-tutor.png"',
  'id="teacher-prompt-modal"',
  'class="group-writing-panel"',
  "Start Group Co-Writing",
  "Create a temporary co-writing room",
  "Assign CCSS roles",
  "Lock character consistency",
  "Student contribution colors"
].forEach((token) => {
  assert(visualWriteVisibleHtml.includes(token), `Visual Write page should include: ${token}`);
});
const freeCreateStudioMarkup = visualWriteVisibleHtml.match(/<section class="write-workspace free-create-studio"[\s\S]*?<\/section>\s*<section class="ccss-diagnostic-panel"/)?.[0] || "";
const writingWindowStart = freeCreateStudioMarkup.indexOf('class="studio-window writing-window story-draft-panel"');
const visualOutputStart = freeCreateStudioMarkup.indexOf('class="studio-window visual-output-window');
const draftToolsStart = freeCreateStudioMarkup.indexOf('class="draft-tools"');
const draftToolbarStart = freeCreateStudioMarkup.indexOf('class="write-action-toolbar"');
const generateImageStart = freeCreateStudioMarkup.indexOf('data-write-action="generate-illustration"');
const generateVideoStart = freeCreateStudioMarkup.indexOf('data-write-action="generate-movie"');
assert(freeCreateStudioMarkup.includes("Story Draft"), "Free Create Studio should keep writing on the left window");
assert(writingWindowStart >= 0 && draftToolsStart > writingWindowStart, "Free Create Studio should include a writing window with input tools");
assert(draftToolsStart < visualOutputStart && visualOutputStart < draftToolbarStart, "Visual Output Window should sit directly below Keyboard / Voice / Read Aloud controls");
assert(generateImageStart > visualOutputStart && generateImageStart < draftToolbarStart, "Visual output window should contain Generate Image");
assert(generateVideoStart > visualOutputStart && generateVideoStart < draftToolbarStart, "Visual output window should contain Generate Video");
[
  ".visual-write-page",
  ".write-hero",
  ".write-grade-select",
  ".mode-switch",
  ".mode-toggle",
  ".mode-toggle.active",
  ".teacher-only",
  ".student-only",
  ".user-avatar-menu",
  ".write-workspace",
  ".free-create-studio",
  ".free-create-header",
  ".media-output-panel",
  ".ccss-diagnostic-panel",
  ".ccss-diagnostic-card",
  ".open-claw-feedback",
  ".api-contract-card",
  ".write-skill-card",
  ".story-draft-panel",
  ".art-direction-panel",
  ".art-style-card.active",
  ".write-action-toolbar",
  ".input-status-panel",
  ".ivy-report-panel",
  ".ivy-report-layout",
  ".ivy-prompt-box",
  ".ivy-report-output",
  ".ivy-avatar-selector",
  ".ivy-video-script",
  ".input-status-panel audio",
  ".draft-tools button.is-active",
  ".video-editor-panel",
  ".video-preview-screen",
  ".video-timeline",
  ".timeline-clip",
  ".write-modal",
  ".write-toast",
  ".teacher-prompt-modal",
  ".group-writing-panel"
].forEach((token) => {
  assert(css.includes(token), `Visual Write page CSS should include: ${token}`);
});
[
  "initVisualWriteInteractions",
  "initIdentityMode",
  "storieslens_identity_mode",
  "applyIdentityMode",
  "data-mode-toggle",
  "data-mode-scope",
  "writeGradeSkillMap",
  "renderWriteSkillCards",
  "analyzeWritingDraft",
  "renderWritingDiagnostics",
  "renderOpenClawFeedback",
  "applyOpenClawSuggestion",
  "focusDraftEditor",
  "startWriteVoiceInput",
  "stopWriteVoiceInput",
  "readWriteDraftAloud",
  "buildIvyReportPrompt",
  "generateIvyAIReport",
  "renderIvyAIReport",
  "generateIvyReportVideoScript",
  "setIvyReportStatus",
  "data-ai-report-status",
  "data-report-video-script",
  "/api/ai-report",
  "appendDictationToDraft",
  "setWriteInputStatus",
  "SpeechRecognition",
  "webkitSpeechRecognition",
  "MediaRecorder",
  "navigator.mediaDevices.getUserMedia",
  "speechSynthesis",
  "SpeechSynthesisUtterance",
  "buildFreeCreateImagePrompt",
  "generateFreeCreateImage",
  "setImageGenerationStatus",
  "/api/generate-image",
  "data-image-status",
  "data-generated-image-save",
  "data-generated-image-download",
  "writeActions",
  "data-write-grade-selector",
  "data-write-action",
  "data-video-action",
  "teacher-prompt-modal",
  "start-group-writing",
  "W.K.3",
  "W.5.3",
  "W.8.3",
  "W.9-10.3",
  "W.11-12.3"
].forEach((token) => {
  assert(js.includes(token), `Visual Write interactions should include: ${token}`);
});
assert(groupWriteHtml.includes("<title>Group Write | StoriesLens</title>"), "Group Write page should exist with a clear title");
[
  "group-write-page",
  "teacher-login-bar",
  "Teacher login entrance",
  "Google Classroom overseas teacher login",
  "WeChat web scan login",
  "googleClassLoginBtn",
  "wechatWebLoginBtn",
  "wxQrModal",
  "wxQrContainer",
  "loginStatusBox",
  "Demo mode",
  "Production mode uses WeChat Open Platform",
  "Group Novel Studio",
  "Create a classroom storybook",
  "Student signature",
  "Teacher / leader",
  "Chapter Count",
  "Create Group Book",
  "Load Existing Project",
  "Group Chat",
  "Chapter Board",
  "Claim Chapter",
  "Enter Editor",
  "Mark Finished",
  "Recall Chapter",
  "Chapter Editor",
  "Writer:",
  "Generate Chapter Illustration",
  "Save Chapter Draft",
  "Exit Editor",
  "Full Book Assembly",
  "Merge Full Book",
  "Export Signed TXT",
  "Generate Cover Poster",
  "Save Book to Works",
  "data-group-book-title",
  "data-group-chapter-count",
  "data-group-student-name",
  "data-group-creator-toggle",
  "data-group-action=\"create-project\"",
  "data-group-action=\"load-project\"",
  "data-group-action=\"merge-book\"",
  "data-group-action=\"export-book\"",
  "data-group-action=\"generate-poster\"",
  "data-group-action=\"save-book\"",
  "data-group-chapter-grid",
  "data-group-editor",
  "data-group-editor-text",
  "data-group-full-preview",
  "data-group-chat-log",
  "data-group-toast"
].forEach((token) => {
  assert(groupWriteVisibleHtml.includes(token), `Group Write page should include: ${token}`);
});
[
  ".group-write-page",
  ".teacher-login-bar",
  ".login-btn-group",
  ".btn-google",
  ".btn-wechat",
  ".wx-login-modal",
  ".wx-modal-content",
  ".login-status",
  ".group-hero",
  ".group-project-panel",
  ".group-project-form",
  ".group-chat-panel",
  ".chapter-board",
  ".chapter-card",
  ".chapter-status",
  ".chapter-writer",
  ".chapter-editor-panel",
  ".group-style-grid",
  ".group-assembly-panel",
  ".full-book-preview",
  ".group-toast"
].forEach((token) => {
  assert(css.includes(token), `Group Write CSS should include: ${token}`);
});
[
  "GROUP_STORE",
  "TEACHER_LOGIN_STORE",
  "sl_wx_teacher_user",
  "sl_google_teacher_user",
  "sl_env_mode",
  "WX_CONFIG",
  "GOOGLE_OAUTH_CONFIG",
  "REPLACE_YOUR_WX_WEBSITE_APPID",
  "REPLACE_GOOGLE_CLIENT_ID",
  "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js",
  "/api/wx/getUserInfo",
  "/api/wx/classList",
  "/api/wx/sendTaskNotify",
  "openWechatLoginModal",
  "loadWechatLoginSdk",
  "mockWechatTeacherLogin",
  "handleWxCallback",
  "closeWxModal",
  "renderLoginStatus",
  "logoutTeacher",
  "googleOAuthLogin",
  "getActiveTeacherLogin",
  "requireTeacherLoginForGroupCreation",
  "getTeacherDistributionCopy",
  "storiesLens_group_novel",
  "storiesLens_group_member",
  "storiesLens_group_chat",
  "initGroupWrite",
  "readGroupNovel",
  "writeGroupNovel",
  "readGroupMember",
  "writeGroupMember",
  "createGroupNovelProject",
  "renderGroupChapters",
  "claimGroupChapter",
  "recallGroupChapter",
  "openGroupChapterEditor",
  "saveGroupChapterDraft",
  "markGroupChapterFinished",
  "generateGroupChapterIllustration",
  "mergeGroupNovelText",
  "exportGroupNovelTxt",
  "generateGroupBookPoster",
  "saveGroupBookToWorks",
  "BroadcastChannel",
  "group_sync",
  "Writer:"
].forEach((token) => {
  assert(js.includes(token), `Group Write interactions should include: ${token}`);
});
assert(wxCallbackHtml.includes("<title>WeChat Login Callback | StoriesLens</title>"), "WeChat callback page should exist");
assert(wxCallbackHtml.includes("handleWxCallback"), "WeChat callback page should call the shared callback handler");
assert(wxCallbackHtml.includes("script.js"), "WeChat callback page should load the shared script");
assert(teacherDashboardHtml.includes("<title>Teacher Dashboard | StoriesLens</title>"), "Teacher Dashboard page should exist");
[
  "Teacher Dashboard",
  "Classroom Setup",
  "Excel Bulk Import",
  "DingTalk / WeCom Class Import",
  "Seewo Classroom Sync",
  "WPS Export",
  "CCSS Writing Assignment",
  "Create Writing Task",
  "Set grade, CCSS skill, theme, word count, and media permissions.",
  "Send to Class",
  "Student Submission",
  "Batch Review",
  "Class Report",
  "Completion",
  "Weakest Skill",
  "Open Claw Batch Review",
  "Class CCSS Skill Report",
  "Student Illustration & Movie Archive",
  "Export Learning PDF Report",
  "Google Classroom",
  "Domestic classroom mode"
].forEach((token) => {
  assert(teacherDashboardVisibleHtml.includes(token), `Teacher Dashboard should include: ${token}`);
});
const visualReadVocabCard = visualReadHtml.match(/<article class="vocab-card">[\s\S]*?<\/article>/)?.[0] || "";
const visualReadQuickCheckCard = visualReadHtml.match(/<article class="quick-check-card[\s\S]*?<\/article>/)?.[0] || "";
assert(visualReadHtml.includes('class="vocab-check-grid"'), "Visual Vocabulary and Quick Check should sit in the same side-by-side grid");
assert(visualReadVocabCard.includes('class="visual-vocab-image-card"'), "Visual Vocabulary should use a generated image card instead of a plain definition layout");
assert(visualReadVocabCard.includes('src="assets/vocab-lighthouse-card.png"'), "Visual Vocabulary should use the generated lighthouse vocabulary card image");
assert(visualReadVocabCard.includes('data-open-panel="vocabulary"'), "Visual Vocabulary generated card should be clickable");
assert(visualReadQuickCheckCard.includes('src="assets/showcase-ocean-lantern.png"'), "Quick Check should include the word image next to the picture-based question");
assert(visualReadQuickCheckCard.includes('data-open-panel="vocabulary"'), "Quick Check visual image should be a real clickable vocabulary preview");
[
  "visual-read-page",
  'class="read-hero"',
  "Teacher Custom Upload",
  "Source: Teacher Uploaded Text",
  'class="read-step active"',
  "CCSS Skill Card",
  "ELA Skill",
  "Guided Writing",
  "Storybook Image",
  'class="story-reading-card"',
  "The Clever Fox and the Moonlit Bridge",
  'class="word-popover"',
  'class="vocabulary-panel"',
  'class="vocab-check-grid"',
  'class="visual-vocab-image-card"',
  'src="assets/vocab-lighthouse-card.png"',
  "Visual Vocabulary",
  "Quick Check",
  'class="quick-check-visual"',
  'class="grade-selector"',
  'class="ccss-skill-board"',
  'data-skill-card-grid',
  'class="ccss-flip-card"',
  'class="skill-card-front"',
  'class="skill-card-back"',
  'data-grade-selector',
  'class="grade-chip active"',
  'data-grade="3"',
  'data-grade="12"',
  "CCSS.ELA-LITERACY.RL.3.1",
  "RL.3.1",
  "W.3.3",
  'data-open-panel="story"',
  'data-open-panel="ccss"',
  'data-open-panel="ela"',
  'data-open-panel="writing"',
  'data-open-panel="storybook"',
  'class="inline-word"',
  'data-read-action="word-book"',
  'data-read-action="ai-picture"',
  'data-read-action="read-aloud"',
  'data-read-aloud-status',
  "Record My Reading",
  "Start Recording",
  "Stop",
  "Replay",
  "Save Recording",
  "Ask Lobster AI for Fluency Feedback",
  "AI Fluency Feedback",
  "Saved Reading Practice",
  'class="reading-recording-panel"',
  'data-recording-status',
  'data-recording-playback',
  'data-recording-feedback',
  'data-recording-list',
  'data-record-action="start-recording"',
  'data-record-action="stop-recording"',
  'data-record-action="replay-recording"',
  'data-record-action="save-recording"',
  'data-record-action="ai-fluency-feedback"',
  'class="teacher-upload-panel"',
  'id="teacher-upload"',
  'type="file"',
  'class="imitation-flow-panel"',
  "Article Example",
  "Speak or Write Your Sentence",
  "Fill the Pattern",
  "Word Bank",
  "Hold to Speak",
  "AI Transcription",
  "Use This Sentence",
  "Try Again",
  "Edit Text",
  "Lobster AI Tutor Check",
  "Subject",
  "Action",
  "Picture place",
  "Feeling or manner",
  "Ready for image/video",
  "Generate Image First",
  "Generate Image",
  "Make Short Video",
  "Write one clear action sentence, then turn it into a picture or short video.",
  "My Visual Drafts",
  "Original Article",
  "Matched CCSS",
  "Example Sentence",
  "Student Sentence",
  "Generated Output",
  "Visual Proof",
  'data-imitation-flow',
  'data-ccss-skill-code',
  'data-example-sentence',
  'data-imitation-template',
  'data-imitation-input',
  'data-fill-slot="feeling"',
  'data-fill-slot="action"',
  'data-word-chip',
  'data-speech-status',
  'data-imitation-transcript',
  'data-video-gate',
  'data-imitation-feedback',
  'data-imitation-preview',
  'data-visual-drafts-list',
  'data-empty-drafts',
  'data-read-action="use-example-sentence"',
  'data-read-action="build-fill-sentence"',
  'data-read-action="start-imitation-speech"',
  'data-read-action="use-transcript-sentence"',
  'data-read-action="try-speech-again"',
  'data-read-action="edit-transcript"',
  'data-read-action="generate-imitation-image"',
  'data-read-action="make-imitation-video"',
  "ccss-upload-builder",
  "Upload Article",
  "Choose grade level",
  "Auto-match CCSS Skill Cards",
  "Matched CCSS Skill Cards",
  'data-upload-file',
  'data-upload-grade-selector',
  'data-upload-text',
  'data-ccss-match-output',
  'data-read-action="match-ccss"',
  'id="read-modal"',
  'class="read-modal"',
  "Coming Next: CCSS Skill Card, ELA Skill, Guided Writing & Storybook Image",
  'class="lobster-tutor-bubble"',
  'src="assets/lobster-ai-tutor.png"',
  'src="assets/hero-student.png"'
].forEach((token) => {
  assert(visualReadVisibleHtml.includes(token), `Visual Read page should include: ${token}`);
});
[
  "StoriesLens CCSS Story Library",
  "CCSS Skill Story Pack",
  "Open Grade Library",
  "Currently loaded",
  "Elementary K-5",
  "Middle School 6-8",
  "High School 9-12",
  "Source Type",
  "Original",
  "Public Domain Adaptation",
  "Teacher Upload",
  "Grade K",
  "Grade 12",
  "Key Details",
  "The Lost Star",
  "The Lion and the Mouse",
  "The Tale of Peter Rabbit",
  "The Fox and the Moonlit Bridge",
  "The Wonderful Wizard of Oz",
  "Alice in Wonderland",
  "Reading Passage",
  "5-question Quiz",
  "Vocabulary Card",
  "Imitation Sentence",
  "Generate Image / Generate Video",
  "data-story-library-toggle",
  "data-story-library-body",
  "data-story-library-summary",
  "data-story-pack-grid",
  "data-story-pack-group",
  "data-story-pack-card",
  "data-story-pack-title",
  "data-story-pack-source",
  "data-story-pack-skill",
  "data-story-pack-quiz"
].forEach((token) => {
  assert(visualReadVisibleHtml.includes(token), `Visual Read story library should include: ${token}`);
});
const visualReadImitationCard = visualReadVisibleHtml.match(/<article class="imitation-stage-card imitation-card">[\s\S]*?<\/article>/)?.[0] || "";
const visualReadOutputCard = visualReadVisibleHtml.match(/<article class="imitation-stage-card output-card">[\s\S]*?<\/article>/)?.[0] || "";
assert(!visualReadImitationCard.includes("Write one clear action sentence, then turn it into a picture or short video."), "Sentence Imitation card should not carry the output guidance text");
assert(visualReadOutputCard.includes("Write one clear action sentence, then turn it into a picture or short video."), "Choose Output card should carry the output guidance text");
assert(visualReadOutputCard.includes("Generate Image"), "Choose Output card should use the Generate Image label");
assert(visualReadOutputCard.includes("Make Short Video"), "Choose Output card should reveal the Make Short Video label after image generation");
[
  ".visual-read-page",
  ".read-hero",
  ".read-step.active",
  ".story-reading-card",
  ".vocabulary-panel",
  ".vocab-check-grid",
  ".visual-vocab-image-card",
  ".quick-check-card",
  ".grade-selector",
  ".ccss-skill-board",
  ".story-library-panel",
  ".story-library-panel.is-open",
  ".story-library-toggle",
  ".story-library-summary",
  ".story-library-body",
  ".story-pack-group",
  ".story-pack-grid",
  ".story-pack-card",
  ".story-pack-card.active",
  ".story-pack-meta",
  ".story-pack-preview",
  ".story-pack-quiz-list",
  ".ccss-flip-card",
  ".skill-card-inner",
  ".skill-card-front",
  ".skill-card-back",
  ".grade-chip",
  ".inline-word",
  ".read-audio-bar button.is-reading",
  ".reading-recording-panel",
  ".recording-control-grid",
  ".recording-feedback-card",
  ".recording-history-list",
  ".recording-history-card",
  ".teacher-upload-panel",
  ".imitation-flow-panel",
  ".imitation-stage-card",
  ".fill-pattern-grid",
  ".word-choice-bank",
  ".voice-imitation-panel",
  ".hold-speak-button",
  ".transcript-review-card",
  ".transcript-action-row",
  ".tutor-checklist",
  ".make-video-button",
  ".make-video-button.is-ready",
  ".imitation-output-options",
  ".imitation-preview-card",
  ".visual-drafts-shelf",
  ".visual-draft-card",
  ".visual-draft-evidence",
  ".draft-action-row",
  ".ccss-upload-builder",
  ".upload-grade-select",
  ".ccss-match-output",
  ".matched-skill-card",
  ".read-modal",
  ".toast-message",
  ".locked-next-panel",
  ".lobster-tutor-bubble"
].forEach((token) => {
  assert(css.includes(token), `Visual Read page CSS should include: ${token}`);
});
[
  "initVisualReadInteractions",
  "gradeProfiles",
  "ccssSkillMap",
  "storyPacks",
  "renderStoryPackLibrary",
  "toggleStoryLibrary",
  "applyStoryPack",
  "data-story-library-toggle",
  "data-story-library-body",
  "data-story-library-summary",
  "data-story-pack-group",
  "renderGradeSkillCards",
  "The Lost Star",
  "The Lion and the Mouse",
  "The Tale of Peter Rabbit",
  "The Wonderful Wizard of Oz",
  "Alice in Wonderland",
  "Public Domain Adaptation",
  "Teacher Upload",
  "data-story-pack-grid",
  "data-story-pack-card",
  "RL.K.1",
  "W.K.3",
  "RL.5.7",
  "RL.8.1",
  "RL.9-10.7",
  "RL.11-12.1",
  "W.11-12.3",
  "openReadModal",
  "data-grade-selector",
  "data-open-panel",
  "data-read-action",
  "speechSynthesis",
  "SpeechSynthesisUtterance",
  "getReadAloudText",
  "readCurrentStoryAloud",
  "stopReadAloud",
  "data-read-aloud-status",
  "MediaRecorder",
  "startReadingRecording",
  "stopReadingRecording",
  "saveReadingRecording",
  "renderReadingRecordings",
  "storieslens_reading_recordings",
  "data-record-action",
  "data-recording-status",
  "data-recording-playback",
  "data-recording-feedback",
  "renderImitationFlowFromCcss",
  "extractExampleSentence",
  "buildImitationFromFillSlots",
  "startImitationSpeech",
  "applySpeechTranscript",
  "updateTutorChecklist",
  "SpeechRecognition",
  "webkitSpeechRecognition",
  "generateImitationOutput",
  "createVisualDraft",
  "renderVisualDrafts",
  "storieslens_visual_read_drafts",
  "data-visual-drafts-list",
  "data-draft-action",
  "save-visual-draft",
  "regenerate-visual-draft",
  "delete-visual-draft",
  "Save to Works",
  "Regenerate",
  "Delete",
  "data-imitation-input",
  "data-imitation-transcript",
  "data-word-chip",
  "data-video-gate",
  "generate-imitation-image",
  "make-imitation-video",
  "matchUploadedTextToCcss",
  "renderUploadCcssMatches",
  "data-upload-grade-selector",
  "data-upload-text",
  "data-upload-file",
  "match-ccss",
  "quick-check-input",
  "toast-message"
].forEach((token) => {
  assert(js.includes(token), `Visual Read interactions should include: ${token}`);
});
assert(html.includes("<title>StoriesLens AI语镜故事</title>"), "Page title should use the AI Chinese brand name");
assert(brandMarkup.includes("<span>StoriesLens AI语镜故事</span>"), "Header brand should use the AI Chinese brand name");
assert(html.includes("© StoriesLens AI语镜故事 ·"), "Footer copyright should use the AI Chinese brand name");
assert(!html.includes("<title>StoriesLens 语镜故事</title>"), "Old page title should be removed");
assert(!brandMarkup.includes("<span>StoriesLens 语镜故事</span>"), "Old header brand should be removed");
assert(!html.includes("© StoriesLens 语镜故事 ·"), "Old footer brand should be removed");
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
  "StoriesLens AI语镜故事",
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
