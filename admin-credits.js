(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  let packages = [];
  let generatedRows = [];
  const packageBenchmarks = {
    "free-preview": { price: { usd: 0, cny: 0 }, costGuardUsd: 0.35 },
    "creator-story": { price: { usd: 19, cny: 129 }, costGuardUsd: 3.5 },
    "invite-cocreate": { price: { usd: 39, cny: 269 }, costGuardUsd: 5.5 },
    "teacher-classroom": { price: { usd: 79, cny: 569 }, costGuardUsd: 12 },
    "movie-30": { price: { usd: 39, cny: 269 }, costGuardUsd: 15 },
    "movie-60": { price: { usd: 69, cny: 499 }, costGuardUsd: 28 }
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "操作未完成，请稍后重试。");
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function toast(message, isError = false) {
    const element = $("[data-toast]");
    element.textContent = message;
    element.className = `toast show${isError ? " error" : ""}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { element.className = "toast"; }, 3200);
  }

  function packageName(id) {
    const item = packages.find((candidate) => candidate.id === id);
    return item ? `${item.nameZh} · ${item.name}` : id;
  }

  function packagePrice(item) {
    const price = item?.price || packageBenchmarks[item?.id]?.price;
    if (!price || Number(price.usd) === 0) return "免费体验";
    return `$${Number(price.usd)} · ¥${Number(price.cny)}`;
  }

  function packageAllowance(item) {
    const names = {
      storyProjects: "故事项目",
      imageGenerations: "AI 插图",
      videoClips: "5秒电影镜头",
      collaboratorSeats: "受邀共创者",
      classroomProjects: "班级项目",
      studentWorks: "学生作品"
    };
    return Object.entries(item.grants || {}).map(([resource, units]) => `${names[resource] || resource} × ${units}`).join(" · ");
  }

  function renderPackages() {
    const list = $("[data-package-list]");
    if (!list) return;
    list.replaceChildren(...packages.map((item) => {
      const card = document.createElement("article");
      card.className = "package-card";
      const benchmark = packageBenchmarks[item.id] || {};
      const salePrice = Number(item.price?.usd ?? benchmark.price?.usd ?? 0);
      const costGuardUsd = Number(item.costGuardUsd ?? benchmark.costGuardUsd ?? 0);
      const paymentFee = salePrice > 0 ? salePrice * 0.029 + 0.30 : 0;
      const contribution = Math.max(0, salePrice - costGuardUsd - paymentFee);
      card.innerHTML = `<div class="package-card-heading"><div><span></span><h3></h3></div><strong></strong></div><p class="package-grants"></p><div class="package-economics"><span></span><b></b></div>`;
      $(".package-card-heading span", card).textContent = item.name;
      $("h3", card).textContent = item.nameZh;
      $(".package-card-heading strong", card).textContent = packagePrice(item);
      $(".package-grants", card).textContent = packageAllowance(item);
      $(".package-economics span", card).textContent = `成本护栏 ≤ $${costGuardUsd.toFixed(2)}`;
      $(".package-economics b", card).textContent = salePrice > 0 ? `美国卡费后保守贡献约 $${contribution.toFixed(2)}` : "每位用户只自动发一次";
      return card;
    }));
  }

  function fillPackageSelect(select) {
    const selected = select.value;
    select.replaceChildren(...packages.map((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.nameZh} · ${packagePrice(item)}`;
      return option;
    }));
    if (packages.some((item) => item.id === selected)) select.value = selected;
  }

  function allowancePills(wallet) {
    const names = {
      storyProjects: "故事",
      imageGenerations: "插图",
      videoClips: "电影镜头",
      collaboratorSeats: "共创者",
      classroomProjects: "班级",
      studentWorks: "学生作品"
    };
    return Object.entries(wallet.resources).filter(([, item]) => item.granted > 0 || item.reserved > 0).map(([key, item]) => `<span>${names[key]} ${item.remaining}/${item.granted}${item.reserved ? ` · ${item.reserved} reserved` : ""}</span>`).join("") || "<span>尚无额度</span>";
  }

  function renderUsers(users) {
    const list = $("[data-user-list]");
    if (!users.length) {
      list.innerHTML = '<p class="empty">没有找到认证账户。</p>';
      return;
    }
    list.replaceChildren(...users.map((user) => {
      const card = document.createElement("article");
      card.className = "user-card";
      card.innerHTML = `
        <div><h3></h3><p></p><small></small></div>
        <div class="allowance-pills"></div>
        <div class="grant-controls"><select aria-label="额度包"></select><button class="primary" type="button">发放</button></div>`;
      $("h3", card).textContent = user.displayName;
      $("p", card).textContent = `${user.maskedDestination || "私密账户"} · ${user.primaryRegion.toUpperCase()}`;
      $("small", card).textContent = user.id;
      $(".allowance-pills", card).innerHTML = allowancePills(user.wallet);
      const select = $("select", card);
      fillPackageSelect(select);
      $("button", card).addEventListener("click", async () => {
        const chosen = packages.find((item) => item.id === select.value);
        if (!chosen || !window.confirm(`确认给 ${user.displayName} 发放“${chosen.nameZh}”吗？`)) return;
        try {
          await api("/api/admin/grants", {
            method: "POST",
            body: JSON.stringify({ userId: user.id, packageId: chosen.id, note: "创始人后台人工发放", idempotencyKey: crypto.randomUUID() })
          });
          toast(`已发放：${chosen.nameZh}`);
          await loadUsers();
          await loadSummary();
          await loadLedger();
        } catch (error) { toast(error.message, true); }
      });
      return card;
    }));
  }

  function renderBatches(batches) {
    const list = $("[data-batch-list]");
    if (!batches.length) {
      list.innerHTML = '<p class="empty">暂无邀请码批次。</p>';
      return;
    }
    list.replaceChildren(...batches.map((batch) => {
      const row = document.createElement("div");
      row.className = "batch-row";
      const disabled = Boolean(batch.disabledAt);
      row.innerHTML = `<div><strong></strong><small></small></div><button type="button" ${disabled ? "disabled" : ""}>${disabled ? "已停用" : "停用"}</button>`;
      $("strong", row).textContent = `${batch.label || "邀请码批次"} · ${packageName(batch.packageId)}`;
      $("small", row).textContent = `${batch.region.toUpperCase()} · 已领取 ${batch.totalRedemptions} · 剩余 ${batch.availableRedemptions} · ${new Date(batch.expiresAt).toLocaleDateString()} 到期`;
      $("button", row).addEventListener("click", async () => {
        if (!window.confirm("确认停用本批次所有未使用的邀请码吗？已经领取的额度不受影响。")) return;
        try {
          await api(`/api/admin/invites/${encodeURIComponent(batch.id)}`, { method: "DELETE", body: "{}" });
          toast("该邀请码批次已停用。");
          await loadBatches();
          await loadSummary();
        } catch (error) { toast(error.message, true); }
      });
      return row;
    }));
  }

  function renderLedger(transactions, reservations) {
    const list = $("[data-ledger-list]");
    const rows = [
      ...transactions.map((item) => ({ at: item.createdAt, title: item.type === "grant" ? `发放 ${item.delta} · ${item.resource}` : `扣减 ${Math.abs(item.delta)} · ${item.resource}`, detail: `${item.packageId || item.source || "system"} · ${item.userId.slice(0, 8)} · ${item.costUsd == null ? "成本未提供" : `$${Number(item.costUsd).toFixed(4)}`}` })),
      ...reservations.filter((item) => item.status === "reserved").map((item) => ({ at: item.createdAt, title: `预占 ${item.units} · ${item.resource}`, detail: `${item.referenceType} · ${item.userId.slice(0, 8)}` }))
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80);
    if (!rows.length) {
      list.innerHTML = '<p class="empty">暂无额度流水。</p>';
      return;
    }
    list.replaceChildren(...rows.map((item) => {
      const row = document.createElement("div");
      row.className = "ledger-row";
      const strong = document.createElement("strong");
      const small = document.createElement("small");
      strong.textContent = item.title;
      small.textContent = `${item.detail} · ${new Date(item.at).toLocaleString()}`;
      row.append(strong, small);
      return row;
    }));
  }

  async function loadSummary() {
    const result = await api("/api/admin/summary");
    packages = result.packages;
    document.querySelectorAll("[data-invite-package]").forEach(fillPackageSelect);
    $("[data-summary-accounts]").textContent = result.accounts;
    $("[data-summary-codes]").textContent = result.activeCodes;
    $("[data-summary-grants]").textContent = result.grants;
    $("[data-summary-consumed]").textContent = result.consumed;
    $("[data-summary-reserved]").textContent = result.activeReservations ?? 0;
    $("[data-summary-cost]").textContent = `$${Number(result.recordedModelCostUsd || 0).toFixed(2)}`;
    renderPackages();
  }

  async function loadUsers() {
    const query = $("[data-user-query]").value.trim();
    const result = await api(`/api/admin/users?query=${encodeURIComponent(query)}`);
    renderUsers(result.users);
  }

  async function loadBatches() {
    const result = await api("/api/admin/invites");
    renderBatches(result.batches);
  }

  async function loadLedger() {
    const result = await api("/api/admin/ledger");
    renderLedger(result.transactions, result.reservations);
  }

  async function loadConsole() {
    await Promise.all([loadSummary(), loadBatches(), loadLedger()]);
    await loadUsers();
  }

  function showApp() {
    $("[data-login-panel]").hidden = true;
    $("[data-admin-app]").hidden = false;
    $("[data-admin-logout]").hidden = false;
  }

  $("[data-admin-login]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const notice = $("[data-login-notice]");
    try {
      await api("/api/admin/session", { method: "POST", body: JSON.stringify({ accessKey: $("[data-admin-key]").value }) });
      $("[data-admin-key]").value = "";
      showApp();
      await loadConsole();
    } catch (error) {
      notice.hidden = false;
      notice.className = "notice error";
      notice.textContent = error.message;
    }
  });

  $("[data-admin-logout]").addEventListener("click", async () => {
    await api("/api/admin/session", { method: "DELETE", body: "{}" }).catch(() => {});
    location.reload();
  });

  $("[data-refresh]").addEventListener("click", () => loadConsole().then(() => toast("后台数据已刷新。")).catch((error) => toast(error.message, true)));
  $("[data-user-search]").addEventListener("submit", (event) => { event.preventDefault(); loadUsers().catch((error) => toast(error.message, true)); });

  $("[data-invite-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const notice = $("[data-invite-notice]");
    try {
      const result = await api("/api/admin/invites", { method: "POST", body: JSON.stringify({
        packageId: $("[data-invite-package]").value,
        region: $("[data-invite-region]").value,
        count: Number($("[data-invite-count]").value),
        maxRedemptions: Number($("[data-invite-uses]").value),
        expiresInDays: Number($("[data-invite-days]").value),
        label: $("[data-invite-label]").value.trim()
      }) });
      generatedRows = result.codes.map((code) => ({ code, packageId: result.batch.packageId, region: result.batch.region, expiresAt: result.batch.expiresAt }));
      $("[data-generated-codes]").value = result.codes.join("\n");
      $("[data-generated-panel]").hidden = false;
      notice.hidden = false;
      notice.className = "notice";
      notice.textContent = `已生成 ${result.codes.length} 个邀请码，请立即保存。`;
      await loadBatches();
      await loadSummary();
    } catch (error) {
      notice.hidden = false;
      notice.className = "notice error";
      notice.textContent = error.message;
    }
  });

  $("[data-copy-codes]").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("[data-generated-codes]").value);
    toast("邀请码已复制。");
  });

  $("[data-download-codes]").addEventListener("click", () => {
    const csv = ["code,package,region,expires_at", ...generatedRows.map((row) => [row.code, row.packageId, row.region, row.expiresAt].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `storieslens-invites-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  api("/api/admin/session").then(async (session) => {
    if (!session.authenticated) {
      if (!session.configured) {
        const notice = $("[data-login-notice]");
        notice.hidden = false;
        notice.textContent = "服务器需要先配置 ADMIN_ACCESS_KEY_SHA256 才能打开额度后台。";
      }
      return;
    }
    showApp();
    await loadConsole();
  }).catch((error) => toast(error.message, true));
})();
