const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { queueHyperframesRender, resolveBinary } = require("./hyperframes-renderer");
const { createRegionalObjectStorage } = require("./regional-object-storage");
const { assertLaunchReady, evaluateLaunchReadiness } = require("./launch-readiness");
const { createRequestRateLimiter } = require("./request-rate-limit");
const {
  ensureCreditCollections,
  publicPackageCatalog,
  walletFor,
  usageSummaryFor,
  grantPackage,
  ensureFreePreview,
  reserveCredits,
  settleReservation,
  releaseReservation,
  createInviteBatch,
  findInvite,
  validateInvite,
  redeemInvite
} = require("./credit-system");

const SESSION_DAYS = 30;
const CHALLENGE_MINUTES = 10;
const MAX_PROJECTS_PER_USER = 100;
const MAX_SCENES = 24;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_GUEST_MEDIA_QUOTA_BYTES = 20 * 1024 * 1024;
const DEFAULT_ACCOUNT_MEDIA_QUOTA_BYTES = 250 * 1024 * 1024;
const REGION_CONSENT_VERSION = "2026-09-14";
const ADMIN_SESSION_HOURS = 12;

const offerCatalog = {
  "story-pass": { name: "Story Pass", price: "$19", packageId: "creator-story", envKey: "STRIPE_STORY_PASS_URL", fallbackUrl: "/beta-interest.html?offer=story-pass" },
  "cocreate-pack": { name: "Invited Co-creation Pack", price: "$39", packageId: "invite-cocreate", envKey: "STRIPE_COCREATE_PACK_URL", fallbackUrl: "/beta-interest.html?offer=cocreate-pack" },
  "teacher-classroom": { name: "Teacher Classroom Project", price: "$79", packageId: "teacher-classroom", envKey: "STRIPE_TEACHER_CLASSROOM_URL", fallbackUrl: "/beta-interest.html?offer=teacher-classroom" },
  "guided-squad": { name: "Guided Story Squad", price: "$49", envKey: "STRIPE_GUIDED_SQUAD_URL", fallbackUrl: "/beta-interest.html?offer=guided-squad" },
  "movie-30": { name: "30-second Movie Pack", price: "$39", packageId: "movie-30", envKey: "STRIPE_MOVIE_30_URL", fallbackUrl: "/beta-interest.html?offer=movie-30" },
  "movie-60": { name: "60-second Movie Pack", price: "$69", packageId: "movie-60", envKey: "STRIPE_MOVIE_60_URL", fallbackUrl: "/beta-interest.html?offer=movie-60" }
};

function nowIso() {
  return new Date().toISOString();
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function cleanText(value, max = 240) {
  return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function cleanId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
}

function cleanUrl(value) {
  const url = cleanText(value, 1800);
  if (!url) return "";
  if (/^https:\/\//i.test(url)) return url;
  if (/^\/(?:api\/media|public\/generated|assets)\//.test(url)) return url;
  return "";
}

function safeJsonValue(value, maxLength = 20_000) {
  if (!value || typeof value !== "object") return {};
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > maxLength) return {};
    return JSON.parse(serialized);
  } catch {
    return {};
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseCookies(request) {
  return Object.fromEntries(String(request.headers.cookie || "").split(";").map((item) => {
    const index = item.indexOf("=");
    if (index < 0) return ["", ""];
    return [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function isSecureRequest(request) {
  return request.socket?.encrypted || String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
}

function setSessionCookie(request, response, sessionId, expiresAt) {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  response.setHeader("Set-Cookie", `storieslens_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}${secure}`);
}

function clearSessionCookie(request, response) {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  response.setHeader("Set-Cookie", `storieslens_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function setAdminCookie(request, response, token, expiresAt) {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  response.setHeader("Set-Cookie", `storieslens_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Expires=${new Date(expiresAt).toUTCString()}${secure}`);
}

function clearAdminCookie(request, response) {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  response.setHeader("Set-Cookie", `storieslens_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

function maskDestination(method, destination) {
  if (method === "email") {
    const [name, domain] = destination.split("@");
    return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
  }
  return `${destination.slice(0, 3)}****${destination.slice(-4)}`;
}

function validateDestination(method, value) {
  const destination = cleanText(value, 160).toLowerCase();
  if (method === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) return destination;
  if (method === "phone" && /^\+?[0-9]{7,15}$/.test(destination.replace(/[\s()-]/g, ""))) return destination.replace(/[\s()-]/g, "");
  return "";
}

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function positiveIntegerEnvironment(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function mediaQuotaFor(user) {
  return user?.kind === "account"
    ? positiveIntegerEnvironment("MEDIA_ACCOUNT_QUOTA_BYTES", DEFAULT_ACCOUNT_MEDIA_QUOTA_BYTES)
    : positiveIntegerEnvironment("MEDIA_GUEST_QUOTA_BYTES", DEFAULT_GUEST_MEDIA_QUOTA_BYTES);
}

function mediaUsageFor(database, user) {
  const bytesUsed = database.media.filter((item) => item.ownerId === user.id).reduce((total, item) => total + Math.max(0, Number(item.bytes) || 0), 0);
  const bytesLimit = mediaQuotaFor(user);
  return {
    bytesUsed,
    bytesLimit,
    bytesRemaining: Math.max(0, bytesLimit - bytesUsed),
    percentUsed: Math.min(100, Math.round((bytesUsed / bytesLimit) * 100)),
    plan: user.kind === "account" ? "private-beta" : "private-guest"
  };
}

function regionProfile(value) {
  const primaryRegion = ["cn", "us", "intl"].includes(value) ? value : "";
  if (!primaryRegion) return null;
  if (primaryRegion === "cn") return { primaryRegion, dataRegion: "cn", aiProviderRoute: "china" };
  if (primaryRegion === "us") return { primaryRegion, dataRegion: "us", aiProviderRoute: "us" };
  return { primaryRegion, dataRegion: "intl", aiProviderRoute: "international" };
}

function configuredRegistrationRegions() {
  const configured = String(process.env.ALLOWED_ACCOUNT_REGIONS || "").split(",").map((region) => region.trim().toLowerCase()).filter(Boolean);
  return configured.length ? configured.filter((region) => ["cn", "us", "intl"].includes(region)) : ["cn", "us", "intl"];
}

function normalizeInviteCode(value) {
  return cleanText(value, 120).replace(/\s+/g, "").toUpperCase();
}

function configuredBetaInvites() {
  return String(process.env.BETA_INVITE_CODE_HASHES || "").split(";").map((raw) => {
    const parts = raw.trim().split(":");
    if (parts.length === 2) return { region: parts[0].toLowerCase(), cohort: "founding-beta", fingerprint: parts[1].toLowerCase() };
    return { region: parts[0]?.toLowerCase(), cohort: cleanId(parts[1]) || "founding-beta", fingerprint: parts[2]?.toLowerCase() };
  }).filter((entry) => ["cn", "us", "intl"].includes(entry.region) && /^[a-f0-9]{64}$/.test(entry.fingerprint || ""));
}

function allowedInternationalCountries() {
  return [...new Set(String(process.env.ALLOWED_INTL_COUNTRY_CODES || "").split(",").map((country) => country.trim().toUpperCase()).filter((country) => /^[A-Z]{2}$/.test(country) && !["CN", "US"].includes(country)))];
}

function countryForRegion(region, value) {
  if (region === "cn") return "CN";
  if (region === "us") return "US";
  const country = cleanText(value, 2).toUpperCase();
  return /^[A-Z]{2}$/.test(country) && !["CN", "US"].includes(country) ? country : "";
}

function createStore(root) {
  const dataDirectory = process.env.PLATFORM_DATA_DIR ? path.resolve(process.env.PLATFORM_DATA_DIR) : path.join(root, ".data");
  const mediaDirectory = path.join(dataDirectory, "media");
  const databasePath = path.join(dataDirectory, "platform.json");
  fs.mkdirSync(mediaDirectory, { recursive: true, mode: 0o700 });

  const empty = () => ({
    version: 1,
    users: [],
    sessions: [],
    authChallenges: [],
    projects: [],
    media: [],
    guardianConsents: [],
    shares: [],
    orders: [],
    renderJobs: [],
    notificationSubscriptions: [],
    productEvents: [],
    betaInviteRedemptions: [],
    creditTransactions: [],
    creditReservations: [],
    creditSales: [],
    modelUsageEvents: [],
    inviteBatches: [],
    inviteCodes: [],
    adminSessions: []
  });

  function read() {
    if (!fs.existsSync(databasePath)) return empty();
    try {
      return { ...empty(), ...JSON.parse(fs.readFileSync(databasePath, "utf8")) };
    } catch {
      const corruptPath = `${databasePath}.corrupt-${Date.now()}`;
      fs.renameSync(databasePath, corruptPath);
      return empty();
    }
  }

  function write(database) {
    const temporaryPath = `${databasePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporaryPath, databasePath);
  }

  function mutate(callback) {
    const database = read();
    const result = callback(database);
    write(database);
    return result;
  }

  return { dataDirectory, mediaDirectory, read, mutate };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    kind: user.kind,
    displayName: user.displayName || "Creator",
    ageGroup: user.ageGroup || "unknown",
    locale: user.locale || "en",
    primaryRegion: user.primaryRegion || "",
    countryCode: user.countryCode || "",
    betaCohort: user.betaAccess?.cohort || "",
    dataRegion: user.dataRegion || "unassigned",
    signInMethod: user.signInMethod || "guest",
    maskedDestination: user.maskedDestination || "",
    createdAt: user.createdAt
  };
}

function cleanScene(scene, index) {
  return {
    id: cleanId(scene?.id) || `scene-${index + 1}`,
    title: cleanText(scene?.title || `Scene ${index + 1}`, 120),
    text: cleanText(scene?.text || scene?.caption, 6000),
    caption: cleanText(scene?.caption || scene?.text, 600),
    imageUrl: cleanUrl(scene?.imageUrl),
    videoUrl: cleanUrl(scene?.videoUrl),
    narrationMediaId: cleanId(scene?.narrationMediaId),
    duration: Math.max(2, Math.min(12, Number(scene?.duration) || 5)),
    transition: ["cut", "fade", "dissolve"].includes(scene?.transition) ? scene.transition : "fade"
  };
}

function normalizeProject(input, existing = {}) {
  const ageGroup = ["under18", "adult", "unknown"].includes(input.ageGroup) ? input.ageGroup : (existing.ageGroup || "unknown");
  const visibility = ageGroup === "under18" ? "private" : (["private", "invite"].includes(input.visibility) ? input.visibility : (existing.visibility || "private"));
  const rawScenes = Array.isArray(input.scenes) ? input.scenes : (existing.scenes || []);
  return {
    ...existing,
    title: cleanText(input.title ?? existing.title ?? "My Story", 160) || "My Story",
    language: ["en", "zh", "bilingual"].includes(input.language) ? input.language : (existing.language || "en"),
    mode: ["solo", "squad", "classroom", "family"].includes(input.mode) ? input.mode : (existing.mode || "solo"),
    ageGroup,
    visibility,
    sourceType: ["artwork", "text", "voice", "inspiration", "classroom"].includes(input.sourceType) ? input.sourceType : (existing.sourceType || "text"),
    sourceText: cleanText(input.sourceText ?? existing.sourceText, 6000),
    draft: cleanText(input.draft ?? existing.draft, 40_000),
    storyDna: safeJsonValue(input.storyDna ?? existing.storyDna, 24_000),
    coachHistory: (Array.isArray(input.coachHistory) ? input.coachHistory : (existing.coachHistory || [])).slice(-30).map((entry) => ({
      role: entry?.role === "coach" ? "coach" : "creator",
      text: cleanText(entry?.text, 1800),
      createdAt: cleanText(entry?.createdAt, 40) || nowIso()
    })),
    scenes: rawScenes.slice(0, MAX_SCENES).map(cleanScene),
    coverImageUrl: cleanUrl(input.coverImageUrl ?? existing.coverImageUrl),
    clientSnapshot: safeJsonValue(input.clientSnapshot ?? existing.clientSnapshot, 120_000)
  };
}

function createPlatformApi({ root, sendJson, readJsonBody, enforceTextSafety, enforceImageSafety, reviewArtworkSafety }) {
  const store = createStore(root);
  const mediaStorage = createRegionalObjectStorage({ mediaDirectory: store.mediaDirectory });
  const rateLimiter = createRequestRateLimiter();
  if (process.env.NODE_ENV === "production" && process.env.MEDIA_REQUIRED_REGIONS) {
    mediaStorage.assertReady(process.env.MEDIA_REQUIRED_REGIONS);
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOWED_ACCOUNT_REGIONS) {
    mediaStorage.assertReady(process.env.ALLOWED_ACCOUNT_REGIONS);
  }
  if (process.env.NODE_ENV === "production" && process.env.ENFORCE_LAUNCH_GATES === "true") {
    assertLaunchReady({ root, mediaStorageStatus: mediaStorage.status() });
  }

  function publicMedia(media) {
    return {
      id: media.id,
      projectId: media.projectId,
      kind: media.kind,
      mimeType: media.mimeType,
      bytes: media.bytes,
      private: true,
      metadataRemoved: media.metadataRemoved,
      storageRegion: media.storageRegion || "local",
      createdAt: media.createdAt,
      url: `/api/media/${media.id}`
    };
  }

  function sessionFor(request, response, { create = true } = {}) {
    const cookieId = cleanId(parseCookies(request).storieslens_session);
    const database = store.read();
    let session = database.sessions.find((item) => item.id === cookieId && new Date(item.expiresAt) > new Date());
    let user = session ? database.users.find((item) => item.id === session.userId) : null;
    if (session && user) {
      if (create && !database.creditTransactions?.some((entry) => entry.userId === user.id && entry.packageId === "free-preview")) {
        return store.mutate((nextDatabase) => {
          ensureCreditCollections(nextDatabase);
          ensureFreePreview(nextDatabase, user.id);
          return { database: nextDatabase, session, user };
        });
      }
      return { database, session, user };
    }
    if (!create) return { database, session, user };

    return store.mutate((nextDatabase) => {
      ensureCreditCollections(nextDatabase);
      const createdAt = nowIso();
      user = { id: crypto.randomUUID(), kind: "guest", displayName: "Creator", ageGroup: "unknown", locale: "en", signInMethod: "guest", createdAt, updatedAt: createdAt };
      session = { id: crypto.randomBytes(24).toString("hex"), userId: user.id, createdAt, expiresAt: addDays(new Date(), SESSION_DAYS) };
      nextDatabase.users.push(user);
      nextDatabase.sessions.push(session);
      ensureFreePreview(nextDatabase, user.id);
      setSessionCookie(request, response, session.id, session.expiresAt);
      return { database: nextDatabase, session, user };
    });
  }

  function requireProject(database, user, projectId) {
    return database.projects.find((project) => project.id === projectId && project.ownerId === user.id && !project.deletedAt);
  }

  function configuredAdminKeyHash() {
    const configuredHash = cleanText(process.env.ADMIN_ACCESS_KEY_SHA256, 64).toLowerCase();
    if (/^[a-f0-9]{64}$/.test(configuredHash)) return configuredHash;
    const localKey = String(process.env.ADMIN_ACCESS_KEY || "");
    return localKey.length >= 16 ? hashValue(localKey) : "";
  }

  function matchesAdminKey(value) {
    const expected = configuredAdminKeyHash();
    const actual = hashValue(String(value || ""));
    if (!expected || expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
  }

  function adminSessionFor(request) {
    const rawToken = String(parseCookies(request).storieslens_admin || "");
    const tokenHash = rawToken ? hashValue(rawToken) : "";
    const database = store.read();
    const adminSession = database.adminSessions?.find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt) > new Date()) || null;
    return { database, adminSession };
  }

  function requireAdmin(request, response) {
    const current = adminSessionFor(request);
    if (!current.adminSession) {
      sendJson(response, 401, { error: "Administrator sign-in is required." });
      return null;
    }
    return current;
  }

  function assertSameOrigin(request) {
    const origin = String(request.headers.origin || "");
    if (!origin) return;
    const expected = `${isSecureRequest(request) ? "https" : "http"}://${request.headers.host}`;
    if (origin !== expected) throw Object.assign(new Error("Cross-site administrator actions are not allowed."), { statusCode: 403, code: "ADMIN_ORIGIN_MISMATCH" });
  }

  function publicInviteBatch(database, batch) {
    const codes = database.inviteCodes.filter((item) => item.batchId === batch.id);
    return {
      ...batch,
      generatedCodes: codes.length,
      totalRedemptions: codes.reduce((total, item) => total + Number(item.redemptionCount || 0), 0),
      availableRedemptions: codes.reduce((total, item) => total + Math.max(0, Number(item.maxRedemptions || 0) - Number(item.redemptionCount || 0)), 0)
    };
  }

  async function handleCredits(request, response, requestUrl) {
    if (requestUrl.pathname === "/api/credit-packages" && request.method === "GET") {
      sendJson(response, 200, { packages: publicPackageCatalog() });
      return true;
    }
    if (requestUrl.pathname === "/api/credits" && request.method === "GET") {
      const { user } = sessionFor(request, response);
      const result = store.mutate((database) => {
        ensureCreditCollections(database);
        ensureFreePreview(database, user.id);
        const wallet = walletFor(database, user.id);
        const summary = usageSummaryFor(database, user.id);
        return {
          wallet,
          usage: {
            resources: Object.fromEntries(Object.entries(summary.resources).map(([key, item]) => [key, {
              resource: item.resource,
              label: item.label,
              labelZh: item.labelZh,
              granted: item.granted,
              consumed: item.consumed,
              reserved: item.reserved,
              remaining: item.remaining,
              lastUsedAt: item.lastUsedAt
            }])),
            totals: {
              grantedUnits: summary.totals.grantedUnits,
              consumedUnits: summary.totals.consumedUnits,
              reservedUnits: summary.totals.reservedUnits,
              remainingUnits: summary.totals.remainingUnits,
              consumptionOperations: summary.totals.consumptionOperations,
              lastUsedAt: summary.totals.lastUsedAt
            }
          },
          purchases: database.creditSales.filter((entry) => entry.userId === user.id && entry.status === "recorded").slice(-20).reverse().map((entry) => ({
            id: entry.id,
            packageId: entry.packageId,
            amountMinor: entry.amountMinor,
            currency: entry.currency,
            createdAt: entry.createdAt
          })),
          recentActivity: database.creditTransactions.filter((entry) => entry.userId === user.id).slice(-30).reverse().map((entry) => ({
            id: entry.id,
            resource: entry.resource,
            delta: entry.delta,
            type: entry.type,
            packageId: entry.packageId || "",
            source: entry.source || "",
            createdAt: entry.createdAt
          }))
        };
      });
      sendJson(response, 200, result);
      return true;
    }
    if (requestUrl.pathname === "/api/credits/redeem" && request.method === "POST") {
      if (!rateLimiter.consume(request, response, { bucket: "invite-redeem", limit: 10, windowMs: 60 * 60 * 1000, sendJson })) return true;
      const { user } = sessionFor(request, response, { create: false });
      if (!user || user.kind !== "account") {
        sendJson(response, 401, { error: "Sign in before redeeming an invitation code." });
        return true;
      }
      const body = await readJsonBody(request);
      const result = store.mutate((database) => redeemInvite(database, {
        rawCode: body.code,
        userId: user.id,
        userRegion: user.primaryRegion
      }));
      sendJson(response, 200, { redeemed: !result.duplicate, packageId: result.invite.packageId, wallet: result.wallet });
      return true;
    }
    return false;
  }

  async function handleAdmin(request, response, requestUrl) {
    if (!requestUrl.pathname.startsWith("/api/admin/")) return false;

    if (requestUrl.pathname === "/api/admin/session" && request.method === "GET") {
      const current = adminSessionFor(request);
      sendJson(response, 200, { authenticated: Boolean(current.adminSession), configured: Boolean(configuredAdminKeyHash()) });
      return true;
    }
    if (requestUrl.pathname === "/api/admin/session" && request.method === "POST") {
      assertSameOrigin(request);
      if (!rateLimiter.consume(request, response, { bucket: "admin-login", limit: 5, windowMs: 30 * 60 * 1000, sendJson })) return true;
      if (!configuredAdminKeyHash()) {
        sendJson(response, 503, { error: "Set ADMIN_ACCESS_KEY_SHA256 before opening the allowance console." });
        return true;
      }
      const body = await readJsonBody(request, 4_000);
      if (!matchesAdminKey(body.accessKey)) {
        sendJson(response, 401, { error: "The administrator access key is incorrect." });
        return true;
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000).toISOString();
      store.mutate((database) => {
        ensureCreditCollections(database);
        database.adminSessions = database.adminSessions.filter((item) => new Date(item.expiresAt) > new Date()).slice(-20);
        database.adminSessions.push({ id: crypto.randomUUID(), tokenHash: hashValue(token), createdAt: nowIso(), expiresAt });
      });
      setAdminCookie(request, response, token, expiresAt);
      sendJson(response, 200, { authenticated: true, expiresAt });
      return true;
    }
    if (requestUrl.pathname === "/api/admin/session" && request.method === "DELETE") {
      assertSameOrigin(request);
      const rawToken = String(parseCookies(request).storieslens_admin || "");
      store.mutate((database) => {
        database.adminSessions = (database.adminSessions || []).filter((item) => item.tokenHash !== hashValue(rawToken));
      });
      clearAdminCookie(request, response);
      sendJson(response, 200, { authenticated: false });
      return true;
    }

    const admin = requireAdmin(request, response);
    if (!admin) return true;

    if (requestUrl.pathname === "/api/admin/summary" && request.method === "GET") {
      const database = store.read();
      ensureCreditCollections(database);
      const consumption = database.creditTransactions.filter((item) => item.type === "consumption");
      const costBearingConsumption = consumption.filter((item) => ["imageGenerations", "videoClips"].includes(item.resource));
      const modelUsage = database.modelUsageEvents;
      const recordedModelCostUsd = [...consumption, ...modelUsage].reduce((total, item) => {
        const cost = Number(item.costUsd);
        return total + (Number.isFinite(cost) && cost > 0 ? cost : 0);
      }, 0);
      const recordedRevenueMinor = database.creditSales.filter((item) => item.status === "recorded").reduce((totals, item) => {
        const currency = item.currency === "CNY" ? "cny" : "usd";
        totals[currency] += Math.max(0, Number(item.amountMinor) || 0);
        return totals;
      }, { usd: 0, cny: 0 });
      const costRecords = [...costBearingConsumption, ...modelUsage];
      const pricedConsumptions = costRecords.filter((item) => item.costUsd != null && Number.isFinite(Number(item.costUsd))).length;
      sendJson(response, 200, {
        accounts: database.users.filter((item) => item.kind === "account").length,
        activeCodes: database.inviteCodes.filter((item) => !item.disabledAt && new Date(item.expiresAt) > new Date() && item.redemptionCount < item.maxRedemptions).length,
        grants: database.creditTransactions.filter((item) => item.type === "grant").length,
        consumed: consumption.length,
        activeReservations: database.creditReservations.filter((item) => item.status === "reserved").length,
        recordedModelCostUsd,
        recordedRevenueMinor,
        modelOperations: modelUsage.length,
        unpricedConsumptions: costRecords.length - pricedConsumptions,
        costCoveragePercent: costRecords.length ? Math.round((pricedConsumptions / costRecords.length) * 100) : 100,
        packages: publicPackageCatalog()
      });
      return true;
    }
    if (requestUrl.pathname === "/api/admin/users" && request.method === "GET") {
      const query = cleanText(requestUrl.searchParams.get("query"), 100).toLowerCase();
      const database = store.read();
      ensureCreditCollections(database);
      const users = database.users.filter((item) => item.kind === "account").filter((item) => !query || [item.id, item.displayName, item.maskedDestination].some((value) => String(value || "").toLowerCase().includes(query))).slice(0, 100).map((user) => ({
        ...publicUser(user),
        wallet: walletFor(database, user.id),
        usage: usageSummaryFor(database, user.id)
      }));
      sendJson(response, 200, { users });
      return true;
    }
    if (requestUrl.pathname === "/api/admin/invites" && request.method === "GET") {
      const database = store.read();
      ensureCreditCollections(database);
      sendJson(response, 200, { batches: database.inviteBatches.slice(-100).reverse().map((batch) => publicInviteBatch(database, batch)) });
      return true;
    }
    if (requestUrl.pathname === "/api/admin/invites" && request.method === "POST") {
      assertSameOrigin(request);
      const body = await readJsonBody(request, 20_000);
      const expiresInDays = Math.max(1, Math.min(365, Number(body.expiresInDays) || 30));
      const result = store.mutate((database) => createInviteBatch(database, {
        region: body.region,
        packageId: body.packageId,
        count: Number(body.count),
        maxRedemptions: Number(body.maxRedemptions || 1),
        expiresAt: addDays(new Date(), expiresInDays),
        label: cleanText(body.label, 100),
        commercialType: body.commercialType,
        currency: body.currency,
        unitAmountMinor: Number(body.unitAmountMinor),
        createdBy: admin.adminSession.id
      }));
      sendJson(response, 201, { batch: publicInviteBatch(store.read(), result.batch), codes: result.rawCodes, warning: "These codes are shown once. Save them before leaving this page." });
      return true;
    }
    const disableBatchMatch = requestUrl.pathname.match(/^\/api\/admin\/invites\/([^/]+)$/);
    if (disableBatchMatch && request.method === "DELETE") {
      assertSameOrigin(request);
      const batchId = cleanId(decodeURIComponent(disableBatchMatch[1]));
      const result = store.mutate((database) => {
        const batch = database.inviteBatches.find((item) => item.id === batchId);
        if (!batch) return null;
        batch.disabledAt = nowIso();
        database.inviteCodes.forEach((item) => { if (item.batchId === batchId) item.disabledAt = batch.disabledAt; });
        return publicInviteBatch(database, batch);
      });
      if (!result) sendJson(response, 404, { error: "Invitation batch not found." });
      else sendJson(response, 200, { batch: result });
      return true;
    }
    if (requestUrl.pathname === "/api/admin/grants" && request.method === "POST") {
      assertSameOrigin(request);
      const body = await readJsonBody(request, 12_000);
      const userId = cleanId(body.userId);
      const packageId = cleanId(body.packageId);
      const result = store.mutate((database) => {
        const user = database.users.find((item) => item.id === userId && item.kind === "account");
        if (!user) throw Object.assign(new Error("Account not found."), { statusCode: 404, code: "ACCOUNT_NOT_FOUND" });
        return grantPackage(database, {
          userId,
          packageId,
          source: "admin-manual",
          note: cleanText(body.note, 240),
          idempotencyKey: cleanText(body.idempotencyKey, 200) || crypto.randomUUID(),
          createdBy: admin.adminSession.id
        });
      });
      sendJson(response, result.duplicate ? 200 : 201, { granted: !result.duplicate, packageId, wallet: result.wallet });
      return true;
    }
    if (requestUrl.pathname === "/api/admin/ledger" && request.method === "GET") {
      const database = store.read();
      ensureCreditCollections(database);
      sendJson(response, 200, {
        transactions: database.creditTransactions.slice(-200).reverse(),
        reservations: database.creditReservations.slice(-200).reverse(),
        sales: database.creditSales.slice(-200).reverse(),
        modelUsage: database.modelUsageEvents.slice(-200).reverse()
      });
      return true;
    }

    sendJson(response, 404, { error: "Administrator endpoint not found." });
    return true;
  }

  function authDeliveryStatus(method) {
    const hasWebhook = Boolean(cleanText(process.env.AUTH_DELIVERY_WEBHOOK_URL, 800));
    const hasResendEmail = method === "email" && Boolean(cleanText(process.env.RESEND_API_KEY, 800));
    if (hasResendEmail) return { configured: true, provider: "resend" };
    if (hasWebhook) return { configured: true, provider: "webhook" };
    return { configured: false, provider: process.env.NODE_ENV === "production" ? "not-configured" : "local-preview" };
  }

  async function deliverAuthCode(method, destination, code, challengeId) {
    const delivery = authDeliveryStatus(method);
    if (delivery.provider === "resend") {
      const resendApiUrl = cleanText(process.env.RESEND_API_URL, 800) || "https://api.resend.com/emails";
      const from = cleanText(process.env.AUTH_EMAIL_FROM, 320);
      if (!from) throw new Error("The sign-in email sender is not configured.");
      const replyTo = cleanText(process.env.AUTH_EMAIL_REPLY_TO, 320);
      const deliveryResponse = await fetch(resendApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `storieslens-auth-${challengeId}`
        },
        body: JSON.stringify({
          from,
          to: [destination],
          subject: `${code} is your StoriesLens sign-in code`,
          text: `Your StoriesLens sign-in code is ${code}. It expires in ${CHALLENGE_MINUTES} minutes. If you did not request this code, you can ignore this email.`,
          html: `<div style="font-family:Arial,sans-serif;color:#102824;line-height:1.6"><p>Your StoriesLens sign-in code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p><p>This code expires in ${CHALLENGE_MINUTES} minutes. If you did not request it, you can ignore this email.</p></div>`,
          ...(replyTo ? { reply_to: replyTo } : {})
        })
      });
      if (!deliveryResponse.ok) throw new Error("The sign-in email could not be delivered. Please check the address and try again.");
      return { delivered: true, provider: "resend" };
    }

    const webhookUrl = cleanText(process.env.AUTH_DELIVERY_WEBHOOK_URL, 800);
    if (!webhookUrl) return { delivered: false, provider: delivery.provider };
    const deliveryResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AUTH_DELIVERY_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.AUTH_DELIVERY_WEBHOOK_SECRET}` } : {})
      },
      body: JSON.stringify({ method, destination, code, challengeId, product: "StoriesLens" })
    });
    if (!deliveryResponse.ok) throw new Error("The sign-in code could not be delivered.");
    return { delivered: true, provider: "webhook" };
  }

  async function handleAuth(request, response, requestUrl) {
    if (requestUrl.pathname === "/api/auth/invite" && request.method === "POST") {
      if (process.env.INVITE_CODE_AUTH_ENABLED !== "true") {
        sendJson(response, 503, { error: "Invitation-code access is not enabled on this environment." });
        return true;
      }
      if (!rateLimiter.consume(request, response, { bucket: "invite-auth", limit: 10, windowMs: 60 * 60 * 1000, sendJson })) return true;
      const body = await readJsonBody(request, 12_000);
      const rawInviteCode = normalizeInviteCode(body.betaInviteCode);
      const requestedRegion = regionProfile(body.primaryRegion);
      if (!requestedRegion || !configuredRegistrationRegions().includes(requestedRegion.primaryRegion)) {
        sendJson(response, 403, { error: "This region is not open in the current invitation-only beta." });
        return true;
      }
      const countryCode = countryForRegion(requestedRegion.primaryRegion, body.countryCode);
      if (!countryCode) {
        sendJson(response, 400, { error: "Choose the country where the account will be used." });
        return true;
      }
      if (requestedRegion.primaryRegion === "intl" && !allowedInternationalCountries().includes(countryCode)) {
        sendJson(response, 403, { error: "This country is not open in the current invitation-only beta." });
        return true;
      }
      if (process.env.BETA_ADULT_ACCOUNT_OWNER_ONLY === "true" && body.ageGroup !== "adult") {
        sendJson(response, 403, { error: "During the founding beta, a parent or guardian must own the account." });
        return true;
      }
      const current = sessionFor(request, response);
      const result = store.mutate((database) => {
        ensureCreditCollections(database);
        const invite = findInvite(database, rawInviteCode);
        validateInvite(database, invite, requestedRegion.primaryRegion);
        const account = database.users.find((item) => item.id === current.user.id);
        if (!account) throw Object.assign(new Error("Private session not found."), { statusCode: 401, code: "SESSION_NOT_FOUND" });
        if (account.primaryRegion && account.primaryRegion !== requestedRegion.primaryRegion) {
          throw Object.assign(new Error("This private account already belongs to a different data region."), { statusCode: 409, code: "REGION_MISMATCH" });
        }
        const batch = database.inviteBatches.find((item) => item.id === invite.batchId);
        Object.assign(account, {
          kind: "account",
          displayName: cleanText(body.displayName, 80) || account.displayName || "Creator",
          ageGroup: body.ageGroup === "adult" ? "adult" : "under18",
          locale: body.locale === "zh" ? "zh" : "en",
          ...requestedRegion,
          countryCode,
          betaAccess: account.betaAccess || {
            cohort: batch?.label || "invited-beta",
            inviteFingerprint: invite.fingerprint,
            inviteCodeId: invite.id,
            packageId: invite.packageId,
            grantedAt: nowIso()
          },
          regionConsentVersion: REGION_CONSENT_VERSION,
          regionConfirmedAt: account.regionConfirmedAt || nowIso(),
          signInMethod: "invite-code",
          maskedDestination: "Private invitation",
          updatedAt: nowIso()
        });
        const redemption = redeemInvite(database, {
          rawCode: rawInviteCode,
          userId: account.id,
          userRegion: requestedRegion.primaryRegion
        });
        const session = database.sessions.find((item) => item.id === current.session.id);
        session.expiresAt = addDays(new Date(), SESSION_DAYS);
        return { account, session, redemption };
      });
      setSessionCookie(request, response, result.session.id, result.session.expiresAt);
      sendJson(response, 200, {
        authenticated: true,
        user: publicUser(result.account),
        packageId: result.redemption.invite.packageId,
        wallet: result.redemption.wallet
      });
      return true;
    }

    if (requestUrl.pathname === "/api/auth/session" && request.method === "GET") {
      const { user } = sessionFor(request, response);
      sendJson(response, 200, { authenticated: user.kind === "account", user: publicUser(user) });
      return true;
    }

    if (requestUrl.pathname === "/api/auth/start" && request.method === "POST") {
      if (!rateLimiter.consume(request, response, { bucket: "auth-start", limit: 5, windowMs: 15 * 60 * 1000, sendJson })) return true;
      const body = await readJsonBody(request);
      const method = body.method === "phone" ? "phone" : "email";
      const destination = validateDestination(method, body.destination);
      if (!destination) {
        sendJson(response, 400, { error: method === "email" ? "Enter a valid email address." : "Enter a valid mobile number including country code." });
        return true;
      }
      const isProduction = process.env.NODE_ENV === "production";
      const deliveryStatus = authDeliveryStatus(method);
      if (isProduction && !deliveryStatus.configured) {
        sendJson(response, 503, { error: method === "email" ? "Email sign-in delivery is not configured yet." : "SMS sign-in delivery is not configured yet." });
        return true;
      }
      const code = String(crypto.randomInt(100000, 999999));
      const challenge = {
        id: crypto.randomUUID(),
        method,
        destinationHash: hashValue(`${method}:${destination}`),
        maskedDestination: maskDestination(method, destination),
        codeHash: hashValue(`${code}:${destination}`),
        attempts: 0,
        createdAt: nowIso(),
        expiresAt: new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000).toISOString(),
        usedAt: ""
      };
      store.mutate((database) => {
        database.authChallenges = database.authChallenges.filter((item) => new Date(item.expiresAt) > new Date() && !item.usedAt).slice(-1000);
        database.authChallenges.push(challenge);
      });
      let deliveryResult;
      try {
        deliveryResult = await deliverAuthCode(method, destination, code, challenge.id);
      } catch (error) {
        store.mutate((database) => {
          database.authChallenges = database.authChallenges.filter((item) => item.id !== challenge.id);
        });
        sendJson(response, 502, { error: error.message });
        return true;
      }
      sendJson(response, 200, {
        challengeId: challenge.id,
        maskedDestination: challenge.maskedDestination,
        expiresInSeconds: CHALLENGE_MINUTES * 60,
        delivery: deliveryResult.delivered ? "sent" : "local-preview",
        ...(!isProduction && !deliveryResult.delivered ? { devCode: code } : {})
      });
      return true;
    }

    if (requestUrl.pathname === "/api/auth/verify" && request.method === "POST") {
      if (!rateLimiter.consume(request, response, { bucket: "auth-verify", limit: 10, windowMs: 15 * 60 * 1000, sendJson })) return true;
      const body = await readJsonBody(request);
      const challengeId = cleanId(body.challengeId);
      const code = cleanText(body.code, 12);
      const destination = validateDestination(body.method === "phone" ? "phone" : "email", body.destination);
      const requestedRegion = regionProfile(body.primaryRegion);
      if (!requestedRegion) {
        sendJson(response, 400, { error: "Choose China Mainland, United States, or Other countries and regions." });
        return true;
      }
      if (!configuredRegistrationRegions().includes(requestedRegion.primaryRegion)) {
        sendJson(response, 403, { error: "StoriesLens private accounts are not open in this region during the current pilot." });
        return true;
      }
      const countryCode = countryForRegion(requestedRegion.primaryRegion, body.countryCode);
      if (!countryCode) {
        sendJson(response, 400, { error: "Choose the country where the account will be used." });
        return true;
      }
      if (requestedRegion.primaryRegion === "intl" && !allowedInternationalCountries().includes(countryCode)) {
        sendJson(response, 403, { error: "This country is not open in the current invitation-only beta." });
        return true;
      }
      if (process.env.BETA_ADULT_ACCOUNT_OWNER_ONLY === "true" && body.ageGroup !== "adult") {
        sendJson(response, 403, { error: "During the founding beta, a parent or guardian must own the account. Young creators can create inside that adult-owned account." });
        return true;
      }
      const current = sessionFor(request, response);
      const result = store.mutate((database) => {
        const challenge = database.authChallenges.find((item) => item.id === challengeId);
        if (!challenge || challenge.usedAt || new Date(challenge.expiresAt) <= new Date()) return { error: "This sign-in code has expired." };
        challenge.attempts += 1;
        if (challenge.attempts > 5) return { error: "Too many attempts. Request a new code." };
        if (!destination || hashValue(`${code}:${destination}`) !== challenge.codeHash) return { error: "The sign-in code is incorrect." };
        let account = database.users.find((item) => item.kind === "account" && item.destinationHash === challenge.destinationHash);
        if (account?.primaryRegion && account.primaryRegion !== requestedRegion.primaryRegion) return { error: "This account already belongs to a different data region. Contact support to request a controlled migration." };
        if (account?.countryCode && account.countryCode !== countryCode) return { error: "This account already belongs to a different country route. Contact support to update it." };
        ensureCreditCollections(database);
        const rawInviteCode = normalizeInviteCode(body.betaInviteCode);
        const databaseInvite = rawInviteCode ? findInvite(database, rawInviteCode) : null;
        let inviteAccess = account?.betaAccess || null;
        if (process.env.BETA_INVITE_ONLY === "true" && !inviteAccess) {
          if (databaseInvite) {
            const batch = database.inviteBatches.find((item) => item.id === databaseInvite.batchId);
            inviteAccess = {
              cohort: batch?.label || "invited-beta",
              inviteFingerprint: databaseInvite.fingerprint,
              inviteCodeId: databaseInvite.id,
              packageId: databaseInvite.packageId,
              grantedAt: nowIso()
            };
          } else {
            const inviteFingerprint = hashValue(rawInviteCode);
            const invite = configuredBetaInvites().find((item) => item.region === requestedRegion.primaryRegion && item.fingerprint === inviteFingerprint);
            if (!invite) return { error: "Enter a valid invitation code for this region." };
            const useLimit = positiveIntegerEnvironment("BETA_MAX_ACCOUNTS_PER_CODE", 10);
            const uses = database.betaInviteRedemptions.filter((item) => item.inviteFingerprint === invite.fingerprint).length;
            if (uses >= useLimit) return { error: "This invitation code has reached its founding-beta limit." };
            inviteAccess = { cohort: invite.cohort, inviteFingerprint: invite.fingerprint, grantedAt: nowIso() };
          }
        }
        challenge.usedAt = nowIso();
        if (!account) {
          account = {
            id: crypto.randomUUID(),
            kind: "account",
            displayName: cleanText(body.displayName, 80) || "Creator",
            ageGroup: ["under18", "adult"].includes(body.ageGroup) ? body.ageGroup : "unknown",
            locale: body.locale === "zh" ? "zh" : "en",
            ...requestedRegion,
            countryCode,
            betaAccess: inviteAccess,
            regionConsentVersion: REGION_CONSENT_VERSION,
            regionConfirmedAt: nowIso(),
            signInMethod: challenge.method,
            destinationHash: challenge.destinationHash,
            maskedDestination: challenge.maskedDestination,
            createdAt: nowIso(),
            updatedAt: nowIso()
          };
          database.users.push(account);
        } else if (!account.primaryRegion) {
          Object.assign(account, requestedRegion, {
            countryCode,
            betaAccess: inviteAccess,
            regionConsentVersion: REGION_CONSENT_VERSION,
            regionConfirmedAt: nowIso(),
            updatedAt: nowIso()
          });
        } else if (!account.betaAccess && inviteAccess) {
          account.betaAccess = inviteAccess;
          account.countryCode = account.countryCode || countryCode;
          account.updatedAt = nowIso();
        }
        account.countryCode = account.countryCode || countryCode;
        database.projects.forEach((project) => {
          if (project.ownerId === current.user.id) project.ownerId = account.id;
        });
        database.media.forEach((media) => {
          if (media.ownerId === current.user.id) media.ownerId = account.id;
        });
        database.creditTransactions.forEach((entry) => {
          if (entry.userId === current.user.id) entry.userId = account.id;
        });
        database.creditReservations.forEach((entry) => {
          if (entry.userId === current.user.id) entry.userId = account.id;
        });
        database.modelUsageEvents.forEach((entry) => {
          if (entry.userId === current.user.id) entry.userId = account.id;
        });
        database.creditSales.forEach((entry) => {
          if (entry.userId === current.user.id) entry.userId = account.id;
        });
        if (databaseInvite) {
          redeemInvite(database, { rawCode: rawInviteCode, userId: account.id, userRegion: requestedRegion.primaryRegion });
        } else if (inviteAccess && !database.betaInviteRedemptions.some((item) => item.accountId === account.id && item.inviteFingerprint === inviteAccess.inviteFingerprint)) {
          database.betaInviteRedemptions.push({ id: crypto.randomUUID(), accountId: account.id, region: requestedRegion.primaryRegion, cohort: inviteAccess.cohort, inviteFingerprint: inviteAccess.inviteFingerprint, redeemedAt: nowIso() });
        }
        ensureFreePreview(database, account.id);
        const session = database.sessions.find((item) => item.id === current.session.id);
        session.userId = account.id;
        session.expiresAt = addDays(new Date(), SESSION_DAYS);
        return { account, session };
      });
      if (result.error) {
        sendJson(response, 400, { error: result.error });
        return true;
      }
      setSessionCookie(request, response, result.session.id, result.session.expiresAt);
      sendJson(response, 200, { authenticated: true, user: publicUser(result.account) });
      return true;
    }

    if (requestUrl.pathname === "/api/auth/wechat" && request.method === "POST") {
      if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
        sendJson(response, 503, { error: "WeChat login is reserved but not configured. Add WECHAT_APP_ID and WECHAT_APP_SECRET after the Mini Program is registered." });
        return true;
      }
      sendJson(response, 501, { error: "WeChat code exchange must be enabled with the registered Mini Program domain before production launch." });
      return true;
    }

    if (requestUrl.pathname === "/api/auth/logout" && request.method === "POST") {
      const cookieId = cleanId(parseCookies(request).storieslens_session);
      store.mutate((database) => {
        database.sessions = database.sessions.filter((item) => item.id !== cookieId);
      });
      clearSessionCookie(request, response);
      sendJson(response, 200, { success: true });
      return true;
    }

    if (requestUrl.pathname === "/api/account" && request.method === "DELETE") {
      if (process.env.ACCOUNT_DELETION_ENABLED !== "true") {
        sendJson(response, 503, { error: "Account deletion is not enabled on this environment." });
        return true;
      }
      const current = sessionFor(request, response, { create: false });
      if (!current.user || current.user.kind !== "account") {
        sendJson(response, 401, { error: "Sign in before deleting an account." });
        return true;
      }
      const body = await readJsonBody(request);
      if (body.confirmation !== "DELETE MY ACCOUNT") {
        sendJson(response, 400, { error: "Type DELETE MY ACCOUNT to confirm permanent deletion." });
        return true;
      }
      const ownedMedia = current.database.media.filter((item) => item.ownerId === current.user.id);
      for (const media of ownedMedia) await mediaStorage.remove(media);
      store.mutate((database) => {
        const projectIds = new Set(database.projects.filter((item) => item.ownerId === current.user.id).map((item) => item.id));
        database.users = database.users.filter((item) => item.id !== current.user.id);
        database.sessions = database.sessions.filter((item) => item.userId !== current.user.id);
        database.projects = database.projects.filter((item) => item.ownerId !== current.user.id);
        database.media = database.media.filter((item) => item.ownerId !== current.user.id);
        database.guardianConsents = database.guardianConsents.filter((item) => !projectIds.has(item.projectId));
        database.shares = database.shares.filter((item) => item.ownerId !== current.user.id && !projectIds.has(item.projectId));
        database.orders = database.orders.filter((item) => item.ownerId !== current.user.id);
        database.renderJobs = database.renderJobs.filter((item) => item.ownerId !== current.user.id);
        database.notificationSubscriptions = database.notificationSubscriptions.filter((item) => item.ownerId !== current.user.id);
        database.productEvents = database.productEvents.filter((item) => item.userId !== current.user.id && item.ownerId !== current.user.id);
        database.betaInviteRedemptions = database.betaInviteRedemptions.filter((item) => item.accountId !== current.user.id);
        database.creditTransactions = database.creditTransactions.filter((item) => item.userId !== current.user.id);
        database.creditReservations = database.creditReservations.filter((item) => item.userId !== current.user.id);
        database.modelUsageEvents = database.modelUsageEvents.filter((item) => item.userId !== current.user.id);
      });
      clearSessionCookie(request, response);
      sendJson(response, 200, { deleted: true });
      return true;
    }

    return false;
  }

  async function handleProjects(request, response, requestUrl) {
    if (requestUrl.pathname === "/api/projects" && request.method === "GET") {
      const { database, user } = sessionFor(request, response);
      const projects = database.projects.filter((project) => project.ownerId === user.id && !project.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      sendJson(response, 200, { projects, user: publicUser(user) });
      return true;
    }

    if (requestUrl.pathname === "/api/projects" && request.method === "POST") {
      const body = await readJsonBody(request, 180_000);
      const { database, user } = sessionFor(request, response);
      if (database.projects.filter((project) => project.ownerId === user.id && !project.deletedAt).length >= MAX_PROJECTS_PER_USER) {
        sendJson(response, 409, { error: "This account has reached its project limit." });
        return true;
      }
      const requestKey = cleanText(request.headers["idempotency-key"] || body.idempotencyKey || crypto.randomUUID(), 200);
      const reserved = store.mutate((nextDatabase) => reserveCredits(nextDatabase, {
        userId: user.id,
        resource: "storyProjects",
        units: 1,
        idempotencyKey: `project:${requestKey}`,
        referenceType: "story-project",
        metadata: { mode: body.mode || "solo" }
      }));
      if (reserved.duplicate && reserved.reservation.status === "settled") {
        const existingProject = store.read().projects.find((item) => item.creationReservationId === reserved.reservation.id && item.ownerId === user.id);
        if (existingProject) {
          sendJson(response, 200, { project: existingProject, wallet: reserved.wallet, duplicate: true });
          return true;
        }
      }
      try {
        await enforceTextSafety([body.title, body.sourceText, body.draft].filter(Boolean).join("\n"));
        const createdAt = nowIso();
        const project = normalizeProject(body);
        Object.assign(project, { id: crypto.randomUUID(), ownerId: user.id, createdAt, updatedAt: createdAt, version: 1, deletedAt: "", creationReservationId: reserved.reservation.id });
        store.mutate((nextDatabase) => {
          nextDatabase.projects.push(project);
          settleReservation(nextDatabase, { reservationId: reserved.reservation.id });
        });
        sendJson(response, 201, { project, wallet: walletFor(store.read(), user.id) });
      } catch (error) {
        store.mutate((nextDatabase) => releaseReservation(nextDatabase, { reservationId: reserved.reservation.id, reason: "project-create-failed" }));
        throw error;
      }
      return true;
    }

    const projectMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (!projectMatch) return false;
    const projectId = cleanId(decodeURIComponent(projectMatch[1]));
    const { database, user } = sessionFor(request, response);
    const project = requireProject(database, user, projectId);
    if (!project) {
      sendJson(response, 404, { error: "Story project not found." });
      return true;
    }

    if (request.method === "GET") {
      sendJson(response, 200, { project });
      return true;
    }

    if (request.method === "PATCH" || request.method === "PUT") {
      const body = await readJsonBody(request, 180_000);
      await enforceTextSafety([body.title, body.sourceText, body.draft, ...(body.scenes || []).map((scene) => scene?.text)].filter(Boolean).join("\n"));
      const updated = store.mutate((nextDatabase) => {
        const index = nextDatabase.projects.findIndex((item) => item.id === projectId && item.ownerId === user.id && !item.deletedAt);
        const nextProject = normalizeProject(body, nextDatabase.projects[index]);
        nextProject.updatedAt = nowIso();
        nextProject.version = Number(nextProject.version || 0) + 1;
        nextDatabase.projects[index] = nextProject;
        return nextProject;
      });
      sendJson(response, 200, { project: updated });
      return true;
    }

    if (request.method === "DELETE") {
      store.mutate((nextDatabase) => {
        const stored = nextDatabase.projects.find((item) => item.id === projectId && item.ownerId === user.id);
        stored.deletedAt = nowIso();
        stored.purgeAfter = addDays(new Date(), 30);
      });
      sendJson(response, 200, { archived: true, recoverableForDays: 30 });
      return true;
    }

    sendJson(response, 405, { error: "Method not allowed" });
    return true;
  }

  async function handleMedia(request, response, requestUrl) {
    if (requestUrl.pathname === "/api/media-usage" && request.method === "GET") {
      const { database, user } = sessionFor(request, response);
      sendJson(response, 200, { usage: mediaUsageFor(database, user), region: user.primaryRegion || "local" });
      return true;
    }

    if (requestUrl.pathname === "/api/media" && request.method === "POST") {
      if (!rateLimiter.consume(request, response, { bucket: "media-upload", limit: 20, windowMs: 60 * 60 * 1000, sendJson })) return true;
      const body = await readJsonBody(request, 18_000_000);
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(body.projectId));
      if (!project) {
        sendJson(response, 404, { error: "Save the story project before uploading media." });
        return true;
      }
      const match = String(body.dataUrl || "").match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) {
        sendJson(response, 400, { error: "Choose a valid image or audio recording." });
        return true;
      }
      const mimeType = match[1].toLowerCase();
      const imageExtensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const audioExtensions = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg" };
      const kind = imageExtensions[mimeType] ? "image" : (audioExtensions[mimeType] ? "audio" : "");
      if (!kind) {
        sendJson(response, 415, { error: "This media format is not supported." });
        return true;
      }
      const buffer = Buffer.from(match[2], "base64");
      const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
      if (!buffer.length || buffer.length > limit) {
        sendJson(response, 413, { error: `Keep this ${kind} smaller than ${Math.round(limit / 1024 / 1024)} MB.` });
        return true;
      }
      const usage = mediaUsageFor(database, user);
      if (usage.bytesUsed + buffer.length > usage.bytesLimit) {
        sendJson(response, 413, {
          error: "This private library has reached its storage allowance. Remove unused media or upgrade before uploading more.",
          usage
        });
        return true;
      }
      if (kind === "image") {
        if (body.metadataRemoved !== true) {
          sendJson(response, 400, { error: "Image metadata must be removed on the device before upload." });
          return true;
        }
        const artworkReview = await reviewArtworkSafety(body.dataUrl);
        if (!artworkReview.approved) {
          sendJson(response, artworkReview.statusCode || 422, {
            error: ["real_person", "not_artwork"].includes(artworkReview.reasonCode)
              ? "Real-person photos are not stored. Upload artwork without identifiable people."
              : "This image was not stored because it did not pass the artwork privacy review.",
            reasonCode: artworkReview.reasonCode || "uncertain"
          });
          return true;
        }
      }
      const mediaId = crypto.randomUUID();
      const extension = imageExtensions[mimeType] || audioExtensions[mimeType];
      const storageRecord = await mediaStorage.put({
        user,
        key: `${user.id}/${project.id}/${mediaId}.${extension}`,
        buffer,
        contentType: mimeType
      });
      const media = {
        id: mediaId,
        ownerId: user.id,
        projectId: project.id,
        kind,
        mimeType,
        bytes: buffer.length,
        ...storageRecord,
        private: true,
        metadataRemoved: kind === "image",
        createdAt: nowIso()
      };
      store.mutate((nextDatabase) => nextDatabase.media.push(media));
      sendJson(response, 201, { media: publicMedia(media) });
      return true;
    }

    const mediaMatch = requestUrl.pathname.match(/^\/api\/media\/([^/]+)$/);
    if (!mediaMatch || request.method !== "GET") return false;
    const mediaId = cleanId(decodeURIComponent(mediaMatch[1]));
    const { database, user } = sessionFor(request, response);
    const media = database.media.find((item) => item.id === mediaId && item.ownerId === user.id);
    const storedObject = media ? await mediaStorage.get(media) : null;
    if (!media || !storedObject) {
      sendJson(response, 404, { error: "Private media not found." });
      return true;
    }
    response.writeHead(200, {
      "Content-Type": storedObject.contentType || media.mimeType,
      "Content-Length": storedObject.bytes,
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
      "X-Robots-Tag": "noindex, noarchive"
    });
    response.end(storedObject.body);
    return true;
  }

  async function handleConsentAndSharing(request, response, requestUrl) {
    const consentRevokeMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/consents\/([^/]+)$/);
    if (consentRevokeMatch && request.method === "DELETE") {
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(decodeURIComponent(consentRevokeMatch[1])));
      const consentId = cleanId(decodeURIComponent(consentRevokeMatch[2]));
      const consent = project ? database.guardianConsents.find((item) => item.id === consentId && item.projectId === project.id && !item.revokedAt) : null;
      if (!project || !consent) {
        sendJson(response, 404, { error: "Active guardian approval not found." });
        return true;
      }
      store.mutate((nextDatabase) => {
        const stored = nextDatabase.guardianConsents.find((item) => item.id === consent.id);
        stored.revokedAt = nowIso();
        nextDatabase.shares.forEach((share) => { if (share.projectId === project.id && !share.revokedAt) share.revokedAt = nowIso(); });
      });
      sendJson(response, 200, { revoked: true, invitationsRevoked: true });
      return true;
    }

    const consentMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/consents$/);
    if (consentMatch) {
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(decodeURIComponent(consentMatch[1])));
      if (!project) {
        sendJson(response, 404, { error: "Story project not found." });
        return true;
      }
      if (request.method === "GET") {
        sendJson(response, 200, { consents: database.guardianConsents.filter((item) => item.projectId === project.id && !item.revokedAt) });
        return true;
      }
      if (request.method === "POST") {
        const body = await readJsonBody(request);
        if (body.confirmedAdult !== true || body.approvedPrivateMedia !== true || body.approvedSharing !== true) {
          sendJson(response, 400, { error: "A parent or legal guardian must confirm every required permission." });
          return true;
        }
        const guardianName = cleanText(body.guardianName, 100);
        const relationship = cleanText(body.relationship, 80);
        if (!guardianName || !relationship) {
          sendJson(response, 400, { error: "Enter the guardian name and relationship." });
          return true;
        }
        const consent = {
          id: crypto.randomUUID(),
          projectId: project.id,
          guardianName,
          relationship,
          scopes: ["private_media", "invite_share", "print_proof"],
          verificationStatus: user.kind === "account" ? "account-attested" : "self-attested",
          policyVersion: "2026-09-07",
          createdAt: nowIso(),
          revokedAt: ""
        };
        store.mutate((nextDatabase) => nextDatabase.guardianConsents.push(consent));
        sendJson(response, 201, { consent, notice: "This records guardian approval. Configure a verified parental-consent provider before a public child launch." });
        return true;
      }
      sendJson(response, 405, { error: "Method not allowed" });
      return true;
    }

    const shareMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/share$/);
    if (shareMatch && request.method === "POST") {
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(decodeURIComponent(shareMatch[1])));
      if (!project) {
        sendJson(response, 404, { error: "Story project not found." });
        return true;
      }
      if (project.ageGroup === "under18") {
        const consent = database.guardianConsents.find((item) => item.projectId === project.id && !item.revokedAt && item.scopes.includes("invite_share"));
        if (!consent) {
          sendJson(response, 403, { error: "Guardian approval is required before sharing a young creator's project." });
          return true;
        }
      }
      const token = crypto.randomBytes(20).toString("base64url");
      const share = { id: crypto.randomUUID(), token, projectId: project.id, ownerId: user.id, visibility: "invite", createdAt: nowIso(), expiresAt: addDays(new Date(), 14), revokedAt: "" };
      store.mutate((nextDatabase) => nextDatabase.shares.push(share));
      sendJson(response, 201, { shareUrl: `/share/${token}`, expiresAt: share.expiresAt, visibility: "invite" });
      return true;
    }

    const shareApiMatch = requestUrl.pathname.match(/^\/api\/shares\/([^/]+)$/);
    if (shareApiMatch && request.method === "GET") {
      const database = store.read();
      const token = cleanText(decodeURIComponent(shareApiMatch[1]), 80);
      const share = database.shares.find((item) => item.token === token && !item.revokedAt && new Date(item.expiresAt) > new Date());
      const project = share ? database.projects.find((item) => item.id === share.projectId && !item.deletedAt) : null;
      if (!share || !project) {
        sendJson(response, 404, { error: "This private story link is unavailable or has expired." });
        return true;
      }
      sendJson(response, 200, {
        project: {
          id: project.id,
          title: project.title,
          language: project.language,
          draft: project.draft,
          storyDna: project.storyDna,
          scenes: project.scenes.map((scene) => ({ ...scene, narrationMediaId: "" })),
          coverImageUrl: project.coverImageUrl,
          updatedAt: project.updatedAt
        },
        expiresAt: share.expiresAt
      });
      return true;
    }

    const sharePageMatch = requestUrl.pathname.match(/^\/share\/([^/]+)$/);
    if (sharePageMatch && request.method === "GET") {
      const database = store.read();
      const token = cleanText(decodeURIComponent(sharePageMatch[1]), 80);
      const share = database.shares.find((item) => item.token === token && !item.revokedAt && new Date(item.expiresAt) > new Date());
      const project = share ? database.projects.find((item) => item.id === share.projectId && !item.deletedAt) : null;
      const title = project ? project.title : "Private StoriesLens story";
      const description = project ? cleanText(project.draft || project.sourceText || "A private story shared with you.", 180) : "This private story link has expired.";
      const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="/assets/storieslens-logo.png"><title>${escapeHtml(title)} · StoriesLens</title><link rel="stylesheet" href="/app-shell.css"></head><body class="shared-story-page"><main class="shared-story-card"><a href="/index.html" class="app-brand">StoriesLens</a><p class="app-kicker">PRIVATE STORY INVITATION</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${project ? `<a class="app-primary" href="/shared-story.html?token=${encodeURIComponent(token)}">Open private story</a>` : `<a class="app-primary" href="/index.html">Return home</a>`}<small>Invite-only · Expires automatically · Not indexed by search engines</small></main></body></html>`;
      response.writeHead(project ? 200 : 404, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" });
      response.end(page);
      return true;
    }

    return false;
  }

  async function handleOrdersAndRender(request, response, requestUrl) {
    if (requestUrl.pathname === "/api/orders" && request.method === "GET") {
      const { database, user } = sessionFor(request, response);
      sendJson(response, 200, { orders: database.orders.filter((item) => item.ownerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
      return true;
    }
    if (requestUrl.pathname === "/api/orders" && request.method === "POST") {
      const body = await readJsonBody(request);
      const { database, user } = sessionFor(request, response);
      const offerId = cleanId(body.offer);
      const offer = offerCatalog[offerId];
      const project = requireProject(database, user, cleanId(body.projectId));
      if (!offer || !project) {
        sendJson(response, 400, { error: "Choose a valid story and product." });
        return true;
      }
      const checkoutUrl = cleanText(process.env[offer.envKey], 1000);
      const checkoutReady = (() => {
        try {
          const url = new URL(checkoutUrl);
          return url.protocol === "https:" && ["buy.stripe.com", "checkout.stripe.com"].includes(url.hostname);
        } catch { return false; }
      })();
      const order = { id: crypto.randomUUID(), ownerId: user.id, projectId: project.id, offerId, name: offer.name, price: offer.price, status: checkoutReady ? "awaiting_payment" : "interest_only", createdAt: nowIso(), updatedAt: nowIso() };
      store.mutate((nextDatabase) => nextDatabase.orders.push(order));
      sendJson(response, 201, { order, checkoutUrl: checkoutReady ? checkoutUrl : "", fallbackUrl: checkoutReady ? "" : offer.fallbackUrl });
      return true;
    }

    if (requestUrl.pathname === "/api/render-jobs" && request.method === "GET") {
      const { database, user } = sessionFor(request, response);
      sendJson(response, 200, { renderJobs: database.renderJobs.filter((item) => item.ownerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => ({ ...item, outputFilePath: undefined })) });
      return true;
    }
    if (requestUrl.pathname === "/api/render-jobs" && request.method === "POST") {
      const body = await readJsonBody(request);
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(body.projectId));
      if (!project) {
        sendJson(response, 404, { error: "Story project not found." });
        return true;
      }
      const scenes = project.scenes.length ? project.scenes : [cleanScene({ title: project.title, text: project.draft || project.sourceText, duration: 8 }, 0)];
      const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
      const ready = scenes.every((scene) => scene.imageUrl || scene.videoUrl);
      const job = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        projectId: project.id,
        provider: "hyperframes",
        status: ready ? "ready_for_render" : "awaiting_media",
        aspectRatio: body.aspectRatio === "9:16" ? "9:16" : "16:9",
        resolution: body.resolution === "1080p" ? "1080p" : "720p",
        totalDuration,
        plan: scenes.map((scene, index) => ({ ...scene, start: scenes.slice(0, index).reduce((sum, item) => sum + item.duration, 0), trackIndex: 1 })),
        outputUrl: "",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.mutate((nextDatabase) => nextDatabase.renderJobs.push(job));
      let renderResult = { started: false };
      if (ready) {
        renderResult = queueHyperframesRender({
          root,
          project,
          mediaRecords: database.media.filter((item) => item.ownerId === user.id),
          job,
          onUpdate(update) {
            store.mutate((nextDatabase) => {
              const storedJob = nextDatabase.renderJobs.find((item) => item.id === job.id);
              if (storedJob) Object.assign(storedJob, update, { updatedAt: nowIso() });
            });
          }
        });
        if (renderResult.started) {
          job.status = "rendering";
          store.mutate((nextDatabase) => {
            const storedJob = nextDatabase.renderJobs.find((item) => item.id === job.id);
            if (storedJob) Object.assign(storedJob, { status: "rendering", updatedAt: nowIso() });
          });
        }
      }
      const notice = !ready
        ? "Add an approved image or video to every scene before rendering."
        : renderResult.started
          ? "Your movie is rendering privately inside StoriesLens. You can return to My Stories while it finishes."
          : "The movie plan is ready, but this server still needs the HyperFrames render worker installed.";
      sendJson(response, 201, { renderJob: job, notice });
      return true;
    }

    const renderOutputMatch = requestUrl.pathname.match(/^\/api\/render-jobs\/([^/]+)\/output$/);
    if (renderOutputMatch && request.method === "GET") {
      const { database, user } = sessionFor(request, response);
      const job = database.renderJobs.find((item) => item.id === cleanId(decodeURIComponent(renderOutputMatch[1])) && item.ownerId === user.id);
      if (!job || job.status !== "completed" || !job.outputFilePath || !fs.existsSync(job.outputFilePath)) {
        sendJson(response, 404, { error: "The private movie is not available yet." });
        return true;
      }
      response.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": fs.statSync(job.outputFilePath).size,
        "Content-Disposition": `attachment; filename="storieslens-${job.id}.mp4"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, noarchive"
      });
      fs.createReadStream(job.outputFilePath).pipe(response);
      return true;
    }

    const renderMatch = requestUrl.pathname.match(/^\/api\/render-jobs\/([^/]+)$/);
    if (renderMatch && request.method === "GET") {
      const { database, user } = sessionFor(request, response);
      const job = database.renderJobs.find((item) => item.id === cleanId(decodeURIComponent(renderMatch[1])) && item.ownerId === user.id);
      if (!job) sendJson(response, 404, { error: "Render job not found." });
      else sendJson(response, 200, { renderJob: { ...job, outputFilePath: undefined } });
      return true;
    }

    return false;
  }

  async function handleNotificationsAndStatus(request, response, requestUrl) {
    if (requestUrl.pathname === "/api/product-events" && request.method === "POST") {
      const body = await readJsonBody(request, 12_000);
      const name = cleanText(body.name, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!name) {
        sendJson(response, 400, { error: "A valid product event name is required." });
        return true;
      }
      const { user } = sessionFor(request, response);
      const rawProperties = safeJsonValue(body.properties, 4_000);
      const properties = Object.fromEntries(Object.entries(rawProperties).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 20).map(([key, value]) => [cleanText(key, 40), typeof value === "string" ? cleanText(value, 80) : value]));
      store.mutate((database) => {
        database.productEvents.push({
          id: crypto.randomUUID(),
          ownerId: user.id,
          name,
          page: cleanText(body.page, 100),
          properties,
          occurredAt: cleanText(body.at, 40) || nowIso(),
          receivedAt: nowIso()
        });
        database.productEvents = database.productEvents.slice(-20_000);
      });
      sendJson(response, 202, { accepted: true });
      return true;
    }

    if (requestUrl.pathname === "/api/platform/status" && request.method === "GET") {
      const emailDelivery = authDeliveryStatus("email");
      const phoneDelivery = authDeliveryStatus("phone");
      sendJson(response, 200, {
        features: {
          localCloudSave: true,
          emailPhoneAuth: process.env.NODE_ENV !== "production" || emailDelivery.configured || phoneDelivery.configured,
          inviteCodeAuth: process.env.INVITE_CODE_AUTH_ENABLED === "true",
          wechatAuth: Boolean(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET),
          pushDelivery: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
          stripeCheckout: Object.values(offerCatalog).some((offer) => Boolean(process.env[offer.envKey])),
          hyperframesWorker: Boolean(resolveBinary(root)),
          mediaGeneration: Boolean(process.env.OPENROUTER_API_KEY),
          safetyReview: Boolean(process.env.OPENAI_MODERATION_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY)
        },
        mediaStorage: mediaStorage.status(),
        registrationRegions: configuredRegistrationRegions(),
        allowedInternationalCountries: allowedInternationalCountries(),
        authDelivery: { email: emailDelivery.provider, phone: phoneDelivery.provider },
        beta: { inviteOnly: process.env.BETA_INVITE_ONLY === "true", inviteCodeAuth: process.env.INVITE_CODE_AUTH_ENABLED === "true", adultAccountOwnerOnly: process.env.BETA_ADULT_ACCOUNT_OWNER_ONLY === "true" },
        region: process.env.STORIESLENS_REGION || "local",
        dataMode: process.env.NODE_ENV === "production" ? "production" : "local-development"
      });
      return true;
    }

    if (requestUrl.pathname === "/api/launch-readiness" && request.method === "GET") {
      sendJson(response, 200, evaluateLaunchReadiness({ root, mediaStorageStatus: mediaStorage.status() }));
      return true;
    }

    if (requestUrl.pathname === "/api/notification-subscriptions" && request.method === "POST") {
      const body = await readJsonBody(request, 20_000);
      const { user } = sessionFor(request, response);
      const subscription = safeJsonValue(body.subscription, 16_000);
      if (!subscription.endpoint) {
        sendJson(response, 400, { error: "A valid browser notification subscription is required." });
        return true;
      }
      store.mutate((database) => {
        database.notificationSubscriptions = database.notificationSubscriptions.filter((item) => !(item.ownerId === user.id && item.endpoint === subscription.endpoint));
        database.notificationSubscriptions.push({ id: crypto.randomUUID(), ownerId: user.id, endpoint: cleanText(subscription.endpoint, 2000), subscription, createdAt: nowIso() });
      });
      sendJson(response, 201, { saved: true, deliveryConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) });
      return true;
    }
    return false;
  }

  const handlePlatformApi = async function handlePlatformApi(request, response, requestUrl) {
    try {
      if (await handleAdmin(request, response, requestUrl)) return true;
      if (await handleCredits(request, response, requestUrl)) return true;
      if (await handleAuth(request, response, requestUrl)) return true;
      if (await handleProjects(request, response, requestUrl)) return true;
      if (await handleMedia(request, response, requestUrl)) return true;
      if (await handleConsentAndSharing(request, response, requestUrl)) return true;
      if (await handleOrdersAndRender(request, response, requestUrl)) return true;
      if (await handleNotificationsAndStatus(request, response, requestUrl)) return true;
      return false;
    } catch (error) {
      sendJson(response, error.statusCode || 500, { code: error.code || "PLATFORM_REQUEST_FAILED", error: error.message || "StoriesLens could not complete this request." });
      return true;
    }
  };

  handlePlatformApi.creditManager = {
    ownerId(request, response) {
      return sessionFor(request, response).user.id;
    },
    reserve(request, response, { resource, units = 1, idempotencyKey, referenceType, referenceId, metadata }) {
      const { user } = sessionFor(request, response);
      return store.mutate((database) => reserveCredits(database, {
        userId: user.id,
        resource,
        units,
        idempotencyKey: cleanText(idempotencyKey || request.headers["idempotency-key"] || crypto.randomUUID(), 200),
        referenceType,
        referenceId,
        metadata
      }));
    },
    settle(reservationId, details = {}) {
      return store.mutate((database) => settleReservation(database, { reservationId, ...details }));
    },
    release(reservationId, reason) {
      return store.mutate((database) => releaseReservation(database, { reservationId, reason }));
    },
    recordUsage(request, response, { operation, model, costUsd = null, providerUsage = null }) {
      const { user } = sessionFor(request, response);
      return store.mutate((database) => {
        ensureCreditCollections(database);
        const event = {
          id: crypto.randomUUID(),
          userId: user.id,
          operation: cleanText(operation, 80) || "model-call",
          model: cleanText(model, 160),
          costUsd: costUsd != null && Number.isFinite(Number(costUsd)) ? Number(costUsd) : null,
          providerUsage: safeJsonValue(providerUsage, 12_000),
          createdAt: nowIso()
        };
        database.modelUsageEvents.push(event);
        database.modelUsageEvents = database.modelUsageEvents.slice(-50_000);
        return event;
      });
    }
  };

  return handlePlatformApi;
}

module.exports = { createPlatformApi };
