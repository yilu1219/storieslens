const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { assertLaunchReady, evaluateLaunchReadiness } = require("../launch-readiness");

function readyEnvironment() {
  return {
    NODE_ENV: "production",
    PUBLIC_BASE_URL: "https://www.storieslens.com",
    ALLOWED_ACCOUNT_REGIONS: "cn,us,intl",
    MEDIA_REQUIRED_REGIONS: "cn,us,intl",
    CHINA_ARK_API_KEY: "server-only-ark-key",
    CHINA_ARK_TEXT_MODEL: "doubao-seed-2-0-lite-260215",
    CHINA_ARK_IMAGE_MODEL: "doubao-seedream-5-0-lite-260128",
    AUTH_DELIVERY_WEBHOOK_URL: "https://delivery.example.test/send",
    AUTH_DELIVERY_WEBHOOK_SECRET: "private-secret",
    BETA_INVITE_ONLY: "true",
    BETA_INVITE_CODE_HASHES: `cn:founders:${"a".repeat(64)};us:founders:${"b".repeat(64)};intl:founders:${"c".repeat(64)}`,
    ALLOWED_INTL_COUNTRY_CODES: "CA,GB,AU,SG",
    BETA_ADULT_ACCOUNT_OWNER_ONLY: "true",
    PUBLIC_STORY_DISCOVERY_ENABLED: "false",
    REAL_PERSON_PHOTO_UPLOADS_ENABLED: "false",
    USE_CUSTOMER_CONTENT_FOR_TRAINING: "false",
    REQUIRE_EXTERNAL_TEXT_MODERATION: "true",
    REQUIRE_EXTERNAL_MEDIA_MODERATION: "true",
    OPENAI_API_KEY: "server-only-key",
    BETA_RATE_LIMIT_ENABLED: "true",
    RATE_LIMIT_SECRET: "long-random-secret",
    ACCOUNT_DELETION_ENABLED: "true",
    LEGAL_REVIEW_APPROVED: "true",
    LEGAL_CONTACT_EMAIL: "privacy@storieslens.com",
    ENFORCE_LAUNCH_GATES: "true"
  };
}

test("launch gate blocks an unconfigured local environment", () => {
  const report = evaluateLaunchReadiness({ root: path.resolve(__dirname, ".."), mediaStorageStatus: { cn: "local-fallback", us: "local-fallback", intl: "local-fallback" }, env: {} });
  assert.strictEqual(report.ready, false);
  assert(report.required.some((item) => item.id === "regional-storage" && !item.ready));
  assert.throws(() => assertLaunchReady({ root: path.resolve(__dirname, ".."), mediaStorageStatus: {}, env: {} }), /blocked startup/);
});

test("launch gate passes only when every required beta control is configured", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-launch-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  ["privacy-policy.html", "terms-of-use.html", "child-safety-notice.html"].forEach((name) => fs.writeFileSync(path.join(root, name), "reviewed"));
  const report = assertLaunchReady({ root, mediaStorageStatus: { cn: "cloud-private", us: "cloud-private", intl: "cloud-private" }, env: readyEnvironment() });
  assert.strictEqual(report.ready, true);
  assert.strictEqual(report.summary.requiredPassed, report.summary.requiredTotal);
  assert.deepStrictEqual(report.intlCountries, ["CA", "GB", "AU", "SG"]);
});

test("international launch cannot silently mean every country", () => {
  const env = readyEnvironment();
  env.ALLOWED_INTL_COUNTRY_CODES = "";
  const report = evaluateLaunchReadiness({ root: path.resolve(__dirname, ".."), mediaStorageStatus: { cn: "cloud-private", us: "cloud-private", intl: "cloud-private" }, env });
  assert(report.required.some((item) => item.id === "country-allowlist" && !item.ready));
});

test("China launch requires both the domestic text and image route", () => {
  const env = readyEnvironment();
  delete env.CHINA_ARK_IMAGE_MODEL;
  const report = evaluateLaunchReadiness({ root: path.resolve(__dirname, ".."), mediaStorageStatus: { cn: "cloud-private", us: "cloud-private", intl: "cloud-private" }, env });
  assert(report.required.some((item) => item.id === "china-ai-route" && !item.ready));
});

test("OpenRouter can satisfy the external review gate when it is the configured vision provider", () => {
  const env = readyEnvironment();
  delete env.OPENAI_API_KEY;
  env.OPENROUTER_API_KEY = "server-only-openrouter-key";
  const report = evaluateLaunchReadiness({ root: path.resolve(__dirname, ".."), mediaStorageStatus: { cn: "cloud-private", us: "cloud-private", intl: "cloud-private" }, env });
  assert(report.required.some((item) => item.id === "external-safety" && item.ready));
});

test("Resend with a verified sender satisfies the sign-in delivery gate", () => {
  const env = readyEnvironment();
  delete env.AUTH_DELIVERY_WEBHOOK_URL;
  delete env.AUTH_DELIVERY_WEBHOOK_SECRET;
  env.RESEND_API_KEY = "server-only-resend-key";
  env.AUTH_EMAIL_FROM = "StoriesLens <login@storieslens.com>";
  const report = evaluateLaunchReadiness({ root: path.resolve(__dirname, ".."), mediaStorageStatus: { cn: "cloud-private", us: "cloud-private", intl: "cloud-private" }, env });
  assert(report.required.some((item) => item.id === "otp-delivery" && item.ready));
});

test("personal-photo stories pass the launch gate only with account, consent and deletion controls", () => {
  const env = readyEnvironment();
  env.REAL_PERSON_PHOTO_UPLOADS_ENABLED = "true";
  env.REAL_PERSON_PHOTO_REQUIRE_ACCOUNT = "true";
  env.REQUIRE_PERSONAL_PHOTO_CONSENT = "true";
  const passing = evaluateLaunchReadiness({ root: path.resolve(__dirname, ".."), mediaStorageStatus: { cn: "cloud-private", us: "cloud-private", intl: "cloud-private" }, env });
  assert(passing.required.some((item) => item.id === "real-person-uploads" && item.ready));

  env.REQUIRE_PERSONAL_PHOTO_CONSENT = "false";
  const blocked = evaluateLaunchReadiness({ root: path.resolve(__dirname, ".."), mediaStorageStatus: { cn: "cloud-private", us: "cloud-private", intl: "cloud-private" }, env });
  assert(blocked.required.some((item) => item.id === "real-person-uploads" && !item.ready));
});
