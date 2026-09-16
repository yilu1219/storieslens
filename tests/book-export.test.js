const assert = require("node:assert");
const test = require("node:test");
const {
  buildBookDocx,
  convertDocxToPdf,
  fittedImageSize,
  resolveLibreOfficeBinary
} = require("../book-export");

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=", "base64");
const project = {
  id: "sample-project",
  title: "星光守护者 The Star Keeper",
  language: "zh",
  scenes: [
    { title: "第一章 · 小羽", text: "夜色落在窗台上，小羽发现了一颗会发光的种子。\n\n她决定把它带回家，也想知道它为什么来到这里。", imageUrl: "/sample.png" },
    { title: "第二章 · Leo", text: "The seed opened like a tiny lantern. Leo listened, then wrote down the sound it made." }
  ],
  clientSnapshot: { credits: [{ authorName: "小羽" }, { authorName: "Leo" }] }
};

test("A5 Lightyear Word export creates a real OOXML document", async () => {
  const result = await buildBookDocx(project, { loadImage: async () => ({ buffer: png, mimeType: "image/png" }) });
  assert(result.buffer.length > 4000);
  assert.strictEqual(result.buffer.subarray(0, 2).toString("ascii"), "PK");
  assert(result.filename.endsWith(".docx"));
  assert(result.fontNotice.includes("方正书宋_GBK"));
});

test("illustrations are fitted without changing aspect ratio", () => {
  const size = fittedImageSize(png, "png");
  assert.strictEqual(size.width / size.height, 4 / 3);
  assert(size.width <= 378 && size.height <= 472);
});

test("PDF export uses the private LibreOffice renderer when present", { skip: !resolveLibreOfficeBinary() }, async () => {
  const word = await buildBookDocx(project, { loadImage: async () => ({ buffer: png, mimeType: "image/png" }) });
  const result = await convertDocxToPdf(require("node:path").resolve(__dirname, ".."), word.buffer, word.filename);
  assert(result.buffer.length > 1000);
  assert.strictEqual(result.buffer.subarray(0, 5).toString("ascii"), "%PDF-");
  assert(result.filename.endsWith(".pdf"));
});
