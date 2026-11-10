(() => {
  "use strict";

  const LOCALE_KEY = "storieslens_locale";
  const MEMBER_KEY = "storieslens_cocreate_film_member";
  const copy = {
    zh: {
      "brand-sub": "共创电影",
      kicker: "CO-CREATE A FILM · 共创电影",
      title: "邀请同伴一起加场景，一键做成短片",
      lede: "创建一个私密小组，把链接或短码发给另一部手机上的朋友。每人可以写下场景、选配照片，再一键做成可播放的电影。不需要走羽大师写作辅导。预览和这部短片今天免费。",
      "create-kicker": "创建私密共创小组",
      "title-label": "电影标题",
      "style-label": "风格（选填）",
      "name-label": "你的署名",
      "adult-confirm": "我是成年人，负责组织这个小组。孩子可以一起加场景，但不会在这里付款。",
      create: "创建并得到分享链接",
      "join-kicker": "加入这部共创电影",
      "join-adult": "我已了解这是私密共创。署名请用名字或昵称，不要写完整法定姓名。",
      join: "加入小组",
      "share-ready": "把这条私密链接或短码发给同伴。不会出现在公开目录或搜索结果。",
      "copy-share": "复制链接",
      "add-kicker": "添加一个场景",
      "scene-label": "动作或对白",
      photo: "可选：添加一张照片",
      "safety-notice": "请不要上传身份证、学生证，或带有电话、地址、邮箱、二维码的画面。如果照片里有其他人的脸，请确认你是成年人，并且已经得到使用许可。",
      "photo-consent": "如使用照片：我是成年人，并已获得使用这些照片的许可，不会在未同意时上传他人的脸。",
      "add-scene": "加入这一场",
      "make-film": "一键做成电影",
      "film-kicker": "成片预览",
      "download-film": "保存或分享这部短片",
      "pay-note": "预览和这部短片今天免费。付费电影包还没有接到这条线上。成功页本身不会被当成已付款，这里也没有给孩子使用的付款表单。",
      "trust-private": "默认私密 · 不公开列表",
      "trust-free": "创建、加入和预览免费",
      "title-placeholder": "例如：我们的夜晚冒险",
      "style-placeholder": "例如：温暖、安静、水彩感",
      "name-placeholder": "名字或昵称",
      "scene-placeholder": "写下这一场里发生了什么，或一句对白",
      "created": "私密小组已创建。把链接发给同伴，然后开始加场景。",
      "joined": "你已加入。可以添加场景，或一键做成电影。",
      "scene-added": "这一场已加入。顺序会保持稳定，需要时可用箭头微调。",
      "film-working": "正在做成电影…",
      "film-ready": "短片已准备好，可在本页播放。",
      "copied": "链接已复制。",
      "need-title": "请先填写电影标题。",
      "need-adult": "请先确认你是成年人。",
      "need-name": "请先留下署名（名字或昵称即可）。",
      "need-member": "请先加入这个私密小组。",
      "need-scene": "请先写一句场景，或添加一张照片。",
      "need-consent": "使用照片前，请确认你是成年人并已获得许可。",
      "need-scenes": "请至少加入一个场景，再做成电影。",
      blocked: "这段文字或这张照片不能使用。请不要上传证件、学生证，或带有电话、地址、邮箱、二维码的内容。",
      unsupported: "请选择 JPG、PNG、WEBP、HEIC 或 HEIF 图片。",
      "photo-chosen": "已选择一张照片，将在本机去掉拍摄信息。",
      "wechat-film": "短片可在本页直接播放。微信 iOS 往往无法直接下载文件：请长按视频尝试保存，或点击右上角 ···，选择“在浏览器中打开”后再保存。",
      "group-meta": "{count} 位成员 · {scenes} 个场景",
      "join-lede": "你正在打开《{title}》的私密共创。加入后即可添加场景。",
      missing: "找不到这个私密小组，或链接已经过期。",
      failed: "暂时无法完成，请再试一次。",
      up: "上移",
      down: "下移",
      "no-photo": "文字场景",
      docTitle: "共创电影 · StoriesLens"
    },
    en: {
      "brand-sub": "Co-create a film",
      kicker: "CO-CREATE A FILM",
      title: "Invite someone to add scenes, then make a short film in one tap",
      lede: "Create a private group and send a link or short code to another phone. Each person can write a scene, optionally add a photo, then make a playable film in one tap. This does not go through Yu mentoring. Preview and this film are free today.",
      "create-kicker": "Create a private group",
      "title-label": "Film title",
      "style-label": "Style (optional)",
      "name-label": "Your display name",
      "adult-confirm": "I am an adult organizing this group. Children may add scenes, but they will not pay here.",
      create: "Create and get a share link",
      "join-kicker": "Join this co-created film",
      "join-adult": "I understand this is a private group. Use a first name or nickname, not a full legal name.",
      join: "Join the group",
      "share-ready": "Send this private link or short code to a partner. It is not listed publicly or submitted to search.",
      "copy-share": "Copy link",
      "add-kicker": "Add a scene",
      "scene-label": "Action or dialogue",
      photo: "Optional: add a photo",
      "safety-notice": "Do not upload identity documents, student IDs, or images with a phone number, address, email, or QR code. If a photo shows another person's face, confirm you are an adult and have permission to use it.",
      "photo-consent": "If I add a photo: I am an adult, I have permission to use it, and I will not upload other people's faces without consent.",
      "add-scene": "Add this scene",
      "make-film": "Make the film",
      "film-kicker": "Film preview",
      "download-film": "Save or share this film",
      "pay-note": "Preview and this film are free today. Paid movie packs are not connected on this path. A success page is not proof of payment, and there is no child-facing payment form here.",
      "trust-private": "Private by default · not listed",
      "trust-free": "Create, join, and preview are free",
      "title-placeholder": "For example: Our Night Adventure",
      "style-placeholder": "For example: warm, quiet, watercolor",
      "name-placeholder": "First name or nickname",
      "scene-placeholder": "Write what happens in this scene, or a line of dialogue",
      "created": "The private group is ready. Send the link, then start adding scenes.",
      "joined": "You have joined. Add a scene, or make the film in one tap.",
      "scene-added": "Scene added. The order stays stable; use the arrows if you need to adjust it.",
      "film-working": "Making the film…",
      "film-ready": "The film is ready and can be played on this page.",
      "copied": "Link copied.",
      "need-title": "Please enter a film title first.",
      "need-adult": "Please confirm you are an adult first.",
      "need-name": "Please leave a display name (a first name or nickname is enough).",
      "need-member": "Please join this private group first.",
      "need-scene": "Please write a scene, or add a photo, first.",
      "need-consent": "Before using a photo, please confirm you are an adult and have permission.",
      "need-scenes": "Please add at least one scene before making the film.",
      blocked: "That text or photo cannot be used. Please do not upload identity documents, school IDs, or contact information.",
      unsupported: "Please choose a JPG, PNG, WEBP, HEIC, or HEIF image.",
      "photo-chosen": "A photo was selected and will have camera details removed on this device.",
      "wechat-film": "You can play the film on this page. WeChat on iOS often blocks file downloads: try a long press on the video, or tap ··· and choose Open in Browser to save it.",
      "group-meta": "{count} members · {scenes} scenes",
      "join-lede": "You are opening the private co-created film “{title}”. Join to add scenes.",
      missing: "This private group was not found, or the link has expired.",
      failed: "That could not be completed. Please try again.",
      up: "Up",
      down: "Down",
      "no-photo": "Text scene",
      docTitle: "Co-create a film · StoriesLens"
    }
  };

  const els = {
    status: document.querySelector("[data-status]"),
    videoNote: document.querySelector("[data-video-note]"),
    createCard: document.querySelector("[data-create-card]"),
    joinCard: document.querySelector("[data-join-card]"),
    groupCard: document.querySelector("[data-group-card]"),
    filmCard: document.querySelector("[data-film-card]"),
    title: document.querySelector("[data-title]"),
    style: document.querySelector("[data-style]"),
    displayName: document.querySelector("[data-display-name]"),
    adultConfirm: document.querySelector("[data-adult-confirm]"),
    create: document.querySelector("[data-create]"),
    joinName: document.querySelector("[data-join-name]"),
    joinAdult: document.querySelector("[data-join-adult]"),
    join: document.querySelector("[data-join]"),
    joinLede: document.querySelector("[data-join-lede]"),
    groupTitle: document.querySelector("[data-group-title]"),
    groupMeta: document.querySelector("[data-group-meta]"),
    shareUrl: document.querySelector("[data-share-url]"),
    shareCode: document.querySelector("[data-share-code]"),
    copyShare: document.querySelector("[data-copy-share]"),
    sceneList: document.querySelector("[data-scene-list]"),
    sceneText: document.querySelector("[data-scene-text]"),
    sceneImage: document.querySelector("[data-scene-image]"),
    photoConsent: document.querySelector("[data-photo-consent]"),
    imageName: document.querySelector("[data-image-name]"),
    addScene: document.querySelector("[data-add-scene]"),
    makeFilm: document.querySelector("[data-make-film]"),
    filmMode: document.querySelector("[data-film-mode]"),
    filmVideo: document.querySelector("[data-film-video]"),
    filmHelp: document.querySelector("[data-film-help]"),
    downloadFilm: document.querySelector("[data-download-film]")
  };

  const state = {
    locale: "zh",
    group: null,
    memberToken: "",
    pendingImage: "",
    pendingFileName: "",
    videoStatus: null,
    sharePath: "",
    filmUrl: ""
  };

  const t = (key, vars) => {
    const table = copy[state.locale] || copy.zh;
    let value = table[key] || copy.en[key] || key;
    if (vars) Object.keys(vars).forEach((name) => { value = value.replaceAll(`{${name}}`, String(vars[name])); });
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

  function tokenFromLocation() {
    const params = new URLSearchParams(location.search);
    const pathCode = location.pathname.match(/^\/f\/([A-Za-z0-9]+)$/i)?.[1];
    return {
      token: params.get("t") || "",
      code: (params.get("c") || pathCode || "").toUpperCase()
    };
  }

  function memberStorageKey(token) {
    return `${MEMBER_KEY}:${token}`;
  }

  function saveMember(token, memberToken) {
    state.memberToken = memberToken;
    try { localStorage.setItem(memberStorageKey(token), memberToken); } catch (_error) {}
  }

  function loadMember(token) {
    try { return localStorage.getItem(memberStorageKey(token)) || ""; } catch (_error) { return ""; }
  }

  function applyLocale(next) {
    state.locale = next === "en" ? "en" : "zh";
    document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
    document.title = state.group?.title || t("docTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-locale]").forEach((button) => {
      const active = button.dataset.locale === state.locale;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    els.title.placeholder = t("title-placeholder");
    els.style.placeholder = t("style-placeholder");
    els.displayName.placeholder = t("name-placeholder");
    els.joinName.placeholder = t("name-placeholder");
    els.sceneText.placeholder = t("scene-placeholder");
    if (state.videoStatus) {
      els.videoNote.textContent = state.locale === "zh" ? state.videoStatus.noticeZh : state.videoStatus.noticeEn;
    }
    renderGroup();
    try { localStorage.setItem(LOCALE_KEY, state.locale); } catch (_error) {}
  }

  async function toJpegDataUrl(file) {
    const artwork = window.StoriesLensArtworkSafety;
    let source = "";
    if (artwork?.removeMetadata) {
      const sanitized = await artwork.removeMetadata(file);
      source = sanitized.dataUrl;
    } else {
      source = URL.createObjectURL(file);
    }
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("invalid_image"));
      img.src = source;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  }

  function inspect(text, filename) {
    const safety = window.StoriesLensParentBookSafety;
    if (!safety?.inspectParentBookUpload) return { blocked: false };
    return safety.inspectParentBookUpload({ filename, caption: text, title: state.group?.title || els.title.value });
  }

  function renderGroup() {
    const group = state.group;
    if (!group) return;
    els.groupCard.hidden = false;
    els.groupTitle.textContent = group.title;
    els.groupMeta.textContent = [group.style, t("group-meta", { count: group.memberCount, scenes: group.scenes.length })].filter(Boolean).join(" · ");
    const url = new URL(state.sharePath || `/cocreate-film?t=${group.token}`, location.origin).href;
    els.shareUrl.textContent = url;
    els.shareCode.textContent = group.code;
    els.sceneList.innerHTML = "";
    group.scenes.forEach((scene, index) => {
      const item = document.createElement("li");
      item.className = "scene-item";
      const media = scene.imageDataUrl
        ? `<img src="${scene.imageDataUrl}" alt="">`
        : `<img alt="" style="object-fit:contain;color:#f4efe6;display:flex">`;
      item.innerHTML = `${scene.imageDataUrl ? media : `<div class="film-frame" style="width:96px;height:54px;aspect-ratio:auto;display:grid;place-items:center;color:#f4efe6;font-size:11px">${t("no-photo")}</div>`}
        <p>${scene.text || ""}<br><small>${scene.displayName || ""} · ${index + 1}</small></p>
        <div class="order-buttons">
          <button type="button" class="secondary" data-move="up" data-id="${scene.id}">${t("up")}</button>
          <button type="button" class="secondary" data-move="down" data-id="${scene.id}">${t("down")}</button>
        </div>`;
      els.sceneList.append(item);
    });
    els.sceneList.querySelectorAll("[data-move]").forEach((button) => {
      button.addEventListener("click", () => void moveScene(button.dataset.id, button.dataset.move));
    });
    if (group.film?.ready) showFilm(group.film);
  }

  function showFilm(film) {
    els.filmCard.hidden = false;
    els.filmMode.textContent = state.locale === "zh" ? (film.labelZh || "") : (film.labelEn || "");
    if (!els.filmMode.textContent && state.videoStatus) {
      els.filmMode.textContent = state.locale === "zh" ? state.videoStatus.noticeZh : state.videoStatus.noticeEn;
    }
    const url = new URL(film.url, location.origin).href;
    state.filmUrl = url;
    els.filmVideo.src = url;
    els.filmHelp.textContent = isWeChat() ? t("wechat-film") : "";
  }

  async function loadStatus() {
    try {
      const response = await fetch("/api/cocreate-film/status");
      state.videoStatus = await response.json();
    } catch (_error) {
      state.videoStatus = { aiVideoConfigured: false, noticeZh: "", noticeEn: "" };
    }
    els.videoNote.textContent = state.locale === "zh" ? state.videoStatus.noticeZh : state.videoStatus.noticeEn;
  }

  async function loadGroup() {
    const { token, code } = tokenFromLocation();
    if (!token && !code) return;
    els.createCard.hidden = true;
    const path = token
      ? `/api/cocreate-film/groups/${encodeURIComponent(token)}`
      : `/api/cocreate-film/codes/${encodeURIComponent(code)}`;
    const memberGuess = token ? loadMember(token) : "";
    const response = await fetch(`${path}${memberGuess ? `?member=${encodeURIComponent(memberGuess)}` : ""}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.group) {
      setStatus(t("missing"), true);
      return;
    }
    state.group = result.group;
    state.sharePath = result.sharePath || `/cocreate-film?t=${result.group.token}`;
    state.memberToken = memberGuess || loadMember(result.group.token);
    if (state.memberToken && result.group.you) {
      els.joinCard.hidden = true;
      renderGroup();
      setStatus(t("joined"));
    } else if (state.memberToken) {
      // token may not match after expiry; ask to join again
      state.memberToken = "";
      els.joinCard.hidden = false;
      els.joinLede.textContent = t("join-lede", { title: result.group.title });
    } else {
      els.joinCard.hidden = false;
      els.joinLede.textContent = t("join-lede", { title: result.group.title });
    }
    document.title = result.group.title || t("docTitle");
  }

  async function createGroup() {
    if (!els.title.value.trim()) return setStatus(t("need-title"), true);
    if (!els.adultConfirm.checked) return setStatus(t("need-adult"), true);
    if (!els.displayName.value.trim()) return setStatus(t("need-name"), true);
    const inspection = inspect(els.title.value, "");
    if (inspection.blocked) return setStatus(t("blocked"), true);
    const response = await fetch("/api/cocreate-film/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: els.title.value.trim(),
        style: els.style.value.trim(),
        displayName: els.displayName.value.trim(),
        language: state.locale
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.group) return setStatus(t("failed"), true);
    state.group = result.group;
    state.sharePath = result.sharePath;
    saveMember(result.group.token, result.memberToken);
    els.createCard.hidden = true;
    history.replaceState({}, "", result.sharePath);
    renderGroup();
    setStatus(t("created"));
  }

  async function joinGroup() {
    if (!els.joinName.value.trim()) return setStatus(t("need-name"), true);
    if (!els.joinAdult.checked) return setStatus(t("need-adult"), true);
    const inspection = inspect(els.joinName.value, "");
    if (inspection.blocked) return setStatus(t("blocked"), true);
    const response = await fetch(`/api/cocreate-film/groups/${encodeURIComponent(state.group.token)}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: els.joinName.value.trim() })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.group) return setStatus(result.error === "too_many_members" ? t("failed") : t("failed"), true);
    state.group = result.group;
    state.sharePath = result.sharePath || state.sharePath;
    saveMember(result.group.token, result.memberToken);
    els.joinCard.hidden = true;
    renderGroup();
    setStatus(t("joined"));
  }

  async function addScene() {
    if (!state.memberToken) return setStatus(t("need-member"), true);
    const text = els.sceneText.value.trim();
    if (!text && !state.pendingImage) return setStatus(t("need-scene"), true);
    if (state.pendingImage && !els.photoConsent.checked) return setStatus(t("need-consent"), true);
    const inspection = inspect(text, state.pendingFileName);
    if (inspection.blocked) return setStatus(t("blocked"), true);
    const response = await fetch(`/api/cocreate-film/groups/${encodeURIComponent(state.group.token)}/scenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberToken: state.memberToken,
        text,
        imageDataUrl: state.pendingImage,
        filename: state.pendingFileName
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.group) return setStatus(result.reasonCode ? t("blocked") : t("failed"), true);
    state.group = result.group;
    state.pendingImage = "";
    state.pendingFileName = "";
    els.sceneText.value = "";
    els.sceneImage.value = "";
    els.imageName.textContent = "";
    renderGroup();
    setStatus(t("scene-added"));
  }

  async function moveScene(sceneId, direction) {
    if (!state.memberToken) return;
    const response = await fetch(`/api/cocreate-film/groups/${encodeURIComponent(state.group.token)}/scenes/${encodeURIComponent(sceneId)}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberToken: state.memberToken, direction })
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.group) {
      state.group = result.group;
      renderGroup();
    }
  }

  async function makeFilm() {
    if (!state.memberToken) return setStatus(t("need-member"), true);
    if (!state.group?.scenes?.length) return setStatus(t("need-scenes"), true);
    setStatus(t("film-working"));
    const response = await fetch(`/api/cocreate-film/groups/${encodeURIComponent(state.group.token)}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberToken: state.memberToken })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.film?.ready) return setStatus(t("failed"), true);
    result.film.labelZh = result.film.labelZh || result.videoStatus?.noticeZh;
    result.film.labelEn = result.film.labelEn || result.videoStatus?.noticeEn;
    showFilm(result.film);
    setStatus(t("film-ready"));
  }

  function downloadFilm() {
    if (!state.filmUrl) return;
    if (isWeChat()) {
      els.filmHelp.textContent = t("wechat-film");
      return;
    }
    const link = document.createElement("a");
    link.href = state.filmUrl;
    link.download = `${state.group?.title || "storieslens-cocreate-film"}.mp4`;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  els.create.addEventListener("click", () => void createGroup().catch(() => setStatus(t("failed"), true)));
  els.join.addEventListener("click", () => void joinGroup().catch(() => setStatus(t("failed"), true)));
  els.addScene.addEventListener("click", () => void addScene().catch(() => setStatus(t("failed"), true)));
  els.makeFilm.addEventListener("click", () => void makeFilm().catch(() => setStatus(t("failed"), true)));
  els.copyShare.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.shareUrl.textContent);
      setStatus(t("copied"));
    } catch (_error) {
      setStatus(els.shareUrl.textContent);
    }
  });
  els.downloadFilm.addEventListener("click", downloadFilm);
  els.sceneImage.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\//i.test(file.type) && !/\.(heic|heif)$/i.test(file.name || "")) {
      setStatus(t("unsupported"), true);
      return;
    }
    const inspection = inspect("", file.name);
    if (inspection.blocked) return setStatus(t("blocked"), true);
    try {
      state.pendingImage = await toJpegDataUrl(file);
      state.pendingFileName = file.name || "scene.jpg";
      els.imageName.textContent = t("photo-chosen");
    } catch (_error) {
      setStatus(t("unsupported"), true);
    }
  });
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => applyLocale(button.dataset.locale));
  });

  applyLocale(detectLocale());
  void (async () => {
    await loadStatus();
    await loadGroup();
  })();
})();
