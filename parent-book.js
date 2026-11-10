(() => {
  "use strict";

  const PAGE_WIDTH = 1480;
  const PAGE_HEIGHT = 2100;
  const MAX_PHOTOS = 20;
  const META_KEY = "storieslens_parent_book_meta";
  const LOCALE_KEY = "storieslens_locale";

  const copy = {
    zh: {
      "brand-sub": "家长出书",
      kicker: "FOR PARENTS · 家长出书",
      title: "用手机照片，几分钟做成一本 A5 书",
      lede: "上传孩子的画或作文照片，马上预览成书，并可一键生成短片。预览和短片免费。正式电子版 ¥19.9（约 $2.99），确认付款并核对邮箱后发送 PDF。印刷请先选软壳 ¥129（约 $17.99）或精美硬壳 ¥199（约 $27.99），确认付款后由我们人工安排首批寄送。",
      "details-kicker": "书籍信息",
      "title-label": "书名",
      "name-label": "孩子的署名（选填）",
      "author-label": "作者姓名",
      "author-hint": "会印在封面和作者简介页。",
      "author-placeholder": "例如：小羽",
      "name-hint": "如果和作者姓名不同，可以另外写在封面上。保存在这台设备上。",
      "intro-label": "作者简介",
      "intro-hint": "先选一段短模板，再改成孩子自己的话。我们不会改孩子的画或作文。",
      "intro-placeholder": "写一段短短的作者简介，或先选用下面的模板。",
      "suggest-kicker": "检查建议",
      "suggest-accept": "接受这条",
      "suggest-skip": "跳过",
      "suggest-undo": "撤销上一步",
      "suggest-progress": "第 {current} 条，共 {total} 条。每条都可以跳过或撤销。",
      "suggest-done": "检查已结束。你可以继续预览、做短片，或查看价格。",
      "price-free-tag": "FREE · 免费",
      "price-free-title": "预览成书和短片",
      "price-free-copy": "翻页预览和短片可以免费使用。画面上的预览不是已付款的正式文件。",
      "price-digital": "电子版 A5 PDF · ¥19.9（约 $2.99）",
      "price-digital-copy": "服务器确认付款后，需要你再确认接收邮箱，正式 A5 PDF 才会发到这个邮箱。成功页或链接参数不会发信，也不会解锁下载。",
      "buy-digital": "购买电子版",
      "price-print": "印刷成书",
      "price-print-copy": "请先选择精美硬壳或软壳。确认付款后，我们按你留下的成人联系方式和地址人工安排首批印刷和寄送。目前没有自动物流跟踪，也不假装已经对接印刷厂。",
      "cover-legend": "先选择封面",
      "cover-hardcover": "精美硬壳 · ¥199（约 $27.99）",
      "cover-softcover": "软壳 · ¥129（约 $17.99）",
      "cover-required": "请先选择精美硬壳或软壳。",
      "buy-print": "申请印刷并支付",
      "contact-name": "成人姓名",
      "contact-email": "成人邮箱",
      "contact-phone": "成人电话",
      "ship-line1": "街道地址",
      "ship-line2": "地址补充（选填）",
      "ship-city": "城市",
      "ship-region": "省/州",
      "ship-postal": "邮编",
      "ship-country": "国家/地区",
      "adult-confirm": "我是家长或成年人，孩子不会在此填写付款信息。",
      "checkout-working": "正在连接安全结账…",
      "adult-required": "请先确认你是家长或成年人，并留下成人邮箱。",
      "shipping-required": "印刷订单需要姓名、电话、国家/地区、省/州、城市、街道和邮编。",
      "pay-unlocked-digital": "服务器已确认电子版付款。请确认接收邮箱，我们才会发送正式 A5 PDF。成功页不会自动发信。",
      "pay-unlocked-print": "服务器已确认印刷付款。首批由我们按你留下的地址人工安排，暂时没有自动物流跟踪，也没有印刷厂对接。",
      "pay-unlocked-hardcover": "服务器已确认精美硬壳付款。首批由我们人工安排印刷和寄送，暂时没有自动物流跟踪，也没有印刷厂对接。",
      "pay-unlocked-softcover": "服务器已确认软壳付款。首批由我们人工安排印刷和寄送，暂时没有自动物流跟踪，也没有印刷厂对接。",
      "delivery-email": "接收正式 PDF 的邮箱",
      "delivery-email-copy": "请确认这个邮箱。我们只在服务器确认付款之后，把正式 A5 PDF 发到这里。成功页不会自动发信。",
      "delivery-email-required": "请填写有效的接收邮箱。付款确认后需要你确认，我们才会发送正式 PDF。",
      "send-book-email": "确认邮箱并发送正式 PDF",
      "resend-book-email": "再次发送到这个邮箱",
      "email-working": "正在把正式 A5 PDF 发到你确认的邮箱…",
      "email-sent": "正式 A5 PDF 已发到你确认的邮箱。你也可以在这里下载。",
      "email-saved-unsent": "付款已确认，邮箱已保存，但这次没有把 PDF 发出。",
      "page-label-author": "作者简介",
      "about-author": "作者简介",
      "credit-line": "作者 · {name}",
      "title-placeholder": "例如：小羽的画",
      "name-placeholder": "例如：小羽",
      album: "从相册选择照片",
      camera: "拍照上传",
      "safety-notice": "请上传孩子的画、作文或手工作品照片。不要上传身份证、学生证、校园卡，也不要拍到电话、地址、邮箱或二维码。位置和拍摄信息会在本机删除。",
      "adult-note": "这条出书线是给家长或成年人使用的。孩子不必、也不应进入任何付款页面。",
      "preview-kicker": "预览成书",
      prev: "上一页",
      next: "下一页",
      "download-pdf": "下载已购买的 A5 PDF",
      print: "打印 A5",
      "print-pdf": "下载印刷版 A5 PDF",
      "make-film": "一键生成短片（免费）",
      "print-shop": "印刷版是标准 A5 PDF，可以拿到附近打印店做成书。我们暂时不提供邮寄成书，也不会在这里收费。",
      "open-pdf": "打开 PDF",
      "share-pdf": "分享 PDF",
      "save-film": "保存短片",
      "share-film": "分享短片",
      "trust-meta": "本机删除位置和拍摄信息",
      "trust-private": "默认保存在这台手机上",
      "trust-free": "预览和短片免费 · 电子版 ¥19.9 · 软壳 ¥129 · 硬壳 ¥199",
      "default-title": "我们的家庭绘本",
      "byline": "作者 · {name}",
      "page-of": "第 {current} 页，共 {total} 页",
      "added": "已加入 {count} 张照片，正在生成预览…",
      "ready": "书已经准备好。可以翻页、查看建议、免费生成短片，或按价格购买电子版和印刷版。",
      "processing": "正在本机处理照片并删除拍摄信息…",
      "blocked": "这张照片不能使用。请不要上传证件、学生证，或带有电话、地址、邮箱、二维码的画面。",
      "unsupported": "请选择 JPG、PNG、WEBP、HEIC 或 HEIF 图片。",
      "too-many": "一次最多 20 张照片。",
      "need-photos": "请先从相册选择或拍摄至少一张照片。",
      "pdf-working": "正在生成 A5 PDF…",
      "pdf-ready": "已购买的 A5 PDF 已准备好，可以下载。",
      "pdf-failed": "还不能下载正式 PDF。需要服务器确认付款；成功页本身不会解锁。",
      "film-working": "正在把书页做成短片，请稍候…",
      "film-ready": "短片已生成，可直接播放、保存或分享。",
      "film-failed": "短片暂时无法生成，请再试一次。",
      "share-unavailable": "当前浏览器不支持系统分享，请使用打开或保存。",
      "wechat-pdf": "在微信里，请先预览或点击“打开 PDF”。如需保存，可点击右上角 ···，选择“在浏览器中打开”，再下载到手机。",
      "wechat-film": "短片可在本页直接播放。微信 iOS 往往无法直接下载文件：请长按视频尝试保存，或点击右上角 ···，选择“在浏览器中打开”后再保存。",
      "cover-kicker": "STORIESLENS · 家长出书",
      "page-label-cover": "封面",
      docTitle: "家长出书 · StoriesLens"
    },
    en: {
      "brand-sub": "Parent book",
      kicker: "FOR PARENTS",
      title: "Turn phone photos into an A5 book in minutes",
      lede: "Upload photos of your child’s drawings or writing, preview the book, and make a short film. Preview and the film are free. The official digital PDF is ¥19.9 (about $2.99) and is emailed after you confirm an address. For print, choose softcover ¥129 (about $17.99) or premium hardcover ¥199 (about $27.99). The first batch is arranged by hand after a confirmed payment.",
      "details-kicker": "BOOK DETAILS",
      "title-label": "Book title",
      "name-label": "Child’s display name (optional)",
      "author-label": "Author name",
      "author-hint": "This is printed on the cover and the author-intro page.",
      "author-placeholder": "For example: Mia",
      "name-hint": "If this is different from the author name, it can also appear on the cover. It stays on this device.",
      "intro-label": "Author intro",
      "intro-hint": "Start with a short template, then edit it in the child’s own words. We will not change the artwork or writing.",
      "intro-placeholder": "Write a short author intro, or start from a template below.",
      "suggest-kicker": "Review suggestions",
      "suggest-accept": "Accept this",
      "suggest-skip": "Skip",
      "suggest-undo": "Undo last step",
      "suggest-progress": "Suggestion {current} of {total}. Every suggestion is optional and can be undone.",
      "suggest-done": "The check is finished. You can keep previewing, make a film, or look at the prices.",
      "price-free-tag": "FREE",
      "price-free-title": "Book preview and short film",
      "price-free-copy": "You can flip through the book and make the short film for free. The on-screen preview is not a paid file.",
      "price-digital": "Digital A5 PDF · ¥19.9 (about $2.99)",
      "price-digital-copy": "After the server confirms payment, confirm a delivery email and the official A5 PDF is sent there. A success page or query string never sends the file or unlocks the download.",
      "buy-digital": "Buy the digital edition",
      "price-print": "Printed book",
      "price-print-copy": "Choose premium hardcover or softcover first. After a confirmed payment, we use the adult contact and shipping address to arrange the first batch by hand. There is no automated tracking yet, and we do not claim a print factory is already connected.",
      "cover-legend": "Choose a cover first",
      "cover-hardcover": "Premium hardcover · ¥199 (about $27.99)",
      "cover-softcover": "Softcover · ¥129 (about $17.99)",
      "cover-required": "Choose premium hardcover or softcover before checkout.",
      "buy-print": "Request print and pay",
      "contact-name": "Adult name",
      "contact-email": "Adult email",
      "contact-phone": "Adult phone",
      "ship-line1": "Street address",
      "ship-line2": "Address line 2 (optional)",
      "ship-city": "City",
      "ship-region": "State / province",
      "ship-postal": "Postal code",
      "ship-country": "Country / region",
      "adult-confirm": "I am a parent or another adult. A child will not enter payment details here.",
      "checkout-working": "Opening secure checkout…",
      "adult-required": "Please confirm you are a parent or adult, and leave an adult email address.",
      "shipping-required": "A print order needs a name, phone, country, region, city, street, and postal code.",
      "pay-unlocked-digital": "The server has confirmed the digital payment. Confirm the delivery email and we will send the official A5 PDF. A success page does not send it.",
      "pay-unlocked-print": "The server has confirmed the print payment. The first batch is arranged by hand from the address you left. There is no automated tracking, and no print partner is claimed.",
      "pay-unlocked-hardcover": "The server has confirmed the premium hardcover payment. The first batch is arranged by hand. There is no automated tracking, and no print partner is claimed.",
      "pay-unlocked-softcover": "The server has confirmed the softcover payment. The first batch is arranged by hand. There is no automated tracking, and no print partner is claimed.",
      "delivery-email": "Email for the official PDF",
      "delivery-email-copy": "Confirm this address. We email the official A5 PDF only after the server has confirmed payment. A success page does not send it.",
      "delivery-email-required": "Enter a valid delivery email. We send the official PDF only after you confirm it.",
      "send-book-email": "Confirm email and send the official PDF",
      "resend-book-email": "Send again to this email",
      "email-working": "Sending the official A5 PDF to the email you confirmed…",
      "email-sent": "The official A5 PDF was sent to the email you confirmed. You can also download it here.",
      "email-saved-unsent": "Payment is confirmed and the email is saved, but the PDF was not sent.",
      "page-label-author": "About the author",
      "about-author": "About the author",
      "credit-line": "By {name}",
      "title-placeholder": "For example: Mia’s Drawings",
      "name-placeholder": "For example: Mia",
      album: "Choose from camera roll",
      camera: "Take a photo",
      "safety-notice": "Upload photos of your child’s artwork or writing. Do not upload identity documents, student or school IDs, or images that show a phone number, address, email, or QR code. Location and camera details are removed on this device.",
      "adult-note": "This flow is for a parent or another adult. A child should not enter a checkout page.",
      "preview-kicker": "BOOK PREVIEW",
      prev: "Previous",
      next: "Next",
      "download-pdf": "Download the purchased A5 PDF",
      print: "Print A5",
      "print-pdf": "Download print-ready A5 PDF",
      "make-film": "Make a short film (free)",
      "print-shop": "The print-ready file is a standard A5 PDF you can take to a local print shop. We do not ship printed books yet, and nothing is charged here.",
      "open-pdf": "Open PDF",
      "share-pdf": "Share PDF",
      "save-film": "Save film",
      "share-film": "Share film",
      "trust-meta": "Location and camera details removed on this device",
      "trust-private": "Kept on this phone by default",
      "trust-free": "Preview and film are free · Digital ¥19.9 · Softcover ¥129 · Hardcover ¥199",
      "default-title": "Our Family Book",
      "byline": "By {name}",
      "page-of": "Page {current} of {total}",
      "added": "{count} photos added. Building your preview…",
      "ready": "Your book is ready. Flip through it, review optional suggestions, make a free short film, or see the prices for the digital and printed editions.",
      "processing": "Preparing photos on this device and removing camera details…",
      "blocked": "That photo cannot be used. Please do not upload identity documents, school IDs, or images with a phone number, address, email, or QR code.",
      "unsupported": "Please choose a JPG, PNG, WEBP, HEIC, or HEIF image.",
      "too-many": "You can add up to 20 photos at a time.",
      "need-photos": "Please choose or take at least one photo first.",
      "pdf-working": "Creating the A5 PDF…",
      "pdf-ready": "Your purchased A5 PDF is ready to download.",
      "pdf-failed": "The official PDF is not unlocked yet. The server must confirm payment; a success page is not enough.",
      "film-working": "Turning your pages into a short film…",
      "film-ready": "Your short film is ready to play, save, or share.",
      "film-failed": "The short film could not be created. Please try again.",
      "share-unavailable": "Sharing is not available in this browser. Use Open or Save instead.",
      "wechat-pdf": "In WeChat, preview the PDF or tap Open PDF. To save it, tap the ··· menu and choose Open in Browser, then download it there.",
      "wechat-film": "You can play the film on this page. WeChat on iOS often blocks file downloads: try a long press on the video, or tap ··· and choose Open in Browser to save it.",
      "cover-kicker": "STORIESLENS · PARENT BOOK",
      "page-label-cover": "Cover",
      docTitle: "Parent book · StoriesLens"
    }
  };

  const els = {
    title: document.querySelector("[data-title]"),
    childName: document.querySelector("[data-child-name]"),
    authorName: document.querySelector("[data-author-name]"),
    authorIntro: document.querySelector("[data-author-intro]"),
    introTemplates: document.querySelector("[data-intro-templates]"),
    suggestCard: document.querySelector("[data-suggest-card]"),
    suggestText: document.querySelector("[data-suggest-text]"),
    suggestAccept: document.querySelector("[data-suggest-accept]"),
    suggestSkip: document.querySelector("[data-suggest-skip]"),
    suggestUndo: document.querySelector("[data-suggest-undo]"),
    suggestMeta: document.querySelector("[data-suggest-meta]"),
    priceBox: document.querySelector("[data-price-box]"),
    payNote: document.querySelector("[data-pay-note]"),
    payUnlocked: document.querySelector("[data-pay-unlocked]"),
    paidActions: document.querySelector("[data-paid-actions]"),
    buyDigital: document.querySelector("[data-buy-digital]"),
    buyPrint: document.querySelector("[data-buy-print]"),
    printPrice: document.querySelector("[data-print-price]"),
    deliveryBox: document.querySelector("[data-delivery-box]"),
    deliveryEmail: document.querySelector("[data-delivery-email]"),
    sendBookEmail: document.querySelector("[data-send-book-email]"),
    adultConfirm: document.querySelector("[data-adult-confirm]"),
    contactName: document.querySelector("[data-contact-name]"),
    contactEmail: document.querySelector("[data-contact-email]"),
    contactPhone: document.querySelector("[data-contact-phone]"),
    shipLine1: document.querySelector("[data-ship-line1]"),
    shipLine2: document.querySelector("[data-ship-line2]"),
    shipCity: document.querySelector("[data-ship-city]"),
    shipRegion: document.querySelector("[data-ship-region]"),
    shipPostal: document.querySelector("[data-ship-postal]"),
    shipCountry: document.querySelector("[data-ship-country]"),
    album: document.querySelector("[data-album]"),
    camera: document.querySelector("[data-camera]"),
    thumbs: document.querySelector("[data-thumbs]"),
    status: document.querySelector("[data-status]"),
    previewCard: document.querySelector("[data-preview-card]"),
    pageImage: document.querySelector("[data-page-image]"),
    pageLabel: document.querySelector("[data-page-label]"),
    prev: document.querySelector("[data-prev]"),
    next: document.querySelector("[data-next]"),
    downloadPdf: document.querySelector("[data-download-pdf]"),
    print: document.querySelector("[data-print]"),
    printPdf: document.querySelector("[data-print-pdf]"),
    makeFilm: document.querySelector("[data-make-film]"),
    pdfBox: document.querySelector("[data-pdf-box]"),
    pdfFrame: document.querySelector("[data-pdf-frame]"),
    pdfHelp: document.querySelector("[data-pdf-help]"),
    openPdf: document.querySelector("[data-open-pdf]"),
    sharePdf: document.querySelector("[data-share-pdf]"),
    filmBox: document.querySelector("[data-film-box]"),
    filmPlayer: document.querySelector("[data-film-player]"),
    filmHelp: document.querySelector("[data-film-help]"),
    saveFilm: document.querySelector("[data-save-film]"),
    shareFilm: document.querySelector("[data-share-film]"),
    printRoot: document.querySelector("[data-print-root]")
  };

  const state = {
    locale: "zh",
    photos: [],
    pages: [],
    pageIndex: 0,
    pdfBlob: null,
    pdfUrl: "",
    filmBlob: null,
    filmUrl: "",
    filmName: "storieslens-book.mp4",
    busy: false,
    suggestions: [],
    suggestionIndex: 0,
    suggestionHistory: [],
    pricing: null,
    entitlement: { paid: false, kind: "" },
    pageKinds: []
  };

  const t = (key, vars) => {
    const table = copy[state.locale] || copy.zh;
    let value = table[key] || copy.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        value = value.replaceAll(`{${name}}`, String(vars[name]));
      });
    }
    return value;
  };

  const isWeChat = () => /MicroMessenger/i.test(navigator.userAgent || "");

  function detectLocale() {
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (stored === "zh" || stored === "en") return stored;
    } catch (_error) {}
    const ua = navigator.userAgent || "";
    const wechatLang = ua.match(/Language\/([a-zA-Z0-9_-]+)/i);
    if (wechatLang) return /^zh/i.test(wechatLang[1]) ? "zh" : "en";
    const languages = [navigator.language, ...(navigator.languages || [])]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase());
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

  function bookTitle() {
    return els.title.value.trim() || t("default-title");
  }

  function childName() {
    return els.childName.value.trim();
  }

  function authorName() {
    return (els.authorName?.value || "").trim();
  }

  function authorIntro() {
    return (els.authorIntro?.value || "").trim();
  }

  function displayAuthor() {
    return authorName() || childName();
  }

  function saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({
        title: els.title.value,
        childName: els.childName.value,
        authorName: els.authorName?.value || "",
        authorIntro: els.authorIntro?.value || ""
      }));
      localStorage.setItem(LOCALE_KEY, state.locale);
    } catch (_error) {}
  }

  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return;
      const meta = JSON.parse(raw);
      if (typeof meta.title === "string") els.title.value = meta.title;
      if (typeof meta.childName === "string") els.childName.value = meta.childName;
      if (els.authorName && typeof meta.authorName === "string") els.authorName.value = meta.authorName;
      if (els.authorIntro && typeof meta.authorIntro === "string") els.authorIntro.value = meta.authorIntro;
    } catch (_error) {}
  }

  function applyLocale(next) {
    state.locale = next === "en" ? "en" : "zh";
    document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
    document.title = t("docTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    els.title.placeholder = t("title-placeholder");
    els.childName.placeholder = t("name-placeholder");
    document.querySelectorAll("[data-locale]").forEach((button) => {
      const active = button.dataset.locale === state.locale;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    saveMeta();
    renderIntroTemplates();
    syncCoverPrice();
    syncDeliveryUi();
    if (state.photos.length) void rebuildBook();
  }

  function inspectUpload(file) {
    const safety = window.StoriesLensParentBookSafety;
    if (!safety?.inspectParentBookUpload) return { blocked: false, reasonCode: "approved" };
    return safety.inspectParentBookUpload({
      filename: file?.name,
      title: els.title.value,
      childName: els.childName.value
    });
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

  async function toJpegDataUrl(source) {
    const image = await loadHtmlImage(source);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("processing_unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvasToJpeg(canvas);
  }

  async function sanitizeFile(file) {
    const artwork = window.StoriesLensArtworkSafety;
    if (artwork?.removeMetadata) {
      const sanitized = await artwork.removeMetadata(file);
      return toJpegDataUrl(sanitized.dataUrl);
    }
    const url = URL.createObjectURL(file);
    try {
      return await toJpegDataUrl(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
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
      else {
        lines.push(current);
        current = part;
      }
      if (index === characters.length - 1 && current) lines.push(current);
    });
    return lines.slice(0, 4);
  }

  function drawImageContained(context, image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = x + (width - drawWidth) / 2;
    const dy = y + (height - drawHeight) / 2;
    context.drawImage(image, dx, dy, drawWidth, drawHeight);
    return { dx, dy, drawWidth, drawHeight };
  }

  async function renderCoverPage(coverUrl) {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.strokeStyle = "#0f6244";
    context.lineWidth = 6;
    context.strokeRect(64, 64, PAGE_WIDTH - 128, PAGE_HEIGHT - 128);
    context.lineWidth = 2;
    context.strokeRect(84, 84, PAGE_WIDTH - 168, PAGE_HEIGHT - 168);

    context.fillStyle = "#0f6244";
    context.font = "700 36px " + getComputedStyle(document.body).fontFamily;
    context.textAlign = "center";
    context.fillText(t("cover-kicker"), PAGE_WIDTH / 2, 180);

    const image = await loadHtmlImage(coverUrl);
    const frame = { x: 200, y: 240, width: PAGE_WIDTH - 400, height: 980 };
    context.save();
    context.fillStyle = "#fff";
    roundedRect(context, frame.x, frame.y, frame.width, frame.height, 18);
    context.fill();
    context.clip();
    drawImageContained(context, image, frame.x + 24, frame.y + 24, frame.width - 48, frame.height - 48);
    context.restore();

    context.fillStyle = "#101817";
    context.font = "700 92px " + (state.locale === "zh" ? '"Songti SC","STSong","SimSun","Times New Roman",serif' : '"Times New Roman",Times,serif');
    const titleLines = wrapText(context, bookTitle(), PAGE_WIDTH - 280);
    titleLines.forEach((line, index) => {
      context.fillText(line, PAGE_WIDTH / 2, 1400 + index * 108);
    });
    if (displayAuthor()) {
      context.fillStyle = "#3d4a44";
      context.font = "600 42px " + getComputedStyle(document.body).fontFamily;
      context.fillText(t("byline", { name: displayAuthor() }), PAGE_WIDTH / 2, 1400 + titleLines.length * 108 + 24);
    }
    context.fillStyle = "#7a756b";
    context.font = "600 28px " + getComputedStyle(document.body).fontFamily;
    context.fillText(String(new Date().getFullYear()), PAGE_WIDTH / 2, PAGE_HEIGHT - 140);
    return canvasToJpeg(canvas, 0.9);
  }


  async function renderAuthorPage() {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.fillStyle = "#0f6244";
    context.textAlign = "center";
    context.font = "700 36px " + getComputedStyle(document.body).fontFamily;
    context.fillText(t("about-author"), PAGE_WIDTH / 2, 260);
    context.fillStyle = "#101817";
    context.font = "700 72px " + (state.locale === "zh" ? '"Songti SC","STSong","SimSun","Times New Roman",serif' : '"Times New Roman",Times,serif');
    context.fillText(displayAuthor() || bookTitle(), PAGE_WIDTH / 2, 420);
    context.fillStyle = "#3d4a44";
    context.font = "500 44px " + getComputedStyle(document.body).fontFamily;
    const lines = wrapText(context, authorIntro(), PAGE_WIDTH - 280);
    lines.forEach((line, index) => {
      context.fillText(line, PAGE_WIDTH / 2, 560 + index * 72);
    });
    if (childName() && childName() !== authorName()) {
      context.fillStyle = "#7a756b";
      context.font = "600 32px " + getComputedStyle(document.body).fontFamily;
      context.fillText(t("credit-line", { name: childName() }), PAGE_WIDTH / 2, PAGE_HEIGHT - 180);
    }
    return canvasToJpeg(canvas, 0.9);
  }

  async function renderPhotoPage(photoUrl, index, total) {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#f6f0e4";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    const image = await loadHtmlImage(photoUrl);
    drawImageContained(context, image, 120, 120, PAGE_WIDTH - 240, PAGE_HEIGHT - 280);
    context.fillStyle = "#7a756b";
    context.font = "600 32px " + getComputedStyle(document.body).fontFamily;
    context.textAlign = "center";
    context.fillText(String(index + 1), PAGE_WIDTH / 2, PAGE_HEIGHT - 90);
    context.font = "600 22px " + getComputedStyle(document.body).fontFamily;
    context.fillText("StoriesLens", PAGE_WIDTH / 2, PAGE_HEIGHT - 50);
    return canvasToJpeg(canvas, 0.9);
  }

  async function rebuildBook() {
    if (!state.photos.length) {
      state.pages = [];
      els.previewCard.hidden = true;
      return;
    }
    const pages = [await renderCoverPage(state.photos[0].dataUrl)];
    const kinds = ["cover"];
    if (authorName() || authorIntro()) {
      pages.push(await renderAuthorPage());
      kinds.push("author");
    }
    for (let index = 0; index < state.photos.length; index += 1) {
      pages.push(await renderPhotoPage(state.photos[index].dataUrl, index, state.photos.length));
      kinds.push("photo");
    }
    state.pages = pages;
    state.pageKinds = kinds;
    state.pageIndex = Math.min(state.pageIndex, pages.length - 1);
    state.pdfBlob = null;
    if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
    state.pdfUrl = "";
    if (els.pdfBox) els.pdfBox.hidden = true;
    renderPreview();
    els.previewCard.hidden = false;
    if (els.priceBox) els.priceBox.hidden = false;
    startSuggestions();
    void refreshPricing();
    setStatus(t("ready"));
  }

  function renderPreview() {
    if (!state.pages.length) return;
    els.pageImage.src = state.pages[state.pageIndex];
    const kind = state.pageKinds[state.pageIndex];
    const label = kind === "cover" ? t("page-label-cover") : kind === "author" ? t("page-label-author") : t("page-of", { current: state.pageIndex + 1, total: state.pages.length });
    els.pageImage.alt = label;
    els.pageLabel.textContent = label;
    els.prev.disabled = state.pageIndex === 0;
    els.next.disabled = state.pageIndex >= state.pages.length - 1;
  }

  function renderThumbs() {
    els.thumbs.innerHTML = "";
    state.photos.forEach((photo, index) => {
      const item = document.createElement("div");
      item.className = "thumb";
      const image = document.createElement("img");
      image.src = photo.dataUrl;
      image.alt = photo.name || `${index + 1}`;
      const remove = document.createElement("button");
      remove.className = "thumb-remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        state.photos.splice(index, 1);
        renderThumbs();
        void rebuildBook();
      });
      const actions = document.createElement("div");
      actions.className = "thumb-actions";
      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "↑";
      up.disabled = index === 0;
      up.addEventListener("click", () => {
        const [moved] = state.photos.splice(index, 1);
        state.photos.splice(index - 1, 0, moved);
        renderThumbs();
        void rebuildBook();
      });
      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "↓";
      down.disabled = index === state.photos.length - 1;
      down.addEventListener("click", () => {
        const [moved] = state.photos.splice(index, 1);
        state.photos.splice(index + 1, 0, moved);
        renderThumbs();
        void rebuildBook();
      });
      actions.append(up, down);
      item.append(image, remove, actions);
      els.thumbs.append(item);
    });
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    if (state.photos.length + files.length > MAX_PHOTOS) {
      setStatus(t("too-many"), true);
      return;
    }
    state.busy = true;
    setStatus(t("processing"));
    try {
      for (const file of files) {
        const inspection = inspectUpload(file);
        if (inspection.blocked) {
          setStatus(t("blocked"), true);
          continue;
        }
        const supported = window.StoriesLensArtworkSafety?.isSupportedImage
          ? window.StoriesLensArtworkSafety.isSupportedImage(file)
          : /image\//.test(file.type || "") || /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name || "");
        if (!supported) {
          setStatus(t("unsupported"), true);
          continue;
        }
        try {
          const dataUrl = await sanitizeFile(file);
          state.photos.push({ dataUrl, name: file.name || "" });
        } catch (error) {
          setStatus(t("unsupported"), true);
        }
      }
      renderThumbs();
      if (state.photos.length) {
        setStatus(t("added", { count: state.photos.length }));
        await rebuildBook();
      } else {
        setStatus(t("need-photos"), true);
      }
    } finally {
      state.busy = false;
    }
  }


  function renderIntroTemplates() {
    if (!els.introTemplates) return;
    const review = window.StoriesLensFamilyBookReview;
    const templates = review?.authorIntroTemplates(state.locale) || [];
    els.introTemplates.innerHTML = "";
    templates.forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.classList.toggle("is-selected", authorIntro() === text);
      button.addEventListener("click", () => {
        state.suggestionHistory.push({ field: "authorIntro", previous: authorIntro() });
        els.authorIntro.value = text;
        saveMeta();
        renderIntroTemplates();
        if (state.photos.length) void rebuildBook();
      });
      els.introTemplates.append(button);
    });
    if (els.authorIntro) els.authorIntro.placeholder = t("intro-placeholder");
    if (els.authorName) els.authorName.placeholder = t("author-placeholder");
  }

  function startSuggestions() {
    const review = window.StoriesLensFamilyBookReview;
    state.suggestions = review?.suggestFamilyBook({
      title: els.title.value.trim(),
      authorName: authorName(),
      authorIntro: authorIntro(),
      childName: childName(),
      defaultTitle: t("default-title"),
      photoCount: state.photos.length,
      firstFileName: state.photos[0]?.name || "",
      locale: state.locale
    }) || [];
    state.suggestionIndex = 0;
    renderSuggestion();
  }

  function renderSuggestion() {
    if (!els.suggestCard) return;
    if (!state.suggestions.length || state.suggestionIndex >= state.suggestions.length) {
      els.suggestCard.hidden = !state.suggestions.length;
      if (state.suggestions.length) {
        els.suggestText.textContent = t("suggest-done");
        els.suggestAccept.hidden = true;
        els.suggestSkip.hidden = true;
        els.suggestMeta.textContent = "";
      } else {
        els.suggestCard.hidden = true;
      }
      if (els.suggestUndo) els.suggestUndo.hidden = !state.suggestionHistory.length;
      return;
    }
    const item = state.suggestions[state.suggestionIndex];
    els.suggestCard.hidden = false;
    els.suggestAccept.hidden = false;
    els.suggestSkip.hidden = false;
    els.suggestText.textContent = item.message?.[state.locale] || item.message?.zh || "";
    els.suggestMeta.textContent = t("suggest-progress", { current: state.suggestionIndex + 1, total: state.suggestions.length });
    if (els.suggestUndo) els.suggestUndo.hidden = !state.suggestionHistory.length;
  }

  function applySuggestion(item) {
    const fieldMap = { title: els.title, authorName: els.authorName, authorIntro: els.authorIntro, childName: els.childName };
    const field = fieldMap[item.field];
    if (item.reversible && field && item.proposedValue) {
      state.suggestionHistory.push({ field: item.field, previous: field.value });
      field.value = item.proposedValue;
      saveMeta();
      renderIntroTemplates();
      return true;
    }
    if (field) field.focus();
    if (item.field === "pageOrder") els.thumbs?.scrollIntoView({ behavior: "smooth", block: "center" });
    return Boolean(item.reversible && item.proposedValue);
  }

  function acceptSuggestion() {
    const item = state.suggestions[state.suggestionIndex];
    if (!item) return;
    const changed = applySuggestion(item);
    state.suggestionIndex += 1;
    renderSuggestion();
    if (changed && state.photos.length) void rebuildBook();
  }

  function skipSuggestion() {
    state.suggestionIndex += 1;
    renderSuggestion();
  }

  function undoSuggestion() {
    const last = state.suggestionHistory.pop();
    if (!last) return renderSuggestion();
    const fieldMap = { title: els.title, authorName: els.authorName, authorIntro: els.authorIntro, childName: els.childName };
    const field = fieldMap[last.field];
    if (field) field.value = last.previous;
    saveMeta();
    renderIntroTemplates();
    if (state.suggestionIndex > 0) state.suggestionIndex -= 1;
    renderSuggestion();
    if (state.photos.length) void rebuildBook();
  }

  async function refreshPricing() {
    try {
      const response = await fetch("/api/family-book/pricing");
      state.pricing = await response.json();
    } catch (_error) {
      state.pricing = { checkoutConfigured: false, noticeZh: t("price-digital-copy"), noticeEn: t("price-digital-copy") };
    }
    if (els.payNote) {
      els.payNote.textContent = state.locale === "zh" ? (state.pricing.noticeZh || "") : (state.pricing.noticeEn || "");
      els.payNote.hidden = false;
    }
    const configured = state.pricing?.checkoutConfigured === true;
    if (els.buyDigital) els.buyDigital.disabled = !configured;
    if (els.buyPrint) els.buyPrint.disabled = !configured;
    await refreshEntitlement();
  }

  function contactPayload() {
    return {
      name: els.contactName?.value.trim() || "",
      email: els.contactEmail?.value.trim() || "",
      phone: els.contactPhone?.value.trim() || ""
    };
  }

  function shippingPayload() {
    return {
      name: els.contactName?.value.trim() || "",
      phone: els.contactPhone?.value.trim() || "",
      line1: els.shipLine1?.value.trim() || "",
      line2: els.shipLine2?.value.trim() || "",
      city: els.shipCity?.value.trim() || "",
      region: els.shipRegion?.value.trim() || "",
      postal: els.shipPostal?.value.trim() || "",
      country: els.shipCountry?.value.trim() || ""
    };
  }

  function selectedPrintOfferId() {
    return document.querySelector("[data-cover-option]:checked")?.value || "";
  }

  function syncCoverPrice() {
    if (!els.printPrice) return;
    const selected = selectedPrintOfferId();
    if (selected === "family-print-hardcover") els.printPrice.textContent = t("cover-hardcover");
    else if (selected === "family-print-softcover") els.printPrice.textContent = t("cover-softcover");
    else els.printPrice.textContent = t("cover-required");
  }

  function syncDeliveryUi() {
    if (els.sendBookEmail) els.sendBookEmail.textContent = state.entitlement.emailSent ? t("resend-book-email") : t("send-book-email");
  }

  function printStatusCopy(cover) {
    if (cover === "hardcover") return t("pay-unlocked-hardcover");
    if (cover === "softcover") return t("pay-unlocked-softcover");
    return t("pay-unlocked-print");
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  async function startCheckout(offerId) {
    const isPrint = offerId === "print";
    const selectedOffer = isPrint ? selectedPrintOfferId() : offerId;
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    if (els.adultConfirm && !els.adultConfirm.checked) return setStatus(t("adult-required"), true);
    if (!contactPayload().email) return setStatus(t("adult-required"), true);
    if (isPrint && !selectedOffer) return setStatus(t("cover-required"), true);
    if (isPrint) {
      const shipping = shippingPayload();
      if (!shipping.name || !shipping.phone || !shipping.line1 || !shipping.city || !shipping.region || !shipping.postal || !shipping.country) {
        return setStatus(t("shipping-required"), true);
      }
    }
    setStatus(t("checkout-working"));
    try {
      const response = await fetch("/api/family-book/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: selectedOffer,
          adultConfirmed: els.adultConfirm?.checked === true,
          contact: contactPayload(),
          shipping: isPrint ? shippingPayload() : undefined,
          locale: state.locale,
          returnPath: "/parent-book",
          cancelPath: "/parent-book"
        })
      });
      const result = await response.json().catch(() => ({}));
      if (result.checkoutUrl && result.paid !== true) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setStatus(result.errorZh && state.locale === "zh" ? result.errorZh : (result.error || t("pdf-failed")), true);
      if (els.payNote) els.payNote.textContent = state.locale === "zh" ? (result.errorZh || result.error || state.pricing?.noticeZh || "") : (result.error || state.pricing?.noticeEn || "");
    } catch (error) {
      setStatus(t("pdf-failed"), true);
    }
  }

  async function refreshEntitlement() {
    const params = new URLSearchParams(window.location.search);
    const query = params.toString() ? `?${params.toString()}` : "";
    try {
      const response = await fetch(`/api/family-book/entitlement${query}`);
      const result = await response.json();
      const paid = result.paid === true && result.reason === "server_confirmed";
      state.entitlement = {
        paid,
        kind: result.order?.kind || "",
        cover: result.order?.cover || "",
        orderId: result.order?.id || "",
        grantToken: result.order?.grantToken || "",
        deliveryEmail: result.order?.deliveryEmail || "",
        emailSent: result.order?.emailSent === true
      };
      const digitalPaid = paid && state.entitlement.kind === "digital";
      if (els.deliveryBox) els.deliveryBox.hidden = !digitalPaid;
      if (els.deliveryEmail && digitalPaid && !els.deliveryEmail.value.trim()) {
        els.deliveryEmail.value = state.entitlement.deliveryEmail || result.order?.contactEmail || "";
      }
      if (els.paidActions) els.paidActions.hidden = !(digitalPaid && state.entitlement.deliveryEmail);
      syncDeliveryUi();
      if (els.payUnlocked) {
        els.payUnlocked.hidden = !paid;
        if (paid) els.payUnlocked.textContent = state.entitlement.kind === "print" ? printStatusCopy(state.entitlement.cover) : t("pay-unlocked-digital");
      }
      if (paid) setStatus(state.entitlement.kind === "print" ? printStatusCopy(state.entitlement.cover) : t("pay-unlocked-digital"));
    } catch (_error) {
      state.entitlement = { paid: false, kind: "" };
    }
  }

  function suggestedPdfName() {
    const base = bookTitle().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 60) || "storieslens-book";
    return `${base}.pdf`;
  }

  function paidPagePayload() {
    return state.pages.map((imageDataUrl) => ({ imageDataUrl }));
  }

  async function sendPaidBookEmail() {
    if (!(state.entitlement?.paid && state.entitlement.kind === "digital")) return setStatus(t("pdf-failed"), true);
    const email = els.deliveryEmail?.value.trim() || "";
    if (!validEmail(email)) return setStatus(t("delivery-email-required"), true);
    setStatus(t("email-working"));
    try {
      const response = await fetch("/api/family-book/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: state.entitlement.orderId,
          grantToken: state.entitlement.grantToken,
          email,
          title: bookTitle(),
          authorName: authorName(),
          childName: childName(),
          language: state.locale,
          pages: paidPagePayload()
        })
      });
      const result = await response.json().catch(() => ({}));
      if (result.emailSaved) {
        state.entitlement.deliveryEmail = result.deliveryEmail || email;
        if (els.paidActions) els.paidActions.hidden = false;
      }
      if (result.sent === true) {
        state.entitlement.emailSent = true;
        syncDeliveryUi();
        setStatus(t("email-sent"));
        return;
      }
      syncDeliveryUi();
      const message = state.locale === "zh" ? (result.errorZh || result.error || t("email-saved-unsent")) : (result.error || t("email-saved-unsent"));
      setStatus(message, true);
    } catch (_error) {
      setStatus(t("email-saved-unsent"), true);
    }
  }

  async function ensurePdf() {
    if (!(state.entitlement?.paid && state.entitlement.kind === "digital" && state.entitlement.deliveryEmail)) {
      setStatus(state.entitlement?.paid ? t("delivery-email-required") : t("pdf-failed"), true);
      throw new Error("unpaid");
    }
    if (state.pdfBlob) return state.pdfBlob;
    setStatus(t("pdf-working"));
    try {
      const response = await fetch("/api/family-book/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: state.entitlement.orderId,
          grantToken: state.entitlement.grantToken,
          title: bookTitle(),
          authorName: authorName(),
          childName: childName(),
          language: state.locale,
          pages: paidPagePayload()
        })
      });
      if (response.status === 402 || response.status === 401 || response.status === 403 || response.status === 409) {
        throw new Error("unpaid");
      }
      if (!response.ok) throw new Error("pdf_failed");
      const blob = await response.blob();
      state.pdfBlob = blob;
      if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
      state.pdfUrl = URL.createObjectURL(blob);
      els.pdfFrame.src = state.pdfUrl;
      els.pdfBox.hidden = false;
      els.pdfHelp.textContent = isWeChat() ? t("wechat-pdf") : "";
      setStatus(t("pdf-ready"));
      return blob;
    } catch (error) {
      setStatus(t("pdf-failed"), true);
      throw error;
    }
  }

  function triggerDownload(blob, filename) {
    const url = blob === state.pdfBlob ? state.pdfUrl : (blob === state.filmBlob ? state.filmUrl : URL.createObjectURL(blob));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function shareBlob(blob, filename, title) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return true;
    }
    if (navigator.share) {
      const url = blob === state.pdfBlob ? state.pdfUrl : state.filmUrl;
      if (url) {
        await navigator.share({ title, url });
        return true;
      }
    }
    return false;
  }

  function fillPrintRoot() {
    els.printRoot.innerHTML = "";
    state.pages.forEach((page, index) => {
      const image = document.createElement("img");
      image.src = page;
      image.alt = t("page-of", { current: index + 1, total: state.pages.length });
      els.printRoot.append(image);
    });
  }

  async function requestFilmFromServer() {
    const response = await fetch("/api/parent-book/film", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bookTitle(),
        language: state.locale,
        secondsPerPage: 3,
        pages: state.pages.map((imageDataUrl) => ({ imageDataUrl }))
      })
    });
    if (!response.ok) throw new Error("film_failed");
    const blob = await response.blob();
    if (!blob.size || !(blob.type.includes("mp4") || blob.type.includes("octet-stream") || blob.type === "")) {
      if (blob.size < 1024) throw new Error("film_failed");
    }
    return new Blob([blob], { type: "video/mp4" });
  }

  function pickRecorderMime() {
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  async function recordFilmClient() {
    if (typeof HTMLCanvasElement === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
      throw new Error("film_unavailable");
    }
    const width = 1080;
    const height = 1530;
    const seconds = 3;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    const images = [];
    for (const page of state.pages) images.push(await loadHtmlImage(page));

    const mime = pickRecorderMime();
    const stream = canvas.captureStream(30);
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error("film_failed"));
    });
    recorder.start();

    const start = performance.now();
    const total = images.length * seconds * 1000;
    await new Promise((resolve) => {
      const tick = (now) => {
        const elapsed = now - start;
        const index = Math.min(images.length - 1, Math.floor(elapsed / (seconds * 1000)));
        const image = images[index];
        context.fillStyle = "#f4efe6";
        context.fillRect(0, 0, width, height);
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const dw = image.naturalWidth * scale;
        const dh = image.naturalHeight * scale;
        context.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
        if (elapsed >= total) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const type = recorder.mimeType || mime || "video/webm";
    return new Blob(chunks, { type });
  }

  function showFilm(blob) {
    state.filmBlob = blob;
    if (state.filmUrl) URL.revokeObjectURL(state.filmUrl);
    state.filmUrl = URL.createObjectURL(blob);
    const extension = /mp4/i.test(blob.type) ? "mp4" : "webm";
    state.filmName = suggestedPdfName().replace(/\.pdf$/i, `.${extension}`);
    els.filmPlayer.src = state.filmUrl;
    els.filmBox.hidden = false;
    els.filmHelp.textContent = isWeChat() ? t("wechat-film") : "";
  }

  async function makeFilm() {
    if (!state.pages.length || state.busy) return;
    state.busy = true;
    els.makeFilm.disabled = true;
    setStatus(t("film-working"));
    try {
      let blob;
      try {
        blob = await requestFilmFromServer();
      } catch (_error) {
        blob = await recordFilmClient();
      }
      showFilm(blob);
      setStatus(t("film-ready"));
    } catch (error) {
      setStatus(t("film-failed"), true);
    } finally {
      state.busy = false;
      els.makeFilm.disabled = false;
    }
  }

  els.album.addEventListener("change", (event) => {
    void addFiles(event.target.files);
    event.target.value = "";
  });
  els.camera.addEventListener("change", (event) => {
    void addFiles(event.target.files);
    event.target.value = "";
  });
  els.title.addEventListener("change", () => { saveMeta(); if (state.photos.length) void rebuildBook(); });
  els.childName.addEventListener("change", () => { saveMeta(); if (state.photos.length) void rebuildBook(); });
  els.authorName?.addEventListener("change", () => { saveMeta(); if (state.photos.length) void rebuildBook(); });
  els.authorIntro?.addEventListener("change", () => { saveMeta(); renderIntroTemplates(); if (state.photos.length) void rebuildBook(); });
  els.suggestAccept?.addEventListener("click", () => acceptSuggestion());
  els.suggestSkip?.addEventListener("click", () => skipSuggestion());
  els.suggestUndo?.addEventListener("click", () => undoSuggestion());
  els.buyDigital?.addEventListener("click", () => void startCheckout("family-digital"));
  els.buyPrint?.addEventListener("click", () => void startCheckout("print"));
  document.querySelectorAll("[data-cover-option]").forEach((input) => {
    input.addEventListener("change", () => syncCoverPrice());
  });
  els.sendBookEmail?.addEventListener("click", () => void sendPaidBookEmail());
  els.prev.addEventListener("click", () => {
    if (state.pageIndex > 0) {
      state.pageIndex -= 1;
      renderPreview();
    }
  });
  els.next.addEventListener("click", () => {
    if (state.pageIndex < state.pages.length - 1) {
      state.pageIndex += 1;
      renderPreview();
    }
  });
  els.downloadPdf?.addEventListener("click", async () => {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    const blob = await ensurePdf();
    triggerDownload(blob, suggestedPdfName());
  });
  els.printPdf?.addEventListener("click", async () => {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    const blob = await ensurePdf();
    triggerDownload(blob, suggestedPdfName().replace(/\.pdf$/i, "-print.pdf"));
  });
  els.openPdf?.addEventListener("click", async () => {
    const blob = await ensurePdf();
    const url = state.pdfUrl || URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
  });
  els.sharePdf?.addEventListener("click", async () => {
    const blob = await ensurePdf();
    const shared = await shareBlob(blob, suggestedPdfName(), bookTitle()).catch(() => false);
    if (!shared) setStatus(t("share-unavailable"));
  });
  els.print?.addEventListener("click", () => {
    if (!state.pages.length) return setStatus(t("need-photos"), true);
    fillPrintRoot();
    window.print();
  });
  els.makeFilm.addEventListener("click", () => void makeFilm());
  els.saveFilm.addEventListener("click", () => {
    if (state.filmBlob) triggerDownload(state.filmBlob, state.filmName);
  });
  els.shareFilm.addEventListener("click", async () => {
    if (!state.filmBlob) return;
    const shared = await shareBlob(state.filmBlob, state.filmName, bookTitle()).catch(() => false);
    if (!shared) setStatus(t("share-unavailable"));
  });
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => applyLocale(button.dataset.locale));
  });

  loadMeta();
  applyLocale(detectLocale());
  renderIntroTemplates();
  void refreshPricing();
})();
