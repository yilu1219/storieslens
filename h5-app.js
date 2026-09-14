(() => {
  const platform = window.StoriesLensPlatform;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const params = new URLSearchParams(location.search);
  const requestedLocale = params.get("locale");
  const forcedLocale = document.body.dataset.studioLanguage;
  let locale = forcedLocale === "zh" ? "zh" : (requestedLocale === "zh" || requestedLocale === "en"
    ? requestedLocale
    : (localStorage.getItem("storieslens_locale") === "zh" ? "zh" : "en"));
  let selectedArtwork = null;
  let selectedArtworkData = "";
  let recognition = null;
  let questionIndex = 0;
  let answers = [];
  let languageTouched = false;
  let savedProjectId = "";
  let saveTimer = 0;

  const copy = {
    en: {
      "brand-subtitle": "语镜故事",
      "my-stories": "My stories",
      "start-kicker": "ONE CREATION · THREE QUESTIONS · YOUR STORY",
      "start-title-one": "Your first story page",
      "start-title-two": "starts with you.",
      "start-intro": "Upload something you made—or begin with words or voice. Yu asks three questions. You answer and remain the author.",
      "yu-profile-cta": "Meet Yu",
      "yu-profile-sub": "See how your bilingual mentor is trained",
      "step-one": "STEP 1",
      "bring-one": "Bring one piece of your world.",
      "free": "FREE",
      "upload-title": "Upload your artwork or photo",
      "upload-help": "JPG, PNG, WEBP or HEIC · converted privately on this device",
      "privacy-note": "Location and camera information are removed before the image is used.",
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
      "meet-questions": "Meet Yu’s three questions",
      "trust-line": "Private by default · AI asks · You create · Every word remains yours",
      "teacher-tool": "FOR TEACHERS",
      "teacher-publisher": "Turn a bulletin board into a dated class book.",
      "teacher-publisher-copy": "Photograph the wall once, or upload each student work separately.",
      "yu-asks": "YU ASKS · YOU ANSWER",
      "your-spark": "YOUR STARTING SPARK",
      "personal-mentor": "YOUR PERSONAL STORY MENTOR",
      "answer-own-words": "Answer in your own words. A short sentence is enough.",
      "answer-placeholder": "In my story...",
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
        "What stands in their way?",
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
      "yu-profile-cta": "认识羽大师",
      "yu-profile-sub": "看看中英文语言导师是怎样训练出来的",
      "step-one": "第一步",
      "bring-one": "带来一份属于你的创作。",
      "free": "免费体验",
      "upload-title": "上传你的画作或照片",
      "upload-help": "支持 JPG、PNG、WEBP、HEIC · 在本机私密转换",
      "privacy-note": "图片使用前会先删除位置与拍摄设备信息。",
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
      "meet-questions": "回答羽导师的三个问题",
      "trust-line": "默认私密 · AI 提问 · 由你创作 · 每一个字都属于你",
      "teacher-tool": "教师工具",
      "teacher-publisher": "把一面作品墙变成带日期的班级电子书。",
      "teacher-publisher-copy": "可以一次拍下整面墙，也可以逐张上传学生作品。",
      "yu-asks": "羽导师提问 · 由你回答",
      "your-spark": "你的起点",
      "personal-mentor": "你的专属故事导师",
      "answer-own-words": "请用自己的话回答，一句话就足够。",
      "answer-placeholder": "在我的故事里……",
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
        "什么事情挡住了他？",
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
    return $("[data-seed]").value.trim();
  }

  function creatorName() {
    return $("[data-creator-name]").value.trim() || (locale === "zh" ? "故事创作者" : "Story Creator");
  }

  function collectChineseCreativeProfile() {
    if ($("[data-language]")?.value !== "zh") return null;
    const format = $("[name='chinese-format']:checked")?.value || "ink-story";
    const background = $("[data-chinese-background]")?.value || "";
    const level = $("[data-chinese-level]")?.value || "";
    const goal = $("[data-chinese-goal]")?.value || "";
    return { format, background, level, goal, source: "creator-choice" };
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

  function renderQuestion() {
    $("[data-question-number]").textContent = String(questionIndex + 1);
    const chineseQuestions = {
      "ink-story": ["画面中最重要的人是谁？他此刻最想做什么？", "什么阻碍正在逼他作出选择？", "请写下故事真正发生变化的第一个瞬间。"],
      comic: ["如果这是连环画第一格，我们最先看见谁在做什么？", "第二格出现了什么意外或阻碍？", "下一格里，人物会作出什么行动？"],
      picturebook: ["翻开第一页，读者最先看见谁和什么地方？", "这个人物心里藏着怎样的愿望？", "第一页结束前，发生了哪件让人想继续翻页的事？"],
      film: ["电影的第一个镜头里，观众看见什么？", "这个场景里最重要的动作或声音是什么？", "镜头结束时，什么已经和开始时不同？"]
    };
    const profile = collectChineseCreativeProfile();
    $("[data-question]").textContent = profile ? chineseQuestions[profile.format][questionIndex] : copy[locale].questions[questionIndex];
    $("[data-next-question] span").textContent = questionIndex === 2 ? t("see-page") : t("next-question");
    $("[data-answer]").value = answers[questionIndex] || "";
    $("[data-question-error]").textContent = "";
  }

  function restoreHomepageSpark() {
    let spark = null;
    try {
      spark = JSON.parse(sessionStorage.getItem("storieslens_home_spark") || "null");
      sessionStorage.removeItem("storieslens_home_spark");
    } catch (_error) {
      sessionStorage.removeItem("storieslens_home_spark");
    }
    if (!spark) return;
    if (["en", "zh"].includes(spark.storyLanguage)) {
      $(`[data-language]`).value = spark.storyLanguage;
      languageTouched = true;
    }
    if (spark.seed) $(`[data-seed]`).value = String(spark.seed).slice(0, 1800);
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
      $(`[data-coach-image]`).src = selectedArtworkData;
      $(`[data-coach-image]`).hidden = false;
    }
  }

  function saveLocalDraft(draft) {
    const language = $("[data-language]").value;
    const ageGroup = $("[data-age]").value;
    const seed = storySeed();
    const learningProfile = collectLearningProfile();
    const chineseCreativeProfile = collectChineseCreativeProfile();
    const dna = {
      source: selectedArtwork ? "work" : "tell",
      inspiration: seed || (locale === "zh" ? "我上传的作品" : "My uploaded creation"),
      storyLanguage: language,
      memory: "character",
      change: answers[1] || answers[0] || "",
      shift: "rule",
      answers: answers.slice(),
      seed: answers.join(" "),
      learningProfile,
      chineseCreativeProfile,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem("storieslens_creator_setup", JSON.stringify({
      mode: "solo",
      origin: selectedArtwork ? "work" : "memory",
      ageGroup,
      supervisionConfirmed: ageGroup !== "under18" || $("[data-adult-support]").checked,
      storyLanguage: language,
      displayName: creatorName(),
      seed,
      learningProfile,
      chineseCreativeProfile,
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
      creatorName: creatorName()
    }));
    return dna;
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
    try {
      const result = await platform.api("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title,
          language,
          ageGroup,
          mode: "solo",
          visibility: "private",
          sourceType: selectedArtwork ? "artwork" : "text",
          sourceText: storySeed(),
          draft,
          storyDna: dna,
          scenes: [{ id: "scene-1", title, text: draft, caption: draft.slice(0, 500), duration: 6 }],
          clientSnapshot: { from: "h5", firstPageCreated: true, learningProfile, chineseCreativeProfile }
        })
      });
      savedProjectId = result.project.id;
      localStorage.setItem("storieslens_cloud_project_id", savedProjectId);
      if (selectedArtworkData) {
        try {
          const mediaResult = await platform.api("/api/media", {
            method: "POST",
            body: JSON.stringify({ projectId: savedProjectId, dataUrl: selectedArtworkData, metadataRemoved: true, purpose: "artwork" })
          });
          await platform.api(`/api/projects/${savedProjectId}`, {
            method: "PATCH",
            body: JSON.stringify({
              coverImageUrl: mediaResult.media.url,
              scenes: [{ id: "scene-1", title, text: draft, caption: draft.slice(0, 500), imageUrl: mediaResult.media.url, duration: 6 }]
            })
          });
        } catch (_mediaError) {
          // Private photo or an unreviewed image intentionally remains on this device only.
        }
      }
      status.textContent = t("saved-cloud");
      window.StoriesLensAnalytics?.track("first_story_page_saved", { language, hasArtwork: Boolean(selectedArtwork), cloud: true });
    } catch (_error) {
      status.textContent = t("saved-device");
      window.StoriesLensAnalytics?.track("first_story_page_saved", { language, hasArtwork: Boolean(selectedArtwork), cloud: false });
    }
  }

  function buildFirstPage() {
    const seed = storySeed();
    const creatorWords = [seed, ...answers].map((item) => String(item || "").trim()).filter(Boolean);
    const draft = creatorWords.join("\n\n");
    const title = deriveTitle(seed || answers[0]);
    $("[data-story-title]").value = title;
    $("[data-story-draft]").value = draft;
    $("[data-result-author]").textContent = creatorName();
    const image = $("[data-result-image]");
    image.hidden = !selectedArtworkData;
    if (selectedArtworkData) image.src = selectedArtworkData;
    $("[data-story-page]").classList.toggle("no-artwork", !selectedArtworkData);
    $("[data-continue]").href = `visual-write.html?${new URLSearchParams({ mode: "free", from: "h5", storyLang: $("[data-language]").value })}`;
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
      selectedArtwork = { name: file.name, privateOnly: false, convertedFromHeic: Boolean(safeArtwork.convertedFromHeic) };
    } catch (error) {
      const reasonCode = error.reasonCode || error.message;
      if (["review_unavailable", "real_person", "not_artwork"].includes(reasonCode) && window.StoriesLensArtworkSafety?.removeMetadata) {
        const localArtwork = await window.StoriesLensArtworkSafety.removeMetadata(file);
        selectedArtworkData = localArtwork.dataUrl;
        selectedArtwork = { name: file.name, privateOnly: true, personalPhoto: reasonCode !== "review_unavailable", convertedFromHeic: Boolean(localArtwork.convertedFromHeic) };
        toast(locale === "zh" ? "已进入仅本机私密模式；图片不会公开。" : "Device-only private mode is on. This image will not be public.");
      } else {
        selectedArtworkData = "";
        selectedArtwork = null;
        toast(locale === "zh" ? "图片未通过安全检查，没有保存。" : "The image did not pass the safety check and was not saved.", true);
        return;
      }
    }
    const preview = $("[data-artwork-preview]");
    preview.src = selectedArtworkData;
    preview.hidden = false;
    $("[data-upload-label]").classList.add("has-image");
    $("[data-coach-image]").src = selectedArtworkData;
    $("[data-coach-image]").hidden = false;
    if (selectedArtwork.convertedFromHeic) toast(locale === "zh" ? "HEIC 已在本机安全转换，原始照片不会上传。" : "HEIC converted safely on this device. The original photo is not uploaded.");
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
    if (!$("[data-creator-name]").value.trim()) {
      message.textContent = locale === "zh" ? "请填写要印在故事上的姓名或昵称。" : "Add the creator name or nickname to print on the story.";
      $("[data-creator-name]").focus();
      return;
    }
    if (ageGroup === "under18" && !$("[data-adult-support]").checked) {
      message.textContent = locale === "zh" ? "需要成年人确认支持后才能继续。" : "An adult must confirm support before continuing.";
      return;
    }
    if (learningProfileError) {
      if ($("[data-learning-profile]")) $("[data-learning-profile]").open = true;
      if ($("[data-learning-profile-status]")) $("[data-learning-profile-status]").textContent = learningProfileError;
      message.textContent = learningProfileError;
      return;
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
      buildFirstPage();
      return;
    }
    questionIndex += 1;
    renderQuestion();
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
  $("[data-continue]").addEventListener("click", () => saveLocalDraft($("[data-story-draft]").value.trim()));
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

  const speechButton = $("[data-speech]");
  const chineseVoiceEntry = $("[data-chinese-voice-entry]");
  const handleSpeechInput = () => {
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
    chineseVoiceEntry?.classList.add("is-listening");
    chineseVoiceEntry?.setAttribute("aria-pressed", "true");
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0].transcript).join("");
      field.value = `${original}${original ? " " : ""}${spoken}`;
    };
    recognition.onerror = () => toast(locale === "zh" ? "没有听清，请再试一次。" : "I could not hear that. Please try again.", true);
    recognition.onend = () => {
      recognition = null;
      speechButton.classList.remove("listening");
      chineseVoiceEntry?.classList.remove("is-listening");
      chineseVoiceEntry?.setAttribute("aria-pressed", "false");
    };
    recognition.start();
  };
  speechButton.addEventListener("click", handleSpeechInput);
  chineseVoiceEntry?.addEventListener("click", () => {
    $(".words-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
    handleSpeechInput();
  });

  applyLocale(locale);
  showStage("start");
  restoreLearningProfile();
  restoreHomepageSpark();
  if (params.get("focus") === "words") $(`[data-seed]`).focus();
  window.StoriesLensAnalytics?.track("family_flow_viewed", { locale });
})();
