(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StoriesLensPreviewWatermark = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MARK_RATIO = 0.16;
  const OPACITY = 0.32;

  function tileWatermarkPlacements(pageWidth, pageHeight) {
    const width = Math.max(1, Number(pageWidth) || 1);
    const height = Math.max(1, Number(pageHeight) || 1);
    const size = Math.max(12, Math.round(width * MARK_RATIO));
    const placements = [];
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) placements.push({ x, y, size });
    }
    return placements;
  }

  function paintTiledWatermark(context, logo, pageWidth, pageHeight) {
    const tiles = tileWatermarkPlacements(pageWidth, pageHeight);
    context.save();
    context.globalAlpha = OPACITY;
    tiles.forEach((tile) => context.drawImage(logo, tile.x, tile.y, tile.size, tile.size));
    context.restore();
    return tiles;
  }

  return { MARK_RATIO, OPACITY, paintTiledWatermark, tileWatermarkPlacements };
});
