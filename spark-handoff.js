(() => {
  const DB_NAME = "storieslens-device";
  const STORE_NAME = "creative-handoffs";
  const SPARK_KEY = "homepage-spark";
  const SESSION_KEY = "storieslens_home_spark";
  const MAX_AGE_MS = 24 * 60 * 60 * 1000;

  const openDatabase = () => new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("indexeddb_unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("indexeddb_open_failed"));
  });

  const useStore = async (mode, action) => {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = action(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("indexeddb_request_failed"));
      });
    } finally {
      database.close();
    }
  };

  const validSpark = (spark) => {
    if (!spark || typeof spark !== "object") return null;
    const createdAt = Date.parse(spark.createdAt || "");
    if (Number.isFinite(createdAt) && Date.now() - createdAt > MAX_AGE_MS) return null;
    return spark;
  };

  const readSessionFallback = () => {
    try {
      return validSpark(JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"));
    } catch (_error) {
      return null;
    }
  };

  window.StoriesLensSparkHandoff = {
    async save(spark) {
      const payload = { ...spark, createdAt: spark.createdAt || new Date().toISOString() };
      let savedToDeviceDatabase = false;
      try {
        await useStore("readwrite", (store) => store.put(payload, SPARK_KEY));
        savedToDeviceDatabase = true;
      } catch (_error) {
        // The session fallback below still supports browsers that disable IndexedDB.
      }
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      } catch (_error) {
        // Large mobile images may exceed sessionStorage. IndexedDB remains the primary handoff.
      }
      if (!savedToDeviceDatabase && !readSessionFallback()) throw new Error("spark_storage_unavailable");
      return payload;
    },

    async load() {
      try {
        const stored = validSpark(await useStore("readonly", (store) => store.get(SPARK_KEY)));
        if (stored) return stored;
      } catch (_error) {
        // Fall through to the same-tab session copy.
      }
      return readSessionFallback();
    },

    async clear() {
      try { sessionStorage.removeItem(SESSION_KEY); } catch (_error) { /* no-op */ }
      try { await useStore("readwrite", (store) => store.delete(SPARK_KEY)); } catch (_error) { /* no-op */ }
    }
  };
})();
