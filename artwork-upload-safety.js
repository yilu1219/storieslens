(() => {
  "use strict";

  const MAX_DIMENSION = 1800;
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
  const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);
  const HEIC_CONVERTER_SRC = "vendor/heic2any-0.0.4.min.js";
  let heicConverterPromise = null;

  const fileExtensionMatches = (file, pattern) => pattern.test(String(file?.name || ""));
  const isHeicFile = (file) => Boolean(file) && (HEIC_TYPES.has(String(file.type || "").toLowerCase()) || fileExtensionMatches(file, /\.(heic|heif)$/i));
  const isSupportedImage = (file) => Boolean(file) && (ALLOWED_TYPES.has(String(file.type || "").toLowerCase()) || isHeicFile(file) || fileExtensionMatches(file, /\.(jpe?g|png|webp|avif|gif)$/i));

  function ensureHeicConverter() {
    if (typeof window.heic2any === "function") return Promise.resolve(window.heic2any);
    if (heicConverterPromise) return heicConverterPromise;
    heicConverterPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(HEIC_CONVERTER_SRC, document.baseURI).href;
      script.async = true;
      script.dataset.heicConverter = "heic2any";
      script.onload = () => typeof window.heic2any === "function" ? resolve(window.heic2any) : reject(new Error("heic_conversion_unavailable"));
      script.onerror = () => reject(new Error("heic_conversion_unavailable"));
      document.head.append(script);
    }).catch((error) => {
      heicConverterPromise = null;
      throw error;
    });
    return heicConverterPromise;
  }

  async function convertHeic(file) {
    const heic2any = await ensureHeicConverter();
    try {
      const conversion = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      const jpeg = Array.isArray(conversion) ? conversion[0] : conversion;
      if (!(jpeg instanceof Blob)) throw new Error("heic_conversion_failed");
      return jpeg;
    } catch (error) {
      const conversionError = new Error("heic_conversion_failed");
      conversionError.cause = error;
      throw conversionError;
    }
  }

  const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("heic_read_failed"));
    reader.readAsDataURL(file);
  });

  async function convertHeicOnServer(file) {
    const rawDataUrl = await readAsDataUrl(file);
    const mime = /^data:image\/(?:heic|heif|heic-sequence|heif-sequence);base64,/i.test(rawDataUrl)
      ? rawDataUrl
      : rawDataUrl.replace(/^data:[^;,]*;base64,/i, "data:image/heic;base64,");
    const response = await fetch("/api/convert-heic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: mime })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !/^data:image\/jpeg;base64,/i.test(String(result.imageDataUrl || ""))) {
      const error = new Error(result.reasonCode || "heic_server_conversion_failed");
      error.reasonCode = result.reasonCode || "heic_server_conversion_failed";
      throw error;
    }
    const converted = await fetch(result.imageDataUrl).then((item) => item.blob());
    const sanitized = await removeMetadata(new File([converted], `${String(file.name || "photo").replace(/\.(heic|heif)$/i, "")}.jpg`, { type: "image/jpeg" }));
    return { ...sanitized, convertedFromHeic: true, convertedOnServer: true, originalNotUploaded: false, originalNotStored: result.originalDiscarded === true };
  }

  const loadImage = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid_image"));
    };
    image.src = url;
  });

  async function removeMetadata(file, options = {}) {
    if (!isSupportedImage(file)) throw new Error("invalid_image");
    const convertedFromHeic = isHeicFile(file);
    let preparedFile = file;
    let loaded;
    if (convertedFromHeic) {
      try {
        loaded = await loadImage(file);
      } catch (_nativeDecodeError) {
        try {
          preparedFile = await convertHeic(file);
        } catch (conversionError) {
          if (options.allowServerFallback === false) throw conversionError;
          return convertHeicOnServer(file);
        }
      }
    }
    const { image, url } = loaded || await loadImage(preparedFile);
    try {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("processing_unavailable");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/webp", 0.86);
      return {
        dataUrl,
        type: dataUrl.startsWith("data:image/webp") ? "image/webp" : "image/png",
        width,
        height,
        metadataRemoved: true,
        convertedFromHeic,
        originalNotUploaded: true
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function reviewSanitizedArtwork(dataUrl) {
    const response = await fetch("/api/review-artwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: dataUrl, metadataRemoved: true })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.approved) {
      const error = new Error(result.reasonCode || "review_unavailable");
      error.reasonCode = result.reasonCode || "review_unavailable";
      throw error;
    }
    return result;
  }

  async function processArtwork(file) {
    const sanitized = await removeMetadata(file);
    const review = await reviewSanitizedArtwork(sanitized.dataUrl);
    return { ...sanitized, review };
  }

  async function processArtworkLocalOnly(file) {
    const sanitized = await removeMetadata(file, { allowServerFallback: false });
    const review = await reviewSanitizedArtwork(sanitized.dataUrl);
    return { ...sanitized, review };
  }

  async function processArtworkWithServerFallback(file) {
    if (!isHeicFile(file)) throw new Error("invalid_heic");
    const sanitized = await convertHeicOnServer(file);
    const review = await reviewSanitizedArtwork(sanitized.dataUrl);
    return { ...sanitized, review };
  }

  window.StoriesLensArtworkSafety = { processArtwork, processArtworkLocalOnly, processArtworkWithServerFallback, removeMetadata, reviewSanitizedArtwork, isSupportedImage, isHeicFile, convertHeic, convertHeicOnServer };
})();
