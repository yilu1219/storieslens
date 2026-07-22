(function () {
  "use strict";

  const KEY = "storieslens_teacher_project_draft_v2";
  const LEGACY_RESULT_KEY = "storieslens_create_lesson_result";
  const stages = ["upload", "review", "assign", "publish"];
  const pages = {
    upload: "create-reading-project.html",
    review: "create-reading-review.html",
    assign: "create-reading-assign.html",
    publish: "create-reading-publish.html"
  };

  const defaults = {
    version: 2,
    completedStage: -1,
    title: "The Mystery of the Lost Map",
    readingText: "",
    grade: "Grade 4",
    framework: "K12_CCSS",
    outputType: "CLASS_BOOK",
    classSize: 24,
    lessonResult: null,
    studentNames: "Ava\nLeo\nMia\nNoah\nEmma",
    assignments: [],
    classCode: "MAP-4832"
  };

  function readDraft() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch (_) {
      return { ...defaults };
    }
  }

  function writeDraft(draft) {
    const next = { ...defaults, ...draft, version: 2 };
    localStorage.setItem(KEY, JSON.stringify(next));
    if (next.lessonResult) localStorage.setItem(LEGACY_RESULT_KEY, JSON.stringify(next.lessonResult));
    return next;
  }

  function updateDraft(patch) {
    return writeDraft({ ...readDraft(), ...patch });
  }

  function completeStage(stage) {
    const index = stages.indexOf(stage);
    const draft = readDraft();
    return updateDraft({ completedStage: Math.max(draft.completedStage, index) });
  }

  function stageHref(stage) {
    return pages[stage] || pages.upload;
  }

  function requireStage(stage) {
    const target = stages.indexOf(stage);
    const draft = readDraft();
    if (target > draft.completedStage + 1) {
      const allowed = stages[Math.min(draft.completedStage + 1, stages.length - 1)];
      location.replace(`${stageHref(allowed)}?notice=complete-previous-step`);
      return false;
    }
    return true;
  }

  function renderRail(currentStage) {
    const draft = readDraft();
    document.querySelectorAll("[data-stage]").forEach((item) => {
      const stage = item.dataset.stage;
      const index = stages.indexOf(stage);
      item.classList.toggle("is-current", stage === currentStage);
      item.classList.toggle("is-complete", index <= draft.completedStage);
      item.classList.toggle("is-locked", index > draft.completedStage + 1);
      const link = item.querySelector("a");
      if (link) {
        link.href = stageHref(stage);
        link.setAttribute("aria-disabled", index > draft.completedStage + 1 ? "true" : "false");
      }
    });
  }

  window.StoriesLensProjectFlow = {
    KEY,
    stages,
    readDraft,
    writeDraft,
    updateDraft,
    completeStage,
    requireStage,
    renderRail,
    stageHref
  };
})();
