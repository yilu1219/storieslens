"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Yu training profile is available from both the homepage and creator flow", () => {
  const homepage = read("index.html");
  const app = read("app.html");
  assert(homepage.includes("data-yu-profile-open") && app.includes("data-yu-profile-open"));
  assert(homepage.includes("assets/yu-feather-mark.svg") && app.includes("assets/yu-feather-mark.svg"));
  assert(homepage.includes("yu-profile.js") && app.includes("yu-profile.js"));
});

test("Yu profile explains verifiable training layers without false endorsement claims", () => {
  const profile = read("yu-profile.js");
  assert.match(profile, /CCSS writing foundations/);
  assert.match(profile, /Chinese writing craft/);
  assert.match(profile, /MAP-informed/);
  assert.match(profile, /Questions before answers/);
  assert.match(profile, /not affiliated with or endorsed by NWEA/);
  assert.match(profile, /不复制原文/);
  assert.match(profile, /不代写/);
  assert.match(profile, /DAILY REVIEW · TRACEABLE SOURCES/);
  assert.match(profile, /Nothing enters the knowledge base automatically/);
  assert.match(profile, /每日审查 · 来源可追溯/);
  assert.match(profile, /来源核验、版权审查、教学提炼和质量测试/);
  assert.match(profile, /Test before release/);
});

test("Yu feather is a lightweight accessible vector asset", () => {
  const feather = read("assets/yu-feather-mark.svg");
  assert.match(feather, /<title/);
  assert.match(feather, /<desc/);
  assert.match(feather, /linearGradient/);
});
