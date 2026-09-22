const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { fetchPublicHttps, queueFfmpegRender, resolveBinary: resolveFfmpegBinary } = require("./ffmpeg-movie-renderer");
const { buildBookDocx, convertDocxToPdf, resolveLibreOfficeBinary } = require("./book-export");
const { createRegionalObjectStorage } = require("./regional-object-storage");
const { assertLaunchReady, evaluateLaunchReadiness } = require("./launch-readiness");
const { createRequestRateLimiter } = require("./request-rate-limit");
const { createGrowthReport, REPORT_VERSION } = require("./book-recommendations");
const { STRIPE_OFFERS, createCheckoutSession, verifyWebhookSignature } = require("./stripe-payments");
const {
  ensureCreditCollections,
  publicPackageCatalog,
  walletFor,
  usageSummaryFor,
  grantPackage,
  ensureFreePreview,
  ensureGuestStoryStart,
  reserveCredits,
  settleReservation,
  releaseReservation,
  createInviteBatch,
  findInvite,
  validateInvite,
  redeemInvite,
  ensureReferral,
  attributeReferral,
  completeReferralReward,
  freeGiftProgress
} = require("./credit-system");

const SESSION_DAYS = 30;
const CHALLENGE_MINUTES = 10;
const MAX_PROJECTS_PER_USER = 100;
const MAX_SCENES = 24;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_GENERATED_VIDEO_BYTES = 100 * 1024 * 1024;
const DEFAULT_GUEST_MEDIA_QUOTA_BYTES = 20 * 1024 * 1024;
const DEFAULT_ACCOUNT_MEDIA_QUOTA_BYTES = 250 * 1024 * 1024;
const REGION_CONSENT_VERSION = "2026-09-14";
const ADMIN_SESSION_HOURS = 12;

const offerCatalog = Object.fromEntries(Object.entries(STRIPE_OFFERS).map(([id, offer]) => [id, {
  ...offer,
  price: `$${(offer.amountMinor / 100).toFixed(0)}`,
  fallbackUrl: `mailto:support@storieslens.com?subject=${encodeURIComponent(`Checkout help: ${offer.name}`)}`
}]));

function nowIso() {
  return new Date().toISOString();
}

function registrationInviteRequired() {
  return process.env.REGISTRATION_INVITE_REQUIRED === "true";
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

function readRawRequest(request, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413, code: "BODY_TOO_LARGE" }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
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
    projectReports: [],
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
    stripeEvents: [],
    modelUsageEvents: [],
    inviteBatches: [],
    inviteCodes: [],
    squads: [],
    squadMembers: [],
    squadCards: [],
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

function normalizeSquadCode(value) {
  return cleanText(value, 32).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function createSquadCode() {
  return `SQ${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function ensureSquadCollections(database) {
  database.squads ||= [];
  database.squadMembers ||= [];
  database.squadCards ||= [];
  return database;
}

function squadMembership(database, squadId, userId) {
  ensureSquadCollections(database);
  return database.squadMembers.find((member) => member.squadId === squadId && member.userId === userId && !member.removedAt) || null;
}

function publicSquad(database, squad, viewerId) {
  const viewer = squadMembership(database, squad.id, viewerId);
  const isOwner = squad.ownerId === viewerId;
  const members = database.squadMembers
    .filter((member) => member.squadId === squad.id && !member.removedAt && (isOwner || member.status === "approved" || member.userId === viewerId))
    .map((member) => ({
      id: member.id,
      displayName: member.displayName,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      approvedAt: member.approvedAt || ""
    }));
  const cards = database.squadCards
    .filter((card) => card.squadId === squad.id && !card.deletedAt && (isOwner || card.status === "approved" || card.authorId === viewerId))
    .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))
    .map((card) => {
      const canEdit = card.authorId === viewerId;
      const canSeeVisual = isOwner || canEdit || card.visualStatus === "approved";
      return {
        id: card.id,
        authorName: card.authorName,
        kind: card.kind,
        text: card.text,
        audioMediaId: card.audioMediaId || "",
        imageUrl: canSeeVisual ? (card.imageUrl || "") : "",
        videoUrl: canSeeVisual ? (card.videoUrl || "") : "",
        visualStatus: card.visualStatus || (card.imageUrl || card.videoUrl ? "approved" : "none"),
        yuGuided: card.yuGuided === true,
        canEdit,
        status: card.status,
        position: card.position,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt
      };
    });
  return {
    id: squad.id,
    title: squad.title,
    language: squad.language,
    outputType: squad.outputType,
    joinCode: isOwner ? squad.joinCode : "",
    status: squad.status,
    visualStyle: squad.visualStyle || (squad.language === "zh" ? "ink-watercolor" : "storybook-watercolor"),
    characterRules: squad.characterRules || "",
    visualAnchorReady: Boolean(squad.visualAnchorImageUrl),
    visualAnchorImageUrl: viewer?.status === "approved" ? (squad.visualAnchorImageUrl || "") : "",
    visualVersion: Number(squad.visualVersion || 1),
    visualSettingsLocked: true,
    visualSettingsLockedAt: squad.visualSettingsLockedAt || squad.createdAt,
    createdAt: squad.createdAt,
    updatedAt: squad.updatedAt,
    assembledProjectId: squad.assembledProjectId || "",
    viewer: viewer ? { membershipId: viewer.id, role: viewer.role, status: viewer.status, displayName: viewer.displayName } : null,
    members,
    cards
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
    completedAt: cleanText(existing.completedAt || input.completedAt, 40),
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
    assertLaunchReady({ root, mediaStorageStatus: mediaStorage.status(), renderWorkerReady: Boolean(resolveFfmpegBinary()), pdfRendererReady: Boolean(resolveLibreOfficeBinary()) });
  }

  function publicMedia(media) {
    return {
      id: media.id,
      projectId: media.projectId,
      squadId: media.squadId || "",
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
      const hasFirstPictureGrant = database.creditTransactions?.some((entry) => entry.userId === user.id
        && entry.resource === "imageGenerations"
        && ["free-preview", "guest-story-start"].includes(entry.packageId));
      const guestResources = new Set(database.creditTransactions?.filter((entry) => entry.userId === user.id && entry.packageId === "guest-story-start").map((entry) => entry.resource));
      const guestStartComplete = guestResources.has("storyProjects") && guestResources.has("imageGenerations");
      if (create && ((user.kind === "account" && !hasFirstPictureGrant) || (user.kind === "guest" && !guestStartComplete))) {
        return store.mutate((nextDatabase) => {
          ensureCreditCollections(nextDatabase);
          if (user.kind === "account") ensureFreePreview(nextDatabase, user.id);
          else ensureGuestStoryStart(nextDatabase, user.id);
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
      ensureGuestStoryStart(nextDatabase, user.id);
      setSessionCookie(request, response, session.id, session.expiresAt);
      return { database: nextDatabase, session, user };
    });
  }

  function requireProject(database, user, projectId) {
    return database.projects.find((project) => project.id === projectId && project.ownerId === user.id && !project.deletedAt);
  }

  async function loadProjectImage(database, user, project, rawUrl) {
    const imageUrl = cleanUrl(rawUrl);
    if (!imageUrl) return null;
    const privateMatch = imageUrl.match(/^\/api\/media\/([^/?#]+)/);
    if (privateMatch) {
      const mediaId = cleanId(privateMatch[1]);
      const sourceSquadId = cleanId(project.clientSnapshot?.squadId);
      const media = database.media.find((item) => item.id === mediaId && item.kind === "image" && (item.ownerId === user.id || (sourceSquadId && item.squadId === sourceSquadId)));
      const stored = media ? await mediaStorage.get(media) : null;
      return stored ? { buffer: stored.body, mimeType: stored.contentType || media.mimeType } : null;
    }
    if (/^\/(?:assets|public\/generated)\//.test(imageUrl)) {
      const filePath = path.resolve(root, imageUrl.replace(/^\/+/, ""));
      const relative = path.relative(path.resolve(root), filePath);
      if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(filePath)) return null;
      const extension = path.extname(filePath).toLowerCase();
      const mimeType = ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".bmp": "image/bmp" })[extension];
      return mimeType ? { buffer: fs.readFileSync(filePath), mimeType } : null;
    }
    if (/^https:\/\//i.test(imageUrl)) {
      const result = await fetchPublicHttps(imageUrl, { timeoutMs: 30_000 });
      if (!result.ok) return null;
      const mimeType = String(result.headers.get("content-type") || "").split(";")[0].toLowerCase();
      if (!mimeType.startsWith("image/")) return null;
      const declaredBytes = Number(result.headers.get("content-length") || 0);
      if (declaredBytes > MAX_IMAGE_BYTES) return null;
      const buffer = Buffer.from(await result.arrayBuffer());
      return buffer.length && buffer.length <= MAX_IMAGE_BYTES ? { buffer, mimeType } : null;
    }
    return null;
  }

  function removeRenderArtifacts(jobs) {
    const renderRoot = path.resolve(root, ".data", "render-jobs");
    for (const job of jobs) {
      if (!job.outputFilePath) continue;
      const jobDirectory = path.dirname(path.resolve(job.outputFilePath));
      const relative = path.relative(renderRoot, jobDirectory);
      if (!relative.startsWith("..") && !path.isAbsolute(relative)) fs.rmSync(jobDirectory, { recursive: true, force: true });
    }
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

  function stripeConfigured() {
    const secretKey = cleanText(process.env.STRIPE_SECRET_KEY, 300);
    const webhookSecret = cleanText(process.env.STRIPE_WEBHOOK_SECRET, 300);
    const liveExpected = process.env.STRIPE_LIVE_MODE === "true";
    const keyMatchesMode = liveExpected
      ? /^(?:sk|rk)_live_/.test(secretKey)
      : /^(?:sk|rk)_test_/.test(secretKey);
    return { secretKey, webhookSecret, liveExpected, ready: keyMatchesMode && webhookSecret.startsWith("whsec_") };
  }

  function ensureStripeCollections(database) {
    database.stripeEvents ||= [];
    database.orders ||= [];
    ensureCreditCollections(database);
  }

  function fulfillStripeSession(database, event, session) {
    ensureStripeCollections(database);
    if (database.stripeEvents.some((item) => item.id === event.id)) return { duplicate: true };
    const orderId = cleanId(session?.metadata?.order_id || session?.client_reference_id);
    const order = database.orders.find((item) => item.id === orderId && item.paymentProvider === "stripe");
    const offer = order ? offerCatalog[order.offerId] : null;
    const expectedLiveMode = process.env.STRIPE_LIVE_MODE === "true";
    const sessionPaymentIntent = typeof session?.payment_intent === "string" ? session.payment_intent : session?.payment_intent?.id || "";
    const amountMatches = Number(session?.amount_total) === Number(offer?.amountMinor);
    const currencyMatches = String(session?.currency || "").toLowerCase() === String(offer?.currency || "").toLowerCase();
    const metadataMatches = Boolean(order && offer
      && session?.client_reference_id === order.id
      && session?.metadata?.account_id === order.ownerId
      && session?.metadata?.offer_id === order.offerId
      && String(session?.metadata?.package_id || "") === String(offer.packageId || ""));
    const liveModeMatches = Boolean(session?.livemode) === expectedLiveMode;
    const paid = ["paid", "no_payment_required"].includes(session?.payment_status);
    const accepted = metadataMatches && amountMatches && currencyMatches && liveModeMatches && paid;

    if (!accepted) {
      if (order) {
        order.status = paid ? "payment_verification_failed" : "payment_processing";
        order.updatedAt = nowIso();
      }
      database.stripeEvents.push({ id: cleanId(event.id), type: cleanText(event.type, 80), orderId, status: paid ? "rejected" : "pending", createdAt: nowIso() });
      return { accepted: false, order, reason: paid ? "Payment details did not match the server order." : "Payment is not final yet." };
    }

    let grant = null;
    if (offer.packageId) {
      grant = grantPackage(database, {
        userId: order.ownerId,
        packageId: offer.packageId,
        source: "stripe-checkout",
        referenceId: session.id,
        idempotencyKey: `stripe:${session.id}`,
        note: `${offer.name} paid through Stripe`,
        createdBy: "stripe-webhook"
      });
    }
    if (!database.creditSales.some((item) => item.providerReference === session.id)) {
      database.creditSales.push({
        id: crypto.randomUUID(),
        userId: order.ownerId,
        packageId: offer.packageId || "guided-service",
        offerId: order.offerId,
        amountMinor: Number(session.amount_total),
        currency: String(session.currency || "usd").toUpperCase(),
        status: "recorded",
        source: "stripe-checkout",
        providerReference: session.id,
        paymentIntentId: cleanId(sessionPaymentIntent),
        createdAt: nowIso()
      });
    }
    const customerEmail = validateDestination("email", session?.customer_details?.email);
    Object.assign(order, {
      status: "paid",
      paidAt: order.paidAt || nowIso(),
      stripeCheckoutSessionId: cleanId(session.id),
      stripePaymentIntentId: cleanId(sessionPaymentIntent),
      amountPaidMinor: Number(session.amount_total),
      currency: String(session.currency || "usd").toUpperCase(),
      customerEmailMasked: customerEmail ? maskDestination("email", customerEmail) : "",
      customerEmailHash: customerEmail ? hashValue(`stripe-email:${customerEmail}`) : "",
      updatedAt: nowIso()
    });
    database.stripeEvents.push({ id: cleanId(event.id), type: cleanText(event.type, 80), orderId: order.id, status: "fulfilled", createdAt: nowIso() });
    return { accepted: true, order, grant };
  }

  function recordStripeRefund(database, event, charge) {
    ensureStripeCollections(database);
    if (database.stripeEvents.some((item) => item.id === event.id)) return { duplicate: true };
    const paymentIntentId = cleanId(typeof charge?.payment_intent === "string" ? charge.payment_intent : charge?.payment_intent?.id);
    const order = database.orders.find((item) => item.paymentProvider === "stripe" && item.stripePaymentIntentId === paymentIntentId);
    if (order) {
      const fullRefund = Number(charge.amount_refunded) >= Number(charge.amount);
      const paidAmount = Math.max(1, Number(charge.amount) || Number(order.amountPaidMinor) || 1);
      const refundedAmount = Math.max(0, Math.min(paidAmount, Number(charge.amount_refunded) || 0));
      const creditAdjustment = reverseUnusedOrderCredits(database, order, {
        fraction: refundedAmount / paidAmount,
        full: fullRefund,
        reason: fullRefund ? "full-refund" : "partial-refund",
        eventId: event.id
      });
      order.status = fullRefund ? "refunded" : "partially_refunded";
      order.amountRefundedMinor = Math.max(0, Number(charge.amount_refunded) || 0);
      order.refundCreditAdjustment = creditAdjustment;
      order.updatedAt = nowIso();
      const sale = database.creditSales.find((item) => item.providerReference === order.stripeCheckoutSessionId);
      if (sale) {
        sale.status = fullRefund ? "refunded" : "partially_refunded";
        sale.amountRefundedMinor = order.amountRefundedMinor;
        sale.updatedAt = nowIso();
      }
    }
    database.stripeEvents.push({ id: cleanId(event.id), type: cleanText(event.type, 80), orderId: order?.id || "", status: order ? "refund-applied" : "unmatched", createdAt: nowIso() });
    return { order };
  }

  function purchasedGrantEntries(database, order) {
    return database.creditTransactions.filter((entry) => entry.userId === order.ownerId
      && entry.type === "grant"
      && entry.source === "stripe-checkout"
      && entry.packageId === order.packageId
      && entry.referenceId === order.stripeCheckoutSessionId);
  }

  function reverseUnusedOrderCredits(database, order, { fraction = 1, full = false, reason, eventId }) {
    const grants = purchasedGrantEntries(database, order);
    const byResource = new Map();
    grants.forEach((entry) => byResource.set(entry.resource, (byResource.get(entry.resource) || 0) + Math.max(0, Number(entry.delta) || 0)));
    const adjusted = {};
    const shortfall = {};
    byResource.forEach((grantedUnits, resource) => {
      const targetUnits = full ? grantedUnits : Math.floor(grantedUnits * Math.max(0, Math.min(1, fraction)));
      const alreadyReversed = database.creditTransactions
        .filter((entry) => entry.userId === order.ownerId && entry.orderId === order.id && entry.resource === resource && entry.type === "reversal" && entry.reason !== "payment-dispute")
        .reduce((total, entry) => total + Math.abs(Number(entry.delta) || 0), 0);
      const unitsNeeded = Math.max(0, targetUnits - alreadyReversed);
      const units = Math.min(unitsNeeded, walletFor(database, order.ownerId).resources[resource]?.remaining || 0);
      if (units > 0) {
        database.creditTransactions.push({
          id: crypto.randomUUID(),
          userId: order.ownerId,
          resource,
          delta: -units,
          type: "reversal",
          source: "stripe-refund",
          packageId: order.packageId,
          referenceId: cleanId(eventId),
          orderId: order.id,
          reason,
          idempotencyKey: `stripe-refund:${order.id}:${resource}:${targetUnits}`,
          createdBy: "stripe-webhook",
          createdAt: nowIso()
        });
      }
      adjusted[resource] = units;
      shortfall[resource] = Math.max(0, unitsNeeded - units);
    });
    return { adjusted, shortfall, requiresReview: Object.values(shortfall).some((units) => units > 0) };
  }

  function recordStripeDispute(database, event, dispute) {
    ensureStripeCollections(database);
    if (database.stripeEvents.some((item) => item.id === event.id)) return { duplicate: true };
    const paymentIntentId = cleanId(typeof dispute?.payment_intent === "string" ? dispute.payment_intent : dispute?.payment_intent?.id);
    const disputeId = cleanId(dispute?.id);
    const order = database.orders.find((item) => item.paymentProvider === "stripe" && item.stripePaymentIntentId === paymentIntentId);
    if (order && ["charge.dispute.created", "charge.dispute.funds_withdrawn"].includes(event.type)) {
      const grants = purchasedGrantEntries(database, order);
      const resources = new Map();
      grants.forEach((entry) => resources.set(entry.resource, (resources.get(entry.resource) || 0) + Math.max(0, Number(entry.delta) || 0)));
      const frozen = {};
      resources.forEach((grantedUnits, resource) => {
        const existing = database.creditReservations.find((entry) => entry.referenceType === "payment-dispute" && entry.referenceId === disputeId && entry.resource === resource);
        if (existing) return;
        const units = Math.min(grantedUnits, walletFor(database, order.ownerId).resources[resource]?.remaining || 0);
        if (units < 1) return;
        reserveCredits(database, {
          userId: order.ownerId,
          resource,
          units,
          idempotencyKey: `stripe-dispute:${disputeId}:${resource}`,
          referenceType: "payment-dispute",
          referenceId: disputeId,
          metadata: { orderId: order.id }
        });
        frozen[resource] = units;
      });
      order.status = "disputed_frozen";
      order.stripeDisputeId = disputeId;
      order.disputeFrozenCredits = frozen;
      order.updatedAt = nowIso();
    } else if (order && ["charge.dispute.closed", "charge.dispute.funds_reinstated"].includes(event.type)) {
      const won = event.type === "charge.dispute.funds_reinstated" || dispute?.status === "won";
      const reservations = database.creditReservations.filter((entry) => entry.referenceType === "payment-dispute" && entry.referenceId === disputeId && entry.status === "reserved");
      reservations.forEach((reservation) => {
        if (won) {
          releaseReservation(database, { reservationId: reservation.id, reason: "stripe-dispute-won" });
        } else {
          reservation.status = "settled";
          reservation.settledAt = nowIso();
          database.creditTransactions.push({
            id: crypto.randomUUID(), userId: reservation.userId, resource: reservation.resource, delta: -reservation.units,
            type: "reversal", source: "stripe-dispute", referenceId: disputeId, orderId: order.id, reason: "payment-dispute",
            reservationId: reservation.id, idempotencyKey: `stripe-dispute-lost:${disputeId}:${reservation.resource}`,
            createdBy: "stripe-webhook", createdAt: nowIso()
          });
        }
      });
      order.status = won ? "paid" : "dispute_lost";
      order.updatedAt = nowIso();
    }
    database.stripeEvents.push({ id: cleanId(event.id), type: cleanText(event.type, 80), orderId: order?.id || "", status: order ? "dispute-recorded" : "unmatched", createdAt: nowIso() });
    return { order };
  }

  async function handlePayments(request, response, requestUrl) {
    if (requestUrl.pathname === "/api/stripe/webhook" && request.method === "POST") {
      const stripe = stripeConfigured();
      try {
        const rawBody = await readRawRequest(request);
        verifyWebhookSignature(rawBody, request.headers["stripe-signature"], stripe.webhookSecret);
        const event = JSON.parse(rawBody);
        if (!/^evt_/.test(String(event.id || "")) || !event.type || !event.data?.object) throw Object.assign(new Error("Stripe event is malformed."), { statusCode: 400, code: "STRIPE_EVENT_INVALID" });
        let result = { ignored: true };
        if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
          result = store.mutate((database) => fulfillStripeSession(database, event, event.data.object));
        } else if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) {
          result = store.mutate((database) => {
            ensureStripeCollections(database);
            if (database.stripeEvents.some((item) => item.id === event.id)) return { duplicate: true };
            const session = event.data.object;
            const order = database.orders.find((item) => item.id === cleanId(session?.metadata?.order_id || session?.client_reference_id) && item.paymentProvider === "stripe");
            if (order && order.status !== "paid") Object.assign(order, { status: event.type.endsWith("expired") ? "expired" : "payment_failed", updatedAt: nowIso() });
            database.stripeEvents.push({ id: cleanId(event.id), type: cleanText(event.type, 80), orderId: order?.id || "", status: "recorded", createdAt: nowIso() });
            return { order };
          });
        } else if (event.type === "charge.refunded") {
          result = store.mutate((database) => recordStripeRefund(database, event, event.data.object));
        } else if (["charge.dispute.created", "charge.dispute.funds_withdrawn", "charge.dispute.closed", "charge.dispute.funds_reinstated"].includes(event.type)) {
          result = store.mutate((database) => recordStripeDispute(database, event, event.data.object));
        } else {
          store.mutate((database) => {
            ensureStripeCollections(database);
            if (!database.stripeEvents.some((item) => item.id === event.id)) database.stripeEvents.push({ id: cleanId(event.id), type: cleanText(event.type, 80), orderId: "", status: "ignored", createdAt: nowIso() });
          });
        }
        sendJson(response, 200, { received: true, duplicate: Boolean(result?.duplicate) });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { code: error.code || "STRIPE_WEBHOOK_FAILED", error: error.message || "Stripe webhook could not be verified." });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/checkout-link" && request.method === "POST") {
      if (!rateLimiter.consume(request, response, { bucket: "checkout-create", limit: 10, windowMs: 60 * 60 * 1000, sendJson })) return true;
      const { user } = sessionFor(request, response, { create: false });
      if (!user || user.kind !== "account") {
        sendJson(response, 401, { code: "SIGN_IN_REQUIRED", error: "Sign in with the parent or adult creator account before checkout." });
        return true;
      }
      const stripe = stripeConfigured();
      if (!stripe.ready) {
        sendJson(response, 503, { code: "STRIPE_NOT_CONFIGURED", error: "Secure Stripe checkout is not connected yet." });
        return true;
      }
      const body = await readJsonBody(request, 12_000);
      const offerId = cleanId(body.offer);
      const offer = offerCatalog[offerId];
      if (!offer) {
        sendJson(response, 400, { error: "Choose a valid StoriesLens package." });
        return true;
      }
      const order = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        projectId: cleanId(body.projectId),
        region: user.primaryRegion || "intl",
        offerId,
        packageId: offer.packageId || "",
        name: offer.name,
        price: offer.price,
        expectedAmountMinor: offer.amountMinor,
        currency: offer.currency.toUpperCase(),
        paymentProvider: "stripe",
        status: "creating_checkout",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.mutate((database) => {
        ensureStripeCollections(database);
        database.orders.push(order);
      });
      try {
        const session = await createCheckoutSession({
          secretKey: stripe.secretKey,
          apiBaseUrl: process.env.STRIPE_API_BASE_URL || "https://api.stripe.com",
          publicBaseUrl: process.env.PUBLIC_BASE_URL,
          order,
          offer
        });
        store.mutate((database) => {
          const stored = database.orders.find((item) => item.id === order.id);
          if (stored) Object.assign(stored, { status: "awaiting_payment", stripeCheckoutSessionId: session.id, checkoutExpiresAt: session.expiresAt, updatedAt: nowIso() });
        });
        sendJson(response, 201, { checkoutUrl: session.url, sessionId: session.id, orderId: order.id, offer: { id: offerId, name: offer.name, price: offer.price } });
      } catch (error) {
        store.mutate((database) => {
          const stored = database.orders.find((item) => item.id === order.id);
          if (stored) Object.assign(stored, { status: "checkout_failed", paymentError: cleanText(error.message, 240), updatedAt: nowIso() });
        });
        sendJson(response, error.statusCode || 502, { code: error.code || "STRIPE_CHECKOUT_FAILED", error: error.message || "Stripe checkout could not be opened." });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/payments/checkout-status" && request.method === "GET") {
      const { database, user } = sessionFor(request, response, { create: false });
      if (!user || user.kind !== "account") {
        sendJson(response, 401, { error: "Sign in to view this purchase." });
        return true;
      }
      const sessionId = cleanId(requestUrl.searchParams.get("session_id"));
      const order = database.orders.find((item) => item.ownerId === user.id && item.stripeCheckoutSessionId === sessionId);
      if (!order) {
        sendJson(response, 404, { error: "Purchase not found for this account." });
        return true;
      }
      sendJson(response, 200, { order: { id: order.id, offerId: order.offerId, name: order.name, status: order.status, paidAt: order.paidAt || "", amountPaidMinor: order.amountPaidMinor || 0, currency: order.currency }, wallet: order.status === "paid" ? walletFor(database, user.id) : null });
      return true;
    }
    return false;
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
        if (user.kind === "account") ensureFreePreview(database, user.id);
        const wallet = walletFor(database, user.id);
        const summary = usageSummaryFor(database, user.id);
        return {
          wallet,
          freeGift: freeGiftProgress(database, user.id),
          referral: user.kind === "account" ? (() => {
            const referral = ensureReferral(database, user.id);
            return {
              code: referral.code,
              url: `/login.html?ref=${encodeURIComponent(referral.code)}`,
              completed: database.referrals.filter((entry) => entry.kind === "attribution" && entry.referrerUserId === user.id && entry.status === "rewarded").length,
              pending: database.referrals.filter((entry) => entry.kind === "attribution" && entry.referrerUserId === user.id && entry.status !== "rewarded").length
            };
          })() : null,
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
    if (requestUrl.pathname === "/api/credits/unlock-learning-gift" && request.method === "POST") {
      if (!rateLimiter.consume(request, response, { bucket: "learning-gift", limit: 20, windowMs: 60 * 60 * 1000, sendJson })) return true;
      const { user } = sessionFor(request, response, { create: false });
      if (!user) {
        sendJson(response, 401, { error: "Sign in or start a private creation before unlocking this gift." });
        return true;
      }
      const body = await readJsonBody(request);
      const projectId = cleanId(body.projectId);
      const result = store.mutate((database) => {
        const project = database.projects.find((entry) => entry.id === projectId && entry.ownerId === user.id && !entry.deletedAt);
        const eligible = Boolean(project?.clientSnapshot?.mentorRevisionCompleted && project?.clientSnapshot?.readingConfirmed && project?.draft?.trim());
        if (!eligible) return { unlocked: false, eligible: false, wallet: walletFor(database, user.id) };
        const grant = grantPackage(database, {
          userId: user.id,
          packageId: "revision-read-gift",
          source: "earned-learning",
          referenceId: project.id,
          idempotencyKey: `revision-read:${user.id}`,
          createdBy: "learning-gift-system"
        });
        return { unlocked: !grant.duplicate, eligible: true, wallet: grant.wallet, freeGift: freeGiftProgress(database, user.id) };
      });
      sendJson(response, 200, result);
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
    if (requestUrl.pathname === "/api/admin/print-orders" && request.method === "GET") {
      const database = store.read();
      const orders = (database.orders || [])
        .filter((item) => item.orderType === "print_quote")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 200)
        .map((order) => {
          const user = database.users.find((item) => item.id === order.ownerId);
          const project = database.projects.find((item) => item.id === order.projectId);
          return {
            ...order,
            customer: user ? { displayName: user.displayName, maskedDestination: user.maskedDestination, region: user.primaryRegion } : null,
            projectTitle: project?.title || "Deleted story"
          };
        });
      sendJson(response, 200, { orders });
      return true;
    }
    const adminPrintOrderMatch = requestUrl.pathname.match(/^\/api\/admin\/print-orders\/([^/]+)$/);
    if (adminPrintOrderMatch && request.method === "PATCH") {
      assertSameOrigin(request);
      const body = await readJsonBody(request, 12_000);
      const orderId = cleanId(decodeURIComponent(adminPrintOrderMatch[1]));
      const status = ["quote_requested", "quoted", "in_production", "shipped", "cancelled"].includes(body.status) ? body.status : "quoted";
      const currency = body.currency === "CNY" ? "CNY" : "USD";
      const amountMinor = Math.max(0, Math.round(Number(body.amountMinor) || 0));
      const order = store.mutate((database) => {
        const stored = (database.orders || []).find((item) => item.id === orderId && item.orderType === "print_quote");
        if (!stored) throw Object.assign(new Error("Print request not found."), { statusCode: 404 });
        stored.status = status;
        stored.quote = amountMinor ? {
          amountMinor,
          currency,
          includes: cleanText(body.includes || "Printing and tracked delivery", 240),
          expiresAt: addDays(new Date(), Math.max(1, Math.min(30, Number(body.validDays) || 7)))
        } : stored.quote || null;
        stored.price = amountMinor ? `${currency === "CNY" ? "¥" : "$"}${(amountMinor / 100).toFixed(2)}` : stored.price;
        stored.adminNote = cleanText(body.adminNote, 500);
        stored.updatedAt = nowIso();
        return stored;
      });
      sendJson(response, 200, { order });
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
    if (requestUrl.pathname === "/api/admin/invites/send" && request.method === "POST") {
      assertSameOrigin(request);
      if (!process.env.RESEND_API_KEY) {
        sendJson(response, 503, { error: "Resend is not configured on this server." });
        return true;
      }
      const body = await readJsonBody(request, 80_000);
      const deliveries = Array.isArray(body.deliveries) ? body.deliveries.slice(0, 100) : [];
      if (!deliveries.length) {
        sendJson(response, 400, { error: "Add at least one recipient email and invitation code." });
        return true;
      }
      const database = store.read();
      const prepared = deliveries.map((delivery) => {
        const email = validateDestination("email", delivery.email);
        const code = normalizeInviteCode(delivery.code);
        const invite = findInvite(database, code);
        if (!email || !invite) throw Object.assign(new Error("Check every recipient email and invitation code."), { statusCode: 400, code: "INVALID_INVITE_DELIVERY" });
        validateInvite(database, invite, invite.region);
        const batch = database.inviteBatches.find((item) => item.id === invite.batchId);
        return { email, code, invite, batch };
      });
      const from = cleanText(process.env.AUTH_EMAIL_FROM || "StoriesLens <login@storieslens.com>", 320);
      const results = [];
      for (const item of prepared) {
        const redeemUrl = `https://www.storieslens.com/my-stories.html?redeem=${encodeURIComponent(item.code)}`;
        const responseFromProvider = await fetch(cleanText(process.env.RESEND_API_URL, 800) || "https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `storieslens-invite-${item.invite.id}-${hashValue(item.email).slice(0, 16)}`
          },
          body: JSON.stringify({
            from,
            to: [item.email],
            subject: "Your private StoriesLens invitation · 你的 StoriesLens 邀请码",
            text: `You have been invited to StoriesLens. Your private invitation code is ${item.code}. Open ${redeemUrl} to sign in and redeem it. This invitation is for the intended recipient only.\n\n你已受邀加入 StoriesLens。你的私人邀请码是 ${item.code}。请打开 ${redeemUrl}，登录后兑换额度。请勿公开分享此邀请码。`,
            html: `<div style="font-family:Arial,sans-serif;color:#102824;line-height:1.65;max-width:620px"><p style="color:#14724f;font-weight:700;letter-spacing:.12em">STORIESLENS PRIVATE BETA</p><h1 style="font-family:Georgia,serif">Your invitation is ready.</h1><p>Use this private code after signing in:</p><p style="font-size:24px;font-weight:800;letter-spacing:2px;padding:16px;background:#f2f6ef;border-radius:12px">${escapeHtml(item.code)}</p><p><a href="${escapeHtml(redeemUrl)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#14724f;color:white;text-decoration:none;font-weight:700">Open StoriesLens</a></p><hr style="border:0;border-top:1px solid #d9e3dc;margin:28px 0"><h2 style="font-family:Georgia,serif">你的邀请已准备好</h2><p>登录后输入上方私人邀请码，即可领取创作额度。请勿公开分享。</p></div>`
          })
        });
        if (!responseFromProvider.ok) throw Object.assign(new Error("An invitation email could not be delivered. Check the address and try again."), { statusCode: 502, code: "INVITE_EMAIL_FAILED" });
        results.push({ email: maskDestination("email", item.email), delivered: true });
      }
      sendJson(response, 200, { delivered: results.length, results });
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
        sendJson(response, 403, { error: "Registration is not currently available in this region." });
        return true;
      }
      const countryCode = countryForRegion(requestedRegion.primaryRegion, body.countryCode);
      if (!countryCode) {
        sendJson(response, 400, { error: "Choose the country where the account will be used." });
        return true;
      }
      if (requestedRegion.primaryRegion === "intl" && !allowedInternationalCountries().includes(countryCode)) {
        sendJson(response, 403, { error: "Registration is not currently available in this country or region." });
        return true;
      }
      if (process.env.BETA_ADULT_ACCOUNT_OWNER_ONLY === "true" && body.ageGroup !== "adult") {
        sendJson(response, 403, { error: "A parent or guardian must own the account for a young creator." });
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
        sendJson(response, 403, { error: "Registration is not currently available in this country or region." });
        return true;
      }
      if (process.env.BETA_ADULT_ACCOUNT_OWNER_ONLY === "true" && body.ageGroup !== "adult") {
        sendJson(response, 403, { error: "A parent or guardian must own the account. Young creators can create inside that adult-owned account." });
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
        if (registrationInviteRequired() && !inviteAccess) {
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
        const isNewAccount = !account;
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
        if (isNewAccount) attributeReferral(database, { referredUserId: account.id, rawCode: body.referralCode });
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
        const existingFirstScene = database.projects.find((project) => project.ownerId === account.id && !project.deletedAt && project.clientSnapshot?.firstPageCreated && project.draft?.trim());
        if (existingFirstScene) completeReferralReward(database, { referredUserId: account.id, projectId: existingFirstScene.id });
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
      const ownedRenderJobs = current.database.renderJobs.filter((item) => item.ownerId === current.user.id);
      for (const media of ownedMedia) await mediaStorage.remove(media);
      removeRenderArtifacts(ownedRenderJobs);
      store.mutate((database) => {
        const projectIds = new Set(database.projects.filter((item) => item.ownerId === current.user.id).map((item) => item.id));
        database.users = database.users.filter((item) => item.id !== current.user.id);
        database.sessions = database.sessions.filter((item) => item.userId !== current.user.id);
        database.projects = database.projects.filter((item) => item.ownerId !== current.user.id);
        database.projectReports = (database.projectReports || []).filter((item) => item.ownerId !== current.user.id);
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
        const ownedSquadIds = new Set((database.squads || []).filter((item) => item.ownerId === current.user.id).map((item) => item.id));
        database.squads = (database.squads || []).filter((item) => item.ownerId !== current.user.id);
        database.squadMembers = (database.squadMembers || []).filter((item) => item.userId !== current.user.id && !ownedSquadIds.has(item.squadId));
        database.squadCards = (database.squadCards || []).filter((item) => item.authorId !== current.user.id && !ownedSquadIds.has(item.squadId));
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
      const projectResource = body.mode === "classroom" ? "classroomProjects" : "storyProjects";
      const reserved = store.mutate((nextDatabase) => reserveCredits(nextDatabase, {
        userId: user.id,
        resource: projectResource,
        units: 1,
        idempotencyKey: `project:${requestKey}`,
        referenceType: body.mode === "classroom" ? "classroom-project" : "story-project",
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
          completeReferralReward(nextDatabase, { referredUserId: user.id, projectId: project.id });
        });
        sendJson(response, 201, { project, wallet: walletFor(store.read(), user.id) });
      } catch (error) {
        store.mutate((nextDatabase) => releaseReservation(nextDatabase, { reservationId: reserved.reservation.id, reason: "project-create-failed" }));
        throw error;
      }
      return true;
    }

    const projectExportMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/export\/(docx|pdf)$/);
    if (projectExportMatch) {
      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method not allowed" });
        return true;
      }
      const format = projectExportMatch[2];
      if (!rateLimiter.consume(request, response, { bucket: `book-export-${format}`, limit: format === "pdf" ? 10 : 30, windowMs: 60 * 60 * 1000, sendJson })) return true;
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(decodeURIComponent(projectExportMatch[1])));
      if (!project) {
        sendJson(response, 404, { error: "Story project not found." });
        return true;
      }
      const book = await buildBookDocx(project, {
        loadImage: (imageUrl) => loadProjectImage(database, user, project, imageUrl)
      });
      const artifact = format === "pdf" ? await convertDocxToPdf(root, book.buffer, book.filename) : book;
      response.writeHead(200, {
        "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Length": artifact.buffer.length,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(artifact.filename)}`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, noarchive",
        "X-StoriesLens-Book-Format": "A5-Lightyear"
      });
      response.end(artifact.buffer);
      return true;
    }

    const projectReportMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/report$/);
    if (projectReportMatch) {
      const projectId = cleanId(decodeURIComponent(projectReportMatch[1]));
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, projectId);
      if (!project) {
        sendJson(response, 404, { error: "Story project not found." });
        return true;
      }
      const existingReport = (database.projectReports || []).find((report) => report.projectId === project.id && report.ownerId === user.id);
      if (request.method === "GET") {
        sendJson(response, 200, {
          report: existingReport || null,
          reportStale: Boolean(existingReport && existingReport.reportVersion !== REPORT_VERSION),
          project
        });
        return true;
      }
      if (request.method === "POST") {
        const generated = createGrowthReport(project);
        const createdAt = nowIso();
        const report = {
          id: existingReport?.id || crypto.randomUUID(),
          projectId: project.id,
          ownerId: user.id,
          createdAt: existingReport?.createdAt || createdAt,
          updatedAt: createdAt,
          ...generated
        };
        const completedProject = store.mutate((nextDatabase) => {
          nextDatabase.projectReports ||= [];
          const storedProject = nextDatabase.projects.find((item) => item.id === project.id && item.ownerId === user.id && !item.deletedAt);
          if (storedProject && !storedProject.completedAt) storedProject.completedAt = createdAt;
          const index = nextDatabase.projectReports.findIndex((item) => item.projectId === project.id && item.ownerId === user.id);
          if (index >= 0) nextDatabase.projectReports[index] = report;
          else nextDatabase.projectReports.push(report);
          return storedProject || project;
        });
        sendJson(response, existingReport ? 200 : 201, { report, project: completedProject });
        return true;
      }
      sendJson(response, 405, { error: "Method not allowed" });
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
        completeReferralReward(nextDatabase, { referredUserId: user.id, projectId: nextProject.id });
        return nextProject;
      });
      sendJson(response, 200, { project: updated });
      return true;
    }

    if (request.method === "DELETE") {
      if (requestUrl.searchParams.get("permanent") === "true") {
        const body = await readJsonBody(request);
        if (body.confirmation !== "DELETE PROJECT AND MEDIA") {
          sendJson(response, 400, { error: "Type DELETE PROJECT AND MEDIA to confirm permanent deletion." });
          return true;
        }
        const projectMedia = database.media.filter((item) => item.ownerId === user.id && item.projectId === projectId);
        const projectRenderJobs = (database.renderJobs || []).filter((item) => item.ownerId === user.id && item.projectId === projectId);
        for (const media of projectMedia) await mediaStorage.remove(media);
        removeRenderArtifacts(projectRenderJobs);
        store.mutate((nextDatabase) => {
          nextDatabase.projects = nextDatabase.projects.filter((item) => !(item.id === projectId && item.ownerId === user.id));
          nextDatabase.projectReports = (nextDatabase.projectReports || []).filter((report) => !(report.projectId === projectId && report.ownerId === user.id));
          nextDatabase.media = nextDatabase.media.filter((item) => !(item.projectId === projectId && item.ownerId === user.id));
          nextDatabase.guardianConsents = (nextDatabase.guardianConsents || []).filter((item) => item.projectId !== projectId);
          nextDatabase.shares = (nextDatabase.shares || []).filter((item) => item.projectId !== projectId);
          nextDatabase.orders = (nextDatabase.orders || []).filter((item) => item.projectId !== projectId);
          nextDatabase.renderJobs = (nextDatabase.renderJobs || []).filter((item) => !(item.projectId === projectId && item.ownerId === user.id));
          nextDatabase.productEvents = (nextDatabase.productEvents || []).filter((item) => item.projectId !== projectId);
        });
        sendJson(response, 200, { deleted: true, mediaDeleted: projectMedia.length });
        return true;
      }
      store.mutate((nextDatabase) => {
        const stored = nextDatabase.projects.find((item) => item.id === projectId && item.ownerId === user.id);
        stored.deletedAt = nowIso();
        stored.purgeAfter = addDays(new Date(), 30);
        nextDatabase.projectReports = (nextDatabase.projectReports || []).filter((report) => report.projectId !== projectId || report.ownerId !== user.id);
      });
      sendJson(response, 200, { archived: true, recoverableForDays: 30 });
      return true;
    }

    sendJson(response, 405, { error: "Method not allowed" });
    return true;
  }

  async function handleSquads(request, response, requestUrl) {
    if (!requestUrl.pathname.startsWith("/api/squads")) return false;
    const current = sessionFor(request, response, { create: false });
    if (!current.user || current.user.kind !== "account") {
      sendJson(response, 401, { error: "Sign in with a parent or adult-owned account before using private co-creation." });
      return true;
    }
    const user = current.user;

    if (requestUrl.pathname === "/api/squads" && request.method === "GET") {
      const database = store.read();
      ensureSquadCollections(database);
      const squadIds = new Set(database.squadMembers.filter((member) => member.userId === user.id && !member.removedAt).map((member) => member.squadId));
      const squads = database.squads.filter((squad) => squadIds.has(squad.id) && !squad.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((squad) => publicSquad(database, squad, user.id));
      sendJson(response, 200, { squads });
      return true;
    }

    if (requestUrl.pathname === "/api/squads" && request.method === "POST") {
      const body = await readJsonBody(request, 20_000);
      if (body.ageGroup === "under18" && body.guardianConfirmed !== true) {
        sendJson(response, 400, { error: "A parent or guardian must confirm a private squad for young creators." });
        return true;
      }
      const title = cleanText(body.title, 120) || "Our Story Squad";
      await enforceTextSafety(title);
      const created = store.mutate((database) => {
        ensureSquadCollections(database);
        let joinCode;
        do joinCode = createSquadCode(); while (database.squads.some((item) => item.joinCode === joinCode));
        const now = nowIso();
        const squad = {
          id: crypto.randomUUID(),
          ownerId: user.id,
          title,
          language: body.language === "zh" ? "zh" : "en",
          outputType: body.outputType === "film" ? "film" : "book",
          ageGroup: body.ageGroup === "under18" ? "under18" : "mixed",
          guardianConfirmed: body.guardianConfirmed === true,
          joinCode,
          status: "collecting",
          visualStyle: ["storybook-watercolor", "ink-watercolor", "cinematic", "comic", "block-world"].includes(body.visualStyle) ? body.visualStyle : (body.language === "zh" ? "ink-watercolor" : "storybook-watercolor"),
          characterRules: cleanText(body.characterRules, 1200),
          visualAnchorImageUrl: "",
          visualVersion: 1,
          visualSettingsLockedAt: now,
          assembledProjectId: "",
          createdAt: now,
          updatedAt: now,
          deletedAt: ""
        };
        const member = {
          id: crypto.randomUUID(), squadId: squad.id, userId: user.id, role: "owner", status: "approved",
          displayName: cleanText(body.displayName, 60) || user.displayName || "Project owner",
          joinedAt: now, approvedAt: now, removedAt: ""
        };
        database.squads.push(squad);
        database.squadMembers.push(member);
        return publicSquad(database, squad, user.id);
      });
      sendJson(response, 201, { squad: created, joinUrl: `/squad-board.html?code=${encodeURIComponent(created.joinCode)}` });
      return true;
    }

    if (requestUrl.pathname === "/api/squads/join" && request.method === "POST") {
      const body = await readJsonBody(request, 12_000);
      const code = normalizeSquadCode(body.code);
      const displayName = cleanText(body.displayName, 60) || user.displayName || "Contributor";
      if (body.youngCreator === true && body.guardianConfirmed !== true) {
        sendJson(response, 400, { error: "A parent or guardian must approve a young creator joining this private squad." });
        return true;
      }
      const result = store.mutate((database) => {
        ensureSquadCollections(database);
        const squad = database.squads.find((item) => item.joinCode === code && !item.deletedAt);
        if (!squad) throw Object.assign(new Error("This Story Code is invalid."), { statusCode: 404, code: "SQUAD_NOT_FOUND" });
        const existing = squadMembership(database, squad.id, user.id);
        if (existing) return { squad: publicSquad(database, squad, user.id), duplicate: true };
        const activeCount = database.squadMembers.filter((item) => item.squadId === squad.id && !item.removedAt && item.status === "approved").length;
        if (activeCount >= 6) throw Object.assign(new Error("This private squad already has six approved creators."), { statusCode: 409, code: "SQUAD_FULL" });
        const now = nowIso();
        database.squadMembers.push({
          id: crypto.randomUUID(), squadId: squad.id, userId: user.id, role: "contributor", status: "pending",
          displayName, youngCreator: body.youngCreator === true, guardianConfirmed: body.guardianConfirmed === true,
          joinedAt: now, approvedAt: "", removedAt: ""
        });
        squad.updatedAt = now;
        return { squad: publicSquad(database, squad, user.id), duplicate: false };
      });
      sendJson(response, result.duplicate ? 200 : 201, { ...result, notice: result.squad.viewer?.status === "pending" ? "The project owner must approve this request before contributions become visible." : "You are already a member." });
      return true;
    }

    const squadMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)$/);
    if (squadMatch && request.method === "GET") {
      const database = store.read();
      ensureSquadCollections(database);
      const squad = database.squads.find((item) => item.id === cleanId(decodeURIComponent(squadMatch[1])) && !item.deletedAt);
      const member = squad ? squadMembership(database, squad.id, user.id) : null;
      if (!squad || !member) {
        sendJson(response, 404, { error: "Private squad not found." });
        return true;
      }
      sendJson(response, 200, { squad: publicSquad(database, squad, user.id) });
      return true;
    }

    const approveMemberMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/members\/([^/]+)\/approve$/);
    if (approveMemberMatch && request.method === "POST") {
      assertSameOrigin(request);
      const squadId = cleanId(decodeURIComponent(approveMemberMatch[1]));
      const memberId = cleanId(decodeURIComponent(approveMemberMatch[2]));
      const result = store.mutate((database) => {
        ensureSquadCollections(database);
        const squad = database.squads.find((item) => item.id === squadId && item.ownerId === user.id && !item.deletedAt);
        const member = squad ? database.squadMembers.find((item) => item.id === memberId && item.squadId === squadId && !item.removedAt) : null;
        if (!squad || !member) throw Object.assign(new Error("Pending member not found."), { statusCode: 404, code: "SQUAD_MEMBER_NOT_FOUND" });
        if (member.status !== "approved") {
          const approvedContributors = database.squadMembers.filter((item) => item.squadId === squad.id && item.role === "contributor" && item.status === "approved" && !item.removedAt).length;
          if (approvedContributors >= 5) throw Object.assign(new Error("This squad already has five invited collaborators."), { statusCode: 409, code: "SQUAD_FULL" });
          member.status = "approved";
          member.approvedAt = nowIso();
          squad.updatedAt = member.approvedAt;
        }
        return publicSquad(database, squad, user.id);
      });
      sendJson(response, 200, { squad: result });
      return true;
    }

    const squadPhotoConsentMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/photo-consent$/);
    if (squadPhotoConsentMatch && request.method === "POST") {
      assertSameOrigin(request);
      const squadId = cleanId(decodeURIComponent(squadPhotoConsentMatch[1]));
      const body = await readJsonBody(request);
      const database = store.read();
      const squad = database.squads.find((item) => item.id === squadId && item.ownerId === user.id && !item.deletedAt);
      if (!squad) {
        sendJson(response, 404, { error: "Private squad not found." });
        return true;
      }
      if (body.confirmedAdult !== true || body.approvedPrivateMedia !== true || body.approvedPersonalPhoto !== true || body.acknowledgedRegionalProcessing !== true) {
        sendJson(response, 400, { error: "An adult-owned account must confirm private use of a real-person photo." });
        return true;
      }
      const guardianName = cleanText(body.guardianName, 100);
      const relationship = cleanText(body.relationship, 80);
      if (!guardianName || !relationship) {
        sendJson(response, 400, { error: "Enter the adult name and relationship to the person pictured." });
        return true;
      }
      const consent = {
        id: crypto.randomUUID(), projectId: "", squadId: squad.id, guardianName, relationship,
        scopes: ["private_media", "personal_photo_reference", "regional_ai_processing"],
        verificationStatus: "account-attested", policyVersion: "2026-09-18", createdAt: nowIso(), revokedAt: ""
      };
      store.mutate((nextDatabase) => nextDatabase.guardianConsents.push(consent));
      sendJson(response, 201, { consent, notice: "This photo is private by default and can be permanently removed from the squad." });
      return true;
    }

    const squadConsentRevokeMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/consents\/([^/]+)$/);
    if (squadConsentRevokeMatch && request.method === "DELETE") {
      assertSameOrigin(request);
      const squadId = cleanId(decodeURIComponent(squadConsentRevokeMatch[1]));
      const consentId = cleanId(decodeURIComponent(squadConsentRevokeMatch[2]));
      const database = store.read();
      const squad = database.squads.find((item) => item.id === squadId && item.ownerId === user.id && !item.deletedAt);
      const consent = squad ? database.guardianConsents.find((item) => item.id === consentId && item.squadId === squad.id && !item.revokedAt) : null;
      if (!squad || !consent) {
        sendJson(response, 404, { error: "Photo permission not found." });
        return true;
      }
      const consentMedia = database.media.filter((item) => item.ownerId === user.id && item.squadId === squad.id && item.personalPhotoConsentId === consent.id);
      for (const media of consentMedia) await mediaStorage.remove(media);
      store.mutate((nextDatabase) => {
        const stored = nextDatabase.guardianConsents.find((item) => item.id === consent.id);
        if (stored) stored.revokedAt = nowIso();
        nextDatabase.media = nextDatabase.media.filter((item) => item.personalPhotoConsentId !== consent.id);
      });
      sendJson(response, 200, { revoked: true, personalPhotoMediaDeleted: consentMedia.length });
      return true;
    }

    const visualAnchorMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/visual-anchor$/);
    if (visualAnchorMatch && request.method === "POST") {
      assertSameOrigin(request);
      const squadId = cleanId(decodeURIComponent(visualAnchorMatch[1]));
      const body = await readJsonBody(request, 12_000);
      const imageUrl = cleanUrl(body.imageUrl);
      if (!imageUrl) {
        sendJson(response, 400, { error: "A safe generated visual anchor is required." });
        return true;
      }
      const result = store.mutate((database) => {
        ensureSquadCollections(database);
        const squad = database.squads.find((item) => item.id === squadId && item.ownerId === user.id && !item.deletedAt);
        if (!squad) throw Object.assign(new Error("Only the project owner can approve the visual anchor."), { statusCode: 403, code: "SQUAD_ANCHOR_OWNER_REQUIRED" });
        const replacing = Boolean(squad.visualAnchorImageUrl && squad.visualAnchorImageUrl !== imageUrl);
        squad.visualAnchorImageUrl = imageUrl;
        squad.visualAnchorApprovedAt = nowIso();
        if (replacing) squad.visualVersion = Number(squad.visualVersion || 1) + 1;
        squad.updatedAt = squad.visualAnchorApprovedAt;
        return publicSquad(database, squad, user.id);
      });
      sendJson(response, 200, { squad: result });
      return true;
    }

    const cardsMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/cards$/);
    if (cardsMatch && request.method === "POST") {
      const squadId = cleanId(decodeURIComponent(cardsMatch[1]));
      const body = await readJsonBody(request, 30_000);
      const text = cleanText(body.text, 6000);
      const audioMediaId = cleanId(body.audioMediaId);
      const yuGuided = body.yuGuided === true;
      if (!text && !audioMediaId) {
        sendJson(response, 400, { error: "Write something or add a voice recording before posting." });
        return true;
      }
      if (text) await enforceTextSafety(text);
      const result = store.mutate((database) => {
        ensureSquadCollections(database);
        const squad = database.squads.find((item) => item.id === squadId && !item.deletedAt);
        const member = squad ? squadMembership(database, squad.id, user.id) : null;
        if (!squad || !member || member.status !== "approved") throw Object.assign(new Error("The project owner must approve you before you can post."), { statusCode: 403, code: "SQUAD_APPROVAL_REQUIRED" });
        if (audioMediaId) {
          const audio = database.media.find((item) => item.id === audioMediaId && item.ownerId === user.id && item.squadId === squadId && item.kind === "audio");
          if (!audio) throw Object.assign(new Error("Voice recording not found."), { statusCode: 404, code: "SQUAD_AUDIO_NOT_FOUND" });
        }
        const now = nowIso();
        const card = {
          id: crypto.randomUUID(), squadId, authorId: user.id, authorName: member.displayName,
          kind: audioMediaId && text ? "mixed" : audioMediaId ? "audio" : "text",
          text, audioMediaId, status: member.role === "owner" ? "approved" : "pending",
          yuGuided,
          imageUrl: "", videoUrl: "", visualStatus: "none",
          position: database.squadCards.filter((item) => item.squadId === squadId && !item.deletedAt).length + 1,
          createdAt: now, updatedAt: now, deletedAt: ""
        };
        database.squadCards.push(card);
        squad.updatedAt = now;
        return publicSquad(database, squad, user.id);
      });
      sendJson(response, 201, { squad: result });
      return true;
    }

    const approveCardMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/cards\/([^/]+)\/approve$/);
    if (approveCardMatch && request.method === "POST") {
      assertSameOrigin(request);
      const squadId = cleanId(decodeURIComponent(approveCardMatch[1]));
      const cardId = cleanId(decodeURIComponent(approveCardMatch[2]));
      const result = store.mutate((database) => {
        ensureSquadCollections(database);
        const squad = database.squads.find((item) => item.id === squadId && item.ownerId === user.id && !item.deletedAt);
        const card = squad ? database.squadCards.find((item) => item.id === cardId && item.squadId === squadId && !item.deletedAt) : null;
        if (!squad || !card) throw Object.assign(new Error("Contribution not found."), { statusCode: 404, code: "SQUAD_CARD_NOT_FOUND" });
        card.status = "approved";
        if (card.imageUrl || card.videoUrl) card.visualStatus = "approved";
        if (card.imageUrl && !squad.visualAnchorImageUrl) squad.visualAnchorImageUrl = card.imageUrl;
        card.updatedAt = nowIso();
        squad.updatedAt = card.updatedAt;
        return publicSquad(database, squad, user.id);
      });
      sendJson(response, 200, { squad: result });
      return true;
    }

    const cardVisualMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/cards\/([^/]+)\/visual$/);
    if (cardVisualMatch && request.method === "POST") {
      assertSameOrigin(request);
      const squadId = cleanId(decodeURIComponent(cardVisualMatch[1]));
      const cardId = cleanId(decodeURIComponent(cardVisualMatch[2]));
      const body = await readJsonBody(request, 12_000);
      const imageUrl = cleanUrl(body.imageUrl);
      const videoUrl = cleanUrl(body.videoUrl);
      if (!imageUrl && !videoUrl) {
        sendJson(response, 400, { error: "A safe generated image or video URL is required." });
        return true;
      }
      const result = store.mutate((database) => {
        ensureSquadCollections(database);
        const squad = database.squads.find((item) => item.id === squadId && !item.deletedAt);
        const member = squad ? squadMembership(database, squad.id, user.id) : null;
        const card = squad ? database.squadCards.find((item) => item.id === cardId && item.squadId === squadId && !item.deletedAt) : null;
        const owner = squad?.ownerId === user.id;
        if (!squad || !member || member.status !== "approved" || !card || card.authorId !== user.id) {
          throw Object.assign(new Error("You can add visuals only to your own contribution."), { statusCode: 403, code: "SQUAD_VISUAL_FORBIDDEN" });
        }
        if (imageUrl) {
          card.imageUrl = imageUrl;
          if (!videoUrl) card.videoUrl = "";
          if (owner && !squad.visualAnchorImageUrl) squad.visualAnchorImageUrl = imageUrl;
        }
        if (videoUrl) card.videoUrl = videoUrl;
        card.visualStatus = owner ? "approved" : "pending";
        card.updatedAt = nowIso();
        squad.updatedAt = card.updatedAt;
        return publicSquad(database, squad, user.id);
      });
      sendJson(response, 200, { squad: result });
      return true;
    }

    const assembleMatch = requestUrl.pathname.match(/^\/api\/squads\/([^/]+)\/assemble$/);
    if (assembleMatch && request.method === "POST") {
      assertSameOrigin(request);
      const squadId = cleanId(decodeURIComponent(assembleMatch[1]));
      const database = store.read();
      ensureSquadCollections(database);
      const squad = database.squads.find((item) => item.id === squadId && item.ownerId === user.id && !item.deletedAt);
      if (!squad) {
        sendJson(response, 404, { error: "Private squad not found." });
        return true;
      }
      const cards = database.squadCards.filter((card) => card.squadId === squad.id && card.status === "approved" && !card.deletedAt).sort((a, b) => a.position - b.position);
      if (!cards.length) {
        sendJson(response, 400, { error: "Approve at least one contribution before assembling the story." });
        return true;
      }
      await enforceTextSafety(cards.map((card) => card.text).filter(Boolean).join("\n"));
      const requestKey = cleanText(request.headers["idempotency-key"] || `squad-assemble:${squad.id}`, 200);
      const reserved = store.mutate((nextDatabase) => reserveCredits(nextDatabase, {
        userId: user.id, resource: "storyProjects", units: 1, idempotencyKey: requestKey,
        referenceType: "squad-project", referenceId: squad.id
      }));
      const assembled = store.mutate((nextDatabase) => {
        const storedSquad = nextDatabase.squads.find((item) => item.id === squad.id);
        if (storedSquad.assembledProjectId) {
          releaseReservation(nextDatabase, { reservationId: reserved.reservation.id, reason: "squad-already-assembled" });
          return nextDatabase.projects.find((item) => item.id === storedSquad.assembledProjectId);
        }
        const now = nowIso();
        const scenes = cards.map((card, index) => cleanScene({
          id: `scene-${index + 1}`,
          title: `${squad.language === "zh" ? "第" : "Part "}${squad.language === "zh" ? index + 1 : index + 1}${squad.language === "zh" ? "章" : ""} · ${card.authorName}`,
          text: card.text || (squad.language === "zh" ? `${card.authorName} 的语音创作` : `Voice contribution by ${card.authorName}`),
          caption: card.text || card.authorName,
          imageUrl: card.visualStatus === "approved" ? card.imageUrl : "",
          videoUrl: card.visualStatus === "approved" ? card.videoUrl : "",
          narrationMediaId: card.audioMediaId,
          duration: 6
        }, index));
        const project = normalizeProject({
          title: storedSquad.title,
          language: storedSquad.language,
          mode: "squad",
          ageGroup: storedSquad.ageGroup === "under18" ? "under18" : "adult",
          visibility: "private",
          sourceType: "text",
          sourceText: cards.map((card) => `${card.authorName}: ${card.text || "[voice]"}`).join("\n\n"),
          draft: cards.map((card) => card.text).filter(Boolean).join("\n\n"),
          scenes,
          clientSnapshot: { squadId: storedSquad.id, outputType: storedSquad.outputType, credits: cards.map((card) => ({ cardId: card.id, authorName: card.authorName, yuGuided: card.yuGuided === true })) }
        });
        Object.assign(project, { id: crypto.randomUUID(), ownerId: user.id, createdAt: now, updatedAt: now, version: 1, deletedAt: "", creationReservationId: reserved.reservation.id });
        nextDatabase.projects.push(project);
        storedSquad.assembledProjectId = project.id;
        storedSquad.status = "assembled";
        storedSquad.updatedAt = now;
        settleReservation(nextDatabase, { reservationId: reserved.reservation.id });
        return project;
      });
      sendJson(response, 201, { project: assembled, nextUrl: `/my-stories.html#${encodeURIComponent(assembled.id)}` });
      return true;
    }

    sendJson(response, 404, { error: "Co-creation endpoint not found." });
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
      const squadId = cleanId(body.squadId);
      const squad = squadId ? database.squads?.find((item) => item.id === squadId && !item.deletedAt) : null;
      const member = squad ? squadMembership(database, squad.id, user.id) : null;
      if (!project && (!squad || member?.status !== "approved")) {
        sendJson(response, 404, { error: "Save a story project or join an approved private squad before uploading media." });
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
      let imageReview = null;
      if (kind === "image") {
        if (body.metadataRemoved !== true) {
          sendJson(response, 400, { error: "Image metadata must be removed on the device before upload." });
          return true;
        }
        imageReview = await reviewArtworkSafety(body.dataUrl);
        if (!imageReview.approved) {
          sendJson(response, imageReview.statusCode || 422, {
            error: "This image was not stored because it did not pass the child-safety or privacy review.",
            reasonCode: imageReview.reasonCode || "uncertain"
          });
          return true;
        }
        if (imageReview?.checks?.realPerson) {
          if (process.env.REAL_PERSON_PHOTO_REQUIRE_ACCOUNT !== "false" && user.kind !== "account") {
            sendJson(response, 403, { error: "Sign in to an adult-owned account before saving a real-person photo." });
            return true;
          }
          const consentId = cleanId(body.personalPhotoConsentId);
          const consent = database.guardianConsents.find((item) => item.id === consentId && (item.projectId === project?.id || item.squadId === squad?.id) && !item.revokedAt && item.scopes?.includes("personal_photo_reference") && item.scopes?.includes("private_media") && item.scopes?.includes("regional_ai_processing"));
          if (!consent) {
            sendJson(response, 403, { error: "Adult consent is required before saving a real-person photo." });
            return true;
          }
        }
      }
      let classroomWorkReservation = null;
      if (kind === "image" && project?.mode === "classroom" && body.purpose === "classroom-work") {
        const uploadId = cleanId(body.uploadId) || crypto.randomUUID();
        classroomWorkReservation = store.mutate((nextDatabase) => reserveCredits(nextDatabase, {
          userId: user.id,
          resource: "studentWorks",
          units: 1,
          idempotencyKey: `classroom-work:${project.id}:${uploadId}`,
          referenceType: "classroom-work",
          referenceId: project.id,
          metadata: { projectId: project.id, uploadId }
        }));
        if (classroomWorkReservation.duplicate && classroomWorkReservation.reservation.status === "settled") {
          const existingMedia = store.read().media.find((item) => item.ownerId === user.id && item.allowanceReservationId === classroomWorkReservation.reservation.id);
          if (existingMedia) {
            sendJson(response, 200, { media: publicMedia(existingMedia), wallet: classroomWorkReservation.wallet, duplicate: true });
            return true;
          }
        }
      }

      const mediaId = crypto.randomUUID();
      const extension = imageExtensions[mimeType] || audioExtensions[mimeType];
      try {
        const storageRecord = await mediaStorage.put({
          user,
          key: `${user.id}/${project ? project.id : `squad-${squad.id}`}/${mediaId}.${extension}`,
          buffer,
          contentType: mimeType
        });
        const media = {
          id: mediaId,
          ownerId: user.id,
          projectId: project?.id || "",
          squadId: squad?.id || "",
          kind,
          mimeType,
          bytes: buffer.length,
          ...storageRecord,
          private: true,
          metadataRemoved: kind === "image",
          containsRealPerson: kind === "image" ? Boolean(imageReview?.checks?.realPerson) : false,
          personalPhotoConsentId: kind === "image" ? cleanId(body.personalPhotoConsentId) : "",
          allowanceReservationId: classroomWorkReservation?.reservation?.id || "",
          createdAt: nowIso()
        };
        const wallet = store.mutate((nextDatabase) => {
          nextDatabase.media.push(media);
          return classroomWorkReservation
            ? settleReservation(nextDatabase, { reservationId: classroomWorkReservation.reservation.id }).wallet
            : null;
        });
        sendJson(response, 201, { media: publicMedia(media), wallet });
      } catch (error) {
        if (classroomWorkReservation?.reservation?.id) {
          store.mutate((nextDatabase) => releaseReservation(nextDatabase, { reservationId: classroomWorkReservation.reservation.id, reason: "classroom-work-upload-failed" }));
        }
        throw error;
      }
      return true;
    }

    const mediaMatch = requestUrl.pathname.match(/^\/api\/media\/([^/]+)$/);
    if (!mediaMatch || request.method !== "GET") return false;
    const mediaId = cleanId(decodeURIComponent(mediaMatch[1]));
    const { database, user } = sessionFor(request, response);
    const media = database.media.find((item) => item.id === mediaId && (item.ownerId === user.id || (item.squadId && squadMembership(database, item.squadId, user.id)?.status === "approved")));
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
    const shareMediaMatch = requestUrl.pathname.match(/^\/api\/shares\/([^/]+)\/media\/([^/]+)$/);
    if (shareMediaMatch && request.method === "GET") {
      const database = store.read();
      const token = cleanText(decodeURIComponent(shareMediaMatch[1]), 80);
      const mediaId = cleanId(decodeURIComponent(shareMediaMatch[2]));
      const share = database.shares.find((item) => item.token === token && !item.revokedAt && new Date(item.expiresAt) > new Date());
      const project = share ? database.projects.find((item) => item.id === share.projectId && !item.deletedAt) : null;
      const media = project ? database.media.find((item) => item.id === mediaId && item.projectId === project.id && item.ownerId === project.ownerId) : null;
      const storedObject = media ? await mediaStorage.get(media) : null;
      if (!share || !project || !media || !storedObject) {
        sendJson(response, 404, { error: "This private classroom image is unavailable or the invitation has expired." });
        return true;
      }
      response.writeHead(200, {
        "Content-Type": storedObject.contentType || media.mimeType,
        "Content-Length": storedObject.bytes,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, noarchive",
        "Referrer-Policy": "no-referrer"
      });
      response.end(storedObject.body);
      return true;
    }

    const classroomConsentMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/classroom-consent$/);
    if (classroomConsentMatch) {
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(decodeURIComponent(classroomConsentMatch[1])));
      if (!project || project.mode !== "classroom") {
        sendJson(response, 404, { error: "Classroom project not found." });
        return true;
      }
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return true;
      }
      const body = await readJsonBody(request);
      const attesterName = cleanText(body.attesterName, 100);
      const confirmations = [
        body.confirmedAdult,
        body.documentedGuardianPermission,
        body.approvedPrivateMedia,
        body.approvedFamilySharing,
        body.approvedPrinting,
        body.approvedClassFilm,
        body.acknowledgedRegionalProcessing
      ];
      if (user.kind !== "account" || !attesterName || confirmations.some((value) => value !== true)) {
        sendJson(response, 400, { error: "An adult educator must confirm documented guardian permission for private classroom publishing." });
        return true;
      }
      const scopes = ["private_media", "personal_photo_reference", "regional_ai_processing", "invite_share", "print_proof", "class_film"];
      const existingConsent = database.guardianConsents.find((item) => item.projectId === project.id && !item.revokedAt && item.relationship === "Educator with documented guardian permission" && scopes.every((scope) => item.scopes?.includes(scope)));
      if (existingConsent) {
        sendJson(response, 200, { consent: existingConsent });
        return true;
      }
      const consent = {
        id: crypto.randomUUID(),
        projectId: project.id,
        guardianName: attesterName,
        relationship: "Educator with documented guardian permission",
        scopes,
        verificationStatus: "account-attested",
        policyVersion: "2026-09-22",
        createdAt: nowIso(),
        revokedAt: ""
      };
      store.mutate((nextDatabase) => nextDatabase.guardianConsents.push(consent));
      sendJson(response, 201, { consent, notice: "The classroom collection remains private and may be deleted or revoked by the educator." });
      return true;
    }

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
      const consentMedia = database.media.filter((item) => item.ownerId === user.id && item.projectId === project.id && item.personalPhotoConsentId === consent.id);
      for (const media of consentMedia) await mediaStorage.remove(media);
      store.mutate((nextDatabase) => {
        const stored = nextDatabase.guardianConsents.find((item) => item.id === consent.id);
        stored.revokedAt = nowIso();
        nextDatabase.shares.forEach((share) => { if (share.projectId === project.id && !share.revokedAt) share.revokedAt = nowIso(); });
        nextDatabase.media = nextDatabase.media.filter((item) => item.personalPhotoConsentId !== consent.id);
        const storedProject = nextDatabase.projects.find((item) => item.id === project.id && item.ownerId === user.id);
        if (storedProject) {
          const removedUrls = new Set(consentMedia.map((item) => `/api/media/${item.id}`));
          if (removedUrls.has(storedProject.coverImageUrl)) storedProject.coverImageUrl = "";
          storedProject.scenes = (storedProject.scenes || []).map((scene) => removedUrls.has(scene.imageUrl) ? { ...scene, imageUrl: "" } : scene);
          storedProject.updatedAt = nowIso();
        }
      });
      sendJson(response, 200, { revoked: true, invitationsRevoked: true, personalPhotoMediaDeleted: consentMedia.length });
      return true;
    }

    const photoConsentMatch = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/photo-consent$/);
    if (photoConsentMatch) {
      const { database, user } = sessionFor(request, response);
      const project = requireProject(database, user, cleanId(decodeURIComponent(photoConsentMatch[1])));
      if (!project) {
        sendJson(response, 404, { error: "Story project not found." });
        return true;
      }
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return true;
      }
      const body = await readJsonBody(request);
      if (user.kind !== "account" || body.confirmedAdult !== true || body.approvedPrivateMedia !== true || body.approvedPersonalPhoto !== true || body.acknowledgedRegionalProcessing !== true) {
        sendJson(response, 400, { error: "An adult-owned account must confirm private use of a real-person photo." });
        return true;
      }
      const guardianName = cleanText(body.guardianName, 100);
      const relationship = cleanText(body.relationship, 80);
      if (!guardianName || !relationship) {
        sendJson(response, 400, { error: "Enter the adult name and relationship to the person pictured." });
        return true;
      }
      const consent = {
        id: crypto.randomUUID(),
        projectId: project.id,
        guardianName,
        relationship,
        scopes: ["private_media", "personal_photo_reference", "regional_ai_processing"],
        verificationStatus: "account-attested",
        policyVersion: "2026-09-16",
        createdAt: nowIso(),
        revokedAt: ""
      };
      store.mutate((nextDatabase) => nextDatabase.guardianConsents.push(consent));
      sendJson(response, 201, { consent, notice: "This photo is private by default. Delete the project or account to permanently delete its stored media." });
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
      const shareMediaUrl = (value) => {
        const match = cleanUrl(value).match(/^\/api\/media\/([^/?#]+)/);
        return match ? `/api/shares/${encodeURIComponent(token)}/media/${encodeURIComponent(cleanId(match[1]))}` : cleanUrl(value);
      };
      sendJson(response, 200, {
        project: {
          id: project.id,
          title: project.title,
          language: project.language,
          draft: project.draft,
          storyDna: project.storyDna,
          scenes: project.scenes.map((scene) => ({ ...scene, imageUrl: shareMediaUrl(scene.imageUrl), videoUrl: "", narrationMediaId: "" })),
          coverImageUrl: shareMediaUrl(project.coverImageUrl),
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
    if (requestUrl.pathname === "/api/print-orders" && request.method === "POST") {
      const body = await readJsonBody(request, 20_000);
      const { database, user } = sessionFor(request, response, { create: false });
      if (!user || user.kind !== "account") {
        sendJson(response, 401, { error: "Sign in before requesting printing and delivery." });
        return true;
      }
      const project = requireProject(database, user, cleanId(body.projectId));
      if (!project) {
        sendJson(response, 404, { error: "Story project not found." });
        return true;
      }
      const quantity = [1, 2, 5, 10, 20, 30].includes(Number(body.quantity)) ? Number(body.quantity) : 1;
      const shippingRegion = ["cn", "us", "intl"].includes(body.shippingRegion) ? body.shippingRegion : (user.primaryRegion || "intl");
      const countryCode = cleanText(body.countryCode, 2).toUpperCase();
      const city = cleanText(body.city, 80);
      const postalCode = cleanText(body.postalCode, 20);
      if (!/^[A-Z]{2}$/.test(countryCode) || !city || !postalCode) {
        sendJson(response, 400, { error: "Add the destination country, city and postal code so printing and delivery can be quoted." });
        return true;
      }
      const order = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        projectId: project.id,
        offerId: "print-and-deliver",
        orderType: "print_quote",
        name: "A5 printed story book",
        price: "Quote pending",
        status: "quote_requested",
        specification: {
          trimSize: "A5 148x210mm",
          binding: body.binding === "hardcover" ? "hardcover" : "softcover",
          color: body.color === "black-and-white" ? "black-and-white" : "full-color",
          quantity,
          shippingRegion,
          countryCode,
          city,
          postalCode,
          notes: cleanText(body.notes, 500)
        },
        privacy: "Exact street address is requested only after the quote is accepted through a secure fulfillment step.",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.mutate((nextDatabase) => nextDatabase.orders.push(order));
      sendJson(response, 201, {
        order,
        notice: "Quote request received. No charge has been made. Printing, tax and tracked delivery will be confirmed before payment."
      });
      return true;
    }
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
        provider: "seedance-scenes+ffmpeg",
        status: ready ? "ready_for_render" : "awaiting_media",
        aspectRatio: body.aspectRatio === "9:16" ? "9:16" : "16:9",
        resolution: body.resolution === "1080p" ? "1080p" : "720p",
        totalDuration,
        plan: scenes.map((scene, index) => ({ ...scene, start: scenes.slice(0, index).reduce((sum, item) => sum + item.duration, 0), trackIndex: 1 })),
        outputUrl: "",
        progress: 0,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      store.mutate((nextDatabase) => nextDatabase.renderJobs.push(job));
      let renderResult = { started: false };
      if (ready) {
        const referencedMediaIds = new Set(scenes.flatMap((scene) => {
          const privateImage = String(scene.imageUrl || "").match(/^\/api\/media\/([^/?#]+)/)?.[1];
          const privateVideo = String(scene.videoUrl || "").match(/^\/api\/media\/([^/?#]+)/)?.[1];
          return [scene.narrationMediaId, privateImage, privateVideo].filter(Boolean);
        }));
        const sourceSquadId = cleanId(project.clientSnapshot?.squadId);
        renderResult = queueFfmpegRender({
          root,
          project,
          mediaRecords: database.media.filter((item) => item.ownerId === user.id || referencedMediaIds.has(item.id) || (sourceSquadId && item.squadId === sourceSquadId)),
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
          ? "Your approved Seedance clips, still images and narrations are being joined privately. Final assembly uses no additional AI video credits."
          : "The movie plan is ready, but this server still needs its private FFmpeg assembly worker.";
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
          stripeCheckout: stripeConfigured().ready,
          ffmpegAssembly: Boolean(resolveFfmpegBinary()),
          pdfBookExport: Boolean(resolveLibreOfficeBinary()),
          mediaGeneration: Boolean(process.env.OPENROUTER_API_KEY || (process.env.CHINA_ARK_BASE_URL && process.env.CHINA_ARK_API_KEY && process.env.CHINA_ARK_TEXT_MODEL)),
          chinaTextRoute: Boolean(process.env.CHINA_ARK_BASE_URL && process.env.CHINA_ARK_API_KEY && process.env.CHINA_ARK_TEXT_MODEL),
          chinaImageRoute: Boolean(
            cleanText(process.env.CHINA_ARK_API_KEY, 300)
            && cleanText(process.env.CHINA_ARK_IMAGE_MODEL, 200)
          ),
          chinaVideoRoute: process.env.CHINA_ARK_VIDEO_ENABLED === "true",
          safetyReview: Boolean(process.env.OPENAI_MODERATION_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY)
        },
        mediaStorage: mediaStorage.status(),
        registrationRegions: configuredRegistrationRegions(),
        allowedInternationalCountries: allowedInternationalCountries(),
        authDelivery: { email: emailDelivery.provider, phone: phoneDelivery.provider },
        beta: { inviteOnly: registrationInviteRequired(), inviteCodeAuth: process.env.INVITE_CODE_AUTH_ENABLED === "true", adultAccountOwnerOnly: process.env.BETA_ADULT_ACCOUNT_OWNER_ONLY === "true" },
        region: process.env.STORIESLENS_REGION || "local",
        dataMode: process.env.NODE_ENV === "production" ? "production" : "local-development"
      });
      return true;
    }

    if (requestUrl.pathname === "/api/launch-readiness" && request.method === "GET") {
      sendJson(response, 200, evaluateLaunchReadiness({ root, mediaStorageStatus: mediaStorage.status(), renderWorkerReady: Boolean(resolveFfmpegBinary()), pdfRendererReady: Boolean(resolveLibreOfficeBinary()) }));
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
      if (await handlePayments(request, response, requestUrl)) return true;
      if (await handleCredits(request, response, requestUrl)) return true;
      if (await handleAuth(request, response, requestUrl)) return true;
      if (await handleProjects(request, response, requestUrl)) return true;
      if (await handleSquads(request, response, requestUrl)) return true;
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
    requireAccount(request, response) {
      const { user } = sessionFor(request, response, { create: false });
      if (user?.kind !== "account") {
        throw Object.assign(new Error("Sign in with an adult-owned teacher account first."), { statusCode: 401, code: "TEACHER_ACCOUNT_REQUIRED" });
      }
      return user;
    },
    ownerId(request, response) {
      return sessionFor(request, response).user.id;
    },
    accountRegion(request, response) {
      const { user } = sessionFor(request, response);
      return user?.primaryRegion || "";
    },
    assertPersonalPhotoConsent(request, response, consentId) {
      const { database, user } = sessionFor(request, response, { create: false });
      const consent = database.guardianConsents.find((item) => item.id === cleanId(consentId) && !item.revokedAt && item.scopes?.includes("personal_photo_reference") && item.scopes?.includes("regional_ai_processing"));
      const project = consent ? database.projects.find((item) => item.id === consent.projectId && item.ownerId === user?.id && !item.deletedAt) : null;
      const squad = consent ? database.squads?.find((item) => item.id === consent.squadId && item.ownerId === user?.id && !item.deletedAt) : null;
      if (user?.kind !== "account" || !consent || (!project && !squad)) {
        throw Object.assign(new Error("Adult consent is required before a personal photo can be sent for AI creation."), { statusCode: 403, code: "PERSONAL_PHOTO_CONSENT_REQUIRED" });
      }
      return { consent, project, squad };
    },
    squadGenerationContext(request, response, { squadId, cardId, anchor: isAnchor = false }) {
      const { database, user } = sessionFor(request, response, { create: false });
      ensureSquadCollections(database);
      const squad = database.squads.find((item) => item.id === cleanId(squadId) && !item.deletedAt);
      const member = squad ? squadMembership(database, squad.id, user?.id) : null;
      const card = !isAnchor && squad ? database.squadCards.find((item) => item.id === cleanId(cardId) && item.squadId === squad.id && !item.deletedAt) : null;
      const allowed = isAnchor
        ? Boolean(user && squad && member?.status === "approved" && squad.ownerId === user.id)
        : Boolean(user && squad && member?.status === "approved" && card && card.authorId === user.id);
      if (!allowed) {
        throw Object.assign(new Error("This shared generation request is not allowed."), { statusCode: 403, code: "SQUAD_GENERATION_FORBIDDEN" });
      }
      const approvedImages = database.squadCards
        .filter((item) => item.squadId === squad.id && item.visualStatus === "approved" && item.imageUrl && !item.deletedAt)
        .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))
        .map((item) => item.imageUrl);
      const referenceAnchor = squad.visualAnchorImageUrl || approvedImages[0] || "";
      if (!isAnchor && !referenceAnchor) {
        throw Object.assign(new Error("The project owner needs to create and approve the first visual anchor before other creators generate images."), { statusCode: 409, code: "SQUAD_VISUAL_ANCHOR_REQUIRED" });
      }
      const latest = approvedImages.at(-1) || "";
      return {
        payerId: user.id,
        anchor: isAnchor,
        visualStyle: squad.visualStyle || (squad.language === "zh" ? "ink-watercolor" : "storybook-watercolor"),
        characterRules: squad.characterRules || "",
        visualVersion: Number(squad.visualVersion || 1),
        referenceImageUrls: [...new Set([referenceAnchor, latest].filter(Boolean))].slice(0, 2)
      };
    },
    reserve(request, response, { resource, units = 1, idempotencyKey, referenceType, referenceId, metadata, payerId = "" }) {
      const { user } = sessionFor(request, response);
      return store.mutate((database) => reserveCredits(database, {
        userId: cleanId(payerId) || user.id,
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
    async storeGeneratedVideo(request, response, { buffer, projectId = "", squadId = "" } = {}) {
      if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_GENERATED_VIDEO_BYTES) {
        throw Object.assign(new Error("The generated video is empty or larger than the private-library limit."), { statusCode: 413, code: "GENERATED_VIDEO_TOO_LARGE" });
      }
      const { database, user } = sessionFor(request, response, { create: false });
      if (!user) throw Object.assign(new Error("Sign in before saving a generated video."), { statusCode: 401, code: "ACCOUNT_REQUIRED" });
      const cleanProjectId = cleanId(projectId);
      const cleanSquadId = cleanId(squadId);
      const project = cleanProjectId ? requireProject(database, user, cleanProjectId) : null;
      ensureSquadCollections(database);
      const squad = cleanSquadId
        ? database.squads.find((item) => item.id === cleanSquadId && !item.deletedAt && squadMembership(database, item.id, user.id)?.status === "approved")
        : null;
      const usage = mediaUsageFor(database, user);
      if (usage.bytesUsed + buffer.length > usage.bytesLimit) {
        throw Object.assign(new Error("This private library has reached its storage allowance. Remove unused media or upgrade before generating another video."), { statusCode: 413, code: "MEDIA_QUOTA_EXCEEDED" });
      }
      const mediaId = crypto.randomUUID();
      const containerId = project?.id || (squad ? `squad-${squad.id}` : "generated-video");
      const storageRecord = await mediaStorage.put({
        user,
        key: `${user.id}/${containerId}/${mediaId}.mp4`,
        buffer,
        contentType: "video/mp4"
      });
      const media = {
        id: mediaId,
        ownerId: user.id,
        projectId: project?.id || "",
        squadId: squad?.id || "",
        kind: "video",
        mimeType: "video/mp4",
        bytes: buffer.length,
        ...storageRecord,
        private: true,
        metadataRemoved: true,
        createdAt: nowIso()
      };
      store.mutate((nextDatabase) => {
        nextDatabase.media.push(media);
        return null;
      });
      return publicMedia(media);
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

  handlePlatformApi.consumeRateLimit = (request, response, options) => rateLimiter.consume(request, response, { ...options, sendJson });

  return handlePlatformApi;
}

module.exports = { createPlatformApi };
