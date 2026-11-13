const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file));

test("homepage shows the anonymized original and AI-assisted illustration in both languages", () => {
  const html = read("index.html").toString();
  const js = read("portal-home.js").toString();
  const css = read("portal-home.css").toString();
  const section = html.match(/<section class="storybook-example"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(section, /data-home-t="example-before"/);
  assert.match(section, /data-home-t="example-after"/);
  assert.match(section, /data-audience="parent-book-example"/);
  assert.match(section, /ORIGINAL · Child's drawing/);
  assert.match(section, /AI-GENERATED · Story scene/);
  assert.doesNotMatch(section, /Winnie|Lee/);
  for (const image of ["storybook-before-kiwi-v1.jpg", "storybook-after-kiwi-v1.jpg"]) {
    assert.match(section, new RegExp(image.replace(/\./g, "\\.")));
    const bytes = read(`assets/${image}`);
    assert.equal(bytes.subarray(0, 2).toString("hex"), "ffd8");
    assert(bytes.length < 800_000);
  }
  assert.match(js, /"example-title": "One drawing\. Two ways to see the story/);
  assert.match(js, /"example-title": "一张原画，两种故事画面/);
  assert.match(js, /parent-book-example/);
  assert.match(css, /\.storybook-example-images \{ position: relative; display: grid; grid-template-columns: 1fr 1fr/);
  assert.match(css, /@media \(max-width: 800px\)/);
});
