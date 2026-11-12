const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const zlib = require("node:zlib");
const test = require("node:test");
const { PDFArray, PDFDocument } = require("pdf-lib");
const { tileWatermarkPlacements } = require("../preview-watermark");
const { BLEED_HEIGHT_PT, BLEED_WIDTH_PT, buildInformalPreviewPdf, buildParentBookPdf } = require("../parent-book-pdf");

const root = path.resolve(__dirname, "..");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=", "base64");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

async function imageDrawCount(buffer) {
  const pdf = await PDFDocument.load(buffer);
  let count = 0;
  for (const page of pdf.getPages()) {
    const contents = page.node.Contents();
    const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
    for (const ref of refs) {
      const bytes = Buffer.from(pdf.context.lookup(ref).getContents());
      const text = (bytes[0] === 0x78 ? zlib.inflateSync(bytes) : bytes).toString("latin1");
      count += (text.match(/\/\S+\s+Do\b/g) || []).length;
    }
  }
  return count;
}

function quadrantCounts(tiles, width, height) {
  const counts = [0, 0, 0, 0];
  tiles.forEach((tile) => {
    const x = tile.x + tile.size / 2;
    const y = tile.y + tile.size / 2;
    const index = (x >= width / 2 ? 1 : 0) + (y >= height / 2 ? 2 : 0);
    counts[index] += 1;
  });
  return counts;
}

test("tiled watermark covers every part of a free preview page", () => {
  const width = 1200;
  const height = 1680;
  const tiles = tileWatermarkPlacements(width, height);
  assert.ok(tiles.length >= 20);
  quadrantCounts(tiles, width, height).forEach((count) => assert.ok(count >= 2));
  assert.ok(tiles.some((tile) => tile.x < width * 0.2 && tile.y < height * 0.2));
  assert.ok(tiles.some((tile) => tile.x > width * 0.6 && tile.y > height * 0.6));
  const parent = read("parent-book.js");
  const teacher = read("teacher-book.js");
  for (const source of [parent, teacher]) {
    const fn = source.slice(source.indexOf("async function watermarkPage"), source.indexOf("function prepareApi"));
    assert.match(fn, /paintTiledWatermark/);
    assert.doesNotMatch(fn, /width - mark - margin/);
  }
  const css = read("parent-book.css");
  assert.match(css, /\.page-watermark \{[\s\S]*background-repeat:\s*repeat/);
  assert.match(css, /\.page-watermark \{[\s\S]*inset:\s*0/);
  assert.match(read("parent-book.html"), /class="page-watermark"/);
  assert.match(read("teacher-book.html"), /class="page-watermark"/);
  assert.match(read("book-share.html"), /data-share-watermark/);
  assert.doesNotMatch(read("book-share.js"), /paintTiledWatermark|watermarkPage/);
  const paid = parent.slice(parent.indexOf("function paidPagePayload"), parent.indexOf("async function sendPaidBookEmail"));
  assert.match(paid, /state\.pages/);
  assert.doesNotMatch(paid, /previewPages/);
});

test("informal preview PDFs tile the mark and official paid PDFs stay clean", async () => {
  const pages = [{ buffer: png, mimeType: "image/png" }];
  const official = await buildParentBookPdf({ title: "正式", pages });
  const preview = await buildInformalPreviewPdf({ title: "预览", pages });
  assert.equal(official.official, true);
  assert.equal(official.preview, false);
  assert.equal(preview.preview, true);
  assert.equal(preview.official, false);
  assert.equal(preview.paid, false);
  const officialDraws = await imageDrawCount(official.buffer);
  const previewDraws = await imageDrawCount(preview.buffer);
  assert.equal(officialDraws, 1);
  const tiles = tileWatermarkPlacements(BLEED_WIDTH_PT, BLEED_HEIGHT_PT);
  assert.ok(tiles.length >= 20);
  assert.equal(previewDraws, officialDraws + tiles.length);
  const officialDoc = await PDFDocument.load(official.buffer);
  assert.doesNotMatch(String(officialDoc.getSubject() || ""), /preview|watermark|预览/i);
  const previewDoc = await PDFDocument.load(preview.buffer);
  assert.match(String(previewDoc.getSubject() || ""), /preview|预览/);
  const officialFn = read("family-book-api.js");
  const issuer = officialFn.slice(officialFn.indexOf("async function officialPdfForOrder"), officialFn.indexOf("function noIndex"));
  assert.match(issuer, /buildParentBookPdf\(/);
  assert.doesNotMatch(issuer, /preview:\s*true/);
});

test("photo-to-ebook routes, legacy redirects, robots, and sitemap", async (t) => {
  const port = 3188;
  const base = `http://127.0.0.1:${port}`;
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "storieslens-ebook-routes-"));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), PLATFORM_DATA_DIR: dataDirectory },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  });
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited ${child.exitCode}`);
    try {
      if ((await fetch(`${base}/robots.txt`)).ok) break;
    } catch (_error) {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const chinese = await fetch(`${base}${encodeURI("/照片成为电子书")}`);
  assert.equal(chinese.status, 200);
  const chineseHtml = await chinese.text();
  assert.match(chineseHtml, /照片做成电子书/);
  assert.match(chineseHtml, /data-album/);
  assert.match(chineseHtml, /rel="canonical"/);

  const english = await fetch(`${base}/photos-to-ebook`);
  assert.equal(english.status, 200);
  assert.match(await english.text(), /data-download-preview/);

  const legacyEnglish = await fetch(`${base}/parent-book?order=abc`, {
    redirect: "manual",
    headers: { "Accept-Language": "en-US,en;q=0.9" }
  });
  assert.equal(legacyEnglish.status, 301);
  assert.match(legacyEnglish.headers.get("location") || "", /^\/photos-to-ebook\?order=abc$/);

  const legacyChinese = await fetch(`${base}/parent-book.html`, {
    redirect: "manual",
    headers: { "Accept-Language": "zh-CN,zh;q=0.9" }
  });
  assert.equal(legacyChinese.status, 301);
  assert.equal(decodeURI(legacyChinese.headers.get("location") || ""), "/照片成为电子书");

  const legacyFamily = await fetch(`${base}/family-book`, { redirect: "manual" });
  assert.equal(legacyFamily.status, 301);
  assert.equal(decodeURI(legacyFamily.headers.get("location") || ""), "/照片成为电子书");

  const robots = await (await fetch(`${base}/robots.txt`)).text();
  assert.match(robots, /Sitemap:\s*https:\/\/www\.storieslens\.com\/sitemap\.xml/);
  assert.match(robots, /Allow:\s*\//);
  assert.match(robots, /Disallow:\s*\/book-share/);
  assert.doesNotMatch(robots, /Disallow:\s*\/photos-to-ebook/);

  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  assert.match(sitemap, /https:\/\/www\.storieslens\.com\/photos-to-ebook/);
  assert.match(sitemap, /%E7%85%A7%E7%89%87%E6%88%90%E4%B8%BA%E7%94%B5%E5%AD%90%E4%B9%A6/);
  assert.match(sitemap, /https:\/\/www\.storieslens\.com\/</);
  assert.doesNotMatch(sitemap, /book-share/);
  assert.doesNotMatch(sitemap, /\/b\//);
  assert.doesNotMatch(sitemap, /shared-story/);

  const share = await fetch(`${base}/book-share`, { redirect: "manual" });
  assert.equal(share.status, 200);
  assert.match(share.headers.get("x-robots-tag") || "", /noindex/);
});
