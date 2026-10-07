"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { buildEnglishCoachCurriculum } = require("../english-writing-coach");
const { buildChineseCoachCurriculum } = require("../chinese-writing-coach");

const registryPath = path.join(__dirname, "..", "resources", "yu-training", "sources", "registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

function loadModule(...segments) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "resources", "yu-training", "modules", ...segments), "utf8"));
}

test("Yu training registry contains only rights-reviewed adopted sources", () => {
  const adopted = registry.sources.filter((source) => source.status === "adopted");
  assert(adopted.length >= 3);
  for (const source of adopted) {
    assert(source.url);
    assert(source.rights);
    assert(source.retrieved);
    assert(source.credibility);
  }
});

test("OpenStax is rejected because its current terms prohibit unpermitted AI training", () => {
  const source = registry.sources.find((item) => item.id === "openstax-writing-guide-2021");
  assert.equal(source.status, "rejected");
  assert.match(source.rights, /prohibiting use in LLM/i);
});

test("English Yu uses the public-domain IES training cycle", () => {
  const curriculum = buildEnglishCoachCurriculum({ action: "begin", grade: 7, genre: "story" });
  assert(curriculum.knowledgeSources.some((title) => title.includes("IES/WWC")));
  assert.match(curriculum.prompt, /Model|Practice|Reflect|strategy/i);
});

test("multilingual English Yu uses public-domain oral-to-written scaffolds without ghostwriting", () => {
  const curriculum = buildEnglishCoachCurriculum({ action: "begin", grade: 6, genre: "story", creatorLevel: "multilingual" });
  assert(curriculum.knowledgeSources.some((title) => title.includes("English Learners")));
  assert.match(curriculum.prompt, /oral rehearsal|empty organizer|sentence frame/i);
  assert.match(curriculum.prompt, /never.*finished prose/i);
});

test("Chinese Yu uses a public-domain classical craft lens without copying source prose", () => {
  const curriculum = buildChineseCoachCurriculum({ action: "begin", genre: "story" });
  assert(curriculum.knowledgeSources.some((title) => title.includes("文心雕龙")));
  assert(curriculum.knowledgeSources.some((title) => title.includes("人间词话")));
  assert.match(curriculum.prompt, /情意|剪裁/);
  assert.match(curriculum.prompt, /人物感受|自然逻辑/);
  assert.doesNotMatch(curriculum.prompt, /文之思也，其神远矣/);
});

test("unclear-rights assessment frameworks remain quarantined", () => {
  const source = registry.sources.find((item) => item.id === "naep-writing-framework-2017");
  assert.equal(source.status, "quarantined");
  assert.match(source.rejectionReason, /No text|未|rights/i);
});

test("English screenwriting training keeps only modern visual-action abstractions", () => {
  const source = registry.sources.find((item) => item.id === "writing-photoplay-1913");
  const module = loadModule("en", "visual-screenwriting-action.json");
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /public domain/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.skills.includes("observable action"));
  assert(module.guardrails.some((item) => /silent-film formatting/i.test(item)));
  assert(module.guardrails.some((item) => /finished scene/i.test(item)));
});

test("ages 8-12 receive one optional plain-language visual-action invitation", () => {
  const module = loadModule("en", "visual-screenwriting-action.json");
  const light = module.ageAdaptations.ages8to12;
  const curriculum = buildEnglishCoachCurriculum({ action: "scene", grade: 4, genre: "story" });
  assert.equal(light.maximumMovesPerTurn, 1);
  assert.equal(light.question, "What can we see or hear your character do?");
  assert(curriculum.methodNames.includes("Visual action · light invitation"));
  assert.match(curriculum.prompt, /What can we see or hear your character do\?/);
  assert.match(curriculum.prompt, /optional|creator prefers/i);
  assert.doesNotMatch(curriculum.prompt, /scene turn|mise-en-scène|shot list/i);
});

test("older creators can receive the full visual-action lens without ghostwriting", () => {
  const curriculum = buildEnglishCoachCurriculum({ action: "scene", grade: 8, genre: "screenplay" });
  assert(curriculum.methodNames.includes("Visual action and scene change"));
  assert.match(curriculum.prompt, /What is different at the end of this scene\?/);
  assert.match(curriculum.prompt, /never supply paste-ready prose/i);
});

test("the English visual-action label never leaks into the Chinese curriculum", () => {
  const curriculum = buildChineseCoachCurriculum({ action: "scene", grade: 4, genre: "screenplay" });
  assert(!curriculum.methodNames.some((name) => /Visual action/i.test(name)));
  assert(curriculum.methodNames.includes("场景与电影化表达"));
});

test("Chinese revision training preserves author voice and limits over-editing", () => {
  const source = registry.sources.find((item) => item.id === "suiyuan-shihua-revision");
  const module = loadModule("zh", "revision-distance.json");
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /public domain worldwide/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.skills.includes("保留作者声音"));
  assert(module.guardrails.some((item) => /修改次数/.test(item)));
  assert(module.guardrails.some((item) => /不提供.*成品文字/.test(item)));
});

test("official standards without broad ingestion rights stay reference-only or quarantined", () => {
  const ccss = registry.sources.find((item) => item.id === "ccss-ela-2010-alignment-only");
  const moe = registry.sources.find((item) => item.id === "moe-cn-chinese-curriculum-2022");
  assert.equal(ccss.status, "reference-only");
  assert.match(ccss.rejectionReason, /No standard text|未摄取|ingested/i);
  assert.equal(moe.status, "quarantined");
  assert.match(moe.rejectionReason, /No curriculum text|未|rights/i);
  assert.match(moe.rejectionReason, /external alignment reference only/i);
});

test("English clarity coaching uses the CC0 GSA source without making active voice a universal rule", () => {
  const source = registry.sources.find((item) => item.id === "gsa-plain-language-2025");
  const module = loadModule("en", "audience-clarity.json");
  const curriculum = buildEnglishCoachCurriculum({ action: "check", grade: 7, genre: "essay" });
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /CC0 1\.0/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.guardrails.some((item) => /universal literary rules/i.test(item)));
  assert(curriculum.methodNames.includes("Audience clarity and paraphrase check"));
  assert.match(curriculum.prompt, /who-does-what check/i);
});

test("English grammar coaching uses the public-domain 1920 Elements of Style with modern authorship guardrails", () => {
  const source = registry.sources.find((item) => item.id === "strunk-elements-style-1920");
  const modernSource = registry.sources.find((item) => item.id === "excelsior-owl-grammar-essentials-2025");
  const module = loadModule("en", "sentence-grammar-integrity.json");
  const curriculum = buildEnglishCoachCurriculum({ action: "check", grade: 7, genre: "story" });
  assert.equal(source.status, "adopted");
  assert.equal(modernSource.status, "adopted");
  assert.match(modernSource.rights, /CC BY 4\.0/i);
  assert.match(source.rights, /public domain/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.sourceIds.includes(modernSource.id));
  assert(module.skills.includes("recurring-error triage"));
  assert(module.skills.includes("modifier attachment"));
  assert(module.guardrails.some((item) => /dialect|multilingual/i.test(item)));
  assert(module.guardrails.some((item) => /one grammar pattern per turn/i.test(item)));
  assert(curriculum.methodNames.includes("Sentence grammar and meaning check"));
  assert(curriculum.knowledgeSources.some((title) => title.includes("The Elements of Style")));
  assert(curriculum.knowledgeSources.some((title) => title.includes("Grammar Essentials")));
  assert.match(curriculum.prompt, /smallest corrected version/i);
  assert.match(curriculum.prompt, /group repeated instances/i);
  assert.match(curriculum.prompt, /universal artistic rules/i);
});

test("Chinese clarity coaching uses a public-domain material-focus-reader check", () => {
  const source = registry.sources.find((item) => item.id === "liang-qichao-composition-method");
  const module = loadModule("zh", "material-focus-reader.json");
  const curriculum = buildChineseCoachCurriculum({ action: "check", genre: "essay" });
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /public domain/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.guardrails.some((item) => /不替创作者/.test(item)));
  assert(curriculum.methodNames.includes("材料、主眼与读者复述"));
  assert.match(curriculum.prompt, /必要、可选与偏题/);
});

test("Chinese continuity coaching labels paragraph jobs without importing exam formulas", () => {
  const source = registry.sources.find((item) => item.id === "wenzhang-guifan-structure");
  const module = loadModule("zh", "paragraph-function-and-balance.json");
  const curriculum = buildChineseCoachCurriculum({ action: "continuity", genre: "essay" });
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /public domain worldwide/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.skills.includes("段落功能"));
  assert(module.guardrails.some((item) => /科举应试/.test(item)));
  assert(curriculum.methodNames.includes("段落任务与篇章关节"));
  assert.match(curriculum.prompt, /这一段在完成什么任务/);
  assert.doesNotMatch(curriculum.prompt, /场屋程文|熟读暗记/);
});

test("English argument coaching uses Oregon State's CC BY inquiry and listening method", () => {
  const source = registry.sources.find((item) => item.id === "oregon-state-good-argument-2022");
  const module = loadModule("en", "argument-inquiry-and-listening.json");
  const curriculum = buildEnglishCoachCurriculum({ action: "report", grade: 9, genre: "essay" });
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /CC BY 4\.0/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.skills.includes("ethical argument"));
  assert(module.guardrails.some((item) => /invent evidence/i.test(item)));
  assert(curriculum.methodNames.includes("Argument inquiry and ethical listening"));
  assert(curriculum.knowledgeSources.some((title) => title.includes("A Dam Good Argument")));
  assert.match(curriculum.prompt, /where does the real disagreement begin/i);
  assert.match(curriculum.prompt, /never invent evidence/i);
});

test("Chinese screenplay coaching uses a bounded public-domain drama and dialogue lens", () => {
  const source = registry.sources.find((item) => item.id === "xianqing-ouji-drama-craft");
  const module = loadModule("zh", "drama-spine-and-dialogue.json");
  const curriculum = buildChineseCoachCurriculum({ action: "dialogue", genre: "screenplay", creatorLevel: "developing" });
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /public domain worldwide/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.skills.includes("角色化对白"));
  assert(module.guardrails.some((item) => /方言/.test(item)));
  assert(curriculum.methodNames.includes("戏剧主线与角色对白"));
  assert(curriculum.knowledgeSources.some((title) => title.includes("闲情偶寄")));
  assert.match(curriculum.prompt, /遮住人物名字朗读/);
  assert.match(curriculum.prompt, /不能依靠人物标签、方言高低或刻板身份/);
});

test("English continuity coaching treats peer feedback as evidence while the creator keeps authorship", () => {
  const source = registry.sources.find((item) => item.id === "uh-english-composition-feedback-2019");
  const module = loadModule("en", "collaborative-feedback-ownership.json");
  const curriculum = buildEnglishCoachCurriculum({ action: "continuity", grade: 7, genre: "story" });
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /CC BY 4\.0/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.skills.includes("authorship ownership"));
  assert(module.guardrails.some((item) => /final revision decision|majority vote/i.test(item)));
  assert(curriculum.methodNames.includes("Collaborative feedback and creator choice"));
  assert(curriculum.knowledgeSources.some((title) => title.includes("University of Hawai‘i")));
  assert.match(curriculum.prompt, /observation, a question, or a suggestion/i);
  assert.match(curriculum.prompt, /creator makes the final revision decision/i);
});

test("Chinese detail coaching uses a public-domain metaphor meaning check only from upper elementary", () => {
  const source = registry.sources.find((item) => item.id === "wenze-metaphor-meaning");
  const module = loadModule("zh", "metaphor-meaning-check.json");
  const older = buildChineseCoachCurriculum({ action: "details", grade: 6, genre: "story" });
  const younger = buildChineseCoachCurriculum({ action: "details", grade: 3, genre: "story" });
  assert.equal(source.status, "adopted");
  assert.match(source.rights, /public domain worldwide/i);
  assert(module.sourceIds.includes(source.id));
  assert(module.skills.includes("读者推断"));
  assert(module.guardrails.some((item) => /不替创作者发明/.test(item)));
  assert(older.methodNames.includes("比喻、意思与读者理解"));
  assert(older.knowledgeSources.some((title) => title.includes("文则")));
  assert.match(older.prompt, /这两个东西最像的地方是什么/);
  assert(!younger.methodNames.includes("比喻、意思与读者理解"));
});
