const test = require("node:test");
const assert = require("node:assert/strict");
const { safeHttpHeader } = require("../http-header-safety");

test("OpenRouter header values fall back when an environment title contains Unicode", () => {
  assert.equal(safeHttpHeader("StoriesLens 中文共创", "StoriesLens"), "StoriesLens");
  assert.equal(safeHttpHeader("StoriesLens", "StoriesLens"), "StoriesLens");
});
