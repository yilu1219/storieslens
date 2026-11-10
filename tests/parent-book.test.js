const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  A5_HEIGHT_MM,
  A5_HEIGHT_PT,
  A5_WIDTH_MM,
  A5_WIDTH_PT,
  MAX_PAGES,
  buildParentBookPdf,
  isA5PageSize,
  readPdfPageSize
} = require("../parent-book-pdf");
const { inspectParentBookRequest, inspectParentBookUpload } = require("../parent-book-safety");
const { FILM_HEIGHT, FILM_WIDTH, filmArgs, renderParentBookFilm } = require("../parent-book-film");
const { resolveBinary } = require("../ffmpeg-movie-renderer");

const root = path.resolve(__dirname, "..");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=", "base64");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("parent book PDF is a real A5 document without LibreOffice", async () => {
  const result = await buildParentBookPdf({
    title: "小羽的画",
    childName: "小羽",
    language: "zh",
    pages: [
      { buffer: png, mimeType: "image/png" },
      { buffer: png, mimeType: "image/png" }
    ]
  });
  assert.equal(result.buffer.subarray(0, 5).toString("ascii"), "%PDF-");
  assert(result.buffer.length > 400);
  assert.equal(result.pageCount, 2);
  assert.equal(result.filename.endsWith(".pdf"), true);
  assert.equal(result.pageSize.widthMm, A5_WIDTH_MM);
  assert.equal(result.pageSize.heightMm, A5_HEIGHT_MM);
  assert.equal(result.pageSize.widthPt, A5_WIDTH_PT);
  assert.equal(result.pageSize.heightPt, A5_HEIGHT_PT);

  const measured = await readPdfPageSize(result.buffer);
  assert.equal(measured.pageCount, 2);
  assert.equal(isA5PageSize(measured), true);
  assert(Math.abs(measured.widthMm - 148) < 0.05);
  assert(Math.abs(measured.heightMm - 210) < 0.05);
  assert.doesNotMatch(read("parent-book-pdf.js"), /libreoffice|soffice/i);
});

test("parent book PDF accepts image data URLs and rejects an empty book", async () => {
  const pngDataUrl = `data:image/png;base64,${png.toString("base64")}`;
  const result = await buildParentBookPdf({ pages: [{ imageDataUrl: pngDataUrl }] });
  const measured = await readPdfPageSize(result.buffer);
  assert.equal(isA5PageSize(measured), true);
  await assert.rejects(() => buildParentBookPdf({ pages: [] }), /pages_required/);
});

test("parent book safety allows artwork and personal photos, and never blocks not_artwork", () => {
  assert.equal(inspectParentBookUpload({ filename: "sunset-drawing.jpg", reasonCode: "not_artwork" }).blocked, false);
  assert.equal(inspectParentBookUpload({ filename: "family-photo.jpg", reasonCode: "real_person" }).blocked, false);
  assert.equal(inspectParentBookUpload({ filename: "child-writing.png", reasonCode: "personal_photograph" }).blocked, false);
  assert.equal(inspectParentBookUpload({ title: "My child's art" }).blocked, false);
  assert.equal(inspectParentBookUpload({ filename: "IMG_2024.HEIC" }).reasonCode, "approved");
});

test("parent book safety blocks identity documents, school IDs, and contact information", () => {
  assert.equal(inspectParentBookUpload({ filename: "身份证正面.jpg" }).reasonCode, "identity_document");
  assert.equal(inspectParentBookUpload({ filename: "passport-scan.png" }).reasonCode, "identity_document");
  assert.equal(inspectParentBookUpload({ filename: "学生证.jpg" }).reasonCode, "school_information");
  assert.equal(inspectParentBookUpload({ caption: "school id lunch card" }).reasonCode, "school_information");
  assert.equal(inspectParentBookUpload({ filename: "photo-with-qr-code.jpg" }).reasonCode, "contact_information");
  assert.equal(inspectParentBookUpload({ caption: "call 13812345678" }).reasonCode, "contact_information");
  assert.equal(inspectParentBookRequest({
    title: "Our book",
    pages: [{ filename: "id-card.jpg", imageDataUrl: "data:image/jpeg;base64,AAAA" }]
  }).reasonCode, "identity_document");
});

test("parent book film helper builds an H.264 slideshow when ffmpeg is available", { skip: !resolveBinary() }, async () => {
  assert.equal(FILM_WIDTH % 2, 0);
  assert.equal(FILM_HEIGHT % 2, 0);
  assert(Math.abs((FILM_WIDTH / FILM_HEIGHT) - (A5_WIDTH_MM / A5_HEIGHT_MM)) < 0.01);
  const args = filmArgs({ concatPath: "pages.txt", duration: 6, outputPath: "out.mp4" });
  assert(args.includes("libx264"));
  assert(args.includes("yuv420p"));
  assert(args.includes("+faststart"));
  assert(!args.join(" ").includes("seedance"));

  const result = await renderParentBookFilm({
    title: "Family Book",
    secondsPerPage: 2,
    pages: [
      { buffer: png, mimeType: "image/png" },
      { buffer: png, mimeType: "image/png" }
    ]
  });
  assert.equal(result.mimeType, "video/mp4");
  assert(result.buffer.length > 1024);
  assert.equal(result.filename.endsWith(".mp4"), true);
  assert(result.buffer.includes(Buffer.from("ftyp")) || result.buffer.subarray(4, 8).toString("ascii") === "ftyp");
});

test("parent book page, routes, and homepage entry are wired for China and international use", () => {
  const html = read("parent-book.html");
  const css = read("parent-book.css");
  const js = read("parent-book.js");
  const server = read("server.js");
  const index = read("index.html");
  const homeJs = read("portal-home.js");

  assert.match(server, /"\/parent-book": "\/parent-book.html"/);
  assert.match(server, /"\/family-book": "\/parent-book.html"/);
  assert.match(server, /\/api\/parent-book\/pdf/);
  assert.match(server, /\/api\/parent-book\/film/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com/);
  assert.doesNotMatch(css, /fonts\.googleapis/);
  assert.match(html, /vendor\/pdf-lib\.min\.js/);
  assert.match(html, /artwork-upload-safety\.js/);
  assert.match(html, /capture="environment"/);
  assert.match(html, /multiple/);
  assert.match(js, /MicroMessenger/);
  assert.match(js, /removeMetadata/);
  assert.match(js, /StoriesLensArtworkSafety/);
  assert.doesNotMatch(js, /reviewSanitizedArtwork|processArtwork\(/);
  assert.match(js, /PDFDocument/);
  assert.match(index, /href="parent-book"/);
  assert.match(index, /data-audience="parent-book"/);
  assert.match(homeJs, /parent-book-cta/);
  assert.match(read("chinese-studio.html"), /parent-book\.html/);
  assert(fs.existsSync(path.join(root, "vendor/pdf-lib.min.js")));
  assert.equal(MAX_PAGES, 24);
});
