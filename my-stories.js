(function () {
  const platform = window.StoriesLensPlatform;
  const $ = (selector) => document.querySelector(selector);
  const pageParams = new URLSearchParams(location.search);
  const grid = $("[data-project-grid]");
  const empty = $("[data-empty-state]");
  const toastNode = $("[data-toast]");
  let authMethod = "email";
  let challenge = null;
  let projects = [];
  let platformStatus = null;

  const regionCopy = {
    cn: "China region · China storage and eligible China AI services · CNY/WeChat payment when enabled.",
    us: "United States region · US storage and US-available AI services · USD payment.",
    intl: "International region · An eligible international storage and AI-service region · USD payment."
  };

  function toast(message, error = false) {
    toastNode.textContent = message;
    toastNode.classList.toggle("error", error);
    toastNode.classList.add("show");
    window.setTimeout(() => toastNode.classList.remove("show"), 3500);
  }

  function formatDate(value) {
    try { return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
    catch { return "Recently"; }
  }

  function formatBytes(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024 * 1024) return `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
  }

  function formatMoney(amountMinor, currency) {
    const code = currency === "CNY" ? "CNY" : "USD";
    return new Intl.NumberFormat(code === "CNY" ? "zh-CN" : "en-US", { style: "currency", currency: code }).format((Number(amountMinor) || 0) / 100);
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderProjects() {
    grid.replaceChildren();
    empty.hidden = projects.length > 0;
    projects.forEach((project) => {
      const card = node("article", "app-card project-card");
      const cover = node("div", "project-cover");
      if (project.coverImageUrl) {
        const image = node("img");
        image.src = project.coverImageUrl;
        image.alt = "";
        cover.append(image);
      }
      cover.append(node("span", "", project.visibility === "invite" ? "Invite-only" : "Private"));
      const body = node("div", "project-body");
      body.append(node("h3", "", project.title));
      body.append(node("p", "", project.draft || project.sourceText || "A new story waiting for its first scene."));
      const meta = node("div", "project-meta");
      [project.language === "zh" ? "中文" : project.language === "bilingual" ? "EN + 中文" : "English", `${project.scenes?.length || 0} scenes`, `Updated ${formatDate(project.updatedAt)}`].forEach((value) => meta.append(node("span", "", value)));
      body.append(meta);
      const actions = node("div", "project-actions");
      const studio = node("a", "app-primary", "Edit movie");
      studio.href = `movie-studio.html?project=${encodeURIComponent(project.id)}`;
      const reportLabel = project.completedAt
        ? (project.language === "zh" ? "查看成长报告" : "View growth report")
        : (project.language === "zh" ? "完成并生成报告" : "Finish & report");
      const report = node("a", "app-secondary project-report-link", reportLabel);
      report.href = `project-report.html?project=${encodeURIComponent(project.id)}`;
      const share = node("button", "app-secondary", "Share");
      share.type = "button";
      share.addEventListener("click", () => shareProject(project));
      const remove = node("button", "app-secondary", "Archive");
      remove.type = "button";
      remove.addEventListener("click", () => archiveProject(project));
      const purge = node("button", "app-secondary app-danger", project.language === "zh" ? "永久删除" : "Delete forever");
      purge.type = "button";
      purge.addEventListener("click", () => deleteProjectForever(project));
      actions.append(studio, report, share, remove, purge);
      body.append(actions);
      card.append(cover, body);
      grid.append(card);
    });
    const select = $("[data-guardian-project]");
    select.replaceChildren();
    projects.filter((project) => project.ageGroup === "under18").forEach((project) => {
      const option = node("option", "", project.title);
      option.value = project.id;
      select.append(option);
    });
    $("[data-guardian-card]").hidden = !select.options.length;
  }

  async function loadProjects() {
    await platform.syncLocalProject(true);
    const result = await platform.api("/api/projects");
    projects = result.projects;
    renderProjects();
  }

  async function loadOrders() {
    const result = await platform.api("/api/orders");
    const list = $("[data-order-list]");
    list.replaceChildren();
    if (!result.orders.length) list.append(node("p", "muted", "No orders yet."));
    result.orders.forEach((order) => {
      const item = node("div", "order-item");
      item.append(node("strong", "", `${order.name} · ${order.price}`), node("p", "muted", `${order.status.replaceAll("_", " ")} · ${formatDate(order.createdAt)}`));
      list.append(item);
    });
  }

  async function loadStorageUsage() {
    const result = await platform.api("/api/media-usage");
    const usage = result.usage;
    const regionName = result.region === "cn" ? "China Mainland" : result.region === "us" ? "United States" : result.region === "intl" ? "International" : "this device/server during preview";
    $(`[data-storage-summary]`).textContent = `${formatBytes(usage.bytesUsed)} used · ${formatBytes(usage.bytesRemaining)} remaining`;
    $(`[data-storage-region]`).textContent = `Private media route: ${regionName}. Your original uploads are never placed in a public bucket.`;
    const meter = $(`[data-storage-meter]`);
    meter.setAttribute("aria-valuenow", String(usage.percentUsed));
    $(`[data-storage-bar]`).style.width = `${usage.percentUsed}%`;
  }

  async function loadCredits() {
    const result = await platform.api("/api/credits");
    const gift = result.freeGift || {};
    const renderGiftStep = (selector, unlocked) => {
      const row = $(selector);
      if (!row) return;
      row.classList.toggle("is-unlocked", Boolean(unlocked));
      const icon = row.querySelector("b");
      if (icon) icon.textContent = unlocked ? "✓" : "🔒";
    };
    renderGiftStep("[data-gift-first]", gift.firstIllustration);
    renderGiftStep("[data-gift-reading]", gift.revisionReading);
    renderGiftStep("[data-gift-referral]", gift.referralCreation);
    const referralWrap = $("[data-referral-share]");
    if (referralWrap) {
      referralWrap.hidden = !result.referral;
      if (result.referral) {
        const referralUrl = new URL(result.referral.url, location.origin).href;
        $("[data-referral-link]").value = referralUrl;
        $("[data-referral-status]").textContent = `${result.referral.completed} completed · ${result.referral.pending} creating now · ${result.referral.completed} 位已完成 · ${result.referral.pending} 位创作中`;
      }
    }
    const labels = {
      storyProjects: ["Story projects", "故事项目"],
      imageGenerations: ["AI illustrations", "AI 插图"],
      videoClips: ["5-second film clips", "5秒电影镜头"],
      collaboratorSeats: ["Invited collaborators", "受邀共创者"],
      classroomProjects: ["Classroom projects", "班级项目"],
      studentWorks: ["Student works", "学生作品"]
    };
    const list = $("[data-allowance-list]");
    list.replaceChildren();
    const resources = result.usage?.resources || result.wallet.resources;
    Object.entries(resources).filter(([, allowance]) => allowance.granted > 0 || allowance.reserved > 0).forEach(([resource, allowance]) => {
      const row = node("div");
      const title = labels[resource] || [allowance.label, allowance.labelZh];
      const copy = node("span", "", `Used ${allowance.consumed} · 已用 ${allowance.consumed}　|　Remaining ${allowance.remaining} · 剩余 ${allowance.remaining}　|　Total ${allowance.granted} · 总计 ${allowance.granted}${allowance.reserved ? `　|　${allowance.reserved} processing · 处理中` : ""}`);
      const meter = node("i", "allowance-meter");
      const fill = node("b");
      fill.style.width = `${allowance.granted ? Math.min(100, Math.round((allowance.consumed / allowance.granted) * 100)) : 0}%`;
      meter.append(fill);
      row.append(
        node("strong", "", `${title[0]} · ${title[1]}`),
        copy,
        meter
      );
      list.append(row);
    });
    if (!list.children.length) list.append(node("div", "", "No creation allowance has been granted yet."));
    const totals = result.usage?.totals || {};
    $("[data-usage-consumed]").textContent = `${Number(totals.consumedUnits) || 0} credits`;
    $("[data-usage-reserved]").textContent = `${Number(totals.reservedUnits) || 0} credits`;
    $("[data-usage-last]").textContent = totals.lastUsedAt ? formatDate(totals.lastUsedAt) : "Not used yet · 尚未使用";

    const activity = $("[data-allowance-activity]");
    activity.replaceChildren();
    const resourceNames = Object.fromEntries(Object.entries(labels).map(([key, value]) => [key, `${value[0]} · ${value[1]}`]));
    (result.recentActivity || []).slice(0, 12).forEach((entry) => {
      const item = node("div", "usage-row");
      const amount = Number(entry.delta) || 0;
      item.append(
        node("strong", amount > 0 ? "usage-plus" : "usage-minus", `${amount > 0 ? "+" : "−"}${Math.abs(amount)} ${resourceNames[entry.resource] || entry.resource}`),
        node("span", "", `${entry.type === "grant" ? "Added · 已到账" : "Used · 已使用"} · ${formatDate(entry.createdAt)}`)
      );
      activity.append(item);
    });
    if (!activity.children.length) activity.append(node("p", "muted", "No usage yet · 暂无使用记录"));

    const purchases = result.purchases || [];
    const purchaseWrap = $("[data-purchase-history]");
    const purchaseList = $("[data-purchase-list]");
    purchaseWrap.hidden = !purchases.length;
    purchaseList.replaceChildren();
    purchases.forEach((purchase) => {
      const item = node("div", "usage-row");
      item.append(node("strong", "usage-plus", formatMoney(purchase.amountMinor, purchase.currency)), node("span", "", `${purchase.packageId} · ${formatDate(purchase.createdAt)}`));
      purchaseList.append(item);
    });
    return result;
  }

  async function loadAvailableRegions() {
    const result = await platform.api("/api/platform/status");
    platformStatus = result;
    const allowed = Array.isArray(result.registrationRegions) ? result.registrationRegions : ["cn", "us", "intl"];
    document.querySelectorAll("[data-primary-region] option[value]").forEach((option) => {
      if (!option.value) return;
      const available = allowed.includes(option.value);
      option.disabled = !available;
      if (!available && !option.textContent.includes("coming soon")) option.textContent += " · coming soon";
    });
    document.querySelectorAll("[data-invite-region] option[value]").forEach((option) => {
      if (!option.value) return;
      const available = allowed.includes(option.value);
      option.disabled = !available;
      if (!available && !option.textContent.includes("coming soon")) option.textContent += " · coming soon";
    });
    $("[data-invite-access]").hidden = !result.features?.inviteCodeAuth;
    $("[data-email-auth]").hidden = !result.features?.emailPhoneAuth;
    const inviteField = $("[data-beta-invite]");
    const inviteInput = $("[data-beta-invite-code]");
    inviteField.hidden = false;
    inviteInput.required = false;
    const ageSelect = $("[data-account-age]");
    const minorOption = ageSelect.querySelector('option[value="under18"]');
    if (result.beta?.adultAccountOwnerOnly && minorOption) {
      minorOption.disabled = true;
      minorOption.textContent = "Young creator · use a parent/guardian-owned account";
    }
    const countrySelect = $("[data-country-code]");
    const countryNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([navigator.language || "en"], { type: "region" }) : null;
    countrySelect.replaceChildren();
    (result.allowedInternationalCountries || []).forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = `${countryNames?.of(code) || code} · ${code}`;
      countrySelect.append(option);
    });
    $("[data-primary-region]").dispatchEvent(new Event("change"));
    return result;
  }

  async function shareProject(project) {
    try {
      const result = await platform.api(`/api/projects/${project.id}/share`, { method: "POST", body: "{}" });
      const absoluteUrl = new URL(result.shareUrl, location.href).href;
      if (navigator.share) await navigator.share({ title: project.title, text: "A private StoriesLens story", url: absoluteUrl });
      else await navigator.clipboard.writeText(absoluteUrl);
      toast(navigator.share ? "Private invitation ready." : "Private invitation copied.");
    } catch (error) {
      toast(error.message, true);
      if (error.status === 403) $("[data-guardian-card]").scrollIntoView({ behavior: "smooth" });
    }
  }

  async function archiveProject(project) {
    if (!window.confirm(`Archive “${project.title}”? It remains recoverable for 30 days.`)) return;
    try {
      await platform.api(`/api/projects/${project.id}`, { method: "DELETE" });
      projects = projects.filter((item) => item.id !== project.id);
      renderProjects();
      toast("Story archived. Recovery window: 30 days.");
    } catch (error) { toast(error.message, true); }
  }

  async function deleteProjectForever(project) {
    const confirmation = window.prompt(`Permanently delete “${project.title}”, its source photos, generated media, invitations and consent records? Type DELETE PROJECT AND MEDIA to continue.`);
    if (confirmation !== "DELETE PROJECT AND MEDIA") return toast("Permanent deletion cancelled.");
    if (!window.confirm("Final confirmation: this project and its private media cannot be recovered.")) return;
    try {
      const result = await platform.api(`/api/projects/${project.id}?permanent=true`, {
        method: "DELETE",
        body: JSON.stringify({ confirmation })
      });
      projects = projects.filter((item) => item.id !== project.id);
      renderProjects();
      await loadStorageUsage();
      toast(`Project permanently deleted · ${Number(result.mediaDeleted) || 0} private media files removed.`);
    } catch (error) { toast(error.message, true); }
  }

  function updateSession(result) {
    const user = result.user;
    $("[data-session-title]").textContent = result.authenticated ? `Welcome back, ${user.displayName}.` : "Private guest library";
    const region = user.primaryRegion === "cn" ? "China Mainland" : user.primaryRegion === "us" ? "United States" : user.primaryRegion === "intl" ? "International" : "Region not confirmed";
    $("[data-session-detail]").textContent = result.authenticated ? `Signed in by ${user.signInMethod} · ${user.maskedDestination} · ${region}` : "This device has a private session. Sign in to continue elsewhere.";
    $("[data-signin-card]").hidden = result.authenticated;
    $("[data-delete-card]").hidden = !result.authenticated;
    $("[data-redeem-form]").hidden = !result.authenticated;
    if (result.authenticated && pageParams.get("redeem") && !$("[data-redeem-code]").value) {
      $("[data-redeem-code]").value = pageParams.get("redeem").slice(0, 120);
      $("[data-allowance-notice]").hidden = false;
      $("[data-allowance-notice]").textContent = "Your code is ready. Confirm to add the allowance. · 兑换码已填好，点击确认即可到账。";
    }
  }

  function suggestRegionFromPhone() {
    if (authMethod !== "phone") return;
    const phone = $("[data-auth-destination]").value.replace(/[\s()-]/g, "");
    const select = $("[data-primary-region]");
    if (!select || select.value) return;
    if (phone.startsWith("+86") || phone.startsWith("86")) select.value = "cn";
    else if (phone.startsWith("+1") || phone.startsWith("1")) select.value = "us";
    if (select.value) select.dispatchEvent(new Event("change"));
  }

  $("[data-primary-region]").addEventListener("change", (event) => {
    $("[data-region-note]").textContent = regionCopy[event.target.value] || "This determines where projects may be stored and which AI services may process them. We never change it from your IP alone.";
    const international = event.target.value === "intl";
    const countryField = $("[data-country-field]");
    const countrySelect = $("[data-country-code]");
    countryField.hidden = !international;
    countrySelect.disabled = !international;
    countrySelect.required = international;
    if (international && !countrySelect.options.length && platformStatus) {
      event.target.setCustomValidity("The international beta has no open countries yet.");
    } else {
      event.target.setCustomValidity("");
    }
  });

  document.querySelectorAll("[data-auth-method]").forEach((button) => button.addEventListener("click", () => {
    authMethod = button.dataset.authMethod;
    document.querySelectorAll("[data-auth-method]").forEach((item) => item.classList.toggle("active", item === button));
    const input = $("[data-auth-destination]");
    input.type = authMethod === "email" ? "email" : "tel";
    input.autocomplete = authMethod === "email" ? "email" : "tel";
    input.placeholder = authMethod === "email" ? "you@example.com" : "+8613800000000";
    $("[data-destination-label]").textContent = authMethod === "email" ? "Email address" : "Mobile number with country code";
  }));

  $("[data-invite-access]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const notice = $("[data-auth-notice]");
    const primaryRegion = $("[data-invite-region]").value;
    try {
      const result = await platform.api("/api/auth/invite", { method: "POST", body: JSON.stringify({
        betaInviteCode: $("[data-invite-code]").value.trim(),
        displayName: $("[data-invite-display-name]").value.trim(),
        ageGroup: $("[data-invite-age]").value,
        primaryRegion,
        countryCode: primaryRegion === "cn" ? "CN" : primaryRegion === "us" ? "US" : "",
        locale: localStorage.getItem("storieslens_locale") === "zh" ? "zh" : "en"
      }) });
      updateSession(result);
      await Promise.all([loadProjects(), loadCredits(), loadStorageUsage()]);
      toast("Invitation accepted. Your allowance is ready. · 邀请码已生效，额度已到账。");
    } catch (error) {
      notice.hidden = false;
      notice.className = "notice error";
      notice.textContent = error.message;
    }
  });

  $("[data-auth-start]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const destination = $("[data-auth-destination]").value.trim();
    suggestRegionFromPhone();
    const notice = $("[data-auth-notice]");
    try {
      challenge = await platform.api("/api/auth/start", { method: "POST", body: JSON.stringify({ method: authMethod, destination }) });
      $("[data-auth-start]").hidden = true;
      $("[data-auth-verify]").hidden = false;
      notice.hidden = false;
      notice.textContent = challenge.devCode ? `Local preview code: ${challenge.devCode}. Production sends this privately.` : `Code sent to ${challenge.maskedDestination}.`;
    } catch (error) { notice.hidden = false; notice.className = "notice error"; notice.textContent = error.message; }
  });

  $("[data-auth-verify]").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await platform.api("/api/auth/verify", { method: "POST", body: JSON.stringify({
        challengeId: challenge?.challengeId,
        code: $("[data-auth-code]").value.trim(),
        method: authMethod,
        destination: $("[data-auth-destination]").value.trim(),
        displayName: $("[data-display-name]").value.trim(),
        ageGroup: $("[data-account-age]").value,
        primaryRegion: $("[data-primary-region]").value,
        countryCode: $("[data-primary-region]").value === "intl" ? $("[data-country-code]").value : $("[data-primary-region]").value === "cn" ? "CN" : "US",
        betaInviteCode: $("[data-beta-invite-code]").value.trim(),
        locale: localStorage.getItem("storieslens_locale") === "zh" ? "zh" : "en"
      }) });
      updateSession(result);
      await loadProjects();
      await loadCredits();
      toast("Signed in. Your stories moved with you.");
    } catch (error) { toast(error.message, true); }
  });

  $("[data-wechat]").addEventListener("click", async () => {
    try { await platform.api("/api/auth/wechat", { method: "POST", body: "{}" }); }
    catch (error) { toast(error.message, true); }
  });

  $("[data-redeem-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const notice = $("[data-allowance-notice]");
    try {
      const result = await platform.api("/api/credits/redeem", { method: "POST", body: JSON.stringify({ code: $("[data-redeem-code]").value.trim() }) });
      $("[data-redeem-code]").value = "";
      notice.hidden = false;
      notice.className = "notice";
      notice.textContent = result.redeemed ? "Allowance added successfully. · 额度已到账。" : "This code was already added to your account.";
      await loadCredits();
    } catch (error) {
      notice.hidden = false;
      notice.className = "notice error";
      notice.textContent = error.message;
    }
  });

  $("[data-new-story]").addEventListener("click", () => { $("[data-new-story-form]").hidden = false; $("[data-new-title]").focus(); });
  $("[data-cancel-new]").addEventListener("click", () => { $("[data-new-story-form]").hidden = true; });
  $("[data-new-story-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await platform.api("/api/projects", { method: "POST", body: JSON.stringify({
        title: $("[data-new-title]").value.trim(), language: $("[data-new-language]").value, ageGroup: $("[data-new-age]").value,
        sourceType: "text", sourceText: $("[data-new-spark]").value.trim(), visibility: "private", mode: "solo"
      }) });
      location.href = `movie-studio.html?project=${encodeURIComponent(result.project.id)}`;
    } catch (error) { toast(error.message, true); }
  });

  $("[data-guardian-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const projectId = $("[data-guardian-project]").value;
    try {
      await platform.api(`/api/projects/${projectId}/consents`, { method: "POST", body: JSON.stringify({
        guardianName: $("[data-guardian-name]").value.trim(), relationship: $("[data-guardian-relationship]").value.trim(),
        confirmedAdult: $("[data-consent-adult]").checked, approvedPrivateMedia: $("[data-consent-media]").checked, approvedSharing: $("[data-consent-share]").checked
      }) });
      toast("Guardian approval recorded for this private project.");
    } catch (error) { toast(error.message, true); }
  });

  $("[data-revoke-consent]").addEventListener("click", async () => {
    const projectId = $("[data-guardian-project]").value;
    if (!projectId) return toast("Choose a young creator’s project first.", true);
    try {
      const result = await platform.api(`/api/projects/${projectId}/consents`);
      const active = result.consents.at(-1);
      if (!active) return toast("This project has no active approval.", true);
      if (!window.confirm("Revoke guardian approval and every active invitation for this project?")) return;
      await platform.api(`/api/projects/${projectId}/consents/${active.id}`, { method: "DELETE" });
      toast("Approval and active invitations were revoked.");
    } catch (error) { toast(error.message, true); }
  });

  $("[data-copy-referral]")?.addEventListener("click", async () => {
    const link = $("[data-referral-link]")?.value || "";
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast("Invitation link copied. The gift unlocks only after your friend completes a first scene. · 邀请链接已复制，朋友完成第一幕后双方才会获得奖励。");
    } catch (_error) {
      $("[data-referral-link]")?.select();
      toast("Select and copy the invitation link. · 请选中并复制邀请链接。");
    }
  });

  $("[data-delete-account]").addEventListener("click", async () => {
    const confirmation = window.prompt("Permanent deletion cannot be undone. Type DELETE MY ACCOUNT to remove the account, stories and private media.");
    if (confirmation !== "DELETE MY ACCOUNT") return toast("Account deletion cancelled.");
    if (!window.confirm("Final confirmation: permanently delete this StoriesLens account and all private media?")) return;
    try {
      await platform.api("/api/account", { method: "DELETE", body: JSON.stringify({ confirmation }) });
      location.href = "index.html?account=deleted";
    } catch (error) { toast(error.message, true); }
  });

  platform.getSession().then(async (session) => {
    // Establish exactly one private session before parallel account requests.
    // Otherwise a first-time browser can race several guest-session cookies.
    await Promise.all([loadProjects(), loadOrders(), loadStorageUsage(), loadAvailableRegions(), loadCredits()]);
    updateSession(session);
  }).catch((error) => toast(error.message, true));
}());
