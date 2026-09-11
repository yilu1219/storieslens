(() => {
  "use strict";

  const MAX_DIMENSION = 1800;
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

  async function removeMetadata(file) {
    if (!file || !ALLOWED_TYPES.has(file.type)) throw new Error("invalid_image");
    const { image, url } = await loadImage(file);
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
      return { dataUrl, type: dataUrl.startsWith("data:image/webp") ? "image/webp" : "image/png", width, height, metadataRemoved: true };
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

  window.StoriesLensArtworkSafety = { processArtwork, removeMetadata, reviewSanitizedArtwork };
})();
