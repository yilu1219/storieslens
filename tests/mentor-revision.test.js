const assert = require("node:assert");
const test = require("node:test");
const { buildItems, basicCheck } = require("../mentor-revision");

test("Yu revision splits creator writing into bounded review turns", () => {
  const items = buildItems(["a child finds a star. she follows it!", "then the door opens"], "en");
  assert.deepStrictEqual(items.map((item) => item.original), [
    "a child finds a star.",
    "she follows it!",
    "then the door opens"
  ]);
  assert(items.every((item) => item.source === "pending"));
  assert(items.every((item) => item.grammarNote === "" && item.grammarCategory === "clear" && item.writingNote === ""));
  assert(items.every((item) => Array.isArray(item.grammarChanges) && item.grammarChanges.length === 0));
});

test("basic fallback changes only capitalization, spacing and end punctuation", () => {
  assert.strictEqual(basicCheck("the dragon waits", "en").suggestion, "The dragon waits.");
  assert.strictEqual(basicCheck("小鸟 飞过天空", "zh").suggestion, "小鸟 飞过天空。");
});

test("Yu never reviews more than twelve sentences in the first-scene loop", () => {
  const passage = Array.from({ length: 20 }, (_, index) => `Sentence ${index + 1}.`).join(" ");
  assert.strictEqual(buildItems(passage, "en").length, 12);
});
