(function () {
  const platform = window.StoriesLensPlatform;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const list = $("[data-scene-list]");
  const toastNode = $("[data-toast]");
  const projectId = new URLSearchParams(location.search).get("project");
  let project = null;
  let scenes = [];
  let saveTimer = null;
  let previewTimer = null;
  let previewIndex = 0;
  let activeRecorder = null;

  function setProjectActionsDisabled(disabled) {
    document.querySelectorAll("[data-needs-project]").forEach((control) => { control.disabled = disabled; });
  }

  function toast(message, isError = false) {
    toastNode.textContent = message;
    toastNode.classList.toggle("error", isError);
    toastNode.classList.add("show");
    setTimeout(() => toastNode.classList.remove("show"), 3500);
  }

  function setNotice(message, isError = false) {
    const notice = $("[data-studio-notice]");
    notice.hidden = !message;
    notice.className = `notice${isError ? " error" : ""}`;
    notice.textContent = message;
  }

  async function rewriteImage(file) {
    if (!window.StoriesLensArtworkSafety?.isSupportedImage(file)) throw new Error("Choose a JPG, PNG, WEBP, HEIC or HEIF image.");
    if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image under 15 MB.");
    const sanitized = await window.StoriesLensArtworkSafety.removeMetadata(file);
    return sanitized.dataUrl;
  }

  async function uploadMedia(dataUrl, metadataRemoved = false) {
    const result = await platform.api("/api/media", { method: "POST", body: JSON.stringify({ projectId: project.id, dataUrl, metadataRemoved, purpose: metadataRemoved ? "artwork" : "narration" }) });
    return result.media;
  }

  function cleanScenesFromDom() {
    return Array.from(list.children).map((card, index) => ({
      id: card.dataset.sceneId || `scene-${index + 1}`,
      title: $("[data-scene-title]", card).value.trim() || `Scene ${index + 1}`,
      text: $("[data-scene-text]", card).value.trim(),
      caption: $("[data-scene-text]", card).value.trim().slice(0, 600),
      imageUrl: card.dataset.imageUrl || "",
      videoUrl: card.dataset.videoUrl || "",
      narrationMediaId: card.dataset.narrationMediaId || "",
      duration: Math.max(2, Math.min(12, Number($("[data-scene-duration]", card).value) || 5)),
      transition: "fade"
    }));
  }

  function renumber() {
    Array.from(list.children).forEach((card, index) => {
      $("[data-scene-number]", card).textContent = `Scene ${index + 1}`;
      $("[data-move-up]", card).disabled = index === 0;
      $("[data-move-down]", card).disabled = index === list.children.length - 1;
    });
  }

  function renderMediaPreview(card) {
    const preview = $("[data-scene-preview]", card);
    preview.replaceChildren();
    if (card.dataset.videoUrl) {
      const video = document.createElement("video");
      video.src = card.dataset.videoUrl; video.controls = true; video.playsInline = true; preview.append(video);
    } else if (card.dataset.imageUrl) {
      const image = document.createElement("img"); image.src = card.dataset.imageUrl; image.alt = "Scene artwork"; preview.append(image);
    } else preview.append(Object.assign(document.createElement("span"), { textContent: "No artwork yet" }));
  }

  function createSceneCard(scene = {}) {
    const card = $("[data-scene-template]").content.firstElementChild.cloneNode(true);
    card.dataset.sceneId = scene.id || `scene-${Date.now()}`;
    card.dataset.imageUrl = scene.imageUrl || "";
    card.dataset.videoUrl = scene.videoUrl || "";
    card.dataset.narrationMediaId = scene.narrationMediaId || "";
    $("[data-scene-title]", card).value = scene.title || "";
    $("[data-scene-text]", card).value = scene.text || scene.caption || "";
    $("[data-scene-duration]", card).value = scene.duration || 5;
    $("[data-voice-state]", card).textContent = scene.narrationMediaId ? "Private recording saved" : "No recording";
    renderMediaPreview(card);
    card.addEventListener("input", scheduleSave);
    $("[data-move-up]", card).addEventListener("click", () => { if (card.previousElementSibling) list.insertBefore(card, card.previousElementSibling); renumber(); scheduleSave(); });
    $("[data-move-down]", card).addEventListener("click", () => { if (card.nextElementSibling) list.insertBefore(card.nextElementSibling, card); renumber(); scheduleSave(); });
    $("[data-delete-scene]", card).addEventListener("click", () => { if (list.children.length === 1) return toast("A story needs at least one scene.", true); card.remove(); renumber(); scheduleSave(); });
    $("[data-scene-image]", card).addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const state = $("[data-voice-state]", card);
      state.textContent = /\.(heic|heif)$/i.test(file.name) ? "Converting HEIC privately on this device…" : "Reviewing artwork…";
      try {
        const rewritten = await rewriteImage(file);
        const media = await uploadMedia(rewritten, true);
        card.dataset.imageUrl = media.url;
        renderMediaPreview(card);
        state.textContent = "Artwork reviewed and saved privately";
        scheduleSave();
      } catch (error) { state.textContent = "Artwork not saved"; toast(error.message, true); }
    });
    $("[data-record]", card).addEventListener("click", () => toggleRecording(card));
    $("[data-play-voice]", card).addEventListener("click", () => playNarration(card));
    return card;
  }

  async function toggleRecording(card) {
    const button = $("[data-record]", card);
    const state = $("[data-voice-state]", card);
    if (activeRecorder) {
      activeRecorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Voice recording is not supported in this browser.", true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        activeRecorder = null;
        button.textContent = "● Record voice";
        button.classList.remove("recording");
        state.textContent = "Saving private recording…";
        try {
          const blob = new Blob(chunks, { type: (recorder.mimeType || "audio/webm").split(";")[0] });
          const dataUrl = await readFile(blob);
          const media = await uploadMedia(dataUrl, false);
          card.dataset.narrationMediaId = media.id;
          state.textContent = "Private recording saved";
          scheduleSave();
        } catch (error) { state.textContent = "Recording not saved"; toast(error.message, true); }
      };
      recorder.start(); activeRecorder = recorder;
      button.textContent = "■ Stop recording";
      button.classList.add("recording");
      state.textContent = "Recording on this device…";
    } catch { toast("Microphone access was not granted.", true); }
  }

  function playNarration(card) {
    if (card.dataset.narrationMediaId) {
      new Audio(`/api/media/${encodeURIComponent(card.dataset.narrationMediaId)}`).play().catch(() => toast("The recording could not play.", true));
      return;
    }
    const text = $("[data-scene-text]", card).value.trim();
    if (!text || !window.speechSynthesis) return toast("Add a caption or record your voice first.", true);
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = $("[data-voice-language]").value;
    speechSynthesis.speak(utterance);
  }

  async function saveNow() {
    if (!project) return;
    $("[data-save-state]").textContent = "Saving…";
    scenes = cleanScenesFromDom();
    try {
      const result = await platform.api(`/api/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({
        title: $("[data-project-title]").value.trim() || "My Story",
        language: $("[data-project-language]").value,
        visibility: $("[data-project-visibility]").value,
        draft: $("[data-project-draft]").value.trim(),
        scenes
      }) });
      project = result.project;
      $("[data-save-state]").textContent = "All changes saved";
    } catch (error) { $("[data-save-state]").textContent = "Not saved"; toast(error.message, true); }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    $("[data-save-state]").textContent = "Unsaved changes";
    saveTimer = setTimeout(saveNow, 700);
  }

  function displayScene(index) {
    const current = cleanScenesFromDom()[index];
    if (!current) return stopPreview();
    const stage = $("[data-film-stage]");
    stage.replaceChildren();
    if (current.videoUrl) {
      const video = document.createElement("video"); video.src = current.videoUrl; video.autoplay = true; video.muted = true; video.playsInline = true; stage.append(video);
    } else if (current.imageUrl) {
      const image = document.createElement("img"); image.src = current.imageUrl; image.alt = ""; stage.append(image);
    } else stage.append(Object.assign(document.createElement("p"), { textContent: current.title }));
    const caption = document.createElement("p"); caption.className = "film-caption"; caption.textContent = current.caption || current.text; stage.append(caption);
    $("[data-film-time]").textContent = `${index + 1} / ${list.children.length}`;
    const card = list.children[index];
    if (card) playNarration(card);
    previewTimer = setTimeout(() => { previewIndex += 1; if (previewIndex >= list.children.length) stopPreview(); else displayScene(previewIndex); }, current.duration * 1000);
  }

  function stopPreview() {
    clearTimeout(previewTimer); previewTimer = null; previewIndex = 0;
    speechSynthesis?.cancel();
    $("[data-film-time]").textContent = "0:00";
  }

  async function createRender() {
    if (!project) return toast("Choose a saved story before creating a movie.", true);
    await saveNow();
    const notice = $("[data-render-notice]");
    try {
      const result = await platform.api("/api/render-jobs", { method: "POST", body: JSON.stringify({ projectId: project.id, aspectRatio: $("[data-aspect]").value, resolution: $("[data-resolution]").value }) });
      notice.hidden = false;
      notice.className = `notice${result.renderJob.status === "awaiting_media" ? " error" : " success"}`;
      notice.textContent = result.notice;
      if (result.renderJob.status === "rendering") pollRender(result.renderJob.id, notice);
    } catch (error) { notice.hidden = false; notice.className = "notice error"; notice.textContent = error.message; }
  }

  async function pollRender(jobId, notice, attempt = 0) {
    if (attempt > 120) {
      notice.className = "notice";
      notice.textContent = "The movie is still rendering. It will remain in your private library; you can safely return later.";
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const result = await platform.api(`/api/render-jobs/${encodeURIComponent(jobId)}`);
      const job = result.renderJob;
      if (job.status === "completed" && job.outputUrl) {
        notice.replaceChildren(document.createTextNode("Your private movie is ready. "));
        const link = document.createElement("a"); link.href = job.outputUrl; link.textContent = "Download MP4"; link.setAttribute("download", ""); notice.append(link);
        return;
      }
      if (job.status === "failed") {
        notice.className = "notice error";
        notice.textContent = `Movie rendering stopped: ${job.error || "please try again."}`;
        return;
      }
      notice.textContent = `Rendering your private movie… ${Math.min(99, 8 + attempt * 2)}%`;
      pollRender(jobId, notice, attempt + 1);
    } catch (error) { notice.className = "notice error"; notice.textContent = error.message; }
  }

  async function exportBook(format) {
    if (!project) return toast("Choose a saved story before exporting a book.", true);
    await saveNow();
    const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/export/${format}`, { credentials: "same-origin" });
    if (!response.ok) return toast((await response.json().catch(() => ({}))).error || "Book export failed.", true);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${project.title || "story"}.${format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function orderStory() {
    if (!project) return toast("Choose a saved story before requesting printing.", true);
    const dialog = $("[data-print-dialog]");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  async function submitPrintQuote(event) {
    event.preventDefault();
    await saveNow();
    const notice = $("[data-print-notice]");
    const submit = event.submitter;
    submit.disabled = true;
    try {
      const result = await platform.api("/api/print-orders", { method: "POST", body: JSON.stringify({
        projectId: project.id,
        binding: $("[data-print-binding]").value,
        color: $("[data-print-color]").value,
        quantity: Number($("[data-print-quantity]").value),
        shippingRegion: $("[data-print-region]").value,
        countryCode: $("[data-print-country]").value,
        city: $("[data-print-city]").value,
        postalCode: $("[data-print-postal]").value,
        notes: $("[data-print-notes]").value
      }) });
      notice.hidden = false;
      notice.className = "notice success";
      notice.textContent = result.notice;
      setTimeout(() => $("[data-print-dialog]").close(), 1800);
    } catch (error) {
      notice.hidden = false;
      notice.className = "notice error";
      notice.textContent = error.message;
    } finally { submit.disabled = false; }
  }

  async function load() {
    if (!projectId) {
      setProjectActionsDisabled(true);
      setNotice("Choose a story from My Stories, or create a new one first.", true);
      $("[data-save-state]").textContent = "No story selected";
      return;
    }
    try {
      const result = await platform.api(`/api/projects/${encodeURIComponent(projectId)}`);
      project = result.project;
      setProjectActionsDisabled(false);
      $("[data-project-title]").value = project.title;
      $("[data-project-language]").value = project.language;
      $("[data-project-visibility]").value = project.visibility;
      $("[data-project-draft]").value = project.draft || project.sourceText || "";
      scenes = project.scenes?.length ? project.scenes : [{ id: "scene-1", title: "First scene", text: project.draft || project.sourceText || "", duration: 6 }];
      scenes.forEach((scene) => list.append(createSceneCard(scene)));
      renumber();
      $("[data-save-state]").textContent = "All changes saved";
      displayScene(0); setTimeout(stopPreview, 60);
    } catch (error) { setNotice(error.message, true); $("[data-save-state]").textContent = "Story unavailable"; }
  }

  $("[data-project-form]").addEventListener("input", scheduleSave);
  $("[data-add-scene]").addEventListener("click", () => { if (list.children.length >= 24) return toast("A movie can contain up to 24 scenes.", true); list.append(createSceneCard()); renumber(); scheduleSave(); list.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" }); });
  $("[data-play]").addEventListener("click", () => { stopPreview(); previewIndex = 0; displayScene(0); });
  $("[data-stop]").addEventListener("click", stopPreview);
  $("[data-create-render]").addEventListener("click", createRender);
  document.querySelectorAll("[data-export-book]").forEach((button) => button.addEventListener("click", () => exportBook(button.dataset.exportBook)));
  $("[data-order-story]").addEventListener("click", orderStory);
  $("[data-print-cancel]").addEventListener("click", () => $("[data-print-dialog]").close());
  $("[data-print-form]").addEventListener("submit", submitPrintQuote);
  $("[data-print-region]").addEventListener("change", (event) => {
    if (event.target.value === "cn") $("[data-print-country]").value = "CN";
    else if (event.target.value === "us") $("[data-print-country]").value = "US";
  });
  window.addEventListener("beforeunload", () => { if (project) saveNow(); });
  load();
}());
