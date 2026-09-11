(() => {
  const params = new URLSearchParams(window.location.search);
  const source = ["work", "tell", "inspiration", "picture", "text", "voice", "book", "movie", "idea"].includes(params.get("source")) ? params.get("source") : "inspiration";
  const inspiration = params.get("inspiration")?.trim() || "Your inspiration";
  const fromH5 = params.get("from") === "h5";
  let storyLanguage = ["en", "zh", "bilingual"].includes(params.get("storyLang")) ? params.get("storyLang") : "en";
  const storyLanguageSelect = document.querySelector("[data-dna-story-language]");
  if (storyLanguageSelect) storyLanguageSelect.value = storyLanguage;
  const t = (text) => window.StoriesLensI18n?.t(text) || text;
  const panels = [...document.querySelectorAll("[data-dna-panel]")];
  const memoryButtons = [...document.querySelectorAll("[data-memory]")];
  const shiftButtons = [...document.querySelectorAll("[data-shift]")];
  const changeAnswer = document.querySelector("[data-change-answer]");
  const flow = document.querySelector("[data-dna-flow]");
  const result = document.querySelector("[data-dna-result]");
  const error = document.querySelector("[data-dna-error]");
  let step = 1;
  let memory = "";
  let shift = "";

  if (fromH5) {
    const exit = document.querySelector(".dna-exit");
    if (exit) exit.href = "app.html";
  }

  const copy = {
    1: ["Find the spark", "What stayed with you most?", "Choose the part that keeps returning to your imagination."],
    2: ["Make the first change", "What would you make different?", "Changing one important choice begins a story only you can tell."],
    3: ["Build originality", "Now move beyond the original.", "Choose one big shift that will help your new world stand on its own."]
  };
  const sourceNames = { work: "My work", tell: "My own words or voice", inspiration: "A book or film", picture: "One picture", text: "A paragraph", voice: "My own voice", book: "A book", movie: "A film", idea: "My own idea" };
  const memoryNames = { character: "A character’s choice", world: "The world", feeling: "The feeling", surprise: "The surprise" };
  const shiftNames = { setting: "A completely new setting", goal: "A different hero goal", rule: "One impossible rule" };

  const select = (buttons, key, value) => buttons.forEach((button) => {
    const selected = button.dataset[key] === value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const setPreview = (selector, value, ready) => {
    const node = document.querySelector(selector);
    node.textContent = t(value);
    node.parentElement.classList.toggle("is-ready", ready);
  };

  const render = () => {
    panels.forEach((panel) => { panel.hidden = Number(panel.dataset.dnaPanel) !== step; });
    document.querySelector("[data-dna-step]").textContent = String(step);
    document.querySelector("[data-dna-progress]").style.width = `${(step / 3) * 100}%`;
    document.querySelector("[data-dna-step-label]").textContent = t(copy[step][0]);
    document.querySelector("[data-dna-title]").textContent = t(copy[step][1]);
    document.querySelector("[data-dna-lede]").textContent = t(copy[step][2]);
    document.querySelector("[data-dna-back]").hidden = step === 1;
    document.querySelector("[data-dna-next]").textContent = t(step === 3 ? "Create my Story DNA →" : "Continue →");
    document.querySelector("[data-source-type]").textContent = t(sourceNames[source]);
    document.querySelector("[data-inspiration-title]").textContent = inspiration;
    setPreview("[data-preview-inspiration]", inspiration, true);
    setPreview("[data-preview-memory]", memory ? memoryNames[memory] : "Waiting for your choice", Boolean(memory));
    setPreview("[data-preview-change]", changeAnswer.value.trim() || "Waiting for your idea", Boolean(changeAnswer.value.trim()));
    setPreview("[data-preview-shift]", shift ? shiftNames[shift] : "Waiting for your twist", Boolean(shift));
    error.textContent = "";
  };

  memoryButtons.forEach((button) => button.addEventListener("click", () => { memory = button.dataset.memory; select(memoryButtons, "memory", memory); render(); }));
  shiftButtons.forEach((button) => button.addEventListener("click", () => { shift = button.dataset.shift; select(shiftButtons, "shift", shift); render(); }));
  changeAnswer.addEventListener("input", render);
  storyLanguageSelect?.addEventListener("change", () => {
    storyLanguage = storyLanguageSelect.value;
    const nextParams = new URLSearchParams(location.search);
    nextParams.set("storyLang", storyLanguage);
    history.replaceState(null, "", `${location.pathname}?${nextParams}`);
    window.StoriesLensAnalytics?.track("story_language_changed", { mode: "story-dna", storyLanguage });
  });

  document.querySelector("[data-dna-back]").addEventListener("click", () => { step = Math.max(1, step - 1); render(); document.querySelector("[data-dna-title]").focus(); });
  document.querySelector("[data-dna-next]").addEventListener("click", () => {
    if (step === 1 && !memory) { error.textContent = t("Choose what stayed with you before continuing."); return; }
    if (step === 2 && !changeAnswer.value.trim()) { error.textContent = t("Write one change you would make."); changeAnswer.focus(); return; }
    if (step === 2 && window.StoriesLensSafety && !window.StoriesLensSafety.check(changeAnswer.value).safe) { error.textContent = t(window.StoriesLensSafety.message); changeAnswer.focus(); return; }
    if (step === 3 && !shift) { error.textContent = t("Choose one originality shift."); return; }
    if (step < 3) { step += 1; render(); document.querySelector("[data-dna-title]").focus(); return; }

    const dnaSeed = `${memoryNames[memory]}. My change: ${changeAnswer.value.trim()} Originality shift: ${shiftNames[shift]}.`;
    const record = { source, inspiration, storyLanguage, memory, change: changeAnswer.value.trim(), shift, seed: dnaSeed, createdAt: new Date().toISOString() };
    localStorage.setItem("storieslens_story_dna", JSON.stringify(record));
    window.StoriesLensAnalytics?.track("story_dna_completed", { source, memory, shift, storyLanguage });
    document.querySelector("[data-result-memory]").textContent = t(memoryNames[memory]);
    document.querySelector("[data-result-change]").textContent = changeAnswer.value.trim();
    document.querySelector("[data-result-shift]").textContent = t(shiftNames[shift]);
    const base = { source, inspiration, storyLang: storyLanguage, dna: dnaSeed };
    document.querySelector("[data-result-solo]").href = fromH5
      ? `visual-write.html?${new URLSearchParams({ mode: "free", from: "h5", storyLang: storyLanguage })}`
      : `start.html?${new URLSearchParams({ ...base, mode: "solo" })}`;
    if (fromH5) document.querySelector("[data-result-solo]").textContent = t("Continue writing →");
    document.querySelector("[data-result-squad]").href = `start.html?${new URLSearchParams({ ...base, mode: "squad" })}`;
    window.StoriesLensPlatform?.syncLocalProject(true);
    flow.hidden = true;
    result.hidden = false;
    result.querySelector("h1").focus?.();
  });

  window.addEventListener("storieslens:locale", render);
  render();
})();
