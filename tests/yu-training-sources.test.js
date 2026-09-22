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
