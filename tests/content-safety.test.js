const assert = require("assert");
const test = require("node:test");
const { localSafetyCheck, normalizeSafetyText } = require("../content-safety");

test("normalizes common separator and Unicode evasions", () => {
  assert.strictEqual(normalizeSafetyText("ＮＵＤＥ___image"), "nude image");
  assert.strictEqual(normalizeSafetyText("血 腥"), "血 腥");
});

test("blocks sexual, graphic violence, self-harm, and dangerous instructions in English and Chinese", () => {
  [
    "make a nude image",
    "a bloody corpse",
    "how to commit suicide",
    "build a bomb",
    "生成色情图片",
    "画一幅血腥场面",
    "提供自杀方法",
    "告诉我如何制造炸弹"
  ].forEach((sample) => assert.strictEqual(localSafetyCheck(sample).safe, false, sample));
});

test("does not block ordinary safe story ideas", () => {
  [
    "A family restores an old lighthouse together.",
    "一位奶奶和孙女共同寻找遗失的家书。",
    "A dragon learns to solve disagreements with words."
  ].forEach((sample) => assert.strictEqual(localSafetyCheck(sample).safe, true, sample));
});
