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

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("This file could not be read."));
      reader.readAsDataURL(file);
    });
  }

  async function rewriteImage(file) {
    const dataUrl = await readFile(file);
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = dataUrl; });
    const max = 2200;
    const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d", { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", .88);
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
      state.textContent = "Reviewing artwork…";
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

  async function exportBook() {
    await saveNow();
    const response = await fetch("/api/export-book-docx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: project.title, premise: project.sourceText, chapters: scenes.map((scene) => ({ title: scene.title, text: scene.text, imageUrl: scene.imageUrl, writer: "StoriesLens Creator" })) }) });
    if (!response.ok) return toast((await response.json().catch(() => ({}))).error || "Book export failed.", true);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${project.title || "story"}.docx`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function orderStory() {
    await saveNow();
    try {
      const result = await platform.api("/api/orders", { method: "POST", body: JSON.stringify({ projectId: project.id, offer: "story-pass" }) });
      if (result.checkoutUrl) location.href = result.checkoutUrl;
      else location.href = result.fallbackUrl;
    } catch (error) { toast(error.message, true); }
  }

  async function load() {
    if (!projectId) {
      setNotice("Choose a story from My Stories, or create a new one first.", true);
      $("[data-save-state]").textContent = "No story selected";
      return;
    }
    try {
      const result = await platform.api(`/api/projects/${encodeURIComponent(projectId)}`);
      project = result.project;
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
  $("[data-export-book]").addEventListener("click", exportBook);
  $("[data-order-story]").addEventListener("click", orderStory);
  window.addEventListener("beforeunload", () => { if (project) saveNow(); });
  load();
}());
