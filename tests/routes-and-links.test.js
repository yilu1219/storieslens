const assert = require("assert");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));

test("all inline scripts parse", () => {
  htmlFiles.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].forEach((match, index) => {
      assert.doesNotThrow(() => new Function(match[1]), `${file} inline script ${index + 1} should parse`);
    });
  });
});
test("all static local page links and assets resolve", () => {
  const missing = [];
  htmlFiles.forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const staticMarkup = html.split(/<script\b/i)[0];
    for (const match of staticMarkup.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      const raw = match[1];
      if (!raw || raw.startsWith("#") || /^(?:https?:|data:|blob:|mailto:|tel:)/i.test(raw)) continue;
      const clean = raw.split(/[?#]/)[0];
      const target = clean === "/" ? path.join(root, "index.html") : path.resolve(root, clean.replace(/^\//, ""));
      if (!target.startsWith(root) || !fs.existsSync(target)) missing.push(`${file} -> ${raw}`);
    }
  });
  assert.deepStrictEqual(missing, [], `Missing static links:\n${missing.join("\n")}`);
});
