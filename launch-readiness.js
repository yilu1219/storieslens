const fs = require("fs");
const path = require("path");

const VALID_REGIONS = ["cn", "us", "intl"];

function enabled(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function csv(value) {
  return [...new Set(String(value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

function inviteRegions(value) {
  return [...new Set(String(value || "").split(";").map((entry) => entry.trim().split(":")[0]?.toLowerCase()).filter((region) => VALID_REGIONS.includes(region)))];
}

function isHttpsOrigin(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && !["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function gate(id, label, ready, action, category = "required") {
  return { id, label, ready: Boolean(ready), action, category };
}

function evaluateLaunchReadiness({ root, mediaStorageStatus = {}, env = process.env } = {}) {
  const allowedRegions = csv(env.ALLOWED_ACCOUNT_REGIONS).filter((region) => VALID_REGIONS.includes(region));
  const requiredRegions = csv(env.MEDIA_REQUIRED_REGIONS).filter((region) => VALID_REGIONS.includes(region));
  const configuredInviteRegions = inviteRegions(env.BETA_INVITE_CODE_HASHES);
  const intlCountries = csv(env.ALLOWED_INTL_COUNTRY_CODES).map((country) => country.toUpperCase());
  const publicOrigin = env.PUBLIC_BASE_URL || env.OPENROUTER_SITE_URL;
  const legalFiles = ["privacy-policy.html", "terms-of-use.html", "child-safety-notice.html"];
  const hasLegalFiles = Boolean(root) && legalFiles.every((file) => fs.existsSync(path.join(root, file)));
  const hasSafetyKey = Boolean(env.OPENAI_MODERATION_API_KEY || env.OPENAI_API_KEY || env.OPENROUTER_API_KEY);
  const hasArtworkReviewKey = Boolean(env.OPENAI_API_KEY || env.OPENROUTER_API_KEY);
  const storageReady = allowedRegions.length > 0 && allowedRegions.every((region) => mediaStorageStatus[region] === "cloud-private");
  const requiredMatchesAllowed = allowedRegions.length > 0 && allowedRegions.every((region) => requiredRegions.includes(region));
  const invitesReady = allowedRegions.length > 0 && allowedRegions.every((region) => configuredInviteRegions.includes(region));

  const required = [
    gate("production-runtime", "Production runtime", env.NODE_ENV === "production", "Set NODE_ENV=production on the production host."),
    gate("https-origin", "HTTPS public origin", isHttpsOrigin(publicOrigin), "Set PUBLIC_BASE_URL to the live https:// domain."),
    gate("regional-storage", "Private storage in every open region", storageReady && requiredMatchesAllowed, "Configure private CN, US and selected international buckets; open only passing regions."),
    gate("otp-delivery", "Private sign-in code delivery", Boolean(env.AUTH_DELIVERY_WEBHOOK_URL && env.AUTH_DELIVERY_WEBHOOK_SECRET), "Connect a production email/SMS delivery webhook and secret."),
    gate("invite-only", "Invitation-only beta", enabled(env.BETA_INVITE_ONLY) && invitesReady, "Enable BETA_INVITE_ONLY and add a hashed invite code for every open region."),
    gate("country-allowlist", "International country allowlist", !allowedRegions.includes("intl") || intlCountries.length > 0, "List the exact non-US/non-China countries allowed in the first international cohort."),
    gate("minor-account-owner", "Adult-owned accounts for young creators", enabled(env.BETA_ADULT_ACCOUNT_OWNER_ONLY), "For the first beta, require the parent/guardian to own the account."),
    gate("private-sharing", "Public discovery disabled", !enabled(env.PUBLIC_STORY_DISCOVERY_ENABLED), "Keep discovery off; allow expiring invite links only."),
    gate("real-person-uploads", "Real-person photo mode disabled", !enabled(env.REAL_PERSON_PHOTO_UPLOADS_ENABLED), "Keep real-person photo transformation off until verified consent and deletion are independently audited."),
    gate("customer-training", "Customer content excluded from model training", !enabled(env.USE_CUSTOMER_CONTENT_FOR_TRAINING), "Keep customer content out of training by default."),
    gate("external-safety", "Fail-closed text and media safety", enabled(env.REQUIRE_EXTERNAL_TEXT_MODERATION) && enabled(env.REQUIRE_EXTERNAL_MEDIA_MODERATION) && hasSafetyKey && hasArtworkReviewKey, "Connect external text, image and artwork review keys and keep both required flags true."),
    gate("rate-limits", "Abuse and cost rate limits", enabled(env.BETA_RATE_LIMIT_ENABLED) && Boolean(env.RATE_LIMIT_SECRET), "Enable beta rate limits and add a long random server secret."),
    gate("account-deletion", "Account and media deletion", enabled(env.ACCOUNT_DELETION_ENABLED), "Enable the tested account deletion endpoint before inviting families."),
    gate("legal-review", "Privacy, child-safety and terms review", hasLegalFiles && enabled(env.LEGAL_REVIEW_APPROVED) && Boolean(env.LEGAL_CONTACT_EMAIL), "Review the three beta notices with qualified counsel, add a contact email, then record approval."),
    gate("launch-enforcement", "Server launch lock enabled", enabled(env.ENFORCE_LAUNCH_GATES), "Set ENFORCE_LAUNCH_GATES=true so a failing production configuration cannot start.")
  ];

  const advisory = [
    gate("payments", "Paid checkout", ["STRIPE_STORY_PASS_URL", "STRIPE_GUIDED_SQUAD_URL", "STRIPE_MOVIE_30_URL", "STRIPE_MOVIE_60_URL"].some((key) => Boolean(env[key])), "Optional for a free beta. Connect verified checkout links before charging.", "advisory"),
    gate("wechat", "WeChat account connection", Boolean(env.WECHAT_APP_ID && env.WECHAT_APP_SECRET), "Optional for web beta; required for a later Mini Program.", "advisory"),
    gate("monitoring", "Production error alerting", Boolean(env.ERROR_REPORTING_WEBHOOK_URL), "Strongly recommended: send server failures to a private founder alert channel.", "advisory"),
    gate("render-worker", "Private movie render worker", Boolean(env.HYPERFRAMES_BIN), "Optional at sign-up; required before promising downloadable films.", "advisory")
  ];

  const failedRequired = required.filter((item) => !item.ready);
  return {
    ready: failedRequired.length === 0,
    mode: env.NODE_ENV === "production" ? "production" : "local-development",
    checkedAt: new Date().toISOString(),
    allowedRegions,
    intlCountries,
    summary: {
      requiredPassed: required.length - failedRequired.length,
      requiredTotal: required.length,
      advisoryPassed: advisory.filter((item) => item.ready).length,
      advisoryTotal: advisory.length
    },
    required,
    advisory
  };
}

function assertLaunchReady(options) {
  const report = evaluateLaunchReadiness(options);
  if (!report.ready) {
    const failed = report.required.filter((item) => !item.ready).map((item) => item.label).join(", ");
    const error = new Error(`Production launch gate blocked startup: ${failed}.`);
    error.code = "LAUNCH_GATE_BLOCKED";
    error.report = report;
    throw error;
  }
  return report;
}

module.exports = { VALID_REGIONS, assertLaunchReady, evaluateLaunchReadiness };
