const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { PDFDocument } = require("pdf-lib");
const { listFamilyBookOffers, getFamilyBookOffer } = require("../family-book-catalog");
const {
  AUTHOR_INTRO_TEMPLATES,
  authorIntroTemplates,
  looksLikeFilenameTitle,
  looksLikeFullLegalName,
  suggestFamilyBook
} = require("../family-book-review");
const { familyCheckoutStatus, entitlementFromQuery } = require("../family-book-payments");
const { createFamilyBookStore } = require("../family-book-store");
const { createFamilyBookApi } = require("../family-book-api");
const { A5_WIDTH_MM, A5_HEIGHT_MM, isA5PageSize, readPdfPageSize } = require("../parent-book-pdf");

const root = path.resolve(__dirname, "..");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7l3iMAAAAFElEQVR42mNkYGD4z0AEYBxVSFUAANcABfkcTksAAAAASUVORK5CYII=",
  "base64"
);
const pngDataUrl = `data:image/png;base64,${png.toString("base64")}`;

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function tempStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "family-book-"));
  return { dir, store: createFamilyBookStore({ root: dir }) };
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    buffer: null,
    contentType: "",
    filename: "",
    setHeader(name, value) {
      this.headers[name] = value;
    }
  };
}

function createTestApi(store) {
  let lastBody = null;
  const api = createFamilyBookApi({
    store,
    sendJson(response, status, body) {
      response.statusCode = status;
      response.body = body;
    },
    sendBinary(response, { buffer, contentType, filename }) {
      response.statusCode = 200;
      response.buffer = buffer;
      response.contentType = contentType;
      response.filename = filename;
    },
    async readJsonBody() {
      return lastBody;
    },
    consumeRateLimit() {
      return true;
    },
    publicBaseUrl: ""
  });
  return {
    async call(method, pathName, body) {
      lastBody = body;
      const requestUrl = new URL(pathName, "http://127.0.0.1");
      const response = mockResponse();
      const handled = await api.handle({ method }, response, requestUrl);
      return { handled, response };
    }
  };
}

test("family book prices are ¥19.9 and ¥129 with international equivalents", () => {
  const offers = listFamilyBookOffers();
  const digital = getFamilyBookOffer("family-digital");
  const printed = getFamilyBookOffer("family-print");
  assert.equal(offers.length, 2);
  assert.equal(digital.priceCny, 19.9);
  assert.equal(digital.priceUsd, 2.99);
  assert.equal(digital.amountMinorCny, 1990);
  assert.equal(printed.priceCny, 129);
  assert.equal(printed.priceUsd, 17.99);
  assert.equal(printed.amountMinorCny, 12900);
  assert.match(digital.displayZh, /¥19\.9/);
  assert.match(digital.displayEn, /\$2\.99/);
  assert.match(printed.displayZh, /¥129/);
  assert.match(printed.displayEn, /\$17\.99/);
  assert.equal(digital.priceEnv, "STRIPE_PRICE_FAMILY_DIGITAL");
  assert.equal(printed.priceEnv, "STRIPE_PRICE_FAMILY_PRINT");
});

test("author intro templates and optional suggestions never rewrite artwork", () => {
  assert.equal(authorIntroTemplates("zh").length, 3);
  assert.equal(AUTHOR_INTRO_TEMPLATES.en.length, 3);
  assert.equal(looksLikeFilenameTitle("IMG_1234.jpg"), true);
  assert.equal(looksLikeFilenameTitle("春天的花园"), false);
  assert.equal(looksLikeFullLegalName("Zhang Wei Ming"), true);
  assert.equal(looksLikeFullLegalName("Mia"), false);

  const suggestions = suggestFamilyBook({
    locale: "zh",
    title: "",
    authorName: "",
    authorIntro: "",
    childName: "Zhang Wei Ming",
    photoCount: 3,
    firstFileName: "IMG_0001.HEIC"
  });
  const ids = suggestions.map((item) => item.id);
  assert(ids.includes("missing-title"));
  assert(ids.includes("missing-author"));
  assert(ids.includes("short-intro"));
  assert(ids.includes("page-order"));
  assert(ids.includes("legal-name-warning"));
  assert(suggestions.every((item) => ["title", "authorName", "authorIntro", "pageOrder", "childName"].includes(item.field)));
  assert(suggestions.every((item) => item.field !== "pages" && item.field !== "artwork" && item.field !== "imageDataUrl"));
  assert(suggestions.some((item) => /will not change the child’s artwork or writing|不会改孩子的画或作文/i.test(JSON.stringify(item.message))));
  assert.equal(suggestions.find((item) => item.id === "short-intro").reversible, true);
});

test("checkout stays unconfigured without keys or invented live price IDs, and a success query is never payment", () => {
  const empty = familyCheckoutStatus({});
  assert.equal(empty.checkoutConfigured, false);
  assert.equal(empty.offers[0].priceCny, 19.9);
  assert.equal(empty.offers[1].priceCny, 129);
  assert.match(empty.noticeZh, /¥19\.9/);
  assert.match(empty.noticeEn, /\$2\.99/);

  const liveMissingPrices = familyCheckoutStatus({
    STRIPE_SECRET_KEY: "sk_live_placeholderkey",
    STRIPE_LIVE_MODE: "true",
    PUBLIC_BASE_URL: "https://www.storieslens.com"
  });
  assert.equal(liveMissingPrices.checkoutConfigured, false);
  assert.equal(liveMissingPrices.offers.every((offer) => offer.checkoutReady === false), true);

  const claimed = entitlementFromQuery("paid=1&success=true&checkout=success&session_id=cs_test_abc");
  assert.equal(claimed.paid, false);
  assert.equal(claimed.claimedByPage, true);
  assert.equal(claimed.sessionId, "cs_test_abc");
  assert.match(claimed.reason, /never proof of payment/i);
});

test("teacher shares are private, retrievable by token or short code, and never listed", () => {
  const { store } = tempStore();
  const created = store.createShare({
    kind: "class",
    title: "春天画展",
    className: "三年二班",
    teacherName: "李老师",
    language: "zh",
    pages: [
      { imageDataUrl: pngDataUrl, studentName: "Mia" },
      { imageDataUrl: pngDataUrl, studentName: "Leo" }
    ]
  });
  assert.equal(created.token.length, 48);
  assert.equal(created.code.length, 8);
  assert.equal(created.pages, undefined);
  assert.deepEqual(store.listShareIndex(), []);

  const byToken = store.getShareByToken(created.token, { includePages: true });
  const byCode = store.getShareByCode(created.code, { includePages: true });
  assert.equal(byToken.title, "春天画展");
  assert.equal(byToken.className, "三年二班");
  assert.equal(byToken.pages.length, 2);
  assert.equal(byCode.token, created.token);
  assert.match(byToken.pages[0].imageDataUrl, /^data:image\/png;base64,/);

  assert.throws(() => store.createShare({
    title: "班集",
    pages: [{ imageDataUrl: pngDataUrl, filename: "学生证.jpg", studentName: "A" }]
  }), /school_information|identity_document/);
});

test("orders require an adult, unpaid downloads stay locked, and only a server-side grant unlocks the official A5 PDF", async () => {
  const { store } = tempStore();
  const share = store.createShare({
    kind: "class",
    title: "Our Class Book",
    className: "Class 3",
    pages: [{ imageDataUrl: pngDataUrl }]
  });
  assert.throws(() => store.createOrder({
    offerId: "family-digital",
    shareToken: share.token,
    contact: { email: "parent@example.com" },
    adultConfirmed: false
  }), /adult_confirmation_required/);
  assert.throws(() => store.createOrder({
    offerId: "family-print",
    shareToken: share.token,
    contact: { email: "parent@example.com" },
    adultConfirmed: true
  }), /shipping_required/);

  const unpaid = store.createOrder({
    offerId: "family-digital",
    shareToken: share.token,
    contact: { name: "Parent Yi", email: "parent@example.com" },
    adultConfirmed: true
  });
  assert.equal(unpaid.paid, false);
  assert.equal(unpaid.grantToken, "");
  assert.equal(store.paidOrderForDownload(unpaid.id, "anything"), null);

  const api = createTestApi(store);
  const checkout = await api.call("POST", "/api/family-book/checkout", {
    offerId: "family-digital",
    shareToken: share.token,
    adultConfirmed: true,
    contact: { name: "Parent Yi", email: "parent@example.com" }
  });
  assert.equal(checkout.response.statusCode, 503);
  assert.equal(checkout.response.body.paid, false);
  assert.equal(checkout.response.body.checkoutConfigured, false);
  assert.match(JSON.stringify(checkout.response.body.prices), /19\.9/);

  const fakePaid = await api.call("GET", "/api/family-book/entitlement?paid=1&success=true&order=" + unpaid.id);
  assert.equal(fakePaid.response.body.paid, false);
  assert.notEqual(fakePaid.response.body.reason, "server_confirmed");

  const blockedDownload = await api.call("POST", "/api/family-book/download", {
    orderId: unpaid.id,
    grantToken: "not-a-grant"
  });
  assert.equal(blockedDownload.response.statusCode, 402);
  assert.equal(blockedDownload.response.body.paid, false);

  const loaded = store.loadOrder(unpaid.id);
  const paid = store.markOrderPaid(unpaid.id, { grantToken: loaded.grantToken });
  assert.equal(paid.paid, true);
  assert.ok(paid.grantToken);

  const entitled = await api.call("GET", `/api/family-book/entitlement?order=${paid.id}&grant=${paid.grantToken}`);
  assert.equal(entitled.response.body.paid, true);
  assert.equal(entitled.response.body.reason, "server_confirmed");

  const download = await api.call("POST", "/api/family-book/download", {
    orderId: paid.id,
    grantToken: paid.grantToken,
    title: "Our Class Book",
    language: "en"
  });
  assert.equal(download.response.statusCode, 200);
  assert.equal(download.response.contentType, "application/pdf");
  assert.equal(download.response.buffer.subarray(0, 5).toString("ascii"), "%PDF-");
  const measured = await readPdfPageSize(download.response.buffer);
  assert.equal(isA5PageSize(measured), true);
  assert(Math.abs(measured.widthMm - A5_WIDTH_MM) < 0.05);
  assert(Math.abs(measured.heightMm - A5_HEIGHT_MM) < 0.05);
  const doc = await PDFDocument.load(download.response.buffer);
  assert.equal(doc.getPageCount(), 1);
});

test("parent and teacher pages, share links, and homepage entries are wired with honest payment copy", () => {
  const server = read("server.js");
  const parentHtml = read("parent-book.html");
  const parentJs = read("parent-book.js");
  const teacherHtml = read("teacher-book.html");
  const teacherJs = read("teacher-book.js");
  const shareHtml = read("book-share.html");
  const shareJs = read("book-share.js");
  const index = read("index.html");
  const homeJs = read("portal-home.js");
  const envExample = read(".env.example");

  assert.match(server, /"\/teacher-book": "\/teacher-book.html"/);
  assert.match(server, /"\/class-book": "\/teacher-book.html"/);
  assert.match(server, /"\/book-share": "\/book-share.html"/);
  assert(server.includes("/b/") || server.includes("\\/b\\/"), "short-code path /b/:code should be served");
  assert.match(server, /book-share\.html/);
  assert.match(server, /X-Robots-Tag/);
  assert.match(server, /sendJson\(response, 402/);
  assert.match(parentHtml, /¥19\.9/);
  assert.match(parentHtml, /¥129/);
  assert.match(parentHtml, /data-author-intro/);
  assert.match(parentHtml, /data-suggest-accept/);
  assert.match(parentHtml, /data-adult-confirm/);
  assert.match(parentJs, /server_confirmed/);
  assert.match(parentJs, /\/api\/family-book\/download/);
  assert.match(parentJs, /response\.status === 402/);
  assert.doesNotMatch(parentJs, /reviewSanitizedArtwork|processArtwork\(/);
  assert.equal(teacherHtml.includes("yu-mentor.js") || teacherJs.includes("yu-mentor.js") || teacherHtml.includes('checkout.html'), false)
  assert.match(teacherHtml, /data-create-share/);
  assert.match(teacherJs, /\/api\/family-book\/shares/);
  assert.match(shareHtml, /noindex, nofollow, noarchive/);
  assert.match(shareJs, /family-digital/);
  assert.match(shareJs, /family-print/);
  assert.match(index, /href="parent-book"/);
  assert.match(index, /href="teacher-book"/);
  assert.match(index, /data-audience="teacher-book"/);
  assert.match(homeJs, /teacher-book-cta/);
  assert.match(homeJs, /¥19\.9/);
  assert.match(read("chinese-studio.html"), /teacher-book\.html/);
  assert.match(envExample, /STRIPE_PRICE_FAMILY_DIGITAL=/);
  assert.match(envExample, /STRIPE_PRICE_FAMILY_PRINT=/);
  for (const file of ["parent-book.html", "teacher-book.html", "book-share.html", "parent-book.css", "family-book-ui.css"]) {
    assert.doesNotMatch(read(file), /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com/);
  }
});
