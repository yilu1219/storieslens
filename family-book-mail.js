function mailConfigured(env = process.env) {
  return Boolean(String(env.RESEND_API_KEY || "").trim() && String(env.AUTH_EMAIL_FROM || "").trim());
}

function resendEndpoint(env = process.env) {
  const raw = String(env.RESEND_API_URL || "https://api.resend.com/emails").trim() || "https://api.resend.com/emails";
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw Object.assign(new Error("Email delivery is not configured."), { statusCode: 503, code: "EMAIL_NOT_CONFIGURED" });
  }
  const localTest = env.NODE_ENV === "test" && url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname);
  if (!localTest && (url.protocol !== "https:" || url.hostname !== "api.resend.com")) {
    throw Object.assign(new Error("Email delivery is not configured."), { statusCode: 503, code: "EMAIL_NOT_CONFIGURED" });
  }
  return url.toString();
}

function safeLine(value, max) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function escapeHtml(value) {
  return safeLine(value, 80).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[ch]));
}

async function sendPaidBookPdf({ env = process.env, to, filename, pdfBuffer, title, orderId, attempt, fetchImpl = fetch } = {}) {
  if (!mailConfigured(env)) {
    throw Object.assign(new Error("Email delivery is not configured. Payment stays confirmed and the address is saved, but the PDF was not sent."), {
      statusCode: 503,
      code: "EMAIL_NOT_CONFIGURED"
    });
  }
  const endpoint = resendEndpoint(env);
  const from = safeLine(env.AUTH_EMAIL_FROM, 320);
  const replyTo = safeLine(env.AUTH_EMAIL_REPLY_TO, 320);
  const bookTitle = safeLine(title, 80) || "StoriesLens";
  const bookTitleHtml = escapeHtml(bookTitle);
  const fileName = safeLine(filename, 120) || "storieslens-book.pdf";
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${String(env.RESEND_API_KEY).trim()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `storieslens-family-pdf-${safeLine(orderId, 80)}-${Number(attempt) || 1}`
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your StoriesLens book PDF · ${bookTitle}`,
      text: [
        `Your official StoriesLens A5 PDF for “${bookTitle}” is attached.`,
        "This file is sent only after the server confirmed your payment. A checkout success page is not what triggered this email.",
        "",
        `《${bookTitle}》的正式 A5 PDF 在附件中。`,
        "这封邮件只在服务器确认付款、且你确认了接收邮箱之后发出。结账成功页本身不会发信。"
      ].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;color:#102824;line-height:1.6;max-width:640px"><p>Your official StoriesLens A5 PDF for <strong>${bookTitleHtml}</strong> is attached.</p><p>This file is sent only after the server confirmed your payment.</p><hr style="border:0;border-top:1px solid #d9e3dc;margin:24px 0"><p>《${bookTitleHtml}》的正式 A5 PDF 在附件中。这封邮件只在服务器确认付款、且你确认了接收邮箱之后发出。</p></div>`,
      attachments: [{ filename: fileName, content: Buffer.from(pdfBuffer).toString("base64") }],
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });
  if (!response.ok) {
    throw Object.assign(new Error("The paid PDF could not be emailed. The address is saved; the file was not sent."), {
      statusCode: 502,
      code: "EMAIL_SEND_FAILED"
    });
  }
  return { sent: true, provider: "resend" };
}

module.exports = { mailConfigured, sendPaidBookPdf };
