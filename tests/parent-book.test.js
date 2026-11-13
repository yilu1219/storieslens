const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { PDFDocument } = require("pdf-lib");
const {
  A5_HEIGHT_MM,
  A5_WIDTH_MM,
  BLEED_HEIGHT_MM,
  BLEED_HEIGHT_PT,
  BLEED_WIDTH_MM,
  BLEED_WIDTH_PT,
  MAX_PAGES,
  buildInformalPreviewPdf,
  buildParentBookPdf,
  isPrintReadyPageSize,
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
  assert.equal(result.official, true);
  assert.equal(result.pageSize.widthMm, BLEED_WIDTH_MM);
  assert.equal(result.pageSize.heightMm, BLEED_HEIGHT_MM);
  assert.equal(result.pageSize.widthPt, BLEED_WIDTH_PT);
  assert.equal(result.pageSize.heightPt, BLEED_HEIGHT_PT);
  assert.equal(result.pageSize.trimWidthMm, A5_WIDTH_MM);
  assert.equal(result.pageSize.trimHeightMm, A5_HEIGHT_MM);

  const measured = await readPdfPageSize(result.buffer);
  assert.equal(measured.pageCount, 2);
  assert.equal(isPrintReadyPageSize(measured), true);
  assert(Math.abs(measured.widthMm - 154) < 0.05);
  assert(Math.abs(measured.heightMm - 216) < 0.05);
  assert(Math.abs(measured.trim.widthMm - 148) < 0.05);
  assert(Math.abs(measured.trim.heightMm - 210) < 0.05);
  assert(Math.abs(measured.bleed.widthMm - 154) < 0.05);
  assert(Math.abs(measured.bleed.heightMm - 216) < 0.05);
  assert(Math.abs(measured.trim.xPt - measured.bleed.xPt) > 1);
  const doc = await PDFDocument.load(result.buffer);
  assert.equal(doc.getPageCount(), 2);
  assert.doesNotMatch(String(doc.getSubject() || ""), /preview|watermark|预览/i);
  assert.doesNotMatch(String(doc.getCreator() || ""), /Informal Preview|watermark/i);
  assert.doesNotMatch(read("parent-book-pdf.js"), /libreoffice|soffice/i);
  const prepare = require("../artwork-prepare");
  assert.equal(prepare.PAGE_WIDTH_MM, BLEED_WIDTH_MM);
  assert.equal(prepare.PAGE_HEIGHT_MM, BLEED_HEIGHT_MM);
  assert.equal(prepare.TRIM_WIDTH_MM, A5_WIDTH_MM);
  assert.equal(prepare.TRIM_HEIGHT_MM, A5_HEIGHT_MM);
  assert.equal(prepare.PAGE_WIDTH_PX, Math.round(154 * 300 / 25.4));
  assert.equal(prepare.PAGE_HEIGHT_PX, Math.round(216 * 300 / 25.4));
  assert.equal(prepare.PRINT_DPI, 300);
});

test("parent book PDF accepts image data URLs and rejects an empty book", async () => {
  const pngDataUrl = `data:image/png;base64,${png.toString("base64")}`;
  const result = await buildParentBookPdf({ pages: [{ imageDataUrl: pngDataUrl }] });
  const measured = await readPdfPageSize(result.buffer);
  assert.equal(isPrintReadyPageSize(measured), true);
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

  assert.match(server, /\/photos-to-ebook/);
  assert.match(server, /照片成为电子书/);
  assert.match(server, /LEGACY_PARENT_PATHS/);
  assert.match(server, /\/api\/parent-book\/pdf/);
  assert.match(server, /\/api\/parent-book\/film/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com/);
  assert.doesNotMatch(css, /fonts\.googleapis/);
  assert.match(html, /artwork-upload-safety\.js/);
  assert.match(html, /capture="environment"/);
  assert.match(html, /multiple/);
  assert.match(js, /MicroMessenger/);
  assert.match(js, /removeMetadata/);
  assert.match(js, /StoriesLensArtworkSafety/);
  assert.doesNotMatch(js, /reviewSanitizedArtwork|processArtwork\(/);
  assert.match(js, /\/api\/family-book\/download/);
  assert.match(js, /downloadPreviewPdf/);
  assert.match(js, /preserveAlpha: true/);
  assert.match(js, /drawRebuiltPage/);
  assert.match(js, /requestPdfCraftExtraction/);
  assert.doesNotMatch(js, /drawImageFullBleed/);
  assert.match(js, /avatarUseDecision/);
  assert.match(js, /planBookPages/);
  assert.doesNotMatch(js, /toJpegDataUrl/);
  assert.doesNotMatch(js, /height: 980/);
  assert.match(html, /data-download-preview/);
  assert.match(html, /预览 PDF/);
  assert.match(html, /data-signature/);
  assert.match(html, /data-avatar-illustrated|avatar-illustrated/);
  assert.match(html, /artwork-prepare\.js/);
  assert.doesNotMatch(html.split("price-grid")[0], /¥19\.9|¥129|¥199/);
  assert.match(html, /¥19\.9/);
  assert.match(index, /href="\/photos-to-ebook"/);
  assert.match(index, /data-audience="parent-book"/);
  assert.match(homeJs, /parent-book-cta/);
  assert.match(read("chinese-studio.html"), /照片成为电子书/);
  assert(fs.existsSync(path.join(root, "vendor/pdf-lib.min.js")));
  assert.equal(MAX_PAGES, 24);
});

test("informal preview PDF is created without payment and still fills A5", async () => {
  const result = await buildInformalPreviewPdf({
    title: "预览",
    pages: [{ buffer: png, mimeType: "image/png" }]
  });
  assert.equal(result.preview, true);
  assert.equal(result.official, false);
  assert.equal(result.paid, false);
  assert.match(result.filename, /preview/);
  assert.equal(result.buffer.subarray(0, 5).toString("ascii"), "%PDF-");
  const doc = await PDFDocument.load(result.buffer);
  assert.match(String(doc.getSubject() || ""), /preview|预览/);
  assert.match(String(doc.getCreator() || ""), /Informal Preview/);
  const measured = await readPdfPageSize(result.buffer);
  assert.equal(isPrintReadyPageSize(measured), true);
  assert.equal(result.official, false);
});

test("a success query string does not unlock the official download or email", async () => {
  const os = require("node:os");
  const { createFamilyBookStore } = require("../family-book-store");
  const { createFamilyBookApi } = require("../family-book-api");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "parent-book-pay-"));
  const store = createFamilyBookStore({ root: dir });
  const unpaid = store.createOrder({
    offerId: "family-digital",
    contact: { name: "Parent Yi", email: "parent@example.com" },
    adultConfirmed: true
  });
  let lastBody = null;
  const api = createFamilyBookApi({
    store,
    env: {},
    sendJson(response, status, body) {
      response.statusCode = status;
      response.body = body;
    },
    sendBinary() {},
    async readJsonBody() { return lastBody; },
    consumeRateLimit() { return true; }
  });
  async function call(method, pathName, body) {
    lastBody = body;
    const response = { statusCode: 200, headers: {}, body: null, setHeader() {} };
    await api.handle({ method }, response, new URL(pathName, "http://127.0.0.1"));
    return response;
  }
  const entitlement = await call("GET", `/api/family-book/entitlement?paid=1&success=true&order=${unpaid.id}`);
  assert.equal(entitlement.body.paid, false);
  assert.notEqual(entitlement.body.reason, "server_confirmed");
  const download = await call("POST", "/api/family-book/download?paid=1&success=true", {
    orderId: unpaid.id,
    grantToken: "not-a-grant",
    pages: [{ imageDataUrl: `data:image/png;base64,${png.toString("base64")}` }]
  });
  assert.equal(download.statusCode, 402);
  assert.equal(download.body.paid, false);
  const email = await call("POST", "/api/family-book/email?paid=1&success=true", {
    orderId: unpaid.id,
    grantToken: "not-a-grant",
    email: "parent@example.com",
    pages: [{ imageDataUrl: `data:image/png;base64,${png.toString("base64")}` }]
  });
  assert.equal(email.statusCode, 402);
  assert.equal(email.body.paid, false);
  assert.equal(email.body.sent, false);
});

test("artwork upload is labeled after the signature, and the preview can be edited by the parent", () => {
  const html = read("parent-book.html");
  const js = read("parent-book.js");
  const signatureAt = html.indexOf("data-signature-save");
  const albumAt = html.indexOf("data-album");
  const cameraAt = html.indexOf("data-camera");
  const thumbsAt = html.indexOf("data-thumbs");
  const uploadBlock = html.slice(signatureAt, thumbsAt);
  assert.ok(signatureAt > 0 && signatureAt < albumAt && albumAt < cameraAt && cameraAt < thumbsAt);
  assert.match(uploadBlock, /data-i18n="upload-start">这里开始上传照片</);
  assert.match(uploadBlock, /id="artwork-upload-start"/);
  assert.match(uploadBlock, /aria-labelledby="artwork-upload-start"/);
  assert.doesNotMatch(html.slice(0, signatureAt), /这里开始上传照片/);
  assert.doesNotMatch(read("teacher-book.html"), /这里开始上传照片/);
  assert.match(js, /"upload-start": "这里开始上传照片"/);
  assert.match(js, /"upload-start": "Start uploading photos here"/);
  const previewAt = html.indexOf("data-preview-card");
  const editAt = html.indexOf("data-book-edit");
  const suggestAt = html.indexOf("data-suggest-card");
  assert.ok(previewAt > 0 && previewAt < editAt && editAt < suggestAt);
  assert.match(html.slice(previewAt, suggestAt), /data-book-edit-fields/);
  assert.match(html, /parent-book\.js\?v=20261113-ai-film/);
  assert.match(html, /parent-book\.css\?v=20261113-ai-film/);
  assert.match(html, /artwork-prepare\.js\?v=20261113-scan-sheet/);
  assert.match(html, /preview-watermark\.js\?v=20261112-proof-ebook/);
  assert.match(html, /data-book-assistant/);
  assert.match(html, /data-assist-proof/);
  assert.match(html, /data-assist-accept/);
  assert.match(html, /data-assist-reject/);
  assert.match(html, /data-proof-banner/);
  assert.ok(html.indexOf("data-page-editor") < html.indexOf("data-proof-banner") && html.indexOf("data-proof-banner") < html.indexOf("data-book-edit"));
  assert.match(js, /This page looks clear/);
  assert.match(js, /这一页看起来没有问题/);
  assert.match(js, /showProofreading/);
  assert.match(js, /storyProofIndex/);
  assert.match(js, /function watermarkPage/);
  assert.match(read("teacher-book.html"), /data-proof-banner/);
  assert.match(read("teacher-book.js"), /showProofreading/);
  assert.match(read("teacher-book.js"), /This page looks clear/);
  assert.match(html, /data-interior-style checked/);
  assert.match(html, /原画摆正/);
  assert.match(html, /精修插画/);
  assert.match(js, /interiorStyle: "original"/);
  assert.match(js, /retainBookEdits/);
  const teacherHtml = read("teacher-book.html");
  assert.match(teacherHtml, /data-interior-style checked/);
  assert.match(teacherHtml, /parent-book\.css\?v=20261112-proof-ebook/);
  assert.match(teacherHtml, /artwork-prepare\.js\?v=20261113-scan-sheet/);
  assert.match(teacherHtml, /teacher-book\.js\?v=20261112-proof-ebook/);
  assert.match(teacherHtml, /preview-watermark\.js\?v=20261112-proof-ebook/);
  assert.match(teacherHtml, /data-assist-proof/);
  assert.match(read("teacher-book.js"), /planBookPages/);
  assert.match(js, /function commitPhotoText/);
  assert.match(js, /photo\.textEdited = true/);
  assert.match(js, /photo\.textStatus = "parent"/);
  assert.match(js, /rotateQuarter/);
  assert.match(js, /function rotatePhoto/);
  assert.match(js, /"rotate-photo": "旋转 90°"/);
  assert.match(js, /"rotate-photo": "Rotate 90°"/);
  assert.match(js, /state\.coverId = photos\[0\]\.id/);
  assert.match(js, /state\.coverId = state\.photos\[0\] \? state\.photos\[0\]\.id : ""/);
  assert.match(read("parent-book.html"), /data-cover-style checked/);
  assert.match(js, /bindBookAssistant/);
  assert.match(js, /applyInteriorStyleArt\(state\.photos\)/);
  assert.doesNotMatch(js, /photo\.artSource = "style"/);
  assert.match(read("teacher-book.js"), /applyInteriorStyleArt\(state\.photos\)/);
  assert.doesNotMatch(read("teacher-book.js"), /photo\.artSource = "style"/);
  assert.match(read("artwork-prepare.js"), /accepted: true/);
  assert.match(read("artwork-prepare.js"), /proposal\.accepted !== true/);
  assert.match(read("artwork-prepare.js"), /function proposeProofreading/);
  assert.match(html, /data-page-editor/);
  assert.match(html, /data-page-text/);
  assert.match(js, /bindPageEditor/);
  assert.match(js, /artFrame/);
  assert.match(read("teacher-book.js"), /bindPageEditor/);
  assert.match(read("teacher-book.html"), /data-page-editor/);
  assert.match(js, /function renderBookEditor/);
  assert.match(js, /renderBookEditor\(\)/);
  const acceptReading = js.slice(js.indexOf("function acceptReading"), js.indexOf("async function askYuToReview"));
  assert.match(acceptReading, /approveReading/);
  assert.doesNotMatch(acceptReading, /photo\.text\s*=/);
  assert.doesNotMatch(acceptReading, /textEdited\s*=\s*true/);
});

test("parent book shows staged Yu progress, a watermarked preview, and pay-then-email delivery", () => {
  const html = read("parent-book.html");
  const js = read("parent-book.js");
  assert.match(html, /assets\/yu-mascot-logo-v2\.png/);
  assert.match(html, /data-yu-progress/);
  assert.match(html, /data-progress-percent/);
  assert.match(html, /data-progress-arc/);
  assert.match(html, /yu-progress-sheen/);
  assert.match(html, /id="yu-progress-label"/);
  assert.match(js, /function showProgress\(done, total/);
  assert.match(js, /Math\.round\(\(done \/ total\) \* 100\)/);
  const show = js.slice(js.indexOf("function showProgress"), js.indexOf("function hideProgress"));
  assert.match(show, /PROGRESS_RING_LENGTH \* \(1 - percent \/ 100\)/);
  assert.match(show, /strokeDashoffset/);
  assert.doesNotMatch(show, /setInterval|requestAnimationFrame/);
  const css = read("parent-book.css");
  const calm = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(calm, /\.yu-progress-sheen \{ animation: none; opacity: 0; \}/);
  assert.match(calm, /\.yu-progress-glow \{[\s\S]*animation: none;/);
  const locale = js.slice(js.indexOf("function applyLocale"), js.indexOf("function inspectUpload"));
  assert.match(locale, /showProgress\(current\.done, current\.total, current\.key, current\.vars\)/);
  assert.match(show, /progressState = \{ done, total, key, vars: vars \|\| \{\} \}/);
  assert.match(css, /\.yu-progress-value \{ stroke: var\(--leaf-deep\); \}/);
  assert.match(read("teacher-book.html"), /parent-book\.css\?v=20261112-proof-ebook/);
  assert.doesNotMatch(js, /setStatus\(t\("cutting"\)\)/);
  assert.doesNotMatch(js, /Extracting the drawing and the words with pdf-craft/);
  assert.match(js, /assets\/storieslens-logo\.png/);
  assert.match(js, /function watermarkPage/);
  assert.match(js, /for \(const pageDataUrl of state\.previewPages\)/);
  assert.match(js, /return state\.pages\.map\(\(imageDataUrl\) => \(\{ imageDataUrl \}\)\)/);
  assert.match(js, /The words were not read confidently/);
  const renderWork = js.slice(js.indexOf("async function renderWorkPage"), js.indexOf("async function renderPhotoPage"));
  assert.doesNotMatch(renderWork, /note:|pageNote|noteFont/);
  const prepare = read("artwork-prepare.js");
  const draw = prepare.slice(prepare.indexOf("function drawRebuiltPage"), prepare.indexOf("function drawCoverPage"));
  assert.doesNotMatch(draw, /options\.note|noteFont/);
  const fillPrint = js.slice(js.indexOf("function fillPrintRoot"), js.indexOf("async function requestFilmFromServer"));
  assert.match(fillPrint, /officialPrintUnlocked/);
  assert.match(fillPrint, /state\.pages\.forEach/);
  assert.doesNotMatch(fillPrint, /previewPages/);
  const printClick = js.slice(js.indexOf("els.print?.addEventListener"), js.indexOf("els.makeFilm.addEventListener"));
  assert.match(printClick, /officialPrintUnlocked/);
  assert.doesNotMatch(printClick, /previewPages/);
  const teacher = read("teacher-book.js");
  assert.match(teacher, /drawCoverPage/);
  assert.match(teacher, /state\.previewPages/);
  assert.match(teacher, /pages: state\.pages\.map/);
  assert.doesNotMatch(teacher, /pageNote|noteFont/);
  assert.match(js, /quality = 0\.92/);
  assert.match(js, /result\.paid === true && result\.reason === "server_confirmed"/);
  assert.match(html, /data-official-path/);
  assert.match(html, /data-i18n="official-step-pay"/);
  assert.match(html, /data-i18n="official-step-email"/);
  assert.match(html, /data-i18n="official-step-send"/);
  assert.match(html, /data-follow-up hidden/);
  assert.match(html, /mailto:support@storieslens\.com/);
  assert.match(html, /href="refund-policy\.html"/);
  assert.match(js, /emailSent === true/);
  assert.match(js, /syncFollowUp\(\)/);
  assert.doesNotMatch(html, /sk_live_|sk_test_|whsec_/);
});
