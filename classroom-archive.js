(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const form = $("[data-archive-form]");
  if (!form) return;

  const boardInput = $("[data-board-photo]");
  const boardUploadInput = $("[data-board-upload]");
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
  const gridLayout = $("[data-grid-layout]");
  const gridField = $("[data-grid-field]");
  const resumeLast = $("[data-resume-last]");
  const cloudStatus = $("[data-cloud-status]");
  const cloudSave = $("[data-cloud-save]");
  const cloudShare = $("[data-cloud-share]");
  const cloudDocx = $("[data-cloud-docx]");
  const cloudPdf = $("[data-cloud-pdf]");
  const cloudProduction = $("[data-cloud-production]");
  const cloudAttester = $("[data-cloud-attester]");
  const cloudPermission = $("[data-cloud-permission]");
  const state = { mode: "board", sources: [], pages: [], bookIndex: -1, projectId: "", cloudProjectId: "", cloudConsentId: "", cloudMediaByPage: {} };
  const DB_NAME = "storieslens-teacher-publisher";
  const DB_VERSION = 1;
  const STORE = "classBooks";
  const LAST_PROJECT_KEY = "storieslens_teacher_last_book";

  const zh = {
    home: "← 返回教师工作室",
    heroKicker: "教师出版空间 · 默认私密",
    heroOne: "拍下作品墙，",
    heroTwo: "出版全班的故事。",
    heroCopy: "用手机拍摄一张完整的课堂作品墙。StoriesLens 会生成候选页面、配上日期与封面，并把教师审核后的作品变成私密电子书。如果全景照片不够清楚，也可以逐张上传学生作品。",
    capture: "拍摄", captureSmall: "拍照或上传", organize: "整理", organizeSmall: "逐页检查", book: "电子书", bookSmall: "预览与导出",
    stepOne: "第一步", captureTitle: "你想怎样收集这期班级作品？", captureCopy: "先选择最快的方式。如果作品墙照片不够清楚，可以随时改为逐张上传。",
    boardMode: "拍摄一整面作品墙", boardModeSmall: "最快 · 直接调用手机相机", individualMode: "逐张上传学生作品", individualModeSmall: "最清晰 · 一次选择多张",
    takeBoard: "现在拍一张", takeBoardSmall: "打开相机 · 拍到作品墙四个角", uploadBoard: "上传已有照片", uploadBoardSmall: "从相册或文件选择 · 支持JPG、PNG、HEIC等格式", tipOne: "正对作品墙", tipTwo: "让作品墙充满画面", tipThree: "避免反光",
    uploadWorks: "逐张上传学生作品", uploadWorksSmall: "最多选择30张绘画或作文", clear: "清除",
    collectionTitle: "书名", collectionDate: "作品日期", edition: "版本", editionSingle: "单期作品墙", editionMonthly: "月度作品集", editionQuarterly: "季度作品集", editionYear: "年度作品集",
    boardLayout: "作品墙排列", layoutAuto: "自动判断",
    classLabel: "班级名称", classLabelSmall: "使用班级昵称，不填写学生姓名", coverTheme: "封面颜色", coverInk: "墨蓝", coverCoral: "暖红", coverSage: "青绿色",
    deviceOnly: "设备优先的私密流程。", deviceOnlyCopy: "图片会在此浏览器内缩小并删除相机元数据。教师主动导出之前，草稿只保留在当前设备。", createDraft: "下一步：整理页面", nextHint: "书名和封面可以现在修改，也可以稍后再调整。",
    whatHappens: "接下来会发生什么", findWorks: "生成可调整的页面裁切", findWorksSmall: "选择作品墙排列，再逐页微调裁切后保存。", buildCover: "生成封面", buildCoverSmall: "自动加入书名、班级名称和日期。", teacherReview: "教师逐页审核", teacherReviewSmall: "检查裁切、匿名署名和可见个人信息。", exportBook: "导出电子书", exportBookSmall: "下载私密电子书或打印样张。", freeTeacher: "教师可以免费开始。", freeTeacherCopy: "无需囤货；之后由家庭自主决定是否购买实体纪念书。",
    stepTwo: "第二步 · 教师审核", reviewTitle: "把每一份作品放到正确的位置。", reviewCopy: "一张作品墙照片会生成多个候选裁切；逐张上传的作品会直接成为完整页面。生成书之前，可以改名、排序或删除。", dragHelp: "使用箭头调整顺序",
    approval: "教师确认", checksTitle: "生成电子书前需要完成三项检查", checkCrops: "我已检查每一个裁切。", checkCropsSmall: "没有作品遗漏或被错误截断。", checkPrivacy: "我已检查姓名、人脸和学校信息。", checkPrivacySmall: "只保留已经获得允许的身份信息。", checkPermission: "我拥有所需授权。", checkPermissionSmall: "向家庭分享或印刷前必须获得相应许可。", makeBook: "生成我的私密电子书",
    stepThree: "第三步 · 电子书已生成", readyTitle: "课堂作品不再做完就消失。", readyCopy: "私密版本已保存在当前设备。你可以下载独立电子书，也可以打印或保存为PDF样张。", downloadBook: "下载电子书", printBook: "打印／保存PDF",
    familyViewer: "家庭阅读版", familyViewerSmall: "适合手机阅读的私密版本。", printedBook: "实体班级书", printedBookSmall: "收到家庭订单后再制作。", classFilm: "班级电影", classFilmSmall: "未来可把同一组页面制作成配音首映短片。", startAnother: "再创建一本班级作品集",
    cloudKicker: "教师账户 · 区域私密云端", cloudTitle: "跨设备保存，并邀请家庭阅读。", cloudCopy: "本机预览免费。购买教师班级项目后，可把审核页面保存到所属地区的私密资料库，并导出Word、PDF或创建限时家庭邀请。", attesterName: "教师／教育者姓名", cloudPermission: "我已满18岁，并确认已为所有可识别学生取得所需家长／监护人许可，同意将作品用于区域私密存储、家庭邀请、印刷和班级短片制作。", saveCloud: "保存审核版到云端", shareFamilies: "创建私密家庭链接", exportWord: "下载Word", exportPdf: "下载PDF", productionStudio: "申请印刷或制作班级电影", teacherPack: "教师班级项目 · $79",
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
    if (!window.StoriesLensArtworkSafety?.isSupportedImage(file)) throw new Error("unsupported_type");
    if (file.size > 25 * 1024 * 1024) throw new Error("too_large");
    const sanitized = await window.StoriesLensArtworkSafety.removeMetadata(file);
    return { name: file.name.slice(0, 120), dataUrl: sanitized.dataUrl, width: sanitized.width, height: sanitized.height, convertedFromHeic: Boolean(sanitized.convertedFromHeic), convertedOnServer: Boolean(sanitized.convertedOnServer) };
  }

  async function cropBoard(source) {
    const image = await loadImage(source.dataUrl);
    const requested = gridLayout?.value || "auto";
    const automatic = image.naturalWidth >= image.naturalHeight * 1.15 ? [3, 2] : [2, 2];
    const [columns, rows] = requested === "auto" ? automatic : requested.split("x").map(Number);
    const pages = [];
    const overlap = 0.035;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const page = makePage("", pages.length, source.name);
        page.sourceDataUrl = source.dataUrl;
        page.crop = {
          x: Math.max(0, (column / columns) - (overlap / columns)),
          y: Math.max(0, (row / rows) - (overlap / rows)),
          w: Math.min(1 - (column / columns), (1 / columns) * (1 + overlap * 2)),
          h: Math.min(1 - (row / rows), (1 / rows) * (1 + overlap * 2))
        };
        await recropPage(page, image);
        pages.push(page);
      }
    }
    return pages;
  }

  async function recropPage(page, loadedImage) {
    if (!page?.sourceDataUrl || !page.crop) return;
    const image = loadedImage || await loadImage(page.sourceDataUrl);
    const crop = page.crop;
    const sx = Math.round(Math.max(0, Math.min(0.98, crop.x)) * image.naturalWidth);
    const sy = Math.round(Math.max(0, Math.min(0.98, crop.y)) * image.naturalHeight);
    const sw = Math.max(1, Math.round(Math.min(1 - crop.x, Math.max(0.02, crop.w)) * image.naturalWidth));
    const sh = Math.max(1, Math.round(Math.min(1 - crop.y, Math.max(0.02, crop.h)) * image.naturalHeight));
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 1200 / Math.max(sw, sh));
    canvas.width = Math.max(1, Math.round(sw * ratio));
    canvas.height = Math.max(1, Math.round(sh * ratio));
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    page.dataUrl = canvasDataUrl(canvas, 0.9);
  }

  function makePage(dataUrl, index, sourceName = "") {
    return {
      id: `page-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      dataUrl,
      title: say(`Student work ${String(index + 1).padStart(2, "0")}`, `学生作品 ${String(index + 1).padStart(2, "0")}`),
      credit: "",
      creditConfirmed: false,
      creditSource: "teacher",
      sourceName
    };
  }

  function authorsReady() {
    return state.pages.length > 0 && state.pages.every((page) => page.credit.trim() && page.creditConfirmed === true);
  }

  async function suggestAuthorFromWork(page, input, confirmInput, button, status) {
    button.disabled = true;
    status.textContent = say("Reading the possible author label…", "正在识别可能的作者署名……");
    try {
      const session = await window.StoriesLensPlatform?.getSession();
      if (!session?.authenticated) {
        status.textContent = say("Sign in with a teacher account to use name recognition, or type the author manually.", "请先登录教师账户使用署名识别，或直接手动填写作者。" );
        return;
      }
      const result = await window.StoriesLensPlatform.api("/api/classroom/recognize-author", {
        method: "POST",
        body: JSON.stringify({ imageDataUrl: page.dataUrl, metadataRemoved: true })
      });
      input.value = result.candidate;
      page.credit = result.candidate;
      page.creditConfirmed = false;
      page.creditSource = "suggested";
      confirmInput.checked = false;
      status.textContent = say(
        `Suggested “${result.candidate}”. Check the work, edit if needed, then confirm.`,
        `识别建议：“${result.candidate}”。请对照作品检查、必要时修改，再由老师确认。`
      );
      updateApproval();
    } catch (recognitionError) {
      status.textContent = recognitionError.message || say("No clear author label was found. Please type a name, nickname, initials, or Anonymous.", "没有识别到清晰署名，请填写姓名、昵称、首字母或“匿名作者”。");
    } finally {
      button.disabled = false;
    }
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
      const convertedHeic = state.sources.some((source) => source.convertedFromHeic);
      const usedServerFallback = state.sources.some((source) => source.convertedOnServer);
      setStatus(convertedHeic
        ? (usedServerFallback
          ? say("Ready. HEIC was securely converted; tap Next to arrange the pages.", "处理完成。HEIC 已安全转换，请点击“下一步”整理页面。")
          : say("Ready. HEIC was converted on this device; tap Next to arrange the pages.", "处理完成。HEIC 已在本机转换，请点击“下一步”整理页面。"))
        : say("Photo ready. Tap the green Next button to arrange the pages.", "照片已准备好，请点击绿色“下一步”按钮整理页面。"));
      window.StoriesLensAnalytics?.track("classroom_capture_ready", { mode, count: state.sources.length });
    } catch (uploadError) {
      state.sources = [];
      const message = uploadError.message === "too_large"
        ? say("Each image must be under 25 MB.", "每张图片需小于25MB。")
        : uploadError.message === "heic_conversion_unavailable"
          ? say("HEIC support could not load. Check your connection and try again.", "HEIC 转换组件暂时无法加载，请检查网络后重试。")
          : say("This image could not be opened. Try a different image.", "无法读取这张图片，请换一张图片重试。" );
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
    if (gridField) gridField.hidden = state.mode !== "board";
    $$('[data-capture-mode]').forEach((button) => {
      const active = button.dataset.captureMode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $$('[data-mode-panel]').forEach((panel) => { panel.hidden = panel.dataset.modePanel !== state.mode; });
    state.sources = [];
    boardInput.value = "";
    boardUploadInput.value = "";
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
      creditText.textContent = say("Author name or nickname", "作者姓名或昵称");
      creditInput.maxLength = 50;
      creditInput.value = page.credit;
      creditInput.placeholder = say("Nickname, initials, or Anonymous", "昵称、姓名首字母或匿名作者");
      creditInput.autocomplete = "off";
      const creditHelp = document.createElement("small");
      creditHelp.className = "archive-author-help";
      creditHelp.textContent = say("Prefer a nickname or initials. Use a full name only with family permission.", "建议使用昵称或姓名首字母；只有获得家庭许可后才使用全名。" );
      const creditStatus = document.createElement("small");
      creditStatus.className = "archive-author-status";
      creditStatus.setAttribute("role", "status");
      const confirmLabel = document.createElement("label");
      confirmLabel.className = "archive-author-confirm";
      const confirmInput = document.createElement("input");
      confirmInput.type = "checkbox";
      confirmInput.checked = page.creditConfirmed === true;
      const confirmText = document.createElement("span");
      confirmText.textContent = say("Teacher checked this author credit", "老师已核对此作者署名");
      confirmLabel.append(confirmInput, confirmText);
      creditInput.addEventListener("input", () => {
        page.credit = creditInput.value;
        page.creditConfirmed = false;
        page.creditSource = "teacher";
        confirmInput.checked = false;
        creditStatus.textContent = "";
        updateApproval();
        renderBook();
      });
      confirmInput.addEventListener("change", () => {
        if (confirmInput.checked && !creditInput.value.trim()) {
          confirmInput.checked = false;
          creditStatus.textContent = say("Enter a nickname, initials, or Anonymous first.", "请先填写昵称、姓名首字母或匿名作者。" );
          creditInput.focus();
          return;
        }
        page.credit = creditInput.value.trim();
        creditInput.value = page.credit;
        page.creditConfirmed = confirmInput.checked;
        updateApproval();
      });
      creditLabel.append(creditText, creditInput);

      const authorActions = document.createElement("div");
      authorActions.className = "archive-author-actions";
      const recognizeAuthor = document.createElement("button");
      const useAnonymous = document.createElement("button");
      recognizeAuthor.type = useAnonymous.type = "button";
      recognizeAuthor.textContent = say("Read name from work", "从作品识别署名");
      useAnonymous.textContent = say("Use Anonymous", "使用匿名作者");
      recognizeAuthor.addEventListener("click", () => suggestAuthorFromWork(page, creditInput, confirmInput, recognizeAuthor, creditStatus));
      useAnonymous.addEventListener("click", () => {
        page.credit = say("Anonymous young creator", "匿名小作者");
        page.creditConfirmed = true;
        page.creditSource = "anonymous";
        creditInput.value = page.credit;
        confirmInput.checked = true;
        creditStatus.textContent = say("Anonymous credit selected.", "已选择匿名署名。" );
        updateApproval();
        renderBook();
      });
      authorActions.append(recognizeAuthor, useAnonymous);

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
      details.append(privacy, titleLabel, creditLabel, creditHelp, authorActions, creditStatus, confirmLabel, actions);
      if (page.crop && page.sourceDataUrl) {
        const toggleCrop = document.createElement("button");
        toggleCrop.type = "button";
        toggleCrop.textContent = say("Adjust crop", "调整裁切");
        actions.insertBefore(toggleCrop, remove);
        const cropEditor = document.createElement("div");
        cropEditor.className = "archive-crop-editor";
        cropEditor.hidden = true;
        const cropTitle = document.createElement("strong");
        cropTitle.textContent = say("Fine-tune this page", "精细调整这一页");
        cropEditor.append(cropTitle);
        const controls = [
          ["x", say("Left", "左侧"), 0, 95],
          ["y", say("Top", "顶部"), 0, 95],
          ["w", say("Width", "宽度"), 5, 100],
          ["h", say("Height", "高度"), 5, 100]
        ];
        controls.forEach(([key, labelText, min, max]) => {
          const label = document.createElement("label");
          const name = document.createElement("span");
          const input = document.createElement("input");
          const output = document.createElement("output");
          name.textContent = labelText;
          input.type = "range";
          input.min = String(min);
          input.max = String(max);
          input.value = String(Math.round(page.crop[key] * 100));
          output.textContent = `${input.value}%`;
          input.addEventListener("input", async () => {
            page.crop[key] = Number(input.value) / 100;
            if (key === "x" && page.crop.x + page.crop.w > 1) page.crop.w = Math.max(0.05, 1 - page.crop.x);
            if (key === "y" && page.crop.y + page.crop.h > 1) page.crop.h = Math.max(0.05, 1 - page.crop.y);
            if (key === "w" && page.crop.x + page.crop.w > 1) page.crop.x = Math.max(0, 1 - page.crop.w);
            if (key === "h" && page.crop.y + page.crop.h > 1) page.crop.y = Math.max(0, 1 - page.crop.h);
            output.textContent = `${input.value}%`;
            await recropPage(page);
            image.src = page.dataUrl;
            delete state.cloudMediaByPage[page.id];
            if (cloudStatus) cloudStatus.textContent = say("Crop changed—save online again when ready.", "裁切已改变，确认后请再次保存到云端。");
            renderBook();
          });
          label.append(name, input, output);
          cropEditor.append(label);
        });
        toggleCrop.addEventListener("click", () => {
          cropEditor.hidden = !cropEditor.hidden;
          toggleCrop.textContent = cropEditor.hidden ? say("Adjust crop", "调整裁切") : say("Close crop controls", "收起裁切工具");
        });
        details.append(cropEditor);
      }
      article.append(visual, details);
      pageEditor.append(article);
    });
  }

  function updateApproval() {
    approveProof.disabled = !authorsReady() || !approvalChecks.every((check) => check.checked);
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
    const project = { id, ...metadata, mode: state.mode, sources: state.sources, pages: state.pages, cloudProjectId: state.cloudProjectId, cloudConsentId: state.cloudConsentId, cloudMediaByPage: state.cloudMediaByPage, cloudAttester: cloudAttester?.value || "", savedAt: new Date().toISOString(), visibility: "private-device" };
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
    state.cloudProjectId = project.cloudProjectId || "";
    state.cloudConsentId = project.cloudConsentId || "";
    state.cloudMediaByPage = project.cloudMediaByPage || {};
    if (cloudAttester) cloudAttester.value = project.cloudAttester || "";
    if (cloudPermission) cloudPermission.checked = Boolean(state.cloudConsentId);
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
    updateCloudActions();
    publishSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("file_read_failed"));
      reader.readAsDataURL(blob);
    });
  }

  async function loadCloudProject(projectId) {
    const platform = window.StoriesLensPlatform;
    if (!platform || !projectId) return;
    cloudStatus.textContent = say("Opening the private classroom project…", "正在打开私密班级项目……");
    try {
      const result = await platform.api(`/api/projects/${encodeURIComponent(projectId)}`);
      const project = result.project;
      if (project.mode !== "classroom") throw new Error(say("This is not a classroom publishing project.", "这不是班级出版项目。"));
      const metadata = project.clientSnapshot?.teacherPublisher || {};
      const pages = [];
      for (let index = 0; index < project.scenes.length; index += 1) {
        const scene = project.scenes[index];
        if (!scene.imageUrl) continue;
        const response = await fetch(scene.imageUrl, { credentials: "same-origin" });
        if (!response.ok) throw new Error(say("One approved page could not be loaded.", "有一页审核作品暂时无法读取。"));
        const dataUrl = await blobToDataUrl(await response.blob());
        const page = makePage(dataUrl, index);
        page.id = scene.id || page.id;
        page.title = scene.title;
        page.credit = scene.text || say("Creator nickname", "创作者昵称");
        page.creditConfirmed = true;
        page.creditSource = "saved";
        pages.push(page);
        state.cloudMediaByPage[page.id] = { fingerprint: pageFingerprint(page), url: scene.imageUrl };
      }
      if (!pages.length) throw new Error(say("This project has no approved pages yet.", "这个项目还没有审核页面。"));
      state.mode = "individual";
      state.sources = [{ name: project.title, dataUrl: pages[0].dataUrl, width: 0, height: 0 }];
      state.pages = pages;
      state.cloudProjectId = project.id;
      state.cloudConsentId = metadata.classroomConsentId || "";
      if (cloudAttester) cloudAttester.value = metadata.attesterName || "";
      if (cloudPermission) cloudPermission.checked = Boolean(state.cloudConsentId);
      collectionTitle.value = project.title;
      collectionDate.value = metadata.collectionDate || todayValue();
      classLabel.value = metadata.classLabel || "";
      edition.value = metadata.edition || "single";
      coverTheme.value = metadata.coverTheme || "ink";
      setMode("individual");
      state.sources = [{ name: project.title, dataUrl: pages[0].dataUrl, width: 0, height: 0 }];
      state.pages = pages;
      renderSelection();
      renderPageEditor();
      resetApproval();
      reviewSection.hidden = false;
      publishSection.hidden = false;
      $("[data-progress-step='2']")?.classList.add("is-active");
      $("[data-progress-step='3']")?.classList.add("is-active");
      renderBook(-1);
      updateCloudActions();
      cloudStatus.textContent = say("Private classroom project opened.", "私密班级项目已打开。");
      publishSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (loadError) {
      cloudStatus.textContent = loadError.message || say("The private project could not be opened.", "暂时无法打开私密项目。");
    }
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

  function pageFingerprint(page) {
    const value = `${page.dataUrl.length}:${page.dataUrl.slice(-160)}`;
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function cloudProjectPayload(scenes = []) {
    const metadata = bookMetadata();
    return {
      title: metadata.title,
      language: currentLocale() === "zh" ? "zh" : "en",
      mode: "classroom",
      ageGroup: "adult",
      visibility: "invite",
      sourceType: "classroom",
      sourceText: say("Teacher-approved classroom collection", "教师审核的班级作品集"),
      draft: state.pages.map((page) => `${page.title} — ${page.credit}`).join("\n"),
      coverImageUrl: scenes[0]?.imageUrl || "",
      scenes: scenes.length ? scenes : state.pages.map((page, index) => ({
        id: page.id,
        title: page.title || say(`Student work ${index + 1}`, `学生作品${index + 1}`),
        text: page.credit,
        caption: page.title,
        imageUrl: "",
        duration: 6,
        transition: "fade"
      })),
      clientSnapshot: {
        teacherPublisher: {
          collectionDate: metadata.date,
          classLabel: metadata.classLabel,
          edition: metadata.edition,
          coverTheme: metadata.coverTheme,
          pageCount: state.pages.length,
          firstPageCreated: state.pages.length > 0,
          privacyReviewed: true,
          classroomConsentId: state.cloudConsentId,
          attesterName: cloudAttester?.value.trim() || "",
          savedAt: new Date().toISOString()
        },
        firstPageCreated: state.pages.length > 0
      }
    };
  }

  function updateCloudActions() {
    const saved = Boolean(state.cloudProjectId);
    [cloudShare, cloudDocx, cloudPdf].forEach((button) => { if (button) button.disabled = !saved; });
    if (cloudProduction) {
      cloudProduction.hidden = !saved;
      cloudProduction.href = saved ? `movie-studio.html?project=${encodeURIComponent(state.cloudProjectId)}&from=teacher` : "";
    }
    if (cloudSave) cloudSave.querySelector("span").textContent = saved ? say("Update approved cloud book", "更新云端审核版") : say("Save approved book online", "保存审核版到云端");
  }

  async function saveCloudBook() {
    const platform = window.StoriesLensPlatform;
    if (!platform) return;
    cloudSave.disabled = true;
    cloudStatus.textContent = say("Checking the teacher account…", "正在检查教师账户……");
    try {
      const session = await platform.getSession();
      if (!session.authenticated) {
        const returnTo = `classroom-archive.html?resume=${encodeURIComponent(state.projectId || "latest")}`;
        location.assign(`teacher-login.html?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      const attesterName = cloudAttester?.value.trim() || "";
      if (!attesterName || !cloudPermission?.checked) {
        cloudStatus.textContent = say(
          "Enter the educator name and confirm documented guardian permission before cloud storage.",
          "请填写教师姓名，并确认已取得所需监护人授权后再保存到云端。"
        );
        cloudAttester?.focus();
        return;
      }
      if (!state.cloudProjectId) {
        cloudStatus.textContent = say("Creating the private classroom project…", "正在创建私密班级项目……");
        const created = await platform.api("/api/projects", {
          method: "POST",
          headers: { "Idempotency-Key": `teacher-book-${state.projectId || pageFingerprint(state.pages[0])}` },
          body: JSON.stringify(cloudProjectPayload())
        });
        state.cloudProjectId = created.project.id;
      }
      if (!state.cloudConsentId) {
        cloudStatus.textContent = say("Recording the educator permission statement…", "正在记录教师授权声明……");
        const consentResult = await platform.api(`/api/projects/${encodeURIComponent(state.cloudProjectId)}/classroom-consent`, {
          method: "POST",
          body: JSON.stringify({
            attesterName,
            confirmedAdult: true,
            documentedGuardianPermission: true,
            approvedPrivateMedia: true,
            approvedFamilySharing: true,
            approvedPrinting: true,
            approvedClassFilm: true,
            acknowledgedRegionalProcessing: true
          })
        });
        state.cloudConsentId = consentResult.consent.id;
      }

      const scenes = [];
      for (let index = 0; index < state.pages.length; index += 1) {
        const page = state.pages[index];
        const fingerprint = pageFingerprint(page);
        const cached = state.cloudMediaByPage[page.id];
        let imageUrl = cached?.fingerprint === fingerprint ? cached.url : "";
        if (!imageUrl) {
          cloudStatus.textContent = say(`Saving approved work ${index + 1} of ${state.pages.length}…`, `正在保存第 ${index + 1}／${state.pages.length} 份审核作品……`);
          const uploaded = await platform.api("/api/media", {
            method: "POST",
            body: JSON.stringify({
              projectId: state.cloudProjectId,
              dataUrl: page.dataUrl,
              metadataRemoved: true,
              purpose: "classroom-work",
              personalPhotoConsentId: state.cloudConsentId,
              uploadId: `${page.id}-${fingerprint}`
            })
          });
          imageUrl = uploaded.media.url;
          state.cloudMediaByPage[page.id] = { fingerprint, url: imageUrl };
        }
        scenes.push({ id: page.id, title: page.title, text: page.credit, caption: page.title, imageUrl, duration: 6, transition: "fade" });
      }
      await platform.api(`/api/projects/${encodeURIComponent(state.cloudProjectId)}`, { method: "PATCH", body: JSON.stringify(cloudProjectPayload(scenes)) });
      await saveProject();
      updateCloudActions();
      cloudStatus.textContent = say("Saved to your regional private library. Nothing is public.", "已保存到所属地区的私密资料库，没有公开任何内容。");
    } catch (saveError) {
      if (saveError.status === 402) {
        cloudStatus.textContent = say("A Teacher Classroom Project is required to save up to 30 approved works online.", "云端保存最多30份审核作品需要一个教师班级项目额度。");
        $("[data-teacher-checkout]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        cloudStatus.textContent = saveError.message || say("The private cloud save did not complete.", "私密云端保存没有完成，请重试。");
      }
    } finally {
      cloudSave.disabled = false;
    }
  }

  async function shareCloudBook() {
    if (!state.cloudProjectId) return;
    cloudShare.disabled = true;
    try {
      const result = await window.StoriesLensPlatform.api(`/api/projects/${encodeURIComponent(state.cloudProjectId)}/share`, { method: "POST", body: "{}" });
      const shareUrl = new URL(result.shareUrl, location.href).href;
      if (navigator.share) await navigator.share({ title: bookMetadata().title, text: say("A private class book", "一本私密班级作品集"), url: shareUrl });
      else await navigator.clipboard.writeText(shareUrl);
      cloudStatus.textContent = say("Private family invitation ready. It expires automatically.", "私密家庭邀请已准备好，并会自动过期。");
    } catch (shareError) {
      cloudStatus.textContent = shareError.message || say("The invitation could not be created.", "暂时无法创建邀请。");
    } finally {
      cloudShare.disabled = false;
    }
  }

  async function downloadCloudBook(format) {
    if (!state.cloudProjectId) return;
    cloudStatus.textContent = say(`Preparing ${format.toUpperCase()}…`, `正在生成${format.toUpperCase()}……`);
    const response = await fetch(`/api/projects/${encodeURIComponent(state.cloudProjectId)}/export/${format}`, { credentials: "same-origin" });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      cloudStatus.textContent = problem.error || say("The export could not be created.", "暂时无法生成导出文件。");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(bookMetadata().title)}.${format}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    cloudStatus.textContent = say(`${format.toUpperCase()} downloaded.`, `${format.toUpperCase()}已下载。`);
  }

  $$('[data-capture-mode]').forEach((button) => button.addEventListener("click", () => setMode(button.dataset.captureMode)));
  boardInput.addEventListener("change", () => acceptFiles(boardInput.files, "board"));
  boardUploadInput.addEventListener("change", () => acceptFiles(boardUploadInput.files, "board"));
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
      state.cloudProjectId = "";
      state.cloudConsentId = "";
      state.cloudMediaByPage = {};
      updateCloudActions();
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
    if (!authorsReady() || !approvalChecks.every((check) => check.checked)) return;
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
  cloudSave?.addEventListener("click", saveCloudBook);
  cloudShare?.addEventListener("click", shareCloudBook);
  cloudDocx?.addEventListener("click", () => downloadCloudBook("docx"));
  cloudPdf?.addEventListener("click", () => downloadCloudBook("pdf"));
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
  updateCloudActions();
  const pageParams = new URLSearchParams(location.search);
  if (pageParams.get("project")) window.addEventListener("load", () => loadCloudProject(pageParams.get("project")), { once: true });
  else if (pageParams.has("resume") && !resumeLast.hidden) resumeLast.click();
})();
