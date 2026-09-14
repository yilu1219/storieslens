"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { buildEnglishCoachCurriculum } = require("../english-writing-coach");
const { buildChineseCoachCurriculum } = require("../chinese-writing-coach");

const registryPath = path.join(__dirname, "..", "resources", "yu-training", "sources", "registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

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

test("Chinese Yu uses a public-domain classical craft lens without copying source prose", () => {
  const curriculum = buildChineseCoachCurriculum({ action: "begin", genre: "story" });
  assert(curriculum.knowledgeSources.some((title) => title.includes("文心雕龙")));
  assert.match(curriculum.prompt, /情意|剪裁/);
  assert.doesNotMatch(curriculum.prompt, /文之思也，其神远矣/);
});
