(() => {
  const triggers = Array.from(document.querySelectorAll("[data-yu-profile-open]"));
  if (!triggers.length) return;

  const copy = {
    en: {
      close: "Close Yu introduction",
      eyebrow: "HOW YOUR MENTOR IS TRAINED",
      title: "Meet Yu.",
      subtitle: "Your bilingual language & story mentor",
      lede: "Yu is not trained to replace the writer. Yu combines transparent teaching frameworks with evidence from each creator’s own words—then asks the next question that helps the creator think, write, and revise independently.",
      cards: [
        ["01 · ENGLISH", "CCSS writing foundations", "Writing and Language anchor skills guide age-adaptive work in narrative, informational, argument, revision, vocabulary, grammar, and conventions."],
        ["02 · 中文", "Chinese writing craft", "Yu learns from curated Chinese narrative craft, observation, rhetoric, modern prose, and screenwriting. Yu studies ideas and techniques—never copies or imitates an author’s text."],
        ["03 · ADAPTIVE", "MAP-informed, when a family chooses", "Optional Language Usage results can be used as one readiness signal. Yu never invents a RIT score, converts it into a grade, or claims to be an official MAP service."],
        ["04 · AUTHORSHIP", "Questions before answers", "Yu identifies one strength, one high-value focus, and one next action. The creator supplies the characters, decisions, details, and final words."]
      ],
      dailyAria: "Yu daily knowledge review cycle",
      dailyEyebrow: "DAILY REVIEW · TRACEABLE SOURCES",
      dailyTitle: "Yu keeps learning—carefully.",
      dailyText: "Each day, new Chinese and English writing resources are reviewed for Yu. Nothing enters the knowledge base automatically: every addition must pass source, rights, teaching-value, and quality checks.",
      dailySteps: ["Find authoritative sources", "Verify rights & provenance", "Extract teachable methods", "Test before release"],
      dailyFoot: "No pirated textbooks · No copying protected works · No implied institutional endorsement",
      proofTitle: "A mentor that is evaluated—not merely prompted.",
      proof: "Every approved update is checked for bilingual consistency, age adaptation, evidence-based feedback, safety, privacy, and non-ghostwriting behavior.",
      note: "StoriesLens describes Yu as CCSS-aligned and MAP-informed. StoriesLens is not affiliated with or endorsed by NWEA, and Yu does not reproduce proprietary assessment items."
    },
    zh: {
      close: "关闭羽大师介绍",
      eyebrow: "羽大师是怎样训练出来的",
      title: "认识羽大师",
      subtitle: "你的中英文语言与故事导师",
      lede: "羽大师不是为了替创作者写作而训练。它把清晰可解释的教学框架，与创作者自己的表达证据结合起来，再提出恰到好处的下一个问题，帮助创作者独立思考、写作与修改。",
      cards: [
        ["01 · 英文", "CCSS 写作与语言基础", "以 Writing 与 Language 核心能力为训练骨架，覆盖叙事、说明、议论、修改、词汇、语法与写作规范，并根据年龄调整指导方式。"],
        ["02 · 中文", "中国写作与叙事体系", "吸收经过筛选的中国叙事、观察、修辞、现代散文与剧本写作方法。学习作家的思想与技法，但不复制原文，也不模仿特定作家的文字。"],
        ["03 · 个性化", "由家庭选择的 MAP-informed 指导", "家长可以选择添加 Language Usage 结果，作为学习准备度的一项参考。羽大师不会编造 RIT、把 RIT 等同年级，也不会声称自己是 MAP 官方服务。"],
        ["04 · 作者权", "先提问，再给答案", "羽大师每次只指出一个优势、一个最值得提升的重点和一个下一步行动；人物、决定、细节和最终文字始终由创作者完成。"]
      ],
      dailyAria: "羽大师每日知识审查流程",
      dailyEyebrow: "每日审查 · 来源可追溯",
      dailyTitle: "羽大师每天学习，但不是自动乱学。",
      dailyText: "我们每天寻找新的中英文写作资料；只有经过来源核验、版权审查、教学提炼和质量测试的内容，才会进入羽大师的知识库。",
      dailySteps: ["寻找权威资料", "核验来源与许可", "提炼可教学方法", "通过测试后更新"],
      dailyFoot: "不使用盗版教材 · 不复制受保护原文 · 不暗示任何机构官方背书",
      proofTitle: "羽大师不是只写了一段提示词，而是持续接受评测的导师系统。",
      proof: "每一项获准更新都会检查中英文一致性、年龄适配、基于文本证据的反馈、安全与隐私，以及是否真正做到不代写。",
      note: "StoriesLens 使用“CCSS-aligned”和“MAP-informed”描述羽大师。StoriesLens 与 NWEA 没有关联或官方背书，也不会复制其专有测评题目。"
    }
  };

  const dialog = document.createElement("dialog");
  dialog.className = "yu-profile-dialog";
  dialog.setAttribute("data-yu-profile-dialog", "");
  document.body.append(dialog);

  function locale() {
    return document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function render() {
    const content = copy[locale()];
    const cards = content.cards.map((card) => '<article class="yu-training-card"><span>' + card[0] + '</span><h3>' + card[1] + '</h3><p>' + card[2] + '</p></article>').join("");
    const dailySteps = content.dailySteps.map((step, index) => '<li><span>' + String(index + 1).padStart(2, "0") + '</span><strong>' + step + '</strong></li>').join("");
    dialog.innerHTML = '<div class="yu-profile-dialog-shell">' +
      '<button class="yu-profile-close" type="button" data-yu-profile-close aria-label="' + content.close + '">×</button>' +
      '<header class="yu-profile-hero"><span class="yu-profile-logo"><img src="assets/yu-feather-mark.svg" alt="" /></span><div><p class="yu-profile-eyebrow">' + content.eyebrow + '</p><h2>' + content.title + '<em>' + content.subtitle + '</em></h2></div></header>' +
      '<p class="yu-profile-lede">' + content.lede + '</p>' +
      '<section class="yu-profile-grid" aria-label="Yu mentor training framework">' + cards + '</section>' +
      '<section class="yu-daily-cycle" aria-label="' + content.dailyAria + '"><header><span class="yu-daily-pulse" aria-hidden="true"></span><div><p>' + content.dailyEyebrow + '</p><h3>' + content.dailyTitle + '</h3></div></header><p class="yu-daily-copy">' + content.dailyText + '</p><ol>' + dailySteps + '</ol><small>' + content.dailyFoot + '</small></section>' +
      '<div class="yu-profile-proof"><img src="assets/yu-feather-mark.svg" alt="" /><div><strong>' + content.proofTitle + '</strong><p>' + content.proof + '</p></div></div>' +
      '<p class="yu-profile-note">' + content.note + '</p></div>';
    dialog.querySelector("[data-yu-profile-close]").addEventListener("click", () => dialog.close());
  }

  triggers.forEach((trigger) => trigger.addEventListener("click", () => {
    render();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    window.StoriesLensAnalytics?.track("yu_training_profile_opened", { locale: locale(), source: location.pathname });
  }));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
