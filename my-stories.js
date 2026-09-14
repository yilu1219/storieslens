(function () {
  const platform = window.StoriesLensPlatform;
  const $ = (selector) => document.querySelector(selector);
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
      const share = node("button", "app-secondary", "Share");
      share.type = "button";
      share.addEventListener("click", () => shareProject(project));
      const remove = node("button", "app-secondary", "Archive");
      remove.type = "button";
      remove.addEventListener("click", () => archiveProject(project));
      actions.append(studio, share, remove);
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
    const inviteField = $("[data-beta-invite]");
    const inviteInput = $("[data-beta-invite-code]");
    inviteField.hidden = !result.beta?.inviteOnly;
    inviteInput.required = Boolean(result.beta?.inviteOnly);
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

  function updateSession(result) {
    const user = result.user;
    $("[data-session-title]").textContent = result.authenticated ? `Welcome back, ${user.displayName}.` : "Private guest library";
    const region = user.primaryRegion === "cn" ? "China Mainland" : user.primaryRegion === "us" ? "United States" : user.primaryRegion === "intl" ? "International" : "Region not confirmed";
    $("[data-session-detail]").textContent = result.authenticated ? `Signed in by ${user.signInMethod} · ${user.maskedDestination} · ${region}` : "This device has a private session. Sign in to continue elsewhere.";
    $("[data-signin-card]").hidden = result.authenticated;
    $("[data-delete-card]").hidden = !result.authenticated;
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
      toast("Signed in. Your stories moved with you.");
    } catch (error) { toast(error.message, true); }
  });

  $("[data-wechat]").addEventListener("click", async () => {
    try { await platform.api("/api/auth/wechat", { method: "POST", body: "{}" }); }
    catch (error) { toast(error.message, true); }
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

  $("[data-delete-account]").addEventListener("click", async () => {
    const confirmation = window.prompt("Permanent deletion cannot be undone. Type DELETE MY ACCOUNT to remove the account, stories and private media.");
    if (confirmation !== "DELETE MY ACCOUNT") return toast("Account deletion cancelled.");
    if (!window.confirm("Final confirmation: permanently delete this StoriesLens account and all private media?")) return;
    try {
      await platform.api("/api/account", { method: "DELETE", body: JSON.stringify({ confirmation }) });
      location.href = "index.html?account=deleted";
    } catch (error) { toast(error.message, true); }
  });

  Promise.all([platform.getSession(), loadProjects(), loadOrders(), loadStorageUsage(), loadAvailableRegions()]).then(([session]) => updateSession(session)).catch((error) => toast(error.message, true));
}());
