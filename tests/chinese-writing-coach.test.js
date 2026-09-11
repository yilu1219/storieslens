const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeCoachPreferences,
  buildChineseCoachCurriculum
} = require("../chinese-writing-coach");
const { selectWritingMethods } = require("../writing-coach-knowledge");

test("Chinese coach preferences reject unknown curriculum values", () => {
  assert.deepEqual(normalizeCoachPreferences({ coachLens: "fake", creatorLevel: "expert", genre: "unknown" }), {
    coachLens: "foundation",
    creatorLevel: "developing",
    genre: "story"
  });
});

test("Lin Yutang lens teaches philosophy without requesting imitation", () => {
  const curriculum = buildChineseCoachCurriculum({
    coachLens: "lin-yutang",
    creatorLevel: "advanced",
    genre: "essay"
  });
  assert.equal(curriculum.lensName, "林语堂文学思想");
  assert.match(curriculum.prompt, /幽默、闲适、性灵/);
  assert.match(curriculum.prompt, /不得仿写林语堂/);
  assert.match(curriculum.prompt, /创作者亲自完成/);
});

test("Chinese learner curriculum separates language correction from literary advice", () => {
  const curriculum = buildChineseCoachCurriculum({ creatorLevel: "l2", genre: "memoir" });
  assert.match(curriculum.prompt, /区分语法修改与文学建议/);
  assert.match(curriculum.prompt, /不替当事人编造经历/);
});

test("beginning a story activates questions for ideation and character", () => {
  const curriculum = buildChineseCoachCurriculum({ action: "begin", genre: "story" });
  assert.deepEqual(curriculum.methodNames.slice(0, 2), ["创意与思维", "人物与转变"]);
  assert.match(curriculum.prompt, /先发散后收束/);
  assert.match(curriculum.prompt, /本轮只选择一个/);
});

test("screenplay coaching combines scene and microfilm economy", () => {
  const methods = selectWritingMethods({ action: "scene", genre: "screenplay" });
  assert.deepEqual(methods.map((method) => method.name), ["场景与电影化表达", "微电影叙事"]);
  const curriculum = buildChineseCoachCurriculum({ action: "scene", genre: "screenplay" });
  assert.match(curriculum.prompt, /进入状态、人物目的、可见行动、阻力/);
  assert.match(curriculum.prompt, /短片只保留一个中心人物/);
});

test("science-fiction coaching tests consequences without enforcing dated prescriptions", () => {
  assert.equal(normalizeCoachPreferences({ genre: "scifi" }).genre, "scifi");
  const curriculum = buildChineseCoachCurriculum({ action: "hint", genre: "scifi" });
  assert.match(curriculum.prompt, /科学、技术或未来社会变化/);
  assert.match(curriculum.prompt, /谁最先受益，谁会付出代价/);
  assert.doesNotMatch(curriculum.prompt, /必须是悲剧/);
  assert.match(curriculum.prompt, /时代性观点、市场判断、刻板印象与绝对化命令不属于课程规范/);
});

test("source-derived curriculum forbids copying and rigid formulas", () => {
  const curriculum = buildChineseCoachCurriculum({ action: "report", genre: "story" });
  assert.match(curriculum.prompt, /不得引用、续写或模仿参考书/);
  assert.match(curriculum.prompt, /不得把英雄旅程、三幕结构或任何流派规则当作唯一正确答案/);
  assert.ok(curriculum.knowledgeSources.length >= 2);
});
