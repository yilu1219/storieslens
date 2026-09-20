(function () {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;

  let savedLocale = "";
  try { savedLocale = localStorage.getItem("storieslens_locale") || ""; } catch (_) {}
  const isChinese = document.documentElement.lang.toLowerCase().startsWith("zh") || savedLocale === "zh";
  const copy = isChinese ? {
    install: "安装轻应用",
    installMessage: "把语镜故事装到手机桌面，全屏创作并更快回到草稿。",
    update: "发现新版本，更新后即可使用最新功能。",
    updateButton: "立即更新",
    installed: "StoriesLens 已安装到这台设备。",
    iosTitle: "在 iPhone 或 iPad 上安装",
    iosSteps: "请使用 Safari 打开本页，点击底部的“分享”按钮，再选择“添加到主屏幕”。",
    androidTitle: "在 Android 上安装",
    androidSteps: "请使用 Chrome 打开本页，点击菜单，再选择“安装应用”或“添加到主屏幕”。",
    desktopTitle: "在电脑上安装",
    desktopSteps: "请使用 Chrome 或 Edge 打开本页，再点击地址栏右侧的安装图标。",
    close: "关闭",
    learn: "查看方法"
  } : {
    install: "Install App",
    installMessage: "Install StoriesLens on your home screen for full-screen creation and quicker return to drafts.",
    update: "A new StoriesLens version is ready.",
    updateButton: "Update",
    installed: "StoriesLens is installed on this device.",
    iosTitle: "Install on iPhone or iPad",
    iosSteps: "Open this page in Safari, tap Share at the bottom, then choose Add to Home Screen.",
    androidTitle: "Install on Android",
    androidSteps: "Open this page in Chrome, open the menu, then choose Install app or Add to Home screen.",
    desktopTitle: "Install on a computer",
    desktopSteps: "Open this page in Chrome or Edge, then use the install icon at the right side of the address bar.",
    close: "Close",
    learn: "Show me"
  };

  let installPrompt = null;
  const standalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const storageGet = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const removeBanner = () => document.querySelector("[data-pwa-banner]")?.remove();

  function banner(message, buttonText, action, { dismissible = true } = {}) {
    removeBanner();
    const root = document.createElement("div");
    root.className = "pwa-install-banner";
    root.dataset.pwaBanner = "";
    root.setAttribute("role", "status");
    const copyNode = document.createElement("span"); copyNode.textContent = message;
    const actionButton = document.createElement("button"); actionButton.type = "button"; actionButton.textContent = buttonText;
    actionButton.addEventListener("click", async () => { await action(); root.remove(); });
    root.append(copyNode, actionButton);
    if (dismissible) {
      const close = document.createElement("button"); close.type = "button"; close.className = "pwa-banner-close"; close.setAttribute("aria-label", copy.close); close.textContent = "×";
      close.addEventListener("click", () => { storageSet("storieslens_pwa_banner_dismissed", String(Date.now())); root.remove(); });
      root.append(close);
    }
    document.body.append(root);
  }

  function installationGuide() {
    document.querySelector("[data-pwa-guide]")?.remove();
    const root = document.createElement("div");
    root.className = "pwa-guide";
    root.dataset.pwaGuide = "";
    root.innerHTML = `
      <div class="pwa-guide-backdrop" data-pwa-guide-close></div>
      <section class="pwa-guide-card" role="dialog" aria-modal="true" aria-labelledby="pwa-guide-title">
        <button class="pwa-guide-close" type="button" data-pwa-guide-close aria-label="${copy.close}">×</button>
        <img src="assets/app-icon-192.png" alt="" width="72" height="72" />
        <p>STORIESLENS APP</p>
        <h2 id="pwa-guide-title">${isIos ? copy.iosTitle : isAndroid ? copy.androidTitle : copy.desktopTitle}</h2>
        <p class="pwa-guide-steps">${isIos ? copy.iosSteps : isAndroid ? copy.androidSteps : copy.desktopSteps}</p>
        <p class="pwa-guide-desktop">${copy.desktopTitle}: ${copy.desktopSteps}</p>
        <a href="install-app.html">${isChinese ? "查看完整安装说明" : "Open full installation guide"} →</a>
      </section>`;
    root.querySelectorAll("[data-pwa-guide-close]").forEach((node) => node.addEventListener("click", () => root.remove()));
    document.body.append(root);
    root.querySelector(".pwa-guide-close")?.focus();
  }

  async function install() {
    if (standalone()) return banner(copy.installed, copy.close, async () => {}, { dismissible: false });
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice.catch(() => null);
      installPrompt = null;
      return;
    }
    installationGuide();
  }

  document.querySelectorAll("[data-pwa-install]").forEach((button) => button.addEventListener("click", install));
  window.StoriesLensPWA = Object.freeze({ install, showGuide: installationGuide, isInstalled: standalone });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    const dismissedAt = Number(storageGet("storieslens_pwa_banner_dismissed") || 0);
    if (!standalone() && Date.now() - dismissedAt > 14 * 24 * 60 * 60 * 1000) banner(copy.installMessage, copy.install, install);
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    removeBanner();
    storageSet("storieslens_pwa_installed", "1");
    window.StoriesLensAnalytics?.track("pwa_installed", { platform: isIos ? "ios" : "other" });
  });

  if (isIos && !standalone() && ["/", "/index.html", "/login.html"].includes(location.pathname)) {
    const dismissedAt = Number(storageGet("storieslens_pwa_banner_dismissed") || 0);
    if (Date.now() - dismissedAt > 14 * 24 * 60 * 60 * 1000) window.setTimeout(() => banner(copy.installMessage, copy.learn, installationGuide), 1200);
  }

  navigator.serviceWorker.register("/service-worker.js").then((registration) => {
    if (registration.waiting) banner(copy.update, copy.updateButton, async () => registration.waiting.postMessage({ type: "SKIP_WAITING" }), { dismissible: false });
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) banner(copy.update, copy.updateButton, async () => worker.postMessage({ type: "SKIP_WAITING" }), { dismissible: false });
      });
    });
  }).catch(() => {});

  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
}());
