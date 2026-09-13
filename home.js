(() => {
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const closeMenu = () => {
    menuButton?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
  };

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("is-open", !open);
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  window.addEventListener("scroll", () => header?.classList.toggle("is-scrolled", window.scrollY > 12), { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const launchpad = document.querySelector("[data-story-launchpad]");
  if (launchpad) {
    const sourceButtons = [...launchpad.querySelectorAll("[data-source-choice]")];
    const sourceLabel = launchpad.querySelector("[data-source-label]");
    const sourceInput = launchpad.querySelector("[data-source-input]");
    const storyLanguage = launchpad.querySelector("[data-launch-language]");
    const writingLanguageEntries = [...document.querySelectorAll("[data-writing-language-entry]")];
    const homeLanguageButtons = [...launchpad.querySelectorAll("[data-home-language]")];
    const voiceButton = launchpad.querySelector("[data-voice-input]");
    const voiceLabel = launchpad.querySelector("[data-voice-label]");
    const voicePrivacy = launchpad.querySelector("[data-voice-privacy]");
    const workUpload = launchpad.querySelector("[data-work-upload]");
    const workFile = launchpad.querySelector("[data-work-file]");
    const workFileStatus = launchpad.querySelector("[data-work-file-status]");
    const workPreview = launchpad.querySelector("[data-work-preview]");
    const textFile = launchpad.querySelector("[data-text-file]");
    const submitButton = launchpad.querySelector("[data-launch-submit]");
    const error = launchpad.querySelector("[data-launchpad-error]");
    const t = (text) => window.StoriesLensI18n?.t(text) || text;
    const sourceCopy = {
      work: ["Upload your artwork", "Add a few words about it if you want—optional"],
      tell: ["Write it down or tell Story Coach", "A scene, memory, draft, or idea…"],
      inspiration: ["What have you enjoyed lately?", "A book or film you love—or the moment that stayed with you"]
    };
    let source = "work";
    let importedWork = null;

    const updateLaunchButton = () => {
      if (submitButton) submitButton.disabled = !importedWork && !sourceInput.value.trim();
    };

    const renderWritingLanguageEntries = () => {
      const selectedLanguage = storyLanguage?.value === "zh" ? "zh" : "en";
      writingLanguageEntries.forEach((button) => {
        const selected = button.dataset.writingLanguageEntry === selectedLanguage;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      homeLanguageButtons.forEach((button) => {
        const selected = button.dataset.homeLanguage === selectedLanguage;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    };

    const renderSource = () => {
      launchpad.dataset.source = source;
      sourceButtons.forEach((button) => {
        const selected = button.dataset.sourceChoice === source;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      if (sourceButtons.length) {
        sourceLabel.textContent = t(sourceCopy[source][0]);
        sourceInput.placeholder = t(sourceCopy[source][1]);
      }
      if (workUpload) workUpload.hidden = source !== "work";
      updateLaunchButton();
      error.textContent = "";
    };

    sourceInput?.addEventListener("input", updateLaunchButton);

    textFile?.addEventListener("change", async () => {
      const file = textFile.files?.[0];
      if (!file) return;
      if (file.size > 100 * 1024) {
        textFile.value = "";
        error.textContent = t("Choose a TXT or Markdown file smaller than 100 KB.");
        return;
      }
      try {
        const text = (await file.text()).trim();
        if (!text) throw new Error("empty_text");
        sourceInput.value = text.slice(0, sourceInput.maxLength || 1200);
        sourceInput.dispatchEvent(new Event("input", { bubbles: true }));
        error.textContent = "";
      } catch (_error) {
        error.textContent = t("We could not read that text file. Try TXT or Markdown.");
      } finally {
        textFile.value = "";
      }
    });

    workFile?.addEventListener("change", async () => {
      const file = workFile.files?.[0];
      importedWork = null;
      if (workPreview) {
        workPreview.hidden = true;
        workPreview.removeAttribute("src");
      }
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        workFile.value = "";
        error.textContent = t("Choose a file smaller than 2 MB.");
        return;
      }
      const isImage = Boolean(window.StoriesLensArtworkSafety?.isSupportedImage(file));
      if (!isImage) {
        workFile.value = "";
        error.textContent = t("Choose an artwork file in JPG, PNG, WEBP, HEIC, or HEIF format.");
        return;
      }
      if (workFileStatus) workFileStatus.textContent = t("Removing metadata and checking artwork safety…");
      try {
        if (!window.StoriesLensArtworkSafety) throw Object.assign(new Error("review_unavailable"), { reasonCode: "review_unavailable" });
        const safeArtwork = await window.StoriesLensArtworkSafety.processArtwork(file);
        importedWork = { name: "artwork.webp", type: safeArtwork.type, kind: "image", content: safeArtwork.dataUrl, safetyReviewed: true, metadataRemoved: true };
        sessionStorage.setItem("storieslens_imported_work", JSON.stringify(importedWork));
        if (workPreview) {
          workPreview.src = safeArtwork.dataUrl;
          workPreview.hidden = false;
        }
      } catch (uploadError) {
        importedWork = null;
        const reasonCode = uploadError.reasonCode || uploadError.message;
        const privateLocalMode = ["review_unavailable", "real_person", "not_artwork"].includes(reasonCode);
        if (privateLocalMode && window.StoriesLensArtworkSafety?.removeMetadata) {
          try {
            const localArtwork = await window.StoriesLensArtworkSafety.removeMetadata(file);
            const isPersonalPhoto = reasonCode === "real_person" || reasonCode === "not_artwork";
            importedWork = { name: isPersonalPhoto ? "private-photo.webp" : "artwork.webp", type: localArtwork.type, kind: isPersonalPhoto ? "photo" : "image", content: localArtwork.dataUrl, safetyReviewed: false, reviewPending: true, metadataRemoved: true, privateOnly: true };
            sessionStorage.setItem("storieslens_imported_work", JSON.stringify(importedWork));
            if (workPreview) {
              workPreview.src = localArtwork.dataUrl;
              workPreview.hidden = false;
            }
            if (workFileStatus) workFileStatus.textContent = t(isPersonalPhoto ? "Private photo mode · metadata removed · never public by default" : "Private draft ready · metadata removed · safety review required before sharing");
            if (submitButton) submitButton.disabled = false;
            error.textContent = "";
            return;
          } catch (_localError) {
            // Continue to the standard rejection message when local sanitizing fails.
          }
        }
        workFile.value = "";
        const reasonMessages = {
          not_artwork: "Please upload artwork rather than a personal photograph.",
          real_person: "This upload appears to show a real person. Please upload artwork without identifiable people.",
          identity_document: "Identity documents cannot be uploaded.",
          personal_name: "A visible personal name was detected. Please cover or remove it and try again.",
          school_information: "School information was detected. Please cover or remove it and try again.",
          contact_information: "Contact information was detected. Please cover or remove it and try again.",
          unsafe_content: "This artwork did not pass the safe-content review.",
          uncertain: "We could not confirm that this upload is safe artwork. Please try a clearer image.",
          invalid_image: "Choose a valid JPG, PNG, WEBP, HEIC, or HEIF artwork file.",
          review_unavailable: "Artwork upload is paused because the safety review is unavailable. You can still write or speak."
        };
        error.textContent = t(reasonMessages[reasonCode] || reasonMessages.review_unavailable);
        if (workFileStatus) workFileStatus.textContent = t("Artwork was not added.");
        return;
      }
      if (!sourceInput.value.trim()) sourceInput.value = file.name;
      if (workFileStatus) workFileStatus.textContent = t("Safety check passed · personal metadata removed · private by default");
      if (submitButton) submitButton.disabled = false;
      error.textContent = "";
    });

    sourceButtons.forEach((button) => button.addEventListener("click", () => {
      source = button.dataset.sourceChoice;
      window.StoriesLensAnalytics?.track("inspiration_type_selected", { source });
      renderSource();
      sourceInput.focus();
    }));

    writingLanguageEntries.forEach((button) => button.addEventListener("click", () => {
      const selectedLanguage = button.dataset.writingLanguageEntry === "zh" ? "zh" : "en";
      if (storyLanguage) {
        storyLanguage.value = selectedLanguage;
        storyLanguage.dataset.changed = "true";
      }
      window.StoriesLensI18n?.setLocale(selectedLanguage);
      renderWritingLanguageEntries();
      window.StoriesLensAnalytics?.track("homepage_writing_language_selected", { storyLanguage: selectedLanguage });
      sourceInput?.focus({ preventScroll: true });
    }));

    homeLanguageButtons.forEach((button) => button.addEventListener("click", () => {
      const selectedLanguage = button.dataset.homeLanguage === "zh" ? "zh" : "en";
      if (storyLanguage) {
        storyLanguage.value = selectedLanguage;
        storyLanguage.dataset.changed = "true";
      }
      localStorage.setItem("storieslens_locale", selectedLanguage);
      renderWritingLanguageEntries();
      window.StoriesLensAnalytics?.track("homepage_writing_language_selected", { storyLanguage: selectedLanguage });
    }));

    const storedLocale = localStorage.getItem("storieslens_locale");
    if (storyLanguage && storedLocale === "zh") storyLanguage.value = "zh";
    window.addEventListener("storieslens:locale", (event) => {
      if (storyLanguage && !storyLanguage.dataset.changed) storyLanguage.value = event.detail.locale === "zh" ? "zh" : "en";
      renderSource();
      renderWritingLanguageEntries();
    });
    storyLanguage?.addEventListener("change", () => {
      storyLanguage.dataset.changed = "true";
      renderWritingLanguageEntries();
    });
    renderWritingLanguageEntries();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (voiceButton && sourceInput) {
      if (!SpeechRecognition) {
        voiceButton.hidden = true;
        if (voicePrivacy) voicePrivacy.textContent = t("Voice input is not supported in this browser.");
      } else {
        const recognition = new SpeechRecognition();
        let listening = false;
        let startingText = "";

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const setListening = (active) => {
          listening = active;
          voiceButton.classList.toggle("is-listening", active);
          voiceButton.setAttribute("aria-pressed", String(active));
          voiceButton.setAttribute("aria-label", t(active ? "Stop voice input" : "Start voice input"));
          if (voiceLabel) voiceLabel.textContent = t(active ? "Listening…" : "Speak");
        };

        voiceButton.addEventListener("click", () => {
          error.textContent = "";
          if (listening) {
            recognition.stop();
            return;
          }
          startingText = sourceInput.value.trim();
          const selectedLanguage = storyLanguage?.value || "en";
          recognition.lang = selectedLanguage === "zh" || (selectedLanguage === "bilingual" && document.documentElement.lang === "zh-CN") ? "zh-CN" : "en-US";
          try {
            recognition.start();
            window.StoriesLensAnalytics?.track("voice_input_started", { storyLanguage: selectedLanguage });
          } catch (_error) {
            setListening(false);
          }
        });

        recognition.addEventListener("start", () => setListening(true));
        recognition.addEventListener("result", (event) => {
          const transcript = Array.from(event.results).map((result) => result[0]?.transcript || "").join(" ").trim();
          const nextValue = [startingText, transcript].filter(Boolean).join(startingText && transcript ? " " : "");
          sourceInput.value = nextValue.slice(0, sourceInput.maxLength || 120);
          sourceInput.dispatchEvent(new Event("input", { bubbles: true }));
        });
        recognition.addEventListener("error", (event) => {
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            error.textContent = t("I couldn't access the microphone. Please allow microphone access and try again.");
          } else if (event.error === "no-speech") {
            error.textContent = t("I didn't hear anything. Try speaking again.");
          } else {
            error.textContent = t("Voice input paused. You can type or try again.");
          }
        });
        recognition.addEventListener("end", () => {
          setListening(false);
          if (sourceInput.value.trim()) {
            window.StoriesLensAnalytics?.track("voice_input_completed", { characters: sourceInput.value.trim().length });
          }
        });

        window.addEventListener("storieslens:locale", () => setListening(false));
      }
    }

    launchpad.addEventListener("submit", (event) => {
      event.preventDefault();
      const inspiration = sourceInput.value.trim();
      if (!inspiration && !(source === "work" && importedWork)) {
        error.textContent = t("Add a title or one sentence so Story Coach knows where to begin.");
        sourceInput.focus();
        return;
      }
      if (window.StoriesLensSafety && !window.StoriesLensSafety.check(inspiration).safe) {
        error.textContent = t(window.StoriesLensSafety.message);
        sourceInput.focus();
        return;
      }
      const effectiveSource = importedWork ? "work" : "tell";
      const params = new URLSearchParams({ source: effectiveSource, inspiration: inspiration || importedWork?.name || "", storyLang: storyLanguage?.value || "en" });
      window.StoriesLensAnalytics?.track("story_dna_started", { source: effectiveSource, storyLanguage: storyLanguage?.value || "en" });
      window.location.href = `story-dna.html?${params.toString()}`;
    });

    renderSource();
  }

  const flipbook = document.querySelector("[data-flipbook]");
  if (flipbook) {
    const pages = [...flipbook.querySelectorAll("[data-book-page]")];
    const pageCount = flipbook.querySelector("[data-book-page-count]");
    const previousButton = flipbook.querySelector("[data-book-prev]");
    const nextButton = flipbook.querySelector("[data-book-next]");
    let pageIndex = 0;

    const showPage = (nextIndex) => {
      pageIndex = (nextIndex + pages.length) % pages.length;
      pages.forEach((page, index) => {
        const active = index === pageIndex;
        page.classList.toggle("is-active", active);
        page.setAttribute("aria-hidden", String(!active));
      });
      if (pageCount) pageCount.textContent = `${pageIndex + 1} / ${pages.length}`;
    };

    previousButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      showPage(pageIndex - 1);
    });

    nextButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      showPage(pageIndex + 1);
    });

    flipbook.addEventListener("click", (event) => {
      if (!event.target.closest?.("button")) showPage(pageIndex + 1);
    });

    flipbook.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showPage(pageIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPage(pageIndex - 1);
      }
    });
  }
})();
