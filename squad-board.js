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
  let pendingCastReference = null;
  let mentorState = { guided: false, activeSentence: "", suggestion: "" };
  const STORY_BEATS = [
    { enTitle: "Meet the heroes", zhTitle: "认识主角", enPrompt: "Who is here, where are they, and what do they want?", zhPrompt: "谁在这里？他们在哪里？现在最想做什么？" },
    { enTitle: "Trouble arrives", zhTitle: "困难出现", enPrompt: "What is hard right now? Show the problem the heroes must face.", zhPrompt: "他们现在遇到了什么困难？让大家看见这个问题。" },
    { enTitle: "The first try", zhTitle: "第一次尝试", enPrompt: "What do they try first, and what happens because of it?", zhPrompt: "他们先试了什么办法？接着发生了什么？" },
    { enTitle: "A bigger surprise", zhTitle: "更大的变化", enPrompt: "What new clue, surprise, or change makes the story more exciting?", zhPrompt: "出现了什么新线索、惊喜或变化，让故事更精彩？" },
    { enTitle: "The brave choice", zhTitle: "关键选择", enPrompt: "What important choice do the heroes make together?", zhPrompt: "主角们一起做出了什么重要选择？" },
    { enTitle: "The ending", zhTitle: "故事结局", enPrompt: "How does the adventure end, and how have the heroes changed?", zhPrompt: "冒险怎样结束？主角有什么改变？" }
  ];

  const STATIC_ZH = {
    "English": "英语",
    "Every voice becomes": "每一种声音汇聚成",
    "one story world.": "同一个故事世界。",
    "Like a private visual Padlet for stories: invited creators can write, record, illustrate or animate their own part, see approved contributions, and build one credited book or film together.": "像一面私密的故事共创墙：受邀创作者可以写作、录音、绘图或制作动画，看见已通过的作品，并共同完成一本署名图书或一部电影。",
    "2–6 trusted creators": "2–6 位受信任的创作者",
    "Each creator uses their own allowance": "每位创作者使用自己的额度",
    "Owner approval": "发起人审核",
    "Every contribution credited": "每份创作都会署名",
    "ADULT-OWNED PRIVATE ACCOUNT": "由成年人管理的私密账户",
    "Sign in before entering a Story Squad.": "登录后进入故事共创小组。",
    "A parent or adult owns the account and approves participation for young creators.": "账户由家长或成年人管理，并为未成年创作者确认参与许可。",
    "Create a private squad": "创建私密共创小组",
    "Start one shared wall and choose whether the final outcome is a book or a film.": "创建一面共创墙，并选择最终完成图书或电影。",
    "Answer in short phrases. Yu will use this one shared plan to keep every creator, character and scene in the same story.": "用短语回答即可。羽大师会用这份共同蓝图，让所有创作者、人物和场景始终属于同一个故事。",
    "See your shared world before inviting everyone.": "邀请大家前，先看看共同的故事世界。",
    "Create the private squad and generate its first reference image in one step. Each attempt uses one image allowance from the project owner.": "一步创建私密小组并生成首张参考图。每次尝试使用发起人的一个图片额度。",
    "Join with a Story Code": "使用故事码加入",
    "Enter the private code sent by the project owner. Your request is visible only after sign-in.": "输入发起人发送的私密故事码。登录后才能看到加入申请。",
    "Your private squads": "你的私密共创小组",
    "PRIVATE · INVITE ONLY": "私密 · 仅限邀请",
    "Send only to family, friends, classmates or invited workshop members.": "只发送给家人、朋友、同学或受邀工作坊成员。",
    "Build our cast, then make one movie poster together.": "组建我们的角色阵容，再一起制作电影海报。",
    "Each creator adds one private photo or drawing. Yu keeps every identity separate and turns the approved cast into the project’s shared visual reference.": "每位创作者添加一张私密照片或画作。羽大师会分开保留每个人物身份，并把通过审核的角色变成项目共同视觉参考。",
    "Upload a photo or drawing, then describe the character you will play.": "上传照片或画作，再描述你要扮演的角色。",
    "JPG, PNG, WEBP, HEIC or HEIF · Metadata will be removed before upload.": "支持 JPG、PNG、WEBP、HEIC 或 HEIF；上传前会移除照片信息。",
    "This private reference is used only for this Story Squad project and is never published automatically.": "这份私密参考图只用于本次共创项目，绝不会自动公开。",
    "I am the person pictured, or their parent/legal guardian, and permit this private story use.": "我是照片中的本人或其家长／法定监护人，并同意用于本次私密故事创作。",
    "I understand that a processed copy is sent to the selected regional safety and AI service.": "我了解处理后的副本会发送至所选地区的安全与 AI 服务。",
    "Adult name": "成年人姓名",
    "Relationship": "与照片人物的关系",
    "One story. Six small turns. Everyone can add a part.": "一个故事，六个小转折，每个人都能加入一部分。",
    "Create the visual reference everyone will follow.": "创建所有人共同遵循的视觉参考。",
    "Only the owner’s allowance is used": "只使用发起人的额度",
    "Save only when satisfied": "满意后再保存",
    "No visual anchor yet.": "还没有视觉设定图。",
    "Generate, compare and approve one image before contributors illustrate their scenes.": "先生成、比较并确认一张设定图，成员再为各自场景创作插图。",
    "No public discovery. No stranger messages. The owner approves members and contributions.": "不会被公开发现，也没有陌生人私信。成员和作品都由发起人审核。",
    "Yu remembers the approved story, asks—not writes—and helps each creator strengthen their own part.": "羽大师记得已通过的故事，只提问、不代写，帮助每位创作者完善自己的部分。",
    "Write a scene, a line of dialogue, a memory, or the next event…": "写下一个场景、一句对话、一段回忆，或接下来发生的事……",
    "Optional: add your own narration.": "可选：加入你自己的旁白。",
    "Yu teaches and suggests; you decide every word. Contributors’ posts wait for owner approval, and the author name remains attached.": "羽大师负责教学和建议；每一个字都由你决定。成员发布的内容需等待发起人审核，并始终保留作者署名。",
    "Your image is ready to review.": "你的图片可以检查了。",
    "This candidate is not on the squad wall yet.": "这张候选图还没有发布到共创墙。",
    "Yu is creating your image…": "羽大师正在创作图片……",
    "One image allowance is used for each attempt.": "每次尝试使用一个图片额度。",
    "Regenerating creates a new image and uses another allowance. Nothing is shared until you choose “save to squad.”": "重新生成会创建新图片并再使用一个额度。只有选择“保存到小组”后才会共享。"
  };
  const ATTRIBUTE_ZH = {
    "Our Moonlight Adventure": "我们的月光冒险",
    "Name or nickname": "姓名或昵称",
    "Who is in the story? Where are they? What do they want? What is hard right now? How might it end? Add special clothes or objects. · 故事里有谁？他们在哪里？想要什么？遇到了什么困难？故事可能怎样结束？": "故事里有谁？他们在哪里？想要什么？遇到了什么困难？故事可能怎样结束？可加入特别的服装或物件。",
    "Age, clothes, personality, special object or ability… · 年龄、服装、性格、特殊物件或能力……": "年龄、服装、性格、特殊物件或能力……",
    "Parent or self": "家长或本人",
    "Read Yu's guidance aloud": "朗读羽大师的引导",
    "Close preview": "关闭预览",
    "Story Squad cast poster": "故事共创角色海报",
    "Approved character and world visual anchor": "已确认的人物与世界视觉设定图",
    "Generated visual candidate": "生成的候选图片"
  };
  const staticTextNodes = [];
  const staticAttributes = [];
  const requestedInterfaceLocale = ["en", "zh"].includes(params.get("uiLang")) ? params.get("uiLang") : "";
  let interfaceLocale = requestedInterfaceLocale || (params.get("storyLang") === "zh" ? "zh" : (localStorage.getItem("storieslens_squad_setup_ui") || "en"));
  let localeSquadId = "";
  let interfaceLocaleManuallyChosen = false;

  function ui(en, zh) {
    return interfaceLocale === "zh" ? zh : en;
  }

  function translatedInterfaceText(value) {
    const source = String(value || "").trim();
    if (!source) return source;
    if (interfaceLocale === "zh" && STATIC_ZH[source]) return STATIC_ZH[source];
    const parts = source.split(" · ");
    const chineseIndex = parts.findIndex((part) => /[\u3400-\u9fff]/.test(part));
    if (chineseIndex > 0) return interfaceLocale === "zh" ? parts.slice(chineseIndex).join(" · ") : parts.slice(0, chineseIndex).join(" · ");
    return source;
  }

  function captureStaticInterface() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim()) staticTextNodes.push({ node, value: node.nodeValue });
    }
    document.querySelectorAll("[placeholder],[aria-label]").forEach((element) => {
      ["placeholder", "aria-label"].forEach((name) => {
        if (element.hasAttribute(name)) staticAttributes.push({ element, name, value: element.getAttribute(name) });
      });
    });
  }

  function applyInterfaceLocale() {
    document.documentElement.lang = interfaceLocale === "zh" ? "zh-CN" : "en";
    document.title = ui("Private Story Squad · StoriesLens", "私密故事共创 · StoriesLens");
    staticTextNodes.forEach(({ node, value }) => {
      const trimmed = value.trim();
      const translated = translatedInterfaceText(trimmed);
      node.nodeValue = `${value.slice(0, value.indexOf(trimmed))}${translated}${value.slice(value.indexOf(trimmed) + trimmed.length)}`;
    });
    staticAttributes.forEach(({ element, name, value }) => {
      const translated = interfaceLocale === "zh" ? (ATTRIBUTE_ZH[value] || translatedInterfaceText(value)) : translatedInterfaceText(value);
      element.setAttribute(name, translated);
    });
    document.querySelectorAll("[data-squad-locale]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.squadLocale === interfaceLocale)));
  }

  function syncInterfaceLocale(squad) {
    if (!squad?.id || localeSquadId === squad.id) return;
    localeSquadId = squad.id;
    const saved = localStorage.getItem(`storieslens_squad_ui_${squad.id}`);
    interfaceLocale = saved === "en" || saved === "zh" ? saved : requestedInterfaceLocale || (squad.language === "zh" ? "zh" : "en");
    applyInterfaceLocale();
  }

  function setInterfaceLocale(locale, manuallyChosen = true) {
    interfaceLocale = locale === "zh" ? "zh" : "en";
    interfaceLocaleManuallyChosen = interfaceLocaleManuallyChosen || manuallyChosen;
    localStorage.setItem(activeSquad?.id ? `storieslens_squad_ui_${activeSquad.id}` : "storieslens_squad_setup_ui", interfaceLocale);
    applyInterfaceLocale();
    if (activeSquad) renderBoard(activeSquad);
    else loadExisting().catch(() => {});
  }

  function toast(message) {
    const element = $("[data-toast]");
    element.textContent = translatedInterfaceText(message);
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 3200);
  }

  function showNotice(message, error = false) {
    const notice = $("[data-notice]");
    notice.hidden = !message;
    notice.className = `notice${error ? " error" : ""}`;
    notice.textContent = translatedInterfaceText(message || "");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function approvedStoryContext(squad) {
    const approved = squad.cards.filter((card) => card.status === "approved" && card.text).slice(-8);
    const story = approved.map((card, index) => `${index + 1}. ${card.authorName}: ${card.text}`).join("\n");
    return `Shared story title: ${squad.title}\nApproved story so far:\n${story || "No approved contribution yet."}`;
  }

  function localizedBeat(beat, language) {
    return language === "zh"
      ? { title: beat.zhTitle, prompt: beat.zhPrompt }
      : { title: beat.enTitle, prompt: beat.enPrompt };
  }

  function approvedCards(squad) {
    return squad.cards.filter((card) => card.status === "approved");
  }

  function activeStoryBeat(squad) {
    const index = Math.min(approvedCards(squad).length, STORY_BEATS.length - 1);
    return { ...localizedBeat(STORY_BEATS[index], squad.language), index };
  }

  function storyBeatForCard(squad, card) {
    const approved = approvedCards(squad);
    const approvedIndex = approved.findIndex((item) => item.id === card.id);
    const storedIndex = Number(card.sceneNumber) >= 1 ? Number(card.sceneNumber) - 1 : -1;
    const index = Math.min(storedIndex >= 0 ? storedIndex : approvedIndex >= 0 ? approvedIndex : approved.length, STORY_BEATS.length - 1);
    return { ...localizedBeat(STORY_BEATS[index], squad.language), index };
  }

  async function claimStoryScene(sceneNumber, release = false) {
    try {
      const result = await platform.api(`/api/squads/${encodeURIComponent(activeSquad.id)}/scenes/${sceneNumber}/claim`, {
        method: "POST",
        body: JSON.stringify({ release })
      });
      activeSquad = result.squad;
      renderBoard(activeSquad);
      if (!release) {
        $("[data-composer]").scrollIntoView({ behavior: "smooth", block: "start" });
        $("[data-card-text]").focus({ preventScroll: true });
      }
      toast(release ? "Scene released · 已放回这一幕" : "This scene is yours · 这一幕由你创作");
    } catch (error) {
      showNotice(error.message, true);
    }
  }

  function renderStoryPath(squad, styleNames) {
    const path = $("[data-story-path]");
    const dna = $("[data-story-dna]");
    const canSeeStory = squad.viewer?.status === "approved";
    path.hidden = !canSeeStory;
    dna.hidden = !canSeeStory;
    if (!canSeeStory) return;

    const approved = approvedCards(squad);
    const completed = Math.min(approved.length, STORY_BEATS.length);
    const current = activeStoryBeat(squad);
    const currentClaim = (squad.sceneClaims || []).find((claim) => claim.sceneNumber === completed + 1);
    $("[data-story-dna-title]").textContent = squad.title;
    $("[data-story-dna-rules]").textContent = squad.characterRules || (squad.language === "zh" ? "先一起认识主角、地点和困难；羽大师会在第一幕帮你们补全故事蓝图。" : "Meet the heroes, place, and challenge together; Yu will help the squad complete the plan in scene one.");
    $("[data-story-dna-output]").textContent = squad.outputType === "film" ? ui("🎬 Story film", "🎬 故事电影") : ui("📖 Illustrated book", "📖 插画书");
    $("[data-story-dna-style]").textContent = `🎨 ${styleNames[squad.visualStyle] || squad.visualStyle}`;
    $("[data-story-dna-anchor]").textContent = squad.visualAnchorReady ? ui("✓ Characters locked", "✓ 人物已锁定") : ui("○ Visual anchor next", "○ 下一步锁定人物");
    $("[data-story-path-progress]").textContent = ui(`${completed} / 6 scenes approved`, `${completed} / 6 幕已完成`);

    $("[data-story-beat-grid]").innerHTML = STORY_BEATS.map((beat, index) => {
      const copy = localizedBeat(beat, squad.language);
      const card = approved[index];
      const claim = (squad.sceneClaims || []).find((item) => item.sceneNumber === index + 1);
      const state = card ? "is-complete" : index === completed ? "is-next" : "is-locked";
      const status = card
        ? ui(`✓ Created by ${card.authorName}`, `✓ ${card.authorName} 已完成`)
        : index === completed
          ? claim
            ? (claim.isMine ? ui("✓ You claimed this scene", "✓ 这一幕由你创作") : ui(`${claim.displayName} is creating`, `${claim.displayName} 正在创作`))
            : ui("Ready for one creator", "等待一位创作者认领")
          : ui("Waiting for the story", "等待前一幕");
      return `<article class="story-beat ${state}">
        <span class="story-beat-number">${index + 1}</span>
        <div><strong>${escapeHtml(copy.title)}</strong><p>${escapeHtml(copy.prompt)}</p><small>${escapeHtml(status)}</small></div>
        ${index === completed && !claim ? `<button type="button" data-claim-scene="${index + 1}">${ui("Claim this scene", "认领这一幕")}</button>` : ""}
        ${index === completed && claim?.isMine ? `<div class="scene-claim-actions"><button type="button" data-write-next>${ui("Write my scene", "开始创作")}</button><button class="scene-release" type="button" data-release-scene="${index + 1}">${ui("Release", "放回")}</button></div>` : ""}
      </article>`;
    }).join("");
    $("[data-next-beat-title]").textContent = approved.length >= STORY_BEATS.length
      ? (squad.language === "zh" ? "六幕故事完成了！还想加入彩蛋吗？" : "Your six-scene story is complete! Add a bonus scene?")
      : `${current.index + 1}. ${current.title}`;
    $("[data-next-beat-prompt]").textContent = approved.length >= STORY_BEATS.length
      ? (squad.language === "zh" ? "你们现在可以汇编作品，或再加入一个惊喜彩蛋。" : "You can assemble the project now, or add one delightful bonus moment.")
      : current.prompt;
    $("[data-write-next]")?.addEventListener("click", () => {
      $("[data-composer]").scrollIntoView({ behavior: "smooth", block: "start" });
      $("[data-card-text]").focus({ preventScroll: true });
    });
    document.querySelectorAll("[data-claim-scene]").forEach((button) => button.addEventListener("click", () => claimStoryScene(Number(button.dataset.claimScene))));
    document.querySelectorAll("[data-release-scene]").forEach((button) => button.addEventListener("click", () => claimStoryScene(Number(button.dataset.releaseScene), true)));
    if (completed < STORY_BEATS.length && currentClaim && !currentClaim.isMine) $("[data-composer]").hidden = true;
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
    const beat = activeStoryBeat(activeSquad);
    if (!review) {
      if (activeSquad.theme === "wuxia" && activeSquad.language === "zh") {
        const questions = ["少侠，古琴声从哪里传来？谁第一个听见了？", "琴声突然停下时，什么困难出现在主角面前？", "主角第一次用了什么办法？结果发生了什么？", "这场交锋中，哪个动作最能表现人物的性格？", "刀剑与古琴之间，主角最终做出了什么选择？", "最后一声琴音响起时，谁发生了改变？"];
        return { question: questions[beat.index] || beat.prompt };
      }
      return { question: beat.prompt };
    }
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
    button.textContent = ui("Yu is thinking…", "羽大师思考中……");
    mentorState.activeSentence = review ? lastDraftSentence(draft, activeSquad.language) : "";
    const beat = activeStoryBeat(activeSquad);
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
          skillFocus: review ? `sentence clarity, grammar, shared-story continuity, and scene ${beat.index + 1}: ${beat.title}` : `scene ${beat.index + 1}: ${beat.title}`,
          inspiration: activeSquad.title,
          storyDnaContext: approvedStoryContext(activeSquad),
          studentDraft: draft,
          selectedText: mentorState.activeSentence,
          teacherInstructions: `${activeSquad.theme === "wuxia" ? "Speak as 小羽大侠, a warm wuxia writing mentor. When useful, ask about the sound of the guqin, the rhythm of an action, the setting, the character's motive, or the choice behind the fight. Keep all action non-graphic and original; never imitate an existing film or filmmaker. " : ""}Keep the language child-friendly. Guide this exact story beat with one short question: ${beat.prompt} Refer to the approved shared story, but never write the next plot event for the creator.`
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
        theme: setup.theme,
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

  function renderCastStudio(squad) {
    const studio = $("[data-cast-studio]");
    const approved = squad.viewer?.status === "approved";
    studio.hidden = !approved;
    if (!approved) return;
    const cast = squad.members.filter((member) => member.status === "approved");
    $("[data-cast-grid]").innerHTML = cast.map((member) => `
      <article class="cast-card${member.castLocked ? " is-locked" : ""}">
        ${member.castReferenceImageUrl ? `<img src="${escapeHtml(member.castReferenceImageUrl)}" alt="Private character reference for ${escapeHtml(member.castCharacterName)}" />` : '<div class="cast-card-empty" aria-hidden="true">?</div>'}
        <div><strong>${escapeHtml(member.castCharacterName || member.displayName)}</strong><small>${escapeHtml(member.castDescription || (member.isViewer ? ui("Add your reference below", "请在下方添加参考图") : ui("Waiting for their character", "等待角色加入")))}</small>${member.castLocked ? `<b>${ui("✓ CHARACTER LOCKED", "✓ 角色卡已锁定")}</b>` : squad.viewer?.role === "owner" && member.castReferenceImageUrl ? `<button type="button" data-lock-character="${member.id}">${ui("Confirm character card", "确认并锁定角色卡")}</button>` : ""}</div>
      </article>`).join("");
    const viewer = cast.find((member) => member.isViewer);
    $("[data-cast-form]").hidden = Boolean(viewer?.castLocked);
    $("[data-cast-locked-note]").hidden = !viewer?.castLocked;
    if (!$('[data-cast-name]').value) $('[data-cast-name]').value = viewer?.castCharacterName || squad.viewer.displayName || "";
    const references = cast.filter((member) => member.castLocked && member.castReferenceImageUrl);
    const posterButton = $("[data-generate-cast-poster]");
    posterButton.hidden = squad.viewer?.role !== "owner";
    posterButton.disabled = references.length < 2;
    posterButton.textContent = squad.visualAnchorImageUrl ? ui("Regenerate our cast poster", "重新生成角色海报") : references.length < 2 ? ui("Confirm at least 2 character cards", "请先确认至少2张角色卡") : ui("Create our cast poster", "生成全体角色海报");
    document.querySelectorAll("[data-lock-character]").forEach((button) => button.addEventListener("click", async () => {
      if (!window.confirm(ui("Confirm this permanent character card? It cannot be replaced after locking.", "确认锁定这张角色卡吗？锁定后不能再替换。"))) return;
      button.disabled = true;
      try {
        const result = await platform.api(`/api/squads/${encodeURIComponent(squad.id)}/cast-reference/${encodeURIComponent(button.dataset.lockCharacter)}/lock`, { method: "POST", body: "{}" });
        activeSquad = result.squad;
        renderBoard(activeSquad);
        toast(ui("Character card locked", "角色卡已永久锁定"));
      } catch (error) {
        showNotice(error.message, true);
        button.disabled = false;
      }
    }));
    const poster = $("[data-cast-poster]");
    poster.hidden = !squad.visualAnchorImageUrl;
    if (squad.visualAnchorImageUrl) {
      $("[data-cast-poster-image]").src = squad.visualAnchorImageUrl;
      $("[data-cast-poster-title]").textContent = squad.title;
      $("[data-cast-poster-background]").textContent = squad.characterRules || (squad.language === "zh" ? "由 Story Squad 共同创作的原创故事" : "An original adventure created together by this Story Squad");
      $("[data-cast-poster-names]").textContent = references.map((member) => member.castCharacterName || member.displayName).join("  •  ");
      const date = new Date(squad.createdAt);
      $("[data-cast-poster-date]").textContent = Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(squad.language === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
    }
  }

  async function saveCastReference(event) {
    event.preventDefault();
    if (!pendingCastReference || !activeSquad) {
      showNotice("Choose one photo or drawing first. · 请先选择一张照片或画作。", true);
      return;
    }
    const submit = event.submitter;
    submit.disabled = true;
    try {
      let consentId = "";
      if (pendingCastReference.personalPhoto) {
        const approved = $("[data-cast-consent-person]").checked && $("[data-cast-consent-processing]").checked;
        const guardianName = $("[data-cast-adult-name]").value.trim();
        const relationship = $("[data-cast-relationship]").value.trim();
        if (!approved || !guardianName || !relationship) throw new Error("Complete the adult photo permission before adding this real-person reference.");
        const consent = await platform.api(`/api/squads/${encodeURIComponent(activeSquad.id)}/photo-consent`, {
          method: "POST",
          body: JSON.stringify({ guardianName, relationship, confirmedAdult: true, approvedPrivateMedia: true, approvedPersonalPhoto: true, acknowledgedRegionalProcessing: true })
        });
        consentId = consent.consent.id;
      }
      const uploaded = await platform.api("/api/media", {
        method: "POST",
        body: JSON.stringify({ squadId: activeSquad.id, dataUrl: pendingCastReference.dataUrl, metadataRemoved: true, personalPhotoConsentId: consentId })
      });
      const saved = await platform.api(`/api/squads/${encodeURIComponent(activeSquad.id)}/cast-reference`, {
        method: "POST",
        body: JSON.stringify({ mediaId: uploaded.media.id, characterName: $("[data-cast-name]").value.trim(), description: $("[data-cast-description]").value.trim() })
      });
      activeSquad = saved.squad;
      pendingCastReference = null;
      $("[data-cast-form]").reset();
      $("[data-cast-consent]").hidden = true;
      $("[data-cast-file-status]").textContent = ui("Reference saved privately", "参考图已私密保存");
      renderBoard(activeSquad);
      toast("You joined the cast! · 你已加入演员阵容！");
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      submit.disabled = false;
    }
  }

  async function generateCastPoster() {
    const members = activeSquad.members.filter((member) => member.status === "approved" && member.castReferenceImageUrl);
    if (members.length < 2) return;
    const button = $("[data-generate-cast-poster]");
    button.disabled = true;
    try {
      const referenceImageUrls = await Promise.all(members.map(async (member) => {
        const response = await fetch(member.castReferenceImageUrl, { credentials: "same-origin" });
        if (!response.ok) throw new Error("One cast reference could not be read.");
        return blobToDataUrl(await response.blob());
      }));
      const consentIds = members.filter((member) => member.castReferencePersonalPhoto).map((member) => member.castReferenceConsentId).filter(Boolean);
      if (consentIds.length !== members.filter((member) => member.castReferencePersonalPhoto).length) throw new Error("Every real-person reference needs active adult permission before making the poster.");
      pendingVisual = {
        kind: "cast", cardId: "", card: null, imageUrl: "",
        characterReferenceImageUrls: referenceImageUrls,
        personalPhoto: consentIds.length > 0,
        personalPhotoConsentIds: consentIds,
        castDescription: members.map((member, index) => `Reference ${index + 1}: ${member.castCharacterName}. ${member.castDescription || "Keep this creator recognizable."}`).join("\n")
      };
      await generatePendingVisual();
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      button.disabled = false;
    }
  }

  function renderMembers(squad) {
    const owner = squad.viewer?.role === "owner";
    $("[data-members]").innerHTML = squad.members.map((member) => `
      <div class="member">
        <span class="member-icon">${escapeHtml(member.displayName.slice(0, 1).toUpperCase())}</span>
        <div><strong>${escapeHtml(member.displayName)}</strong><small>${member.role === "owner" ? ui("Owner", "发起人") : member.status === "approved" ? ui("Creator", "共创者") : ui("Waiting", "待批准")}</small></div>
        ${owner && member.status === "pending" ? `<button class="approve" type="button" data-approve-member="${member.id}">${ui("Approve", "批准")}</button>` : ""}
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
    const lockedCharacters = squad.members.filter((member) => member.status === "approved" && member.castLocked && member.castReferenceImageUrl);
    const wall = $("[data-story-wall]");
    if (!squad.cards.length) {
      wall.innerHTML = `<article class="story-card"><header><strong>${ui("Our wall is ready.", "共创墙准备好了。")}</strong></header><p>${ui("Write or record the first piece of your shared story.", "写下或录下共同故事的第一部分。")}</p></article>`;
      return;
    }
    let approvedIndex = 0;
    wall.innerHTML = squad.cards.map((card) => {
      const beatIndex = card.status === "approved" ? approvedIndex++ : Math.min(approvedCards(squad).length, STORY_BEATS.length - 1);
      const beat = localizedBeat(STORY_BEATS[Math.min(beatIndex, STORY_BEATS.length - 1)], squad.language);
      const sceneLabel = squad.outputType === "film" ? ui("SCENE", "场景") : ui("PAGE", "第");
      const selectedCharacterIds = new Set(card.characterCardIds || []);
      return `
      <article class="story-card">
        <header><strong>${escapeHtml(card.authorName)}</strong><span>${card.status === "approved" ? `${sceneLabel} ${String(beatIndex + 1).padStart(2, "0")} · ${escapeHtml(beat.title)}` : ui("WAITING FOR APPROVAL", "等待审核")}</span></header>
        ${card.videoUrl ? `<video controls playsinline preload="metadata" src="${escapeHtml(card.videoUrl)}"></video>` : card.imageUrl ? `<img src="${escapeHtml(card.imageUrl)}" alt="Illustration by ${escapeHtml(card.authorName)}">` : ""}
        ${card.visualStatus === "pending" ? `<small class="visual-review">${ui("Visual waiting for owner approval", "图片／视频待发起人批准")}</small>` : ""}
        ${card.yuGuided ? `<span class="yu-guided-badge">${ui("Guided with Yu", "羽大师引导")}</span>` : ""}
        ${card.text ? `<p>${escapeHtml(card.text)}</p>` : ""}
        ${card.audioMediaId ? `<audio controls preload="metadata" src="/api/media/${encodeURIComponent(card.audioMediaId)}"></audio>` : ""}
        ${card.canEdit && lockedCharacters.length ? `<fieldset class="scene-cast-picker" data-scene-cast-picker><legend>${ui("Who appears in this scene?", "这一幕有谁？")}</legend><small>${ui("Choose only the characters who should appear.", "只勾选这一幕真正出现的人物。")}</small><div>${lockedCharacters.map((member) => `<label><input type="checkbox" data-scene-character value="${escapeHtml(member.id)}" ${(selectedCharacterIds.size ? selectedCharacterIds.has(member.id) : member.isViewer) ? "checked" : ""} /><img src="${escapeHtml(member.castReferenceImageUrl)}" alt="" /><span>${escapeHtml(member.castCharacterName || member.displayName)}</span></label>`).join("")}</div></fieldset>` : ""}
        <div class="card-actions">
          ${card.canEdit ? `<button class="visual-action" type="button" data-generate-card-image="${card.id}">${card.imageUrl ? ui("Regenerate illustration", "重绘插图") : ui("Create my illustration", "生成我的插图")}</button>` : ""}
          ${card.canEdit && card.imageUrl ? `<button class="visual-action secondary" type="button" data-generate-card-video="${card.id}">${ui("Animate my scene", "生成我的短片")}</button>` : ""}
          ${owner && (card.status === "pending" || card.visualStatus === "pending") ? `<button class="approve" type="button" data-approve-card="${card.id}">${ui("Approve & share", "批准并共享")}</button>` : ""}
        </div>
      </article>`;
    }).join("");
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

  function castPosterPrompt(squad, candidate) {
    return `Create a polished 16:9 Hollywood-blockbuster-style ensemble poster BACKGROUND for the child-safe shared story “${squad.title}”. Include every referenced protagonist exactly once, keep their identities separate and recognizable, and never blend or swap faces. Transform them into one coherent story world while preserving age, facial structure, skin tone, hairstyle, clothing colors and body proportions. Locked story plan: ${squad.characterRules || "a warm shared adventure"}. Cast notes:\n${candidate.castDescription || "Keep every referenced creator recognizable."}\nUse dramatic but welcoming cinematic light, place the ensemble across the center, and leave clean darker breathing room at the top and bottom for the website to add an exact title, cast names and date. No written title, captions, logos, watermarks, frames or interface symbols.`;
  }

  function cardPrompt(squad, card) {
    const beat = storyBeatForCard(squad, card);
    return `Create a child-safe, polished story illustration for scene ${beat.index + 1}, “${beat.title},” in the shared story titled “${squad.title}”. Show this contributor's scene faithfully: ${card.text || "a magical new scene"}. Follow the locked characters, world and approved visual anchor exactly. No written words, logos or watermarks.`;
  }

  async function generatePendingVisual() {
    if (!pendingVisual || !activeSquad) return;
    const candidate = pendingVisual;
    const sharedAnchor = candidate.kind === "anchor" || candidate.kind === "cast";
    showCandidateDialog();
    $("[data-candidate-title]").textContent = candidate.kind === "cast" ? ui("Review your cast poster.", "检查全体角色海报。") : candidate.kind === "anchor" ? ui("Review the squad’s visual anchor.", "检查小组视觉设定图。") : ui("Review your scene illustration.", "检查你的场景插图。");
    $("[data-candidate-note]").textContent = sharedAnchor
      ? ui("Only the project owner can see this candidate. Approve it to lock the visual reference for everyone.", "只有项目发起人能看到这张候选图。确认后，它将成为所有人的共同视觉参考。")
      : ui("Only you can see this candidate. Save it only when you are satisfied; contributors’ visuals still follow owner approval.", "只有你能看到这张候选图。满意后再保存；成员图片仍需发起人审核。 ");
    try {
      const result = await platform.api("/api/generate-image", {
        method: "POST",
        headers: { "Idempotency-Key": `squad-${candidate.kind}-${candidate.cardId || "anchor"}-${crypto.randomUUID()}` },
        body: JSON.stringify({
          squadId: activeSquad.id,
          cardId: candidate.cardId || "",
          squadAnchor: sharedAnchor,
          projectId: activeSquad.id,
          prompt: candidate.kind === "cast"
            ? castPosterPrompt(activeSquad, candidate)
            : candidate.kind === "anchor"
            ? `${anchorPrompt(activeSquad)}${candidate.styleReferenceImageUrls?.length ? "\n\nA user-provided STYLE REFERENCE is included. Borrow only high-level palette, lighting, texture, brushwork and mood. Do not copy its characters, logos, readable text, exact composition, or any artist signature." : ""}`
            : cardPrompt(activeSquad, candidate.card),
          aspectRatio: "16:9",
          assetType: candidate.kind === "cast" ? "SQUAD_CAST_POSTER" : candidate.kind === "anchor" ? "SQUAD_VISUAL_ANCHOR" : "SQUAD_CONTRIBUTION_IMAGE",
          characterCardIds: candidate.characterCardIds || [],
          referenceImageUrls: [...(candidate.characterReferenceImageUrls || []), ...(candidate.styleReferenceImageUrls || [])],
          personalPhoto: candidate.personalPhoto === true,
          personalPhotoConsentId: candidate.personalPhotoConsentId || "",
          personalPhotoConsentIds: candidate.personalPhotoConsentIds || []
        })
      });
      if (pendingVisual !== candidate) return;
      candidate.imageUrl = result.imageUrl || result.downloadUrl;
      if (sharedAnchor) {
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
      showNotice(error.payload?.code === "SQUAD_VISUAL_ANCHOR_REQUIRED" ? "请先由小组长生成并确认首张视觉锚点，然后每位成员才能按统一人物和画风生图。" : error.payload?.code === "SQUAD_SCENE_CHARACTERS_REQUIRED" ? "请先勾选这一幕真正出现的角色。" : error.status === 402 ? (candidate.kind === "anchor" ? "小组长的图片额度不足，请先补充额度。" : "你的图片额度不足，请补充额度后继续。") : error.message, true);
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
    const characterCardIds = [...button.closest(".story-card").querySelectorAll("[data-scene-character]:checked")].map((input) => input.value);
    if (squad.members.some((member) => member.castLocked) && !characterCardIds.length) {
      showNotice(ui("Choose at least one confirmed character for this scene.", "请先勾选这一幕出现的角色。"), true);
      return;
    }
    pendingVisual = { kind: "card", cardId: card.id, card, imageUrl: "", characterCardIds };
    generatePendingVisual();
  }

  async function acceptPendingVisual() {
    if (!pendingVisual?.imageUrl || !activeSquad) return;
    const button = $("[data-candidate-accept]");
    button.disabled = true;
    try {
      const result = pendingVisual.kind === "anchor" || pendingVisual.kind === "cast"
        ? await platform.api(`/api/squads/${encodeURIComponent(activeSquad.id)}/visual-anchor`, { method: "POST", body: JSON.stringify({ imageUrl: pendingVisual.imageUrl }) })
        : await attachVisual(activeSquad.id, pendingVisual.cardId, { imageUrl: pendingVisual.imageUrl, characterCardIds: pendingVisual.characterCardIds || [] });
      const savedKind = pendingVisual.kind;
      activeSquad = result.squad;
      closeCandidateDialog();
      renderBoard(activeSquad);
      toast(savedKind === "anchor" || savedKind === "cast"
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
    const beat = storyBeatForCard(squad, card);
    button.disabled = true;
    button.textContent = ui("Yu is animating…", "羽大师制作中……");
    showNotice("Animating your contribution with your own allowance… · 正在使用你自己的视频额度生成短片…");
    try {
      const started = await platform.api("/api/generate-video", {
        method: "POST",
        headers: { "Idempotency-Key": `squad-video-${card.id}-${crypto.randomUUID()}` },
        body: JSON.stringify({
          squadId: squad.id,
          cardId: card.id,
          projectId: squad.id,
          prompt: `Animate scene ${beat.index + 1}, “${beat.title},” with gentle cinematic movement. Preserve the child-safe characters and artwork exactly. Scene: ${card.text || squad.title}`,
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
      button.textContent = ui("Animate my scene", "生成我的短片");
    }
  }

  function renderBoard(squad) {
    syncInterfaceLocale(squad);
    $("[data-setup]").hidden = true;
    $("[data-board]").hidden = false;
    $("[data-squad-title]").textContent = squad.title;
    const wuxiaMentor = squad.theme === "wuxia";
    $("[data-squad-yu]").classList.toggle("is-wuxia", wuxiaMentor);
    $("[data-yu-theme-image]").src = wuxiaMentor ? "assets/yu-wuxia-master-v1.png" : "assets/yu-mascot-logo-v2.png";
    $("[data-yu-theme-image]").alt = wuxiaMentor ? ui("Hero Yu with a guqin and feather brush", "背着古琴、手持羽毛笔的小羽大侠") : "";
    $("[data-yu-theme-title]").textContent = wuxiaMentor ? ui("Hero Yu enters the story", "小羽大侠与你共闯江湖") : ui("Yu is creating with us", "羽大师也在共创");
    $("[data-yu-theme-copy]").textContent = wuxiaMentor
      ? ui("He asks one focused question per scene so your team writes every motive, action and choice in its own words.", "他每一幕只问一个关键问题，帮大家用自己的话写清动机、动作与选择。")
      : ui("Yu remembers the approved story, asks—not writes—and helps each creator strengthen their own part.", "羽大师记得已通过的故事，只提问、不代写，帮助每位创作者完善自己的部分。");
    const styleNames = {
      "storybook-watercolor": ui("Storybook watercolor", "绘本水彩"),
      "ink-watercolor": ui("Ink watercolor", "水墨水彩"),
      cinematic: ui("Cinematic animation", "电影动画"),
      comic: ui("Graphic novel", "连环画"),
      "block-world": ui("Block World", "方块世界"),
      "japanese-handpainted": ui("Japanese hand-painted", "日系手绘动画")
    };
    const storyLanguage = squad.language === "zh" ? ui("Chinese story", "中文故事") : ui("English story", "英文故事");
    const outputName = squad.outputType === "film" ? ui("Story film", "故事电影") : ui("Illustrated book", "绘本");
    const anchorState = squad.visualAnchorReady ? ui("Visual anchor ready", "视觉设定已完成") : ui("Waiting for the first visual anchor", "等待首张视觉设定图");
    $("[data-squad-meta]").textContent = `${storyLanguage} · ${outputName} · ${styleNames[squad.visualStyle] || squad.visualStyle} · ${ui("Style locked by owner", "风格由发起人锁定")} · ${anchorState}`;
    const owner = squad.viewer?.role === "owner";
    const approved = squad.viewer?.status === "approved";
    const assembled = Boolean(squad.assembledProjectId);
    $("[data-owner-actions]").hidden = !owner;
    $("[data-assemble]").hidden = !owner || assembled;
    $("[data-assemble]").textContent = squad.outputType === "film" ? ui("Assemble story film", "汇编故事电影") : ui("Assemble illustrated book", "汇编插画书");
    const openProject = $("[data-open-project]");
    openProject.hidden = !owner || !assembled;
    if (assembled) {
      openProject.href = `${squad.outputType === "film" ? "movie-studio.html" : "book-studio.html"}?project=${encodeURIComponent(squad.assembledProjectId)}`;
      openProject.textContent = squad.outputType === "film" ? ui("Open movie studio", "打开电影工作台") : ui("Open book studio", "打开成书工作台");
    }
    document.querySelectorAll("[data-squad-export]").forEach((button) => { button.hidden = !owner || !assembled; });
    $("[data-squad-render]").hidden = !owner || !assembled || squad.outputType !== "film";
    $("[data-code-banner]").hidden = !owner;
    $("[data-story-code]").textContent = squad.joinCode || "";
    $("[data-pending-banner]").hidden = approved;
    $("[data-composer]").hidden = !approved;
    const anchorStudio = $("[data-anchor-studio]");
    anchorStudio.hidden = !approved;
    $("[data-anchor-rules]").textContent = squad.characterRules || (squad.language === "zh" ? "尚未填写人物规则；小组长仍可先生成并确认视觉锚点。" : "No character rules were entered; the owner can still generate and approve a visual anchor.");
    $("[data-anchor-style]").textContent = styleNames[squad.visualStyle] || squad.visualStyle;
    $("[data-generate-anchor]").hidden = !owner;
    $("[data-generate-anchor]").textContent = squad.visualAnchorReady ? ui("Regenerate anchor", "重新生成设定图") : ui("Generate first visual anchor", "生成首张设定图");
    const anchorImage = $("[data-anchor-image]");
    anchorImage.hidden = !squad.visualAnchorImageUrl;
    if (squad.visualAnchorImageUrl) anchorImage.src = squad.visualAnchorImageUrl;
    else anchorImage.removeAttribute("src");
    $("[data-anchor-empty]").hidden = Boolean(squad.visualAnchorImageUrl);
    $("[data-anchor-approved]").hidden = !squad.visualAnchorReady;
    renderCastStudio(squad);
    renderStoryPath(squad, styleNames);
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
    $("[data-existing-list]").innerHTML = result.squads.map((squad) => `<a href="squad-board.html?id=${encodeURIComponent(squad.id)}"><strong>${escapeHtml(squad.title)}</strong><small>${squad.viewer.status === "pending" ? ui("Waiting for approval", "待批准") : ui(`${squad.cards.length} contributions`, `${squad.cards.length} 份创作`)}</small></a>`).join("");
  }

  $("[data-create-young]").addEventListener("change", (event) => { $("[data-create-guardian-row]").hidden = !event.target.checked; });
  $("[data-join-young]").addEventListener("change", (event) => { $("[data-join-guardian-row]").hidden = !event.target.checked; });
  $("[data-create-language]").addEventListener("change", (event) => {
    $("[data-create-style]").value = event.target.value === "zh" ? "ink-watercolor" : "storybook-watercolor";
    if (!interfaceLocaleManuallyChosen && !activeSquad) setInterfaceLocale(event.target.value, false);
  });
  document.querySelectorAll("[data-squad-locale]").forEach((button) => button.addEventListener("click", () => setInterfaceLocale(button.dataset.squadLocale)));
  $("[data-yu-question]").addEventListener("click", () => askYu(false));
  $("[data-yu-review]").addEventListener("click", () => askYu(true));
  $("[data-yu-read]").addEventListener("click", speakYuGuidance);
  $("[data-generate-anchor]").addEventListener("click", generateAnchorImage);
  $("[data-generate-cast-poster]").addEventListener("click", generateCastPoster);
  $("[data-cast-form]").addEventListener("submit", saveCastReference);
  $("[data-cast-file]").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    pendingCastReference = null;
    if (!file) return;
    $("[data-cast-file-status]").textContent = ui("Removing metadata and checking safety…", "正在移除信息并进行安全检查……");
    try {
      const safe = await window.StoriesLensArtworkSafety.processArtwork(file);
      pendingCastReference = { dataUrl: safe.dataUrl, personalPhoto: Boolean(safe.review?.checks?.realPerson) };
      $("[data-cast-consent]").hidden = !pendingCastReference.personalPhoto;
      $("[data-cast-file-status]").textContent = pendingCastReference.personalPhoto
        ? ui("Safe real-person photo ready. Complete adult permission below.", "真人照片已通过安全检查，请在下方完成成年人许可。")
        : ui("Safe drawing or artwork ready. Metadata removed.", "画作已通过安全检查，照片信息已移除。");
      showNotice("");
    } catch (error) {
      event.target.value = "";
      $("[data-cast-consent]").hidden = true;
      $("[data-cast-file-status]").textContent = ui("Reference not added", "参考图未添加");
      showNotice(error.reasonCode === "unsafe_content" ? "This image did not pass the child-safety review." : "This image could not be prepared safely. Try JPG or PNG.", true);
    }
  });
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
        $("[data-record-status]").textContent = ui("Voice ready", "录音已准备好");
        recorderStream?.getTracks().forEach((track) => track.stop());
        clearTimeout(recordingTimer);
      };
      recorder.start();
      $("[data-record]").disabled = true;
      $("[data-stop]").disabled = false;
      $("[data-record-status]").textContent = ui("Recording… up to 90 seconds", "正在录音，最长 90 秒");
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
      $("[data-record-status]").textContent = ui("Optional: add your own narration.", "可选：加入你自己的旁白。");
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
      output.textContent = ui("The movie is still assembling. You can return to this private squad later.", "电影仍在合成，可稍后返回查看。");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const result = await platform.api(`/api/render-jobs/${encodeURIComponent(jobId)}`);
    const job = result.renderJob;
    if (job.status === "completed" && job.outputUrl) {
      output.replaceChildren(document.createTextNode(ui("Final movie ready · ", "完整电影已完成 · ")));
      const link = document.createElement("a");
      link.href = job.outputUrl;
      link.textContent = ui("Download MP4", "下载 MP4");
      link.setAttribute("download", "");
      output.append(link);
      return;
    }
    if (job.status === "failed") throw new Error(job.error || "Final movie assembly failed.");
    output.textContent = ui(`Joining approved clips, images and voices… ${Number(job.progress || 0)}%`, `正在合成已通过的片段、图片和声音……${Number(job.progress || 0)}%`);
    return pollFinalMovie(jobId, output, attempt + 1);
  }

  async function renderFinalMovie() {
    if (!activeSquad?.assembledProjectId) return;
    const button = $("[data-squad-render]");
    const output = $("[data-final-output]");
    button.disabled = true;
    output.hidden = false;
    output.textContent = ui("Preparing private final movie…", "正在准备完整电影……");
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
    if (!activeSquad || !confirm(ui("Assemble all approved contributions into one private project?", "把所有已批准内容汇编为一个作品吗？"))) return;
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

  captureStaticInterface();
  applyInterfaceLocale();
  init().catch((error) => showNotice(error.message, true));
})();
