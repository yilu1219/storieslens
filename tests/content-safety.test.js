const assert = require("assert");
const test = require("node:test");
const { checkImageSafety, extractOpenRouterJson, isModerationResultBlocked, localSafetyCheck, normalizeSafetyText } = require("../content-safety");

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

test("ordinary adult and minor portrait noise is tolerated while flagged and material child-sexual signals stay blocked", () => {
  assert.strictEqual(isModerationResultBlocked({ flagged: false, category_scores: { sexual: 0.04 } }), false);
  assert.strictEqual(isModerationResultBlocked({ flagged: false, category_scores: { "sexual/minors": 0.01 } }), false);
  assert.strictEqual(isModerationResultBlocked({ flagged: true, category_scores: { sexual: 0.001 } }), true);
  assert.strictEqual(isModerationResultBlocked({ flagged: false, category_scores: { "sexual/minors": 0.04 } }), true);
});

test("parses a JSON safety verdict from OpenRouter-compatible output", () => {
  assert.deepStrictEqual(extractOpenRouterJson({ choices: [{ message: { content: "```json\n{\"safe\":true}\n```" } }] }), { safe: true });
  assert.strictEqual(extractOpenRouterJson({ choices: [{ message: { content: "uncertain" } }] }), null);
});

test("uses the configured OpenRouter vision model when OpenAI moderation is unavailable", async (context) => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalOpenAiKey = process.env.OPENAI_API_KEY;
  const originalModerationKey = process.env.OPENAI_MODERATION_API_KEY;
  context.after(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalKey;
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalOpenAiKey;
    if (originalModerationKey === undefined) delete process.env.OPENAI_MODERATION_API_KEY; else process.env.OPENAI_MODERATION_API_KEY = originalModerationKey;
  });
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODERATION_API_KEY;
  process.env.OPENROUTER_API_KEY = "test-key";
  global.fetch = async (url, options) => {
    assert.match(String(url), /openrouter\.ai\/api\/v1\/chat\/completions$/);
    assert.match(String(options.headers.Authorization), /^Bearer test-key$/);
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"safe":true}' } }] }) };
  };
  const result = await checkImageSafety("data:image/webp;base64,AAAA", { requireExternal: true });
  assert.deepStrictEqual(result, { available: true, safe: true, source: "openrouter-safety" });
});
