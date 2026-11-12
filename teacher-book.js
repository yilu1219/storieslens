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
      "interior-legend": "内页样式",
      "interior-original": "原画摆正",
      "interior-polished": "精修插画",
      "interior-hint": "默认是原画摆正：画在安全框里，学生的话单独排成文字层。精修插画只换画面层，文字仍是排版，不会画进图里。两种最后都保留手稿。",
      "assistant-kicker": "排版助手",
      "assistant-hint": "可以建议间距、换行、图文比例和画面整理。校对会标出错别字、拼写和明显语法。每条建议都会先对照显示。只有你点接受，才会写进这本书。",
      "page-edit-note": "这一页可以直接改排好的文字，也可以在安全框里拖动或缩放画面。学生的原文和原画不会自动改。助手要改用词或换画面时，会先标明，等你接受。",
      "page-text-label": "这一页的文字",
      "art-move-label": "拖动画面",
      "art-resize-label": "缩放画面",
      "assistant-type": "整理间距和换行",
      "assistant-layout": "调整图文比例",
      "assistant-art": "整理画面",
      "assistant-proof": "校对文字",
      "assistant-accept": "接受",
      "assistant-reject": "不采用",
      "assistant-pending": "这是建议，还没有写进书里。",
      "assistant-accepted": "已写入这一页。",
      "assistant-dismissed": "未采用。文字层和画面层保持原样。",
      "assistant-unchanged": "这条建议不会改学生的话或画。",
      "assistant-working": "正在准备画面建议…",
      "assistant-art-failed": "画面没有整理成功。原画仍在。",
      "assistant-type-label": "间距和换行。不改用词。",
      "assistant-layout-label": "图文比例",
      "assistant-art-label": "画面整理。接受之后才替换画面层。",
      "assistant-proof-layout": "校对：间距和换行。不改用词。",
      "assistant-proof-punctuation": "校对：标点。不改学生的用词。",
      "assistant-proof-wording": "校对：这是改词建议。",
      "assistant-proof-confirm": "校对：请确认这处文字。系统没有猜一句新的。",
      "assistant-wording-note": "这会改动学生的用词，不是只改标点或空格。不接受就不会写入。",
      "assistant-confirm-note": "识别不确定，或需要你确认。这里没有改成另一套说法。",
      "assistant-before": "现在的文字",
      "assistant-after": "建议写成",
      "assistant-empty": "（空，没有猜词）",
      "assistant-share": "文字层约占 {n}%",
      "assistant-proof-clear": "这一页看起来没有问题。",
      "assistant-proof-alert": "这一页有拼写或语法建议。点接受才会改文字。",
      "assistant-proof-other": "还有页面有校对建议。",
      "assistant-proof-jump": "打开有问题的那一页",
      "assistant-proof-manuscript": "手稿页保持原笔迹，不会自动改字。",
      "assistant-proof-done": "校对建议已看完。未接受的内容没有写入。",
      "page-label-manuscript": "手稿",
      "progress-illustrate": "正在按原画准备精修插画（第 {current} 张，共 {count} 张）",
      "polish-fallback": "精修插画这次没有生成，这一页仍使用摆正后的原画。这句话只出现在屏幕上。",
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
      "text-label": "文字层",
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
      "interior-legend": "Interior style",
      "interior-original": "Original artwork",
      "interior-polished": "Polished illustrations",
      "interior-hint": "Original artwork is the default: the drawing sits in a print-safe frame and the student’s words are a separate text layer. Polished illustrations replace only the art layer. The words stay typeset and are not drawn into the picture. Both end with the manuscript.",
      "assistant-kicker": "Editing assistant",
      "assistant-hint": "It can suggest spacing, line breaks, the picture-and-text balance, and art cleanup. Proofreading flags misspellings, wrong characters, and clear grammar. Each suggestion is shown first. Nothing enters the book until you accept it.",
      "page-edit-note": "Edit the typeset words on this page, or drag and resize the picture inside the safe area. The student’s wording and original art stay as they are until you change them. Assistant wording or art changes stay labeled and wait for Accept.",
      "page-text-label": "Text on this page",
      "art-move-label": "Move the picture",
      "art-resize-label": "Resize the picture",
      "assistant-type": "Tidy spacing and line breaks",
      "assistant-layout": "Adjust the picture and text",
      "assistant-art": "Clean up the picture",
      "assistant-proof": "Proofread the words",
      "assistant-accept": "Accept",
      "assistant-reject": "Don’t use this",
      "assistant-pending": "This is a suggestion. It is not in the book yet.",
      "assistant-accepted": "Accepted and placed on this page.",
      "assistant-dismissed": "Dismissed. The text layer and the art layer stay as they are.",
      "assistant-unchanged": "This suggestion does not change the student’s words or picture.",
      "assistant-working": "Preparing a picture suggestion…",
      "assistant-art-failed": "The picture was not cleaned up. The original art is still here.",
      "assistant-type-label": "Spacing and line breaks. The words stay the same.",
      "assistant-layout-label": "Picture and text balance",
      "assistant-art-label": "Picture cleanup. The art layer changes only if you accept.",
      "assistant-proof-layout": "Proofreading: spacing and line breaks. The wording stays the same.",
      "assistant-proof-punctuation": "Proofreading: punctuation. The student’s words stay the same.",
      "assistant-proof-wording": "Proofreading: this suggestion changes wording.",
      "assistant-proof-confirm": "Proofreading: please confirm this reading. Nothing new was guessed.",
      "assistant-wording-note": "This would change the student’s words, not only punctuation or spacing. It stays out of the book unless you accept it.",
      "assistant-confirm-note": "This reading is uncertain or needs your confirmation. No other wording was guessed.",
      "assistant-before": "Current text",
      "assistant-after": "Suggested text",
      "assistant-empty": "(empty — nothing was guessed)",
      "assistant-share": "The text layer is about {n}% of the page",
      "assistant-proof-clear": "This page looks clear.",
      "assistant-proof-alert": "This page has spelling or grammar suggestions. The words change only if you accept.",
      "assistant-proof-other": "Another page has proofreading suggestions.",
      "assistant-proof-jump": "Open the page that needs proofreading",
      "assistant-proof-manuscript": "This manuscript page stays as handwriting.",
      "assistant-proof-done": "Those proofreading suggestions are finished. Anything you did not accept was left out.",
      "page-label-manuscript": "Manuscript",
      "progress-illustrate": "Preparing a polished illustration from the original drawing ({current} of {count})",
      "polish-fallback": "A polished illustration was not created, so this page keeps the straightened original artwork. This note stays on screen.",
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
      "text-label": "Text layer",
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
    yuKeep: document.querySelector("[data-yu-keep]"),
    bookAssistant: document.querySelector("[data-book-assistant]")
  };

  const state = { locale: "zh", photos: [], pages: [], previewPages: [], pageKinds: [], pageIndex: 0, share: null, busy: false, noticeKey: "", announcePrepare: false, readingApproval: null, yuOffer: null, interiorStyle: "original", rebuildStamp: 0 };
  let pageProof = null;

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

  function serifFont() {
    return state.locale === "zh" ? '"Songti SC","STSong","SimSun","Times New Roman",serif' : '"Times New Roman",Times,serif';
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
    const api = window.StoriesLensPreviewWatermark;
    if (!api) throw new Error("watermark_unavailable");
    api.paintTiledWatermark(context, logo, width, height);
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
    const rank = { unavailable: 6, scan: 5, split: 4, uncertain: 3, extracted: 2, restored: 1 };
    pages.forEach((page) => {
      const key = page.extractReason === "scan_not_isolated" || page.scanIsolated === false
        ? "scan"
        : page.textStatus === "unavailable" ? "unavailable" : page.textStatus === "uncertain" ? "uncertain" : page.groupId ? "split" : "extracted";
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
    const photos = built.pages.map((page, index) => ({
      id: `photo-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      dataUrl: page.scanDataUrl || page.dataUrl || (page.artworks[0] && page.artworks[0].dataUrl) || page.marksDataUrl,
      scanIsolated: page.scanIsolated !== false,
      originalDataUrl,
      scanDataUrl: page.scanDataUrl,
      marksDataUrl: page.marksDataUrl,
      artworks: page.artworks,
      lines: Array.isArray(page.lines) ? page.lines : [],
      layersSeparated: page.layersSeparated === true,
      keptSheet: page.keptSheet === true,
      artFrame: null,
      layoutTextShare: 0,
      artOverrideUrl: "",
      artSource: "",
      assistantLog: [],
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

  function assistantPhoto() {
    const kind = state.pageKinds[state.pageIndex];
    const id = state.pagePhotoIds && state.pagePhotoIds[state.pageIndex];
    if ((kind === "photo" || kind === "story") && id) {
      const current = state.photos.find((photo) => photo.id === id);
      if (current) return current;
    }
    return state.photos.find((photo) => photo.manuscript !== true) || state.photos[0] || null;
  }

  function assistantLabel(proposal) {
    if (!proposal) return "";
    if (proposal.kind === "proofread") {
      if (proposal.category === "wording") return t("assistant-proof-wording");
      if (proposal.category === "punctuation") return t("assistant-proof-punctuation");
      if (proposal.category === "confirm") return t("assistant-proof-confirm");
      return t("assistant-proof-layout");
    }
    if (proposal.kind === "layout") return t("assistant-layout-label");
    if (proposal.kind === "art") return t("assistant-art-label");
    return t("assistant-type-label");
  }

  function commitAssistantPhoto(photo) {
    const index = state.photos.findIndex((item) => item.id === photo.id);
    if (index < 0) return;
    state.photos[index] = photo;
    renderThumbs();
    void rebuildBook();
  }

  function shownPhotoText(photo) {
    return photo.textStatus === "ok" || photo.textStatus === "parent" || photo.textEdited ? (photo.text || "") : "";
  }

  async function renderWorkPage(photo, extras = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    const manuscript = extras.manuscript === true || photo.manuscript === true;
    const sources = prepareApi().storyArtSources({
      manuscript,
      treatment: manuscript ? "original" : state.interiorStyle,
      scanUrl: photo.scanIsolated === false ? "" : (photo.scanDataUrl || photo.marksDataUrl || ""),
      polishedUrl: photo.polishedDataUrl || "",
      polishOk: photo.polishStatus === "ok",
      artOverrideUrl: photo.artOverrideUrl || "",
      artSource: photo.artSource || "",
      artworks: photo.artworks,
      layersSeparated: photo.layersSeparated === true
    });
    const artworks = [];
    for (const url of sources.urls) artworks.push(await loadHtmlImage(url));
    const marks = sources.marksUrl ? await loadHtmlImage(sources.marksUrl) : null;
    prepareApi().drawRebuiltPage(context, {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      pageNumber: extras.pageNumber || 1,
      artworks,
      marks,
      text: photo.text || "",
      status: photo.textStatus,
      edited: photo.textEdited === true,
      manuscript,
      treatment: sources.treatment,
      separated: sources.separated,
      textShare: photo.layoutTextShare || 0,
      artFrame: manuscript ? null : photo.artFrame,
      title: extras.title || "",
      subtitle: extras.subtitle || "",
      paper: "#f6f0e4",
      fontFamily: serifFont()
    });
    return canvasToJpeg(canvas, 0.92);
  }

  async function renderCoverPage(photo, pageNumber = 1) {
    const cover = photo || state.photos[0];
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    const heroUrl = prepareApi().coverHeroSource(cover, state.interiorStyle);
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
      fontFamily: bodyFont(),
      artFrame: cover && cover.artFrame
    });
    return canvasToJpeg(canvas, 0.92);
  }

  async function renderPhotoPage(photo, index, pageNumber) {
    const subtitle = [photo.studentName, String(index + 1)].filter(Boolean).join(" · ");
    return renderWorkPage(photo, { subtitle, pageNumber });
  }

  function storyProofIndex() {
    const kinds = state.pageKinds || [];
    for (let index = 0; index < kinds.length; index += 1) {
      if (kinds[index] !== "photo") continue;
      const id = state.pagePhotoIds && state.pagePhotoIds[index];
      const photo = state.photos.find((item) => item.id === id);
      if (!photo || photo.manuscript) continue;
      const items = prepareApi().proposeProofreading({
        text: shownPhotoText(photo),
        textStatus: photo.textStatus,
        lines: photo.lines,
        edited: photo.textEdited === true
      });
      if (items.length) return index;
    }
    return -1;
  }

  async function rebuildBook() {
    if (!state.photos.length) {
      state.pages = [];
      state.previewPages = [];
      state.pageKinds = [];
      els.previewCard.hidden = true;
      if (els.bookAssistant) els.bookAssistant.hidden = true;
      pageProof?.hideBanner();
      return;
    }
    const stamp = (state.rebuildStamp += 1);
    if (state.interiorStyle === "polished") {
      const illustrated = await prepareApi().illustratePhotos(state.photos, {
        style: "polished",
        textFor: shownPhotoText,
        onProgress: (index, total) => setStatus(t("progress-illustrate", { current: index + 1, count: total }))
      });
      if (stamp !== state.rebuildStamp) return;
      if (illustrated.fallback) state.noticeKey = "polish-fallback";
      else if (state.noticeKey === "polish-fallback") state.noticeKey = "";
    }
    const plan = prepareApi().planBookPages({
      photos: state.photos,
      coverId: state.photos[0]?.id || "",
      includeAuthor: false
    });
    const pages = [];
    const kinds = [];
    let storyIndex = 0;
    for (let index = 0; index < plan.length; index += 1) {
      const item = plan[index];
      const photo = state.photos.find((entry) => entry.id === item.photoId);
      if (item.kind === "cover") pages.push(await renderCoverPage(photo, index + 1));
      else if (item.kind === "manuscript") pages.push(await renderWorkPage(photo, { pageNumber: index + 1, manuscript: true, title: t("page-label-manuscript") }));
      else {
        pages.push(await renderPhotoPage(photo, storyIndex, index + 1));
        storyIndex += 1;
      }
      kinds.push(item.kind);
    }
    if (stamp !== state.rebuildStamp) return;
    const previewPages = [];
    for (const page of pages) previewPages.push(await watermarkPage(page));
    state.pages = pages;
    state.previewPages = previewPages;
    state.pageKinds = kinds;
    state.pagePhotoIds = plan.map((item) => item.photoId || "");
    state.pageIndex = Math.min(state.pageIndex, pages.length - 1);
    const proofAt = storyProofIndex();
    if (state.announcePrepare && proofAt >= 0) state.pageIndex = proofAt;
    renderPreview();
    els.previewCard.hidden = false;
    if (els.bookAssistant) els.bookAssistant.hidden = false;
    showReadingCheck();
    pageProof?.showProofreading();
    if (state.announcePrepare && proofAt >= 0) setStatus(t("assistant-proof-alert"));
    else if (state.noticeKey === "polish-fallback") setStatus(t("polish-fallback"));
    else {
      const noticeKeys = { split: "split-done", uncertain: "extract-uncertain", scan: "scan-not-isolated", unavailable: "extract-unavailable", extracted: "extract-done", restored: "restored" };
      const notice = noticeKeys[state.noticeKey] ? t(noticeKeys[state.noticeKey]) : "";
      setStatus(state.announcePrepare && notice ? notice : t("ready"));
    }
    state.announcePrepare = false;
  }

  function workArtUrl(photo) {
    if (!photo) return "";
    const sources = prepareApi().storyArtSources({
      manuscript: photo.manuscript === true,
      treatment: state.interiorStyle,
      scanUrl: photo.scanIsolated === false ? "" : (photo.scanDataUrl || photo.marksDataUrl || ""),
      polishedUrl: photo.polishedDataUrl || "",
      polishOk: photo.polishStatus === "ok",
      artOverrideUrl: photo.artOverrideUrl || "",
      artSource: photo.artSource || "",
      artworks: photo.artworks,
      layersSeparated: photo.layersSeparated === true
    });
    return (sources.urls && sources.urls[0]) || sources.marksUrl || "";
  }

  let editorContext = null;
  const pageEditor = prepareApi().bindPageEditor({
    frame: document.querySelector(".book-frame"),
    image: els.pageImage,
    editor: document.querySelector("[data-page-editor]"),
    art: document.querySelector("[data-page-art]"),
    artImage: document.querySelector("[data-page-art-image]"),
    handle: document.querySelector("[data-art-handle]"),
    text: document.querySelector("[data-page-text]"),
    mark: document.querySelector("[data-page-mark]"),
    note: document.querySelector("[data-page-editor-note]")
  }, {
    onText(value) {
      if (!editorContext || !editorContext.photo) return;
      if (editorContext.kind === "cover") {
        if (els.title) els.title.value = value.slice(0, 80);
        void rebuildBook();
        return;
      }
      editorContext.photo.text = value;
      editorContext.photo.textEdited = true;
      editorContext.photo.textStatus = "parent";
      renderThumbs();
      void rebuildBook();
    },
    onFrame(frame, done) {
      if (!editorContext || !editorContext.photo || editorContext.photo.manuscript) return;
      editorContext.photo.artFrame = frame && frame.scale === 1 && !frame.x && !frame.y ? null : frame;
      if (done) void rebuildBook();
    }
  });

  function syncPageEditor() {
    const kind = state.pageKinds[state.pageIndex];
    const id = state.pagePhotoIds && state.pagePhotoIds[state.pageIndex];
    const photo = id ? state.photos.find((item) => item.id === id) : null;
    const manuscript = kind === "manuscript" || (photo && photo.manuscript === true);
    const pageNumber = state.pageIndex + 1;
    const artUrl = !photo || manuscript ? "" : (kind === "cover" ? prepareApi().coverHeroSource(photo, state.interiorStyle) : workArtUrl(photo));
    const active = Boolean(artUrl) && (kind === "photo" || kind === "cover") && !manuscript;
    editorContext = active ? { kind, photo } : null;
    if (!active) {
      pageEditor.sync({ active: false });
      return;
    }
    const text = kind === "cover" ? bookTitle() : shownPhotoText(photo);
    const showText = Boolean(text);
    const layout = kind === "cover"
      ? prepareApi().layoutCoverPage({ pageWidth: PAGE_WIDTH, pageHeight: PAGE_HEIGHT, pageNumber })
      : prepareApi().layoutRebuiltPage({
        pageWidth: PAGE_WIDTH,
        pageHeight: PAGE_HEIGHT,
        artworkCount: 1,
        showText,
        title: "",
        pageNumber,
        textShare: photo.layoutTextShare || 0
      });
    pageEditor.sync({
      active: true,
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      artBox: layout.art,
      artFrame: photo.artFrame,
      artUrl,
      showText: Boolean(showText && (kind === "cover" ? layout.title : layout.text)),
      textBox: kind === "cover" ? layout.title : layout.text,
      text,
      textLabel: t("page-text-label"),
      moveLabel: t("art-move-label"),
      resizeLabel: t("art-resize-label"),
      note: t("page-edit-note"),
      markUrl: "assets/storieslens-logo.png",
      fontFamily: bodyFont()
    });
  }

  function renderPreview() {
    const shown = state.previewPages[state.pageIndex];
    if (!shown) return;
    els.pageImage.src = shown;
    const kind = state.pageKinds[state.pageIndex];
    els.pageLabel.textContent = kind === "cover" ? t("page-label-cover") : kind === "manuscript" ? t("page-label-manuscript") : t("page-of", { current: state.pageIndex + 1, total: state.pages.length });
    els.prev.disabled = state.pageIndex === 0;
    els.next.disabled = state.pageIndex >= state.pages.length - 1;
    syncPageEditor();
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
          pages: state.pages.map((imageDataUrl, index) => {
            const photo = state.photos.find((item) => item.id && item.id === state.pagePhotoIds?.[index]);
            return { imageDataUrl, studentName: state.pageKinds[index] === "cover" ? "" : (photo?.studentName || "") };
          })
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
  document.querySelectorAll("[data-interior-style]").forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      const kept = prepareApi().retainBookEdits({
        title: els.title.value,
        author: teacherName(),
        coverId: state.photos[0]?.id || "",
        photos: state.photos
      }, input.value);
      state.interiorStyle = kept.interiorStyle;
      prepareApi().applyInteriorStyleArt(state.photos);
      if (state.photos.length) void rebuildBook();
    });
  });
  els.prev.addEventListener("click", () => { if (state.pageIndex > 0) { state.pageIndex -= 1; renderPreview(); pageProof?.showProofreading(); } });
  els.next.addEventListener("click", () => { if (state.pageIndex < state.pages.length - 1) { state.pageIndex += 1; renderPreview(); pageProof?.showProofreading(); } });
  els.downloadPreview.addEventListener("click", () => void downloadPreviewPdf());
  pageProof = prepareApi().bindBookAssistant(els.bookAssistant, {
    photo: assistantPhoto,
    photoById: (id) => state.photos.find((photo) => photo.id === id) || null,
    pagePhoto: () => {
      const kind = state.pageKinds[state.pageIndex] || "";
      const id = state.pagePhotoIds && state.pagePhotoIds[state.pageIndex];
      const photo = id ? state.photos.find((item) => item.id === id) || null : null;
      return { kind, photo };
    },
    hasWordingProof: () => {
      const index = storyProofIndex();
      return index >= 0 && index !== state.pageIndex;
    },
    focusWordingProof: () => {
      const index = storyProofIndex();
      if (index < 0) return;
      state.pageIndex = index;
      renderPreview();
      pageProof?.showProofreading();
    },
    text: shownPhotoText,
    illustrate: (photo) => prepareApi().requestBookIllustration(photo.scanDataUrl || photo.marksDataUrl || "", shownPhotoText(photo)),
    commit: commitAssistantPhoto,
    label: assistantLabel,
    shareLabel: (share) => t("assistant-share", { n: Math.round(Number(share) * 100) }),
    beforeLabel: () => t("assistant-before"),
    afterLabel: () => t("assistant-after"),
    emptyLabel: () => t("assistant-empty"),
    wordingNote: () => t("assistant-wording-note"),
    confirmNote: () => t("assistant-confirm-note"),
    pendingLabel: () => t("assistant-pending"),
    acceptedLabel: () => t("assistant-accepted"),
    dismissedLabel: () => t("assistant-dismissed"),
    unchangedLabel: () => t("assistant-unchanged"),
    workingLabel: () => t("assistant-working"),
    artFailedLabel: () => t("assistant-art-failed"),
    proofClearLabel: () => t("assistant-proof-clear"),
    proofDoneLabel: () => t("assistant-proof-done"),
    proofAlertLabel: () => t("assistant-proof-alert"),
    otherProofLabel: () => t("assistant-proof-other"),
    manuscriptLabel: () => t("assistant-proof-manuscript")
  });
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
