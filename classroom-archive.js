(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const form = $("[data-archive-form]");
  if (!form) return;

  const boardInput = $("[data-board-photo]");
  const worksInput = $("[data-work-photos]");
  const selection = $("[data-selection]");
  const selectionTitle = $("[data-selection-title]");
  const fileList = $("[data-file-list]");
  const processingStatus = $("[data-processing-status]");
  const error = $("[data-archive-error]");
  const createProof = $("[data-create-proof]");
  const reviewSection = $("[data-review-section]");
  const publishSection = $("[data-publish-section]");
  const pageEditor = $("[data-page-editor]");
  const pageCount = $("[data-page-count]");
  const approvalChecks = $$("[data-approval-check]");
  const approveProof = $("[data-approve-proof]");
  const collectionTitle = $("[data-collection-title]");
  const collectionDate = $("[data-collection-date]");
  const classLabel = $("[data-class-label]");
  const edition = $("[data-edition]");
  const coverTheme = $("[data-cover-theme]");
  const resumeLast = $("[data-resume-last]");
  const state = { mode: "board", sources: [], pages: [], bookIndex: -1, projectId: "" };
  const DB_NAME = "storieslens-teacher-publisher";
  const DB_VERSION = 1;
  const STORE = "classBooks";
  const LAST_PROJECT_KEY = "storieslens_teacher_last_book";

  const zh = {
    home: "← 返回语镜故事首页",
    heroKicker: "教师出版空间 · 默认私密",
    heroOne: "拍下作品墙，",
    heroTwo: "出版全班的故事。",
    heroCopy: "用手机拍摄一张完整的课堂作品墙。StoriesLens 会生成候选页面、配上日期与封面，并把教师审核后的作品变成私密电子书。如果全景照片不够清楚，也可以逐张上传学生作品。",
    capture: "拍摄", captureSmall: "拍照或上传", organize: "整理", organizeSmall: "逐页检查", book: "电子书", bookSmall: "预览与导出",
    stepOne: "第一步", captureTitle: "你想怎样收集这期班级作品？", captureCopy: "先选择最快的方式。如果作品墙照片不够清楚，可以随时改为逐张上传。",
    boardMode: "拍摄一整面作品墙", boardModeSmall: "最快 · 直接调用手机相机", individualMode: "逐张上传学生作品", individualModeSmall: "最清晰 · 一次选择多张",
    takeBoard: "拍摄完整的课堂作品墙", takeBoardSmall: "手机保持水平 · 拍到四个角 · 只需一张", tipOne: "正对作品墙", tipTwo: "让作品墙充满画面", tipThree: "避免反光",
    uploadWorks: "逐张上传学生作品", uploadWorksSmall: "最多选择30张绘画或作文", clear: "清除",
    collectionTitle: "书名", collectionDate: "作品日期", edition: "版本", editionSingle: "单期作品墙", editionMonthly: "月度作品集", editionQuarterly: "季度作品集", editionYear: "年度作品集",
    classLabel: "班级名称", classLabelSmall: "使用班级昵称，不填写学生姓名", coverTheme: "封面颜色", coverInk: "墨蓝", coverCoral: "暖红", coverSage: "青绿色",
    deviceOnly: "设备优先的私密流程。", deviceOnlyCopy: "图片会在此浏览器内缩小并删除相机元数据。教师主动导出之前，草稿只保留在当前设备。", createDraft: "生成候选页面",
    whatHappens: "接下来会发生什么", findWorks: "识别作品区域", findWorksSmall: "把整墙照片拆成可以编辑的候选页面。", buildCover: "生成封面", buildCoverSmall: "自动加入书名、班级名称和日期。", teacherReview: "教师逐页审核", teacherReviewSmall: "检查裁切、匿名署名和可见个人信息。", exportBook: "导出电子书", exportBookSmall: "下载私密电子书或打印样张。", freeTeacher: "教师可以免费开始。", freeTeacherCopy: "无需囤货；之后由家庭自主决定是否购买实体纪念书。",
    stepTwo: "第二步 · 教师审核", reviewTitle: "把每一份作品放到正确的位置。", reviewCopy: "一张作品墙照片会生成多个候选裁切；逐张上传的作品会直接成为完整页面。生成书之前，可以改名、排序或删除。", dragHelp: "使用箭头调整顺序",
    approval: "教师确认", checksTitle: "生成电子书前需要完成三项检查", checkCrops: "我已检查每一个裁切。", checkCropsSmall: "没有作品遗漏或被错误截断。", checkPrivacy: "我已检查姓名、人脸和学校信息。", checkPrivacySmall: "只保留已经获得允许的身份信息。", checkPermission: "我拥有所需授权。", checkPermissionSmall: "向家庭分享或印刷前必须获得相应许可。", makeBook: "生成我的私密电子书",
    stepThree: "第三步 · 电子书已生成", readyTitle: "课堂作品不再做完就消失。", readyCopy: "私密版本已保存在当前设备。你可以下载独立电子书，也可以打印或保存为PDF样张。", downloadBook: "下载电子书", printBook: "打印／保存PDF",
    familyViewer: "家庭阅读版", familyViewerSmall: "适合手机阅读的私密版本。", printedBook: "实体班级书", printedBookSmall: "收到家庭订单后再制作。", classFilm: "班级电影", classFilmSmall: "未来可把同一组页面制作成配音首映短片。", startAnother: "再创建一本班级作品集",
    createNav: "创作", storiesNav: "作品", classNav: "班级", accountNav: "账户", footer: "默认私密 · 教师审核 · 按需印刷", resumeLast: "继续编辑最近保存的私密电子书"
  };

  $$('[data-archive-copy]').forEach((element) => { element.dataset.archiveEnglish = element.textContent.trim(); });

  const currentLocale = () => {
    const globalLocale = window.StoriesLensI18n?.locale;
    if (globalLocale === "zh" || globalLocale === "en") return globalLocale;
    return localStorage.getItem("storieslens_locale") === "zh" ? "zh" : "en";
  };
  const say = (english, chinese) => currentLocale() === "zh" ? chinese : english;
  const showError = (message = "") => { error.textContent = message; };
  const setStatus = (message = "") => { processingStatus.textContent = message; };

  function applyArchiveLocale(forcedLocale) {
    const locale = forcedLocale === "zh" || forcedLocale === "en" ? forcedLocale : currentLocale();
    $$('[data-archive-copy]').forEach((element) => {
      const key = element.dataset.archiveCopy;
      element.textContent = locale === "zh" ? (zh[key] || element.dataset.archiveEnglish) : element.dataset.archiveEnglish;
    });
    if (!state.pages.length && ["Our Classroom Stories", "我们的班级故事"].includes(collectionTitle.value)) {
      collectionTitle.value = locale === "zh" ? "我们的班级故事" : "Our Classroom Stories";
    }
    classLabel.placeholder = locale === "zh" ? "例如：星光班小作家" : "Example: Room 12 Creators";
    document.title = locale === "zh" ? "作品墙变成电子书｜语镜故事" : "Bulletin Board to Book | StoriesLens";
    renderSelection();
    if (state.pages.length) renderPageEditor();
    renderBook();
  }

  function todayValue() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat(currentLocale() === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.src = source;
    });
  }

  function canvasDataUrl(canvas, quality = 0.86) {
    const webp = canvas.toDataURL("image/webp", quality);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality);
  }

  async function sanitizeFile(file) {
    if (!(file.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name))) throw new Error("unsupported_type");
    if (file.size > 25 * 1024 * 1024) throw new Error("too_large");
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await loadImage(objectUrl);
      const longest = Math.max(image.naturalWidth, image.naturalHeight);
      const scale = Math.min(1, 2000 / longest);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      return { name: file.name.slice(0, 120), dataUrl: canvasDataUrl(canvas), width, height };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function cropBoard(source) {
    const image = await loadImage(source.dataUrl);
    const columns = image.naturalWidth >= image.naturalHeight * 1.15 ? 3 : 2;
    const rows = 2;
    const pages = [];
    const overlap = 0.035;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const cellWidth = image.naturalWidth / columns;
        const cellHeight = image.naturalHeight / rows;
        const sx = Math.max(0, column * cellWidth - cellWidth * overlap);
        const sy = Math.max(0, row * cellHeight - cellHeight * overlap);
        const sw = Math.min(image.naturalWidth - sx, cellWidth * (1 + overlap * 2));
        const sh = Math.min(image.naturalHeight - sy, cellHeight * (1 + overlap * 2));
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 1000 / Math.max(sw, sh));
        canvas.width = Math.max(1, Math.round(sw * ratio));
        canvas.height = Math.max(1, Math.round(sh * ratio));
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        pages.push(makePage(canvasDataUrl(canvas), pages.length));
      }
    }
    return pages;
  }

  function makePage(dataUrl, index, sourceName = "") {
    return {
      id: `page-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      dataUrl,
      title: say(`Student work ${String(index + 1).padStart(2, "0")}`, `学生作品 ${String(index + 1).padStart(2, "0")}`),
      credit: say("Creator nickname", "创作者昵称"),
      sourceName
    };
  }

  async function acceptFiles(fileCollection, mode) {
    showError();
    const files = Array.from(fileCollection || []);
    if (!files.length) return;
    if (mode === "board" && files.length > 1) files.splice(1);
    if (files.length > 30) {
      showError(say("Choose no more than 30 images.", "最多选择30张图片。"));
      return;
    }
    if (files.reduce((sum, file) => sum + file.size, 0) > 160 * 1024 * 1024) {
      showError(say("The selection is too large. Choose fewer images.", "所选图片总量过大，请减少图片数量。"));
      return;
    }
    state.sources = [];
    setStatus(say("Preparing private, metadata-free previews…", "正在生成不含相机元数据的私密预览……"));
    createProof.disabled = true;
    try {
      for (let index = 0; index < files.length; index += 1) {
        setStatus(say(`Preparing image ${index + 1} of ${files.length}…`, `正在处理第 ${index + 1}／${files.length} 张……`));
        state.sources.push(await sanitizeFile(files[index]));
      }
      setStatus(say("Ready. Original camera metadata is not included in this draft.", "处理完成。候选页面不包含原始相机元数据。"));
      window.StoriesLensAnalytics?.track("classroom_capture_ready", { mode, count: state.sources.length });
    } catch (uploadError) {
      state.sources = [];
      const message = uploadError.message === "too_large"
        ? say("Each image must be under 25 MB.", "每张图片需小于25MB。")
        : say("This image could not be opened. On some devices, HEIC must first be saved as JPG.", "无法读取这张图片。部分设备需要先把HEIC照片另存为JPG。" );
      showError(message);
      setStatus();
    }
    renderSelection();
  }

  function renderSelection() {
    const count = state.sources.length;
    selection.hidden = count === 0;
    createProof.disabled = count === 0;
    fileList.replaceChildren();
    if (!count) return;
    selectionTitle.textContent = say(`${count} image${count === 1 ? "" : "s"} ready`, `${count} 张图片已准备好`);
    state.sources.forEach((source, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      const caption = document.createElement("figcaption");
      image.src = source.dataUrl;
      image.alt = say(`Selected classroom image ${index + 1}`, `已选择的第${index + 1}张课堂图片`);
      caption.textContent = source.name;
      figure.append(image, caption);
      if (state.mode === "individual") {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", say(`Remove image ${index + 1}`, `删除第${index + 1}张图片`));
        remove.addEventListener("click", () => {
          state.sources.splice(index, 1);
          renderSelection();
        });
        figure.append(remove);
      }
      fileList.append(figure);
    });
  }

  function setMode(mode) {
    state.mode = mode === "individual" ? "individual" : "board";
    $$('[data-capture-mode]').forEach((button) => {
      const active = button.dataset.captureMode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $$('[data-mode-panel]').forEach((panel) => { panel.hidden = panel.dataset.modePanel !== state.mode; });
    state.sources = [];
    boardInput.value = "";
    worksInput.value = "";
    setStatus();
    showError();
    renderSelection();
  }

  function resetApproval() {
    approvalChecks.forEach((check) => { check.checked = false; });
    approveProof.disabled = true;
  }

  function movePage(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= state.pages.length) return;
    [state.pages[index], state.pages[target]] = [state.pages[target], state.pages[index]];
    resetApproval();
    renderPageEditor();
  }

  function renderPageEditor() {
    pageEditor.replaceChildren();
    pageCount.textContent = say(`${state.pages.length} pages`, `${state.pages.length} 页`);
    state.pages.forEach((page, index) => {
      const article = document.createElement("article");
      article.className = "archive-page-card";
      const visual = document.createElement("div");
      visual.className = "archive-page-visual";
      const image = document.createElement("img");
      image.src = page.dataUrl;
      image.alt = say(`Candidate page ${index + 1}`, `候选页面${index + 1}`);
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      visual.append(image, number);

      const details = document.createElement("div");
      details.className = "archive-page-details";
      const privacy = document.createElement("span");
      privacy.className = "archive-review-chip";
      privacy.textContent = say("CHECK NAMES & FACES", "检查姓名与人脸");
      const titleLabel = document.createElement("label");
      const titleText = document.createElement("span");
      const titleInput = document.createElement("input");
      titleText.textContent = say("Page title", "页面标题");
      titleInput.maxLength = 70;
      titleInput.value = page.title;
      titleInput.addEventListener("input", () => { page.title = titleInput.value; });
      titleLabel.append(titleText, titleInput);
      const creditLabel = document.createElement("label");
      const creditText = document.createElement("span");
      const creditInput = document.createElement("input");
      creditText.textContent = say("Printed credit", "印刷署名");
      creditInput.maxLength = 50;
      creditInput.value = page.credit;
      creditInput.addEventListener("input", () => { page.credit = creditInput.value; });
      creditLabel.append(creditText, creditInput);

      const actions = document.createElement("div");
      actions.className = "archive-page-actions";
      const up = document.createElement("button");
      const down = document.createElement("button");
      const remove = document.createElement("button");
      up.type = down.type = remove.type = "button";
      up.textContent = say("↑ Earlier", "↑ 前移");
      down.textContent = say("↓ Later", "↓ 后移");
      remove.textContent = say("Remove", "删除");
      up.disabled = index === 0;
      down.disabled = index === state.pages.length - 1;
      up.addEventListener("click", () => movePage(index, -1));
      down.addEventListener("click", () => movePage(index, 1));
      remove.addEventListener("click", () => {
        state.pages.splice(index, 1);
        resetApproval();
        renderPageEditor();
      });
      actions.append(up, down, remove);
      details.append(privacy, titleLabel, creditLabel, actions);
      article.append(visual, details);
      pageEditor.append(article);
    });
  }

  function updateApproval() {
    approveProof.disabled = !state.pages.length || !approvalChecks.every((check) => check.checked);
  }

  function bookMetadata() {
    return {
      title: collectionTitle.value.trim() || say("Our Classroom Stories", "我们的班级故事"),
      date: collectionDate.value || todayValue(),
      classLabel: classLabel.value.trim() || say("A private class collection", "私密班级作品集"),
      edition: edition.value,
      coverTheme: coverTheme.value
    };
  }

  function renderBook(forceIndex) {
    if (typeof forceIndex === "number") state.bookIndex = forceIndex;
    if (!state.pages.length) return;
    const metadata = bookMetadata();
    const coverPanel = $("[data-book-cover-panel]");
    const pagePanel = $("[data-book-page-panel]");
    const isCover = state.bookIndex < 0;
    coverPanel.hidden = !isCover;
    pagePanel.hidden = isCover;
    $("[data-cover-image]").src = state.sources[0]?.dataUrl || state.pages[0].dataUrl;
    $("[data-cover-title]").textContent = metadata.title;
    $("[data-cover-class]").textContent = metadata.classLabel;
    $("[data-cover-date]").textContent = formatDate(metadata.date);
    $("[data-cover-theme-view]").dataset.coverThemeView = metadata.coverTheme;
    if (!isCover) {
      const page = state.pages[state.bookIndex];
      $("[data-book-page-image]").src = page.dataUrl;
      $("[data-book-page-number]").textContent = say(`PAGE ${String(state.bookIndex + 1).padStart(2, "0")}`, `第 ${String(state.bookIndex + 1).padStart(2, "0")} 页`);
      $("[data-book-page-title]").textContent = page.title;
      $("[data-book-page-credit]").textContent = page.credit;
    }
    $("[data-book-position]").textContent = isCover ? say("Cover", "封面") : say(`Page ${state.bookIndex + 1} / ${state.pages.length}`, `第 ${state.bookIndex + 1}／${state.pages.length} 页`);
    $("[data-book-prev]").disabled = state.bookIndex < 0;
    $("[data-book-next]").disabled = state.bookIndex >= state.pages.length - 1;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("indexeddb_unavailable"));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("indexeddb_failed"));
    });
  }

  async function saveProject() {
    const metadata = bookMetadata();
    const id = state.projectId || (crypto.randomUUID?.() || `class-book-${Date.now()}`);
    const project = { id, ...metadata, mode: state.mode, sources: state.sources, pages: state.pages, savedAt: new Date().toISOString(), visibility: "private-device" };
    const database = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(project);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("save_failed"));
    });
    database.close();
    state.projectId = id;
    localStorage.setItem(LAST_PROJECT_KEY, id);
    resumeLast.hidden = false;
    return project;
  }

  async function getProject(id) {
    const database = await openDatabase();
    const project = await new Promise((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("load_failed"));
    });
    database.close();
    return project;
  }

  function restoreProject(project) {
    if (!project?.pages?.length) return;
    state.projectId = project.id;
    state.mode = project.mode || "board";
    state.sources = project.sources || [];
    state.pages = project.pages;
    collectionTitle.value = project.title || "";
    collectionDate.value = project.date || todayValue();
    classLabel.value = project.classLabel || "";
    edition.value = project.edition || "single";
    coverTheme.value = project.coverTheme || "ink";
    renderSelection();
    renderPageEditor();
    resetApproval();
    reviewSection.hidden = false;
    publishSection.hidden = false;
    $("[data-progress-step='2']")?.classList.add("is-active");
    $("[data-progress-step='3']")?.classList.add("is-active");
    renderBook(-1);
    publishSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[character]));
  }

  function buildBookHtml() {
    const metadata = bookMetadata();
    const pages = state.pages.map((page, index) => `<article class="page"><img src="${page.dataUrl}" alt=""><div><span>${escapeHtml(say(`Page ${index + 1}`, `第${index + 1}页`))}</span><h2>${escapeHtml(page.title)}</h2><p>${escapeHtml(page.credit)}</p></div></article>`).join("");
    const coverImage = state.sources[0]?.dataUrl || state.pages[0]?.dataUrl || "";
    return `<!doctype html><html lang="${currentLocale() === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(metadata.title)}</title><style>*{box-sizing:border-box}body{margin:0;color:#17211d;background:#e9e2d5;font-family:Arial,"Songti SC",sans-serif}.book{max-width:900px;margin:auto}.cover,.page{min-height:100vh;page-break-after:always;background:#fff}.cover{position:relative;display:flex;justify-content:flex-end;flex-direction:column;overflow:hidden;padding:8vw;color:#fff;background:#17354a}.cover:after{position:absolute;inset:0;background:linear-gradient(transparent 15%,rgba(12,24,30,.9));content:""}.cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.cover div{position:relative;z-index:1}.cover span,.page span{font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.cover h1{max-width:680px;margin:16px 0;font:700 clamp(48px,9vw,96px)/.95 Georgia,"Songti SC",serif}.cover p{font-size:20px}.page{display:grid;grid-template-rows:minmax(0,72vh) auto;padding:5vw}.page img{width:100%;height:100%;object-fit:contain}.page div{padding-top:24px;border-top:1px solid #ddd}.page h2{margin:8px 0;font:700 36px Georgia,"Songti SC",serif}.page p{color:#65706a}@media(max-width:600px){.cover,.page{min-height:100svh}.page{padding:20px;grid-template-rows:minmax(0,68svh) auto}}@media print{body{background:#fff}.book{max-width:none}.cover,.page{height:100vh;min-height:0}}</style></head><body><main class="book"><section class="cover"><img src="${coverImage}" alt=""><div><span>StoriesLens Class Edition</span><h1>${escapeHtml(metadata.title)}</h1><p>${escapeHtml(metadata.classLabel)} · ${escapeHtml(formatDate(metadata.date))}</p></div></section>${pages}</main></body></html>`;
  }

  function safeFilename(value) {
    return String(value || "class-book").replace(/[^a-z0-9\u3400-\u9fff_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "class-book";
  }

  function downloadBook() {
    const blob = new Blob([buildBookHtml()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(bookMetadata().title)}.html`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    window.StoriesLensAnalytics?.track("classroom_digital_book_downloaded", { pages: state.pages.length });
  }

  function printBook() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      $("[data-save-state]").textContent = say("Allow pop-ups to print or save the book as PDF.", "请允许弹出窗口，以打印电子书或保存为PDF。" );
      return;
    }
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(buildBookHtml());
    printWindow.document.close();
    printWindow.addEventListener("load", () => window.setTimeout(() => printWindow.print(), 300), { once: true });
  }

  $$('[data-capture-mode]').forEach((button) => button.addEventListener("click", () => setMode(button.dataset.captureMode)));
  boardInput.addEventListener("change", () => acceptFiles(boardInput.files, "board"));
  worksInput.addEventListener("change", () => acceptFiles(worksInput.files, "individual"));
  $("[data-clear-selection]").addEventListener("click", () => setMode(state.mode));
  approvalChecks.forEach((check) => check.addEventListener("change", updateApproval));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.sources.length) {
      showError(say("Photograph the board or upload at least one student work.", "请拍摄作品墙，或至少上传一份学生作品。"));
      return;
    }
    showError();
    createProof.disabled = true;
    setStatus(say("Building editable pages…", "正在生成可编辑页面……"));
    try {
      state.pages = state.mode === "board"
        ? await cropBoard(state.sources[0])
        : state.sources.map((source, index) => makePage(source.dataUrl, index, source.name));
      renderPageEditor();
      resetApproval();
      reviewSection.hidden = false;
      publishSection.hidden = true;
      $("[data-progress-step='2']")?.classList.add("is-active");
      reviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
      setStatus(say(`${state.pages.length} editable pages created.`, `已生成${state.pages.length}个可编辑页面。`));
      window.StoriesLensAnalytics?.track("classroom_page_draft_created", { mode: state.mode, pages: state.pages.length });
    } catch (_buildError) {
      showError(say("The page draft could not be created. Try individual uploads instead.", "无法生成候选页面，请改用逐张上传。"));
    } finally {
      createProof.disabled = !state.sources.length;
    }
  });

  approveProof.addEventListener("click", async () => {
    if (!state.pages.length || !approvalChecks.every((check) => check.checked)) return;
    approveProof.disabled = true;
    const saveState = $("[data-save-state]");
    saveState.textContent = say("Saving the private edition on this device…", "正在把私密版本保存到此设备……");
    publishSection.hidden = false;
    $("[data-progress-step='3']")?.classList.add("is-active");
    renderBook(-1);
    try {
      await saveProject();
      saveState.textContent = say("Saved privately on this device. Nothing has been published or shared.", "已私密保存在此设备；没有发布或分享任何内容。" );
    } catch (_saveError) {
      saveState.textContent = say("The book is ready for this session, but this browser blocked permanent device storage.", "电子书已生成，但当前浏览器阻止了永久本机存储。" );
    }
    publishSection.scrollIntoView({ behavior: "smooth", block: "start" });
    approveProof.disabled = false;
    window.StoriesLensAnalytics?.track("classroom_private_book_created", { pages: state.pages.length });
  });

  $("[data-book-prev]").addEventListener("click", () => renderBook(Math.max(-1, state.bookIndex - 1)));
  $("[data-book-next]").addEventListener("click", () => renderBook(Math.min(state.pages.length - 1, state.bookIndex + 1)));
  $("[data-download-book]").addEventListener("click", downloadBook);
  $("[data-print-book]").addEventListener("click", printBook);
  $("[data-start-another]").addEventListener("click", () => location.assign("classroom-archive.html?new=1"));
  [collectionTitle, collectionDate, classLabel, coverTheme].forEach((field) => field.addEventListener("input", () => renderBook()));

  resumeLast.addEventListener("click", async () => {
    const id = localStorage.getItem(LAST_PROJECT_KEY);
    if (!id) return;
    try {
      const project = await getProject(id);
      if (project) restoreProject(project);
    } catch (_error) {
      resumeLast.hidden = true;
    }
  });

  $$('[data-locale]').forEach((button) => button.addEventListener("click", () => window.setTimeout(() => applyArchiveLocale(button.dataset.locale), 0)));
  window.addEventListener("storieslens:locale", () => applyArchiveLocale());

  collectionDate.value = todayValue();
  resumeLast.hidden = !localStorage.getItem(LAST_PROJECT_KEY) || new URLSearchParams(location.search).has("new");
  applyArchiveLocale();
  renderSelection();
})();
