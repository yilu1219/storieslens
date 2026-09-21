(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const platform = window.StoriesLensPlatform;
  const params = new URLSearchParams(location.search);
  let activeSquad = null;
  let recorder = null;
  let recorderStream = null;
  let recordedBlob = null;
  let recordingTimer = null;
  let pollTimer = null;
  let pendingVisual = null;
  let mentorState = { guided: false, activeSentence: "", suggestion: "" };

  function toast(message) {
    const element = $("[data-toast]");
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 3200);
  }

  function showNotice(message, error = false) {
    const notice = $("[data-notice]");
    notice.hidden = !message;
    notice.className = `notice${error ? " error" : ""}`;
    notice.textContent = message || "";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function approvedStoryContext(squad) {
    const approved = squad.cards.filter((card) => card.status === "approved" && card.text).slice(-8);
    const story = approved.map((card, index) => `${index + 1}. ${card.authorName}: ${card.text}`).join("\n");
    return `Shared story title: ${squad.title}\nApproved story so far:\n${story || "No approved contribution yet."}`;
  }

  function lastDraftSentence(text, language) {
    const items = window.StoriesLensMentorRevision?.buildItems?.([text], language, 12) || [];
    return items.at(-1)?.original || String(text || "").trim();
  }

  function resetMentorPanel() {
    mentorState = { guided: false, activeSentence: "", suggestion: "" };
    $("[data-yu-response]").hidden = true;
    $("[data-yu-feedback]").hidden = true;
    $("[data-yu-message]").textContent = "";
  }

  function renderMentorGuidance(result, review = false) {
    const message = result.question || result.reply || result.task || (activeSquad?.language === "zh" ? "接下来，谁会做出一个改变故事走向的选择？" : "Who could make a choice that changes what happens next?");
    $("[data-yu-message]").textContent = message;
    $("[data-yu-response]").hidden = false;
    $("[data-yu-feedback]").hidden = !review;
    if (!review) return;
    $("[data-yu-strength]").textContent = result.strength || (activeSquad.language === "zh" ? "你已经为共同故事加入了一个清楚的新想法。" : "You added a clear new idea to the shared story.");
    $("[data-yu-priority]").textContent = result.priority || (activeSquad.language === "zh" ? "这次只检查一句话是否清楚并与前文衔接。" : "For now, check that one sentence is clear and connects to the story.");
    $("[data-yu-lesson]").textContent = result.microLesson || (activeSquad.language === "zh" ? "修改时保留你的意思，只让读者更容易理解。" : "During revision, keep your meaning and make it easier for a reader to follow.");
    mentorState.suggestion = String(result.suggestion || mentorState.activeSentence).trim();
    $("[data-yu-suggestion]").value = mentorState.suggestion;
  }

  function localMentorFallback(text, review) {
    if (!review) return activeSquad.language === "zh"
      ? { question: activeSquad.cards.some((card) => card.status === "approved") ? "前一位创作者留下了什么线索？你的角色接下来会发现、选择或改变什么？" : "谁最先出现在这个故事里？他现在最想做成什么？" }
      : { question: activeSquad.cards.some((card) => card.status === "approved") ? "What clue did the last creator leave, and what will your character discover, choose, or change next?" : "Who appears first, and what do they want to do right now?" };
    const checked = window.StoriesLensMentorRevision?.basicCheck?.(mentorState.activeSentence, activeSquad.language) || { suggestion: mentorState.activeSentence, changed: false };
    return activeSquad.language === "zh"
      ? { reply: "我们先一起看最后一句。", strength: "你已经写出了一个可以继续发展的故事动作。", priority: checked.changed ? "让句末和标点更清楚。" : "保持这句话的意思，再检查它是否接住了前一位创作者。", microLesson: "共创续写要同时做到两件事：接住一个已有线索，再加入一个自己的新变化。", suggestion: checked.suggestion }
      : { reply: "Let’s look closely at your last sentence.", strength: "You gave the shared story an action it can build on.", priority: checked.changed ? "Give the sentence a clear beginning and ending." : "Keep your meaning and check that it connects to the previous creator’s part.", microLesson: "A strong co-created scene picks up one existing clue and adds one new change of your own.", suggestion: checked.suggestion };
  }

  async function askYu(review = false) {
    if (!activeSquad) return;
    const draft = $("[data-card-text]").value.trim();
    if (review && !draft) {
      showNotice(activeSquad.language === "zh" ? "请先写下或口述一段，再请羽大师点评。" : "Write or record a few words before asking Yu to review them.", true);
      return;
    }
    const button = $(review ? "[data-yu-review]" : "[data-yu-question]");
    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = activeSquad.language === "zh" ? "羽大师思考中…" : "Yu is thinking…";
    mentorState.activeSentence = review ? lastDraftSentence(draft, activeSquad.language) : "";
    try {
      const response = await platform.api("/api/writing-assistant", {
        method: "POST",
        body: JSON.stringify({
          action: review ? "check" : (draft ? "continuity" : "begin"),
          mode: "squad",
          storyLanguage: activeSquad.language,
          grade: "3",
          creatorLevel: "expression",
          genre: "narrative",
          skillFocus: review ? "sentence clarity, grammar, and shared-story continuity" : "narrative continuity",
          inspiration: activeSquad.title,
          storyDnaContext: approvedStoryContext(activeSquad),
          studentDraft: draft,
          selectedText: mentorState.activeSentence,
          teacherInstructions: "Keep the language child-friendly. Refer to the approved shared story, but never write the next plot event for the creator."
        })
      });
      renderMentorGuidance(response.result || {}, review);
    } catch (error) {
      if (![501, 503].includes(error.status)) {
        showNotice(error.message, true);
        return;
      }
      renderMentorGuidance(localMentorFallback(draft, review), review);
    } finally {
      mentorState.guided = true;
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  function speakYuGuidance() {
    const text = $("[data-yu-message]").textContent.trim();
    if (!text || !("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    const lang = activeSquad?.language === "zh" ? "zh-CN" : "en-US";
    if (window.StoriesLensNaturalVoice) {
      window.StoriesLensNaturalVoice.configureUtterance(utterance, lang);
      window.speechSynthesis.speak(utterance);
      return;
    }
    utterance.lang = lang;
    utterance.rate = activeSquad?.language === "zh" ? 0.92 : 0.93;
    utterance.pitch = activeSquad?.language === "zh" ? 0.96 : 0.97;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const prefix = activeSquad?.language === "zh" ? "zh" : "en";
    const maleNames = prefix === "zh"
      ? /yunxi|yunjian|yunyang|kangkang|yong|li-mu|male|普通话.*男/i
      : /daniel|alex|aaron|arthur|fred|reed|eddy|rocko|evan|lee|rishi|male/i;
    const languageVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
    utterance.voice = languageVoices.find((voice) => /natural|neural|online|premium|enhanced/i.test(`${voice.name} ${voice.voiceURI}`))
      || languageVoices.find((voice) => maleNames.test(`${voice.name} ${voice.voiceURI}`))
      || languageVoices[0]
      || null;
    window.speechSynthesis.speak(utterance);
  }

  function returnLoginUrl() {
    const returnTo = `${location.pathname.split("/").pop()}${location.search}`;
    return `login.html?return=${encodeURIComponent(returnTo)}`;
  }

  function readStoredJson(storage, key) {
    try { return JSON.parse(storage.getItem(key) || "null"); } catch (_error) { return null; }
  }

  async function carryStartingMaterial(squad, setup) {
    let imported = readStoredJson(sessionStorage, "storieslens_imported_work");
    if (!imported && window.StoriesLensSparkHandoff) {
      try {
        const spark = await window.StoriesLensSparkHandoff.load();
        if (spark?.dataUrl && /^data:image\/(?:webp|png|jpeg);base64,/.test(spark.dataUrl)) {
          imported = {
            name: String(spark.name || "homepage-photo.webp").slice(0, 180),
            type: String(spark.dataUrl.match(/^data:([^;,]+)/)?.[1] || "image/webp"),
            kind: "image",
            content: spark.dataUrl,
            safetyReviewed: !spark.privateOnly,
            metadataRemoved: true,
            personalPhoto: spark.personalPhoto === true
          };
        }
      } catch (_error) {
        imported = null;
      }
    }
    const importedText = imported?.kind === "text" ? String(imported.content || "").trim() : "";
    const starterText = (importedText || setup.seed || (imported?.kind === "image"
      ? (setup.storyLanguage === "zh" ? "这是我们的故事起点。" : "This is our story starting point.")
      : "")).slice(0, 6000);
    if (!starterText) return { squad, personalPhotoPending: false };

    const posted = await platform.api(`/api/squads/${encodeURIComponent(squad.id)}/cards`, {
      method: "POST",
      body: JSON.stringify({ text: starterText, yuGuided: false })
    });
    let updatedSquad = posted.squad;
    const firstCard = [...updatedSquad.cards].reverse().find((card) => card.canEdit);
    let personalPhotoPending = false;

    if (imported?.kind === "image" && imported.content && firstCard) {
      if (imported.personalPhoto === true) {
        personalPhotoPending = true;
      } else {
        const media = await platform.api("/api/media", {
          method: "POST",
          body: JSON.stringify({ squadId: squad.id, dataUrl: imported.content, metadataRemoved: imported.metadataRemoved === true })
        });
        const attached = await platform.api(`/api/squads/${encodeURIComponent(squad.id)}/cards/${encodeURIComponent(firstCard.id)}/visual`, {
          method: "POST",
          body: JSON.stringify({ imageUrl: media.media.url })
        });
        updatedSquad = attached.squad;
        sessionStorage.removeItem("storieslens_imported_work");
      }
    } else if (imported?.kind === "text") {
      sessionStorage.removeItem("storieslens_imported_work");
    }
    return { squad: updatedSquad, personalPhotoPending };
  }

  async function prepareCharacterReference(squad) {
    const reference = readStoredJson(sessionStorage, "storieslens_character_reference");
    if (!reference?.dataUrl) return null;
    let consentId = "";
    if (reference.personalPhoto === true) {
      if (!reference.consent) throw new Error("Adult photo permission is required before using this personal photo.");
      const consentResult = await platform.api(`/api/squads/${encodeURIComponent(squad.id)}/photo-consent`, {
        method: "POST",
        body: JSON.stringify(reference.consent)
      });
      consentId = consentResult.consent.id;
    }
    return { imageUrl: reference.dataUrl, personalPhoto: reference.personalPhoto === true, personalPhotoConsentId: consentId };
  }

  function prepareStyleReference() {
    const reference = readStoredJson(sessionStorage, "storieslens_style_reference");
    if (!reference?.dataUrl) return null;
    return { imageUrl: reference.dataUrl };
  }

  async function resumeSquadSetup() {
    if (params.get("resume") !== "1") return false;
    const setup = readStoredJson(localStorage, "storieslens_creator_setup");
    if (!setup || setup.mode !== "squad") return false;
    showNotice(setup.squadAction === "join" ? "Joining your private squad… · 正在加入共创小组……" : "Creating your private squad… · 正在创建共创小组……");

    if (setup.squadAction === "join") {
      const result = await platform.api("/api/squads/join", {
        method: "POST",
        body: JSON.stringify({
          code: setup.code,
          displayName: setup.displayName,
          youngCreator: setup.ageGroup === "under18",
          guardianConfirmed: setup.ageGroup !== "under18" || setup.supervisionConfirmed === true
        })
      });
      history.replaceState({}, "", `squad-board.html?id=${encodeURIComponent(result.squad.id)}`);
      activeSquad = result.squad;
      renderBoard(activeSquad);
      showNotice(result.notice || "Your request was sent to the project owner.");
      startPolling();
      return true;
    }

    const created = await platform.api("/api/squads", {
      method: "POST",
      body: JSON.stringify({
        title: setup.squadTitle,
        displayName: setup.displayName,
        language: setup.storyLanguage,
        outputType: setup.squadOutputType,
        visualStyle: setup.squadVisualStyle,
        characterRules: setup.squadCharacterRules,
        ageGroup: setup.ageGroup === "under18" ? "under18" : "mixed",
        guardianConfirmed: setup.ageGroup !== "under18" || setup.supervisionConfirmed === true
      })
    });
    history.replaceState({}, "", `squad-board.html?id=${encodeURIComponent(created.squad.id)}`);
    activeSquad = created.squad;
    renderBoard(activeSquad);
    const carried = await carryStartingMaterial(created.squad, setup);
    activeSquad = carried.squad;
    renderBoard(activeSquad);
    if (setup.squadGenerateAnchor === true) {
      try {
        const reference = await prepareCharacterReference(activeSquad);
        const styleReference = prepareStyleReference();
        pendingVisual = {
          kind: "anchor", cardId: "", card: null, imageUrl: "",
          characterReferenceImageUrls: reference?.imageUrl ? [reference.imageUrl] : [],
          styleReferenceImageUrls: styleReference?.imageUrl ? [styleReference.imageUrl] : [],
          personalPhoto: reference?.personalPhoto === true,
          personalPhotoConsentId: reference?.personalPhotoConsentId || ""
        };
        await generatePendingVisual();
      } catch (referenceError) {
        showNotice(referenceError.message, true);
      }
    }
    showNotice(carried.personalPhotoPending
      ? "Your squad and first text are ready. The personal photo remains safely on this device until adult photo consent is confirmed. · 小组和首段文字已创建；真人照片会留在本机，待完成照片授权后再保存。"
      : "Your squad and starting material are ready—nothing needs to be uploaded again. · 小组与起始素材已就绪，无需再次上传。"
    );
    startPolling();
    return true;
  }

  async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function renderMembers(squad) {
    const owner = squad.viewer?.role === "owner";
    $("[data-members]").innerHTML = squad.members.map((member) => `
      <div class="member">
        <span class="member-icon">${escapeHtml(member.displayName.slice(0, 1).toUpperCase())}</span>
        <div><strong>${escapeHtml(member.displayName)}</strong><small>${member.role === "owner" ? "Owner · 发起人" : member.status === "approved" ? "Creator · 共创者" : "Waiting · 待批准"}</small></div>
        ${owner && member.status === "pending" ? `<button class="approve" type="button" data-approve-member="${member.id}">Approve</button>` : ""}
      </div>`).join("");
    document.querySelectorAll("[data-approve-member]").forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const result = await platform.api(`/api/squads/${encodeURIComponent(squad.id)}/members/${encodeURIComponent(button.dataset.approveMember)}/approve`, { method: "POST", body: "{}" });
        activeSquad = result.squad;
        renderBoard(activeSquad);
        toast("Creator approved · 共创者已批准");
      } catch (error) {
        showNotice(error.message, true);
      } finally { button.disabled = false; }
    }));
  }

  function renderCards(squad) {
    const owner = squad.viewer?.role === "owner";
    const wall = $("[data-story-wall]");
    if (!squad.cards.length) {
      wall.innerHTML = '<article class="story-card"><header><strong>Our wall is ready.</strong></header><p>Write or record the first piece of your shared story. · 写下或录下共同故事的第一部分。</p></article>';
      return;
    }
    wall.innerHTML = squad.cards.map((card, index) => `
      <article class="story-card">
        <header><strong>${escapeHtml(card.authorName)}</strong><span>${card.status === "approved" ? `PART ${String(index + 1).padStart(2, "0")}` : "WAITING FOR APPROVAL"}</span></header>
        ${card.videoUrl ? `<video controls playsinline preload="metadata" src="${escapeHtml(card.videoUrl)}"></video>` : card.imageUrl ? `<img src="${escapeHtml(card.imageUrl)}" alt="Illustration by ${escapeHtml(card.authorName)}">` : ""}
        ${card.visualStatus === "pending" ? '<small class="visual-review">Visual waiting for owner approval · 图片/视频待发起人批准</small>' : ""}
        ${card.yuGuided ? '<span class="yu-guided-badge">Guided with Yu · 羽大师引导</span>' : ""}
        ${card.text ? `<p>${escapeHtml(card.text)}</p>` : ""}
        ${card.audioMediaId ? `<audio controls preload="metadata" src="/api/media/${encodeURIComponent(card.audioMediaId)}"></audio>` : ""}
        <div class="card-actions">
          ${card.canEdit ? `<button class="visual-action" type="button" data-generate-card-image="${card.id}">${card.imageUrl ? "Regenerate illustration · 重绘插图" : "Create my illustration · 生成我的插图"}</button>` : ""}
          ${card.canEdit && card.imageUrl ? `<button class="visual-action secondary" type="button" data-generate-card-video="${card.id}">Animate my scene · 生成我的短片</button>` : ""}
          ${owner && (card.status === "pending" || card.visualStatus === "pending") ? `<button class="approve" type="button" data-approve-card="${card.id}">Approve & share · 批准并共享</button>` : ""}
        </div>
      </article>`).join("");
    document.querySelectorAll("[data-approve-card]").forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const result = await platform.api(`/api/squads/${encodeURIComponent(squad.id)}/cards/${encodeURIComponent(button.dataset.approveCard)}/approve`, { method: "POST", body: "{}" });
        activeSquad = result.squad;
        renderBoard(activeSquad);
        toast("Contribution approved · 作品已加入共创墙");
      } catch (error) { showNotice(error.message, true); }
    }));
    document.querySelectorAll("[data-generate-card-image]").forEach((button) => button.addEventListener("click", () => generateCardImage(squad, button)));
    document.querySelectorAll("[data-generate-card-video]").forEach((button) => button.addEventListener("click", () => generateCardVideo(squad, button)));
  }

  async function attachVisual(squadId, cardId, visual) {
    return platform.api(`/api/squads/${encodeURIComponent(squadId)}/cards/${encodeURIComponent(cardId)}/visual`, {
      method: "POST",
      body: JSON.stringify(visual)
    });
  }

  function showCandidateDialog() {
    const dialog = $("[data-visual-candidate]");
    dialog.hidden = false;
    document.body.classList.add("candidate-open");
    $("[data-candidate-image]").hidden = true;
    $("[data-candidate-image]").removeAttribute("src");
    $("[data-candidate-loading]").hidden = false;
    $("[data-candidate-regenerate]").disabled = true;
    $("[data-candidate-accept]").disabled = true;
  }

  function closeCandidateDialog() {
    pendingVisual = null;
    $("[data-visual-candidate]").hidden = true;
    document.body.classList.remove("candidate-open");
  }

  function anchorPrompt(squad) {
    return `Create the canonical visual reference for a child-safe shared story titled “${squad.title}”. Establish the recurring characters and world exactly from these locked rules: ${squad.characterRules || "a warm, imaginative world with memorable recurring characters"}. Show the main characters together in a clear full-scene composition so later illustrators can preserve faces, ages, hairstyles, clothing, signature objects, proportions and palette. No written words, logos or watermarks.`;
  }

  function cardPrompt(squad, card) {
    return `Create a child-safe, polished story illustration for this shared story titled “${squad.title}”. Show this contributor's scene faithfully: ${card.text || "a magical new scene"}. Follow the locked characters, world and approved visual anchor exactly. No written words, logos or watermarks.`;
  }

  async function generatePendingVisual() {
    if (!pendingVisual || !activeSquad) return;
    const candidate = pendingVisual;
    showCandidateDialog();
    $("[data-candidate-title]").textContent = candidate.kind === "anchor" ? "Review the squad’s visual anchor." : "Review your scene illustration.";
    $("[data-candidate-note]").textContent = candidate.kind === "anchor"
      ? "Only the project owner can see this candidate. Approve it to lock the visual reference for everyone."
      : "Only you can see this candidate. Save it only when you are satisfied; contributors’ visuals still follow owner approval.";
    try {
      const result = await platform.api("/api/generate-image", {
        method: "POST",
        headers: { "Idempotency-Key": `squad-${candidate.kind}-${candidate.cardId || "anchor"}-${crypto.randomUUID()}` },
        body: JSON.stringify({
          squadId: activeSquad.id,
          cardId: candidate.cardId || "",
          squadAnchor: candidate.kind === "anchor",
          projectId: activeSquad.id,
          prompt: candidate.kind === "anchor"
            ? `${anchorPrompt(activeSquad)}${candidate.styleReferenceImageUrls?.length ? "\n\nA user-provided STYLE REFERENCE is included. Borrow only high-level palette, lighting, texture, brushwork and mood. Do not copy its characters, logos, readable text, exact composition, or any artist signature." : ""}`
            : cardPrompt(activeSquad, candidate.card),
          aspectRatio: "16:9",
          assetType: candidate.kind === "anchor" ? "SQUAD_VISUAL_ANCHOR" : "SQUAD_CONTRIBUTION_IMAGE",
          referenceImageUrls: [...(candidate.characterReferenceImageUrls || []), ...(candidate.styleReferenceImageUrls || [])],
          personalPhoto: candidate.personalPhoto === true,
          personalPhotoConsentId: candidate.personalPhotoConsentId || ""
        })
      });
      if (pendingVisual !== candidate) return;
      candidate.imageUrl = result.imageUrl || result.downloadUrl;
      if (candidate.kind === "anchor") {
        candidate.characterReferenceImageUrls = [];
        candidate.styleReferenceImageUrls = [];
        sessionStorage.removeItem("storieslens_character_reference");
        sessionStorage.removeItem("storieslens_style_reference");
      }
      const image = $("[data-candidate-image]");
      image.src = candidate.imageUrl;
      image.hidden = false;
      $("[data-candidate-loading]").hidden = true;
      $("[data-candidate-regenerate]").disabled = false;
      $("[data-candidate-accept]").disabled = false;
      showNotice("");
    } catch (error) {
      if (pendingVisual === candidate) closeCandidateDialog();
      showNotice(error.payload?.code === "SQUAD_VISUAL_ANCHOR_REQUIRED" ? "请先由小组长生成并确认首张视觉锚点，然后每位成员才能按统一人物和画风生图。" : error.status === 402 ? (candidate.kind === "anchor" ? "小组长的图片额度不足，请先补充额度。" : "你的图片额度不足。请在 My Stories 兑换个人创作包后继续；不会扣小组长的额度。") : error.message, true);
    }
  }

  function generateAnchorImage() {
    if (!activeSquad || activeSquad.viewer?.role !== "owner") return;
    pendingVisual = { kind: "anchor", cardId: "", card: null, imageUrl: "" };
    generatePendingVisual();
  }

  function generateCardImage(squad, button) {
    const card = squad.cards.find((item) => item.id === button.dataset.generateCardImage);
    if (!card) return;
    pendingVisual = { kind: "card", cardId: card.id, card, imageUrl: "" };
    generatePendingVisual();
  }

  async function acceptPendingVisual() {
    if (!pendingVisual?.imageUrl || !activeSquad) return;
    const button = $("[data-candidate-accept]");
    button.disabled = true;
    try {
      const result = pendingVisual.kind === "anchor"
        ? await platform.api(`/api/squads/${encodeURIComponent(activeSquad.id)}/visual-anchor`, { method: "POST", body: JSON.stringify({ imageUrl: pendingVisual.imageUrl }) })
        : await attachVisual(activeSquad.id, pendingVisual.cardId, { imageUrl: pendingVisual.imageUrl });
      const savedKind = pendingVisual.kind;
      activeSquad = result.squad;
      closeCandidateDialog();
      renderBoard(activeSquad);
      toast(savedKind === "anchor"
        ? "Visual anchor approved and locked · 首张设定图已确认锁定"
        : (activeSquad.viewer.role === "owner" ? "Illustration saved to the squad · 插图已保存到小组" : "Illustration submitted for owner approval · 插图已提交小组长审核"));
    } catch (error) {
      button.disabled = false;
      showNotice(error.message, true);
    }
  }

  async function generateCardVideo(squad, button) {
    const card = squad.cards.find((item) => item.id === button.dataset.generateCardVideo);
    if (!card?.imageUrl) return;
    button.disabled = true;
    button.textContent = "Yu is animating… · 羽大师制作中…";
    showNotice("Animating your contribution with your own allowance… · 正在使用你自己的视频额度生成短片…");
    try {
      const started = await platform.api("/api/generate-video", {
        method: "POST",
        headers: { "Idempotency-Key": `squad-video-${card.id}-${crypto.randomUUID()}` },
        body: JSON.stringify({
          squadId: squad.id,
          cardId: card.id,
          projectId: squad.id,
          prompt: `Animate this child-safe shared-story scene with gentle cinematic movement. Preserve the characters and artwork. Scene: ${card.text || squad.title}`,
          imageUrl: card.imageUrl,
          duration: 5,
          resolution: "720p",
          aspectRatio: "16:9"
        })
      });
      let job = started;
      for (let attempt = 0; attempt < 40 && !job.videoUrl; attempt += 1) {
        if (["failed", "cancelled"].includes(job.status)) throw new Error(job.error || "Video generation failed.");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        job = await platform.api(job.pollUrl || `/api/video-jobs/${encodeURIComponent(started.jobId)}`);
      }
      if (!job.videoUrl) throw new Error("The video is still rendering. Please try again in a moment.");
      const attached = await attachVisual(squad.id, card.id, { videoUrl: job.videoUrl });
      activeSquad = attached.squad;
      renderBoard(activeSquad);
      showNotice("");
      toast(activeSquad.viewer.role === "owner" ? "Short film shared with the squad · 短片已共享" : "Short film ready; waiting for owner approval · 短片已完成，等待发起人批准");
    } catch (error) {
      showNotice(error.status === 402 ? "你的视频额度不足。请在 My Stories 补充个人视频额度后继续；不会扣发起人的额度。" : error.message, true);
      button.disabled = false;
      button.textContent = "Animate my scene · 生成我的短片";
    }
  }

  function renderBoard(squad) {
    $("[data-setup]").hidden = true;
    $("[data-board]").hidden = false;
    $("[data-squad-title]").textContent = squad.title;
    const styleNames = { "storybook-watercolor": "Storybook watercolor · 绘本水彩", "ink-watercolor": "Ink watercolor · 水墨水彩", cinematic: "Cinematic animation · 电影动画", comic: "Graphic novel · 连环画", "block-world": "Block World · 方块世界" };
    $("[data-squad-meta]").textContent = `${squad.language === "zh" ? "中文创作" : "English creation"} · ${squad.outputType === "film" ? "Story film · 故事电影" : "Illustrated book · 绘本"} · ${styleNames[squad.visualStyle] || squad.visualStyle} · Style locked by owner · 风格由小组长锁定 · ${squad.visualAnchorReady ? "Visual anchor ready · 视觉锚点已完成" : "Waiting for owner’s first visual anchor · 等待首张视觉锚点"}`;
    const owner = squad.viewer?.role === "owner";
    const approved = squad.viewer?.status === "approved";
    const assembled = Boolean(squad.assembledProjectId);
    $("[data-owner-actions]").hidden = !owner;
    $("[data-assemble]").hidden = !owner || assembled;
    const openProject = $("[data-open-project]");
    openProject.hidden = !owner || !assembled;
    if (assembled) openProject.href = `movie-studio.html?project=${encodeURIComponent(squad.assembledProjectId)}`;
    document.querySelectorAll("[data-squad-export]").forEach((button) => { button.hidden = !owner || !assembled; });
    $("[data-squad-render]").hidden = !owner || !assembled;
    $("[data-code-banner]").hidden = !owner;
    $("[data-story-code]").textContent = squad.joinCode || "";
    $("[data-pending-banner]").hidden = approved;
    $("[data-composer]").hidden = !approved;
    const anchorStudio = $("[data-anchor-studio]");
    anchorStudio.hidden = !approved;
    $("[data-anchor-rules]").textContent = squad.characterRules || (squad.language === "zh" ? "尚未填写人物规则；小组长仍可先生成并确认视觉锚点。" : "No character rules were entered; the owner can still generate and approve a visual anchor.");
    $("[data-anchor-style]").textContent = styleNames[squad.visualStyle] || squad.visualStyle;
    $("[data-generate-anchor]").hidden = !owner;
    $("[data-generate-anchor]").textContent = squad.visualAnchorReady ? "Regenerate anchor · 重新生成设定图" : "Generate first visual anchor · 生成首张设定图";
    const anchorImage = $("[data-anchor-image]");
    anchorImage.hidden = !squad.visualAnchorImageUrl;
    if (squad.visualAnchorImageUrl) anchorImage.src = squad.visualAnchorImageUrl;
    else anchorImage.removeAttribute("src");
    $("[data-anchor-empty]").hidden = Boolean(squad.visualAnchorImageUrl);
    $("[data-anchor-approved]").hidden = !squad.visualAnchorReady;
    renderMembers(squad);
    renderCards(squad);
  }

  async function loadSquad(id, quiet = false) {
    try {
      const result = await platform.api(`/api/squads/${encodeURIComponent(id)}`);
      activeSquad = result.squad;
      renderBoard(activeSquad);
    } catch (error) {
      if (!quiet) showNotice(error.message, true);
    }
  }

  async function loadExisting() {
    const result = await platform.api("/api/squads");
    const card = $("[data-existing-card]");
    card.hidden = !result.squads.length;
    $("[data-existing-list]").innerHTML = result.squads.map((squad) => `<a href="squad-board.html?id=${encodeURIComponent(squad.id)}"><strong>${escapeHtml(squad.title)}</strong><small>${squad.viewer.status === "pending" ? "Waiting for approval · 待批准" : `${squad.cards.length} contributions · ${squad.cards.length} 份创作`}</small></a>`).join("");
  }

  $("[data-create-young]").addEventListener("change", (event) => { $("[data-create-guardian-row]").hidden = !event.target.checked; });
  $("[data-join-young]").addEventListener("change", (event) => { $("[data-join-guardian-row]").hidden = !event.target.checked; });
  $("[data-create-language]").addEventListener("change", (event) => {
    $("[data-create-style]").value = event.target.value === "zh" ? "ink-watercolor" : "storybook-watercolor";
  });
  $("[data-yu-question]").addEventListener("click", () => askYu(false));
  $("[data-yu-review]").addEventListener("click", () => askYu(true));
  $("[data-yu-read]").addEventListener("click", speakYuGuidance);
  $("[data-generate-anchor]").addEventListener("click", generateAnchorImage);
  $("[data-candidate-regenerate]").addEventListener("click", generatePendingVisual);
  $("[data-candidate-accept]").addEventListener("click", acceptPendingVisual);
  $("[data-candidate-close]").addEventListener("click", closeCandidateDialog);
  $("[data-yu-accept]").addEventListener("click", () => {
    const draftField = $("[data-card-text]");
    const suggestion = $("[data-yu-suggestion]").value.trim();
    if (mentorState.activeSentence && suggestion) {
      const index = draftField.value.lastIndexOf(mentorState.activeSentence);
      draftField.value = index >= 0
        ? `${draftField.value.slice(0, index)}${suggestion}${draftField.value.slice(index + mentorState.activeSentence.length)}`
        : draftField.value;
    }
    mentorState.guided = true;
    $("[data-yu-feedback]").hidden = true;
    toast(activeSquad?.language === "zh" ? "已采用你确认的最小修改" : "Your approved revision is now in the draft");
  });
  $("[data-yu-keep]").addEventListener("click", () => {
    mentorState.guided = true;
    $("[data-yu-feedback]").hidden = true;
    toast(activeSquad?.language === "zh" ? "保留你的原文" : "Your original words are staying");
  });

  $("[data-create-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const young = $("[data-create-young]").checked;
    const generateAnchorAfterCreation = Boolean(event.submitter?.matches("[data-create-and-generate]"));
    try {
      const result = await platform.api("/api/squads", { method: "POST", body: JSON.stringify({
        title: $("[data-create-title]").value,
        displayName: $("[data-create-name]").value,
        language: $("[data-create-language]").value,
        outputType: $("[data-create-output]").value,
        visualStyle: $("[data-create-style]").value,
        characterRules: $("[data-create-character-rules]").value.trim(),
        ageGroup: young ? "under18" : "mixed",
        guardianConfirmed: !young || $("[data-create-guardian]").checked
      }) });
      history.replaceState({}, "", `squad-board.html?id=${encodeURIComponent(result.squad.id)}`);
      activeSquad = result.squad;
      renderBoard(activeSquad);
      toast("Private squad created · 私密共创小组已创建");
      startPolling();
      if (generateAnchorAfterCreation) generateAnchorImage();
    } catch (error) { showNotice(error.message, true); }
  });

  $("[data-join-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const young = $("[data-join-young]").checked;
    try {
      const result = await platform.api("/api/squads/join", { method: "POST", body: JSON.stringify({
        code: $("[data-join-code]").value,
        displayName: $("[data-join-name]").value,
        youngCreator: young,
        guardianConfirmed: !young || $("[data-join-guardian]").checked
      }) });
      history.replaceState({}, "", `squad-board.html?id=${encodeURIComponent(result.squad.id)}`);
      activeSquad = result.squad;
      renderBoard(activeSquad);
      toast(result.notice);
      startPolling();
    } catch (error) { showNotice(error.message, true); }
  });

  $("[data-copy-invite]").addEventListener("click", async () => {
    if (!activeSquad?.joinCode) return;
    const link = `${location.origin}${location.pathname}?code=${encodeURIComponent(activeSquad.joinCode)}`;
    await navigator.clipboard.writeText(`${activeSquad.title}\nStory Code: ${activeSquad.joinCode}\n${link}`);
    toast("Private invitation copied · 私密邀请已复制");
  });

  $("[data-record]").addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      showNotice("This browser does not support voice recording. You can still type your contribution.", true);
      return;
    }
    try {
      recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      recorder = new MediaRecorder(recorderStream);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        recordedBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const preview = $("[data-record-preview]");
        preview.src = URL.createObjectURL(recordedBlob);
        preview.hidden = false;
        $("[data-record-status]").textContent = "Voice ready · 录音已准备好";
        recorderStream?.getTracks().forEach((track) => track.stop());
        clearTimeout(recordingTimer);
      };
      recorder.start();
      $("[data-record]").disabled = true;
      $("[data-stop]").disabled = false;
      $("[data-record-status]").textContent = "Recording… up to 90 seconds · 正在录音，最长90秒";
      recordingTimer = setTimeout(() => $("[data-stop]").click(), 90_000);
    } catch (error) { showNotice(error.name === "NotAllowedError" ? "Please allow microphone access, or type your contribution." : error.message, true); }
  });

  $("[data-stop]").addEventListener("click", () => {
    if (recorder?.state === "recording") recorder.stop();
    $("[data-record]").disabled = false;
    $("[data-stop]").disabled = true;
  });

  $("[data-composer]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = $("[data-card-text]").value.trim();
    if (!text && !recordedBlob) {
      showNotice("Write something or record your voice first. · 请先写下内容或录音。", true);
      return;
    }
    const submit = event.submitter;
    submit.disabled = true;
    try {
      let audioMediaId = "";
      if (recordedBlob) {
        const media = await platform.api("/api/media", { method: "POST", body: JSON.stringify({ squadId: activeSquad.id, dataUrl: await blobToDataUrl(recordedBlob) }) });
        audioMediaId = media.media.id;
      }
      const result = await platform.api(`/api/squads/${encodeURIComponent(activeSquad.id)}/cards`, { method: "POST", body: JSON.stringify({ text, audioMediaId, yuGuided: mentorState.guided }) });
      activeSquad = result.squad;
      $("[data-card-text]").value = "";
      recordedBlob = null;
      $("[data-record-preview]").hidden = true;
      $("[data-record-preview]").removeAttribute("src");
      $("[data-record-status]").textContent = "Optional: add your own narration.";
      resetMentorPanel();
      renderBoard(activeSquad);
      toast(activeSquad.viewer.role === "owner" ? "Posted to the wall · 已发布" : "Sent for owner approval · 已提交审核");
    } catch (error) { showNotice(error.message, true); }
    finally { submit.disabled = false; }
  });

  async function exportSquadBook(format) {
    if (!activeSquad?.assembledProjectId) return;
    const response = await fetch(`/api/projects/${encodeURIComponent(activeSquad.assembledProjectId)}/export/${format}`, { credentials: "same-origin" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      showNotice(payload.error || "Book export failed.", true);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeSquad.title || "shared-story"}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function pollFinalMovie(jobId, output, attempt = 0) {
    if (attempt > 120) {
      output.textContent = "The movie is still assembling. You can return to this private squad later. · 电影仍在合成，可稍后返回查看。";
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const result = await platform.api(`/api/render-jobs/${encodeURIComponent(jobId)}`);
    const job = result.renderJob;
    if (job.status === "completed" && job.outputUrl) {
      output.replaceChildren(document.createTextNode("Final movie ready · 完整电影已完成 · "));
      const link = document.createElement("a");
      link.href = job.outputUrl;
      link.textContent = "Download MP4 · 下载";
      link.setAttribute("download", "");
      output.append(link);
      return;
    }
    if (job.status === "failed") throw new Error(job.error || "Final movie assembly failed.");
    output.textContent = `Joining approved Seedance clips, images and voices… ${Number(job.progress || 0)}% · 正在合成…`;
    return pollFinalMovie(jobId, output, attempt + 1);
  }

  async function renderFinalMovie() {
    if (!activeSquad?.assembledProjectId) return;
    const button = $("[data-squad-render]");
    const output = $("[data-final-output]");
    button.disabled = true;
    output.hidden = false;
    output.textContent = "Preparing private final movie… · 正在准备完整电影…";
    try {
      const result = await platform.api("/api/render-jobs", { method: "POST", body: JSON.stringify({ projectId: activeSquad.assembledProjectId, aspectRatio: "16:9", resolution: "720p" }) });
      if (result.renderJob.status === "awaiting_media") throw new Error(result.notice);
      await pollFinalMovie(result.renderJob.id, output);
    } catch (error) {
      output.textContent = error.message;
      output.className = "notice error";
    } finally { button.disabled = false; }
  }

  document.querySelectorAll("[data-squad-export]").forEach((button) => button.addEventListener("click", () => exportSquadBook(button.dataset.squadExport)));
  $("[data-squad-render]").addEventListener("click", renderFinalMovie);

  $("[data-assemble]").addEventListener("click", async () => {
    if (!activeSquad || !confirm("Assemble all approved contributions into one private project? · 把所有已批准内容汇编为一个作品吗？")) return;
    const button = $("[data-assemble]");
    button.disabled = true;
    try {
      await platform.api(`/api/squads/${encodeURIComponent(activeSquad.id)}/assemble`, { method: "POST", headers: { "Idempotency-Key": `assemble-${activeSquad.id}` }, body: "{}" });
      await loadSquad(activeSquad.id);
      showNotice("Your shared book/film project is ready. Choose Word, PDF, final movie, printing or delivery above. · 共创作品已汇编完成，请在上方选择导出与制作方式。");
    } catch (error) {
      showNotice(error.status === 402 ? "发起人需要至少 1 个故事项目额度。请先在 My Stories 兑换个人故事包或共创包。" : error.message, true);
      button.disabled = false;
    }
  });

  function startPolling() {
    clearInterval(pollTimer);
    if (!activeSquad?.id) return;
    pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") loadSquad(activeSquad.id, true);
    }, 4000);
  }

  async function init() {
    $("[data-login-link]").href = returnLoginUrl();
    const session = await platform.getSession();
    if (!session.authenticated) {
      $("[data-auth-gate]").hidden = false;
      return;
    }
    if (await resumeSquadSetup()) return;
    $("[data-setup]").hidden = false;
    $("[data-create-name]").value = params.get("name") || session.user.displayName || "";
    $("[data-join-name]").value = params.get("name") || session.user.displayName || "";
    $("[data-create-language]").value = params.get("storyLang") === "zh" ? "zh" : "en";
    $("[data-create-style]").value = $("[data-create-language]").value === "zh" ? "ink-watercolor" : "storybook-watercolor";
    if (params.get("code")) $("[data-join-code]").value = params.get("code");
    await loadExisting();
    if (params.get("id")) {
      await loadSquad(params.get("id"));
      startPolling();
    }
  }

  init().catch((error) => showNotice(error.message, true));
})();
