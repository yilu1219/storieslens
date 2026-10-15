function safeHttpHeader(value, fallback = "") {
  const text = String(value || "").trim();
  return /^[\x20-\x7e]*$/.test(text) ? text : fallback;
}

module.exports = { safeHttpHeader };
