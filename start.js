(() => {
  const form = document.querySelector("[data-start-form]");
  const modePanel = document.querySelector('[data-step-panel="1"]');
  const modeButtons = [...document.querySelectorAll("[data-mode-choice]")];
  const originButtons = [...document.querySelectorAll("[data-origin]")];
  const squadButtons = [...document.querySelectorAll("[data-squad-action]")];
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
  const squadOutput = document.querySelector("[data-squad-output]");
  const squadStyle = document.querySelector("[data-squad-style]");
  const squadCharacterRules = document.querySelector("[data-squad-character-rules]");
  const error = document.querySelector("[data-form-error]");
  const t = (text) => window.StoriesLensI18n?.t(text) || text;

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
  let mode = requestedMode === "squad" ? "squad" : "solo";
  let step = requestedDna && (requestedMode === "solo" || requestedMode === "squad") ? 3 : requestedMode === "solo" || requestedMode === "squad" ? 2 : 1;
  const sourceToOrigin = { work: "work", tell: "memory", inspiration: "imagination", picture: "picture", text: "work", voice: "memory", book: "imagination", movie: "imagination", idea: "imagination" };
  let origin = sourceToOrigin[requestedSource] || "imagination";
  let squadAction = "create";
  let importedWork = null;
  let sparkRecognition = null;
  let sparkListeningRequested = false;
  let sparkPointerSession = false;
  let suppressSparkClick = false;
  let sparkRestartTimer = null;
  let storyLanguageTouched = ["en", "zh"].includes(requestedStoryLanguage);
  let squadStyleTouched = false;

  if (storyLanguage) storyLanguage.value = storyLanguageTouched ? requestedStoryLanguage : window.StoriesLensI18n?.locale === "zh" ? "zh" : "en";
  if (storySeed && requestedDna) storySeed.value = requestedDna;

  const stepCopy = {
    1: {
      label: "Choose your path",
      title: "How do you want to create?",
      lede: "Choose one path now. You can invite other creators later."
    },
    2: {
      label: "Choose a starting point",
      soloTitle: "What kind of story will you begin?",
      squadTitle: "How will you join the adventure?",
      soloLede: "Pick the easiest starting point. There is no wrong answer.",
      squadLede: "Start a private squad with family or friends, or enter the Story Code they sent you."
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
    modePanel.hidden = step !== 1;
    soloOptions.hidden = step !== 2 || mode !== "solo";
    squadOptions.hidden = step !== 2 || mode !== "squad";
    setupFields.hidden = step !== 3;
    const joining = mode === "squad" && squadAction === "join";
    const creatingSquad = mode === "squad" && !joining;
    ideaField.hidden = joining;
    codeField.hidden = !joining;
    if (squadCreateFields) squadCreateFields.hidden = !creatingSquad;
    if (squadTitle) squadTitle.required = creatingSquad;
    if (workFileField) workFileField.hidden = joining || (mode !== "squad" && origin !== "work");
    const copy = stepCopy[step];
    stepCurrent.textContent = String(step);
    stepLabel.textContent = t(copy.label);
    stepTitle.textContent = t(step === 2 ? (mode === "solo" ? copy.soloTitle : copy.squadTitle) : copy.title);
    stepLede.textContent = t(step === 2 ? (mode === "solo" ? copy.soloLede : copy.squadLede) : copy.lede);
    progressFill.style.width = `${(step / 3) * 100}%`;
    backButton.hidden = step === 1;
    nextButton.hidden = step === 3;
    continueButton.hidden = step !== 3;
    continueButton.firstChild.textContent = `${t(mode === "solo" ? "Enter my Solo Story" : joining ? "Join this Story Squad" : "Create my Story Squad")} `;
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
    if (!squadStyleTouched && squadStyle) squadStyle.value = storyLanguage.value === "zh" ? "ink-watercolor" : "storybook-watercolor";
  });
  squadStyle?.addEventListener("change", () => { squadStyleTouched = true; });
  ageGroup?.addEventListener("change", renderAgeGate);

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
        artworkReview = { safetyReviewed: true, metadataRemoved: true, personalPhoto: Boolean(safeArtwork.review?.checks?.realPerson), convertedFromHeic: Boolean(safeArtwork.convertedFromHeic) };
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
      : (artworkReview?.convertedFromHeic ? t("HEIC converted on this device · original not uploaded · private by default") : t("Safety check passed · personal metadata removed · private by default"));
    error.textContent = "";
  });

  window.addEventListener("storieslens:locale", (event) => {
    if (!storyLanguageTouched && storyLanguage) storyLanguage.value = event.detail.locale === "zh" ? "zh" : "en";
    render();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = displayName.value.trim();
    const code = storyCode.value.trim().toUpperCase();
    const seed = storySeed.value.trim();
    const title = squadTitle?.value.trim() || "";

    if (mode === "solo" && origin === "work" && !importedWork && !seed) {
      error.textContent = t("Choose a work file or paste a short excerpt so Story Coach knows where to begin.");
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

    const setup = { mode, origin, squadAction, ageGroup: ageGroup?.value || "adult", supervisionConfirmed: ageGroup?.value === "under18" ? Boolean(supervisionConfirm?.checked) : false, privacy: "private", guardianApprovalRequired: ageGroup?.value === "under18", creatorLevel: creatorLevel?.value || "independent", storyLanguage: storyLanguage?.value || "en", displayName: name, seed, code, squadTitle: title, squadOutputType: squadOutput?.value || "book", squadVisualStyle: squadStyle?.value || (storyLanguage?.value === "zh" ? "ink-watercolor" : "storybook-watercolor"), squadCharacterRules: squadCharacterRules?.value.trim() || "", importedWork: importedWork ? { name: importedWork.name, type: importedWork.type, kind: importedWork.kind, safetyReviewed: importedWork.safetyReviewed === true, metadataRemoved: importedWork.metadataRemoved === true, personalPhoto: importedWork.personalPhoto === true } : null, createdAt: new Date().toISOString() };
    localStorage.setItem("storieslens_creator_setup", JSON.stringify(setup));
    window.StoriesLensAnalytics?.track("creator_setup_completed", { mode, origin, squadAction, ageGroup: setup.ageGroup, supervisionConfirmed: setup.supervisionConfirmed, creatorLevel: setup.creatorLevel, storyLanguage: setup.storyLanguage });
    const languageQuery = `storyLang=${encodeURIComponent(setup.storyLanguage)}`;

    if (mode === "solo") {
      window.location.href = `visual-write.html?mode=free&from=start&${languageQuery}`;
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
  render();
})();
