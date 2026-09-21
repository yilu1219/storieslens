(() => {
  const platform = window.StoriesLensPlatform;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const params = new URLSearchParams(location.search);
  const workshopMode = params.get("workshop") === "cn";
  const requestedLocale = params.get("locale");
  const forcedLocale = document.body.dataset.studioLanguage;
  let locale = forcedLocale === "zh" ? "zh" : (requestedLocale === "zh" || requestedLocale === "en"
    ? requestedLocale
    : (localStorage.getItem("storieslens_locale") === "zh" ? "zh" : "en"));
  let selectedArtwork = null;
  let selectedArtworkData = "";
  let existingWritingMode = false;
  let existingWritingName = "";
  let recognition = null;
  let answerRecognition = null;
  let answerSpeechHolding = false;
  let answerSpeechStartedAt = 0;
  let answerSpeechTimer = 0;
  let answerSpeechRestartTimer = 0;
  let answerSpeechMaxTimer = 0;
  let answerSpeechOriginal = "";
  let answerSpeechCommitted = "";
  let answerSpeechPointerId = null;
  let questionUtterance = null;
  let mentorUtterance = null;
  let mentorRevisionItems = [];
  let mentorRevisionIndex = 0;
  let mentorReviewedDraft = "";
  let mentorRevisionCompleted = false;
  let mentorReadingConfirmed = false;
  let questionIndex = 0;
  let answers = [];
  let languageTouched = false;
  let savedProjectId = "";
  let artworkPersistencePromise = null;
  let saveTimer = 0;
  let selectedComicTemplate = "";
  let selectedOutputFormat = "";
  const answerSpeechMaxSeconds = 90;

  const copy = {
    en: {
      "brand-subtitle": "语镜故事",
      "my-stories": "My stories",
      "start-kicker": "ONE CREATION · THREE QUESTIONS · YOUR STORY",
      "start-title-one": "Your first story page",
      "start-title-two": "starts with you.",
      "start-intro": "Upload something you made—or begin with words or voice. Yu asks three questions. You answer and remain the author.",
      "yu-profile-cta": "Meet Bard Yu",
      "yu-profile-sub": "Yu’s English storytelling persona",
      "english-form": "ENGLISH FORM",
      "step-one": "STEP 1",
      "bring-one": "Bring one piece of your world.",
      "free": "FREE",
      "upload-title": "Upload your artwork or photo",
      "upload-help": "JPG, PNG, WEBP or HEIC · converted privately on this device",
      "privacy-note": "Location and camera information are removed before the image is used.",
      "beta-photo-note": "PRIVATE BETA · Personal photos may become a private book or video. Use only photos you have permission to use.",
      "existing-writing-entry-title": "Already wrote an essay?",
      "existing-writing-entry-copy": "Paste it, open a document, or scan a clear photo—Yu will begin with sentence-by-sentence revision.",
      "existing-writing-kicker": "EXISTING WRITING",
      "existing-writing-panel-title": "Bring the child’s writing to Yu",
      "existing-writing-file": "Choose a document or a clear photo",
      "existing-writing-paste": "Or paste the writing",
      "existing-writing-placeholder": "Paste an existing essay. Yu will keep the child’s meaning and review it one sentence at a time.",
      "existing-writing-note": "Documents are read on this device. HEIC/HEIF photos are converted on this device; check extracted text before Yu revises it.",
      "or-words": "Or begin with your own words",
      "write-speak": "WRITE · SPEAK",
      "seed-placeholder": "Tell Yu what is happening in the artwork—or begin with one idea.",
      "speak": "Speak",
      "speech-note": "Speech becomes editable text. Live audio is not stored.",
      "creator-name": "Creator name or nickname",
      "name-placeholder": "The name printed on the story",
      "story-language": "Story language",
      "creator-account": "Who is creating?",
      "adult": "An adult or parent",
      "young": "A young creator with adult support",
      "learning-profile-title": "Learning Profile｜学习档案",
      "learning-profile-summary": "Optional · Add MAP Language Usage results to personalize Yu’s guidance.",
      "optional": "OPTIONAL",
      "map-informed-title": "MAP-informed guidance",
      "map-informed-copy": "Yu uses only the results you enter to adjust question difficulty and plan the next three learning goals. This is not an official MAP service or score prediction.",
      "map-privacy": "Enter numbers only. Do not enter a learner’s name, school, student ID, birthday, or upload a report.",
      "map-grade": "Grade at the time of the test",
      "choose-grade": "Choose grade",
      "map-term": "Test season",
      "choose-season": "Choose season",
      "fall": "Fall",
      "winter": "Winter",
      "spring": "Spring",
      "map-subject": "Subject",
      "map-overall": "Overall RIT (optional)",
      "map-domains-title": "Instructional area RIT ranges",
      "map-domains-help": "Enter the low and high number shown for any available area.",
      "map-area": "Area",
      "map-low": "Low",
      "map-high": "High",
      "domain-genre": "Writing genres",
      "domain-craft": "Structure, development, cohesion & style",
      "domain-process": "Writing process, purpose & audience",
      "domain-grammar": "Grammar & usage",
      "domain-mechanics": "Capitalization, punctuation & spelling",
      "map-priority": "Area to prioritize",
      "let-yu-choose": "Let Yu choose from the results",
      "parent-goal": "What would you like the learner to improve?",
      "choose-goal": "Choose a goal",
      "goal-organize": "Organize ideas clearly",
      "goal-details": "Develop stories with vivid details",
      "goal-grammar": "Strengthen sentence structure and grammar",
      "goal-edit": "Edit conventions independently",
      "goal-revise": "Revise independently for purpose and audience",
      "adult-confirm": "I am the adult supporting this young creator.",
      "meet-questions": "Begin with Bard Yu’s three questions",
      "trust-line": "Private by default · AI asks · You create · Every word remains yours",
      "teacher-tool": "FOR TEACHERS",
      "teacher-publisher": "Turn a bulletin board into a dated class book.",
      "teacher-publisher-copy": "Photograph the wall once, or upload each student work separately.",
      "yu-asks": "BARD YU ASKS · YOU ANSWER",
      "your-spark": "YOUR STARTING SPARK",
      "personal-mentor": "BARD YU · YOUR ENGLISH STORY MENTOR",
      "answer-own-words": "Answer in your own words. A short sentence is enough.",
      "answer-placeholder": "In my story...",
      "read-question": "Hear Bard Yu’s question",
      "bard-yu-badge": "BARD YU",
      "stop-reading": "Stop reading",
      "auto-read-questions": "Read every question aloud",
      "answer-by-voice": "Hold to answer",
      "stop-answer-voice": "Release to finish",
      "listening": "Listening…",
      "answer-speech-note": "Press and hold while you speak (up to 90 seconds), then release. Speech becomes editable text; live audio is not stored.",
      "mentor-arrives": "BARD YU TURNS TOWARD YOUR STORY",
      "mentor-review-title": "Your idea is here. Now let’s help your writing grow.",
      "mentor-review-intro": "We’ll look at one sentence at a time. Yu explains one useful move; you decide every change.",
      "mentor-spoken-intro": "Wonderful. Your story idea is here. Now let us make each sentence clearer while keeping it completely yours.",
      "sentence-review": "SENTENCE REVIEW",
      "your-words": "YOUR WORDS",
      "yu-is-thinking": "Bard Yu is looking closely at your sentence…",
      "one-strength": "WHAT WORKS",
      "one-focus": "ONE FOCUS",
      "mini-lesson": "MINI LESSON",
      "yu-suggestion": "YU’S MINIMAL REVISION",
      "yes-my-meaning": "Yes—this is what I mean",
      "change-my-words": "Not quite—I’ll change the words",
      "read-it-aloud": "READ IT IN YOUR WAY",
      "hear-and-follow": "Hear Yu, then read it",
      "i-read-it": "I read and checked it",
      "mentor-authorship-note": "Yu teaches and suggests. Nothing changes until you approve it.",
      "journey-idea": "STORY IDEA",
      "journey-setting": "BUILD THE SETTING",
      "journey-revise": "REVISE WITH YU",
      "journey-format": "CHOOSE THE FORM",
      "setting-being-built": "YOUR OPENING · SETTING",
      "setting-build-title": "Your first paragraph is taking shape.",
      "setting-build-empty": "Each sentence you approve will appear here.",
      "setting-complete": "YOUR FIRST PARAGRAPH · SETTING",
      "story-path-title": "Your story has a place to begin. Where should it go next?",
      "story-path-copy": "The same writing can grow into an illustrated book or a film. Choose now—you can change it later.",
      "your-finished-setting": "YOUR FINISHED SETTING",
      "choose-story-form": "Choose what you want to make",
      "illustrated-book-label": "READ · KEEP · PRINT",
      "illustrated-book": "Illustrated Book",
      "illustrated-book-copy": "Shape each page with words and artwork.",
      "story-film-label": "SEE · HEAR · WATCH",
      "story-film": "Story Film",
      "story-film-copy": "Turn the same world into scenes, action, and voice.",
      "continue-with-form": "Continue with this form",
      "form-not-final": "This choice shapes the next tools. Your story and words stay the same.",
      "next-question": "Next question",
      "see-page": "See my story page",
      "magic-ready": "YOUR FIRST STORY PAGE IS READY",
      "made-by-you": "Made from your answers. Written by you.",
      "edit-before-save": "Read it, edit anything you want, and save only when it feels like your story.",
      "written-by": "Written by",
      "creator-authored": "Creator authored",
      "creator-authored-copy": "Yu asked the questions. The page uses the creator’s own answers and remains editable.",
      "continue-writing": "Continue writing",
      "keep-story": "Finish the full story · $19",
      "start-over": "Start another story",
      "saving": "Saving your private draft…",
      "saved-cloud": "Saved privately to My Stories.",
      "saved-device": "Saved on this device. Sign in later to sync it.",
      questions: [
        "Who is in this story, and what do they want?",
        "What problem are they facing right now?",
        "What happens in the very first moment?"
      ]
    },
    zh: {
      "brand-subtitle": "语镜故事",
      "my-stories": "我的作品",
      "start-kicker": "一份作品 · 三个问题 · 你的故事",
      "start-title-one": "你的第一张故事页，",
      "start-title-two": "从你开始。",
      "start-intro": "上传你的作品，也可以从文字或口述开始。羽导师只问三个问题，由你回答并始终保留作者身份。",
      "yu-profile-cta": "认识 Bard Yu",
      "yu-profile-sub": "羽大师的英文故事智慧化身",
      "english-form": "英文形态",
      "step-one": "第一步",
      "bring-one": "带来一份属于你的创作。",
      "free": "免费体验",
      "upload-title": "上传你的画作或照片",
      "upload-help": "支持 JPG、PNG、WEBP、HEIC · 在本机私密转换",
      "privacy-note": "图片使用前会先删除位置与拍摄设备信息。",
      "beta-photo-note": "内测说明 · 本人或家人的真人照片可以用于制作私密故事书或视频，请先取得本人或监护人同意。",
      "existing-writing-entry-title": "已经写好一篇作文？",
      "existing-writing-entry-copy": "粘贴文字、打开文档，或上传清晰作文照片，让 Yu 从逐句修改开始。",
      "existing-writing-kicker": "已有作文",
      "existing-writing-panel-title": "把孩子已经写好的作文交给 Yu",
      "existing-writing-file": "选择文档或清晰的作文照片",
      "existing-writing-paste": "或直接粘贴这篇作文",
      "existing-writing-placeholder": "粘贴已有作文。Yu 会保留孩子原意，一句一句陪他修改。",
      "existing-writing-note": "文档先在本机读取；HEIC／HEIF 照片先在本机转换。识别出的文字由你确认后，Yu 才会逐句修改。",
      "or-words": "也可以从自己的话开始",
      "write-speak": "写下 · 口述",
      "seed-placeholder": "告诉羽导师画面里正在发生什么，或者先说出一个想法。",
      "speak": "口述",
      "speech-note": "口述会转成可修改的文字，不保存现场录音。",
      "creator-name": "创作者姓名或昵称",
      "name-placeholder": "将印在故事上的名字",
      "story-language": "创作语言",
      "creator-account": "谁在创作？",
      "adult": "成年人或家长",
      "young": "由成年人支持的年轻创作者",
      "learning-profile-title": "Learning Profile｜学习档案",
      "learning-profile-summary": "可选 · 添加 MAP Language Usage 结果，让羽导师调整指导方式。",
      "optional": "选填",
      "map-informed-title": "参考 MAP 的个性化指导",
      "map-informed-copy": "羽导师只使用你填写的结果调整问题难度，并规划接下来的三个学习目标；这不是 MAP 官方服务，也不会预测分数。",
      "map-privacy": "只填写数字。请勿填写学习者姓名、学校、学号、生日，也不要上传完整成绩单。",
      "map-grade": "测试时年级",
      "choose-grade": "选择年级",
      "map-term": "测试时间",
      "choose-season": "选择测试季",
      "fall": "秋季 Fall",
      "winter": "冬季 Winter",
      "spring": "春季 Spring",
      "map-subject": "科目",
      "map-overall": "Overall RIT（选填）",
      "map-domains-title": "各能力领域 RIT 区间",
      "map-domains-help": "成绩单上出现哪个领域，就填写该领域的最低与最高数字。",
      "map-area": "能力领域",
      "map-low": "最低",
      "map-high": "最高",
      "domain-genre": "写作文体",
      "domain-craft": "结构、发展、衔接与风格",
      "domain-process": "写作过程、目的与读者",
      "domain-grammar": "语法与用法",
      "domain-mechanics": "大小写、标点与拼写",
      "map-priority": "优先提升方向",
      "let-yu-choose": "由羽导师根据结果判断",
      "parent-goal": "家长希望学习者提升什么？",
      "choose-goal": "选择一个方向",
      "goal-organize": "清楚地组织想法",
      "goal-details": "用生动细节发展故事",
      "goal-grammar": "加强句子结构与语法",
      "goal-edit": "独立检查大小写、标点与拼写",
      "goal-revise": "根据目的与读者独立修改",
      "adult-confirm": "我是支持这位年轻创作者的成年人。",
      "meet-questions": "回答 Bard Yu 的三个问题",
      "trust-line": "默认私密 · AI 提问 · 由你创作 · 每一个字都属于你",
      "teacher-tool": "教师工具",
      "teacher-publisher": "把一面作品墙变成带日期的班级电子书。",
      "teacher-publisher-copy": "可以一次拍下整面墙，也可以逐张上传学生作品。",
      "yu-asks": "Bard Yu 提问 · 由你回答",
      "your-spark": "你的起点",
      "personal-mentor": "BARD YU · 你的英文故事导师",
      "answer-own-words": "请用自己的话回答，一句话就足够。",
      "answer-placeholder": "在我的故事里……",
      "read-question": "朗读 Bard Yu 的问题",
      "bard-yu-badge": "BARD YU",
      "stop-reading": "停止朗读",
      "auto-read-questions": "自动朗读每个问题",
      "answer-by-voice": "按住回答",
      "stop-answer-voice": "松开完成",
      "listening": "正在听……",
      "answer-speech-note": "按住按钮口述（最长 90 秒），说完松开。口述会转成可修改的文字，不保存现场录音。",
      "mentor-arrives": "羽大师转身来到你的故事前",
      "mentor-review-title": "想法已经出现，现在让文字真正长大。",
      "mentor-review-intro": "我们一次只看一句。羽大师讲清一个方法，每一处修改仍由你决定。",
      "mentor-spoken-intro": "太好了，你的故事想法已经出现。现在，我们一起把每一句说得更清楚，同时保留你自己的声音。",
      "sentence-review": "逐句修改",
      "your-words": "你的原句",
      "yu-is-thinking": "羽大师正在仔细读这一句……",
      "one-strength": "写得好的地方",
      "one-focus": "这次只改一件事",
      "mini-lesson": "一个写作小技巧",
      "yu-suggestion": "羽大师的最小修改",
      "yes-my-meaning": "是，这就是我的意思",
      "change-my-words": "不完全是，我自己改一改",
      "read-it-aloud": "用你喜欢的方式读一遍",
      "hear-and-follow": "先听羽大师，再自己读",
      "i-read-it": "我已经读过并确认",
      "mentor-authorship-note": "羽大师只负责教学和建议；没有你的确认，一个字也不会替换。",
      "journey-idea": "故事想法",
      "journey-setting": "写出场景",
      "journey-revise": "与羽大师修改",
      "journey-format": "选择作品形式",
      "setting-being-built": "故事开篇 · 场景设定",
      "setting-build-title": "你的第一段正在一句句长出来。",
      "setting-build-empty": "你确认的句子会依次出现在这里。",
      "setting-complete": "第一段完成 · 场景已经建立",
      "story-path-title": "故事已经有了起点，接下来想让它成为一本书，还是一部电影？",
      "story-path-copy": "你的文字不会改变；这个选择只决定下一步打开哪一套创作工具，以后仍可更换。",
      "your-finished-setting": "你完成的第一段",
      "choose-story-form": "选择接下来要创作的形式",
      "illustrated-book-label": "阅读 · 珍藏 · 印刷",
      "illustrated-book": "插画故事书",
      "illustrated-book-copy": "让文字和画面一页一页共同讲述。",
      "story-film-label": "场景 · 动作 · 声音",
      "story-film": "故事电影",
      "story-film-copy": "让同一人物与世界走进镜头。",
      "continue-with-form": "按这个方向继续",
      "form-not-final": "羽大师只调整接下来的提问和工具，不会替你改写故事。",
      "next-question": "下一个问题",
      "see-page": "看看我的故事页",
      "magic-ready": "你的第一张故事页完成了",
      "made-by-you": "来自你的回答，也由你亲自写成。",
      "edit-before-save": "先读一读，修改任何你想改变的地方，确定它真正属于你之后再保存。",
      "written-by": "作者",
      "creator-authored": "创作者亲自完成",
      "creator-authored-copy": "羽导师负责提问，页面只使用创作者自己的回答，并且可以继续修改。",
      "continue-writing": "继续创作",
      "keep-story": "完成整本故事 · $19",
      "start-over": "再创作一个故事",
      "saving": "正在保存私人草稿……",
      "saved-cloud": "已私密保存到“我的作品”。",
      "saved-device": "已保存在本设备，之后登录可以同步。",
      questions: [
        "这个故事里有谁？他最想得到什么？",
        "他现在遇到了什么困难或麻烦？",
        "故事发生的第一个瞬间是什么？"
      ]
    }
  };

  const t = (key) => copy[locale][key] || key;

  function toast(message, isError = false) {
    const node = $("[data-toast]");
    node.textContent = message;
    node.classList.toggle("error", isError);
    node.classList.add("show");
    window.setTimeout(() => node.classList.remove("show"), 3200);
  }

  function showStage(name) {
    if (name !== "coach") {
      stopQuestionSpeech();
      stopAnswerSpeech();
    }
    if (name !== "mentor-review") stopMentorSpeech();
    $$('[data-stage]').forEach((stage) => { stage.hidden = stage.dataset.stage !== name; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyLocale(next) {
    locale = forcedLocale === "zh" ? "zh" : (next === "zh" ? "zh" : "en");
    localStorage.setItem("storieslens_locale", locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    $$('[data-locale]').forEach((button) => button.classList.toggle("active", button.dataset.locale === locale));
    $$('[data-t]').forEach((element) => { element.textContent = t(element.dataset.t); });
    $$('[data-placeholder-t]').forEach((element) => { element.placeholder = t(element.dataset.placeholderT); });
    if (forcedLocale === "zh") $("[data-language]").value = "zh";
    if (!$("[data-stage='coach']").hidden) renderQuestion();
    document.title = locale === "zh" ? "开始创作 · 语镜故事" : "Create a Story · StoriesLens";
  }

  function storySeed() {
    const existingWriting = $("[data-existing-writing]");
    return existingWritingMode && existingWriting
      ? existingWriting.value.trim()
      : $("[data-seed]").value.trim();
  }

  function creatorName() {
    return $("[data-creator-name]").value.trim() || (locale === "zh" ? "故事创作者" : "Story Creator");
  }

  function collectChineseCreativeProfile() {
    if ($("[data-language]")?.value !== "zh") return null;
    const chosenOutput = selectedOutputFormat || $("[name='story-output']:checked")?.value || "";
    const bookStyle = $("[name='chinese-book-style']:checked")?.value || "picturebook";
    const format = chosenOutput === "film" ? "film" : chosenOutput === "book" ? bookStyle : "ink-story";
    const background = $("[data-chinese-background]")?.value || "";
    const level = $("[data-chinese-level]")?.value || "";
    const goal = $("[data-chinese-goal]")?.value || "";
    const comicTemplate = format === "comic"
      ? (selectedComicTemplate || $("[name='comic-template']:checked")?.value || "")
      : "";
    return { format, background, level, goal, comicTemplate, source: "creator-choice" };
  }

  const comicTemplates = {
    "classic-8": { name: "经典小人书", description: "一页一画＋页底文字", reason: "你的回答适合用完整画面慢慢展开。" },
    "four-4": { name: "四格故事", description: "开始／发展／转折／结尾", reason: "你的故事核心很集中，四格可以让转折一眼看懂。" },
    "cinematic-6": { name: "电影分镜", description: "6个镜头推进动作", reason: "你的回答里有明显动作和变化，适合用镜头推进。" }
  };

  function recommendComicTemplate() {
    const creatorText = [storySeed(), ...answers].join(" ");
    const actionSignals = /(突然|追|跑|飞|跳|冲|打|打开|发现|变成|消失|出现|声音|镜头|电影)/;
    if (actionSignals.test(creatorText)) return "cinematic-6";
    if (creatorText.replace(/\s/g, "").length <= 90) return "four-4";
    return "classic-8";
  }

  function showComicTemplateStage() {
    const recommendation = recommendComicTemplate();
    selectedComicTemplate = recommendation;
    $$('[data-comic-template-card]').forEach((card) => {
      const isRecommended = card.dataset.comicTemplateCard === recommendation;
      card.classList.toggle("is-recommended", isRecommended);
      $("[data-template-badge]", card).textContent = isRecommended ? "羽大师推荐" : "";
      $("input", card).checked = isRecommended;
    });
    const template = comicTemplates[recommendation];
    $("[data-comic-recommendation]").textContent = `羽大师推荐「${template.name}」：${template.reason}`;
    showStage("comic-template");
    window.StoriesLensAnalytics?.track("comic_template_recommended", { template: recommendation });
  }

  const mapDomainKeys = ["genre", "craft", "process", "grammar", "mechanics"];
  const mapAreaGoals = {
    genre: "Choose and develop the form of writing that fits the task.",
    craft: "Organize and develop ideas with logical connections and deliberate style.",
    process: "Plan, revise, and make choices for a clear purpose and audience.",
    grammar: "Use sentence structures and grammatical forms that make meaning clear.",
    mechanics: "Edit capitalization, punctuation, and spelling so readers can follow easily."
  };

  function optionalRit(input) {
    const raw = String(input?.value || "").trim();
    return raw === "" ? null : Number(raw);
  }

  function collectLearningProfile() {
    if ($("[data-language]")?.value === "zh" || !$("[data-map-grade]")) return null;
    const grade = $("[data-map-grade]").value;
    const term = $("[data-map-term]").value;
    const overallRit = optionalRit($("[data-map-overall-rit]"));
    const requestedPriority = $("[data-map-priority]").value;
    const parentGoal = $("[data-map-goal]").value.trim().slice(0, 120);
    const areaRanges = {};
    mapDomainKeys.forEach((key) => {
      const low = optionalRit($(`[data-map-low="${key}"]`));
      const high = optionalRit($(`[data-map-high="${key}"]`));
      if (low !== null || high !== null) areaRanges[key] = { low, high };
    });
    const hasResult = overallRit !== null || Object.keys(areaRanges).length > 0;
    if (!grade && !term && !hasResult && !requestedPriority && !parentGoal) return null;
    const scoredAreas = Object.entries(areaRanges)
      .filter(([, range]) => range.low !== null && range.high !== null)
      .sort(([, first], [, second]) => ((first.low + first.high) / 2) - ((second.low + second.high) / 2));
    const priorityArea = requestedPriority || scoredAreas[0]?.[0] || "";
    const relativeStrengthArea = scoredAreas.length > 1 ? scoredAreas[scoredAreas.length - 1][0] : "";
    const nextAreas = [priorityArea, "process", "craft"].filter((key, index, list) => key && list.indexOf(key) === index).slice(0, 3);
    return {
      source: "parent-manual-entry",
      assessment: "MAP Growth",
      subject: "Language Usage",
      status: "MAP-informed; not an NWEA score estimate, certification, or endorsement",
      grade,
      term,
      overallRit,
      areaRanges,
      priorityArea,
      parentGoal,
      learningPlan: {
        evidenceNote: "Strength and focus are relative only to the instructional-area ranges entered by the family.",
        relativeStrengthArea,
        focusArea: priorityArea,
        nextThreeGoals: nextAreas.map((key) => ({ area: key, goal: mapAreaGoals[key] })),
        questionDifficulty: "Use the reported result as one readiness signal; adapt one step easier or harder from each response.",
        fourWeeks: [
          { week: 1, goal: "Create a baseline piece and notice one strength and one focus area." },
          { week: 2, goal: priorityArea ? mapAreaGoals[priorityArea] : "Practice one high-value writing skill in a short passage." },
          { week: 3, goal: "Revise one passage and explain why the revision improves clarity or effect." },
          { week: 4, goal: "Apply the skill independently in a new piece and reflect on the change." }
        ]
      },
      savedAt: new Date().toISOString()
    };
  }

  function recordLearningProgress(draft) {
    const profile = collectLearningProfile();
    if (!profile) return;
    let records = [];
    try { records = JSON.parse(localStorage.getItem("storieslens_learning_progress") || "[]"); }
    catch { records = []; }
    if (!Array.isArray(records)) records = [];
    records.push({
      recordedAt: new Date().toISOString(),
      event: "first-story-scene",
      grade: profile.grade,
      term: profile.term,
      focusArea: profile.priorityArea || "draft-evidence",
      answerCount: answers.filter(Boolean).length,
      characterCount: String(draft || "").length
    });
    localStorage.setItem("storieslens_learning_progress", JSON.stringify(records.slice(-50)));
  }

  function validateLearningProfile(profile) {
    if (!profile) return "";
    if (!profile.grade || !profile.term) {
      return locale === "zh" ? "使用学习档案时，请选择测试时年级和测试时间。" : "Choose the grade and test season to use the Learning Profile.";
    }
    const values = [profile.overallRit, ...Object.values(profile.areaRanges).flatMap((range) => [range.low, range.high])].filter((value) => value !== null);
    if (!values.length) {
      return locale === "zh" ? "请填写 Overall RIT，或至少一个能力领域的完整 RIT 区间。" : "Enter an Overall RIT or one complete instructional-area RIT range.";
    }
    if (values.some((value) => !Number.isInteger(value) || value < 100 || value > 350)) {
      return locale === "zh" ? "RIT 请输入 100–350 之间的整数。" : "Enter each RIT as a whole number from 100 to 350.";
    }
    for (const range of Object.values(profile.areaRanges)) {
      if (range.low === null || range.high === null) return locale === "zh" ? "每个能力领域需要同时填写最低和最高 RIT。" : "Enter both the low and high RIT for each instructional area you use.";
      if (range.low > range.high) return locale === "zh" ? "能力领域的最低 RIT 不能高于最高 RIT。" : "An instructional area’s low RIT cannot be higher than its high RIT.";
    }
    return "";
  }

  function restoreLearningProfile() {
    if ($("[data-language]")?.value === "zh" || !$("[data-map-grade]")) return;
    let profile = null;
    try { profile = JSON.parse(localStorage.getItem("storieslens_learning_profile") || "null"); }
    catch { localStorage.removeItem("storieslens_learning_profile"); }
    if (!profile || profile.source !== "parent-manual-entry") return;
    $("[data-map-grade]").value = String(profile.grade || "");
    $("[data-map-term]").value = String(profile.term || "");
    $("[data-map-overall-rit]").value = profile.overallRit ?? "";
    $("[data-map-priority]").value = mapDomainKeys.includes(profile.priorityArea) ? profile.priorityArea : "";
    $("[data-map-goal]").value = Array.from($("[data-map-goal]").options).some((option) => option.value === profile.parentGoal) ? profile.parentGoal : "";
    mapDomainKeys.forEach((key) => {
      const range = profile.areaRanges?.[key];
      $(`[data-map-low="${key}"]`).value = range?.low ?? "";
      $(`[data-map-high="${key}"]`).value = range?.high ?? "";
    });
    $("[data-learning-profile-status]").textContent = locale === "zh" ? "已载入本设备上的学习档案。" : "Learning Profile restored from this device.";
  }

  function deriveTitle(text) {
    const fallback = locale === "zh" ? "我的新故事" : "My New Story";
    return String(text || fallback).split(/[.!?。！？\n]/)[0].trim().slice(0, 64) || fallback;
  }

  function updateReadQuestionButton(isReading = false) {
    const button = $("[data-read-question]");
    if (!button) return;
    button.classList.toggle("is-reading", isReading);
    button.setAttribute("aria-pressed", String(isReading));
    const label = $("span", button);
    if (label) label.textContent = t(isReading ? "stop-reading" : "read-question");
  }

  function stopQuestionSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    questionUtterance = null;
    updateReadQuestionButton(false);
  }

  function preferredVoice(lang) {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.toLowerCase().split("-")[0];
    const languageVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
    const sageVoiceNames = prefix === "zh"
      ? [/yunxi/i, /yunjian/i, /yunyang/i, /kangkang/i, /yong/i, /li-mu/i, /male/i, /普通话.*男/i]
      : [/daniel/i, /alex/i, /aaron/i, /arthur/i, /fred/i, /reed/i, /eddy/i, /rocko/i, /evan/i, /lee/i, /rishi/i, /male/i];
    const sageVoice = languageVoices.find((voice) => sageVoiceNames.some((pattern) => pattern.test(`${voice.name} ${voice.voiceURI}`)));
    if (sageVoice) return sageVoice;
    const premiumVoice = languageVoices.find((voice) => /premium|enhanced|natural/i.test(`${voice.name} ${voice.voiceURI}`));
    if (premiumVoice) return premiumVoice;
    return languageVoices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase())
      || languageVoices[0]
      || null;
  }

  function speakCurrentQuestion(force = false) {
    const autoRead = $("[data-auto-read-question]")?.checked;
    if (!force && !autoRead) return;
    if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
      toast(locale === "zh" ? "当前浏览器不支持问题朗读。" : "Question read-aloud is unavailable in this browser.", true);
      return;
    }
    const question = $("[data-question]")?.textContent.trim();
    if (!question) return;
    stopQuestionSpeech();
    const lang = locale === "zh" ? "zh-CN" : "en-US";
    questionUtterance = new window.SpeechSynthesisUtterance(question);
    questionUtterance.lang = lang;
    questionUtterance.rate = locale === "zh" ? 0.8 : 0.86;
    questionUtterance.pitch = locale === "zh" ? 0.72 : 0.78;
    const voice = preferredVoice(lang);
    if (voice) questionUtterance.voice = voice;
    questionUtterance.onstart = () => updateReadQuestionButton(true);
    questionUtterance.onend = () => {
      questionUtterance = null;
      updateReadQuestionButton(false);
    };
    questionUtterance.onerror = () => {
      questionUtterance = null;
      updateReadQuestionButton(false);
    };
    window.speechSynthesis.speak(questionUtterance);
  }

  function formatAnswerSpeechTime(seconds) {
    const safeSeconds = Math.max(0, Math.min(answerSpeechMaxSeconds, Math.floor(seconds)));
    return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
  }

  function updateAnswerSpeechButton(isListening = false, elapsedSeconds = 0) {
    const button = $("[data-answer-speech]");
    if (!button) return;
    button.classList.toggle("is-listening", isListening);
    button.setAttribute("aria-pressed", String(isListening));
    const label = $("span", button);
    if (label) label.textContent = t(isListening ? "stop-answer-voice" : "answer-by-voice");
    const timer = $("[data-answer-speech-time]", button);
    if (timer) {
      timer.hidden = !isListening;
      timer.textContent = formatAnswerSpeechTime(elapsedSeconds);
    }
    button.setAttribute("aria-label", isListening
      ? `${t("listening")} ${formatAnswerSpeechTime(elapsedSeconds)}. ${t("stop-answer-voice")}`
      : t("answer-by-voice"));
  }

  function clearAnswerSpeechTimers() {
    window.clearInterval(answerSpeechTimer);
    window.clearTimeout(answerSpeechRestartTimer);
    window.clearTimeout(answerSpeechMaxTimer);
    answerSpeechTimer = 0;
    answerSpeechRestartTimer = 0;
    answerSpeechMaxTimer = 0;
  }

  function joinAnswerSpeech(...parts) {
    const separator = locale === "zh" ? "" : " ";
    return parts.map((part) => String(part || "").trim()).filter(Boolean).join(separator);
  }

  function stopAnswerSpeech(reason = "cancel") {
    const wasHolding = answerSpeechHolding;
    const duration = answerSpeechStartedAt ? Math.round((performance.now() - answerSpeechStartedAt) / 1000) : 0;
    answerSpeechHolding = false;
    answerSpeechPointerId = null;
    clearAnswerSpeechTimers();
    if (answerRecognition) {
      const activeRecognition = answerRecognition;
      answerRecognition = null;
      try { activeRecognition.stop(); } catch (_error) { /* Already stopped by the browser. */ }
    }
    updateAnswerSpeechButton(false);
    if (wasHolding && reason === "release") {
      window.StoriesLensAnalytics?.track("coach_voice_answer_completed", {
        question: questionIndex + 1,
        language: locale,
        durationSeconds: duration
      });
      if (!$('[data-answer]')?.value.trim()) {
        toast(locale === "zh" ? "还没有听到文字，请按住按钮再说一次。" : "I did not catch any words. Hold the button and try again.", true);
      }
    }
    if (reason === "limit") {
      toast(locale === "zh" ? "已到 90 秒，回答已保留，可以继续打字修改。" : "You reached 90 seconds. Your answer is saved here and can still be edited.");
    }
  }

  function startAnswerRecognitionCycle() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const field = $("[data-answer]");
    if (!SpeechRecognition || !field || !answerSpeechHolding) return;
    const activeRecognition = new SpeechRecognition();
    let cycleText = "";
    let canRestart = true;
    answerRecognition = activeRecognition;
    activeRecognition.lang = locale === "zh" ? "zh-CN" : "en-US";
    activeRecognition.interimResults = true;
    activeRecognition.continuous = true;
    activeRecognition.maxAlternatives = 1;
    activeRecognition.onresult = (event) => {
      const finalParts = [];
      const interimParts = [];
      Array.from(event.results).forEach((result) => {
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) finalParts.push(transcript);
        else interimParts.push(transcript);
      });
      cycleText = joinAnswerSpeech(finalParts.join(""), interimParts.join(""));
      field.value = joinAnswerSpeech(answerSpeechOriginal, answerSpeechCommitted, cycleText);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    };
    activeRecognition.onerror = (event) => {
      if (["not-allowed", "service-not-allowed", "audio-capture", "network"].includes(event.error)) {
        canRestart = false;
        answerSpeechHolding = false;
        clearAnswerSpeechTimers();
        updateAnswerSpeechButton(false);
        const message = event.error === "not-allowed" || event.error === "service-not-allowed"
          ? (locale === "zh" ? "请允许麦克风权限，或直接打字回答。" : "Please allow microphone access, or type your answer instead.")
          : (locale === "zh" ? "麦克风暂时无法使用，可以直接打字回答。" : "The microphone is unavailable right now. You can type instead.");
        toast(message, true);
      }
    };
    activeRecognition.onend = () => {
      if (cycleText) {
        answerSpeechCommitted = joinAnswerSpeech(answerSpeechCommitted, cycleText);
        field.value = joinAnswerSpeech(answerSpeechOriginal, answerSpeechCommitted);
        field.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (answerRecognition === activeRecognition) answerRecognition = null;
      if (answerSpeechHolding && canRestart) {
        answerSpeechRestartTimer = window.setTimeout(startAnswerRecognitionCycle, 160);
      } else if (!answerSpeechHolding) {
        updateAnswerSpeechButton(false);
      }
    };
    try { activeRecognition.start(); }
    catch (_error) {
      answerRecognition = null;
      if (answerSpeechHolding) answerSpeechRestartTimer = window.setTimeout(startAnswerRecognitionCycle, 220);
    }
  }

  function beginAnswerSpeech() {
    if (answerSpeechHolding) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      $("[data-answer]")?.focus();
      toast(locale === "zh" ? "当前浏览器不支持语音回答，可以直接打字。" : "Voice answers are unavailable in this browser. You can type instead.", true);
      return;
    }
    stopQuestionSpeech();
    answerSpeechHolding = true;
    answerSpeechStartedAt = performance.now();
    answerSpeechOriginal = $("[data-answer]")?.value.trim() || "";
    answerSpeechCommitted = "";
    updateAnswerSpeechButton(true, 0);
    answerSpeechTimer = window.setInterval(() => {
      updateAnswerSpeechButton(true, (performance.now() - answerSpeechStartedAt) / 1000);
    }, 250);
    answerSpeechMaxTimer = window.setTimeout(() => stopAnswerSpeech("limit"), answerSpeechMaxSeconds * 1000);
    startAnswerRecognitionCycle();
  }

  function renderQuestion() {
    stopAnswerSpeech();
    stopQuestionSpeech();
    $("[data-question-number]").textContent = String(questionIndex + 1);
    const chineseQuestions = {
      "ink-story": ["画面中最重要的人是谁？他此刻最想做什么？", "他现在遇到了什么困难或麻烦？", "请写下故事真正发生变化的第一个瞬间。"],
      comic: ["如果这是连环画第一格，我们最先看见谁在做什么？", "第二格出现了什么意外或阻碍？", "下一格里，人物会作出什么行动？"],
      picturebook: ["翻开第一页，读者最先看见谁和什么地方？", "这个人物心里藏着怎样的愿望？", "第一页结束前，发生了哪件让人想继续翻页的事？"],
      film: ["电影的第一个镜头里，观众看见什么？", "这个场景里最重要的动作或声音是什么？", "镜头结束时，什么已经和开始时不同？"]
    };
    const profile = collectChineseCreativeProfile();
    $("[data-question]").textContent = profile ? chineseQuestions[profile.format][questionIndex] : copy[locale].questions[questionIndex];
    $("[data-next-question] span").textContent = questionIndex === 2 ? t("see-page") : t("next-question");
    $("[data-answer]").value = answers[questionIndex] || "";
    $("[data-question-error]").textContent = "";
    window.setTimeout(() => {
      if (!$("[data-stage='coach']")?.hidden) speakCurrentQuestion(false);
    }, 120);
  }

  async function restoreHomepageSpark() {
    if (!["homepage-magic", "language-switch", "english-studio"].includes(params.get("from"))) return;
    let spark = null;
    try {
      spark = window.StoriesLensSparkHandoff
        ? await window.StoriesLensSparkHandoff.load()
        : JSON.parse(sessionStorage.getItem("storieslens_home_spark") || "null");
    } catch (_error) {
      spark = null;
    }
    if (!spark) return;
    if (["en", "zh"].includes(spark.storyLanguage)) {
      $(`[data-language]`).value = spark.storyLanguage;
      languageTouched = true;
    }
    if (spark.existingWriting && spark.seed) {
      existingWritingMode = true;
      existingWritingName = String(spark.existingWritingName || "").slice(0, 180);
      const existingWriting = $("[data-existing-writing]");
      if (existingWriting) existingWriting.value = String(spark.seed).slice(0, 7000);
      $("[data-existing-writing-panel]")?.removeAttribute("hidden");
      const importedName = $("[data-existing-writing-file-name]");
      if (importedName && existingWritingName) importedName.textContent = `${existingWritingName} · ${locale === "zh" ? "已在本机读取" : "read on this device"}`;
    } else if (spark.seed) {
      $("[data-seed]").value = String(spark.seed).slice(0, 1800);
    }
    if (spark.creatorName) $(`[data-creator-name]`).value = String(spark.creatorName).slice(0, 40);
    if (["adult", "under18"].includes(spark.ageGroup)) {
      $(`[data-age]`).value = spark.ageGroup;
      $(`[data-guardian-check]`).hidden = spark.ageGroup !== "under18";
    }
    if (spark.dataUrl && /^data:image\/(?:webp|png|jpeg);base64,/.test(spark.dataUrl)) {
      selectedArtworkData = spark.dataUrl;
      selectedArtwork = {
        name: String(spark.name || "Homepage creation").slice(0, 180),
        privateOnly: Boolean(spark.privateOnly),
        personalPhoto: Boolean(spark.personalPhoto)
      };
      const preview = $(`[data-artwork-preview]`);
      preview.src = selectedArtworkData;
      preview.hidden = false;
      $(`[data-upload-label]`).classList.add("has-image");
      $(`[data-upload-label]`).classList.add("is-carried-in");
      const uploadTitle = $(`[data-upload-label] strong`);
      const uploadHelp = $(`[data-upload-label] small`);
      if (uploadTitle) uploadTitle.textContent = locale === "zh" ? "已从首页带入这张图片" : "Your image is already here";
      if (uploadHelp) uploadHelp.textContent = locale === "zh" ? "轻点图片可以更换，不需要重新上传" : "Tap the image only if you want to replace it";
      $(`[data-coach-image]`).src = selectedArtworkData;
      $(`[data-coach-image]`).hidden = false;
      const personalPhotoConsent = $("[data-personal-photo-consent]");
      if (personalPhotoConsent) personalPhotoConsent.hidden = !selectedArtwork.personalPhoto;
    }
    if (existingWritingMode && storySeed()) {
      window.setTimeout(() => {
        if (window.StoriesLensSafety && !window.StoriesLensSafety.check(storySeed()).safe) {
          $("[data-form-message]").textContent = window.StoriesLensSafety.message;
          return;
        }
        answers = [];
        questionIndex = 0;
        beginMentorReview();
      }, 80);
    }
  }

  function saveLocalDraft(draft) {
    const language = $("[data-language]").value;
    const ageGroup = $("[data-age]").value;
    const seed = storySeed();
    const learningProfile = collectLearningProfile();
    const chineseCreativeProfile = collectChineseCreativeProfile();
    const dna = {
      source: existingWritingMode ? "existing-writing" : (selectedArtwork ? "work" : "tell"),
      inspiration: seed || (locale === "zh" ? "我上传的作品" : "My uploaded creation"),
      storyLanguage: language,
      memory: "character",
      change: answers[1] || answers[0] || "",
      shift: "rule",
      answers: answers.slice(),
      seed: existingWritingMode ? seed : answers.join(" "),
      learningProfile,
      chineseCreativeProfile,
      outputFormat: selectedOutputFormat || "book",
      createdAt: new Date().toISOString()
    };
    localStorage.setItem("storieslens_creator_setup", JSON.stringify({
      mode: "solo",
      origin: existingWritingMode ? "existing-writing" : (selectedArtwork ? "work" : "memory"),
      ageGroup,
      supervisionConfirmed: ageGroup !== "under18" || $("[data-adult-support]").checked,
      storyLanguage: language,
      displayName: creatorName(),
      seed,
      learningProfile,
      chineseCreativeProfile,
      outputFormat: selectedOutputFormat || "book",
      createdAt: new Date().toISOString()
    }));
    if (learningProfile) localStorage.setItem("storieslens_learning_profile", JSON.stringify(learningProfile));
    else localStorage.removeItem("storieslens_learning_profile");
    if (chineseCreativeProfile) localStorage.setItem("storieslens_chinese_creative_profile", JSON.stringify(chineseCreativeProfile));
    localStorage.setItem("storieslens_story_dna", JSON.stringify(dna));
    localStorage.setItem("storieslens_student_visual_write", JSON.stringify({
      mode: "free",
      savedAt: new Date().toISOString(),
      draft,
      storyTitle: $("[data-story-title]").value.trim(),
      creatorName: creatorName(),
      outputFormat: selectedOutputFormat || "book"
    }));
    persistStoryReferenceHandoff().catch(() => {});
    return dna;
  }

  async function persistStoryReferenceHandoff() {
    if (!window.StoriesLensSparkHandoff) return;
    if (!selectedArtworkData) {
      await window.StoriesLensSparkHandoff.clear();
      return;
    }
    await window.StoriesLensSparkHandoff.save({
      purpose: "story-reference",
      dataUrl: selectedArtworkData,
      mediaUrl: selectedArtwork?.mediaUrl || "",
      name: selectedArtwork?.name || "Story reference",
      personalPhoto: Boolean(selectedArtwork?.personalPhoto),
      personalPhotoConsentId: selectedArtwork?.personalPhotoConsentId || "",
      projectId: savedProjectId || "",
      createdAt: new Date().toISOString()
    });
  }

  async function persistApprovedArtwork() {
    if (workshopMode || !selectedArtworkData || selectedArtwork?.privateOnly || selectedArtwork?.mediaUrl) return null;
    if (artworkPersistencePromise) return artworkPersistencePromise;

    artworkPersistencePromise = (async () => {
      if (!savedProjectId) {
        const language = $(`[data-language]`).value;
        const result = await platform.api("/api/projects", {
          method: "POST",
          body: JSON.stringify({
            title: locale === "zh" ? "未命名故事" : "Untitled story",
            language,
            ageGroup: $(`[data-age]`).value,
            mode: "solo",
            visibility: "private",
            sourceType: "artwork",
            sourceText: "",
            draft: "",
            storyDna: { source: "work", createdAt: new Date().toISOString() },
            scenes: [],
            clientSnapshot: { from: "h5", privateArtworkDraft: true }
          })
        });
        savedProjectId = result.project.id;
        localStorage.setItem("storieslens_cloud_project_id", savedProjectId);
      }

      let personalPhotoConsentId = "";
      if (selectedArtwork?.personalPhoto) {
        const account = await platform.api("/api/auth/session");
        if (!account.authenticated || account.user?.kind !== "account") throw new Error("account_required_for_personal_photo");
        const confirmedAdult = Boolean($("[data-photo-consent-adult]")?.checked);
        const acknowledgedRegionalProcessing = Boolean($("[data-photo-consent-processing]")?.checked);
        const guardianName = $("[data-photo-guardian-name]")?.value.trim() || "";
        const relationship = $("[data-photo-guardian-relationship]")?.value.trim() || "";
        if (!confirmedAdult || !acknowledgedRegionalProcessing || !guardianName || !relationship) throw new Error("personal_photo_consent_required");
        if (!selectedArtwork.personalPhotoConsentId) {
          const consentResult = await platform.api(`/api/projects/${savedProjectId}/photo-consent`, {
            method: "POST",
            body: JSON.stringify({ confirmedAdult: true, approvedPrivateMedia: true, approvedPersonalPhoto: true, acknowledgedRegionalProcessing: true, guardianName, relationship })
          });
          selectedArtwork.personalPhotoConsentId = consentResult.consent.id;
        }
        personalPhotoConsentId = selectedArtwork.personalPhotoConsentId;
      }

      const mediaResult = await platform.api("/api/media", {
        method: "POST",
        body: JSON.stringify({ projectId: savedProjectId, dataUrl: selectedArtworkData, metadataRemoved: true, purpose: "artwork", personalPhotoConsentId })
      });
      selectedArtwork.mediaUrl = mediaResult.media.url;
      await platform.api(`/api/projects/${savedProjectId}`, {
        method: "PATCH",
        body: JSON.stringify({
          coverImageUrl: selectedArtwork.mediaUrl,
          clientSnapshot: { from: "h5", privateArtworkDraft: true, artworkStored: true }
        })
      });
      return mediaResult.media;
    })();

    try {
      return await artworkPersistencePromise;
    } finally {
      artworkPersistencePromise = null;
    }
  }

  async function saveProject(draft) {
    const status = $("[data-save-status]");
    status.textContent = t("saving");
    const dna = saveLocalDraft(draft);
    const language = $("[data-language]").value;
    const ageGroup = $("[data-age]").value;
    const learningProfile = collectLearningProfile();
    const chineseCreativeProfile = collectChineseCreativeProfile();
    const title = $("[data-story-title]").value.trim();
    if (workshopMode) {
      status.textContent = "工作坊模式：作品只保存在这台设备，不上传云端。";
      window.StoriesLensAnalytics?.track("first_story_page_saved", { language, hasArtwork: Boolean(selectedArtwork), cloud: false, workshop: "cn" });
      return;
    }
    try {
      if (artworkPersistencePromise) await artworkPersistencePromise;
      const projectBody = {
          title,
          language,
          ageGroup,
          mode: "solo",
          visibility: "private",
          sourceType: selectedArtwork ? "artwork" : "text",
          sourceText: storySeed(),
          draft,
          storyDna: dna,
          scenes: [{ id: "scene-1", title, text: draft, caption: draft.slice(0, 500), imageUrl: selectedArtwork?.mediaUrl || "", duration: 6 }],
          coverImageUrl: selectedArtwork?.mediaUrl || "",
          clientSnapshot: {
            from: "h5",
            firstPageCreated: true,
            mentorRevisionCompleted,
            readingConfirmed: mentorReadingConfirmed,
            learningProfile,
            chineseCreativeProfile,
            outputFormat: selectedOutputFormat || "book"
          }
      };
      const result = await platform.api(savedProjectId ? `/api/projects/${savedProjectId}` : "/api/projects", {
        method: savedProjectId ? "PATCH" : "POST",
        body: JSON.stringify(projectBody)
      });
      savedProjectId = result.project.id;
      localStorage.setItem("storieslens_cloud_project_id", savedProjectId);
      if (selectedArtworkData && !selectedArtwork?.privateOnly && !selectedArtwork?.mediaUrl) {
        await persistApprovedArtwork();
        await platform.api(`/api/projects/${savedProjectId}`, {
          method: "PATCH",
          body: JSON.stringify({
            coverImageUrl: selectedArtwork.mediaUrl,
            scenes: [{ id: "scene-1", title, text: draft, caption: draft.slice(0, 500), imageUrl: selectedArtwork.mediaUrl, duration: 6 }]
          })
        });
      }
      if (mentorRevisionCompleted && mentorReadingConfirmed) {
        try {
          const gift = await platform.api("/api/credits/unlock-learning-gift", {
            method: "POST",
            body: JSON.stringify({ projectId: savedProjectId })
          });
          if (gift.unlocked) toast(locale === "zh" ? "完成修改与朗读确认，第二张免费插图已解锁！" : "Revision and reading confirmed—your second free illustration is unlocked!");
        } catch (_error) { /* Gift status can refresh later without blocking the saved story. */ }
      }
      status.textContent = selectedArtwork?.privateOnly
        ? (locale === "zh" ? "故事已保存；这张图片按安全规则只留在本机。" : "Story saved; this image remains on this device under the safety policy.")
        : t("saved-cloud");
      window.StoriesLensAnalytics?.track("first_story_page_saved", { language, hasArtwork: Boolean(selectedArtwork), cloud: true });
    } catch (_error) {
      status.textContent = t("saved-device");
      window.StoriesLensAnalytics?.track("first_story_page_saved", { language, hasArtwork: Boolean(selectedArtwork), cloud: false });
    }
  }

  function stopMentorSpeech() {
    if (mentorUtterance && "speechSynthesis" in window) window.speechSynthesis.cancel();
    mentorUtterance = null;
    $("[data-mentor-arrival]")?.classList.remove("is-speaking");
    $("[data-revision-read]")?.classList.remove("is-reading");
  }

  function speakMentorText(text, source = "mentor") {
    if (!text || !("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") return;
    stopMentorSpeech();
    const lang = locale === "zh" ? "zh-CN" : "en-US";
    mentorUtterance = new window.SpeechSynthesisUtterance(text);
    mentorUtterance.lang = lang;
    mentorUtterance.rate = locale === "zh" ? 0.8 : 0.86;
    mentorUtterance.pitch = locale === "zh" ? 0.72 : 0.78;
    mentorUtterance.volume = 1;
    const voice = preferredVoice(lang);
    if (voice) mentorUtterance.voice = voice;
    mentorUtterance.onstart = () => {
      if (source === "arrival") $("[data-mentor-arrival]")?.classList.add("is-speaking");
      if (source === "rehearsal") $("[data-revision-read]")?.classList.add("is-reading");
    };
    mentorUtterance.onend = mentorUtterance.onerror = () => stopMentorSpeech();
    window.speechSynthesis.speak(mentorUtterance);
  }

  function fallbackMentorResult(item) {
    const checked = window.StoriesLensMentorRevision.basicCheck(item.original, locale);
    if (locale === "zh") return { suggestion: checked.suggestion, strength: "你已经写出了一个完整、可以继续发展的想法。", priority: checked.changed ? "先让开头、空格和句末标点更清楚。" : "这一句的基本书写已经清楚，先保留你的原意。", microLesson: "标点像朗读时的呼吸。先把一句话读完，再决定在哪里停下来。", question: "这是你原来想表达的意思吗？", source: "on-device" };
    return { suggestion: checked.suggestion, strength: "You have expressed one complete idea that the story can build on.", priority: checked.changed ? "Start with a capital letter and give the sentence a clear ending." : "The sentence is already clear, so keep your meaning and voice.", microLesson: "Punctuation shows a reader where your voice begins, pauses, and finishes.", question: "Is this what you mean?", source: "on-device" };
  }

  function renderMentorResult(item, result) {
    item.suggestion = String(result.suggestion || item.original).trim() || item.original;
    item.strength = String(result.strength || fallbackMentorResult(item).strength).trim();
    item.priority = String(result.priority || fallbackMentorResult(item).priority).trim();
    item.microLesson = String(result.microLesson || result.reply || fallbackMentorResult(item).microLesson).trim();
    item.question = String(result.question || fallbackMentorResult(item).question).trim();
    item.source = result.source || "yu-live";
    $("[data-revision-strength]").textContent = item.strength;
    $("[data-revision-priority]").textContent = item.priority;
    $("[data-revision-lesson]").textContent = item.microLesson;
    $("[data-revision-suggestion]").value = item.suggestion;
    $("[data-revision-suggestion]").disabled = false;
    $("[data-revision-question]").textContent = item.question;
    $("[data-revision-loading]").hidden = true;
    $("[data-revision-feedback]").hidden = false;
    $("[data-revision-actions]").hidden = false;
  }

  async function loadMentorRevisionItem() {
    const item = mentorRevisionItems[mentorRevisionIndex];
    if (!item) return;
    const requestedIndex = mentorRevisionIndex;
    $("[data-revision-number]").textContent = String(mentorRevisionIndex + 1);
    $("[data-revision-total]").textContent = String(mentorRevisionItems.length);
    $("[data-revision-original]").textContent = item.original;
    $("[data-revision-suggestion]").value = item.original;
    $("[data-revision-suggestion]").disabled = true;
    $("[data-revision-loading]").hidden = false;
    $("[data-revision-feedback]").hidden = true;
    $("[data-revision-actions]").hidden = true;
    $("[data-revision-rehearsal]").hidden = true;
    $("[data-revision-error]").textContent = "";
    const learningProfile = collectLearningProfile();
    const chineseProfile = collectChineseCreativeProfile();
    const priorityArea = learningProfile?.priorityArea || "";
    const priorityRange = learningProfile?.areaRanges?.[priorityArea] || {};
    const numericGrade = Number(learningProfile?.grade);
    const creatorLevel = $(`[data-age]`).value === "under18" && (!Number.isFinite(numericGrade) || numericGrade <= 2) ? "expression" : "developing";
    try {
      const response = await platform.api("/api/writing-assistant", { method: "POST", body: JSON.stringify({ mode: "solo", action: "check", storyLanguage: $(`[data-language]`).value, studentDraft: mentorRevisionItems.map((entry) => entry.original).join("\n"), selectedText: item.original, revisionHistory: mentorRevisionItems.slice(0, mentorRevisionIndex).map((entry) => entry.accepted).filter(Boolean).join("\n"), inspiration: storySeed(), grade: learningProfile?.grade || ($(`[data-age]`).value === "under18" ? "3" : undefined), skillFocus: priorityArea || "grammar and narrative revision", learningGoal: learningProfile?.parentGoal || "", mapRitScore: learningProfile?.overallRit, mapRitLow: priorityRange.low, mapRitHigh: priorityRange.high, mapInstructionalArea: priorityArea, creatorLevel, coachLens: chineseProfile?.coachLens || "foundation", genre: chineseProfile?.format === "film" ? "screenplay" : "story" }) });
      if (requestedIndex !== mentorRevisionIndex) return;
      const result = response.result || {};
      if (result.authorshipCheck !== "pass") result.suggestion = item.original;
      renderMentorResult(item, { ...result, source: "yu-live" });
    } catch (_error) {
      if (requestedIndex !== mentorRevisionIndex) return;
      renderMentorResult(item, fallbackMentorResult(item));
      $("[data-revision-error]").textContent = locale === "zh" ? "当前使用本机基础检查；联网后羽大师会加入更完整的语法与写作指导。" : "Using the basic on-device check. Yu’s fuller grammar and writing guidance returns when the live coach is available.";
    }
  }

  function beginMentorReview() {
    const revision = window.StoriesLensMentorRevision;
    if (!revision) { buildFirstPage(); return; }
    mentorRevisionItems = revision.buildItems(
      existingWritingMode ? [storySeed()] : [storySeed(), ...answers],
      locale,
      existingWritingMode ? 80 : undefined
    );
    if (!mentorRevisionItems.length) { buildFirstPage(); return; }
    mentorRevisionIndex = 0;
    mentorReviewedDraft = "";
    if ($("[data-setting-preview]")) $("[data-setting-preview]").textContent = t("setting-build-empty");
    showStage("mentor-review");
    const arrival = $("[data-mentor-arrival]");
    arrival?.classList.remove("is-arriving");
    window.requestAnimationFrame(() => arrival?.classList.add("is-arriving"));
    window.setTimeout(() => speakMentorText(t("mentor-spoken-intro"), "arrival"), 520);
    window.StoriesLensAnalytics?.track("mentor_revision_started", { language: locale, sentenceCount: mentorRevisionItems.length, mode: "solo" });
    void loadMentorRevisionItem();
  }

  function assembleMentorDraft() {
    const sentenceJoiner = locale === "zh" ? "" : " ";
    return mentorRevisionItems.map((item) => item.accepted || item.suggestion || item.original).filter(Boolean).join(sentenceJoiner);
  }

  function updateSettingPreview() {
    const accepted = mentorRevisionItems.filter((item) => item.accepted).map((item) => item.accepted);
    const preview = $("[data-setting-preview]");
    if (preview) preview.textContent = accepted.length ? accepted.join(locale === "zh" ? "" : " ") : t("setting-build-empty");
  }

  function showStoryPathStage() {
    const setting = mentorReviewedDraft || assembleMentorDraft();
    $("[data-path-setting]").textContent = setting;
    selectedOutputFormat = "";
    $$('[name="story-output"]').forEach((input) => { input.checked = false; });
    const confirm = $("[data-confirm-story-path]");
    if (confirm) confirm.disabled = true;
    $("[data-chinese-book-style]")?.setAttribute("hidden", "");
    showStage("story-path");
    window.StoriesLensAnalytics?.track("story_form_choice_shown", { language: locale, mode: "solo" });
  }

  function finishMentorReview() {
    mentorReviewedDraft = assembleMentorDraft();
    mentorRevisionCompleted = true;
    stopMentorSpeech();
    window.StoriesLensAnalytics?.track("mentor_revision_completed", { language: locale, sentenceCount: mentorRevisionItems.length, mode: "solo" });
    showStoryPathStage();
  }

  function buildFirstPage(reviewedDraft = "") {
    const seed = storySeed();
    const creatorWords = [seed, ...answers].map((item) => String(item || "").trim()).filter(Boolean);
    const draft = String(reviewedDraft || "").trim() || creatorWords.join("\n\n");
    const title = deriveTitle(seed || answers[0]);
    $("[data-story-title]").value = title;
    $("[data-story-draft]").value = draft;
    $("[data-result-author]").textContent = creatorName();
    const image = $("[data-result-image]");
    image.hidden = !selectedArtworkData;
    if (selectedArtworkData) image.src = selectedArtworkData;
    $("[data-story-page]").classList.toggle("no-artwork", !selectedArtworkData);
    const profile = collectChineseCreativeProfile();
    const continueParams = { mode: "free", from: "h5", storyLang: $("[data-language]").value, output: selectedOutputFormat || "book" };
    if (profile?.comicTemplate) continueParams.comicTemplate = profile.comicTemplate;
    $("[data-continue]").href = `visual-write.html?${new URLSearchParams(continueParams)}`;
    const formatNote = $("[data-result-format-note]");
    if (formatNote) {
      const template = comicTemplates[profile?.comicTemplate];
      formatNote.hidden = !template;
      if (template) formatNote.textContent = `已选择：${template.name} · ${template.description}。继续创作后可以逐页确认画面、旁白与对白。`;
    }
    showStage("result");
    window.StoriesLensAnalytics?.track("first_story_page_created", {
      language: $("[data-language]").value,
      hasArtwork: Boolean(selectedArtwork),
      answerCount: answers.length
    });
    recordLearningProgress(draft);
    saveProject(draft);
  }

  async function processArtwork(file) {
    if (!window.StoriesLensArtworkSafety?.isSupportedImage(file) || file.size > 15 * 1024 * 1024) {
      toast(locale === "zh" ? "请选择不超过 15MB 的 JPG、PNG、WEBP、HEIC 或 HEIF 图片。" : "Choose a JPG, PNG, WEBP, HEIC or HEIF image under 15 MB.", true);
      return;
    }
    try {
      toast(locale === "zh" ? "正在删除位置与设备信息并进行安全检查……" : "Removing location and device information, then checking safety…");
      const safeArtwork = await window.StoriesLensArtworkSafety.processArtwork(file);
      selectedArtworkData = safeArtwork.dataUrl;
      selectedArtwork = { name: file.name, privateOnly: false, personalPhoto: Boolean(safeArtwork.review?.checks?.realPerson), convertedFromHeic: Boolean(safeArtwork.convertedFromHeic) };
    } catch (error) {
      const reasonCode = error.reasonCode || error.message;
      if (reasonCode === "review_unavailable" && window.StoriesLensArtworkSafety?.removeMetadata) {
        const localArtwork = await window.StoriesLensArtworkSafety.removeMetadata(file);
        selectedArtworkData = localArtwork.dataUrl;
        selectedArtwork = { name: file.name, privateOnly: true, personalPhoto: false, convertedFromHeic: Boolean(localArtwork.convertedFromHeic) };
        toast(locale === "zh" ? "安全检查暂时不可用，已进入仅本机私密模式；图片不会公开。" : "Safety review is temporarily unavailable. Device-only private mode is on.");
      } else {
        selectedArtworkData = "";
        selectedArtwork = null;
        const reasonMessages = {
          identity_document: locale === "zh" ? "照片中可能包含身份证件，请换一张普通人像照片。" : "The photo may contain an identity document. Choose an ordinary portrait instead.",
          school_information: locale === "zh" ? "照片中可能包含学校名称或校徽，请裁剪后重试。" : "The photo may show a school name or logo. Crop it and try again.",
          contact_information: locale === "zh" ? "照片中可能包含联系方式、地址或二维码，请裁剪后重试。" : "The photo may contain contact details, an address, or a QR code. Crop it and try again.",
          unsafe_content: locale === "zh" ? "照片可能包含不适合儿童平台的色情、血腥暴力或其他危险内容。" : "The photo may contain sexual, graphic, violent, or other content unsuitable for a children’s platform.",
          uncertain: locale === "zh" ? "系统暂时无法确认这张照片是否安全，请换一张光线清楚、无遮挡的人像。" : "The system could not confirm this photo is safe. Try a clear, unobstructed portrait.",
          invalid_image: locale === "zh" ? "图片无法读取，请改用 JPG、PNG、WEBP、HEIC 或 HEIF。" : "The image could not be read. Try JPG, PNG, WEBP, HEIC, or HEIF."
        };
        toast(reasonMessages[reasonCode] || (locale === "zh" ? "图片未通过安全检查，请换一张普通、清晰、无隐私信息的人像。" : "The image did not pass the safety check. Choose a clear portrait without private information."), true);
        return;
      }
    }
    const preview = $("[data-artwork-preview]");
    preview.src = selectedArtworkData;
    preview.hidden = false;
    $("[data-upload-label]").classList.add("has-image");
    $("[data-coach-image]").src = selectedArtworkData;
    $("[data-coach-image]").hidden = false;
    const personalPhotoConsent = $("[data-personal-photo-consent]");
    if (personalPhotoConsent) personalPhotoConsent.hidden = !selectedArtwork.personalPhoto;
    if (selectedArtwork.convertedFromHeic) toast(locale === "zh" ? "HEIC 已在本机安全转换，原始照片不会上传。" : "HEIC converted safely on this device. The original photo is not uploaded.");
    if (!selectedArtwork.privateOnly && !workshopMode && !selectedArtwork.personalPhoto) {
      try {
        toast(selectedArtwork.personalPhoto
          ? (locale === "zh" ? "真人照片安全检查通过，正在保存到你的私密作品库……" : "Personal photo safety check passed. Saving to your private library…")
          : (locale === "zh" ? "安全检查通过，正在保存到你的私密作品库……" : "Safety check passed. Saving to your private library…"));
        await persistApprovedArtwork();
        toast(locale === "zh" ? "已私密保存，可以继续回答羽导师的问题。" : "Saved privately. Continue with Yu’s questions.");
      } catch (error) {
        toast(locale === "zh" ? "图片已在本机准备好，但云端保存暂时失败，请稍后重试。" : "The image is ready on this device, but private cloud saving is temporarily unavailable. Try again shortly.", true);
      }
    }
    if (selectedArtwork.personalPhoto && !workshopMode) {
      toast(locale === "zh" ? "真人照片已在本机准备好。完成下方成年人确认并登录账户后，才会保存到私密作品库。" : "Your personal photo is ready on this device. Complete the adult confirmation and sign in before it is saved privately.");
    }
    window.StoriesLensAnalytics?.track("family_artwork_ready", { privateOnly: Boolean(selectedArtwork.privateOnly), convertedFromHeic: Boolean(selectedArtwork.convertedFromHeic) });
  }

  $("[data-create-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const message = $("[data-form-message]");
    const seed = storySeed();
    const ageGroup = $("[data-age]").value;
    const learningProfile = collectLearningProfile();
    const chineseCreativeProfile = collectChineseCreativeProfile();
    const learningProfileError = validateLearningProfile(learningProfile);
    if (!selectedArtwork && !seed) {
      message.textContent = locale === "zh" ? "请上传一份作品，或者先写下一句话。" : "Upload one creation or begin with one sentence.";
      return;
    }
    if (!$("[data-creator-name]").value.trim() && !existingWritingMode) {
      message.textContent = locale === "zh" ? "请填写要印在故事上的姓名或昵称。" : "Add the creator name or nickname to print on the story.";
      $("[data-creator-name]").focus();
      return;
    }
    if (ageGroup === "under18" && !$("[data-adult-support]").checked) {
      message.textContent = locale === "zh" ? "需要成年人确认支持后才能继续。" : "An adult must confirm support before continuing.";
      return;
    }
    if (selectedArtwork?.personalPhoto) {
      const confirmedAdult = Boolean($("[data-photo-consent-adult]")?.checked);
      const acknowledgedRegionalProcessing = Boolean($("[data-photo-consent-processing]")?.checked);
      const guardianName = $("[data-photo-guardian-name]")?.value.trim();
      const relationship = $("[data-photo-guardian-relationship]")?.value.trim();
      if (!confirmedAdult || !acknowledgedRegionalProcessing || !guardianName || !relationship) {
        message.textContent = locale === "zh" ? "使用真人照片前，请完成成年人许可、区域云端处理确认、姓名与关系填写。" : "Before using a personal photo, confirm adult permission, regional cloud processing, name and relationship.";
        $("[data-personal-photo-consent]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    if (learningProfileError) {
      if ($("[data-learning-profile]")) $("[data-learning-profile]").open = true;
      if ($("[data-learning-profile-status]")) $("[data-learning-profile-status]").textContent = learningProfileError;
      message.textContent = learningProfileError;
      return;
    }
    if (selectedArtwork?.personalPhoto && !workshopMode) {
      persistApprovedArtwork().catch(() => {
        toast(locale === "zh" ? "真人照片已用于本次创作，但私密保存暂时失败；请登录账户后重试。" : "The personal photo is ready for this story, but private saving did not complete. Sign in and try again.", true);
      });
    }
    if (window.StoriesLensSafety && seed && !window.StoriesLensSafety.check(seed).safe) {
      message.textContent = window.StoriesLensSafety.message;
      return;
    }
    message.textContent = "";
    if (learningProfile) localStorage.setItem("storieslens_learning_profile", JSON.stringify(learningProfile));
    else localStorage.removeItem("storieslens_learning_profile");
    if (chineseCreativeProfile) localStorage.setItem("storieslens_chinese_creative_profile", JSON.stringify(chineseCreativeProfile));
    if ($("[data-learning-profile-status]")) {
      $("[data-learning-profile-status]").textContent = learningProfile
        ? (locale === "zh" ? "学习档案已准备好，将用于调整羽导师的指导。" : "Learning Profile ready. Yu will adapt the guidance.")
        : "";
    }
    answers = [];
    questionIndex = 0;
    if (existingWritingMode) {
      beginMentorReview();
      window.StoriesLensAnalytics?.track("existing_writing_revision_started", {
        language: $("[data-language]").value,
        source: existingWritingName ? "file" : "paste",
        ageGroup
      });
      return;
    }
    $("[data-coach-seed]").textContent = seed || (locale === "zh" ? "我上传的这份作品" : "My uploaded creation");
    renderQuestion();
    showStage("coach");
    window.StoriesLensAnalytics?.track("family_three_questions_started", {
      language: $("[data-language]").value,
      hasArtwork: Boolean(selectedArtwork),
      ageGroup
    });
  });

  $("[data-next-question]").addEventListener("click", () => {
    const answer = $("[data-answer]").value.trim();
    if (!answer) {
      $("[data-question-error]").textContent = locale === "zh" ? "先用自己的话回答这个问题。" : "Answer this question in your own words first.";
      return;
    }
    if (window.StoriesLensSafety && !window.StoriesLensSafety.check(answer).safe) {
      $("[data-question-error]").textContent = window.StoriesLensSafety.message;
      return;
    }
    answers[questionIndex] = answer;
    window.StoriesLensAnalytics?.track("coach_question_answered", { question: questionIndex + 1, language: $("[data-language]").value });
    if (questionIndex === 2) {
      beginMentorReview();
      return;
    }
    questionIndex += 1;
    renderQuestion();
    $("[data-answer]").focus();
  });

  $("[data-read-question]")?.addEventListener("click", () => {
    if (questionUtterance || ("speechSynthesis" in window && window.speechSynthesis.speaking)) stopQuestionSpeech();
    else speakCurrentQuestion(true);
  });
  $("[data-auto-read-question]")?.addEventListener("change", (event) => {
    const enabled = event.currentTarget.checked;
    localStorage.setItem("storieslens_auto_read_questions", enabled ? "1" : "0");
    if (enabled) speakCurrentQuestion(true);
    else stopQuestionSpeech();
    window.StoriesLensAnalytics?.track("coach_question_auto_read_changed", { enabled, language: locale });
  });
  const answerSpeechButton = $("[data-answer-speech]");
  answerSpeechButton?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    answerSpeechPointerId = event.pointerId;
    try { answerSpeechButton.setPointerCapture(event.pointerId); } catch (_error) { /* Pointer capture is optional. */ }
    beginAnswerSpeech();
  });
  answerSpeechButton?.addEventListener("pointerup", (event) => {
    if (answerSpeechPointerId !== null && event.pointerId !== answerSpeechPointerId) return;
    event.preventDefault();
    stopAnswerSpeech("release");
  });
  answerSpeechButton?.addEventListener("pointercancel", () => stopAnswerSpeech("release"));
  answerSpeechButton?.addEventListener("keydown", (event) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      beginAnswerSpeech();
    }
  });
  answerSpeechButton?.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      stopAnswerSpeech("release");
    }
  });
  answerSpeechButton?.addEventListener("contextmenu", (event) => event.preventDefault());
  answerSpeechButton?.addEventListener("click", (event) => event.preventDefault());

  $("[data-revision-edit]")?.addEventListener("click", () => {
    const field = $("[data-revision-suggestion]");
    field.disabled = false;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    $("[data-revision-error]").textContent = locale === "zh"
      ? "请改成你真正想说的话，再点击确认。"
      : "Change it into the words you really mean, then confirm.";
  });
  $("[data-revision-confirm]")?.addEventListener("click", () => {
    const item = mentorRevisionItems[mentorRevisionIndex];
    const accepted = $("[data-revision-suggestion]").value.trim();
    if (!item || !accepted) {
      $("[data-revision-error]").textContent = locale === "zh" ? "先保留或写下一句话。" : "Keep or write one sentence first.";
      return;
    }
    if (window.StoriesLensSafety && !window.StoriesLensSafety.check(accepted).safe) {
      $("[data-revision-error]").textContent = window.StoriesLensSafety.message;
      return;
    }
    item.accepted = accepted;
    updateSettingPreview();
    $("[data-revision-suggestion]").disabled = true;
    $("[data-revision-actions]").hidden = true;
    $("[data-revision-approved]").textContent = accepted;
    $("[data-revision-rehearsal]").hidden = false;
    $("[data-revision-error]").textContent = "";
    speakMentorText(accepted, "rehearsal");
    window.StoriesLensAnalytics?.track("mentor_sentence_confirmed", {
      language: locale,
      sentence: mentorRevisionIndex + 1,
      changed: accepted !== item.original,
      source: item.source
    });
  });
  $("[data-revision-read]")?.addEventListener("click", () => {
    const text = mentorRevisionItems[mentorRevisionIndex]?.accepted || $("[data-revision-suggestion]").value.trim();
    if (mentorUtterance || ("speechSynthesis" in window && window.speechSynthesis.speaking)) stopMentorSpeech();
    else speakMentorText(text, "rehearsal");
  });
  $("[data-revision-next]")?.addEventListener("click", () => {
    const item = mentorRevisionItems[mentorRevisionIndex];
    if (!item?.accepted) return;
    mentorReadingConfirmed = true;
    stopMentorSpeech();
    if (mentorRevisionIndex >= mentorRevisionItems.length - 1) {
      finishMentorReview();
      return;
    }
    mentorRevisionIndex += 1;
    void loadMentorRevisionItem();
  });

  $$('[name="story-output"]').forEach((input) => input.addEventListener("change", (event) => {
    selectedOutputFormat = event.currentTarget.value;
    const bookStyle = $("[data-chinese-book-style]");
    if (bookStyle) bookStyle.hidden = selectedOutputFormat !== "book";
    const confirm = $("[data-confirm-story-path]");
    if (confirm) confirm.disabled = false;
    $("[data-story-path-error]").textContent = "";
    window.StoriesLensAnalytics?.track("story_form_selected", { language: locale, output: selectedOutputFormat, mode: "solo" });
  }));
  $("[data-confirm-story-path]")?.addEventListener("click", () => {
    if (!selectedOutputFormat) {
      $("[data-story-path-error]").textContent = locale === "zh" ? "先选择插画故事书或故事电影。" : "Choose an illustrated book or story film first.";
      return;
    }
    localStorage.setItem("storieslens_story_output", selectedOutputFormat);
    const chineseProfile = collectChineseCreativeProfile();
    if (chineseProfile?.format === "comic" && $("[data-stage='comic-template']")) showComicTemplateStage();
    else buildFirstPage(mentorReviewedDraft);
  });

  $$('[name="comic-template"]').forEach((input) => input.addEventListener("change", (event) => {
    selectedComicTemplate = event.currentTarget.value;
    window.StoriesLensAnalytics?.track("comic_template_selected", { template: selectedComicTemplate });
  }));
  $("[data-confirm-comic-template]")?.addEventListener("click", () => {
    selectedComicTemplate = $("[name='comic-template']:checked")?.value || recommendComicTemplate();
    buildFirstPage(mentorReviewedDraft);
  });
  $("[data-comic-template-back]")?.addEventListener("click", () => {
    questionIndex = 2;
    renderQuestion();
    showStage("coach");
    $("[data-answer]").focus();
  });

  $("[data-story-draft]").addEventListener("input", () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveLocalDraft($("[data-story-draft]").value.trim());
      $("[data-save-status]").textContent = t("saved-device");
    }, 450);
  });

  $("[data-story-title]").addEventListener("input", () => saveLocalDraft($("[data-story-draft]").value.trim()));
  $("[data-continue]").addEventListener("click", async (event) => {
    event.preventDefault();
    saveLocalDraft($("[data-story-draft]").value.trim());
    try { await persistStoryReferenceHandoff(); } catch (_error) { /* The saved private project remains available. */ }
    location.href = event.currentTarget.href;
  });
  $("[data-checkout]").addEventListener("click", () => {
    saveLocalDraft($("[data-story-draft]").value.trim());
    window.StoriesLensAnalytics?.track("first_story_page_checkout_clicked", { offer: "story-pass", projectId: savedProjectId || "local" });
  });
  $("[data-start-over]").addEventListener("click", () => location.reload());

  $("[data-age]").addEventListener("change", (event) => {
    $("[data-guardian-check]").hidden = event.currentTarget.value !== "under18";
  });

  $("[data-language]").addEventListener("change", () => {
    languageTouched = true;
    if (forcedLocale !== "zh" && $("[data-language]").value === "zh") {
      try {
        sessionStorage.setItem("storieslens_home_spark", JSON.stringify({
          dataUrl: selectedArtworkData,
          name: selectedArtwork?.name || "",
          privateOnly: Boolean(selectedArtwork?.privateOnly),
          personalPhoto: Boolean(selectedArtwork?.personalPhoto),
          seed: storySeed(),
          creatorName: $("[data-creator-name]").value.trim(),
          ageGroup: $("[data-age]").value,
          storyLanguage: "zh",
          createdAt: new Date().toISOString()
        }));
      } catch (_error) {
        // The Chinese studio still opens even when a large local image cannot be carried forward.
      }
      location.href = "chinese-studio.html?from=language-switch";
    }
  });
  $("[data-chinese-studio-switch]")?.addEventListener("click", (event) => {
    event.preventDefault();
    try {
      sessionStorage.setItem("storieslens_home_spark", JSON.stringify({
        dataUrl: selectedArtworkData,
        name: selectedArtwork?.name || "",
        privateOnly: Boolean(selectedArtwork?.privateOnly),
        personalPhoto: Boolean(selectedArtwork?.personalPhoto),
        seed: storySeed(),
        creatorName: $("[data-creator-name]").value.trim(),
        ageGroup: $("[data-age]").value,
        storyLanguage: "zh",
        createdAt: new Date().toISOString()
      }));
    } catch (_error) {
      // The destination remains available even if a large local image cannot be carried forward.
    }
    location.href = event.currentTarget.href;
  });
  $$('[data-locale]').forEach((button) => button.addEventListener("click", () => applyLocale(button.dataset.locale)));
  $("[data-artwork]").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await processArtwork(file);
  });

  const existingWritingEntry = $("[data-existing-writing-entry]");
  const existingWritingPanel = $("[data-existing-writing-panel]");
  const existingWritingField = $("[data-existing-writing]");
  const existingWritingFile = $("[data-existing-writing-file]");
  const existingWritingFileName = $("[data-existing-writing-file-name]");
  const openExistingWriting = () => {
    existingWritingMode = true;
    existingWritingPanel?.removeAttribute("hidden");
    existingWritingField?.focus();
    existingWritingPanel?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.StoriesLensAnalytics?.track("existing_writing_entry_opened", { language: $("[data-language]").value });
  };
  existingWritingEntry?.addEventListener("click", openExistingWriting);
  existingWritingField?.addEventListener("input", () => { existingWritingMode = true; });
  existingWritingFile?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = await window.StoriesLensWritingImport?.importFile(file);
      if (!imported?.text) throw new Error("empty_file");
      existingWritingMode = true;
      existingWritingName = String(file.name || "").slice(0, 180);
      existingWritingField.value = imported.text.slice(0, 7000);
      existingWritingFileName.textContent = imported.kind === "photo"
        ? `${existingWritingName} · ${locale === "zh" ? "文字已识别，请先核对" : "text extracted—please check it"}`
        : `${existingWritingName} · ${locale === "zh" ? "已在本机读取" : "read on this device"}`;
      toast(imported.kind === "photo"
        ? (locale === "zh" ? "作文照片已识别。请先核对文字，再开始让羽大师逐句修改。" : "Your writing photo was transcribed. Check the text, then begin Yu’s sentence-by-sentence revision.")
        : (locale === "zh" ? "作文已准备好。点击下方按钮，羽大师会开始逐句修改。" : "Your writing is ready. Use the button below to begin Yu’s sentence-by-sentence revision."));
    } catch (error) {
      const privateInfo = error?.reasonCode === "personal_information" || error?.reasonCode === "personal_name" || error?.reasonCode === "school_information" || error?.reasonCode === "contact_information";
      toast(privateInfo
        ? (locale === "zh" ? "请先遮盖姓名、学校、班级和联系方式，再上传作文照片。" : "Please cover names, school or class details, and contact information before uploading a writing photo.")
        : (locale === "zh" ? "这个文件暂时无法读取。请粘贴文字，或使用 DOCX、TXT、Markdown、JPG、PNG、WEBP、HEIC／HEIF。" : "We could not read that file. Paste the writing, or use DOCX, TXT, Markdown, JPG, PNG, WEBP, HEIC or HEIF."), true);
    }
  });

  const speechButton = $("[data-speech]");
  const chineseIdeaEntry = $("[data-chinese-idea-entry]");
  const handleSpeechInput = () => {
    existingWritingMode = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      $("[data-seed]")?.focus();
      toast(locale === "zh" ? "当前浏览器不支持语音输入，可以直接打字。" : "Voice input is unavailable in this browser. You can type instead.", true);
      return;
    }
    if (recognition) {
      recognition.stop();
      return;
    }
    const field = $("[data-seed]");
    const original = field.value.trim();
    recognition = new SpeechRecognition();
    recognition.lang = locale === "zh" ? "zh-CN" : "en-US";
    recognition.interimResults = true;
    speechButton.classList.add("listening");
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0].transcript).join("");
      field.value = `${original}${original ? " " : ""}${spoken}`;
    };
    recognition.onerror = () => toast(locale === "zh" ? "没有听清，请再试一次。" : "I could not hear that. Please try again.", true);
    recognition.onend = () => {
      recognition = null;
      speechButton.classList.remove("listening");
    };
    recognition.start();
  };
  speechButton.addEventListener("click", handleSpeechInput);
  chineseIdeaEntry?.addEventListener("click", () => {
    existingWritingMode = false;
    $(".words-heading")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => $("[data-seed]")?.focus(), 280);
    window.StoriesLensAnalytics?.track("chinese_idea_entry_selected", { source: "start-card" });
  });

  if ($("[data-auto-read-question]")) {
    $("[data-auto-read-question]").checked = localStorage.getItem("storieslens_auto_read_questions") === "1";
  }
  applyLocale(locale);
  if (workshopMode) {
    document.body.classList.add("cn-workshop-mode");
    const banner = document.createElement("aside");
    banner.className = "cn-workshop-banner";
    banner.innerHTML = '<strong>中国线下工作坊 · 本机私密模式</strong><span>无需注册；作品只保存在本设备。真人照片可以试创，但须获得本人或监护人同意；请勿填写姓名、学校或联系方式。</span><a href="china-workshop.html">返回教师工作台</a>';
    document.body.prepend(banner);
    const uploadTitle = $("[data-upload-label] strong");
    if (uploadTitle) uploadTitle.textContent = "上传你的画作";
    const uploadHelp = $("[data-upload-label] small");
    if (uploadHelp) uploadHelp.textContent = "支持画作、手工作品与已获同意的真人照片 · 仅在本机私密处理";
    $("[data-checkout]")?.setAttribute("hidden", "");
  }
  showStage("start");
  restoreLearningProfile();
  void restoreHomepageSpark();
  if (params.get("focus") === "words") $(`[data-seed]`).focus();
  window.StoriesLensAnalytics?.track("family_flow_viewed", { locale });
})();
