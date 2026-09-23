"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { applyDeclaredGrammarChanges, grammarSuggestionNeedsRepair } = require("../grammar-review");

const original = "My mom, my brother Leo and me are going to the future city together. My mom Yi, My bother Leo is 4 years old. Louis is 7 years old. We can't find our time machine to come back After school, we decided to go to an adventure.";
const changes = [
  { before: "me", after: "I", skill: "subject pronoun agreement", explanation: "Use I when the person is doing the action." },
  { before: "bother", after: "brother", skill: "spelling", explanation: "Brother is the family word." },
  { before: "come back After", after: "come back. After", skill: "end punctuation", explanation: "A new sentence needs a full stop." },
  { before: "go to an adventure", after: "go on an adventure", skill: "preposition usage", explanation: "We say go on an adventure." }
];

test("detects a model response that lists corrections but returns the original passage", () => {
  assert.equal(grammarSuggestionNeedsRepair(original, original, changes), true);
});

test("applies exact declared corrections without replacing letters inside other words", () => {
  const repaired = applyDeclaredGrammarChanges(original, changes);
  assert.match(repaired, /brother Leo and I are going/);
  assert.match(repaired, /My brother Leo is 4/);
  assert.match(repaired, /come back\. After school/);
  assert.match(repaired, /go on an adventure/);
  assert.match(repaired, /time machine/);
  assert.equal(grammarSuggestionNeedsRepair(original, repaired, changes), false);
});
