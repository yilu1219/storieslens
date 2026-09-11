(function () {
  const PROJECT_ID_KEY = "storieslens_cloud_project_id";
  const SYNC_HASH_KEY = "storieslens_cloud_snapshot_hash";
  const listeners = new Set();
  let session = null;
  let syncTimer = null;

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const type = response.headers.get("content-type") || "";
    const payload = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const error = new Error(payload?.error || payload || "StoriesLens could not complete this request.");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function readLocal(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  }

  function localSnapshot() {
    const setup = readLocal("storieslens_creator_setup") || {};
    const dna = readLocal("storieslens_story_dna") || {};
    const work = readLocal("storieslens_student_visual_write") || {};
    const image = readLocal("storieslens_free_generated_image") || readLocal("storieslens_solo_generated_image") || {};
    const video = readLocal("storieslens_free_generated_video") || readLocal("storieslens_solo_generated_video") || {};
    const hasWork = Boolean(work.draft || setup.seed || dna.inspiration || image.imageUrl || video.videoUrl);
    if (!hasWork) return null;
    const seed = dna.inspiration || setup.seed || work.draft || "My Story";
    const title = String(seed).split(/[.!?。！？\n]/)[0].trim().slice(0, 80) || "My Story";
    return {
      title,
      language: setup.storyLanguage || "en",
      mode: setup.mode === "squad" ? "squad" : "solo",
      ageGroup: setup.ageGroup || "unknown",
      sourceType: setup.origin === "work" || image.imageUrl ? "artwork" : "text",
      sourceText: setup.seed || dna.inspiration || "",
      draft: work.draft || "",
      storyDna: dna,
      coverImageUrl: image.imageUrl || "",
      scenes: work.draft ? [{ id: "scene-1", title: "First scene", text: work.draft, caption: work.draft.slice(0, 500), imageUrl: image.imageUrl || "", videoUrl: video.videoUrl || "", duration: 6, transition: "fade" }] : [],
      clientSnapshot: { setup, savedAt: new Date().toISOString() }
    };
  }

  function stableHash(value) {
    const string = JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < string.length; index += 1) {
      hash ^= string.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  async function syncLocalProject(force = false) {
    const snapshot = localSnapshot();
    if (!snapshot) return null;
    const hash = stableHash(snapshot);
    if (!force && localStorage.getItem(SYNC_HASH_KEY) === hash) return null;
    let projectId = localStorage.getItem(PROJECT_ID_KEY);
    try {
      let result;
      if (projectId) result = await api(`/api/projects/${encodeURIComponent(projectId)}`, { method: "PATCH", body: JSON.stringify(snapshot) });
      else result = await api("/api/projects", { method: "POST", body: JSON.stringify(snapshot) });
      projectId = result.project.id;
      localStorage.setItem(PROJECT_ID_KEY, projectId);
      localStorage.setItem(SYNC_HASH_KEY, hash);
      emit("synced", result.project);
      return result.project;
    } catch (error) {
      if (projectId && error.status === 404) {
        localStorage.removeItem(PROJECT_ID_KEY);
        return syncLocalProject(true);
      }
      emit("sync-error", error);
      return null;
    }
  }

  function emit(type, detail) {
    listeners.forEach((listener) => listener({ type, detail }));
    document.dispatchEvent(new CustomEvent(`storieslens:${type}`, { detail }));
  }

  async function getSession() {
    const result = await api("/api/auth/session");
    session = result;
    emit("session", result);
    return result;
  }

  function startAutoSync() {
    if (syncTimer) return;
    getSession().then(() => syncLocalProject()).catch(() => {});
    syncTimer = window.setInterval(() => syncLocalProject(), 20000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") syncLocalProject();
    });
    window.addEventListener("online", () => syncLocalProject(true));
  }

  window.StoriesLensPlatform = {
    api,
    getSession,
    syncLocalProject,
    localSnapshot,
    on(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get session() { return session; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startAutoSync);
  else startAutoSync();
}());
