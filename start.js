(() => {
  const form = document.querySelector("[data-start-form]");
  const modePanel = document.querySelector('[data-step-panel="1"]');
  const modeButtons = [...document.querySelectorAll("[data-mode-choice]")];
  const originButtons = [...document.querySelectorAll("[data-origin]")];
  const squadButtons = [...document.querySelectorAll("[data-squad-action]")];
  const collaborationModeButtons = [...document.querySelectorAll("[data-collaboration-mode]")];
  const collaborationModePickers = [...document.querySelectorAll("[data-collaboration-mode-picker]")];
  const soloOptions = document.querySelector("[data-solo-options]");
  const squadOptions = document.querySelector("[data-squad-options]");
  const setupFields = document.querySelector(".setup-fields");
  const ideaField = document.querySelector("[data-idea-field]");
  const codeField = document.querySelector("[data-code-field]");
  const continueButton = document.querySelector("[data-continue]");
  const nextButton = document.querySelector("[data-step-next]");
  const backButton = document.querySelector("[data-step-back]");
  const stepCurrent = document.querySelector("[data-step-current]");
  const stepLabel = document.querySelector("[data-step-label]");
  const stepTitle = document.querySelector("[data-step-title]");
  const stepLede = document.querySelector("[data-step-lede]");
  const progressFill = document.querySelector("[data-progress-fill]");
  const displayName = document.querySelector("[data-display-name]");
  const storySeed = document.querySelector("[data-story-seed]");
  const sparkSpeak = document.querySelector("[data-spark-speak]");
  const sparkVoiceStatus = document.querySelector("[data-spark-voice-status]");
  const workFileField = document.querySelector("[data-work-file-field]");
  const workFile = document.querySelector("[data-work-file]");
  const workFileStatus = document.querySelector("[data-work-file-status]");
  const storyCode = document.querySelector("[data-story-code]");
  const creatorLevel = document.querySelector("[data-creator-level]");
  const ageGroup = document.querySelector("[data-age-group]");
  const supervisionPanel = document.querySelector("[data-supervision-panel]");
  const supervisionConfirm = document.querySelector("[data-supervision-confirm]");
  const storyLanguage = document.querySelector("[data-story-language]");
  const squadCreateFields = document.querySelector("[data-squad-create-fields]");
  const squadTitle = document.querySelector("[data-squad-title]");
  const titleSpeak = document.querySelector("[data-title-speak]");
  const titleVoiceStatus = document.querySelector("[data-title-voice-status]");
  const squadOutput = document.querySelector("[data-squad-output]");
  const travelOutputChoice = document.querySelector("[data-travel-output-choice]");
  const themeMentor = document.querySelector("[data-theme-mentor]");
  const wuxiaStyleChoices = document.querySelector("[data-wuxia-style-choices]");
  const wuxiaStyleCards = [...document.querySelectorAll("[data-wuxia-style-card]")];
  const wuxiaStoryHints = document.querySelector("[data-wuxia-story-hints]");
  const wuxiaHintButtons = [...document.querySelectorAll("[data-wuxia-hint]")];
  const wuxiaPhotoJump = document.querySelector("[data-wuxia-photo-jump]");
  const sportsStoryHints = document.querySelector("[data-sports-story-hints]");
  const sportsHintButtons = [...document.querySelectorAll("[data-sports-hint]")];
  const travelOutputButtons = [...document.querySelectorAll("[data-travel-output]")];
  const squadStyle = document.querySelector("[data-squad-style]");
  const squadCharacterRules = document.querySelector("[data-squad-character-rules]");
  const characterSpeak = document.querySelector("[data-character-speak]");
  const characterVoiceStatus = document.querySelector("[data-character-voice-status]");
  const characterFile = document.querySelector("[data-character-file]");
  const characterBuilder = document.querySelector("[data-character-builder]");
  const characterBuilderTitle = document.querySelector("[data-character-builder-title]");
  const characterUploadLabel = document.querySelector("[data-character-upload-label]");
  const characterFileStatus = document.querySelector("[data-character-file-status]");
  const characterPreviewImage = document.querySelector("[data-character-preview-image]");
  const characterPreviewEmpty = document.querySelector("[data-character-preview-empty]");
  const characterPhotoConsent = document.querySelector("[data-character-photo-consent]");
  const characterConsentPerson = document.querySelector("[data-character-consent-person]");
  const characterConsentProcessing = document.querySelector("[data-character-consent-processing]");
  const characterGuardianName = document.querySelector("[data-character-guardian-name]");
  const characterGuardianRelationship = document.querySelector("[data-character-guardian-relationship]");
  const stylePicker = document.querySelector("[data-style-picker]");
  const styleCards = [...document.querySelectorAll("[data-style-card]")];
  const styleSummaryImage = document.querySelector("[data-style-summary-image]");
  const styleSummaryLabel = document.querySelector("[data-style-summary-label]");
  const styleReferenceFile = document.querySelector("[data-style-reference-file]");
  const styleReferencePreview = document.querySelector("[data-style-reference-preview]");
  const styleReferenceImage = document.querySelector("[data-style-reference-image]");
  const styleReferenceName = document.querySelector("[data-style-reference-name]");
  const styleReferenceStatus = document.querySelector("[data-style-reference-status]");
  const styleReferencePermission = document.querySelector("[data-style-reference-permission]");
  const styleReferenceRemove = document.querySelector("[data-style-reference-remove]");
  const yuReadButtons = [...document.querySelectorAll("[data-yu-read]")];
  const yuReadPageButton = document.querySelector("[data-yu-read-page]");
  const error = document.querySelector("[data-form-error]");
  const carriedSpark = document.querySelector("[data-carried-spark]");
  const carriedSparkImage = document.querySelector("[data-carried-spark-image]");
  const carriedSparkNote = document.querySelector("[data-carried-spark-note]");
  const storyThemeEntry = document.querySelector("[data-story-theme-entry]");
  const storyThemeButtons = [...document.querySelectorAll("[data-story-theme]")];
  const t = (text) => window.StoriesLensI18n?.t(text) || text;

  const themeConfigs = {
    sports: { origin: "picture", title: "我们的运动故事", style: "cinematic", heading: "先选书或电影，再上传一张运动照片", lede: "一张运动照，六段接力，最后成为属于团队的故事书或电影。", seed: "比赛开始前，大家最期待什么？哪个瞬间改变了计划？你们怎样一起完成？", uploadTitle: "上传一张运动照片", uploadButton: "＋ 选择运动照片", uploadStatus: "请先取得照片中孩子监护人的私密创作许可；默认私密，不会自动用于宣传。", cta: "开始运动故事共创", requirePhoto: true, characterRules: "以已获监护人许可的运动照片作为人物、服装与器材参考；人物面貌、发型、队服颜色与器材始终一致；保持运动动作、场地与安全装备合理；不添加危险行为或灾难；画面中不显示学校全名、联系方式、赛事号码、标志或水印；公开宣传前必须另行取得每位孩子监护人的公开使用许可。" },
    travel: { origin: "picture", title: "我们的旅行故事", style: "ink-watercolor", heading: "先选书或电影，再上传一张旅行照", lede: "大家说或写一句当时发生了什么，就能开始共创。", seed: "说一句：照片在哪里拍的？当时发生了什么？", uploadTitle: "上传旅行照片", uploadButton: "＋ 选择旅行照片", uploadStatus: "照片会先删除位置和设备信息，并默认私密。", cta: "开始旅行故事共创", requirePhoto: true },
    history: { origin: "imagination", title: "我们的历史故事", style: "ink-watercolor", heading: "先选书或电影，再走进一个时代", lede: "从一个真实时代、人物或文物出发，一起写出当时的人会怎样选择。", seed: "你们想走进哪个时代？谁在什么地方遇到了怎样的选择？", cta: "开始历史故事共创", characterRules: "尊重选定时代的基本史实、服饰、建筑与器物；虚构人物可以参与故事，但不要把想象写成已经证实的历史事实；人物年龄、外貌、服装颜色与随身物品始终一致；画面内不出现现代物品、标志或水印。" },
    wuxia: { origin: "imagination", title: "我们的江湖故事", style: "cinematic", heading: "先选书或电影，再开启你们的江湖", lede: "古琴一响，故事开场。小羽大侠会用问题带大家写出人物、困难、选择和结局。", seed: "雨夜里，谁听见了古琴声？他为什么走进江湖？眼前出现了什么困难？", cta: "开始武侠共创", characterRules: "原创写实中国武侠电影世界，人物面孔清晰凌厉，打斗是有节奏的非血腥武术编排；古琴是推动故事的重要道具；衣袂与雨、竹林、水面或山河呼应；人物年龄、脸型、发型、服装颜色、兵器和古琴始终一致；不出现伤口或血腥；不复制现有电影人物、服装或镜头。" },
    fantasy: { origin: "imagination", title: "我们的奇幻冒险", style: "japanese-handpainted", heading: "先选书或电影，再打开奇幻世界", lede: "说说神兽、秘境或一次穿越，就能开始共创。", seed: "谁进入了奇幻世界？那里有什么不可思议的事？", cta: "开始奇幻共创" },
    lianhuanhua: { origin: "imagination", title: "我们的连环画", style: "comic", heading: "一起做一本中式连环画", lede: "一幅图讲一个小场景，大家接力把故事画完整。", seed: "第一幅画里有谁？他在哪里？正要做什么？", cta: "开始连环画共创", characterRules: "传统中国小人书风格，黑白钢笔线描，清晰轮廓，朴素写实，连续分镜；每幅只画一个明确动作，人物造型与服装始终一致；画面内不出现文字、对白框、标志或水印，文字排在画面外。" },
    "my-story": { origin: "memory", title: "我们的故事", style: "storybook-watercolor", heading: "先选书或电影，再讲一个真实故事", lede: "家庭、校园、朋友或成长中的一件事，都可以成为开场。", seed: "这件事发生在哪里？和谁有关？为什么让你记得？", cta: "开始我的故事共创" },
    free: { origin: "imagination", title: "我们的自由创作", style: "storybook-watercolor", heading: "先选书或电影，再说出你们的想法", lede: "没有固定主题，一句话就能开始。", seed: "你们最想一起创作一个怎样的故事？", cta: "开始自由共创" },
    "csl-classroom": {
      origin: "imagination",
      title: "消失的茶馆菜单",
      style: "ink-watercolor",
      heading: "Make one Chinese story with your class",
      lede: "Students can speak or type short Chinese sentences. Yu keeps the six scenes connected while every contribution stays credited.",
      seed: "今天，Maya和同学来到杭州的一家茶馆。菜单上的汉字突然不见了。她们要怎样用中文找回菜单？",
      cta: "Start the Chinese class story",
      creatorLevel: "growing",
      outputTitle: "Choose the class outcome",
      bookLabel: "Make a shared book",
      bookDetail: "Six short Chinese scenes",
      filmLabel: "Make a shared film",
      filmDetail: "Write scene by scene",
      uploadTitle: "Optional: add a class photo or worksheet",
      uploadButton: "＋ Choose a reference file",
      uploadStatus: "The file stays private and identifying metadata is removed.",
      characterRules: "Maya，12岁，正在学习中文，背蓝色书包，喜欢提问；林老师，温和，拿绿色笔记本；小羽，一只会提示中文词语的小猫头鹰。人物服装、年龄和颜色在每一页保持一致。"
    }
  };

  const renderAgeGate = () => {
    const needsSupervision = ageGroup?.value === "under18";
    if (supervisionPanel) supervisionPanel.hidden = !needsSupervision;
    if (!needsSupervision && supervisionConfirm) supervisionConfirm.checked = false;
  };

  const startParams = new URLSearchParams(window.location.search);
  const requestedMode = startParams.get("mode");
  const requestedDna = startParams.get("dna")?.trim() || "";
  const requestedSource = startParams.get("source");
  const requestedStoryLanguage = startParams.get("storyLang");
  const requestedOutput = startParams.get("output");
  const requestedInterfaceLanguage = ["en", "zh"].includes(startParams.get("uiLang")) ? startParams.get("uiLang") : "";
  const requestedTheme = startParams.get("theme") === "sailing" ? "sports" : startParams.get("theme");
  let storyTheme = themeConfigs[requestedTheme] ? requestedTheme : "";
  const outputRoute = requestedMode === "squad" && ["book", "film"].includes(requestedOutput);
  const chineseStudioRoute = startParams.get("from") === "chinese-studio";
  const interfaceLanguage = chineseStudioRoute ? "zh" : requestedInterfaceLanguage || (requestedStoryLanguage === "zh" ? "zh" : "");
  if (interfaceLanguage) {
    window.StoriesLensI18n?.setLocale(interfaceLanguage);
    document.documentElement.lang = interfaceLanguage === "zh" ? "zh-CN" : "en";
  }
  if (chineseStudioRoute) {
    const languageSwitcher = document.querySelector(".language-switcher");
    if (languageSwitcher) languageSwitcher.hidden = true;
    const backLink = document.querySelector(".back-link");
    if (backLink) backLink.href = "chinese-studio.html";
  }
  let mode = requestedMode === "squad" ? "squad" : "solo";
  let step = storyTheme || outputRoute ? 3 : requestedDna && (requestedMode === "solo" || requestedMode === "squad") ? 3 : requestedMode === "solo" || requestedMode === "squad" ? 2 : 1;
  const sourceToOrigin = { work: "work", tell: "memory", inspiration: "imagination", picture: "picture", text: "work", voice: "memory", book: "imagination", movie: "imagination", idea: "imagination" };
  let origin = sourceToOrigin[requestedSource] || "imagination";
  let squadAction = "create";
  let collaborationMode = "family";
  let importedWork = null;
  let sparkRecognition = null;
  let sparkListeningRequested = false;
  let sparkPointerSession = false;
  let suppressSparkClick = false;
  let sparkRestartTimer = null;
  let titleRecognition = null;
  let titleListeningRequested = false;
  let titlePointerSession = false;
  let suppressTitleClick = false;
  let titleRestartTimer = null;
  let characterRecognition = null;
  let characterListeningRequested = false;
  let characterPointerSession = false;
  let suppressCharacterClick = false;
  let characterRestartTimer = null;
  let characterReference = null;
  let styleReference = null;
  let homepageSpark = null;
  let storyLanguageTouched = ["en", "zh"].includes(requestedStoryLanguage);
  let squadStyleTouched = false;
  let selectedWuxiaStyle = wuxiaStyleCards[0]?.dataset.wuxiaStyleCard || "ink-space";
  let wuxiaTreatment = wuxiaStyleCards[0]?.dataset.treatment || "";
  document.body.classList.toggle("travel-quick-mode", Boolean(storyTheme));
  document.body.classList.toggle("wuxia-quick-mode", storyTheme === "wuxia");

  if (storyLanguage) storyLanguage.value = storyLanguageTouched ? requestedStoryLanguage : window.StoriesLensI18n?.locale === "zh" ? "zh" : "en";
  if (storySeed && requestedDna) storySeed.value = requestedDna;
  const applyStoryTheme = () => {
    const config = themeConfigs[storyTheme];
    if (!config) return;
    mode = "squad";
    origin = config.origin;
    squadAction = "create";
    if (storyTheme === "csl-classroom") collaborationMode = "classroom";
    if (storyLanguage) storyLanguage.value = "zh";
    if (creatorLevel) creatorLevel.value = config.creatorLevel || "family";
    if (squadTitle) squadTitle.value = config.title;
    if (squadOutput) squadOutput.value = "book";
    if (squadStyle) squadStyle.value = config.style;
    if (squadCharacterRules) squadCharacterRules.value = config.characterRules || "";
    if (storySeed && config.seed && storyTheme === "csl-classroom") storySeed.value = config.seed;
    const outputTitle = travelOutputChoice?.querySelector(":scope > strong");
    const outputBook = travelOutputChoice?.querySelector('[data-travel-output="book"]');
    const outputFilm = travelOutputChoice?.querySelector('[data-travel-output="film"]');
    if (outputTitle && config.outputTitle) outputTitle.textContent = config.outputTitle;
    if (outputBook && config.bookLabel) {
      outputBook.querySelector("b").textContent = config.bookLabel;
      outputBook.querySelector("small").textContent = config.bookDetail;
    }
    if (outputFilm && config.filmLabel) {
      outputFilm.querySelector("b").textContent = config.filmLabel;
      outputFilm.querySelector("small").textContent = config.filmDetail;
    }
    if (storySeed) storySeed.placeholder = config.seed;
    const workFileTitle = workFileField?.querySelector(".field-title > span");
    const workFilePicker = workFileField?.querySelector(".work-file-picker");
    if (workFileTitle) workFileTitle.textContent = config.uploadTitle || "可选：上传参考图片或作品";
    if (workFilePicker?.firstChild) workFilePicker.firstChild.textContent = config.uploadButton || "＋ 选择文件";
    if (workFileStatus) workFileStatus.textContent = config.uploadStatus || "可以上传图片、文字或作品作为灵感；默认私密。";
    if (themeMentor) themeMentor.hidden = storyTheme !== "wuxia";
    if (wuxiaStyleChoices) wuxiaStyleChoices.hidden = storyTheme !== "wuxia";
    if (wuxiaStoryHints) wuxiaStoryHints.hidden = storyTheme !== "wuxia";
    if (characterBuilderTitle && storyTheme === "wuxia") characterBuilderTitle.firstChild.textContent = "把自己变成江湖主角 ";
    if (characterUploadLabel && storyTheme === "wuxia") characterUploadLabel.textContent = "＋ 上传真人照片或人物画";
    if (sportsStoryHints) sportsStoryHints.hidden = storyTheme !== "sports";
  };
  applyStoryTheme();
  if (squadOutput && ["book", "film"].includes(requestedOutput)) squadOutput.value = requestedOutput;

  const stepCopy = {
    1: {
      label: "Choose your path",
      title: "How do you want to create?",
      lede: "Choose one path now. You can invite other creators later."
    },
    2: {
      label: "Choose a starting point",
      soloTitle: "What kind of story will you begin?",
      squadTitle: "Choose how to co-create",
      soloLede: "Pick the easiest starting point. There is no wrong answer.",
      squadLede: "Create a private group with family or friends, or use their Story Code to join."
    },
    3: {
      label: "Meet the creator",
      title: "Give your story a first spark.",
      lede: "One sentence is enough. Story Coach will help you discover what happens next."
    }
  };

  const selectButton = (buttons, active, key) => {
    buttons.forEach((button) => {
      const selected = button.dataset[key] === active;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };

  const render = () => {
    selectButton(modeButtons, mode, "modeChoice");
    selectButton(originButtons, origin, "origin");
    selectButton(squadButtons, squadAction, "squadAction");
    selectButton(collaborationModeButtons, collaborationMode, "collaborationMode");
    selectButton(travelOutputButtons, squadOutput?.value || "book", "travelOutput");
    modePanel.hidden = step !== 1;
    soloOptions.hidden = step !== 2 || mode !== "solo";
    squadOptions.hidden = step !== 2 || mode !== "squad";
    if (storyThemeEntry) storyThemeEntry.hidden = step !== 2 || mode !== "squad" || squadAction === "join" || storyLanguage?.value !== "zh";
    setupFields.hidden = step !== 3;
    if (travelOutputChoice) travelOutputChoice.hidden = !storyTheme;
    const joining = mode === "squad" && squadAction === "join";
    const creatingSquad = mode === "squad" && !joining;
    collaborationModePickers.forEach((picker) => { picker.hidden = !creatingSquad; });
    ideaField.hidden = joining;
    codeField.hidden = !joining;
    if (squadCreateFields) squadCreateFields.hidden = !creatingSquad;
    if (characterBuilder) characterBuilder.hidden = storyTheme === "wuxia";
    if (squadTitle) squadTitle.required = creatingSquad;
    const displayNameField = displayName?.closest("label");
    if (displayNameField) displayNameField.hidden = Boolean(storyTheme);
    if (displayName) displayName.required = !storyTheme;
    if (workFileField) workFileField.hidden = joining || (mode !== "squad" && origin !== "work");
    creatorLevel?.closest("label")?.toggleAttribute("hidden", Boolean(storyTheme));
    storyLanguage?.closest("label")?.toggleAttribute("hidden", Boolean(storyTheme));
    const copy = stepCopy[step];
    stepCurrent.textContent = String(step);
    stepLabel.textContent = t(copy.label);
    stepTitle.textContent = storyTheme ? themeConfigs[storyTheme].heading : outputRoute ? (requestedOutput === "film" ? "开始共创一部电影" : "开始共创一本书") : t(step === 2 ? (mode === "solo" ? copy.soloTitle : copy.squadTitle) : copy.title);
    stepLede.textContent = storyTheme ? themeConfigs[storyTheme].lede : outputRoute ? "先确定创作方式和故事火花，创建后再邀请伙伴加入。" : t(step === 2 ? (mode === "solo" ? copy.soloLede : copy.squadLede) : copy.lede);
    progressFill.style.width = `${(step / 3) * 100}%`;
    backButton.hidden = step === 1;
    nextButton.hidden = step === 3;
    continueButton.hidden = step !== 3;
    continueButton.firstChild.textContent = `${storyTheme ? themeConfigs[storyTheme].cta : t(mode === "solo" ? "Enter my Solo Story" : joining ? "Join this Story Squad" : "Create my Story Squad")} `;
    error.textContent = "";
  };

  modeButtons.forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.modeChoice;
    render();
  }));

  originButtons.forEach((button) => button.addEventListener("click", () => {
    origin = button.dataset.origin;
    render();
  }));

  squadButtons.forEach((button) => button.addEventListener("click", () => {
    squadAction = button.dataset.squadAction;
    render();
  }));

  collaborationModeButtons.forEach((button) => button.addEventListener("click", () => {
    collaborationMode = button.dataset.collaborationMode;
    render();
  }));

  travelOutputButtons.forEach((button) => button.addEventListener("click", () => {
    if (squadOutput) squadOutput.value = button.dataset.travelOutput;
    render();
  }));

  storyThemeButtons.forEach((button) => button.addEventListener("click", () => {
    storyTheme = button.dataset.storyTheme;
    document.body.classList.add("travel-quick-mode");
    step = 3;
    storyLanguageTouched = true;
    applyStoryTheme();
    const uiQuery = requestedInterfaceLanguage ? `&uiLang=${encodeURIComponent(requestedInterfaceLanguage)}` : "";
    history.replaceState({}, "", `${location.pathname}?mode=squad&storyLang=zh${uiQuery}&theme=${encodeURIComponent(storyTheme)}`);
    render();
    stepTitle.focus({ preventScroll: true });
    window.StoriesLensAnalytics?.track("story_theme_squad_started", { language: "zh", theme: storyTheme });
  }));

  nextButton?.addEventListener("click", () => {
    step = Math.min(3, step + 1);
    render();
    stepTitle.focus({ preventScroll: true });
  });

  backButton?.addEventListener("click", () => {
    step = Math.max(1, step - 1);
    render();
    stepTitle.focus({ preventScroll: true });
  });

  storyLanguage?.addEventListener("change", () => {
    storyLanguageTouched = true;
    if (!squadStyleTouched && squadStyle) {
      squadStyle.value = storyLanguage.value === "zh" ? "ink-watercolor" : "storybook-watercolor";
      renderStylePicker();
    }
  });
  const renderStylePicker = () => {
    const active = styleCards.find((card) => card.dataset.styleCard === squadStyle?.value) || styleCards[0];
    styleCards.forEach((card) => {
      const selected = card === active;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });
    if (active && styleSummaryImage) styleSummaryImage.src = active.dataset.styleImage;
    if (active && styleSummaryLabel) styleSummaryLabel.textContent = t(active.dataset.styleLabel);
  };

  async function restoreHomepageSpark() {
    if (startParams.get("from") !== "homepage-magic") return;
    try {
      homepageSpark = window.StoriesLensSparkHandoff
        ? await window.StoriesLensSparkHandoff.load()
        : JSON.parse(sessionStorage.getItem("storieslens_home_spark") || "null");
    } catch (_error) {
      homepageSpark = null;
    }
    if (!homepageSpark) return;
    if (["en", "zh"].includes(homepageSpark.storyLanguage) && storyLanguage) {
      storyLanguage.value = homepageSpark.storyLanguage;
      storyLanguageTouched = true;
    }
    if (homepageSpark.seed && storySeed) storySeed.value = String(homepageSpark.seed).slice(0, storySeed.maxLength || 280);
    if (homepageSpark.dataUrl && /^data:image\/(?:webp|png|jpeg);base64,/.test(homepageSpark.dataUrl)) {
      origin = "picture";
      importedWork = {
        name: String(homepageSpark.name || "homepage-photo.webp").slice(0, 180),
        type: String(homepageSpark.dataUrl.match(/^data:([^;,]+)/)?.[1] || "image/webp"),
        kind: "image",
        content: homepageSpark.dataUrl,
        safetyReviewed: !homepageSpark.privateOnly,
        metadataRemoved: true,
        personalPhoto: homepageSpark.personalPhoto === true,
        convertedFromHeic: homepageSpark.convertedFromHeic === true,
        convertedOnServer: homepageSpark.convertedOnServer === true
      };
      try { sessionStorage.setItem("storieslens_imported_work", JSON.stringify(importedWork)); } catch (_error) { /* IndexedDB handoff remains available. */ }
      if (carriedSparkImage) carriedSparkImage.src = homepageSpark.dataUrl;
      if (carriedSpark) carriedSpark.hidden = false;
      if (workFileStatus) workFileStatus.textContent = t("Your homepage photo is ready. You do not need to upload it again.");
      if (carriedSparkNote) carriedSparkNote.textContent = t("Choose Solo Story or Story Squad. You will not upload it again.");
    }
    render();
  }
  squadStyle?.addEventListener("change", () => { squadStyleTouched = true; renderStylePicker(); });
  styleCards.forEach((card) => card.addEventListener("click", () => {
    if (!squadStyle) return;
    squadStyle.value = card.dataset.styleCard;
    squadStyleTouched = true;
    renderStylePicker();
    stylePicker?.removeAttribute("open");
  }));
  wuxiaStyleCards.forEach((card) => card.addEventListener("click", () => {
    selectedWuxiaStyle = card.dataset.wuxiaStyleCard;
    wuxiaTreatment = card.dataset.treatment || "";
    if (squadStyle) squadStyle.value = card.dataset.visualStyle;
    squadStyleTouched = true;
    wuxiaStyleCards.forEach((option) => {
      const selected = option.dataset.wuxiaStyleCard === selectedWuxiaStyle;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
  }));
  wuxiaPhotoJump?.addEventListener("click", () => {
    document.querySelector("[data-character-builder]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    characterFile?.focus();
  });
  wuxiaHintButtons.forEach((button) => button.addEventListener("click", () => {
    if (!storySeed) return;
    storySeed.value = button.dataset.wuxiaHint;
    wuxiaHintButtons.forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
    storySeed.focus();
    storySeed.setSelectionRange(storySeed.value.indexOf("________"), storySeed.value.indexOf("________") + 8);
  }));
  sportsHintButtons.forEach((button) => button.addEventListener("click", () => {
    if (!storySeed) return;
    storySeed.value = button.dataset.sportsHint;
    sportsHintButtons.forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
    storySeed.focus();
    const blank = storySeed.value.indexOf("________");
    if (blank >= 0) storySeed.setSelectionRange(blank, blank + 8);
  }));

  const clearStyleReference = () => {
    styleReference = null;
    sessionStorage.removeItem("storieslens_style_reference");
    if (styleReferenceFile) styleReferenceFile.value = "";
    if (styleReferenceImage) styleReferenceImage.removeAttribute("src");
    if (styleReferencePreview) styleReferencePreview.hidden = true;
    if (styleReferencePermission) styleReferencePermission.checked = false;
  };

  styleReferenceRemove?.addEventListener("click", clearStyleReference);
  styleReferenceFile?.addEventListener("change", async () => {
    const file = styleReferenceFile.files?.[0];
    clearStyleReference();
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      error.textContent = t("Choose an image smaller than 15 MB.");
      return;
    }
    if (!window.StoriesLensArtworkSafety?.isSupportedImage(file)) {
      error.textContent = t("Choose a JPG, PNG, WEBP, HEIC, or HEIF image.");
      return;
    }
    try {
      const safeArtwork = await window.StoriesLensArtworkSafety.processArtwork(file);
      if (safeArtwork.review?.checks?.realPerson) {
        error.textContent = t("For a photo of a person, use the Main Character section below so adult permission and identity protection can be applied.");
        return;
      }
      styleReference = { dataUrl: safeArtwork.dataUrl, type: safeArtwork.type, metadataRemoved: true, personalPhoto: false };
      sessionStorage.setItem("storieslens_style_reference", JSON.stringify(styleReference));
      if (styleReferenceImage) styleReferenceImage.src = safeArtwork.dataUrl;
      if (styleReferenceName) styleReferenceName.textContent = file.name;
      if (styleReferenceStatus) styleReferenceStatus.textContent = safeArtwork.convertedFromHeic
        ? t(safeArtwork.convertedOnServer ? "HEIC securely converted; the original was not stored." : "HEIC converted and metadata removed on this device.")
        : t("Metadata removed on this device. Yu will use only high-level visual traits.");
      if (styleReferencePreview) styleReferencePreview.hidden = false;
      error.textContent = "";
    } catch (uploadError) {
      error.textContent = t(uploadError.reasonCode === "unsafe_content" ? "This image did not pass the safe-content review." : "This image could not be prepared safely. Try another image.");
    }
  });
  ageGroup?.addEventListener("change", renderAgeGate);

  const stopYuVoice = () => {
    window.speechSynthesis?.cancel();
    [...yuReadButtons, yuReadPageButton].filter(Boolean).forEach((button) => button.classList.remove("is-speaking"));
  };

  const findYuVoice = (language) => {
    const naturalVoice = window.StoriesLensNaturalVoice?.preferredVoice?.(language === "zh" ? "zh-CN" : "en-US");
    if (naturalVoice) return naturalVoice;
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const prefix = language === "zh" ? "zh" : "en";
    const languageVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(prefix));
    const magneticMaleNames = language === "zh"
      ? /yunxi|yunjian|yunyang|kangkang|yong|li-mu|male|普通话.*男/i
      : /daniel|alex|aaron|arthur|fred|reed|eddy|rocko|evan|lee|rishi|male/i;
    return languageVoices.find((voice) => /natural|neural|online|premium|enhanced/i.test(`${voice.name} ${voice.voiceURI}`))
      || languageVoices.find((voice) => magneticMaleNames.test(`${voice.name} ${voice.voiceURI}`))
      || languageVoices[0]
      || null;
  };

  const speakAsYu = (text, button) => {
    if (!("speechSynthesis" in window) || !text) return;
    const wasSpeaking = button?.classList.contains("is-speaking");
    stopYuVoice();
    if (wasSpeaking) return;
    const language = window.StoriesLensI18n?.locale === "zh" ? "zh" : "en";
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = language === "zh" ? "zh-CN" : "en-US";
    if (window.StoriesLensNaturalVoice) window.StoriesLensNaturalVoice.configureUtterance(utterance, lang);
    else {
      utterance.lang = lang;
      utterance.rate = language === "zh" ? 0.92 : 0.93;
      utterance.pitch = language === "zh" ? 0.96 : 0.97;
      utterance.volume = 1;
      utterance.voice = findYuVoice(language);
    }
    button?.classList.add("is-speaking");
    utterance.onend = () => button?.classList.remove("is-speaking");
    utterance.onerror = () => button?.classList.remove("is-speaking");
    window.speechSynthesis.speak(utterance);
  };

  yuReadButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    speakAsYu(window.StoriesLensI18n?.locale === "zh" ? button.dataset.readZh : button.dataset.readEn, button);
  }));

  yuReadPageButton?.addEventListener("click", () => {
    const pageGuide = window.StoriesLensI18n?.locale === "zh"
      ? "你好，我是羽大师。先告诉我是谁在创作，再选择你喜欢的创作方式。亲友共创时，请给故事起名，选择做成书或电影，再挑一种画风。最后，你可以打字、按住说话，或上传已有作品。"
      : "Hello, I’m Yu. First tell me who is creating, then choose how you like to create and your story language. For a Story Squad, name your story, choose a book or film, and pick one picture style. Finally, type an idea, hold to speak, or add something you already made.";
    speakAsYu(pageGuide, yuReadPageButton);
  });

  window.addEventListener("beforeunload", stopYuVoice);

  const resetSparkSpeakUi = () => {
    sparkSpeak.classList.remove("is-listening");
    sparkSpeak.setAttribute("aria-pressed", "false");
    sparkSpeak.textContent = t("● Hold to Speak");
    if (sparkVoiceStatus && storySeed.value.trim()) sparkVoiceStatus.textContent = t("Voice converted to editable text. Live audio was not stored.");
  };

  const beginSparkRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      sparkListeningRequested = false;
      if (sparkVoiceStatus) sparkVoiceStatus.textContent = t("Voice typing is unavailable in this browser. You can still type or upload your work.");
      storySeed?.focus();
      return;
    }
    if (sparkRecognition || !sparkListeningRequested) return;
    const original = storySeed.value.trim();
    sparkRecognition = new SpeechRecognition();
    sparkRecognition.lang = storyLanguage?.value === "zh" ? "zh-CN" : "en-US";
    sparkRecognition.interimResults = true;
    sparkRecognition.continuous = true;
    sparkSpeak.classList.add("is-listening");
    sparkSpeak.setAttribute("aria-pressed", "true");
    sparkSpeak.textContent = sparkPointerSession ? t("● Listening… release to stop") : t("■ Stop");
    if (sparkVoiceStatus) sparkVoiceStatus.textContent = t("Listening… keep holding while you speak. Brief pauses are okay.");
    sparkRecognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0].transcript).join("");
      storySeed.value = `${original}${original ? " " : ""}${spoken}`.slice(0, storySeed.maxLength || 280);
      storySeed.dispatchEvent(new Event("input", { bubbles: true }));
    };
    sparkRecognition.onerror = (event) => {
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
        sparkListeningRequested = false;
        sparkPointerSession = false;
      }
      if (event.error !== "no-speech" && sparkVoiceStatus) sparkVoiceStatus.textContent = t("I could not hear that clearly. Hold the button to try again, or type your idea.");
    };
    sparkRecognition.onend = () => {
      sparkRecognition = null;
      if (sparkListeningRequested) {
        clearTimeout(sparkRestartTimer);
        sparkRestartTimer = setTimeout(beginSparkRecognition, 120);
        return;
      }
      resetSparkSpeakUi();
    };
    sparkRecognition.start();
  };

  const startSparkListening = (pointerSession = false) => {
    if (sparkListeningRequested) return;
    sparkPointerSession = pointerSession;
    sparkListeningRequested = true;
    beginSparkRecognition();
  };

  const stopSparkListening = () => {
    sparkListeningRequested = false;
    sparkPointerSession = false;
    clearTimeout(sparkRestartTimer);
    if (sparkRecognition) sparkRecognition.stop();
    else resetSparkSpeakUi();
  };

  sparkSpeak?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    suppressSparkClick = true;
    sparkSpeak.setPointerCapture?.(event.pointerId);
    startSparkListening(true);
  });

  ["pointerup", "pointercancel"].forEach((eventName) => sparkSpeak?.addEventListener(eventName, (event) => {
    if (!sparkPointerSession) return;
    event.preventDefault();
    stopSparkListening();
  }));

  sparkSpeak?.addEventListener("click", () => {
    if (suppressSparkClick) {
      suppressSparkClick = false;
      return;
    }
    if (sparkListeningRequested) stopSparkListening();
    else startSparkListening(false);
  });

  const resetTitleSpeakUi = () => {
    titleSpeak?.classList.remove("is-listening");
    titleSpeak?.setAttribute("aria-pressed", "false");
    if (titleSpeak) titleSpeak.textContent = t("● Hold to Speak");
    if (titleVoiceStatus && squadTitle?.value.trim()) titleVoiceStatus.textContent = t("Voice converted to an editable story name. Live audio was not stored.");
  };

  const beginTitleRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      titleListeningRequested = false;
      if (titleVoiceStatus) titleVoiceStatus.textContent = t("Voice typing is unavailable in this browser. You can still type your story name.");
      squadTitle?.focus();
      return;
    }
    if (titleRecognition || !titleListeningRequested) return;
    const original = squadTitle?.value.trim() || "";
    titleRecognition = new SpeechRecognition();
    titleRecognition.lang = storyLanguage?.value === "zh" ? "zh-CN" : "en-US";
    titleRecognition.interimResults = true;
    titleRecognition.continuous = true;
    titleSpeak?.classList.add("is-listening");
    titleSpeak?.setAttribute("aria-pressed", "true");
    if (titleSpeak) titleSpeak.textContent = titlePointerSession ? t("● Listening… release to stop") : t("■ Stop");
    if (titleVoiceStatus) titleVoiceStatus.textContent = t("Listening… say your story name.");
    titleRecognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0].transcript).join("");
      if (squadTitle) {
        squadTitle.value = `${original}${original ? " " : ""}${spoken}`.slice(0, squadTitle.maxLength || 120);
        squadTitle.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    titleRecognition.onerror = (event) => {
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
        titleListeningRequested = false;
        titlePointerSession = false;
      }
      if (event.error !== "no-speech" && titleVoiceStatus) titleVoiceStatus.textContent = t("I could not hear that clearly. Hold the button to try again, or type your story name.");
    };
    titleRecognition.onend = () => {
      titleRecognition = null;
      if (titleListeningRequested) {
        clearTimeout(titleRestartTimer);
        titleRestartTimer = setTimeout(beginTitleRecognition, 120);
        return;
      }
      resetTitleSpeakUi();
    };
    titleRecognition.start();
  };

  const startTitleListening = (pointerSession = false) => {
    if (titleListeningRequested) return;
    titlePointerSession = pointerSession;
    titleListeningRequested = true;
    beginTitleRecognition();
  };

  const stopTitleListening = () => {
    titleListeningRequested = false;
    titlePointerSession = false;
    clearTimeout(titleRestartTimer);
    if (titleRecognition) titleRecognition.stop();
    else resetTitleSpeakUi();
  };

  titleSpeak?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    suppressTitleClick = true;
    titleSpeak.setPointerCapture?.(event.pointerId);
    startTitleListening(true);
  });

  ["pointerup", "pointercancel"].forEach((eventName) => titleSpeak?.addEventListener(eventName, (event) => {
    if (!titlePointerSession) return;
    event.preventDefault();
    stopTitleListening();
  }));

  titleSpeak?.addEventListener("click", () => {
    if (suppressTitleClick) {
      suppressTitleClick = false;
      return;
    }
    if (titleListeningRequested) stopTitleListening();
    else startTitleListening(false);
  });

  const resetCharacterSpeakUi = () => {
    characterSpeak?.classList.remove("is-listening");
    characterSpeak?.setAttribute("aria-pressed", "false");
    if (characterSpeak) characterSpeak.textContent = t("● Hold to Speak");
    if (characterVoiceStatus && squadCharacterRules?.value.trim()) characterVoiceStatus.textContent = t("Voice converted to editable character notes. Live audio was not stored.");
  };

  const beginCharacterRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      characterListeningRequested = false;
      if (characterVoiceStatus) characterVoiceStatus.textContent = t("Voice typing is unavailable in this browser. You can still type or add a picture.");
      squadCharacterRules?.focus();
      return;
    }
    if (characterRecognition || !characterListeningRequested) return;
    const original = squadCharacterRules?.value.trim() || "";
    characterRecognition = new SpeechRecognition();
    characterRecognition.lang = storyLanguage?.value === "zh" ? "zh-CN" : "en-US";
    characterRecognition.interimResults = true;
    characterRecognition.continuous = true;
    characterSpeak?.classList.add("is-listening");
    characterSpeak?.setAttribute("aria-pressed", "true");
    if (characterSpeak) characterSpeak.textContent = characterPointerSession ? t("● Listening… release to stop") : t("■ Stop");
    if (characterVoiceStatus) characterVoiceStatus.textContent = t("Listening… describe the hero and their world.");
    characterRecognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0].transcript).join("");
      if (squadCharacterRules) squadCharacterRules.value = `${original}${original ? " " : ""}${spoken}`.slice(0, squadCharacterRules.maxLength || 1200);
    };
    characterRecognition.onerror = (event) => {
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
        characterListeningRequested = false;
        characterPointerSession = false;
      }
      if (event.error !== "no-speech" && characterVoiceStatus) characterVoiceStatus.textContent = t("I could not hear that clearly. Hold the button to try again, or type your character idea.");
    };
    characterRecognition.onend = () => {
      characterRecognition = null;
      if (characterListeningRequested) {
        clearTimeout(characterRestartTimer);
        characterRestartTimer = setTimeout(beginCharacterRecognition, 120);
        return;
      }
      resetCharacterSpeakUi();
    };
    characterRecognition.start();
  };

  const startCharacterListening = (pointerSession = false) => {
    if (characterListeningRequested) return;
    characterPointerSession = pointerSession;
    characterListeningRequested = true;
    beginCharacterRecognition();
  };

  const stopCharacterListening = () => {
    characterListeningRequested = false;
    characterPointerSession = false;
    clearTimeout(characterRestartTimer);
    if (characterRecognition) characterRecognition.stop();
    else resetCharacterSpeakUi();
  };

  characterSpeak?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    suppressCharacterClick = true;
    characterSpeak.setPointerCapture?.(event.pointerId);
    startCharacterListening(true);
  });
  ["pointerup", "pointercancel"].forEach((eventName) => characterSpeak?.addEventListener(eventName, (event) => {
    if (!characterPointerSession) return;
    event.preventDefault();
    stopCharacterListening();
  }));
  characterSpeak?.addEventListener("click", () => {
    if (suppressCharacterClick) {
      suppressCharacterClick = false;
      return;
    }
    if (characterListeningRequested) stopCharacterListening();
    else startCharacterListening(false);
  });

  characterFile?.addEventListener("change", async () => {
    const file = characterFile.files?.[0];
    characterReference = null;
    sessionStorage.removeItem("storieslens_character_reference");
    if (characterPreviewImage) {
      characterPreviewImage.hidden = true;
      characterPreviewImage.removeAttribute("src");
    }
    if (characterPreviewEmpty) characterPreviewEmpty.hidden = false;
    if (characterPhotoConsent) characterPhotoConsent.hidden = true;
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      characterFile.value = "";
      error.textContent = t("Choose an image smaller than 15 MB.");
      return;
    }
    if (!window.StoriesLensArtworkSafety?.isSupportedImage(file)) {
      characterFile.value = "";
      error.textContent = t("Choose a JPG, PNG, WEBP, HEIC, or HEIF image.");
      return;
    }
    if (characterFileStatus) characterFileStatus.textContent = t("Removing location and camera information and checking image safety…");
    try {
      const safeArtwork = await window.StoriesLensArtworkSafety.processArtwork(file);
      characterReference = {
        dataUrl: safeArtwork.dataUrl,
        type: safeArtwork.type,
        metadataRemoved: true,
        personalPhoto: Boolean(safeArtwork.review?.checks?.realPerson),
        convertedFromHeic: Boolean(safeArtwork.convertedFromHeic),
        convertedOnServer: Boolean(safeArtwork.convertedOnServer)
      };
      sessionStorage.setItem("storieslens_character_reference", JSON.stringify(characterReference));
      if (characterPreviewImage) {
        characterPreviewImage.src = safeArtwork.dataUrl;
        characterPreviewImage.hidden = false;
      }
      if (characterPreviewEmpty) characterPreviewEmpty.hidden = true;
      if (characterPhotoConsent) characterPhotoConsent.hidden = !characterReference.personalPhoto;
      if (characterFileStatus) characterFileStatus.textContent = characterReference.personalPhoto
        ? t("Personal photo detected. A metadata-free copy passed safety review; it is not saved to the story until adult permission is completed.")
        : t("Reference ready. Metadata was removed on this device.");
      error.textContent = "";
    } catch (uploadError) {
      characterFile.value = "";
      error.textContent = t(uploadError.reasonCode === "unsafe_content" ? "This image did not pass the safe-content review." : "This image could not be prepared safely. Try another image.");
      if (characterFileStatus) characterFileStatus.textContent = t("Reference was not added.");
    }
  });

  workFile?.addEventListener("change", async () => {
    const file = workFile.files?.[0];
    importedWork = null;
    if (!file) return;
    const isText = file.type === "text/plain" || file.type === "text/markdown" || /\.(txt|md|docx)$/i.test(file.name);
    const isImage = Boolean(window.StoriesLensArtworkSafety?.isSupportedImage(file));
    const maximumSize = isImage ? 15 * 1024 * 1024 : 7 * 1024 * 1024;
    if (file.size > maximumSize) {
      workFile.value = "";
      error.textContent = t(isImage ? "Choose an image smaller than 15 MB." : "Choose a file smaller than 7 MB.");
      return;
    }
    if (!isText && !isImage) {
      workFile.value = "";
      error.textContent = t("Choose a JPG, PNG, WEBP, HEIC, HEIF, DOCX, TXT, or MD file.");
      return;
    }
    let content;
    let storedName = file.name;
    let storedType = file.type || (isText ? "text/plain" : "image");
    let artworkReview = null;
    if (isText) {
      try {
        content = window.StoriesLensWritingImport ? await window.StoriesLensWritingImport.readFile(file) : await file.text();
      } catch (_readError) {
        workFile.value = "";
        error.textContent = t("This writing file could not be read. Try DOCX, TXT, or MD.");
        return;
      }
    } else {
      if (workFileStatus) workFileStatus.textContent = t("Removing metadata and checking artwork safety…");
      try {
        if (!window.StoriesLensArtworkSafety) throw Object.assign(new Error("review_unavailable"), { reasonCode: "review_unavailable" });
        const safeArtwork = await window.StoriesLensArtworkSafety.processArtwork(file);
        content = safeArtwork.dataUrl;
        storedName = safeArtwork.review?.checks?.realPerson ? "personal-photo.webp" : "artwork.webp";
        storedType = safeArtwork.type;
        artworkReview = { safetyReviewed: true, metadataRemoved: true, personalPhoto: Boolean(safeArtwork.review?.checks?.realPerson), convertedFromHeic: Boolean(safeArtwork.convertedFromHeic), convertedOnServer: Boolean(safeArtwork.convertedOnServer) };
      } catch (uploadError) {
        workFile.value = "";
        const message = uploadError.reasonCode === "personal_name" ? "A visible personal name was detected. Please cover or remove it and try again." : uploadError.reasonCode === "school_information" ? "School information was detected. Please cover or remove it and try again." : uploadError.reasonCode === "contact_information" ? "Contact information was detected. Please cover or remove it and try again." : uploadError.reasonCode === "identity_document" ? "Identity documents cannot be uploaded." : uploadError.reasonCode === "unsafe_content" ? "This image did not pass the safe-content review." : "Image upload is paused because the safety review is unavailable. You can still write or speak.";
        error.textContent = t(message);
        if (workFileStatus) workFileStatus.textContent = t("Artwork was not added.");
        return;
      }
    }
    if (isText && window.StoriesLensSafety && !window.StoriesLensSafety.check(content).safe) {
      workFile.value = "";
      error.textContent = t(window.StoriesLensSafety.message);
      return;
    }
    importedWork = { name: storedName, type: storedType, kind: isText ? "text" : "image", content, ...(artworkReview || {}) };
    try { sessionStorage.setItem("storieslens_imported_work", JSON.stringify(importedWork)); } catch (_error) {
      importedWork = null;
      error.textContent = t("This file is too large to keep on this device. Choose a smaller one.");
      return;
    }
    if (isText && !storySeed.value.trim()) storySeed.value = String(content).trim().slice(0, storySeed.maxLength || 280);
    if (workFileStatus) workFileStatus.textContent = isText
      ? `${t("Ready")}: ${file.name}`
      : (artworkReview?.convertedFromHeic
        ? t(artworkReview.convertedOnServer ? "HEIC securely converted · original not stored · private by default" : "HEIC converted on this device · original not uploaded · private by default")
        : t("Safety check passed · personal metadata removed · private by default"));
    error.textContent = "";
  });

  window.addEventListener("storieslens:locale", (event) => {
    if (!storyLanguageTouched && storyLanguage) storyLanguage.value = event.detail.locale === "zh" ? "zh" : "en";
    render();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = displayName.value.trim() || (mode === "squad" && storyTheme ? (storyTheme === "wuxia" ? "江湖伙伴" : "共创伙伴") : "");
    const code = storyCode.value.trim().toUpperCase();
    const seed = storySeed.value.trim();
    const title = squadTitle?.value.trim() || "";
    const generateAnchor = Boolean(event.submitter?.matches("[data-character-generate]"));

    if (mode === "solo" && origin === "work" && !importedWork && !seed) {
      error.textContent = t("Choose a work file or paste a short excerpt so Story Coach knows where to begin.");
      workFile?.focus();
      return;
    }

    if (mode === "squad" && squadAction === "create" && themeConfigs[storyTheme]?.requirePhoto && !importedWork) {
      error.textContent = storyTheme === "sports" ? "请先上传一张已获监护人许可的运动照片，再开始团队共创。" : "请先上传一张旅行照，再开始旅行故事共创。";
      workFile?.focus();
      return;
    }

    if (seed && window.StoriesLensSafety && !window.StoriesLensSafety.check(seed).safe) {
      error.textContent = t(window.StoriesLensSafety.message);
      storySeed.focus();
      return;
    }

    if (ageGroup?.value === "under18" && !supervisionConfirm?.checked) {
      error.textContent = t("An adult must confirm supervision before a creator under 18 can continue.");
      supervisionConfirm?.focus();
      return;
    }

    if (!name) {
      error.textContent = t("Add a first name or nickname so the story can credit its creator.");
      displayName.focus();
      return;
    }

    if (mode === "squad" && squadAction === "join" && !code) {
      error.textContent = t("Enter the Story Code from your friend.");
      storyCode.focus();
      return;
    }

    if (mode === "squad" && squadAction === "create" && !title) {
      error.textContent = t("Give your Story Squad a title.");
      squadTitle?.focus();
      return;
    }

    if (generateAnchor && characterReference?.personalPhoto) {
      if (!characterConsentPerson?.checked || !characterConsentProcessing?.checked || !characterGuardianName?.value.trim() || !characterGuardianRelationship?.value.trim()) {
        error.textContent = t("An adult must complete the photo permission before this personal photo can be used for AI creation.");
        characterPhotoConsent?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      characterReference.consent = {
        guardianName: characterGuardianName.value.trim(),
        relationship: characterGuardianRelationship.value.trim(),
        confirmedAdult: true,
        approvedPrivateMedia: true,
        approvedPersonalPhoto: true,
        acknowledgedRegionalProcessing: true
      };
      sessionStorage.setItem("storieslens_character_reference", JSON.stringify(characterReference));
    }

    if (generateAnchor && styleReference && !styleReferencePermission?.checked) {
      error.textContent = t("Confirm that you made the style reference or have permission to use it before generation.");
      styleReferencePreview?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const setup = { mode, origin, squadAction, theme: storyTheme, ageGroup: ageGroup?.value || "adult", supervisionConfirmed: ageGroup?.value === "under18" ? Boolean(supervisionConfirm?.checked) : false, privacy: "private", guardianApprovalRequired: ageGroup?.value === "under18", creatorLevel: creatorLevel?.value || "independent", storyLanguage: storyLanguage?.value || "en", displayName: name, seed, code, squadTitle: title, squadOutputType: squadOutput?.value || "book", squadVisualStyle: squadStyle?.value || (storyLanguage?.value === "zh" ? "ink-watercolor" : "storybook-watercolor"), squadCharacterRules: [squadCharacterRules?.value.trim(), storyTheme === "wuxia" ? wuxiaTreatment : ""].filter(Boolean).join(" "), squadGenerateAnchor: generateAnchor, characterReference: characterReference ? { type: characterReference.type, metadataRemoved: true, personalPhoto: characterReference.personalPhoto === true } : null, styleReference: styleReference ? { type: styleReference.type, metadataRemoved: true, permissionConfirmed: styleReferencePermission?.checked === true } : null, importedWork: importedWork ? { name: importedWork.name, type: importedWork.type, kind: importedWork.kind, safetyReviewed: importedWork.safetyReviewed === true, metadataRemoved: importedWork.metadataRemoved === true, personalPhoto: importedWork.personalPhoto === true } : null, createdAt: new Date().toISOString() };
    setup.collaborationMode = collaborationMode;
    localStorage.setItem("storieslens_creator_setup", JSON.stringify(setup));
    window.StoriesLensAnalytics?.track("creator_setup_completed", { mode, origin, squadAction, ageGroup: setup.ageGroup, supervisionConfirmed: setup.supervisionConfirmed, creatorLevel: setup.creatorLevel, storyLanguage: setup.storyLanguage });
    const languageQuery = `storyLang=${encodeURIComponent(setup.storyLanguage)}${requestedInterfaceLanguage ? `&uiLang=${encodeURIComponent(requestedInterfaceLanguage)}` : ""}`;

    if (mode === "solo") {
      window.location.href = homepageSpark
        ? `solo-story?mode=solo&from=homepage-magic&${languageQuery}`
        : `solo-story?mode=solo&from=start&${languageQuery}`;
      return;
    }

    const resumePath = squadAction === "join"
      ? `squad-board.html?action=join&resume=1&code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}&${languageQuery}`
      : `squad-board.html?action=create&resume=1&name=${encodeURIComponent(name)}&${languageQuery}`;
    let authenticated = false;
    try { authenticated = Boolean((await window.StoriesLensPlatform?.getSession?.())?.authenticated); } catch (_sessionError) {}
    window.location.href = authenticated ? resumePath : `login.html?return=${encodeURIComponent(resumePath)}`;
  });

  renderAgeGate();
  renderStylePicker();
  render();
  void restoreHomepageSpark();
})();
