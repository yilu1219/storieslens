const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("homepage exposes a focused email sign-in entry", () => {
  const home = read("index.html");
  assert.match(home, /href="login\.html"/);
  assert.match(home, /data-home-t="sign-in"/);
});

test("email sign-in chooses a region before requesting a code", () => {
  const page = read("login.html");
  const script = read("login.js");
  assert.match(page, /name="login-region" value="cn"/);
  assert.match(page, /name="login-region" value="us"/);
  assert.match(page, /name="login-region" value="intl"/);
  assert.match(page, /data-email type="email"/);
  assert.match(script, /\/api\/auth\/start/);
  assert.match(script, /method: "email"/);
  assert.match(script, /\/api\/auth\/verify/);
  assert.match(script, /primaryRegion: selectedRegion\(\)/);
  assert.doesNotMatch(page, /Continue with WeChat|data-auth-method="phone"/);
});
