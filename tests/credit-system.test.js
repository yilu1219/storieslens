const assert = require("node:assert/strict");
const test = require("node:test");
const {
  PACKAGE_CATALOG,
  ensureCreditCollections,
  grantPackage,
  ensureFreePreview,
  walletFor,
  usageSummaryFor,
  reserveCredits,
  settleReservation,
  releaseReservation,
  createInviteBatch,
  redeemInvite
} = require("../credit-system");

function database() {
  return ensureCreditCollections({ betaInviteRedemptions: [] });
}

test("allowance packages describe outcomes instead of opaque points", () => {
  assert.deepEqual(PACKAGE_CATALOG["creator-story"].grants, { storyProjects: 1, imageGenerations: 12 });
  assert.deepEqual(PACKAGE_CATALOG["creator-story"].price, { usd: 19, cny: 129 });
  assert.deepEqual(PACKAGE_CATALOG["invite-cocreate"].grants, { storyProjects: 1, imageGenerations: 18, collaboratorSeats: 5 });
  assert.deepEqual(PACKAGE_CATALOG["invite-cocreate"].price, { usd: 39, cny: 269 });
  assert.equal(PACKAGE_CATALOG["teacher-classroom"].grants.studentWorks, 30);
  assert.deepEqual(PACKAGE_CATALOG["teacher-classroom"].price, { usd: 79, cny: 569 });
  assert.equal(PACKAGE_CATALOG["movie-60"].grants.videoClips, 12);
  assert.deepEqual(PACKAGE_CATALOG["movie-60"].price, { usd: 69, cny: 499 });
});

test("package grants are idempotent and visible in the wallet", () => {
  const data = database();
  const first = grantPackage(data, { userId: "user-1", packageId: "creator-story", idempotencyKey: "order-1" });
  const second = grantPackage(data, { userId: "user-1", packageId: "creator-story", idempotencyKey: "order-1" });
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(walletFor(data, "user-1").resources.imageGenerations.remaining, 12);
  assert.equal(data.creditTransactions.filter((entry) => entry.packageId === "creator-story").length, 2);
});

test("reservations prevent overspend and settle exactly once", () => {
  const data = database();
  ensureFreePreview(data, "user-1");
  const held = reserveCredits(data, { userId: "user-1", resource: "imageGenerations", units: 2, idempotencyKey: "image-1" });
  assert.equal(held.wallet.resources.imageGenerations.remaining, 1);
  assert.throws(() => reserveCredits(data, { userId: "user-1", resource: "imageGenerations", units: 2, idempotencyKey: "image-2" }), (error) => error.code === "INSUFFICIENT_CREDITS" && error.remaining === 1);
  const first = settleReservation(data, { reservationId: held.reservation.id, costUsd: 0.42 });
  const second = settleReservation(data, { reservationId: held.reservation.id, costUsd: 0.42 });
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(walletFor(data, "user-1").resources.imageGenerations.consumed, 2);
  assert.equal(data.creditTransactions.filter((entry) => entry.type === "consumption").length, 1);
});

test("failed generation releases the reservation without consuming allowance", () => {
  const data = database();
  ensureFreePreview(data, "user-1");
  const held = reserveCredits(data, { userId: "user-1", resource: "imageGenerations", units: 1, idempotencyKey: "failed-image" });
  releaseReservation(data, { reservationId: held.reservation.id, reason: "provider-failed" });
  const wallet = walletFor(data, "user-1");
  assert.equal(wallet.resources.imageGenerations.remaining, 3);
  assert.equal(wallet.resources.imageGenerations.consumed, 0);
  assert.equal(wallet.resources.imageGenerations.reserved, 0);
});

test("invitation codes are region-bound, capacity-limited and never stored in raw form", () => {
  const data = database();
  const { rawCodes } = createInviteBatch(data, {
    region: "us",
    packageId: "creator-story",
    count: 2,
    maxRedemptions: 1,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    label: "US founding beta"
  });
  assert.equal(rawCodes.length, 2);
  rawCodes.forEach((code) => assert.equal(JSON.stringify(data).includes(code), false));
  assert.throws(() => redeemInvite(data, { rawCode: rawCodes[0], userId: "cn-user", userRegion: "cn" }), (error) => error.code === "INVITE_REGION_MISMATCH");
  const redemption = redeemInvite(data, { rawCode: rawCodes[0], userId: "us-user", userRegion: "us" });
  assert.equal(redemption.wallet.resources.imageGenerations.remaining, 12);
  assert.throws(() => redeemInvite(data, { rawCode: rawCodes[0], userId: "another-us-user", userRegion: "us" }), (error) => error.code === "INVITE_REDEEMED");
  assert.equal(redeemInvite(data, { rawCode: rawCodes[0], userId: "us-user", userRegion: "us" }).duplicate, true);
});

test("paid redemption codes record revenue separately from complimentary credits", () => {
  const data = database();
  const { rawCodes } = createInviteBatch(data, {
    region: "cn",
    packageId: "creator-story",
    count: 1,
    maxRedemptions: 1,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    label: "Paid workshop",
    commercialType: "paid",
    currency: "CNY",
    unitAmountMinor: 12900
  });
  redeemInvite(data, { rawCode: rawCodes[0], userId: "paid-user", userRegion: "cn" });
  assert.equal(data.creditSales.length, 1);
  assert.equal(data.creditSales[0].amountMinor, 12900);
  assert.equal(data.creditSales[0].currency, "CNY");
  assert.deepEqual(usageSummaryFor(data, "paid-user").totals.recordedRevenueMinor, { usd: 0, cny: 12900 });
});

test("usage summaries separate measured cost from operations whose provider cost is missing", () => {
  const data = database();
  ensureFreePreview(data, "user-1");
  const priced = reserveCredits(data, { userId: "user-1", resource: "imageGenerations", units: 1, idempotencyKey: "priced" });
  settleReservation(data, { reservationId: priced.reservation.id, costUsd: 0.18 });
  const unpriced = reserveCredits(data, { userId: "user-1", resource: "imageGenerations", units: 1, idempotencyKey: "unpriced" });
  settleReservation(data, { reservationId: unpriced.reservation.id });
  data.modelUsageEvents.push({ userId: "user-1", operation: "yu-writing-assistant", model: "test-model", costUsd: 0.02, createdAt: new Date().toISOString() });
  data.modelUsageEvents.push({ userId: "user-1", operation: "ai-writing-report", model: "test-model", costUsd: null, createdAt: new Date().toISOString() });
  const summary = usageSummaryFor(data, "user-1");
  assert.equal(summary.resources.imageGenerations.consumed, 2);
  assert.ok(Math.abs(summary.totals.recordedCostUsd - 0.2) < 0.000001);
  assert.equal(summary.totals.unpricedOperations, 2);
  assert.equal(summary.totals.modelOperations, 2);
});
