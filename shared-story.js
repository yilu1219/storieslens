(function () {
  const token = new URLSearchParams(location.search).get("token") || location.pathname.split("/").filter(Boolean).pop();
  const title = document.querySelector("[data-title]");
  const draft = document.querySelector("[data-draft]");
  const scenesRoot = document.querySelector("[data-scenes]");
  const notice = document.querySelector("[data-share-notice]");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  fetch(`/api/shares/${encodeURIComponent(token || "")}`, { credentials: "same-origin" }).then(async (response) => {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "This invitation is unavailable.");
    const project = payload.project;
    document.title = `${project.title} · StoriesLens`;
    title.textContent = project.title;
    draft.textContent = project.scenes?.length ? "" : (project.draft || "This story is waiting for its next scene.");
    (project.scenes || []).forEach((scene, index) => {
      const card = element("article", "shared-scene");
      card.append(element("p", "app-kicker", `SCENE ${index + 1} · ${scene.title || "UNTITLED"}`));
      if (scene.imageUrl && !scene.imageUrl.startsWith("/api/media/")) {
        const image = element("img"); image.src = scene.imageUrl; image.alt = ""; card.append(image);
      }
      card.append(element("p", "", scene.text || scene.caption || ""));
      scenesRoot.append(card);
    });
    notice.textContent = `Invite-only · This link expires ${new Date(payload.expiresAt).toLocaleDateString()}.`;
  }).catch((error) => {
    title.textContent = "This private story is unavailable.";
    notice.className = "notice error";
    notice.textContent = error.message;
  });
}());
