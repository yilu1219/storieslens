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
    const error = launchpad.querySelector("[data-launchpad-error]");
    const t = (text) => window.StoriesLensI18n?.t(text) || text;
    const sourceCopy = {
      book: ["Which book stayed with you?", "Type the title—or describe it in your own words"],
      movie: ["Which film sparked an idea?", "Type the title—or describe the moment you remember"],
      idea: ["What idea is waiting in your imagination?", "One sentence is enough to begin"]
    };
    let source = "book";

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

    const storedLocale = localStorage.getItem("storieslens_locale");
    if (storyLanguage && storedLocale === "zh") storyLanguage.value = "zh";
    window.addEventListener("storieslens:locale", (event) => {
      if (storyLanguage && !storyLanguage.dataset.changed) storyLanguage.value = event.detail.locale === "zh" ? "zh" : "en";
      renderSource();
    });
    storyLanguage?.addEventListener("change", () => { storyLanguage.dataset.changed = "true"; });

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
})();
