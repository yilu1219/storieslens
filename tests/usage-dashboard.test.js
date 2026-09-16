const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("creator library shows used, remaining, processing and recent allowance activity", () => {
  const html = read("my-stories.html");
  const script = read("my-stories.js");
  assert.match(html, /data-usage-consumed/);
  assert.match(html, /data-allowance-activity/);
  assert.match(html, /data-purchase-list/);
  assert.match(script, /result\.usage\?\.resources/);
  assert.match(script, /recentActivity/);
});

test("founder console separates paid-code revenue from model cost", () => {
  const html = read("admin-credits.html");
  const script = read("admin-credits.js");
  assert.match(html, /data-commercial-type/);
  assert.match(html, /data-summary-usd/);
  assert.match(html, /data-summary-cost/);
  assert.match(script, /unitAmountMinor/);
  assert.match(script, /recordedModelCostUsd/);
  assert.match(script, /unpricedConsumptions/);
  assert.match(script, /modelUsage/);
});

test("creator credit API omits internal provider cost", () => {
  const api = read("platform-api.js");
  const publicActivity = api.match(/recentActivity:[\s\S]*?\}\)\)/)?.[0] || "";
  assert.doesNotMatch(publicActivity, /costUsd/);
});

test("successful Yu model calls are recorded for founder cost reporting", () => {
  const server = read("server.js");
  const api = read("platform-api.js");
  assert.match(server, /operation: "yu-writing-assistant"/);
  assert.match(server, /operation: "ai-writing-report"/);
  assert.match(api, /modelUsageEvents/);
  assert.match(api, /recordUsage\(request, response/);
});
