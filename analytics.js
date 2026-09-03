(() => {
  "use strict";

  const EVENTS_KEY = "storieslens_product_events_v1";
  const SESSION_KEY = "storieslens_anonymous_session_v1";
  const MAX_EVENTS = 500;

  const sessionId = (() => {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  })();

  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const track = (name, properties = {}) => {
    if (!name) return;
    const safeProperties = Object.fromEntries(
      Object.entries(properties)
        .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
        .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : value])
    );
    const events = read();
    events.push({
      name: String(name).slice(0, 60),
      at: new Date().toISOString(),
      sessionId,
      page: location.pathname.split("/").pop() || "index.html",
      properties: safeProperties
    });
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  };

  window.StoriesLensAnalytics = {
    track,
    read,
    clear: () => localStorage.removeItem(EVENTS_KEY),
    storageKey: EVENTS_KEY
  };
})();
