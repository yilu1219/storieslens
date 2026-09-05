const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeCoachPreferences,
  buildChineseCoachCurriculum
} = require("../chinese-writing-coach");

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
