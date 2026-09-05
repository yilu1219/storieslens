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
    const voiceButton = launchpad.querySelector("[data-voice-input]");
    const voiceLabel = launchpad.querySelector("[data-voice-label]");
    const voicePrivacy = launchpad.querySelector("[data-voice-privacy]");
    const error = launchpad.querySelector("[data-launchpad-error]");
    const t = (text) => window.StoriesLensI18n?.t(text) || text;
    const sourceCopy = {
      book: ["Which book stayed with you?", "Type the title—or describe it in your own words"],
      movie: ["Which film sparked an idea?", "Type the title—or describe the moment you remember"],
      idea: ["What idea is waiting in your imagination?", "One sentence is enough to begin"]
    };
    let source = "book";

    const renderWritingLanguageEntries = () => {
      const selectedLanguage = storyLanguage?.value === "zh" ? "zh" : "en";
      writingLanguageEntries.forEach((button) => {
        const selected = button.dataset.writingLanguageEntry === selectedLanguage;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    };

    const renderSource = () => {
      sourceButtons.forEach((button) => {
        const selected = button.dataset.sourceChoice === source;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      sourceLabel.textContent = t(sourceCopy[source][0]);
      sourceInput.placeholder = t(sourceCopy[source][1]);
      error.textContent = "";
    };

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
      if (!inspiration) {
        error.textContent = t("Add a title or one sentence so Story Coach knows where to begin.");
        sourceInput.focus();
        return;
      }
      if (window.StoriesLensSafety && !window.StoriesLensSafety.check(inspiration).safe) {
        error.textContent = t(window.StoriesLensSafety.message);
        sourceInput.focus();
        return;
      }
      const params = new URLSearchParams({ source, inspiration, storyLang: storyLanguage?.value || "en" });
      window.StoriesLensAnalytics?.track("story_dna_started", { source, storyLanguage: storyLanguage?.value || "en" });
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
