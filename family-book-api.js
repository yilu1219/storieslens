const { buildParentBookPdf } = require("./parent-book-pdf");
const { createFamilyBookStore } = require("./family-book-store");
const { familyCheckoutStatus, entitlementFromQuery, createFamilyCheckoutSession, retrieveStripeCheckoutSession } = require("./family-book-payments");
const { getFamilyBookOffer } = require("./family-book-catalog");
const { inspectParentBookRequest } = require("./parent-book-safety");
const { mailConfigured, sendPaidBookPdf } = require("./family-book-mail");
const { extractScanFromImage, parseImageDataUrl, unavailableMessage } = require("./pdf-craft-extract");

function createFamilyBookApi({ store, sendJson, sendBinary, readJsonBody, consumeRateLimit, publicBaseUrl, env = process.env, fetchImpl = fetch, extractScan } = {}) {
  const books = store || createFamilyBookStore();
  const scan = extractScan || ((image) => extractScanFromImage({ buffer: image.buffer, mimeType: image.mimeType, env }));

  async function officialPdfForOrder(order, body) {
    let pages = [];
    if (order.shareToken) {
      const share = books.getShareByToken(order.shareToken, { includePages: true });
      if (!share?.pages?.length) {
        throw Object.assign(new Error("The saved book for this paid order is no longer available."), { statusCode: 409, code: "book_unavailable" });
      }
      pages = share.pages;
    } else {
      pages = Array.isArray(body.pages) ? body.pages : [];
    }
    const inspection = inspectParentBookRequest({ title: body.title, pages });
    if (inspection.blocked) {
      throw Object.assign(new Error("This photo cannot be used."), { statusCode: 422, reasonCode: inspection.reasonCode });
    }
    return buildParentBookPdf({
      title: body.title || order.offerId,
      childName: body.authorName || body.childName,
      language: body.language || order.locale,
      pages,
      filenameHint: body.title
    });
  }

  function noIndex(response) {
    response.setHeader?.("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  async function handle(request, response, requestUrl) {
    const pathName = requestUrl.pathname;

    if (pathName === "/api/family-book/pricing" && request.method === "GET") {
      sendJson(response, 200, familyCheckoutStatus());
      return true;
    }

    if (pathName === "/api/family-book/extract" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "family-book-extract", limit: 30, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 8_000_000);
        const image = parseImageDataUrl(body.imageDataUrl);
        if (!image) {
          sendJson(response, 400, {
            engine: "pdf-craft",
            status: "uncertain",
            text: "",
            images: [],
            uncertain: true,
            rewritten: false,
            reason: "invalid_image",
            error: "A PNG or JPEG photo is required."
          });
          return true;
        }
        const result = await scan(image);
        const statusCode = result.status === "unavailable" ? 501 : result.status === "ok" ? 200 : 422;
        sendJson(response, statusCode, {
          engine: "pdf-craft",
          status: result.status,
          text: result.text || "",
          images: result.images || [],
          uncertain: result.status !== "ok",
          rewritten: false,
          reason: result.reason,
          error: result.status === "unavailable" ? unavailableMessage(result.reason) : undefined
        });
      } catch (_error) {
        sendJson(response, 422, {
          engine: "pdf-craft",
          status: "uncertain",
          text: "",
          images: [],
          uncertain: true,
          rewritten: false,
          reason: "pdf_craft_failed",
          error: "pdf-craft could not read this photo. The original is still available."
        });
      }
      return true;
    }

    if (pathName === "/api/family-book/shares" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "family-book-share", limit: 20, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 28_000_000);
        const share = books.createShare(body);
        const origin = String(publicBaseUrl || process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "") || "";
        const sharePath = `/book-share?t=${encodeURIComponent(share.token)}`;
        const codePath = `/book-share?c=${encodeURIComponent(share.code)}`;
        sendJson(response, 201, {
          share,
          sharePath,
          codePath,
          shareUrl: origin ? `${origin}${sharePath}` : sharePath,
          codeUrl: origin ? `${origin}${codePath}` : codePath,
          noticeZh: "这是一条私密链接，不会出现在公开目录或搜索结果里。任何拿到链接的人都可以预览这本书。",
          noticeEn: "This is a private link. It is not listed publicly or submitted to search. Anyone with the link can preview the book."
        });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message || "share_failed", reasonCode: error.reasonCode || error.message });
      }
      return true;
    }

    const shareMatch = pathName.match(/^\/api\/family-book\/shares\/([a-f0-9]+)$/i);
    if (shareMatch && request.method === "GET") {
      noIndex(response);
      const share = books.getShareByToken(shareMatch[1], { includePages: true });
      if (!share) {
        sendJson(response, 404, { error: "This private book link was not found or has expired." });
        return true;
      }
      sendJson(response, 200, { share, robots: "noindex" });
      return true;
    }

    const codeMatch = pathName.match(/^\/api\/family-book\/codes\/([A-Z0-9]{6,12})$/i);
    if (codeMatch && request.method === "GET") {
      noIndex(response);
      const share = books.getShareByCode(codeMatch[1], { includePages: true });
      if (!share) {
        sendJson(response, 404, { error: "This private book code was not found or has expired." });
        return true;
      }
      sendJson(response, 200, { share, robots: "noindex" });
      return true;
    }

    if (pathName === "/api/family-book/checkout" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "family-book-checkout", limit: 12, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 40_000);
        const pricing = familyCheckoutStatus();
        if (body.adultConfirmed !== true) {
          sendJson(response, 400, { code: "adult_confirmation_required", error: "An adult must confirm this purchase. Children should not check out.", checkoutConfigured: pricing.checkoutConfigured, paid: false });
          return true;
        }
        const offer = getFamilyBookOffer(body.offerId);
        if (!offer) {
          sendJson(response, 400, { error: "Choose the digital edition, softcover, or premium hardcover.", paid: false });
          return true;
        }
        const order = books.createOrder({
          offerId: offer.id,
          shareToken: body.shareToken,
          contact: body.contact,
          shipping: body.shipping,
          adultConfirmed: body.adultConfirmed,
          locale: body.locale
        });
        if (!pricing.checkoutConfigured) {
          sendJson(response, 503, {
            code: "STRIPE_NOT_CONFIGURED",
            error: pricing.noticeEn,
            errorZh: pricing.noticeZh,
            checkoutConfigured: false,
            paid: false,
            order: { ...order, grantToken: "", status: "unavailable" },
            prices: pricing.offers
          });
          return true;
        }
        const session = await createFamilyCheckoutSession({
          order,
          offer,
          successPath: body.returnPath || "/parent-book",
          cancelPath: body.cancelPath || body.returnPath || "/parent-book"
        });
        books.attachStripeSession(order.id, session.id);
        sendJson(response, 201, { checkoutUrl: session.url, sessionId: session.id, orderId: order.id, checkoutConfigured: true, paid: false });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { code: error.code || error.reasonCode || "checkout_failed", error: error.message || "checkout_failed", paid: false, checkoutConfigured: familyCheckoutStatus().checkoutConfigured });
      }
      return true;
    }

    if (pathName === "/api/family-book/entitlement" && request.method === "GET") {
      const claimed = entitlementFromQuery(requestUrl.searchParams);
      const orderId = String(requestUrl.searchParams.get("order") || requestUrl.searchParams.get("orderId") || "");
      const grantToken = String(requestUrl.searchParams.get("grant") || "");
      const sessionId = claimed.sessionId;
      if (!orderId && !sessionId) {
        sendJson(response, 200, { paid: false, claimedByPage: claimed.claimedByPage, reason: claimed.reason, checkoutConfigured: familyCheckoutStatus().checkoutConfigured });
        return true;
      }
      let entitlement = orderId ? books.getEntitlement({ orderId, grantToken, sessionId }) : { paid: false, reason: "order_required" };
      if (!entitlement.paid && sessionId) {
        try {
          const session = await retrieveStripeCheckoutSession({ sessionId });
          if (session.paid && session.orderId) {
            books.attachStripeSession(session.orderId, session.id);
            entitlement = books.markOrderPaid(session.orderId, { sessionId: session.id }) 
              ? books.getEntitlement({ orderId: session.orderId })
              : entitlement;
          }
        } catch (error) {
          sendJson(response, error.statusCode === 503 ? 200 : (error.statusCode || 200), {
            paid: false,
            claimedByPage: claimed.claimedByPage,
            reason: error.code || entitlement.reason || "unverified",
            checkoutConfigured: familyCheckoutStatus().checkoutConfigured,
            error: error.statusCode === 503 ? undefined : error.message
          });
          return true;
        }
      }
      sendJson(response, 200, {
        paid: entitlement.paid === true,
        claimedByPage: claimed.claimedByPage,
        reason: entitlement.paid ? "server_confirmed" : (entitlement.reason || claimed.reason),
        order: entitlement.order || null,
        checkoutConfigured: familyCheckoutStatus().checkoutConfigured
      });
      return true;
    }

    if (pathName === "/api/family-book/download" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "family-book-download", limit: 20, windowMs: 60 * 60 * 1000 })) return true;
      try {
        const body = await readJsonBody(request, 28_000_000);
        const order = books.paidOrderForDownload(body.orderId, body.grantToken);
        if (!order) {
          sendJson(response, 402, { paid: false, sent: false, error: "This download is not unlocked. A success page is not proof of payment." });
          return true;
        }
        if (order.kind !== "digital") {
          sendJson(response, 400, { error: "This paid order is a manual print request, not a digital download." });
          return true;
        }
        if (!order.deliveryEmail) {
          sendJson(response, 409, {
            paid: true,
            sent: false,
            code: "delivery_email_required",
            error: "Confirm a delivery email before downloading the official PDF. A success page does not send the file.",
            errorZh: "请先确认接收邮箱，再下载正式 PDF。成功页不会发信。"
          });
          return true;
        }
        const result = await officialPdfForOrder(order, body);
        sendBinary(response, {
          buffer: result.buffer,
          contentType: "application/pdf",
          filename: result.filename,
          fallbackName: "storieslens-book.pdf"
        });
      } catch (error) {
        sendJson(response, error.statusCode || 400, { error: error.message || "download_failed", paid: false, code: error.code || error.reasonCode });
      }
      return true;
    }

    if (pathName === "/api/family-book/email" && request.method === "POST") {
      if (consumeRateLimit && !consumeRateLimit(request, response, { bucket: "family-book-email", limit: 8, windowMs: 60 * 60 * 1000 })) return true;
      let emailSaved = false;
      let paidOrderId = "";
      try {
        const body = await readJsonBody(request, 28_000_000);
        const order = books.paidOrderForDownload(body.orderId, body.grantToken);
        if (!order) {
          sendJson(response, 402, {
            paid: false,
            sent: false,
            emailSaved: false,
            error: "The official PDF is not emailed until the server confirms payment. A success page or query string is not proof."
          });
          return true;
        }
        paidOrderId = order.id;
        const saved = books.saveDeliveryEmail(order.id, body.grantToken, body.email);
        emailSaved = true;
        if (!mailConfigured(env)) {
          sendJson(response, 503, {
            paid: true,
            sent: false,
            emailSaved: true,
            code: "EMAIL_NOT_CONFIGURED",
            deliveryEmail: saved.deliveryEmail,
            error: "Email delivery is not configured. Payment is confirmed and the address is saved, but the PDF was not sent.",
            errorZh: "付款已确认，邮箱也已保存。服务器还没接通发信，正式 PDF 这次没有发出。"
          });
          return true;
        }
        const latest = books.loadOrder(order.id);
        const result = await officialPdfForOrder(latest, body);
        await sendPaidBookPdf({
          env,
          fetchImpl,
          to: latest.deliveryEmail,
          filename: result.filename,
          pdfBuffer: result.buffer,
          title: body.title || latest.offerId,
          orderId: latest.id,
          attempt: Number(latest.emailSendCount || 0) + 1
        });
        books.markDeliveryEmailSent(latest.id);
        sendJson(response, 200, {
          paid: true,
          sent: true,
          emailSaved: true,
          deliveryEmail: latest.deliveryEmail
        });
      } catch (error) {
        if (!emailSaved && paidOrderId) emailSaved = Boolean(books.loadOrder(paidOrderId)?.deliveryEmail);
        sendJson(response, error.statusCode || 400, {
          paid: Boolean(paidOrderId),
          sent: false,
          emailSaved,
          code: error.code || error.reasonCode || "email_failed",
          error: error.message || "email_failed"
        });
      }
      return true;
    }

    return false;
  }

  return { handle, store: books };
}

module.exports = { createFamilyBookApi };
