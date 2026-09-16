const crypto = require("crypto");

const CREDIT_RESOURCES = Object.freeze({
  storyProjects: { label: "Story projects", labelZh: "故事项目" },
  imageGenerations: { label: "AI illustrations", labelZh: "AI 插图" },
  videoClips: { label: "5-second film clips", labelZh: "5秒电影镜头" },
  collaboratorSeats: { label: "Invited collaborators", labelZh: "受邀共创者" },
  classroomProjects: { label: "Classroom projects", labelZh: "班级项目" },
  studentWorks: { label: "Student works", labelZh: "学生作品" }
});

const PACKAGE_CATALOG = Object.freeze({
  "free-preview": {
    name: "Free Preview",
    nameZh: "免费体验包",
    price: { usd: 0, cny: 0 },
    costGuardUsd: 0.35,
    saleMode: "automatic-trial",
    grants: { storyProjects: 1, imageGenerations: 3 }
  },
  "creator-story": {
    name: "Creator Story Pass",
    nameZh: "个人故事包",
    price: { usd: 19, cny: 129 },
    costGuardUsd: 3.5,
    saleMode: "one-time",
    grants: { storyProjects: 1, imageGenerations: 12 }
  },
  "invite-cocreate": {
    name: "Invited Co-creation Pack",
    nameZh: "熟人共创包",
    price: { usd: 39, cny: 269 },
    costGuardUsd: 5.5,
    saleMode: "one-time",
    grants: { storyProjects: 1, imageGenerations: 18, collaboratorSeats: 5 }
  },
  "teacher-classroom": {
    name: "Teacher Classroom Project",
    nameZh: "教师班级项目",
    price: { usd: 79, cny: 569 },
    costGuardUsd: 12,
    saleMode: "one-time",
    grants: { classroomProjects: 1, studentWorks: 30 }
  },
  "movie-30": {
    name: "30-second Movie Pack",
    nameZh: "30秒电影包",
    price: { usd: 39, cny: 269 },
    costGuardUsd: 15,
    saleMode: "one-time-addon",
    grants: { videoClips: 6 }
  },
  "movie-60": {
    name: "60-second Movie Pack",
    nameZh: "60秒电影包",
    price: { usd: 69, cny: 499 },
    costGuardUsd: 28,
    saleMode: "one-time-addon",
    grants: { videoClips: 12 }
  }
});

const ACTIVE_RESERVATION_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const COST_BEARING_RESOURCES = new Set(["imageGenerations", "videoClips"]);

function nowIso() {
  return new Date().toISOString();
}

function normalizeCode(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase().slice(0, 120);
}

function fingerprintCode(value) {
  return crypto.createHash("sha256").update(normalizeCode(value)).digest("hex");
}

function cleanId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
}

function ensureCreditCollections(database) {
  database.creditTransactions ||= [];
  database.creditReservations ||= [];
  database.creditSales ||= [];
  database.modelUsageEvents ||= [];
  database.inviteBatches ||= [];
  database.inviteCodes ||= [];
  database.betaInviteRedemptions ||= [];
  database.adminSessions ||= [];
  return database;
}

function moneyTotals(entries) {
  return entries.reduce((totals, entry) => {
    const currency = ["USD", "CNY"].includes(entry.currency) ? entry.currency : "USD";
    const amountMinor = Math.max(0, Number(entry.amountMinor) || 0);
    totals[currency.toLowerCase()] += amountMinor;
    return totals;
  }, { usd: 0, cny: 0 });
}

function usageSummaryFor(database, userId) {
  ensureCreditCollections(database);
  const wallet = walletFor(database, userId);
  const transactions = database.creditTransactions.filter((entry) => entry.userId === userId);
  const consumptions = transactions.filter((entry) => entry.type === "consumption");
  const sales = database.creditSales.filter((entry) => entry.userId === userId && entry.status === "recorded");
  const modelEvents = database.modelUsageEvents.filter((entry) => entry.userId === userId);
  const resources = Object.fromEntries(Object.entries(wallet.resources).map(([key, allowance]) => {
    const resourceConsumption = consumptions.filter((entry) => entry.resource === key);
    const recordedCostUsd = resourceConsumption.reduce((total, entry) => {
      const cost = Number(entry.costUsd);
      return total + (entry.costUsd != null && Number.isFinite(cost) && cost >= 0 ? cost : 0);
    }, 0);
    return [key, {
      ...allowance,
      recordedCostUsd,
      unpricedOperations: COST_BEARING_RESOURCES.has(key) ? resourceConsumption.filter((entry) => entry.costUsd == null || !Number.isFinite(Number(entry.costUsd))).length : 0,
      lastUsedAt: resourceConsumption.map((entry) => entry.createdAt).sort().at(-1) || ""
    }];
  }));
  const recordedCostUsd = [...consumptions, ...modelEvents].reduce((total, entry) => {
    const cost = Number(entry.costUsd);
    return total + (entry.costUsd != null && Number.isFinite(cost) && cost >= 0 ? cost : 0);
  }, 0);
  return {
    userId,
    resources,
    totals: {
      grantedUnits: Object.values(wallet.resources).reduce((total, item) => total + item.granted, 0),
      consumedUnits: Object.values(wallet.resources).reduce((total, item) => total + item.consumed, 0),
      reservedUnits: Object.values(wallet.resources).reduce((total, item) => total + item.reserved, 0),
      remainingUnits: Object.values(wallet.resources).reduce((total, item) => total + item.remaining, 0),
      consumptionOperations: consumptions.length,
      recordedCostUsd,
      unpricedOperations: consumptions.filter((entry) => COST_BEARING_RESOURCES.has(entry.resource) && (entry.costUsd == null || !Number.isFinite(Number(entry.costUsd)))).length + modelEvents.filter((entry) => entry.costUsd == null || !Number.isFinite(Number(entry.costUsd))).length,
      modelOperations: modelEvents.length,
      recordedRevenueMinor: moneyTotals(sales),
      lastUsedAt: [...consumptions, ...modelEvents].map((entry) => entry.createdAt).sort().at(-1) || ""
    },
    calculatedAt: nowIso()
  };
}

function publicPackageCatalog() {
  return Object.entries(PACKAGE_CATALOG).map(([id, item]) => ({ id, ...item }));
}

function expireStaleReservations(database, timestamp = Date.now()) {
  ensureCreditCollections(database);
  database.creditReservations.forEach((reservation) => {
    const created = new Date(reservation.createdAt).getTime();
    if (reservation.status === "reserved" && Number.isFinite(created) && timestamp - created > ACTIVE_RESERVATION_MAX_AGE_MS) {
      reservation.status = "released";
      reservation.releaseReason = "automatic-timeout";
      reservation.releasedAt = nowIso();
    }
  });
}

function walletFor(database, userId) {
  ensureCreditCollections(database);
  expireStaleReservations(database);
  const resources = Object.fromEntries(Object.keys(CREDIT_RESOURCES).map((resource) => [resource, {
    resource,
    ...CREDIT_RESOURCES[resource],
    granted: 0,
    consumed: 0,
    reserved: 0,
    remaining: 0
  }]));

  database.creditTransactions.filter((entry) => entry.userId === userId && resources[entry.resource]).forEach((entry) => {
    const delta = Number(entry.delta) || 0;
    if (delta > 0) resources[entry.resource].granted += delta;
    else resources[entry.resource].consumed += Math.abs(delta);
  });
  database.creditReservations.filter((entry) => entry.userId === userId && entry.status === "reserved" && resources[entry.resource]).forEach((entry) => {
    resources[entry.resource].reserved += Math.max(0, Number(entry.units) || 0);
  });
  Object.values(resources).forEach((resource) => {
    resource.remaining = Math.max(0, resource.granted - resource.consumed - resource.reserved);
  });
  return { userId, resources, calculatedAt: nowIso() };
}

function grantPackage(database, { userId, packageId, source = "admin", referenceId = "", note = "", idempotencyKey, createdBy = "system" }) {
  ensureCreditCollections(database);
  const packageItem = PACKAGE_CATALOG[packageId];
  if (!packageItem) throw Object.assign(new Error("Choose a valid allowance package."), { statusCode: 400, code: "INVALID_PACKAGE" });
  const safeKey = String(idempotencyKey || "").slice(0, 200);
  if (!safeKey) throw Object.assign(new Error("An idempotency key is required."), { statusCode: 400, code: "IDEMPOTENCY_REQUIRED" });
  const existing = database.creditTransactions.find((entry) => entry.idempotencyKey === `${safeKey}:${entry.resource}` && entry.userId === userId);
  if (existing) return { duplicate: true, packageId, wallet: walletFor(database, userId) };

  const groupId = crypto.randomUUID();
  Object.entries(packageItem.grants).forEach(([resource, units]) => {
    if (!CREDIT_RESOURCES[resource] || !Number.isSafeInteger(units) || units <= 0) return;
    database.creditTransactions.push({
      id: crypto.randomUUID(),
      groupId,
      userId,
      resource,
      delta: units,
      type: "grant",
      packageId,
      source,
      referenceId: cleanId(referenceId),
      note: String(note || "").slice(0, 240),
      idempotencyKey: `${safeKey}:${resource}`,
      createdBy: String(createdBy || "system").slice(0, 100),
      createdAt: nowIso()
    });
  });
  return { duplicate: false, groupId, packageId, wallet: walletFor(database, userId) };
}

function ensureFreePreview(database, userId) {
  const alreadyGranted = database.creditTransactions?.some((entry) => entry.userId === userId && entry.packageId === "free-preview");
  if (alreadyGranted) return walletFor(database, userId);
  return grantPackage(database, {
    userId,
    packageId: "free-preview",
    source: "automatic-trial",
    idempotencyKey: `free-preview:${userId}`,
    createdBy: "system"
  }).wallet;
}

function reserveCredits(database, { userId, resource, units = 1, idempotencyKey, referenceType = "generation", referenceId = "", metadata = {} }) {
  ensureCreditCollections(database);
  ensureFreePreview(database, userId);
  expireStaleReservations(database);
  if (!CREDIT_RESOURCES[resource]) throw Object.assign(new Error("Unknown allowance type."), { statusCode: 400, code: "INVALID_CREDIT_RESOURCE" });
  const safeUnits = Number(units);
  if (!Number.isSafeInteger(safeUnits) || safeUnits <= 0) throw Object.assign(new Error("Allowance units must be a positive whole number."), { statusCode: 400, code: "INVALID_CREDIT_UNITS" });
  const safeKey = String(idempotencyKey || "").slice(0, 200);
  if (!safeKey) throw Object.assign(new Error("An idempotency key is required."), { statusCode: 400, code: "IDEMPOTENCY_REQUIRED" });
  const existing = database.creditReservations.find((entry) => entry.userId === userId && entry.idempotencyKey === safeKey);
  if (existing && existing.status !== "released") return { reservation: existing, wallet: walletFor(database, userId), duplicate: true };
  const wallet = walletFor(database, userId);
  if (wallet.resources[resource].remaining < safeUnits) {
    throw Object.assign(new Error(`Not enough ${CREDIT_RESOURCES[resource].label.toLowerCase()} remaining.`), {
      statusCode: 402,
      code: "INSUFFICIENT_CREDITS",
      resource,
      required: safeUnits,
      remaining: wallet.resources[resource].remaining
    });
  }
  const reservation = existing || {
    id: crypto.randomUUID(),
    userId,
    resource,
    units: safeUnits,
    status: "reserved",
    idempotencyKey: safeKey,
    referenceType: String(referenceType || "generation").slice(0, 80),
    referenceId: cleanId(referenceId),
    metadata: JSON.parse(JSON.stringify(metadata || {})),
    createdAt: nowIso()
  };
  if (existing) {
    Object.assign(reservation, {
      resource,
      units: safeUnits,
      status: "reserved",
      referenceType: String(referenceType || "generation").slice(0, 80),
      referenceId: cleanId(referenceId),
      metadata: JSON.parse(JSON.stringify(metadata || {})),
      createdAt: nowIso(),
      releasedAt: "",
      releaseReason: ""
    });
  } else {
    database.creditReservations.push(reservation);
  }
  return { reservation, wallet: walletFor(database, userId), duplicate: false };
}

function settleReservation(database, { reservationId, costUsd = null, providerUsage = null }) {
  ensureCreditCollections(database);
  const reservation = database.creditReservations.find((entry) => entry.id === reservationId);
  if (!reservation) throw Object.assign(new Error("Allowance reservation not found."), { statusCode: 404, code: "RESERVATION_NOT_FOUND" });
  if (reservation.status === "settled") return { duplicate: true, reservation, wallet: walletFor(database, reservation.userId) };
  if (reservation.status !== "reserved") throw Object.assign(new Error("This allowance reservation has already been released."), { statusCode: 409, code: "RESERVATION_RELEASED" });
  reservation.status = "settled";
  reservation.settledAt = nowIso();
  reservation.costUsd = costUsd != null && Number.isFinite(Number(costUsd)) ? Number(costUsd) : null;
  reservation.providerUsage = providerUsage && typeof providerUsage === "object" ? JSON.parse(JSON.stringify(providerUsage)) : null;
  database.creditTransactions.push({
    id: crypto.randomUUID(),
    userId: reservation.userId,
    resource: reservation.resource,
    delta: -reservation.units,
    type: "consumption",
    source: reservation.referenceType,
    referenceId: reservation.referenceId,
    reservationId: reservation.id,
    idempotencyKey: `settle:${reservation.id}:${reservation.resource}`,
    costUsd: reservation.costUsd,
    createdBy: "system",
    createdAt: nowIso()
  });
  return { duplicate: false, reservation, wallet: walletFor(database, reservation.userId) };
}

function releaseReservation(database, { reservationId, reason = "generation-failed" }) {
  ensureCreditCollections(database);
  const reservation = database.creditReservations.find((entry) => entry.id === reservationId);
  if (!reservation) return { missing: true };
  if (reservation.status !== "reserved") return { duplicate: true, reservation, wallet: walletFor(database, reservation.userId) };
  reservation.status = "released";
  reservation.releaseReason = String(reason || "generation-failed").slice(0, 120);
  reservation.releasedAt = nowIso();
  return { duplicate: false, reservation, wallet: walletFor(database, reservation.userId) };
}

function randomInviteCode(region, packageId) {
  const packageMark = packageId.split("-").map((part) => part[0]).join("").toUpperCase().slice(0, 4);
  return `SL-${region.toUpperCase()}-${packageMark}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

function createInviteBatch(database, { region, packageId, count, maxRedemptions = 1, expiresAt, label = "", commercialType = "complimentary", currency = "USD", unitAmountMinor = 0, createdBy = "admin" }) {
  ensureCreditCollections(database);
  if (!["cn", "us", "intl"].includes(region)) throw Object.assign(new Error("Choose China, United States, or International."), { statusCode: 400, code: "INVALID_REGION" });
  if (!PACKAGE_CATALOG[packageId]) throw Object.assign(new Error("Choose a valid allowance package."), { statusCode: 400, code: "INVALID_PACKAGE" });
  const safeCount = Number(count);
  const safeUses = Number(maxRedemptions);
  const safeCommercialType = ["complimentary", "paid"].includes(commercialType) ? commercialType : "complimentary";
  const safeCurrency = ["USD", "CNY"].includes(currency) ? currency : "USD";
  const safeUnitAmountMinor = Number(unitAmountMinor);
  if (!Number.isSafeInteger(safeCount) || safeCount < 1 || safeCount > 100) throw Object.assign(new Error("Generate between 1 and 100 invitation codes."), { statusCode: 400, code: "INVALID_INVITE_COUNT" });
  if (!Number.isSafeInteger(safeUses) || safeUses < 1 || safeUses > 50) throw Object.assign(new Error("Each code may allow between 1 and 50 redemptions."), { statusCode: 400, code: "INVALID_REDEMPTION_LIMIT" });
  if (!Number.isSafeInteger(safeUnitAmountMinor) || safeUnitAmountMinor < 0 || safeUnitAmountMinor > 10_000_000) throw Object.assign(new Error("Enter a valid amount collected per redemption."), { statusCode: 400, code: "INVALID_SALE_AMOUNT" });
  if (safeCommercialType === "paid" && safeUnitAmountMinor < 1) throw Object.assign(new Error("A paid code must record the amount collected."), { statusCode: 400, code: "PAID_AMOUNT_REQUIRED" });
  const expiry = new Date(expiresAt);
  if (!Number.isFinite(expiry.getTime()) || expiry <= new Date()) throw Object.assign(new Error("Choose a future expiry date."), { statusCode: 400, code: "INVALID_EXPIRY" });
  const batch = {
    id: crypto.randomUUID(),
    region,
    packageId,
    count: safeCount,
    maxRedemptions: safeUses,
    label: String(label || "").slice(0, 100),
    commercialType: safeCommercialType,
    currency: safeCurrency,
    unitAmountMinor: safeCommercialType === "paid" ? safeUnitAmountMinor : 0,
    expiresAt: expiry.toISOString(),
    disabledAt: "",
    createdBy: String(createdBy || "admin").slice(0, 100),
    createdAt: nowIso()
  };
  const rawCodes = [];
  for (let index = 0; index < safeCount; index += 1) {
    let rawCode;
    let fingerprint;
    do {
      rawCode = randomInviteCode(region, packageId);
      fingerprint = fingerprintCode(rawCode);
    } while (database.inviteCodes.some((entry) => entry.fingerprint === fingerprint));
    rawCodes.push(rawCode);
    database.inviteCodes.push({
      id: crypto.randomUUID(),
      batchId: batch.id,
      fingerprint,
      region,
      packageId,
      maxRedemptions: safeUses,
      redemptionCount: 0,
      expiresAt: batch.expiresAt,
      disabledAt: "",
      createdAt: batch.createdAt
    });
  }
  database.inviteBatches.push(batch);
  return { batch, rawCodes };
}

function findInvite(database, rawCode) {
  ensureCreditCollections(database);
  const fingerprint = fingerprintCode(rawCode);
  return database.inviteCodes.find((entry) => entry.fingerprint === fingerprint) || null;
}

function validateInvite(database, invite, userRegion) {
  if (!invite) throw Object.assign(new Error("Enter a valid invitation code."), { statusCode: 400, code: "INVALID_INVITE" });
  const batch = database.inviteBatches.find((entry) => entry.id === invite.batchId);
  if (invite.disabledAt || batch?.disabledAt) throw Object.assign(new Error("This invitation code has been disabled."), { statusCode: 410, code: "INVITE_DISABLED" });
  if (new Date(invite.expiresAt) <= new Date()) throw Object.assign(new Error("This invitation code has expired."), { statusCode: 410, code: "INVITE_EXPIRED" });
  if (invite.region !== userRegion) throw Object.assign(new Error("This invitation code belongs to a different service region."), { statusCode: 400, code: "INVITE_REGION_MISMATCH" });
  if (invite.redemptionCount >= invite.maxRedemptions) throw Object.assign(new Error("This invitation code has already been used."), { statusCode: 409, code: "INVITE_REDEEMED" });
  return invite;
}

function redeemInvite(database, { rawCode, userId, userRegion }) {
  ensureCreditCollections(database);
  const invite = findInvite(database, rawCode);
  const existing = invite && database.betaInviteRedemptions.find((entry) => entry.inviteCodeId === invite.id && entry.accountId === userId);
  if (existing) return { duplicate: true, invite, wallet: walletFor(database, userId) };
  validateInvite(database, invite, userRegion);
  const grant = grantPackage(database, {
    userId,
    packageId: invite.packageId,
    source: "invitation",
    referenceId: invite.id,
    idempotencyKey: `invite:${invite.id}:user:${userId}`,
    createdBy: "invite-code"
  });
  invite.redemptionCount += 1;
  database.betaInviteRedemptions.push({
    id: crypto.randomUUID(),
    accountId: userId,
    region: userRegion,
    cohort: database.inviteBatches.find((entry) => entry.id === invite.batchId)?.label || "invited-beta",
    inviteCodeId: invite.id,
    inviteFingerprint: invite.fingerprint,
    packageId: invite.packageId,
    redeemedAt: nowIso()
  });
  const batch = database.inviteBatches.find((entry) => entry.id === invite.batchId);
  if (batch?.commercialType === "paid" && Number(batch.unitAmountMinor) > 0) {
    database.creditSales.push({
      id: crypto.randomUUID(),
      userId,
      inviteCodeId: invite.id,
      batchId: invite.batchId,
      packageId: invite.packageId,
      amountMinor: Number(batch.unitAmountMinor),
      currency: ["USD", "CNY"].includes(batch.currency) ? batch.currency : "USD",
      status: "recorded",
      source: "paid-redemption-code",
      createdAt: nowIso()
    });
  }
  return { duplicate: false, invite, grant, wallet: walletFor(database, userId) };
}

module.exports = {
  CREDIT_RESOURCES,
  PACKAGE_CATALOG,
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
  redeemInvite,
  fingerprintCode,
  normalizeCode
};
