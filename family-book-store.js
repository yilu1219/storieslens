const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { inspectParentBookRequest } = require("./parent-book-safety");
const { getFamilyBookOffer } = require("./family-book-catalog");
const { stripeObjectId } = require("./family-book-payments");

const MAX_PAGES = 24;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SHARE_TTL_MS = 60 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function defaultRoot() {
  return path.join(__dirname, ".data", "family-books");
}

function createFamilyBookStore({ root } = {}) {
  const base = root || defaultRoot();
  const sharesDir = path.join(base, "shares");
  const ordersDir = path.join(base, "orders");
  const indexPath = path.join(base, "index.json");

  function ensure() {
    fs.mkdirSync(sharesDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(ordersDir, { recursive: true, mode: 0o700 });
    if (!fs.existsSync(indexPath)) writeJson(indexPath, { shares: {}, codes: {}, orders: {} });
  }

  function readIndex() {
    ensure();
    try {
      return JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch {
      return { shares: {}, codes: {}, orders: {} };
    }
  }

  function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
    const temp = `${filePath}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(value), { mode: 0o600 });
    fs.renameSync(temp, filePath);
  }

  function writeIndex(index) {
    writeJson(indexPath, index);
  }

  function makeToken() {
    return crypto.randomBytes(24).toString("hex");
  }

  function makeCode() {
    let code = "";
    for (let i = 0; i < 8; i += 1) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    return code;
  }

  function parseDataUrl(value) {
    const match = String(value || "").match(/^data:(image\/(?:jpeg|jpg|png));base64,([a-zA-Z0-9+/=\s]+)$/i);
    if (!match) return null;
    const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
    const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
    return { mimeType, buffer };
  }

  function publicShare(record, { includePages = false } = {}) {
    if (!record) return null;
    const view = {
      id: record.id,
      token: record.token,
      code: record.code,
      title: record.title,
      className: record.className || "",
      teacherName: record.teacherName || "",
      authorName: record.authorName || "",
      authorIntro: record.authorIntro || "",
      childName: record.childName || "",
      language: record.language || "zh",
      pageCount: record.pages.length,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      kind: record.kind || "class"
    };
    if (includePages) {
      view.pages = record.pages.map((page) => ({
        imageDataUrl: `data:${page.mimeType};base64,${page.buffer.toString("base64")}`,
        studentName: page.studentName || "",
        caption: page.caption || ""
      }));
    }
    return view;
  }

  function loadShareRecord(token) {
    const safe = String(token || "").replace(/[^a-f0-9]/gi, "");
    if (!safe) return null;
    const metaPath = path.join(sharesDir, safe, "meta.json");
    if (!fs.existsSync(metaPath)) return null;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (Date.parse(meta.expiresAt) < Date.now()) return null;
    const pages = (meta.pageFiles || []).map((file, index) => {
      const filePath = path.join(sharesDir, safe, file.name);
      const buffer = fs.readFileSync(filePath);
      return {
        mimeType: file.mimeType,
        buffer,
        studentName: file.studentName || "",
        caption: file.caption || "",
        index
      };
    });
    return { ...meta, pages };
  }

  function createShare(input = {}) {
    const pagesIn = Array.isArray(input.pages) ? input.pages : [];
    if (!pagesIn.length) throw Object.assign(new Error("pages_required"), { statusCode: 400 });
    if (pagesIn.length > MAX_PAGES) throw Object.assign(new Error("too_many_pages"), { statusCode: 400 });
    const inspection = inspectParentBookRequest({
      title: input.title,
      childName: input.authorName || input.childName || input.teacherName,
      pages: pagesIn
    });
    if (inspection.blocked) throw Object.assign(new Error(inspection.reasonCode), { statusCode: 422, reasonCode: inspection.reasonCode });

    const parsedPages = pagesIn.map((page, index) => {
      const image = page.buffer && page.mimeType
        ? { buffer: page.buffer, mimeType: page.mimeType }
        : parseDataUrl(page.imageDataUrl);
      if (!image) throw Object.assign(new Error("invalid_image"), { statusCode: 400, page: index });
      inspectStudentName(page.studentName);
      return { ...image, studentName: String(page.studentName || "").trim().slice(0, 40), caption: String(page.caption || "").trim().slice(0, 80) };
    });

    ensure();
    const index = readIndex();
    let token = makeToken();
    while (index.shares[token]) token = makeToken();
    let code = makeCode();
    while (index.codes[code]) code = makeCode();

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SHARE_TTL_MS).toISOString();
    const dir = path.join(sharesDir, token);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const pageFiles = parsedPages.map((page, i) => {
      const ext = page.mimeType === "image/png" ? ".png" : ".jpg";
      const name = `page-${String(i + 1).padStart(2, "0")}${ext}`;
      fs.writeFileSync(path.join(dir, name), page.buffer, { mode: 0o600 });
      return { name, mimeType: page.mimeType, studentName: page.studentName, caption: page.caption };
    });
    const meta = {
      id,
      token,
      code,
      kind: input.kind === "family" ? "family" : "class",
      title: String(input.title || "").trim().slice(0, 80),
      className: String(input.className || "").trim().slice(0, 80),
      teacherName: String(input.teacherName || "").trim().slice(0, 80),
      authorName: String(input.authorName || "").trim().slice(0, 80),
      authorIntro: String(input.authorIntro || "").trim().slice(0, 800),
      childName: String(input.childName || "").trim().slice(0, 40),
      language: input.language === "en" ? "en" : "zh",
      createdAt,
      expiresAt,
      pageFiles
    };
    writeJson(path.join(dir, "meta.json"), meta);
    index.shares[token] = { id, code, expiresAt, kind: meta.kind };
    index.codes[code] = token;
    writeIndex(index);
    return publicShare({ ...meta, pages: parsedPages }, { includePages: false });
  }

  function inspectStudentName(value) {
    const result = inspectParentBookRequest({ title: "", pages: [{ filename: value || "", caption: value || "" }] });
    if (result.blocked) throw Object.assign(new Error(result.reasonCode), { statusCode: 422, reasonCode: result.reasonCode });
  }

  function getShareByToken(token, { includePages = false } = {}) {
    const record = loadShareRecord(token);
    return record ? publicShare(record, { includePages }) : null;
  }

  function getShareByCode(code, options) {
    const index = readIndex();
    const token = index.codes[String(code || "").trim().toUpperCase()];
    if (!token) return null;
    return getShareByToken(token, options);
  }

  function listShareIndex() {
    return [];
  }

  function createOrder({ offerId, shareToken, contact, shipping, adultConfirmed, bookSnapshot, locale }) {
    const offer = getFamilyBookOffer(offerId);
    if (!offer) throw Object.assign(new Error("invalid_offer"), { statusCode: 400 });
    if (adultConfirmed !== true) throw Object.assign(new Error("adult_confirmation_required"), { statusCode: 400, reasonCode: "adult_confirmation_required" });
    const email = String(contact?.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error("adult_email_required"), { statusCode: 400, reasonCode: "adult_email_required" });
    const phone = String(shipping?.phone || contact?.phone || "").trim();
    if (offer.kind === "print") {
      const address = {
        name: shipping?.name,
        phone,
        line1: shipping?.line1,
        city: shipping?.city,
        region: shipping?.region,
        postal: shipping?.postal,
        country: shipping?.country
      };
      if (Object.values(address).some((value) => !String(value || "").trim())) {
        throw Object.assign(new Error("shipping_required"), { statusCode: 400, reasonCode: "shipping_required" });
      }
    }
    ensure();
    const id = crypto.randomUUID();
    const grantToken = crypto.randomBytes(24).toString("hex");
    const order = {
      id,
      grantToken,
      offerId: offer.id,
      kind: offer.kind,
      shareToken: String(shareToken || "").replace(/[^a-f0-9]/gi, ""),
      locale: locale === "en" ? "en" : "zh",
      status: "awaiting_payment",
      paid: false,
      contact: {
        name: String(contact?.name || "").trim().slice(0, 80),
        email,
        phone: String(contact?.phone || phone || "").trim().slice(0, 40)
      },
      shipping: offer.kind === "print" ? {
        name: String(shipping.name || "").trim().slice(0, 80),
        phone: phone.slice(0, 40),
        line1: String(shipping.line1 || "").trim().slice(0, 160),
        line2: String(shipping.line2 || "").trim().slice(0, 160),
        city: String(shipping.city || "").trim().slice(0, 80),
        region: String(shipping.region || "").trim().slice(0, 80),
        postal: String(shipping.postal || "").trim().slice(0, 20),
        country: String(shipping.country || "").trim().slice(0, 80)
      } : null,
      cover: offer.cover || "",
      deliveryEmail: "",
      deliveryEmailUpdatedAt: "",
      emailSentAt: "",
      emailSendCount: 0,
      createdAt: new Date().toISOString(),
      paidAt: "",
      stripeSessionId: "",
      fulfillment: offer.kind === "print" ? "manual_first_batch" : "digital_download",
      bookSnapshot: bookSnapshot || null
    };
    writeJson(path.join(ordersDir, `${id}.json`), order);
    const index = readIndex();
    index.orders[id] = { grantToken, offerId: offer.id, paid: false };
    writeIndex(index);
    return publicOrder(order);
  }

  function loadOrder(id) {
    const safe = String(id || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath = path.join(ordersDir, `${safe}.json`);
    if (!safe || !fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  function saveOrder(order) {
    writeJson(path.join(ordersDir, `${order.id}.json`), order);
    const index = readIndex();
    index.orders[order.id] = { grantToken: order.grantToken, offerId: order.offerId, paid: order.paid === true };
    writeIndex(index);
    return order;
  }

  function publicOrder(order) {
    if (!order) return null;
    return {
      id: order.id,
      offerId: order.offerId,
      kind: order.kind,
      status: order.status,
      paid: order.paid === true,
      paidAt: order.paidAt || "",
      grantToken: order.paid ? order.grantToken : "",
      fulfillment: order.fulfillment,
      cover: order.cover || "",
      shareToken: order.shareToken || "",
      contactEmail: order.contact?.email || "",
      deliveryEmail: order.paid === true ? (order.deliveryEmail || "") : "",
      emailSent: order.paid === true && Boolean(order.emailSentAt),
      shipping: order.shipping,
      createdAt: order.createdAt
    };
  }

  function attachStripeSession(orderId, sessionId) {
    const order = loadOrder(orderId);
    if (!order) return null;
    order.stripeSessionId = stripeObjectId(sessionId, "cs");
    order.status = "awaiting_payment";
    return publicOrder(saveOrder(order));
  }

  function markOrderPaid(orderId, { sessionId, grantToken } = {}) {
    const order = loadOrder(orderId);
    if (!order) return null;
    if (grantToken && grantToken !== order.grantToken) return null;
    if (sessionId && order.stripeSessionId && order.stripeSessionId !== sessionId) return null;
    order.paid = true;
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    if (sessionId) order.stripeSessionId = sessionId;
    return publicOrder(saveOrder(order));
  }

  function getEntitlement({ orderId, grantToken, sessionId }) {
    const order = loadOrder(orderId);
    if (!order) return { paid: false, reason: "order_not_found" };
    if (grantToken && grantToken !== order.grantToken) return { paid: false, reason: "invalid_grant" };
    if (sessionId && order.stripeSessionId && order.stripeSessionId !== sessionId) return { paid: false, reason: "session_mismatch" };
    return {
      paid: order.paid === true,
      order: publicOrder(order),
      reason: order.paid === true ? "server_confirmed" : "awaiting_payment"
    };
  }

  function paidOrderForDownload(orderId, grantToken) {
    if (!grantToken) return null;
    const entitlement = getEntitlement({ orderId, grantToken });
    if (!entitlement.paid) return null;
    return loadOrder(orderId);
  }

  function isDeliveryEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function saveDeliveryEmail(orderId, grantToken, email) {
    const order = paidOrderForDownload(orderId, grantToken);
    if (!order) return null;
    if (order.kind !== "digital") {
      throw Object.assign(new Error("This paid order is a manual print request, not an emailed PDF."), { statusCode: 400, code: "not_digital" });
    }
    const cleaned = String(email || "").trim().slice(0, 120);
    if (!isDeliveryEmail(cleaned)) {
      throw Object.assign(new Error("A delivery email is required before the official PDF can be sent."), { statusCode: 400, code: "delivery_email_required" });
    }
    order.deliveryEmail = cleaned;
    order.deliveryEmailUpdatedAt = new Date().toISOString();
    return publicOrder(saveOrder(order));
  }

  function markDeliveryEmailSent(orderId) {
    const order = loadOrder(orderId);
    if (!order || order.paid !== true || !order.deliveryEmail) return null;
    order.emailSentAt = new Date().toISOString();
    order.emailSendCount = Number(order.emailSendCount || 0) + 1;
    return saveOrder(order);
  }

  return {
    MAX_PAGES,
    SHARE_TTL_MS,
    attachStripeSession,
    createOrder,
    createShare,
    getEntitlement,
    getShareByCode,
    getShareByToken,
    listShareIndex,
    loadOrder,
    markDeliveryEmailSent,
    markOrderPaid,
    paidOrderForDownload,
    publicOrder,
    saveDeliveryEmail,
    publicShare
  };
}

module.exports = { createFamilyBookStore, MAX_PAGES, SHARE_TTL_MS: 60 * 24 * 60 * 60 * 1000 };
