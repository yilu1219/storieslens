const assert = require("assert");
const test = require("node:test");
const { checkImageSafety, checkTextSafety, extractOpenRouterJson, imageRequestSafetyText, isModerationResultBlocked, isTextModerationResultBlocked, localSafetyCheck, normalizeSafetyText } = require("../content-safety");

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

test("image safety reviews the child's words instead of protective identity boilerplate", () => {
  const story = "We are going to Lego Land. Louis is 7, Leo is 4, and they cannot find the key home.";
  const prompt = `${story}\nPreserve each child's exact face, age, clothing, and body proportions from the approved private photo.`;
  assert.strictEqual(imageRequestSafetyText({ studentWriting: story }, prompt), story);
  assert.strictEqual(imageRequestSafetyText({}, prompt), prompt);
});

test("ordinary adult and minor portrait noise is tolerated while flagged and material child-sexual signals stay blocked", () => {
  assert.strictEqual(isModerationResultBlocked({ flagged: false, category_scores: { sexual: 0.04 } }), false);
  assert.strictEqual(isModerationResultBlocked({ flagged: false, category_scores: { "sexual/minors": 0.01 } }), false);
  assert.strictEqual(isModerationResultBlocked({ flagged: true, category_scores: { sexual: 0.001 } }), true);
  assert.strictEqual(isModerationResultBlocked({ flagged: false, category_scores: { "sexual/minors": 0.04 } }), true);
});

test("ordinary story text is not blocked by tiny moderation scores", () => {
  assert.strictEqual(isTextModerationResultBlocked({ flagged: false, categories: {}, category_scores: { violence: 0.08, "sexual/minors": 0.04 } }), false);
  assert.strictEqual(isTextModerationResultBlocked({ flagged: true, categories: { violence: true }, category_scores: { violence: 0.08 } }), true);
  assert.strictEqual(isTextModerationResultBlocked({ flagged: false, categories: { violence: true }, category_scores: { violence: 0.0001 } }), false);
  assert.strictEqual(isTextModerationResultBlocked({ categories: { "self-harm": true } }), true);
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
    assert.strictEqual(JSON.parse(options.body).model, process.env.OPENROUTER_SAFETY_MODEL || "openai/gpt-4o-mini");
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"safe":true}' } }] }) };
  };
  const result = await checkImageSafety("data:image/webp;base64,AAAA", { requireExternal: true });
  assert.deepStrictEqual(result, { available: true, safe: true, source: "openrouter-safety" });
});

test("a safe family photo prompt can recover from an over-broad first moderation verdict", async (context) => {
  const originalFetch = global.fetch;
  const originalRouterKey = process.env.OPENROUTER_API_KEY;
  const originalOpenAiKey = process.env.OPENAI_API_KEY;
  const originalModerationKey = process.env.OPENAI_MODERATION_API_KEY;
  context.after(() => {
    global.fetch = originalFetch;
    if (originalRouterKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalRouterKey;
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalOpenAiKey;
    if (originalModerationKey === undefined) delete process.env.OPENAI_MODERATION_API_KEY; else process.env.OPENAI_MODERATION_API_KEY = originalModerationKey;
  });
  process.env.OPENAI_MODERATION_API_KEY = "moderation-test-key";
  process.env.OPENROUTER_API_KEY = "router-test-key";
  global.fetch = async (url, options) => {
    if (String(url).includes("api.openai.com/v1/moderations")) {
      return {
        ok: true,
        json: async () => ({ results: [{ flagged: true, categories: { "sexual/minors": true } }] })
      };
    }
    const requestBody = JSON.parse(options.body);
    assert.match(requestBody.messages[1].content, /family-friendly image instruction/i);
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"safe":true}' } }] }) };
  };
  const result = await checkTextSafety(
    "Family-friendly story picture of Louis, age 7, and Leo, age 4. Preserve each face, age, clothing, and body proportions.",
    { requireExternal: true }
  );
  assert.deepStrictEqual(result, { available: true, safe: true, source: "openai+openrouter-adjudicated" });
});

test("independent moderation agreement still blocks genuinely unsafe media prompts", async (context) => {
  const originalFetch = global.fetch;
  const originalRouterKey = process.env.OPENROUTER_API_KEY;
  const originalModerationKey = process.env.OPENAI_MODERATION_API_KEY;
  context.after(() => {
    global.fetch = originalFetch;
    if (originalRouterKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = originalRouterKey;
    if (originalModerationKey === undefined) delete process.env.OPENAI_MODERATION_API_KEY; else process.env.OPENAI_MODERATION_API_KEY = originalModerationKey;
  });
  process.env.OPENAI_MODERATION_API_KEY = "moderation-test-key";
  process.env.OPENROUTER_API_KEY = "router-test-key";
  global.fetch = async (url) => String(url).includes("api.openai.com/v1/moderations")
    ? { ok: true, json: async () => ({ results: [{ flagged: true, categories: { "sexual/minors": true } }] }) }
    : { ok: true, json: async () => ({ choices: [{ message: { content: '{"safe":false}' } }] }) };
  const result = await checkTextSafety("A coded request that both independent reviewers classify as unsafe.", { requireExternal: true });
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.source, "omni-moderation-latest");
});
