(() => {
  "use strict";

  const LOCALE_KEY = "storieslens_locale";
  const copy = {
    zh: {
      "brand-sub": "家长预览",
      kicker: "PRIVATE BOOK · 私密书",
      prev: "上一页",
      next: "下一页",
      "price-free-tag": "FREE · 免费预览",
      "price-free-title": "在手机里翻阅这本书",
      "price-free-copy": "预览免费。正式电子版和印刷版需要确认付款后才能完成。",
      "price-digital": "电子版 A5 PDF · ¥19.9（约 $2.99）",
      "price-digital-copy": "确认付款后才能下载正式 A5 电子版。成功页本身不会解锁文件。",
      "buy-digital": "购买电子版",
      "price-print": "印刷成书 · ¥129（约 $17.99）",
      "price-print-copy": "确认付款后，我们会按你留下的地址人工安排首批印刷和寄送。没有自动物流跟踪，也不假装已对接印刷厂。",
      "buy-print": "申请印刷并支付",
      "contact-name": "成人姓名",
      "contact-email": "成人邮箱",
      "ship-line1": "收件地址",
      "ship-city": "城市",
      "ship-region": "省/州",
      "ship-postal": "邮编",
      "ship-country": "国家/地区",
      "adult-confirm": "我是家长或成年人，孩子不会在此付款。",
      "download-pdf": "下载已购买的 A5 PDF",
      "page-of": "第 {current} 页，共 {total} 页",
      missing: "找不到这本私密书，或链接已经过期。",
      loading: "正在打开私密书…",
      ready: "可以免费翻阅。下载或印刷需要确认付款。",
      "adult-required": "请先确认你是家长或成年人，并留下成人邮箱。",
      "shipping-required": "印刷订单需要完整地址。",
      "checkout-working": "正在连接安全结账…",
      unpaid: "还不能下载。成功页本身不会解锁文件。",
      "pay-unlocked-digital": "服务器已确认电子版付款。现在可以下载正式 A5 PDF。",
      "pay-unlocked-print": "服务器已确认印刷付款。我们会人工安排首批印刷和寄送，暂时没有自动物流跟踪。",
      "pdf-ready": "已购买的 A5 PDF 已准备好。",
      ledeClass: "{className} 的班级书。这是一条私密链接，不会出现在搜索结果里。",
      docTitle: "私密班级书 · StoriesLens"
    },
    en: {
      "brand-sub": "Parent preview",
      kicker: "PRIVATE BOOK",
      prev: "Previous",
      next: "Next",
      "price-free-tag": "FREE PREVIEW",
      "price-free-title": "Read this book on your phone",
      "price-free-copy": "Preview is free. The official digital edition and printed book require a confirmed payment.",
      "price-digital": "Digital A5 PDF · ¥19.9 (about $2.99)",
      "price-digital-copy": "The official A5 PDF unlocks only after a confirmed payment. A success page alone will not unlock the file.",
      "buy-digital": "Buy the digital edition",
      "price-print": "Printed book · ¥129 (about $17.99)",
      "price-print-copy": "After a confirmed payment, we will use your address to arrange the first batch manually. There is no automated tracking yet, and we do not claim a print factory is already connected.",
      "buy-print": "Request print and pay",
      "contact-name": "Adult name",
      "contact-email": "Adult email",
      "ship-line1": "Address",
      "ship-city": "City",
      "ship-region": "State / province",
      "ship-postal": "Postal code",
      "ship-country": "Country / region",
      "adult-confirm": "I am a parent or another adult. A child will not pay here.",
      "download-pdf": "Download the purchased A5 PDF",
      "page-of": "Page {current} of {total}",
      missing: "This private book was not found, or the link has expired.",
      loading: "Opening the private book…",
      ready: "You can browse this book for free. Download or print requires a confirmed payment.",
      "adult-required": "Please confirm you are a parent or adult, and leave an adult email address.",
      "shipping-required": "A print order needs a complete shipping address.",
      "checkout-working": "Opening secure checkout…",
      unpaid: "This download is not unlocked. A success page is not proof of payment.",
      "pay-unlocked-digital": "The server has confirmed the digital payment. You can now download the official A5 PDF.",
      "pay-unlocked-print": "The server has confirmed the print payment. We will arrange the first batch manually. There is no automated tracking yet.",
      "pdf-ready": "Your purchased A5 PDF is ready.",
      ledeClass: "A class book for {className}. This is a private link and is not listed in search results.",
      docTitle: "Private class book · StoriesLens"
    }
  };

  const els = {
    title: document.querySelector("[data-book-title]"),
    lede: document.querySelector("[data-book-lede]"),
    status: document.querySelector("[data-status]"),
    previewCard: document.querySelector("[data-preview-card]"),
    pageImage: document.querySelector("[data-page-image]"),
    pageLabel: document.querySelector("[data-page-label]"),
    prev: document.querySelector("[data-prev]"),
    next: document.querySelector("[data-next]"),
    payNote: document.querySelector("[data-pay-note]"),
    payUnlocked: document.querySelector("[data-pay-unlocked]"),
    paidActions: document.querySelector("[data-paid-actions]"),
    buyDigital: document.querySelector("[data-buy-digital]"),
    buyPrint: document.querySelector("[data-buy-print]"),
    adultConfirm: document.querySelector("[data-adult-confirm]"),
    contactName: document.querySelector("[data-contact-name]"),
    contactEmail: document.querySelector("[data-contact-email]"),
    shipLine1: document.querySelector("[data-ship-line1]"),
    shipCity: document.querySelector("[data-ship-city]"),
    shipRegion: document.querySelector("[data-ship-region]"),
    shipPostal: document.querySelector("[data-ship-postal]"),
    shipCountry: document.querySelector("[data-ship-country]"),
    downloadPdf: document.querySelector("[data-download-pdf]")
  };

  const state = { locale: "zh", share: null, pageIndex: 0, pricing: null, entitlement: { paid: false } };

  const t = (key, vars) => {
    const table = copy[state.locale] || copy.zh;
    let value = table[key] || copy.en[key] || key;
    if (vars) Object.keys(vars).forEach((name) => { value = value.replaceAll(`{${name}}`, String(vars[name])); });
    return value;
  };

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
    return "en";
  }

  function setStatus(message, isError = false) {
    els.status.textContent = message || "";
    els.status.classList.toggle("is-error", Boolean(isError));
  }

  function applyLocale(next) {
    state.locale = next === "en" ? "en" : "zh";
    document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
    document.title = state.share?.title || t("docTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-locale]").forEach((button) => {
      const active = button.dataset.locale === state.locale;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (state.share) els.lede.textContent = t("ledeClass", { className: state.share.className || state.share.title || "StoriesLens" });
    if (els.payNote && state.pricing) els.payNote.textContent = state.locale === "zh" ? state.pricing.noticeZh : state.pricing.noticeEn;
    try { localStorage.setItem(LOCALE_KEY, state.locale); } catch (_error) {}
  }

  function tokenFromLocation() {
    const params = new URLSearchParams(location.search);
    const pathCode = location.pathname.match(/^\/b\/([A-Za-z0-9]+)$/i)?.[1];
    const pathToken = location.pathname.match(/^\/book-share\/([a-f0-9]+)$/i)?.[1];
    return {
      token: params.get("t") || pathToken || "",
      code: (params.get("c") || pathCode || "").toUpperCase()
    };
  }

  function renderPreview() {
    const pages = state.share?.pages || [];
    if (!pages.length) return;
    els.pageImage.src = pages[state.pageIndex].imageDataUrl;
    els.pageLabel.textContent = t("page-of", { current: state.pageIndex + 1, total: pages.length });
    els.prev.disabled = state.pageIndex === 0;
    els.next.disabled = state.pageIndex >= pages.length - 1;
  }

  async function loadBook() {
    setStatus(t("loading"));
    const { token, code } = tokenFromLocation();
    const path = token ? `/api/family-book/shares/${encodeURIComponent(token)}` : (code ? `/api/family-book/codes/${encodeURIComponent(code)}` : "");
    if (!path) return setStatus(t("missing"), true);
    const response = await fetch(path);
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.share) return setStatus(t("missing"), true);
    state.share = result.share;
    els.title.textContent = result.share.title || result.share.className || "StoriesLens";
    els.lede.textContent = t("ledeClass", { className: result.share.className || result.share.title || "StoriesLens" });
    els.previewCard.hidden = false;
    renderPreview();
    setStatus(t("ready"));
  }

  async function loadPricing() {
    try {
      const response = await fetch("/api/family-book/pricing");
      state.pricing = await response.json();
    } catch (_error) {
      state.pricing = { checkoutConfigured: false, noticeZh: "", noticeEn: "" };
    }
    if (els.payNote) els.payNote.textContent = state.locale === "zh" ? state.pricing.noticeZh : state.pricing.noticeEn;
    const configured = state.pricing.checkoutConfigured === true;
    if (els.buyDigital) els.buyDigital.disabled = !configured;
    if (els.buyPrint) els.buyPrint.disabled = !configured;
  }

  async function refreshEntitlement() {
    const query = location.search || "";
    const response = await fetch(`/api/family-book/entitlement${query}`);
    const result = await response.json().catch(() => ({ paid: false }));
    const paid = result.paid === true && result.reason === "server_confirmed";
    state.entitlement = { paid, kind: result.order?.kind || "", orderId: result.order?.id || "", grantToken: result.order?.grantToken || "" };
    if (els.paidActions) els.paidActions.hidden = !(paid && state.entitlement.kind === "digital");
    if (els.payUnlocked) {
      els.payUnlocked.hidden = !paid;
      if (paid) els.payUnlocked.textContent = state.entitlement.kind === "print" ? t("pay-unlocked-print") : t("pay-unlocked-digital");
    }
  }

  async function startCheckout(offerId) {
    if (els.adultConfirm && !els.adultConfirm.checked) return setStatus(t("adult-required"), true);
    if (!els.contactEmail?.value.trim()) return setStatus(t("adult-required"), true);
    if (offerId === "family-print" && (!els.shipLine1.value.trim() || !els.shipCity.value.trim() || !els.shipCountry.value.trim())) {
      return setStatus(t("shipping-required"), true);
    }
    setStatus(t("checkout-working"));
    const returnPath = `/book-share?t=${encodeURIComponent(state.share.token)}`;
    const response = await fetch("/api/family-book/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId,
        shareToken: state.share.token,
        adultConfirmed: els.adultConfirm?.checked === true,
        contact: { name: els.contactName?.value.trim() || "", email: els.contactEmail.value.trim() },
        shipping: offerId === "family-print" ? {
          name: els.contactName?.value.trim() || "",
          line1: els.shipLine1.value.trim(),
          city: els.shipCity.value.trim(),
          region: els.shipRegion.value.trim(),
          postal: els.shipPostal.value.trim(),
          country: els.shipCountry.value.trim()
        } : undefined,
        locale: state.locale,
        returnPath,
        cancelPath: returnPath
      })
    });
    const result = await response.json().catch(() => ({}));
    if (result.checkoutUrl && result.paid !== true) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    setStatus(state.locale === "zh" ? (result.errorZh || result.error || t("unpaid")) : (result.error || t("unpaid")), true);
  }

  async function downloadPaidPdf() {
    if (!(state.entitlement.paid && state.entitlement.kind === "digital")) return setStatus(t("unpaid"), true);
    const response = await fetch("/api/family-book/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: state.entitlement.orderId,
        grantToken: state.entitlement.grantToken,
        title: state.share.title,
        language: state.share.language
      })
    });
    if (!response.ok) return setStatus(t("unpaid"), true);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.share.title || "storieslens-book"}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    setStatus(t("pdf-ready"));
  }

  els.prev.addEventListener("click", () => { if (state.pageIndex > 0) { state.pageIndex -= 1; renderPreview(); } });
  els.next.addEventListener("click", () => { if (state.share && state.pageIndex < state.share.pages.length - 1) { state.pageIndex += 1; renderPreview(); } });
  els.buyDigital.addEventListener("click", () => void startCheckout("family-digital"));
  els.buyPrint.addEventListener("click", () => void startCheckout("family-print"));
  els.downloadPdf.addEventListener("click", () => void downloadPaidPdf());
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => applyLocale(button.dataset.locale));
  });

  applyLocale(detectLocale());
  void (async () => {
    await loadPricing();
    await loadBook();
    await refreshEntitlement();
  })();
})();
