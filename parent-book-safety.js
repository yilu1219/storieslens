(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StoriesLensParentBookSafety = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const IDENTITY_PATTERNS = [
    /身份证/,
    /护照/,
    /签证页/,
    /驾驶证/,
    /驾照/,
    /行驶证/,
    /户口本/,
    /户口簿/,
    /社保卡/,
    /居住证/,
    /通行证/,
    /军官证/,
    /港澳通行证/,
    /台胞证/,
    /\bpassports?\b/i,
    /\bvisa\s+(?:page|document|stamp|card)s?\b/i,
    /\bnational\s+ids?\b/i,
    /\bid[_-\s]?cards?\b/i,
    /\bdriver'?s?\s*licen[cs]es?\b/i,
    /\bemployee\s+ids?\b/i,
    /\bbirth\s+certificates?\b/i
  ];

  const SCHOOL_ID_PATTERNS = [
    /学生证/,
    /校园卡/,
    /校园证/,
    /一卡通/,
    /\bstudent\s+ids?\b/i,
    /\bschool\s+ids?\b/i,
    /\bschool\s+badge\b/i
  ];

  const CONTACT_PATTERNS = [
    /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/,
    /(?:\+?86[-\s]?)?1[3-9]\d{9}/,
    /\b(?:\+?1[-\s.]?)?(?:\(?\d{3}\)?[-\s.]?)\d{3}[-\s.]\d{4}\b/,
    /\b(?:wechat|微信|whatsapp|telegram)\s*[:：]\s*\S+/i,
    /\bqr[\s_-]*codes?\b/i,
    /二维码/
  ];

  const ALLOWED_REASONS = new Set(["approved", "not_artwork", "real_person", "personal_name", "personal_photograph"]);

  function firstMatch(patterns, value) {
    return patterns.some((pattern) => pattern.test(value));
  }

  function inspectParentBookText(value) {
    const text = String(value || "");
    if (!text.trim()) return { blocked: false, reasonCode: "approved" };
    if (firstMatch(IDENTITY_PATTERNS, text)) return { blocked: true, reasonCode: "identity_document" };
    if (firstMatch(SCHOOL_ID_PATTERNS, text)) return { blocked: true, reasonCode: "school_information" };
    if (firstMatch(CONTACT_PATTERNS, text)) return { blocked: true, reasonCode: "contact_information" };
    return { blocked: false, reasonCode: "approved" };
  }

  function inspectParentBookUpload({ filename, caption, title, childName, reasonCode } = {}) {
    if (reasonCode && !ALLOWED_REASONS.has(String(reasonCode)) && ["identity_document", "school_information", "contact_information", "unsafe_content"].includes(String(reasonCode))) {
      return { blocked: true, reasonCode: String(reasonCode) };
    }
    const fields = [filename, caption, title, childName];
    for (const field of fields) {
      const result = inspectParentBookText(field);
      if (result.blocked) return result;
    }
    return { blocked: false, reasonCode: "approved" };
  }

  function inspectParentBookRequest(body = {}) {
    const bookCheck = inspectParentBookUpload({
      title: body.title,
      childName: body.childName
    });
    if (bookCheck.blocked) return bookCheck;
    const pages = Array.isArray(body.pages) ? body.pages : [];
    for (const page of pages) {
      const result = inspectParentBookUpload({
        filename: page?.filename,
        caption: page?.caption,
        title: body.title,
        childName: body.childName
      });
      if (result.blocked) return result;
    }
    return { blocked: false, reasonCode: "approved" };
  }

  return {
    inspectParentBookRequest,
    inspectParentBookText,
    inspectParentBookUpload
  };
});
