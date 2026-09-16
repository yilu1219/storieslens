(function () {
  const platform = window.StoriesLensPlatform;
  const $ = (selector) => document.querySelector(selector);
  const projectId = new URLSearchParams(location.search).get("project") || "";
  const toastNode = $("[data-toast]");
  let currentProject = null;

  function text(selector, value) {
    const element = $(selector);
    if (element) element.textContent = String(value || "");
  }

  function showToast(message, error = false) {
    toastNode.textContent = message;
    toastNode.classList.toggle("error", error);
    toastNode.classList.add("show");
    window.setTimeout(() => toastNode.classList.remove("show"), 3200);
  }

  function reportDate(value, language) {
    try {
      return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
    } catch {
      return "Today";
    }
  }

  function make(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  }

  function renderBook(book, language) {
    const article = make("article", "book-card");
    const media = make("div", "book-cover-wrap");
    const fallback = make("div", "book-cover-fallback");
    fallback.append(make("small", "", "STORIESLENS READING PATH"), make("strong", "", book.title), make("small", "", book.author));
    const image = make("img", "book-cover");
    image.src = book.coverUrl;
    image.alt = language === "zh" ? `《${book.title}》封面` : `${book.title} book cover`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => { image.hidden = true; });
    media.append(fallback, image);

    const copy = make("div", "book-copy");
    copy.append(make("span", "book-slot", book.slotLabel));
    copy.append(make("h3", "", book.title));
    copy.append(make("p", "book-author", book.author));
    copy.append(make("p", "book-reason", book.reason));
    copy.append(make("div", "book-focus", `${language === "zh" ? "本书可关注" : "CRAFT TO NOTICE"} · ${book.craftFocus}`));
    copy.append(make("p", "book-question", `${language === "zh" ? "亲子讨论" : "TALK TOGETHER"} · ${book.discussionPrompt}`));
    const link = make("a", "app-secondary book-link", language === "zh" ? "查找这本书 ↗" : "Find this book ↗");
    link.href = book.bookUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    copy.append(link);
    article.append(media, copy);
    return article;
  }

  function render(report, project) {
    const zh = report.language === "zh";
    document.documentElement.lang = zh ? "zh-CN" : "en";
    document.title = `${report.title} · StoriesLens`;
    text("[data-kicker]", zh ? "项目完成 · 你的成长记录" : "PROJECT COMPLETE · YOUR GROWTH RECORD");
    text("[data-report-title]", report.title);
    text("[data-celebration]", report.celebration);
    text("[data-project-language]", zh ? "中文创作" : "English creation");
    text("[data-report-date]", reportDate(report.updatedAt, report.language));
    text("[data-yu-note]", zh ? "我没有替你写故事。我观察了这次作品，再为你选出一本最适合继续探索的书。" : "I did not write the story for you. I looked at this project and chose one book for your clearest next step.");
    text("[data-strength]", report.strength);
    text("[data-strength-note]", zh ? "这是对本次作品的具体观察，不是分数，也不会给创作者贴标签。" : "This is a specific observation about the project—not a score or a label for the creator.");
    text("[data-next-goal]", report.nextGoal);
    text("[data-next-note]", zh ? "下一次只专注一个写作动作，孩子更容易真正掌握并保留自己的声音。" : "Focusing on one writing move at a time helps the creator grow while keeping their own voice.");
    text("#reading-path-title", zh ? "一本书，一个清楚的下一步。" : "One book, one clear next step.");
    text("[data-reading-intro]", zh ? "所有书名都来自 StoriesLens 审核书库。羽大师根据这次作品进行匹配，不会用 AI 编造书名。" : "Every title comes from the StoriesLens reviewed catalog. Yu matches books to this project and never invents a title with AI.");
    text("[data-family-title]", zh ? "把阅读重新带回创作。" : "Turn reading back into creating.");
    text("[data-family-prompt]", report.familyPrompt);
    text("[data-catalog-note]", zh ? "推荐用于支持亲子阅读与写作交流，不是考试成绩或诊断。封面资料来自书籍链接服务，不同地区的版本与可获得性可能不同。" : "Recommendations support reading and writing conversations; they are not a test score or a diagnosis. Cover metadata comes from linked book-catalog services, and editions or availability vary by region.");

    const grid = $("[data-book-grid]");
    grid.replaceChildren(...report.recommendations.map((book) => renderBook(book, report.language)));
    $("[data-report-loading]").hidden = true;
    $("[data-report]").hidden = false;
    currentProject = project;
  }

  function showError(error) {
    $("[data-report-loading]").hidden = true;
    $("[data-report]").hidden = true;
    $("[data-report-error]").hidden = false;
    text("[data-error-message]", error?.message || "Open My stories and choose Growth report again.");
  }

  async function generateReport() {
    if (!projectId) throw new Error("Choose a story from My stories before opening its report.");
    return platform.api(`/api/projects/${encodeURIComponent(projectId)}/report`, { method: "POST", body: "{}" });
  }

  async function loadReport() {
    if (!projectId) return showError(new Error("No story project was selected."));
    try {
      const result = await platform.api(`/api/projects/${encodeURIComponent(projectId)}/report`);
      const current = !result.report || result.reportStale || Number(result.report.projectVersion) !== Number(result.project.version)
        ? await generateReport()
        : result;
      render(current.report, current.project);
    } catch (error) {
      showError(error);
    }
  }

  $("[data-refresh-report]").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = currentProject?.language === "zh" ? "正在更新……" : "Refreshing…";
    try {
      const result = await generateReport();
      render(result.report, result.project);
      showToast(result.report.language === "zh" ? "成长报告已根据最新作品更新。" : "Growth report refreshed from the latest project.");
    } catch (error) {
      showToast(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Refresh after editing · 修改后更新";
    }
  });

  loadReport();
})();
