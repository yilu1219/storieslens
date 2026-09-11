(function () {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  let installPrompt = null;

  function banner(message, buttonText, action) {
    const previous = document.querySelector("[data-pwa-banner]");
    if (previous) previous.remove();
    const root = document.createElement("div");
    root.className = "pwa-install-banner";
    root.dataset.pwaBanner = "";
    const copy = document.createElement("span"); copy.textContent = message;
    const button = document.createElement("button"); button.type = "button"; button.textContent = buttonText;
    button.addEventListener("click", async () => { await action(); root.remove(); });
    root.append(copy, button); document.body.append(root);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); installPrompt = event;
    banner("Install StoriesLens for a full-screen creator studio and quicker return to your drafts.", "Install", async () => {
      await installPrompt.prompt(); installPrompt = null;
    });
  });

  navigator.serviceWorker.register("/service-worker.js").then((registration) => {
    if (registration.waiting) banner("A new StoriesLens version is ready.", "Update", async () => registration.waiting.postMessage({ type: "SKIP_WAITING" }));
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) banner("A new StoriesLens version is ready.", "Update", async () => worker.postMessage({ type: "SKIP_WAITING" }));
      });
    });
  }).catch(() => {});

  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
}());
