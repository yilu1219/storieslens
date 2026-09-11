const test = require("node:test");
const assert = require("node:assert/strict");
const { REVIEW_SCHEMA, extractResponseText, isSupportedSanitizedArtwork } = require("../artwork-safety-server");

test("artwork review accepts only metadata-stripped canvas output formats", () => {
  assert.equal(isSupportedSanitizedArtwork("data:image/webp;base64,AAAA"), true);
  assert.equal(isSupportedSanitizedArtwork("data:image/png;base64,AAAA"), true);
  assert.equal(isSupportedSanitizedArtwork("data:image/jpeg;base64,AAAA"), false);
  assert.equal(isSupportedSanitizedArtwork("https://example.com/child.jpg"), false);
});

test("artwork review schema requires every privacy signal", () => {
  ["is_artwork", "has_real_person", "has_identity_document", "has_personal_name", "has_school_information", "has_contact_information", "reason_code"].forEach((field) => {
    assert(REVIEW_SCHEMA.required.includes(field));
  });
  assert(REVIEW_SCHEMA.properties.reason_code.enum.includes("uncertain"));
});

test("structured artwork review text is extracted without assuming output position", () => {
  const payload = { output: [{ type: "reasoning" }, { type: "message", content: [{ type: "output_text", text: '{"reason_code":"approved"}' }] }] };
  assert.equal(extractResponseText(payload), '{"reason_code":"approved"}');
});
