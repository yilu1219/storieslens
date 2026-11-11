(() => {
  "use strict";

  const printSpec = () => window.StoriesLensArtworkPrepare;
  const PAGE_WIDTH = printSpec().PAGE_WIDTH_PX;
  const PAGE_HEIGHT = printSpec().PAGE_HEIGHT_PX;
  const MAX_PHOTOS = 20;
  const LOCALE_KEY = "storieslens_locale";

  const copy = {
    zh: {
      "brand-sub": "教师班级出书",
      kicker: "FOR TEACHERS · 教师出书",
      title: "上传学生作业，做成可分享给家长的班级电子书",
      lede: "教师免费上传作业照片，预览班级书，再生成私密链接或短码发给家长。家长可免费翻阅。正式电子版 ¥19.9（约 $2.99），确认付款并核对邮箱后发送 PDF。印刷由家长在付款前选择：软壳 ¥129（约 $17.99）或精美硬壳 ¥199（约 $27.99）。不需要走羽大师写作辅导，也不在这里给孩子结账。",
      "details-kicker": "班级信息",
      "class-label": "班级名称",
      "teacher-label": "教师姓名（选填）",
      "title-label": "书名",
      "class-placeholder": "例如：三年二班",
      "teacher-placeholder": "例如：李老师",
      "title-placeholder": "例如：我们的春天画展",
      album: "从相册选择作业照片",
      camera: "拍照上传",
      "student-placeholder": "名字或首字母（选填）",
      "safety-notice": "请上传学生作业、画作或作文照片。不要上传身份证、学生证、校园卡，也不要拍到电话、地址、邮箱或二维码。每页署名请用名字或首字母，不要写完整法定姓名或学号。",
      "adult-note": "这条线给教师或成年人使用。学生和家长预览不需要付款；付费下载或印刷由家长在自己的手机上完成。",
      "print-choices": "家长打开私密链接后，付款前自行选择精美硬壳（¥199，约 $27.99）或软壳（¥129，约 $17.99）。首批印刷在确认付款后由我们人工安排，没有自动物流跟踪，也没有印刷厂对接。电子版要等服务器确认付款，家长再确认邮箱后才会发送正式 PDF。",
      "preview-kicker": "预览班级书",
      prev: "上一页",
      next: "下一页",
      "download-preview": "下载教师预览 A5 PDF",
      "create-share": "生成家长私密链接",
      "share-ready": "私密链接已生成。不会出现在公开目录或搜索结果。",
      "copy-share": "复制链接",
      "open-share": "打开家长页",
      "trust-private": "默认私密 · 不公开列表",
      "trust-free": "教师预览免费 · 家长付费下载或印刷",
      "default-title": "我们的班级作品集",
      "default-class": "班级作品集",
      byline: "指导教师 · {name}",
      "page-of": "第 {current} 页，共 {total} 页",
      "page-label-cover": "封面",
      added: "已加入 {count} 张作业照片，正在生成预览…",
      ready: "班级书已准备好。请先预览，再生成发给家长的私密链接。",
      "reading-kicker": "认读确认",
      "reading-copy": "请学生把这一版读一遍。接受后记下认读，不改作业照片。也可以请语大师点评、改写和检查。",
      "reading-accept": "接受",
      "reading-yu": "请语大师点评改写检查",
      "reading-approved": "已记下：学生认读并接受了这一版。作业照片没有被改写。",
      "reading-empty": "还没有可检查的文字。作业照片保持原样。",
      "yu-working": "正在请语大师点评、改写和检查…",
      "yu-unavailable": "语大师还没有接通。原文和作业照片都保持不变。",
      "yu-ready": "语大师只提出检查意见。原文还没改，除非你采用检查稿。",
      "yu-apply": "采用语大师的检查稿",
      "yu-keep": "保留原文",
      "yu-kept": "已保留原文。",
      "yu-applied": "已采用语大师的检查稿。作业照片没有改。",
      processing: "正在本机处理照片并删除拍摄信息…",
      cutting: "正在用 pdf-craft 提取画作和文字…",
      "extract-done": "已用 pdf-craft 把画作和文字分开，再排到米色 A5 页上。文字没有改写。",
      "extract-uncertain": "文字没有把握，所以没有编造句子。原有笔迹还留在页面上，可以自己改正。",
      "scan-not-isolated": "没有把作品从桌面上分开，所以这一页没有用带桌面的原图。请把纸拍完整、尽量摊平后再试。",
      "extract-unavailable": "pdf-craft 的远程 OCR 还没接通，没有识别文字。原图还在，可以恢复或稍后重试。",
      "split-done": "这张照片左右各有一幅作品，已分成两页，并分别提取。可以撤销拆分。",
      restored: "已恢复原图。这不是提取后的重排页。",
      "restore-original": "原图",
      "retry-cutout": "重新提取",
      "undo-split": "撤销拆分",
      "text-label": "识别出的文字",
      blocked: "这张照片不能使用。请不要上传证件、学生证，或带有电话、地址、邮箱、二维码的画面。",
      unsupported: "请选择 JPG、PNG、WEBP、HEIC 或 HEIF 图片。",
      "too-many": "一次最多 20 张照片。",
      "need-photos": "请先上传至少一张学生作业照片。",
      "need-class": "请先填写班级名称。",
      "share-working": "正在生成私密链接…",
      "share-failed": "暂时无法生成私密链接，请再试一次。",
      "copied": "链接已复制。",
      "pdf-working": "正在生成教师预览 PDF…",
      "pdf-ready": "教师预览 A5 PDF 已准备好。",
      "pdf-failed": "预览 PDF 生成失败，请再试一次。",
      docTitle: "教师班级出书 · StoriesLens"
    },
    en: {
      "brand-sub": "Teacher class book",
      kicker: "FOR TEACHERS",
      title: "Turn student work into a class ebook parents can open",
      lede: "Teachers can upload assignment photos for free, preview the class book, and create a private link or short code for families. Parents can view it free. The official digital PDF is ¥19.9 (about $2.99) and is emailed after a parent confirms an address. Print is chosen before payment: softcover ¥129 (about $17.99) or premium hardcover ¥199 (about $27.99). This does not go through Yu mentoring, and children do not check out here.",
      "details-kicker": "CLASS DETAILS",
      "class-label": "Class name",
      "teacher-label": "Teacher name (optional)",
      "title-label": "Book title",
      "class-placeholder": "For example: Grade 3, Class 2",
      "teacher-placeholder": "For example: Ms. Li",
      "title-placeholder": "For example: Our Spring Art Show",
      album: "Choose work photos",
      camera: "Take a photo",
      "student-placeholder": "First name or initials (optional)",
      "safety-notice": "Upload student assignments, drawings, or writing. Do not upload identity documents, student or school IDs, or images with a phone number, address, email, or QR code. Use a first name or initials on each page, not a full legal name or school ID.",
      "adult-note": "This flow is for a teacher or another adult. Students and parents can preview without paying. Paid downloads or print orders are completed by a parent on their own phone.",
      "print-choices": "On the private link, a parent chooses premium hardcover (¥199, about $27.99) or softcover (¥129, about $17.99) before paying. The first batch is arranged by hand after a confirmed payment. There is no automated tracking, and no print partner is claimed. The digital PDF is emailed only after the server confirms payment and the parent confirms an address.",
      "preview-kicker": "CLASS BOOK PREVIEW",
      prev: "Previous",
      next: "Next",
      "download-preview": "Download teacher preview A5 PDF",
      "create-share": "Create a private parent link",
      "share-ready": "The private link is ready. It is not listed publicly or submitted to search.",
      "copy-share": "Copy link",
      "open-share": "Open the parent page",
      "trust-private": "Private by default · not listed",
      "trust-free": "Teacher preview is free · parents pay to download or print",
      "default-title": "Our Class Collection",
      "default-class": "Class collection",
      byline: "Teacher · {name}",
      "page-of": "Page {current} of {total}",
      "page-label-cover": "Cover",
      added: "{count} photos added. Building the preview…",
      ready: "The class book is ready. Please review it, then create a private link for parents.",
      "reading-kicker": "Approve reading",
      "reading-copy": "Have the student read this version. Accept records that reading and does not change the work photos. You can also ask Yu to review and check.",
      "reading-accept": "Accept",
      "reading-yu": "Ask Yu to review and check",
      "reading-approved": "Saved: the student read this version and accepted it. The work photos were not rewritten.",
      "reading-empty": "There is no writing to check yet. The work photos stay as they are.",
      "yu-working": "Asking Yu to review and check…",
      "yu-unavailable": "Yu is not connected yet. The original words and work photos stay unchanged.",
      "yu-ready": "Yu offered a check. The original stays until you adopt that check.",
      "yu-apply": "Use Yu’s checked text",
      "yu-keep": "Keep the original",
      "yu-kept": "The original was kept.",
      "yu-applied": "Yu’s checked text is saved. The work photos were not changed.",
      processing: "Preparing photos on this device and removing camera details…",
      cutting: "Extracting the drawing and the words with pdf-craft…",
      "extract-done": "pdf-craft separated the drawing and the words, then placed them on a cream A5 page. The words were not rewritten.",
      "extract-uncertain": "The words were not read confidently, so nothing was invented. The original marks stay on the page and can be corrected.",
      "scan-not-isolated": "The sheet could not be separated from the table, so the tabletop photo was not used. Retake it with the whole page visible and as flat as you can.",
      "extract-unavailable": "pdf-craft remote OCR is not configured, so no words were recognized. The original photo is still here.",
      "split-done": "This photo has a piece on the left and a piece on the right, so each side was extracted into its own page. You can undo the split.",
      restored: "The original photo is restored. This is not an extracted page.",
      "restore-original": "Original",
      "retry-cutout": "Extract again",
      "undo-split": "Undo split",
      "text-label": "Extracted words",
      blocked: "That photo cannot be used. Please do not upload identity documents, school IDs, or images with a phone number, address, email, or QR code.",
      unsupported: "Please choose a JPG, PNG, WEBP, HEIC, or HEIF image.",
      "too-many": "You can add up to 20 photos at a time.",
      "need-photos": "Please upload at least one student work photo first.",
      "need-class": "Please enter a class name first.",
      "share-working": "Creating the private link…",
      "share-failed": "The private link could not be created. Please try again.",
      "copied": "Link copied.",
      "pdf-working": "Creating the teacher preview PDF…",
      "pdf-ready": "The teacher preview A5 PDF is ready.",
      "pdf-failed": "The preview PDF could not be created. Please try again.",
      docTitle: "Teacher class book · StoriesLens"
    }
  };

  const els = {
    className: document.querySelector("[data-class-name]"),
    teacherName: document.querySelector("[data-teacher-name]"),
    title: document.querySelector("[data-title]"),
    album: document.querySelector("[data-album]"),
    camera: document.querySelector("[data-camera]"),
    thumbs: document.querySelector("[data-thumbs]"),
    status: document.querySelector("[data-status]"),
    previewCard: document.querySelector("[data-preview-card]"),
    pageImage: document.querySelector("[data-page-image]"),
    pageLabel: document.querySelector("[data-page-label]"),
    prev: document.querySelector("[data-prev]"),
    next: document.querySelector("[data-next]"),
    downloadPreview: document.querySelector("[data-download-preview]"),
    createShare: document.querySelector("[data-create-share]"),
    shareBox: document.querySelector("[data-share-box]"),
    shareUrl: document.querySelector("[data-share-url]"),
    shareCode: document.querySelector("[data-share-code]"),
    copyShare: document.querySelector("[data-copy-share]"),
    openShare: document.querySelector("[data-open-share]"),
    readingCard: document.querySelector("[data-reading-card]"),
    readingText: document.querySelector("[data-reading-text]"),
    readingAccept: document.querySelector("[data-reading-accept]"),
    readingYu: document.querySelector("[data-reading-yu]"),
    readingStatus: document.querySelector("[data-reading-status]"),
    yuResult: document.querySelector("[data-yu-result]"),
    yuComment: document.querySelector("[data-yu-comment]"),
    yuSuggestion: document.querySelector("[data-yu-suggestion]"),
    yuApply: document.querySelector("[data-yu-apply]"),
    yuKeep: document.querySelector("[data-yu-keep]")
  };

  const state = { locale: "zh", photos: [], pages: [], previewPages: [], pageIndex: 0, share: null, busy: false, noticeKey: "", announcePrepare: false, readingApproval: null, yuOffer: null };

  const t = (key, vars) => {
    const table = copy[state.locale] || copy.zh;
    let value = table[key] || copy.en[key] || key;
    if (vars) Object.keys(vars).forEach((name) => { value = value.replaceAll(`{${name}}`, String(vars[name])); });
    return value;
  };
  const className = () => els.className.value.trim();
  const teacherName = () => els.teacherName.value.trim();
  const bookTitle = () => els.title.value.trim() || className() || t("default-title");

  function detectLocale() {
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (stored === "zh" || stored === "en") return stored;
    } catch (_error) {}
    const ua = navigator.userAgent || "";
    const wechatLang = ua.match(/Language\/([a-zA-Z0-9_-]+)/i);
    if (wechatLang) return /^zh/i.test(wechatLang[1]) ? "zh" : "en";
    const languages = [navigator.language, ...(navigator.languages || [])].filter(Boolean).map((item) => String(item).toLowerCase());
    if (languages.some((item) => item.startsWith("zh"))) return "zh";
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Shanghai|Chongqing|Urumqi|Hong_Kong|Taipei|Macau/i.test(timeZone)) return "zh";
    } catch (_error) {}
    return "en";
  }

  function setStatus(message, isError = false) {
    els.status.textContent = message || "";
    els.status.classList.toggle("is-error", Boolean(isError));
  }

  function applyLocale(next) {
    state.locale = next === "en" ? "en" : "zh";
    document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
    document.title = t("docTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    els.className.placeholder = t("class-placeholder");
    els.teacherName.placeholder = t("teacher-placeholder");
    els.title.placeholder = t("title-placeholder");
    document.querySelectorAll("[data-locale]").forEach((button) => {
      const active = button.dataset.locale === state.locale;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    try { localStorage.setItem(LOCALE_KEY, state.locale); } catch (_error) {}
    if (state.photos.length) void rebuildBook();
  }

  function inspectUpload(file, studentName) {
    const safety = window.StoriesLensParentBookSafety;
    if (!safety?.inspectParentBookUpload) return { blocked: false };
    return safety.inspectParentBookUpload({ filename: file?.name, caption: studentName, title: bookTitle() });
  }

  function loadHtmlImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("invalid_image"));
      image.src = src;
    });
  }

  function canvasToJpeg(canvas, quality = 0.92) {
    return canvas.toDataURL("image/jpeg", quality);
  }

  function ptToPx(pt) {
    return Math.max(1, Math.round(pt * PAGE_HEIGHT / printSpec().PAGE_HEIGHT_MM * 25.4 / 72));
  }

  function bodyFont() {
    return getComputedStyle(document.body).fontFamily;
  }

  function addPrintPdfPage(pdf, image) {
    const spec = printSpec();
    const page = pdf.addPage([spec.BLEED_WIDTH_PT, spec.BLEED_HEIGHT_PT]);
    page.setMediaBox(0, 0, spec.BLEED_WIDTH_PT, spec.BLEED_HEIGHT_PT);
    page.setBleedBox(0, 0, spec.BLEED_WIDTH_PT, spec.BLEED_HEIGHT_PT);
    page.setTrimBox(spec.BLEED_PT, spec.BLEED_PT, spec.TRIM_WIDTH_PT, spec.TRIM_HEIGHT_PT);
    page.drawImage(image, { x: 0, y: 0, width: spec.BLEED_WIDTH_PT, height: spec.BLEED_HEIGHT_PT });
    return page;
  }

  let brandMarkPromise = null;
  function loadBrandMark() {
    if (!brandMarkPromise) {
      brandMarkPromise = loadHtmlImage("assets/storieslens-logo.png").catch((error) => {
        brandMarkPromise = null;
        throw error;
      });
    }
    return brandMarkPromise;
  }

  async function watermarkPage(dataUrl) {
    const page = await loadHtmlImage(dataUrl);
    const logo = await loadBrandMark();
    const width = page.naturalWidth || page.width || PAGE_WIDTH;
    const height = page.naturalHeight || page.height || PAGE_HEIGHT;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(page, 0, 0, width, height);
    const mark = Math.round(width * 0.16);
    const margin = Math.round(width * 0.045);
    context.save();
    context.globalAlpha = 0.62;
    context.drawImage(logo, width - mark - margin, margin, mark, mark);
    context.restore();
    return canvasToJpeg(canvas, 0.92);
  }

  function prepareApi() {
    return window.StoriesLensArtworkPrepare;
  }

  async function pixelsFromDataUrl(dataUrl) {
    const image = await loadHtmlImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d", { alpha: true });
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  async function sanitizeToPng(file) {
    const artwork = window.StoriesLensArtworkSafety;
    if (artwork?.removeMetadata) {
      const sanitized = await artwork.removeMetadata(file, { preserveAlpha: true });
      return sanitized.dataUrl;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadHtmlImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d", { alpha: true });
      context.drawImage(image, 0, 0);
      return canvas.toDataURL("image/png");
    } finally { URL.revokeObjectURL(url); }
  }

  function noteExtract(pages) {
    const rank = { unavailable: 6, split: 5, uncertain: 4, extracted: 3, restored: 2 };
    pages.forEach((page) => {
      const key = page.textStatus === "unavailable" ? "unavailable" : page.textStatus === "uncertain" ? "uncertain" : page.groupId ? "split" : "extracted";
      if ((rank[key] || 0) >= (rank[state.noticeKey] || 0)) state.noticeKey = key;
    });
  }

  async function photosFromScan(originalDataUrl, fileName, manuscript, options) {
    const pixels = await pixelsFromDataUrl(originalDataUrl);
    const built = await prepareApi().pagesFromPhonePhoto({
      rgba: pixels.data,
      width: pixels.width,
      height: pixels.height,
      allowSplit: !options || options.allowSplit !== false,
      manuscript: Boolean(manuscript),
      extract: (dataUrl) => prepareApi().requestPdfCraftExtraction(dataUrl),
      toPng: (rgba, width, height) => prepareApi().rgbaToPngDataUrl(rgba, width, height)
    });
    const groupId = built.split ? `split-${Date.now().toString(36)}` : "";
    const photos = built.pages.map((page) => ({
      dataUrl: page.dataUrl || (page.artworks[0] && page.artworks[0].dataUrl) || page.marksDataUrl || page.scanDataUrl,
      scanIsolated: page.scanIsolated !== false,
      originalDataUrl,
      scanDataUrl: page.scanDataUrl,
      marksDataUrl: page.marksDataUrl,
      artworks: page.artworks,
      text: page.text,
      textStatus: page.textStatus,
      textEdited: false,
      name: fileName || "",
      studentName: "",
      manuscript: Boolean(manuscript),
      groupId,
      extractEngine: "pdf-craft",
      extractReason: page.extractReason
    }));
    noteExtract(photos);
    return photos;
  }

  function wrapText(context, text, maxWidth) {
    const value = String(text || "");
    if (!value) return [];
    const characters = /[\u3400-\u9fff]/.test(value) ? Array.from(value) : value.split(/\s+/);
    const lines = [];
    let current = "";
    characters.forEach((part, index) => {
      const chunk = /[\u3400-\u9fff]/.test(value) ? `${current}${part}` : current ? `${current} ${part}` : part;
      if (context.measureText(chunk).width <= maxWidth || !current) current = chunk;
      else { lines.push(current); current = part; }
      if (index === characters.length - 1 && current) lines.push(current);
    });
    return lines.slice(0, 5);
  }

  function drawImageContained(context, image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function overlayCaption(context, text, y, size) {
    context.save();
    context.textAlign = "center";
    context.font = `700 ${size}px ${getComputedStyle(document.body).fontFamily}`;
    context.lineWidth = 10;
    context.strokeStyle = "rgba(246,240,228,0.88)";
    context.strokeText(text, PAGE_WIDTH / 2, y);
    context.fillStyle = "#1c2420";
    context.fillText(text, PAGE_WIDTH / 2, y);
    context.restore();
  }

  async function renderWorkPage(photo, extras = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    const artworks = [];
    for (const item of photo.artworks || []) {
      const src = item && (item.dataUrl || item);
      if (typeof src === "string" && src) artworks.push(await loadHtmlImage(src));
    }
    let marks = null;
    const marksUrl = photo.scanIsolated === false ? "" : (photo.marksDataUrl || photo.scanDataUrl || "");
    if (marksUrl) marks = await loadHtmlImage(marksUrl);
    prepareApi().drawRebuiltPage(context, {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      pageNumber: extras.pageNumber || 1,
      artworks,
      marks,
      text: photo.text || "",
      status: photo.textStatus,
      edited: photo.textEdited === true,
      manuscript: photo.manuscript === true,
      title: extras.title || "",
      subtitle: extras.subtitle || "",
      paper: "#f6f0e4",
      fontFamily: bodyFont()
    });
    return canvasToJpeg(canvas, 0.92);
  }

  async function renderCoverPage(pageNumber = 1) {
    const cover = state.photos[0];
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    const heroUrl = cover && cover.scanIsolated !== false ? (cover.scanDataUrl || cover.dataUrl || "") : "";
    if (!heroUrl) {
      const frame = prepareApi().printSafeFrame(PAGE_WIDTH, PAGE_HEIGHT, pageNumber);
      const center = frame.x + frame.w / 2;
      context.textAlign = "center";
      context.fillStyle = "#101817";
      context.font = `700 ${ptToPx(22)}px ${bodyFont()}`;
      wrapText(context, bookTitle(), frame.w).forEach((line, index) => {
        context.fillText(line, center, frame.y + frame.h * 0.42 + index * ptToPx(28));
      });
      const subtitle = className() || teacherName();
      if (subtitle) {
        context.fillStyle = "#3d4a44";
        context.font = `600 ${ptToPx(12)}px ${bodyFont()}`;
        context.fillText(subtitle, center, frame.y + frame.h - ptToPx(10));
      }
      return canvasToJpeg(canvas, 0.92);
    }
    const image = await loadHtmlImage(heroUrl);
    prepareApi().drawCoverPage(context, {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      pageNumber,
      image,
      title: bookTitle(),
      subtitle: className() || teacherName() || "",
      paper: "#f6f0e4",
      fontFamily: bodyFont()
    });
    return canvasToJpeg(canvas, 0.92);
  }

  async function renderPhotoPage(photo, index, pageNumber) {
    const subtitle = [photo.studentName, String(index + 1)].filter(Boolean).join(" · ");
    return renderWorkPage(photo, { subtitle, pageNumber });
  }

  async function rebuildBook() {
    if (!state.photos.length) {
      state.pages = [];
      state.previewPages = [];
      els.previewCard.hidden = true;
      return;
    }
    const pages = [await renderCoverPage(1)];
    for (let index = 0; index < state.photos.length; index += 1) {
      pages.push(await renderPhotoPage(state.photos[index], index, index + 2));
    }
    const previewPages = [];
    for (const page of pages) previewPages.push(await watermarkPage(page));
    state.pages = pages;
    state.previewPages = previewPages;
    state.pageIndex = Math.min(state.pageIndex, pages.length - 1);
    renderPreview();
    els.previewCard.hidden = false;
    showReadingCheck();
    const noticeKeys = { split: "split-done", uncertain: "extract-uncertain", unavailable: "extract-unavailable", extracted: "extract-done", restored: "restored" };
    const notice = noticeKeys[state.noticeKey] ? t(noticeKeys[state.noticeKey]) : "";
    setStatus(state.announcePrepare && notice ? notice : t("ready"));
    state.announcePrepare = false;
  }

  function renderPreview() {
    const shown = state.previewPages[state.pageIndex];
    if (!shown) return;
    els.pageImage.src = shown;
    els.pageLabel.textContent = state.pageIndex === 0 ? t("page-label-cover") : t("page-of", { current: state.pageIndex + 1, total: state.pages.length });
    els.prev.disabled = state.pageIndex === 0;
    els.next.disabled = state.pageIndex >= state.pages.length - 1;
  }

  function replacePhotoGroup(photo, replacements) {
    const index = state.photos.findIndex((item) => (photo.groupId && item.groupId === photo.groupId) || item === photo);
    state.photos = state.photos.filter((item) => photo.groupId ? item.groupId !== photo.groupId : item !== photo);
    replacements.forEach((item) => { item.studentName = photo.studentName || ""; });
    state.photos.splice(Math.max(0, index), 0, ...replacements);
  }

  function renderThumbs() {
    els.thumbs.innerHTML = "";
    state.photos.forEach((photo, index) => {
      const item = document.createElement("div");
      item.className = "thumb";
      const frame = document.createElement("div");
      frame.className = "thumb-frame";
      const image = document.createElement("img");
      image.src = photo.dataUrl;
      const remove = document.createElement("button");
      remove.className = "thumb-remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        state.photos = state.photos.filter((item) => photo.groupId ? item.groupId !== photo.groupId : item !== photo);
        renderThumbs();
        void rebuildBook();
      });
      frame.append(image, remove);
      const tools = document.createElement("div");
      tools.className = "thumb-tools";
      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = t("restore-original");
      restore.addEventListener("click", () => {
        replacePhotoGroup(photo, [{
          dataUrl: photo.originalDataUrl,
          originalDataUrl: photo.originalDataUrl,
          scanDataUrl: photo.originalDataUrl,
          marksDataUrl: photo.originalDataUrl,
          artworks: [],
          text: "",
          textStatus: "restored",
          textEdited: false,
          name: photo.name,
          studentName: photo.studentName,
          manuscript: photo.manuscript,
          groupId: "",
          extractEngine: "pdf-craft",
          extractReason: "restored"
        }]);
        state.noticeKey = "restored";
        renderThumbs();
        void rebuildBook().then(() => setStatus(t("restored")));
      });
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = t("retry-cutout");
      retry.addEventListener("click", () => { void reprocessPhoto(photo, { retry: true }); });
      tools.append(restore, retry);
      const writing = document.createElement("textarea");
      writing.className = "thumb-text";
      writing.maxLength = 4000;
      writing.value = photo.textStatus === "ok" || photo.textStatus === "parent" || photo.textEdited ? (photo.text || "") : "";
      writing.placeholder = photo.textStatus === "unavailable" ? t("extract-unavailable") : photo.textStatus === "uncertain" ? t("extract-uncertain") : t("text-label");
      writing.setAttribute("aria-label", t("text-label"));
      writing.addEventListener("change", () => {
        photo.text = writing.value;
        photo.textEdited = true;
        photo.textStatus = "parent";
        renderThumbs();
        void rebuildBook();
      });
      if (photo.groupId) {
        const undo = document.createElement("button");
        undo.type = "button";
        undo.textContent = t("undo-split");
        undo.addEventListener("click", () => { void reprocessPhoto(photo, { allowSplit: false }); });
        tools.append(undo);
      }
      const name = document.createElement("input");
      name.className = "thumb-name";
      name.maxLength = 40;
      name.placeholder = t("student-placeholder");
      name.value = photo.studentName || "";
      name.addEventListener("change", () => {
        const inspection = inspectUpload({ name: photo.name }, name.value);
        if (inspection.blocked) {
          setStatus(t("blocked"), true);
          name.value = "";
          photo.studentName = "";
          return;
        }
        photo.studentName = name.value.trim();
        void rebuildBook();
      });
      item.append(frame, tools, writing, name);
      els.thumbs.append(item);
    });
  }

  async function reprocessPhoto(photo, options) {
    setStatus(t("cutting"));
    const photos = await photosFromScan(photo.originalDataUrl, photo.name, photo.manuscript, options);
    replacePhotoGroup(photo, photos);
    state.announcePrepare = true;
    renderThumbs();
    await rebuildBook();
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    if (state.photos.length + files.length > MAX_PHOTOS) return setStatus(t("too-many"), true);
    state.busy = true;
    state.noticeKey = "";
    setStatus(t("cutting"));
    try {
      for (const file of files) {
        if (inspectUpload(file).blocked) { setStatus(t("blocked"), true); continue; }
        const supported = window.StoriesLensArtworkSafety?.isSupportedImage
          ? window.StoriesLensArtworkSafety.isSupportedImage(file)
          : /image\//.test(file.type || "") || /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name || "");
        if (!supported) { setStatus(t("unsupported"), true); continue; }
        try {
          const originalDataUrl = await sanitizeToPng(file);
          const manuscript = prepareApi().looksLikeManuscript(file.name);
          const photos = await photosFromScan(originalDataUrl, file.name || "", manuscript);
          if (state.photos.length + photos.length > MAX_PHOTOS) { setStatus(t("too-many"), true); break; }
          state.photos.push(...photos);
        } catch (_error) {
          setStatus(t("unsupported"), true);
        }
      }
      renderThumbs();
      if (state.photos.length) {
        state.announcePrepare = true;
        await rebuildBook();
      }
    } finally {
      state.busy = false;
    }
  }

  function readingBook() {
    return {
      title: bookTitle(),
      authorName: teacherName(),
      authorIntro: className(),
      locale: state.locale,
      notes: state.photos.flatMap((photo) => [photo.studentName, (photo.textStatus === "ok" || photo.textStatus === "parent" || photo.textEdited) ? photo.text : ""].filter(Boolean)),
      photos: state.photos.map((photo) => photo.dataUrl)
    };
  }

  function showReadingCheck() {
    if (!els.readingCard) return;
    const review = window.StoriesLensFamilyBookReview;
    els.readingCard.hidden = !state.photos.length;
    if (els.readingText && review) els.readingText.textContent = review.bookReadingText(readingBook());
    if (els.readingStatus && state.readingApproval?.approved) els.readingStatus.textContent = t("reading-approved");
  }

  function acceptReading() {
    const review = window.StoriesLensFamilyBookReview;
    state.readingApproval = review.approveReading(readingBook());
    if (els.readingStatus) els.readingStatus.textContent = t("reading-approved");
    if (els.yuResult) els.yuResult.hidden = true;
    setStatus(t("reading-approved"));
  }

  async function askYuToReview() {
    const review = window.StoriesLensFamilyBookReview;
    const book = readingBook();
    const request = review.yuMentorReviewRequest(book);
    if (!request.original) {
      if (els.readingStatus) els.readingStatus.textContent = t("reading-empty");
      setStatus(t("reading-empty"), true);
      return;
    }
    if (els.readingYu) els.readingYu.disabled = true;
    setStatus(t("yu-working"));
    try {
      const response = await fetch(request.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body)
      });
      const payload = await response.json().catch(() => ({}));
      const outcome = review.yuReviewOutcome({
        original: request.original,
        status: response.status,
        result: response.ok ? (payload.result || payload) : null
      });
      if (!outcome.configured) {
        if (els.yuResult) els.yuResult.hidden = true;
        if (els.readingStatus) els.readingStatus.textContent = t("yu-unavailable");
        setStatus(t("yu-unavailable"), true);
        return;
      }
      state.yuOffer = outcome;
      if (els.yuComment) els.yuComment.textContent = outcome.comment;
      if (els.yuSuggestion) els.yuSuggestion.textContent = outcome.suggestion;
      if (els.yuResult) els.yuResult.hidden = false;
      if (els.readingStatus) els.readingStatus.textContent = t("yu-ready");
      setStatus(t("yu-ready"));
    } catch (_error) {
      if (els.yuResult) els.yuResult.hidden = true;
      setStatus(t("yu-unavailable"), true);
    } finally {
      if (els.readingYu) els.readingYu.disabled = false;
    }
  }

  function applyYuOffer() {
    const review = window.StoriesLensFamilyBookReview;
    const book = readingBook();
    const photoSnapshot = book.photos.slice();
    const applied = review.applyYuSuggestion(book, state.yuOffer?.suggestion || "");
    if (!applied.applied || photoSnapshot.join("|") !== (applied.photos || []).join("|")) {
      setStatus(t("yu-kept"));
      return;
    }
    if (String(book.authorIntro || "").trim()) els.className.value = applied.authorIntro;
    else els.title.value = applied.title;
    setStatus(t("yu-applied"));
    void rebuildBook();
  }

  function keepOriginalAfterYu() {
    state.yuOffer = null;
    if (els.yuResult) els.yuResult.hidden = true;
    setStatus(t("yu-kept"));
  }

  function dataUrlToBytes(dataUrl) {
    const match = String(dataUrl || "").match(/^data:image\/(?:jpeg|jpg|png);base64,([a-zA-Z0-9+/=\s]+)$/i);
    const binary = atob(match[1].replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function downloadPreviewPdf() {
    if (!state.pages.length || state.previewPages.length !== state.pages.length) return setStatus(t("need-photos"), true);
    setStatus(t("pdf-working"));
    try {
      const pdf = await window.PDFLib.PDFDocument.create();
      pdf.setTitle(bookTitle());
      pdf.setSubject("StoriesLens watermarked informal preview. Not an official paid PDF.");
      pdf.setCreator("StoriesLens Informal Preview");
      for (const pageDataUrl of state.previewPages) {
        const image = await pdf.embedJpg(dataUrlToBytes(pageDataUrl));
        addPrintPdfPage(pdf, image);
      }
      const bytes = await pdf.save({ useObjectStreams: false });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bookTitle()}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      setStatus(t("pdf-ready"));
    } catch (_error) {
      setStatus(t("pdf-failed"), true);
    }
  }

  async function createShare() {
    if (!className()) return setStatus(t("need-class"), true);
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    setStatus(t("share-working"));
    try {
      const response = await fetch("/api/family-book/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "class",
          title: bookTitle(),
          className: className(),
          teacherName: teacherName(),
          language: state.locale,
          pages: state.pages.map((imageDataUrl, index) => ({
            imageDataUrl,
            studentName: index === 0 ? "" : (state.photos[index - 1]?.studentName || "")
          }))
        })
      });
      const result = await response.json();
      if (!response.ok || !result.share) throw new Error(result.error || "share_failed");
      state.share = result;
      const url = new URL(result.sharePath, window.location.origin).href;
      els.shareUrl.textContent = url;
      els.shareCode.textContent = result.share.code;
      els.shareBox.hidden = false;
      setStatus(t("share-ready"));
    } catch (_error) {
      setStatus(t("share-failed"), true);
    }
  }

  els.album.addEventListener("change", (event) => { void addFiles(event.target.files); event.target.value = ""; });
  els.camera.addEventListener("change", (event) => { void addFiles(event.target.files); event.target.value = ""; });
  ["className", "teacherName", "title"].forEach((key) => {
    els[key].addEventListener("change", () => { if (state.photos.length) void rebuildBook(); });
  });
  els.prev.addEventListener("click", () => { if (state.pageIndex > 0) { state.pageIndex -= 1; renderPreview(); } });
  els.next.addEventListener("click", () => { if (state.pageIndex < state.pages.length - 1) { state.pageIndex += 1; renderPreview(); } });
  els.downloadPreview.addEventListener("click", () => void downloadPreviewPdf());
  els.readingAccept?.addEventListener("click", () => acceptReading());
  els.readingYu?.addEventListener("click", () => void askYuToReview());
  els.yuApply?.addEventListener("click", () => applyYuOffer());
  els.yuKeep?.addEventListener("click", () => keepOriginalAfterYu());
  els.createShare.addEventListener("click", () => void createShare());
  els.copyShare.addEventListener("click", async () => {
    if (!state.share) return;
    const url = new URL(state.share.sharePath, window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setStatus(t("copied")); } catch (_error) { setStatus(url); }
  });
  els.openShare.addEventListener("click", () => {
    if (state.share) window.open(new URL(state.share.sharePath, window.location.origin).href, "_blank", "noopener");
  });
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => applyLocale(button.dataset.locale));
  });
  applyLocale(detectLocale());
})();
