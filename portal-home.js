(() => {
  const uploadInput = document.querySelector("[data-home-upload]");
  const uploadLabel = document.querySelector("[data-home-upload-label]");
  const speechButton = document.querySelector("[data-home-speech]");
  const typeButton = document.querySelector("[data-home-type]");
  const voiceWrap = document.querySelector("[data-home-voice-wrap]");
  const voiceText = document.querySelector("[data-home-voice-text]");
  const imageWrap = document.querySelector("[data-home-image-preview-wrap]");
  const imagePreview = document.querySelector("[data-home-image-preview]");
  const imageName = document.querySelector("[data-home-image-name]");
  const continueButton = document.querySelector("[data-home-continue]");
  const status = document.querySelector("[data-home-status]");
  const storyLanguageWrap = document.querySelector("[data-home-story-language]");
  const storyLanguageButtons = document.querySelectorAll("[data-story-language]");
  let preparedImage = null;
  let preparedStoryLanguage = "";
  let recognition = null;
  // The public homepage is the English flagship. Chinese is a distinct
  // creative route—not an in-place translation of this page.
  let homeLocale = "en";

  const homeCopy = {
    en: {
      "hero-kicker": "YOUR PERSONAL AI STORY MENTOR",
      "hero-title-one": "Your next storybook or short film starts with",
      "hero-title-two": "something you made.",
      "hero-lede": "Upload your artwork or photo—or speak or type one idea. Yu asks three questions and guides you toward a first scene written in your voice.",
      "yu-profile-cta": "Meet Yu",
      "yu-profile-sub": "See how your bilingual mentor is trained",
      "sign-in": "Sign in",
      "promise-one": "YU ASKS",
      "promise-two": "YOU ANSWER",
      "promise-three": "YOU REMAIN THE AUTHOR",
      "start-here": "START WITH ONE CREATION",
      "free-questions": "FREE FIRST-SCENE PREVIEW",
      "upload-primary": "Upload artwork or a photo",
      "upload-secondary": "",
      "voice-primary": "Speak one idea",
      "voice-secondary": "",
      "type-primary": "Type one idea",
      "type-secondary": "",
      "spark-label": "YOUR STARTING SPARK",
      "spark-ready": "Ready for Yu’s three questions.",
      "idea-label": "Your idea",
      "idea-placeholder": "Speak—or type—what happens first...",
      "speech-note": "Speech becomes editable text. Live audio is not saved.",
      "language-question": "What language would you like to create in today?",
      "language-en": "Create in English",
      "language-zh": "Create in Chinese",
      "continue-yu": "Let Yu ask me three questions",
      "metadata-removed": "Location and camera details removed",
      "private-default": "Private by default",
      "type-link": "Prefer to type? Start with words →",
      "ways-kicker": "CREATE YOUR WAY",
      "ways-title": "Create alone—or with people you trust.",
      "solo-label": "SOLO CREATOR",
      "solo-title": "Build a story world that is entirely yours.",
      "solo-copy": "Write at your pace, keep every decision, and choose when to share.",
      "solo-cta": "Start solo",
      "group-label": "PRIVATE STORY SQUAD",
      "group-title": "Create with family or friends you invite.",
      "group-copy": "Invite 2–6 people by private link or Story Code. Every contribution keeps its author’s name.",
      "group-cta": "Create or join a squad",
      "teacher-label": "FOR TEACHERS",
      "teacher-title": "Turn bulletin boards and student work into a dated class book.",
      "teacher-copy": "Photograph the wall once—or upload each work—to create a digital or printed keepsake.",
      "teacher-cta": "Open Teacher Publisher",
      "case-cta": "Real case showcase",
      "family-kicker": "ANOTHER PRODUCT FROM STORIESLENS STUDIO",
      "family-title": "Every age has a story worth keeping.",
      "family-intro": "StoriesLens helps new worlds begin. Lightyear Story helps real lives be heard, organized, and passed on.",
      "lightyear-label": "FROM THE STORIESLENS TEAM · 同一团队旗下产品",
      "lightyear-title": "Make writing an autobiography as easy as having a conversation.",
      "lightyear-book": "Turn your memories into a digital or printed autobiography.",
      "lightyear-film": "Turn your autobiography into an AI life film with one click.",
      "lightyear-voice": "With your consent, clone 10 seconds of your own voice to narrate and share your digital autobiography.",
      "lightyear-cta": "Discover Lightyear Story →",
      "bridge-storieslens": "Create the world you imagine next.",
      "bridge-lightyear-name": "Lightyear Story",
      "bridge-lightyear": "Preserve the life you have already lived.",
      "outcome-kicker": "ONE CREATION · ONE STORY WORLD",
      "outcome-title": "See one idea become a book and a film.",
      "outcome-lede": "Bring the first spark. Yu asks three questions. You make every creative decision.",
      "flagship-label": "FLAGSHIP STORY · 旗舰案例",
      "flagship-summary": "One original drawing becomes a connected story world—guided by Yu, authored by its creator.",
      "origin-format": "ORIGINAL ARTWORK · 原创画作",
      "origin-result": "The creator brings the first spark.",
      "mentor-step": "ASKS 3 QUESTIONS",
      "book-format": "ILLUSTRATED BOOK · 绘本",
      "book-result": "A story designed to read, keep, and print.",
      "film-format": "SHORT FILM · 故事电影",
      "film-result": "The same characters and world, brought to the screen.",
      "case-foot-title": "FROM SOMETHING YOU MADE",
      "case-foot-copy": "To a story you can read, hold, watch—and proudly call your own.",
      "outcome-disclosure": "StoriesLens Original · Product example",
      "showcase-title": "See what StoriesLens can make.",
      "showcase-cta": "View finished work →",
      "footer-trust": "Private by default · AI guides, people create",
      "invalid-image": "Choose a JPG, PNG, WEBP, HEIC or HEIF image under 15 MB.",
      "checking-image": "Converting on this device, removing location and camera details, then checking the image…",
      "private-ready": "Ready in device-only private mode. The original photo is not uploaded.",
      "image-ready": "Your creation is ready. The original file is not saved.",
      "image-failed": "This image could not be used. Please try another one.",
      "image-large": "This image is too large to carry forward. Try a smaller image.",
      "voice-unavailable": "Voice input is unavailable in this browser. Type your idea here instead.",
      "listening": "Listening… speak one idea in your own words.",
      "not-heard": "I could not hear that. Try again or type your idea.",
      "voice-ready": "Your words are ready for Yu."
    },
    zh: {
      "hero-kicker": "你的专属 AI 故事与写作导师",
      "hero-title-one": "让你的作品，成为",
      "hero-title-two": "一本书或一部短片。",
      "hero-lede": "上传一幅画、一张照片，或说出、写下一个想法。你的 AI 故事导师 Yu 会先提出三个问题，再陪你写出属于自己的故事第一幕。",
      "yu-profile-cta": "认识羽大师",
      "yu-profile-sub": "看看中英文语言导师是怎样训练出来的",
      "sign-in": "邮箱登录",
      "promise-one": "YU 提问",
      "promise-two": "你回答",
      "promise-three": "你始终是作者",
      "start-here": "从一件原创作品开始",
      "free-questions": "免费预览故事第一幕",
      "upload-primary": "上传你的画作或照片",
      "upload-secondary": "",
      "voice-primary": "口述一个想法",
      "voice-secondary": "",
      "type-primary": "写下一个想法",
      "type-secondary": "",
      "spark-label": "你的创作起点",
      "spark-ready": "已经可以回答 Yu 导师的三个问题。",
      "idea-label": "你的想法",
      "idea-placeholder": "说出或写下故事最先发生了什么……",
      "speech-note": "语音会转成可以修改的文字，不保存现场录音。",
      "language-question": "今天想用什么语言创作？",
      "language-en": "用英文创作",
      "language-zh": "用中文创作",
      "continue-yu": "回答 Yu 导师的三个问题",
      "metadata-removed": "删除位置和拍摄设备信息",
      "private-default": "默认私密",
      "type-link": "更喜欢打字？从文字开始 →",
      "ways-kicker": "选择创作方式",
      "ways-title": "独立创作，或和你信任的人一起完成。",
      "solo-label": "个人创作",
      "solo-title": "建立一个完全属于你的故事世界。",
      "solo-copy": "按照自己的节奏创作，保留每一个决定，由你选择何时分享。",
      "solo-cta": "开始个人创作",
      "group-label": "私密共创",
      "group-title": "和你邀请的家人或朋友一起创作。",
      "group-copy": "通过私密链接或故事码邀请 2–6 人，每一段创作都保留作者署名。",
      "group-cta": "创建或加入创作小组",
      "teacher-label": "教师入口",
      "teacher-title": "把公告栏和学生作品变成带日期的班级纪念书。",
      "teacher-copy": "拍摄整面作品墙，或逐张上传，制作电子书或实体纪念册。",
      "teacher-cta": "进入教师出版空间",
      "case-cta": "真实案例展示",
      "family-kicker": "StoriesLens 创作团队旗下产品",
      "family-title": "每一个人生阶段，都值得拥有一本自己的书。",
      "family-intro": "StoriesLens 让想象中的新世界开始；光年传记让真实走过的人生被听见、被整理、被传承。",
      "lightyear-label": "STORIESLENS 同一团队旗下产品",
      "lightyear-title": "让写自传，像聊天一样简单。",
      "lightyear-book": "把人生讲述整理成电子自传或实体书。",
      "lightyear-film": "一键把自传生成 AI 人生电影。",
      "lightyear-voice": "本人授权录制 10 秒声音，用自己的声音朗读，并把电子自传分享给家人朋友。",
      "lightyear-cta": "了解光年传记 →",
      "bridge-storieslens": "创造你想象中的下一个世界。",
      "bridge-lightyear-name": "光年传记",
      "bridge-lightyear": "保存你已经走过的真实人生。",
      "outcome-kicker": "一份原创 · 一个故事世界",
      "outcome-title": "亲眼看见一个想法成为书与电影。",
      "outcome-lede": "你带来最初的灵感，Yu 导师提出三个问题，每一个创作决定都由你完成。",
      "flagship-label": "旗舰案例 · FLAGSHIP STORY",
      "flagship-summary": "一幅原创画作，在 Yu 导师的引导下，成为由创作者亲自完成的完整故事世界。",
      "origin-format": "原创画作 · ORIGINAL ARTWORK",
      "origin-result": "创作者带来故事最初的火花。",
      "mentor-step": "提出三个问题",
      "book-format": "绘本 · ILLUSTRATED BOOK",
      "book-result": "一本可以阅读、珍藏和印刷的故事书。",
      "film-format": "故事电影 · SHORT FILM",
      "film-result": "让相同的人物与故事世界真正出现在银幕上。",
      "case-foot-title": "始于你亲手创造的作品",
      "case-foot-copy": "成为一本可以阅读、珍藏、观看，并真正属于你的故事。",
      "outcome-disclosure": "StoriesLens 语镜原创 · 产品示例",
      "showcase-title": "看看 StoriesLens 可以创造什么。",
      "showcase-cta": "浏览完成作品 →",
      "footer-trust": "默认私密 · AI 负责引导，由人亲自创作",
      "invalid-image": "请选择不超过 15MB 的 JPG、PNG、WEBP、HEIC 或 HEIF 图片。",
      "checking-image": "正在本机转换图片、删除位置与拍摄设备信息，并进行检查……",
      "private-ready": "已进入仅本机私密模式，原始照片不会上传。",
      "image-ready": "你的作品已经准备好，原始文件不会保存。",
      "image-failed": "这张图片暂时无法使用，请换一张再试。",
      "image-large": "图片过大，无法带入下一步，请选择较小的图片。",
      "voice-unavailable": "当前浏览器不支持语音输入，你可以在这里直接打字。",
      "listening": "正在倾听……请用自己的话说出一个想法。",
      "not-heard": "没有听清，请再试一次或直接输入文字。",
      "voice-ready": "你的话已经准备好，可以交给 Yu 导师了。"
    }
  };

  const t = (key) => Object.prototype.hasOwnProperty.call(homeCopy[homeLocale], key)
    ? homeCopy[homeLocale][key]
    : key;

  const applyHomeLocale = (nextLocale) => {
    homeLocale = nextLocale === "zh" ? "zh" : "en";
    localStorage.setItem("storieslens_locale", homeLocale);
    document.documentElement.lang = homeLocale === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-home-locale]").forEach((button) => {
      const active = button.dataset.homeLocale === homeLocale;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-home-t]").forEach((element) => {
      element.textContent = t(element.dataset.homeT);
    });
    document.querySelectorAll("[data-home-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.homePlaceholder);
    });
    document.title = homeLocale === "zh" ? "语镜故事｜从你的作品开始创作" : "StoriesLens | Start with your creation";
  };

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", error);
  };

  const showLanguageChoice = () => {
    storyLanguageWrap.hidden = false;
  };

  const showContinue = () => {
    const hasSpark = Boolean(preparedImage || voiceText.value.trim());
    showLanguageChoice();
    continueButton.hidden = !(hasSpark && preparedStoryLanguage);
  };

  const storeAndContinue = async () => {
    const payload = {
      ...(preparedImage || {}),
      seed: voiceText.value.trim(),
      storyLanguage: preparedStoryLanguage,
      createdAt: new Date().toISOString()
    };
    try {
      if (window.StoriesLensSparkHandoff) {
        await window.StoriesLensSparkHandoff.save(payload);
      } else {
        sessionStorage.setItem("storieslens_home_spark", JSON.stringify(payload));
      }
    } catch (_error) {
      setStatus(t("image-large"), true);
      return;
    }
    window.StoriesLensAnalytics?.track("homepage_magic_moment_started", {
      source: preparedImage && payload.seed
        ? "image_and_voice"
        : (preparedImage ? "image" : (payload.seed ? "voice" : "language_only"))
    });
    location.href = preparedStoryLanguage === "zh"
      ? "chinese-studio.html?from=homepage-magic"
      : "app.html?locale=en&from=homepage-magic";
  };

  uploadInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.StoriesLensArtworkSafety?.isSupportedImage(file) || file.size > 15 * 1024 * 1024) {
      setStatus(t("invalid-image"), true);
      return;
    }
    setStatus(t("checking-image"));
    uploadLabel.classList.add("is-processing");
    try {
      let result;
      let privateOnly = false;
      let personalPhoto = false;
      try {
        result = await window.StoriesLensArtworkSafety.processArtwork(file);
      } catch (error) {
        const reason = error.reasonCode || error.message;
        if (!["review_unavailable", "real_person", "not_artwork"].includes(reason)) throw error;
        result = await window.StoriesLensArtworkSafety.removeMetadata(file);
        privateOnly = true;
        personalPhoto = reason === "real_person" || reason === "not_artwork";
      }
      preparedImage = { dataUrl: result.dataUrl, name: file.name, privateOnly, personalPhoto, convertedFromHeic: Boolean(result.convertedFromHeic) };
      imagePreview.src = result.dataUrl;
      imageName.textContent = file.name;
      imageWrap.hidden = false;
      uploadLabel.classList.add("has-selection");
      setStatus(result.convertedFromHeic
        ? (homeLocale === "zh" ? "HEIC 已在本机安全转换；原始照片不会上传。" : "HEIC converted safely on this device. The original photo is not uploaded.")
        : (privateOnly ? t("private-ready") : t("image-ready")));
      showContinue();
      window.StoriesLensAnalytics?.track("homepage_image_prepared", { privateOnly, personalPhoto });
    } catch (_error) {
      preparedImage = null;
      imageWrap.hidden = true;
      setStatus(t("image-failed"), true);
    } finally {
      uploadLabel.classList.remove("is-processing");
    }
  });

  speechButton?.addEventListener("click", () => {
    voiceWrap.hidden = false;
    showLanguageChoice();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceText.focus();
      setStatus(t("voice-unavailable"));
      return;
    }
    if (recognition) {
      recognition.stop();
      return;
    }
    const original = voiceText.value.trim();
    recognition = new SpeechRecognition();
    recognition.lang = document.documentElement.lang.startsWith("zh") ? "zh-CN" : "en-US";
    recognition.interimResults = true;
    speechButton.classList.add("is-listening");
    setStatus(t("listening"));
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0].transcript).join("");
      voiceText.value = `${original}${original ? " " : ""}${spoken}`;
      showContinue();
    };
    recognition.onerror = () => setStatus(t("not-heard"), true);
    recognition.onend = () => {
      recognition = null;
      speechButton.classList.remove("is-listening");
      if (voiceText.value.trim()) setStatus(t("voice-ready"));
      showContinue();
    };
    recognition.start();
  });

  typeButton?.addEventListener("click", () => {
    voiceWrap.hidden = false;
    showLanguageChoice();
    voiceText.focus();
    setStatus(homeLocale === "zh" ? "写下一句话，就可以选择创作语言。" : "Write one sentence, then choose your story language.");
    window.StoriesLensAnalytics?.track("homepage_text_entry_opened");
  });

  voiceText?.addEventListener("input", showContinue);
  storyLanguageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      preparedStoryLanguage = button.dataset.storyLanguage === "zh" ? "zh" : "en";
      storyLanguageButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });
      showContinue();
      window.StoriesLensAnalytics?.track("homepage_story_language_selected", { language: preparedStoryLanguage });
      void storeAndContinue();
    });
  });
  continueButton?.addEventListener("click", () => void storeAndContinue());
  document.querySelectorAll("[data-home-locale]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.homeLocale === "zh") {
        preparedStoryLanguage = "zh";
        void storeAndContinue();
        return;
      }
      applyHomeLocale("en");
    });
  });

  document.querySelectorAll("[data-audience]").forEach((link) => {
    link.addEventListener("click", () => {
      window.StoriesLensAnalytics?.track("homepage_audience_selected", {
        audience: link.dataset.audience || "unknown"
      });
    });
  });

  applyHomeLocale("en");
})();
