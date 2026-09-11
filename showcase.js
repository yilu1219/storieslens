(() => {
  const formatButtons = [...document.querySelectorAll("[data-format-filter]")];
  const languageButtons = [...document.querySelectorAll("[data-language-filter]")];
  const cards = [...document.querySelectorAll("[data-format][data-language]")];
  let format = "book";
  let language = "all";

  const render = () => {
    cards.forEach((card) => {
      card.hidden = card.dataset.format !== format || (language !== "all" && card.dataset.language !== language);
    });
    formatButtons.forEach((button) => {
      const active = button.dataset.formatFilter === format;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    languageButtons.forEach((button) => {
      const active = button.dataset.languageFilter === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  formatButtons.forEach((button) => button.addEventListener("click", () => {
    format = button.dataset.formatFilter;
    render();
    window.StoriesLensAnalytics?.track("showcase_filter_changed", { format, language });
  }));

  languageButtons.forEach((button) => button.addEventListener("click", () => {
    language = button.dataset.languageFilter;
    render();
    window.StoriesLensAnalytics?.track("showcase_filter_changed", { format, language });
  }));

  document.querySelector("[data-showcase-create]")?.addEventListener("click", () => {
    window.StoriesLensAnalytics?.track("showcase_create_clicked", { format, language });
  });

  render();
})();
