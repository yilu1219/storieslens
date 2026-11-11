(() => {
  "use strict";

  const PAGE_WIDTH = 1480;
  const PAGE_HEIGHT = 2100;
  const MAX_PHOTOS = 20;
  const LOCALE_KEY = "storieslens_locale";
  const A5_WIDTH_PT = 148 * 72 / 25.4;
  const A5_HEIGHT_PT = 210 * 72 / 25.4;

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
      processing: "正在本机处理照片并删除拍摄信息…",
      cutting: "正在去掉桌子和背景…",
      "cutout-done": "已去掉周围的桌子和背景。",
      "cutout-kept": "背景不好分开，已保留原图。可以重试或恢复原图。",
      "split-done": "这张照片左右各有一幅作品，已分成两页。可以撤销拆分。",
      restored: "已恢复原图。",
      "restore-original": "原图",
      "retry-cutout": "重试",
      "undo-split": "撤销拆分",
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
      processing: "Preparing photos on this device and removing camera details…",
      cutting: "Removing the table and background…",
      "cutout-done": "The surrounding table and background were removed.",
      "cutout-kept": "The background was not clear enough, so the original photo was kept. You can retry or restore it.",
      "split-done": "This photo has a piece on the left and a piece on the right, so it became two pages. You can undo the split.",
      restored: "The original photo is restored.",
      "restore-original": "Original",
      "retry-cutout": "Retry",
      "undo-split": "Undo split",
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
    openShare: document.querySelector("[data-open-share]")
  };

  const state = { locale: "zh", photos: [], pages: [], pageIndex: 0, share: null, busy: false, noticeKey: "", announcePrepare: false };

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

  function canvasToJpeg(canvas, quality = 0.86) {
    return canvas.toDataURL("image/jpeg", quality);
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

  function notePrepare(prepared) {
    const rank = { split: 5, low_confidence: 4, cutout: 3 };
    if ((rank[prepared.reason] || 0) >= (rank[state.noticeKey] || 0)) state.noticeKey = prepared.reason;
  }

  function photosFromPrepared(prepared, originalDataUrl, fileName) {
    const groupId = prepared.split ? `split-${Date.now().toString(36)}` : "";
    return prepared.pages.map((page, index) => ({
      dataUrl: prepareApi().rgbaToPngDataUrl(page.rgba, page.width, page.height),
      originalDataUrl,
      name: fileName || "",
      studentName: "",
      groupId,
      keptOriginal: prepared.keptOriginal === true
    }));
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

  async function renderCoverPage() {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    const image = await loadHtmlImage(state.photos[0].dataUrl);
    prepareApi().drawImageFullBleed(context, image, PAGE_WIDTH, PAGE_HEIGHT, "#f6f0e4");
    overlayCaption(context, bookTitle(), PAGE_HEIGHT - 140, 64);
    if (className() || teacherName()) overlayCaption(context, className() || teacherName(), PAGE_HEIGHT - 70, 32);
    return canvasToJpeg(canvas, 0.9);
  }

  async function renderPhotoPage(photo, index) {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    const image = await loadHtmlImage(photo.dataUrl);
    prepareApi().drawImageFullBleed(context, image, PAGE_WIDTH, PAGE_HEIGHT, "#f6f0e4");
    if (photo.studentName) overlayCaption(context, photo.studentName, PAGE_HEIGHT - 120, 36);
    overlayCaption(context, String(index + 1), PAGE_HEIGHT - 70, 28);
    return canvasToJpeg(canvas, 0.9);
  }

  async function rebuildBook() {
    if (!state.photos.length) {
      state.pages = [];
      els.previewCard.hidden = true;
      return;
    }
    const pages = [await renderCoverPage()];
    for (let index = 0; index < state.photos.length; index += 1) {
      pages.push(await renderPhotoPage(state.photos[index], index));
    }
    state.pages = pages;
    state.pageIndex = Math.min(state.pageIndex, pages.length - 1);
    renderPreview();
    els.previewCard.hidden = false;
    const notice = state.noticeKey === "split" ? t("split-done") : state.noticeKey === "low_confidence" ? t("cutout-kept") : state.noticeKey === "cutout" ? t("cutout-done") : "";
    setStatus(state.announcePrepare && notice ? notice : t("ready"));
    state.announcePrepare = false;
  }

  function renderPreview() {
    if (!state.pages.length) return;
    els.pageImage.src = state.pages[state.pageIndex];
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
        replacePhotoGroup(photo, [{ dataUrl: photo.originalDataUrl, originalDataUrl: photo.originalDataUrl, name: photo.name, studentName: photo.studentName, groupId: "", keptOriginal: true }]);
        renderThumbs();
        void rebuildBook().then(() => setStatus(t("restored")));
      });
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = t("retry-cutout");
      retry.addEventListener("click", () => { void reprocessPhoto(photo, { retry: true }); });
      tools.append(restore, retry);
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
      item.append(frame, tools, name);
      els.thumbs.append(item);
    });
  }

  async function reprocessPhoto(photo, options) {
    setStatus(t("cutting"));
    const pixels = await pixelsFromDataUrl(photo.originalDataUrl);
    const prepared = prepareApi().prepareArtwork(pixels.data, pixels.width, pixels.height, options);
    notePrepare(prepared);
    replacePhotoGroup(photo, photosFromPrepared(prepared, photo.originalDataUrl, photo.name));
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
          const pixels = await pixelsFromDataUrl(originalDataUrl);
          const prepared = prepareApi().prepareArtwork(pixels.data, pixels.width, pixels.height);
          const photos = photosFromPrepared(prepared, originalDataUrl, file.name || "");
          if (state.photos.length + photos.length > MAX_PHOTOS) { setStatus(t("too-many"), true); break; }
          notePrepare(prepared);
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

  function dataUrlToBytes(dataUrl) {
    const match = String(dataUrl || "").match(/^data:image\/(?:jpeg|jpg|png);base64,([a-zA-Z0-9+/=\s]+)$/i);
    const binary = atob(match[1].replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function downloadPreviewPdf() {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    setStatus(t("pdf-working"));
    try {
      const pdf = await window.PDFLib.PDFDocument.create();
      pdf.setTitle(bookTitle());
      pdf.setCreator("StoriesLens Teacher Book");
      for (const pageDataUrl of state.pages) {
        const image = await pdf.embedJpg(dataUrlToBytes(pageDataUrl));
        const page = pdf.addPage([A5_WIDTH_PT, A5_HEIGHT_PT]);
        page.drawImage(image, { x: 0, y: 0, width: A5_WIDTH_PT, height: A5_HEIGHT_PT });
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
