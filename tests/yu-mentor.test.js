"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { WRITING_ANCHORS, LANGUAGE_ANCHORS, selectCCSSAlignment } = require("../ccss-alignment");
const { buildYuMentorCurriculum, YU_MENTOR_CONSTITUTION } = require("../yu-mentor");
const { MAP_LANGUAGE_AREAS, buildMapGrowthProfile } = require("../map-growth-alignment");

test("Yu covers every CCSS writing and language anchor outcome", () => {
  assert.equal(WRITING_ANCHORS.length, 10);
  assert.equal(LANGUAGE_ANCHORS.length, 6);
  assert.deepEqual(WRITING_ANCHORS.map((item) => item.code), Array.from({ length: 10 }, (_, index) => `CCSS.ELA-LITERACY.CCRA.W.${index + 1}`));
  assert.deepEqual(LANGUAGE_ANCHORS.map((item) => item.code), Array.from({ length: 6 }, (_, index) => `CCSS.ELA-LITERACY.CCRA.L.${index + 1}`));
});

test("grade three narrative coaching selects a grade-level narrative target", () => {
  const alignment = selectCCSSAlignment({ grade: "3", skillFocus: "narrative writing" });
  assert.equal(alignment.gradeBand, "3-5");
  assert.equal(alignment.targets[0].gradeCode, "CCSS.ELA-LITERACY.W.3.3");
  assert.match(alignment.status, /not certified or endorsed/);
});

test("high-school argument coaching changes both band and target", () => {
  const alignment = selectCCSSAlignment({ grade: "10", skillFocus: "argument with evidence" });
  assert.equal(alignment.gradeBand, "9-10");
  assert.equal(alignment.targets[0].gradeCode, "CCSS.ELA-LITERACY.W.10.1");
});

test("adult creators are not assigned a school grade", () => {
  const alignment = selectCCSSAlignment({ grade: "adult", skillFocus: "revision" });
  assert.equal(alignment.gradeBand, "adult");
  assert.equal(alignment.targets[0].gradeCode, "CCSS.ELA-LITERACY.CCRA.W.5");
});

test("English Yu uses CCSS and never ghostwrites", () => {
  const curriculum = buildYuMentorCurriculum({ storyLanguage: "en", grade: 7, creatorLevel: "multilingual", genre: "story", action: "hint" });
  assert.equal(curriculum.language, "en");
  assert.equal(curriculum.ccss.gradeBand, "6-8");
  assert.match(curriculum.prompt, /not a ghostwriter/i);
  assert.match(curriculum.prompt, /preserve the creator's intended meaning/i);
});

test("bilingual Yu teaches both traditions without mechanical translation", () => {
  const curriculum = buildYuMentorCurriculum({ storyLanguage: "bilingual", grade: 5, coachLens: "foundation", creatorLevel: "developing", genre: "story" });
  assert(curriculum.english);
  assert(curriculum.chinese);
  assert.match(curriculum.prompt, /Do not mechanically translate/);
  assert.match(curriculum.prompt, /语镜中文创作导师/);
});

test("Yu constitution protects authorship, evidence, safety, and adaptive teaching", () => {
  const rules = YU_MENTOR_CONSTITUTION.join(" ");
  assert.match(rules, /Teach, do not ghostwrite/);
  assert.match(rules, /Use evidence/);
  assert.match(rules, /Adapt by age/);
  assert.match(rules, /minors private and safe/);
});

test("MAP profile covers the official 2025 Language Usage instructional areas", () => {
  assert.deepEqual(Object.keys(MAP_LANGUAGE_AREAS), ["genre", "craft", "process", "grammar", "mechanics"]);
});

test("MAP-informed coaching never invents a RIT score", () => {
  const profile = buildMapGrowthProfile({ grade: 7, skillFocus: "punctuation", mapReadiness: "emerging" });
  assert.equal(profile.instructionalArea.id, "mechanics");
  assert.equal(profile.adaptiveStep.id, "emerging");
  assert.equal(profile.reportedRit, null);
  assert.match(profile.prompt, /Do not invent a RIT score/);
});

test("a student-provided MAP result is preserved without converting it to a grade", () => {
  const profile = buildMapGrowthProfile({ grade: 6, skillFocus: "revision for audience", mapRitLow: 204, mapRitHigh: 212 });
  assert.equal(profile.instructionalArea.id, "process");
  assert.deepEqual(profile.reportedRit.range, [204, 212]);
  assert.match(profile.status, /not an NWEA score estimate/);
});

test("manual Learning Profile area ids select the exact requested instructional area", () => {
  const profile = buildMapGrowthProfile({ grade: 6, mapInstructionalArea: "craft", mapRitLow: 204, mapRitHigh: 212 });
  assert.equal(profile.instructionalArea.id, "craft");
  assert.deepEqual(profile.reportedRit.range, [204, 212]);
});

test("English Yu includes both CCSS outcomes and MAP-informed adaptation", () => {
  const curriculum = buildYuMentorCurriculum({ storyLanguage: "en", grade: 8, skillFocus: "structure and transitions", mapReadiness: "secure" });
  assert(curriculum.ccss);
  assert(curriculum.mapGrowth);
  assert.equal(curriculum.mapGrowth.instructionalArea.id, "craft");
  assert.equal(curriculum.mapGrowth.adaptiveStep.id, "secure");
});
