(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StoriesLensArtworkPrepare = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PAPER = Object.freeze([0xf6, 0xf0, 0xe4]);
  const PAPER_HEX = "#f6f0e4";
  const MANUSCRIPT_NAME = /手稿|草稿|原稿|手写|manuscript|handwrit|draft/i;
  const PRINT_DPI = 300;
  const TRIM_WIDTH_MM = 148;
  const TRIM_HEIGHT_MM = 210;
  const BLEED_MM = 3;
  const SAFE_MM = 8;
  const GUTTER_MM = 5;
  const PAGE_WIDTH_MM = TRIM_WIDTH_MM + BLEED_MM * 2;
  const PAGE_HEIGHT_MM = TRIM_HEIGHT_MM + BLEED_MM * 2;
  const MM_TO_PT = 72 / 25.4;
  const PAGE_WIDTH_PX = Math.round(PAGE_WIDTH_MM / 25.4 * PRINT_DPI);
  const PAGE_HEIGHT_PX = Math.round(PAGE_HEIGHT_MM / 25.4 * PRINT_DPI);
  const SCAN_MAX_EDGE = PAGE_HEIGHT_PX;
  const CAPTION_BAND_MM = 32;
  const CAPTION_SIZE_PT = 11;
  const CAPTION_LEADING = 1.35;
  const COVER_BAND_MM = 36;
  const TRIM_WIDTH_PT = TRIM_WIDTH_MM * MM_TO_PT;
  const TRIM_HEIGHT_PT = TRIM_HEIGHT_MM * MM_TO_PT;
  const BLEED_WIDTH_PT = PAGE_WIDTH_MM * MM_TO_PT;
  const BLEED_HEIGHT_PT = PAGE_HEIGHT_MM * MM_TO_PT;
  const BLEED_PT = BLEED_MM * MM_TO_PT;

  function toUint8(rgba, width, height) {
    const length = width * height * 4;
    if (rgba instanceof Uint8ClampedArray && rgba.length === length) return rgba;
    const out = new Uint8ClampedArray(length);
    for (let index = 0; index < length; index += 1) out[index] = rgba[index] || 0;
    return out;
  }

  function cloneBuffer(rgba) {
    return new Uint8ClampedArray(rgba);
  }

  function median(values) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function sampleBorder(rgba, width, height) {
    const bands = Math.max(1, Math.min(3, Math.floor(Math.min(width, height) * 0.04)));
    const reds = [];
    const greens = [];
    const blues = [];
    const push = (x, y) => {
      const index = (y * width + x) * 4;
      reds.push(rgba[index]);
      greens.push(rgba[index + 1]);
      blues.push(rgba[index + 2]);
    };
    for (let y = 0; y < height; y += 1) {
      for (let band = 0; band < bands; band += 1) {
        push(band, y);
        push(width - 1 - band, y);
      }
    }
    for (let x = bands; x < width - bands; x += 1) {
      for (let band = 0; band < bands; band += 1) {
        push(x, band);
        push(x, height - 1 - band);
      }
    }
    const med = [median(reds), median(greens), median(blues)];
    const mad = [0, 1, 2].map((channel) => {
      const source = channel === 0 ? reds : channel === 1 ? greens : blues;
      return median(source.map((value) => Math.abs(value - med[channel])));
    });
    let paperCount = 0;
    for (let index = 0; index < reds.length; index += 1) {
      if (isPaperLike(reds[index], greens[index], blues[index])) paperCount += 1;
    }
    return { med, mad, paperRatio: paperCount / reds.length, count: reds.length };
  }

  function isPaperLike(red, green, blue) {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    return luminance >= 214 && (max - min) <= 34;
  }

  function hasMeaningfulAlpha(rgba) {
    let transparent = 0;
    const pixels = rgba.length / 4;
    for (let index = 3; index < rgba.length; index += 4) {
      if (rgba[index] < 16) transparent += 1;
    }
    return transparent / pixels > 0.02;
  }

  function isCleanScan(rgba, width, height) {
    const border = sampleBorder(rgba, width, height);
    return isPaperLike(border.med[0], border.med[1], border.med[2]) && border.paperRatio >= 0.72;
  }

  function matchLimit(mad, retry) {
    const base = Math.max(18, Math.min(48, mad * 3.2 + 12));
    return retry ? Math.min(68, base * 1.35) : base;
  }

  function analyzeForeground(rgba, width, height, options) {
    const retry = options.retry === true;
    const border = sampleBorder(rgba, width, height);
    const limits = border.mad.map((mad) => matchLimit(mad, retry));
    const total = width * height;
    const backgroundLike = new Uint8Array(total);
    for (let pixel = 0; pixel < total; pixel += 1) {
      const index = pixel * 4;
      if (Math.abs(rgba[index] - border.med[0]) <= limits[0]
        && Math.abs(rgba[index + 1] - border.med[1]) <= limits[1]
        && Math.abs(rgba[index + 2] - border.med[2]) <= limits[2]) {
        backgroundLike[pixel] = 1;
      }
    }

    const background = new Uint8Array(total);
    const queueX = new Int32Array(total);
    const queueY = new Int32Array(total);
    let head = 0;
    let tail = 0;
    const seed = (x, y) => {
      const pixel = y * width + x;
      if (background[pixel] || !backgroundLike[pixel]) return;
      background[pixel] = 1;
      queueX[tail] = x;
      queueY[tail] = y;
      tail += 1;
    };
    for (let x = 0; x < width; x += 1) {
      seed(x, 0);
      seed(x, height - 1);
    }
    for (let y = 0; y < height; y += 1) {
      seed(0, y);
      seed(width - 1, y);
    }
    while (head < tail) {
      const x = queueX[head];
      const y = queueY[head];
      head += 1;
      if (x > 0) seed(x - 1, y);
      if (x + 1 < width) seed(x + 1, y);
      if (y > 0) seed(x, y - 1);
      if (y + 1 < height) seed(x, y + 1);
    }

    const labels = new Int32Array(total);
    const components = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (background[start] || labels[start]) continue;
        const id = components.length + 1;
        let scan = 0;
        queueX[0] = x;
        queueY[0] = y;
        tail = 1;
        labels[start] = id;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let area = 0;
        let redSum = 0;
        let greenSum = 0;
        let blueSum = 0;
        while (scan < tail) {
          const cx = queueX[scan];
          const cy = queueY[scan];
          scan += 1;
          area += 1;
          const offset = (cy * width + cx) * 4;
          redSum += rgba[offset];
          greenSum += rgba[offset + 1];
          blueSum += rgba[offset + 2];
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          const next = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
          for (let step = 0; step < next.length; step += 1) {
            const nx = next[step][0];
            const ny = next[step][1];
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const pixel = ny * width + nx;
            if (background[pixel] || labels[pixel]) continue;
            labels[pixel] = id;
            queueX[tail] = nx;
            queueY[tail] = ny;
            tail += 1;
          }
        }
        components.push({
          id,
          minX,
          maxX,
          minY,
          maxY,
          area,
          cx: (minX + maxX) / 2,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
          color: [redSum / area, greenSum / area, blueSum / area]
        });
      }
    }

    if (!components.length) {
      return { confidence: 0, background, labels, kept: [], split: null, border };
    }
    const largest = components.reduce((best, item) => Math.max(best, item.area), 0);
    const minArea = Math.max(12, total * 0.03);
    const kept = components.filter((item) => item.area >= minArea && item.area >= largest * 0.18);
    const keptIds = new Set(kept.map((item) => item.id));
    let foreground = 0;
    let redSum = 0;
    let greenSum = 0;
    let blueSum = 0;
    for (let pixel = 0; pixel < total; pixel += 1) {
      if (!keptIds.has(labels[pixel])) continue;
      foreground += 1;
      const offset = pixel * 4;
      redSum += rgba[offset];
      greenSum += rgba[offset + 1];
      blueSum += rgba[offset + 2];
    }
    const fgRatio = foreground / total;
    const removedRatio = 1 - fgRatio;
    const fgColor = foreground ? [redSum / foreground, greenSum / foreground, blueSum / foreground] : border.med;
    const colorDist = Math.hypot(fgColor[0] - border.med[0], fgColor[1] - border.med[1], fgColor[2] - border.med[2]);
    const distMin = retry ? 16 : 26;
    let confidence = 0.85;
    if (fgRatio < 0.05 || fgRatio > 0.93 || colorDist < distMin || removedRatio < 0.04) confidence = 0.2;
    return {
      confidence,
      background,
      labels,
      kept,
      keptIds,
      split: confidence >= 0.45 ? splitPair(kept, width) : null,
      border,
      colorDist,
      fgRatio
    };
  }

  function splitPair(components, width) {
    if (components.length !== 2) return null;
    const ordered = components[0].cx <= components[1].cx ? components : [components[1], components[0]];
    const left = ordered[0];
    const right = ordered[1];
    const gap = right.minX - left.maxX - 1;
    if (gap < Math.max(2, Math.round(width * 0.03))) return null;
    if (left.cx > width * 0.48 || right.cx < width * 0.52) return null;
    const overlapTop = Math.max(left.minY, right.minY);
    const overlapBottom = Math.min(left.maxY, right.maxY);
    const overlap = overlapBottom - overlapTop + 1;
    if (overlap < 0.4 * Math.min(left.height, right.height)) return null;
    const ratio = Math.min(left.area, right.area) / Math.max(left.area, right.area);
    if (ratio < 0.35) return null;
    return { x: left.maxX + 1 + Math.floor(gap / 2) };
  }

  function applyMask(rgba, width, height, analysis) {
    const out = new Uint8ClampedArray(rgba.length);
    for (let pixel = 0; pixel < width * height; pixel += 1) {
      const offset = pixel * 4;
      out[offset] = rgba[offset];
      out[offset + 1] = rgba[offset + 1];
      out[offset + 2] = rgba[offset + 2];
      out[offset + 3] = analysis.keptIds.has(analysis.labels[pixel]) ? 255 : 0;
    }
    return out;
  }

  function crop(rgba, width, x, y, cropWidth, cropHeight) {
    const out = new Uint8ClampedArray(cropWidth * cropHeight * 4);
    for (let row = 0; row < cropHeight; row += 1) {
      const src = ((y + row) * width + x) * 4;
      out.set(rgba.subarray(src, src + cropWidth * 4), row * cropWidth * 4);
    }
    return out;
  }

  function cutoutOnly(rgba, width, height, options) {
    const analysis = analyzeForeground(rgba, width, height, options);
    if (!analysis || analysis.confidence < 0.45 || !analysis.kept.length) return null;
    return applyMask(rgba, width, height, analysis);
  }

  function opaqueResult(rgba) {
    const out = cloneBuffer(rgba);
    for (let index = 3; index < out.length; index += 4) out[index] = 255;
    return out;
  }

  function pageResult(pages, extra) {
    return Object.assign({
      pages,
      split: false,
      keptOriginal: false,
      reason: "cutout",
      confidence: 1
    }, extra);
  }

  function prepareArtwork(rgba, width, height, options) {
    const settings = options || {};
    if (!width || !height || width < 2 || height < 2) {
      const empty = toUint8(rgba || [], Math.max(1, width || 1), Math.max(1, height || 1));
      return pageResult([{ rgba: empty, width: Math.max(1, width || 1), height: Math.max(1, height || 1) }], {
        keptOriginal: true,
        reason: "low_confidence",
        confidence: 0
      });
    }
    const source = toUint8(rgba, width, height);
    if (hasMeaningfulAlpha(source)) {
      return pageResult([{ rgba: cloneBuffer(source), width, height }], {
        keptOriginal: true,
        reason: "already_transparent",
        confidence: 1
      });
    }
    if (isCleanScan(source, width, height)) {
      return pageResult([{ rgba: opaqueResult(source), width, height }], {
        keptOriginal: true,
        reason: "clean_scan",
        confidence: 1
      });
    }
    const analysis = analyzeForeground(source, width, height, settings);
    if (!analysis || analysis.confidence < 0.45) {
      return pageResult([{ rgba: opaqueResult(source), width, height }], {
        keptOriginal: true,
        reason: "low_confidence",
        confidence: analysis ? analysis.confidence : 0
      });
    }
    if (settings.allowSplit !== false && analysis.split) {
      const splitX = analysis.split.x;
      const leftPixels = crop(source, width, 0, 0, splitX, height);
      const rightPixels = crop(source, width, splitX, 0, width - splitX, height);
      const leftCut = cutoutOnly(leftPixels, splitX, height, settings) || crop(applyMask(source, width, height, analysis), width, 0, 0, splitX, height);
      const rightCut = cutoutOnly(rightPixels, width - splitX, height, settings) || crop(applyMask(source, width, height, analysis), width, splitX, 0, width - splitX, height);
      return pageResult([
        { rgba: leftCut, width: splitX, height },
        { rgba: rightCut, width: width - splitX, height }
      ], { split: true, reason: "split", confidence: analysis.confidence });
    }
    return pageResult([{ rgba: applyMask(source, width, height, analysis), width, height }], {
      reason: "cutout",
      confidence: analysis.confidence
    });
  }

  function compositeOntoPaper(rgba, width, height, paper) {
    const ink = paper || PAPER;
    const out = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < out.length; index += 4) {
      const alpha = (rgba[index + 3] || 0) / 255;
      out[index] = Math.round(rgba[index] * alpha + ink[0] * (1 - alpha));
      out[index + 1] = Math.round(rgba[index + 1] * alpha + ink[1] * (1 - alpha));
      out[index + 2] = Math.round(rgba[index + 2] * alpha + ink[2] * (1 - alpha));
      out[index + 3] = 255;
    }
    return out;
  }

  function opaqueBounds(rgba, width, height) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let count = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (rgba[(y * width + x) * 4 + 3] > 16) {
          count += 1;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, count };
  }

  function contentBounds(rgba, width, height) {
    const bounds = opaqueBounds(rgba, width, height);
    if (!bounds) return { x: 0, y: 0, width, height, count: 0 };
    if (bounds.count / (width * height) > 0.97) return { x: 0, y: 0, width, height, count: bounds.count };
    return bounds;
  }

  function fullBleedPlacement(srcWidth, srcHeight, pageWidth, pageHeight) {
    const scale = Math.max(pageWidth / srcWidth, pageHeight / srcHeight);
    const sw = pageWidth / scale;
    const sh = pageHeight / scale;
    return {
      sx: (srcWidth - sw) / 2,
      sy: (srcHeight - sh) / 2,
      sw,
      sh,
      dx: 0,
      dy: 0,
      dw: pageWidth,
      dh: pageHeight,
      scale
    };
  }

  function placementFillsPage(placement, pageWidth, pageHeight) {
    return Boolean(placement)
      && placement.dx <= 0
      && placement.dy <= 0
      && placement.dx + placement.dw >= pageWidth - 0.01
      && placement.dy + placement.dh >= pageHeight - 0.01;
  }

  function paintFullBleed(rgba, width, height, pageWidth, pageHeight, paper) {
    const ink = paper || PAPER;
    const bounds = contentBounds(rgba, width, height);
    const placement = fullBleedPlacement(bounds.width, bounds.height, pageWidth, pageHeight);
    const out = new Uint8ClampedArray(pageWidth * pageHeight * 4);
    for (let y = 0; y < pageHeight; y += 1) {
      for (let x = 0; x < pageWidth; x += 1) {
        const sx = bounds.x + placement.sx + ((x + 0.5) * placement.sw) / pageWidth - 0.5;
        const sy = bounds.y + placement.sy + ((y + 0.5) * placement.sh) / pageHeight - 0.5;
        const sampleX = Math.max(0, Math.min(width - 1, Math.round(sx)));
        const sampleY = Math.max(0, Math.min(height - 1, Math.round(sy)));
        const source = (sampleY * width + sampleX) * 4;
        const alpha = rgba[source + 3] / 255;
        const index = (y * pageWidth + x) * 4;
        out[index] = Math.round(rgba[source] * alpha + ink[0] * (1 - alpha));
        out[index + 1] = Math.round(rgba[source + 1] * alpha + ink[1] * (1 - alpha));
        out[index + 2] = Math.round(rgba[source + 2] * alpha + ink[2] * (1 - alpha));
        out[index + 3] = 255;
      }
    }
    return { rgba: out, width: pageWidth, height: pageHeight, placement, bounds };
  }

  function looksLikeManuscript(name) {
    return MANUSCRIPT_NAME.test(String(name || ""));
  }

  function planBookPages({ photos, coverId, includeAuthor } = {}) {
    const list = Array.isArray(photos) ? photos : [];
    const main = list.filter((photo) => !photo.manuscript);
    const manuscript = list.filter((photo) => photo.manuscript);
    const cover = list.find((photo) => photo.id === coverId) || main[0] || list[0] || null;
    const pages = [];
    if (cover) pages.push({ kind: "cover", photoId: cover.id });
    if (includeAuthor) pages.push({ kind: "author" });
    main.forEach((photo) => pages.push({ kind: "photo", photoId: photo.id }));
    main.forEach((photo) => pages.push({ kind: "manuscript", photoId: photo.id }));
    manuscript.forEach((photo) => pages.push({ kind: "manuscript", photoId: photo.id }));
    return pages;
  }

  function normalizeInteriorStyle(value) {
    return value === "polished" ? "polished" : "original";
  }

  function retainBookEdits(book, style) {
    const source = book && typeof book === "object" ? book : {};
    return {
      interiorStyle: normalizeInteriorStyle(style),
      title: String(source.title || ""),
      author: String(source.author || ""),
      coverId: String(source.coverId || ""),
      coverStyle: source.coverStyle === "typographic" ? "typographic" : "rebuilt",
      photos: (Array.isArray(source.photos) ? source.photos : []).map((photo) => ({ ...photo }))
    };
  }

  function applyInteriorStyleArt(photos) {
    (Array.isArray(photos) ? photos : []).forEach((photo) => {
      if (!photo || photo.artSource === "accepted") return;
      photo.artSource = "style";
    });
    return photos;
  }

  function interiorPageArt({ treatment = "original", scanUrl = "", polishedUrl = "", polishOk = false, artOverrideUrl = "", artSource = "" } = {}) {
    if (artSource === "accepted" && artOverrideUrl) {
      return { url: artOverrideUrl, fallback: false, treatment: "accepted" };
    }
    const style = normalizeInteriorStyle(treatment);
    if (style === "polished" && polishOk && polishedUrl) {
      return { url: polishedUrl, fallback: false, treatment: "polished" };
    }
    return { url: scanUrl || "", fallback: style === "polished", treatment: "original" };
  }

  function storyArtSources({
    manuscript = false,
    treatment = "original",
    scanUrl = "",
    polishedUrl = "",
    polishOk = false,
    artOverrideUrl = "",
    artSource = "",
    artworks = [],
    layersSeparated = false
  } = {}) {
    if (manuscript) return { urls: [], marksUrl: scanUrl || "", separated: false, treatment: "original" };
    const art = interiorPageArt({ treatment, scanUrl, polishedUrl, polishOk, artOverrideUrl, artSource });
    if (art.treatment === "polished" || art.treatment === "accepted") {
      return { urls: art.url ? [art.url] : [], marksUrl: "", separated: Boolean(art.url), treatment: art.treatment };
    }
    const layers = (Array.isArray(artworks) ? artworks : [])
      .map((item) => (typeof item === "string" ? item : item && item.dataUrl))
      .filter((url) => url && url !== scanUrl);
    if (layersSeparated && layers.length) {
      return { urls: layers.slice(0, 4), marksUrl: "", separated: true, treatment: "original" };
    }
    return { urls: [], marksUrl: art.url || scanUrl || "", separated: false, treatment: "original" };
  }

  function coverHeroSource(photo, style) {
    if (!photo) return "";
    if (photo.scanIsolated === false && photo.artSource !== "accepted") return "";
    return interiorPageArt({
      treatment: style,
      scanUrl: photo.scanIsolated === false ? "" : (photo.scanDataUrl || photo.marksDataUrl || ""),
      polishedUrl: photo.polishedDataUrl || "",
      polishOk: photo.polishStatus === "ok",
      artOverrideUrl: photo.artOverrideUrl || "",
      artSource: photo.artSource || ""
    }).url;
  }

  function parentalSignaturePresent(signature) {
    if (!signature || typeof signature !== "object") return false;
    return signature.ink === true && String(signature.dataUrl || "").startsWith("data:image/");
  }

  function consentRecord(signature) {
    return {
      adultName: String(signature?.adultName || "").trim(),
      signedAt: String(signature?.signedAt || ""),
      statement: String(signature?.statement || "")
    };
  }

  function avatarUseDecision({ mode, under18, adultName, signature } = {}) {
    if (mode === "illustrated") {
      return { allowed: true, requiresSignature: false, reason: "illustrated" };
    }
    if (mode !== "photo") {
      return { allowed: false, requiresSignature: false, reason: "no_avatar" };
    }
    if (!under18) {
      return { allowed: true, requiresSignature: false, reason: "adult_portrait" };
    }
    const signed = signature && typeof signature === "object" ? signature : {};
    const name = String(adultName || signed.adultName || "").trim();
    if (!name || !parentalSignaturePresent(signed)) {
      return { allowed: false, requiresSignature: true, reason: "parental_signature_required" };
    }
    return {
      allowed: true,
      requiresSignature: true,
      reason: "parental_signature",
      record: consentRecord({ adultName: name, signedAt: signed.signedAt, statement: signed.statement })
    };
  }

  function boxBlur(rgba, width, height) {
    const out = new Uint8ClampedArray(rgba.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const sx = Math.max(0, Math.min(width - 1, x + dx));
            const sy = Math.max(0, Math.min(height - 1, y + dy));
            const index = (sy * width + sx) * 4;
            red += rgba[index];
            green += rgba[index + 1];
            blue += rgba[index + 2];
            count += 1;
          }
        }
        const index = (y * width + x) * 4;
        out[index] = red / count;
        out[index + 1] = green / count;
        out[index + 2] = blue / count;
        out[index + 3] = rgba[index + 3];
      }
    }
    return out;
  }

  function illustrateAvatar(rgba, width, height) {
    const source = toUint8(rgba, width, height);
    const blur = boxBlur(source, width, height);
    const out = new Uint8ClampedArray(source.length);
    const quantize = (value) => Math.max(0, Math.min(255, Math.round(value / 48) * 48));
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const left = (y * width + Math.max(0, x - 1)) * 4;
        const up = (Math.max(0, y - 1) * width + x) * 4;
        const edge = Math.abs(blur[index] - blur[left]) + Math.abs(blur[index + 1] - blur[up + 1]) + Math.abs(blur[index + 2] - blur[left + 2]);
        let red = quantize(blur[index]);
        let green = quantize(blur[index + 1]);
        let blue = quantize(blur[index + 2]);
        if (edge > 48) {
          red = Math.round(red * 0.3);
          green = Math.round(green * 0.3);
          blue = Math.round(blue * 0.3);
        }
        out[index] = red;
        out[index + 1] = green;
        out[index + 2] = blue;
        out[index + 3] = source[index + 3];
      }
    }
    return out;
  }

  function renderAuthorPreview({ width, height, avatar, avatarWidth, avatarHeight, allowed, paper }) {
    const ink = paper || PAPER;
    const page = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < page.length; index += 4) {
      page[index] = ink[0];
      page[index + 1] = ink[1];
      page[index + 2] = ink[2];
      page[index + 3] = 255;
    }
    if (!(allowed && avatar && avatarWidth && avatarHeight)) return { rgba: page, width, height, shown: false };
    const box = Math.max(1, Math.round(Math.min(width, height) * 0.46));
    const originX = Math.floor((width - box) / 2);
    const originY = 1;
    for (let y = 0; y < box; y += 1) {
      for (let x = 0; x < box; x += 1) {
        const sx = Math.max(0, Math.min(avatarWidth - 1, Math.floor(x * avatarWidth / box)));
        const sy = Math.max(0, Math.min(avatarHeight - 1, Math.floor(y * avatarHeight / box)));
        const source = (sy * avatarWidth + sx) * 4;
        const dest = ((originY + y) * width + originX + x) * 4;
        const alpha = avatar[source + 3] / 255;
        page[dest] = Math.round(avatar[source] * alpha + ink[0] * (1 - alpha));
        page[dest + 1] = Math.round(avatar[source + 1] * alpha + ink[1] * (1 - alpha));
        page[dest + 2] = Math.round(avatar[source + 2] * alpha + ink[2] * (1 - alpha));
        page[dest + 3] = 255;
      }
    }
    return { rgba: page, width, height, shown: true };
  }

  function rgbaToPngDataUrl(rgba, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    const pixels = rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba);
    context.putImageData(new ImageData(pixels, width, height), 0, 0);
    return canvas.toDataURL("image/png");
  }

  function containPlacement(srcWidth, srcHeight, box) {
    const safeWidth = Math.max(1, srcWidth || 1);
    const safeHeight = Math.max(1, srcHeight || 1);
    const scale = Math.min(box.w / safeWidth, box.h / safeHeight);
    const dw = safeWidth * scale;
    const dh = safeHeight * scale;
    return {
      sx: 0,
      sy: 0,
      sw: safeWidth,
      sh: safeHeight,
      dx: box.x + (box.w - dw) / 2,
      dy: box.y + (box.h - dh) / 2,
      dw,
      dh,
      scale,
      fit: "contain"
    };
  }

  function clampUnit(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(1, Math.max(0, number));
  }

  function isContentPixel(red, green, blue) {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    return !(luma >= 214 && (max - min) <= 34);
  }

  function normalizeScanBlocks(blocks) {
    if (!Array.isArray(blocks)) return [];
    const out = [];
    for (const block of blocks) {
      if (!block || typeof block !== "object") continue;
      const rawKind = String(block.kind || "").toLowerCase();
      const kind = rawKind === "image" || rawKind === "figure" ? "image" : rawKind === "text" ? "text" : "";
      if (!kind) continue;
      const source = block.box && typeof block.box === "object" ? block.box : null;
      const box = source ? {
        x: clampUnit(source.x),
        y: clampUnit(source.y),
        w: clampUnit(source.w),
        h: clampUnit(source.h)
      } : null;
      if (box && (box.w <= 0 || box.h <= 0)) continue;
      const text = kind === "text" ? String(block.text || "").trim().slice(0, 2000) : "";
      if (kind === "text" && !text) continue;
      out.push({
        kind,
        text,
        box,
        confidence: clampUnit(block.confidence == null ? 1 : block.confidence)
      });
      if (out.length >= 40) break;
    }
    return out;
  }

  function segmentSheet(rgba, width, height) {
    const empty = { separated: false, artBox: null, textBoxes: [], confidence: 0 };
    if (!width || !height || width < 16 || height < 24) return empty;
    const source = toUint8(rgba, width, height);
    const rowInk = new Float64Array(height);
    const rowColor = new Float64Array(height);
    const rowMinX = new Int32Array(height);
    const rowMaxX = new Int32Array(height);
    rowMinX.fill(width);
    rowMaxX.fill(-1);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const red = source[index];
        const green = source[index + 1];
        const blue = source[index + 2];
        if (!isContentPixel(red, green, blue)) continue;
        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);
        const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        rowInk[y] += 1;
        if ((max - min) > 36 && luma > 70) rowColor[y] += 1;
        if (x < rowMinX[y]) rowMinX[y] = x;
        if (x > rowMaxX[y]) rowMaxX[y] = x;
      }
    }
    const kinds = new Array(height);
    for (let y = 0; y < height; y += 1) {
      const ratio = rowInk[y] / width;
      const colorRatio = rowInk[y] ? rowColor[y] / rowInk[y] : 0;
      if (ratio < 0.02) kinds[y] = "empty";
      else if (colorRatio > 0.28 || ratio > 0.62) kinds[y] = "art";
      else kinds[y] = "text";
    }
    let artTop = -1;
    let artBottom = -1;
    for (let y = 0; y < height; y += 1) {
      if (kinds[y] !== "art") continue;
      if (artTop < 0) artTop = y;
      artBottom = y;
    }
    if (artTop < 0) return empty;
    const textRows = [];
    for (let y = 0; y < height; y += 1) if (kinds[y] === "text") textRows.push(y);
    if (!textRows.length) return empty;
    if (textRows.some((y) => y >= artTop && y <= artBottom)) return empty;
    const above = textRows.every((y) => y < artTop);
    const below = textRows.every((y) => y > artBottom);
    if (!above && !below) return empty;
    const gap = above ? artTop - textRows[textRows.length - 1] - 1 : textRows[0] - artBottom - 1;
    if (gap < Math.max(2, Math.round(height * 0.015))) return empty;
    const artBox = bandBounds(artTop, artBottom + 1);
    if (!artBox || artBox.h < height * 0.12 || artBox.h > height * 0.92 || artBox.w < width * 0.12) return empty;
    const textBoxes = [];
    let start = textRows[0];
    let previous = textRows[0];
    const pushText = (from, to) => {
      const box = bandBounds(from, to);
      if (!box || box.w < width * 0.18 || box.h > height * 0.2) return;
      textBoxes.push(box);
    };
    for (let index = 1; index < textRows.length; index += 1) {
      const y = textRows[index];
      if (y - previous > Math.max(3, Math.round(height * 0.03))) {
        pushText(start, previous + 1);
        start = y;
      }
      previous = y;
    }
    pushText(start, previous + 1);
    if (!textBoxes.length) return empty;
    return { separated: true, artBox, textBoxes, confidence: 0.8 };

    function bandBounds(y0, y1) {
      let minX = width;
      let maxX = -1;
      let minY = y1;
      let maxY = -1;
      for (let y = y0; y < y1; y += 1) {
        if (rowMaxX[y] < 0) continue;
        if (rowMinX[y] < minX) minX = rowMinX[y];
        if (rowMaxX[y] > maxX) maxX = rowMaxX[y];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (maxX < minX || maxY < minY) return null;
      const pad = 1;
      const x = Math.max(0, minX - pad);
      const y = Math.max(0, minY - pad);
      return {
        x,
        y,
        w: Math.min(width, maxX + pad + 1) - x,
        h: Math.min(height, maxY + pad + 1) - y
      };
    }
  }

  function unitBox(box, width, height) {
    if (!box) return null;
    return {
      x: clampUnit(box.x / width),
      y: clampUnit(box.y / height),
      w: clampUnit(box.w / width),
      h: clampUnit(box.h / height)
    };
  }

  function pixelBox(box, width, height) {
    if (!box) return null;
    const x = Math.max(0, Math.min(width - 2, Math.floor(box.x * width)));
    const y = Math.max(0, Math.min(height - 2, Math.floor(box.y * height)));
    const w = Math.max(2, Math.min(width - x, Math.round(box.w * width)));
    const h = Math.max(2, Math.min(height - y, Math.round(box.h * height)));
    if (w >= width * 0.96 && h >= height * 0.92) return null;
    return { x, y, w, h };
  }

  function composeScanLayers({ rgba, width, height, text = "", textStatus = "uncertain", blocks = [], toPng } = {}) {
    const recognized = textStatus === "ok" || textStatus === "parent" ? String(text || "").trim() : "";
    const local = rgba && width && height ? segmentSheet(rgba, width, height) : { separated: false, artBox: null, textBoxes: [], confidence: 0 };
    const normalized = normalizeScanBlocks(blocks).filter((block) => block.kind !== "text" || (recognized && recognized.includes(block.text)));
    const faithful = normalized.filter((block) => block.kind === "text");
    let lines = [];
    if (recognized) {
      lines = faithful.length
        ? faithful.map((block) => ({ text: block.text, confidence: block.confidence, box: block.box }))
        : [{ text: recognized, confidence: 1, box: local.textBoxes && local.textBoxes[0] ? unitBox(local.textBoxes[0], width, height) : null }];
    }
    let artBox = local.separated ? local.artBox : null;
    if (!artBox && recognized) {
      const image = normalized.find((block) => block.kind === "image" && block.box);
      const fromOcr = image ? pixelBox(image.box, width, height) : null;
      if (fromOcr) artBox = fromOcr;
    }
    const artworks = [];
    if (recognized && artBox && rgba && width && height) {
      const cropped = opaqueResult(crop(toUint8(rgba, width, height), width, artBox.x, artBox.y, artBox.w, artBox.h));
      artworks.push({
        rgba: cropped,
        width: artBox.w,
        height: artBox.h,
        dataUrl: typeof toPng === "function" ? toPng(cropped, artBox.w, artBox.h) : "",
        box: artBox.w <= 1 && artBox.h <= 1 ? artBox : unitBox(artBox, width, height)
      });
    }
    return {
      separated: Boolean(recognized && artworks.length),
      artworks,
      lines,
      artBox: artworks.length ? artBox : null,
      confidence: local.confidence || 0,
      handwritingOnArt: !(recognized && artworks.length)
    };
  }

  function layoutWords(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function tidyTypography(text) {
    const original = String(text || "");
    const collapsed = original.replace(/\r\n/g, "\n").split("\n").map((line) => (
      line.replace(/[ \t\u3000]{2,}/g, " ").replace(/^[ \t\u3000]+|[ \t\u3000]+$/g, "")
    )).join("\n").replace(/\n{3,}/g, "\n\n");
    const broken = collapsed.split("\n").map((line) => {
      if (Array.from(line).length < 42) return line;
      return line.replace(/([。！？!?；;])\s*/g, "$1\n").replace(/\n+$/g, "");
    }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!broken || layoutWords(broken) !== layoutWords(original)) return { text: original, changed: false };
    return { text: broken, changed: broken !== original.trim() ? true : broken !== original };
  }

  function wordCore(value) {
    return String(value || "").replace(/[\s\p{P}\p{S}]+/gu, "");
  }

  function punctuationFix(text) {
    const source = String(text || "");
    let next = source.replace(/[ \t\u3000]+([,.;:!?，。！？；：、])/g, "$1");
    next = next.replace(/([。！？；，、])[ \t\u3000]+\1/g, "$1");
    [["“", "”"], ["「", "」"], ["（", "）"]].forEach(([open, close]) => {
      const opens = next.split(open).length - 1;
      const closes = next.split(close).length - 1;
      if (opens === closes + 1) next += close;
    });
    next = next.replace(/\uFFFD/g, "");
    if (!next || wordCore(next) !== wordCore(source)) return { text: source, changed: false };
    return { text: next, changed: next !== source };
  }

  function duplicateWordingFix(text) {
    const source = String(text || "");
    const english = source.match(/\b([A-Za-z]{2,})\s+\1\b/i);
    if (english) {
      return { before: source, after: source.replace(english[0], english[1]) };
    }
    const cjk = source.match(/([\u3400-\u9fff]{2,})\1/);
    if (cjk) return { before: source, after: source.replace(cjk[0], cjk[1]) };
    return null;
  }

  function proofItem({ category, before, after, changed, altersWords, id }) {
    return {
      id: id || `proof-${category}`,
      kind: "proofread",
      category,
      before: String(before ?? ""),
      after: String(after ?? ""),
      changed: changed === true,
      altersWords: altersWords === true,
      accepted: false,
      applied: false
    };
  }

  function proposeProofreading({ text = "", textStatus = "ok", lines = [], edited = false } = {}) {
    if ((textStatus === "uncertain" || textStatus === "unavailable" || textStatus === "restored") && edited !== true) {
      return [proofItem({
        category: "confirm",
        before: "",
        after: "",
        changed: false,
        altersWords: false,
        id: "proof-confirm-unread"
      })];
    }
    const source = String(text || "");
    if (!source.trim()) return [];
    const suggestions = [];
    const tidy = tidyTypography(source);
    if (tidy.changed && wordCore(tidy.text) === wordCore(source)) {
      suggestions.push(proofItem({
        category: "layout",
        before: source,
        after: tidy.text,
        changed: true,
        altersWords: false,
        id: "proof-layout"
      }));
    }
    const punct = punctuationFix(source);
    if (punct.changed) {
      suggestions.push(proofItem({
        category: "punctuation",
        before: source,
        after: punct.text,
        changed: true,
        altersWords: false,
        id: "proof-punctuation"
      }));
    }
    const duplicate = duplicateWordingFix(source);
    if (duplicate && wordCore(duplicate.after) !== wordCore(source)) {
      suggestions.push(proofItem({
        category: "wording",
        before: duplicate.before,
        after: duplicate.after,
        changed: true,
        altersWords: true,
        id: "proof-wording"
      }));
    }
    const seen = new Set();
    (Array.isArray(lines) ? lines : []).forEach((line, index) => {
      const lineText = String(line && line.text || "").trim();
      const score = Number(line && line.confidence);
      if (!lineText || !source.includes(lineText) || seen.has(lineText)) return;
      if (!Number.isFinite(score) || score >= 0.72) return;
      seen.add(lineText);
      suggestions.push(proofItem({
        category: "confirm",
        before: lineText,
        after: lineText,
        changed: false,
        altersWords: false,
        id: `proof-confirm-${index}`
      }));
    });
    return suggestions;
  }

  function proposeAssistantEdit({ kind = "", text = "", layoutTextShare = 0, id = "" } = {}) {
    const proposalId = id || `${kind}-proposal`;
    if (kind === "typography") {
      const tidy = tidyTypography(text);
      return {
        id: proposalId,
        kind,
        before: String(text || ""),
        after: tidy.changed ? tidy.text : String(text || ""),
        changed: tidy.changed === true,
        accepted: false,
        applied: false
      };
    }
    if (kind === "layout") {
      const length = Array.from(String(text || "")).length;
      const share = length > 80 ? 0.46 : length > 24 ? 0.36 : 0.28;
      const before = Number(layoutTextShare) >= 0.26 ? Number(layoutTextShare) : 0.36;
      return {
        id: proposalId,
        kind,
        before,
        after: share,
        changed: Math.abs(share - before) > 0.011,
        accepted: false,
        applied: false
      };
    }
    if (kind === "art") {
      return {
        id: proposalId,
        kind,
        before: "original",
        after: "original",
        imageDataUrl: "",
        changed: false,
        failed: false,
        pending: true,
        accepted: false,
        applied: false
      };
    }
    return null;
  }

  function resolveArtProposal(proposal, result) {
    const base = proposal && proposal.kind === "art" ? proposal : proposeAssistantEdit({ kind: "art" });
    const image = result && result.ok && typeof result.imageDataUrl === "string" ? result.imageDataUrl : "";
    const ready = /^data:image\/(?:png|jpeg|jpg);base64,/i.test(image);
    return {
      ...base,
      kind: "art",
      after: ready ? "cleanup" : "original",
      imageDataUrl: ready ? image : "",
      changed: ready,
      failed: !ready,
      pending: false,
      accepted: false,
      applied: false
    };
  }

  function applyAssistantProposal(photo, proposal) {
    const current = photo && typeof photo === "object" ? photo : {};
    const confirmOnly = proposal && proposal.kind === "proofread" && proposal.category === "confirm" && proposal.changed !== true;
    if (!proposal || proposal.accepted !== true || (proposal.changed !== true && !confirmOnly)) {
      return { photo: current, applied: false, acceptance: null };
    }
    const next = {
      ...current,
      assistantLog: Array.isArray(current.assistantLog) ? current.assistantLog.slice() : []
    };
    if (proposal.kind === "typography" || (proposal.kind === "proofread" && proposal.changed === true)) {
      next.text = String(proposal.after ?? "");
      next.textEdited = true;
      next.textStatus = "parent";
      next.lines = [{ text: next.text, confidence: 1, box: current.lines && current.lines[0] ? current.lines[0].box : null }];
    } else if (proposal.kind === "proofread" && confirmOnly) {
      next.text = current.text || "";
      next.textStatus = current.textStatus;
    } else if (proposal.kind === "layout") {
      const share = Number(proposal.after);
      if (!(share >= 0.26 && share <= 0.48)) return { photo: current, applied: false, acceptance: null };
      next.layoutTextShare = share;
    } else if (proposal.kind === "art" && /^data:image\/(?:png|jpeg|jpg);base64,/i.test(proposal.imageDataUrl || "")) {
      next.artOverrideUrl = proposal.imageDataUrl;
      next.artSource = "accepted";
    } else {
      return { photo: current, applied: false, acceptance: null };
    }
    const acceptance = {
      id: String(proposal.id || `${proposal.kind}-${next.assistantLog.length + 1}`),
      kind: proposal.kind,
      category: proposal.category || "",
      altersWords: proposal.altersWords === true,
      accepted: true
    };
    next.assistantLog.push(acceptance);
    return { photo: next, applied: true, acceptance };
  }

  function dismissAssistantProposal(photo, proposal) {
    return {
      photo: photo && typeof photo === "object" ? photo : {},
      applied: false,
      dismissed: Boolean(proposal),
      proposal: proposal ? { ...proposal, accepted: false, dismissed: true } : null
    };
  }

  function bindBookAssistant(section, api) {
    if (!section || typeof section.querySelector !== "function" || !api) return;
    if (section.getAttribute("data-assist-bound") === "true") return;
    section.setAttribute("data-assist-bound", "true");
    const proposalBox = section.querySelector("[data-assist-proposal]");
    const summary = section.querySelector("[data-assist-summary]");
    const before = section.querySelector("[data-assist-before]");
    const after = section.querySelector("[data-assist-after]");
    const preview = section.querySelector("[data-assist-preview]");
    const accept = section.querySelector("[data-assist-accept]");
    const note = section.querySelector("[data-assist-note]");
    const meta = section.querySelector("[data-assist-meta]");
    let pending = null;
    let proofQueue = [];
    const hide = () => {
      pending = null;
      proofQueue = [];
      if (proposalBox) proposalBox.hidden = true;
      if (note) note.hidden = true;
      if (preview) {
        preview.hidden = true;
        preview.removeAttribute("src");
      }
    };
    const reading = (value, proposal) => {
      const text = proposal && proposal.kind === "layout" && api.shareLabel
        ? api.shareLabel(value)
        : String(value ?? "");
      if (!text && proposal && proposal.category === "confirm" && api.emptyLabel) return api.emptyLabel();
      return text;
    };
    const show = (proposal) => {
      pending = proposal;
      if (!proposalBox) return;
      proposalBox.hidden = false;
      if (summary) summary.textContent = api.label ? api.label(proposal) : proposal.kind;
      if (note) {
        const wording = proposal.altersWords === true;
        const confirm = proposal.category === "confirm";
        note.hidden = !wording && !confirm;
        note.textContent = wording
          ? (api.wordingNote ? api.wordingNote() : "")
          : (confirm && api.confirmNote ? api.confirmNote() : "");
      }
      if (before) {
        before.hidden = proposal.kind === "art";
        const body = reading(proposal.before, proposal);
        before.textContent = api.beforeLabel && proposal.kind !== "art" ? `${api.beforeLabel()}\n${body}` : body;
      }
      if (after) {
        after.hidden = proposal.kind === "art";
        const body = reading(proposal.after, proposal);
        after.textContent = api.afterLabel && proposal.kind !== "art" ? `${api.afterLabel()}\n${body}` : body;
      }
      if (preview) {
        const showArt = proposal.kind === "art" && proposal.imageDataUrl;
        preview.hidden = !showArt;
        if (showArt) preview.src = proposal.imageDataUrl;
      }
      if (accept) accept.hidden = !(proposal.changed === true || proposal.category === "confirm");
      if (meta) meta.textContent = api.pendingLabel ? api.pendingLabel() : "";
    };
    const currentPhoto = () => (api.photo ? api.photo() : null);
    const showNextProof = () => {
      const next = proofQueue.shift();
      if (!next) {
        hide();
        if (meta) meta.textContent = api.proofDoneLabel ? api.proofDoneLabel() : "";
        return;
      }
      show(next);
    };
    section.querySelector("[data-assist-type]")?.addEventListener("click", () => {
      proofQueue = [];
      const photo = currentPhoto();
      if (!photo) return;
      const proposal = proposeAssistantEdit({ kind: "typography", text: api.text(photo), id: `typography-${photo.id || "page"}` });
      proposal.photoId = photo.id;
      if (!proposal.changed) {
        hide();
        if (meta) meta.textContent = api.unchangedLabel ? api.unchangedLabel() : "";
        return;
      }
      show(proposal);
    });
    section.querySelector("[data-assist-layout]")?.addEventListener("click", () => {
      proofQueue = [];
      const photo = currentPhoto();
      if (!photo) return;
      const proposal = proposeAssistantEdit({
        kind: "layout",
        text: api.text(photo),
        layoutTextShare: photo.layoutTextShare || 0,
        id: `layout-${photo.id || "page"}`
      });
      proposal.photoId = photo.id;
      if (!proposal.changed) {
        hide();
        if (meta) meta.textContent = api.unchangedLabel ? api.unchangedLabel() : "";
        return;
      }
      show(proposal);
    });
    section.querySelector("[data-assist-art]")?.addEventListener("click", async () => {
      proofQueue = [];
      const photo = currentPhoto();
      if (!photo) return;
      if (meta && api.workingLabel) meta.textContent = api.workingLabel();
      const base = proposeAssistantEdit({ kind: "art", text: api.text(photo), id: `art-${photo.id || "page"}` });
      let result = { ok: false };
      try {
        result = await api.illustrate(photo);
      } catch (_error) {
        result = { ok: false };
      }
      const proposal = resolveArtProposal(base, result);
      proposal.photoId = photo.id;
      if (!proposal.changed) {
        hide();
        if (meta) meta.textContent = api.artFailedLabel ? api.artFailedLabel() : "";
        return;
      }
      show(proposal);
    });
    section.querySelector("[data-assist-proof]")?.addEventListener("click", () => {
      const photo = currentPhoto();
      if (!photo) return;
      proofQueue = proposeProofreading({
        text: api.text(photo),
        textStatus: photo.textStatus,
        lines: photo.lines,
        edited: photo.textEdited === true
      }).map((item) => ({ ...item, photoId: photo.id }));
      if (!proofQueue.length) {
        hide();
        if (meta) meta.textContent = api.proofClearLabel ? api.proofClearLabel() : "";
        return;
      }
      showNextProof();
    });
    accept?.addEventListener("click", () => {
      if (!pending) return;
      const photo = api.photoById ? api.photoById(pending.photoId) : currentPhoto();
      if (!photo) return;
      const advancing = pending.kind === "proofread" && proofQueue.length > 0;
      const outcome = applyAssistantProposal(photo, { ...pending, accepted: true });
      if (!outcome.applied) {
        if (meta) meta.textContent = api.unchangedLabel ? api.unchangedLabel() : "";
        return;
      }
      if (api.commit) api.commit(outcome.photo);
      if (advancing) {
        showNextProof();
        return;
      }
      hide();
      if (meta && api.acceptedLabel) meta.textContent = api.acceptedLabel();
    });
    section.querySelector("[data-assist-reject]")?.addEventListener("click", () => {
      if (!pending) return;
      const advancing = pending.kind === "proofread" && proofQueue.length > 0;
      dismissAssistantProposal(currentPhoto(), pending);
      if (advancing) {
        showNextProof();
        return;
      }
      hide();
      if (meta && api.dismissedLabel) meta.textContent = api.dismissedLabel();
    });
  }

  function typesetText({ text = "", status = "ok", edited = false, manuscript = false } = {}) {
    if (manuscript) return "";
    if (status === "uncertain" || status === "unavailable" || status === "restored") {
      return edited ? String(text) : "";
    }
    if (status === "ok" || status === "parent") return String(text);
    return "";
  }

  function printSafeFrame(pageWidth, pageHeight, pageNumber = 1) {
    const width = Math.max(1, Number(pageWidth) || 1);
    const height = Math.max(1, Number(pageHeight) || 1);
    const bleedAspect = PAGE_WIDTH_MM / PAGE_HEIGHT_MM;
    const trimAspect = TRIM_WIDTH_MM / TRIM_HEIGHT_MM;
    const aspect = width / height;
    const bleed = Math.abs(aspect - bleedAspect) <= Math.abs(aspect - trimAspect);
    const widthMm = bleed ? PAGE_WIDTH_MM : TRIM_WIDTH_MM;
    const heightMm = bleed ? PAGE_HEIGHT_MM : TRIM_HEIGHT_MM;
    const bleedMm = bleed ? BLEED_MM : 0;
    const pxPerMmX = width / widthMm;
    const pxPerMmY = height / heightMm;
    const number = Math.max(1, Math.round(Number(pageNumber) || 1));
    const gutterLeft = number % 2 === 1;
    const leftMm = bleedMm + SAFE_MM + (gutterLeft ? GUTTER_MM : 0);
    const rightMm = bleedMm + SAFE_MM + (gutterLeft ? 0 : GUTTER_MM);
    const topMm = bleedMm + SAFE_MM;
    const bottomMm = bleedMm + SAFE_MM;
    return {
      x: leftMm * pxPerMmX,
      y: topMm * pxPerMmY,
      w: Math.max(1, width - (leftMm + rightMm) * pxPerMmX),
      h: Math.max(1, height - (topMm + bottomMm) * pxPerMmY),
      pxPerMmX,
      pxPerMmY,
      bleed,
      pageNumber: number
    };
  }

  function captionMetrics(pageHeight) {
    const height = Math.max(1, Number(pageHeight) || 1);
    const fontPx = Math.max(1, CAPTION_SIZE_PT * height / PAGE_HEIGHT_MM * 25.4 / 72);
    return {
      fontPx,
      leadingPx: fontPx * CAPTION_LEADING,
      sizePt: CAPTION_SIZE_PT,
      leading: CAPTION_LEADING
    };
  }

  function selectPagePictures({ artworks = [], marks = null, showText = false, manuscript = false, treatment = "", separated = false } = {}) {
    const figures = (Array.isArray(artworks) ? artworks : []).filter(Boolean);
    const style = treatment === "polished" || treatment === "original" || treatment === "accepted" ? treatment : "";
    if (manuscript || !showText) {
      if (marks) return [marks];
      return figures.slice(0, 1);
    }
    if (style === "polished" || style === "accepted") {
      if (figures.length) return figures.slice(0, 1);
      if (marks) return [marks];
      return [];
    }
    if (separated && figures.length) return figures.slice(0, 4);
    if (style === "original") {
      if (marks) return [marks];
      return figures.slice(0, 1);
    }
    if (figures.length) return figures;
    return marks ? [marks] : [];
  }

  function layoutRebuiltPage({ pageWidth, pageHeight, artworkCount = 0, showText = false, title = "", pageNumber = 1, textShare = 0 } = {}) {
    const frame = printSafeFrame(pageWidth, pageHeight, pageNumber);
    const caption = captionMetrics(pageHeight);
    const gap = 4 * frame.pxPerMmY;
    const titleBand = title ? 28 * frame.pxPerMmY : 0;
    const requested = Number(textShare);
    const share = requested >= 0.26 && requested <= 0.48 ? requested : 0.36;
    const captionBand = showText ? frame.h * share : 0;
    let bottom = frame.y + frame.h;
    const titleBox = titleBand ? { x: frame.x, y: bottom - titleBand, w: frame.w, h: titleBand } : null;
    if (titleBox) bottom = titleBox.y - gap;
    const textInset = captionBand ? 1.5 * frame.pxPerMmX : 0;
    const textBox = captionBand ? {
      x: frame.x + textInset,
      y: bottom - captionBand,
      w: Math.max(1, frame.w - textInset * 2),
      h: Math.max(1, captionBand)
    } : null;
    if (textBox) bottom = textBox.y - gap;
    const art = artworkCount ? { x: frame.x, y: frame.y, w: frame.w, h: Math.max(1, bottom - frame.y) } : null;
    return {
      marginX: frame.x,
      marginY: frame.y,
      art,
      marks: null,
      text: textBox,
      title: titleBox,
      frame,
      caption,
      fit: "contain"
    };
  }

  function layoutCoverPage({ pageWidth, pageHeight, pageNumber = 1 } = {}) {
    const frame = printSafeFrame(pageWidth, pageHeight, pageNumber);
    const gap = 4 * frame.pxPerMmY;
    const bandH = COVER_BAND_MM * frame.pxPerMmY;
    const title = { x: frame.x, y: frame.y + frame.h - bandH, w: frame.w, h: bandH };
    const art = { x: frame.x, y: frame.y, w: frame.w, h: Math.max(1, title.y - gap - frame.y) };
    return { frame, art, title, marginX: frame.x, marginY: frame.y, fit: "contain", caption: captionMetrics(pageHeight) };
  }

  function samplePixel(src, srcWidth, srcHeight, x, y) {
    const sx = Math.max(0, Math.min(srcWidth - 1, Math.round(x)));
    const sy = Math.max(0, Math.min(srcHeight - 1, Math.round(y)));
    const index = (sy * srcWidth + sx) * 4;
    return [src[index] || 0, src[index + 1] || 0, src[index + 2] || 0, src[index + 3] || 0];
  }

  function blitContain(out, pageWidth, pageHeight, src, srcWidth, srcHeight, box) {
    const placement = containPlacement(srcWidth, srcHeight, box);
    const x0 = Math.max(0, Math.floor(placement.dx));
    const y0 = Math.max(0, Math.floor(placement.dy));
    const x1 = Math.min(pageWidth, Math.ceil(placement.dx + placement.dw));
    const y1 = Math.min(pageHeight, Math.ceil(placement.dy + placement.dh));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const u = (x + 0.5 - placement.dx) / placement.dw;
        const v = (y + 0.5 - placement.dy) / placement.dh;
        if (u < 0 || v < 0 || u > 1 || v > 1) continue;
        const px = samplePixel(src, srcWidth, srcHeight, u * (srcWidth - 1), v * (srcHeight - 1));
        const alpha = px[3] / 255;
        const index = (y * pageWidth + x) * 4;
        out[index] = Math.round(px[0] * alpha + out[index] * (1 - alpha));
        out[index + 1] = Math.round(px[1] * alpha + out[index + 1] * (1 - alpha));
        out[index + 2] = Math.round(px[2] * alpha + out[index + 2] * (1 - alpha));
        out[index + 3] = 255;
      }
    }
    return placement;
  }

  function paintRebuiltPage({
    pageWidth,
    pageHeight,
    artworks = [],
    marks = null,
    text = "",
    status = "ok",
    edited = false,
    manuscript = false,
    title = "",
    paper,
    pageNumber = 1,
    treatment = "",
    separated = false,
    textShare = 0
  } = {}) {
    const shownText = typesetText({ text, status, edited, manuscript });
    const pictures = selectPagePictures({
      artworks,
      marks,
      showText: Boolean(shownText),
      manuscript,
      treatment: manuscript ? "original" : treatment,
      separated: manuscript ? false : separated
    });
    const layout = layoutRebuiltPage({
      pageWidth,
      pageHeight,
      artworkCount: pictures.length,
      showText: Boolean(shownText),
      title,
      pageNumber,
      textShare
    });
    const ink = paper || PAPER;
    const out = new Uint8ClampedArray(pageWidth * pageHeight * 4);
    for (let index = 0; index < out.length; index += 4) {
      out[index] = ink[0];
      out[index + 1] = ink[1];
      out[index + 2] = ink[2];
      out[index + 3] = 255;
    }
    let placement = null;
    if (layout.art && pictures.length) {
      const band = layout.art.h / pictures.length;
      pictures.forEach((artwork, index) => {
        const box = { x: layout.art.x, y: layout.art.y + band * index, w: layout.art.w, h: band };
        const drawn = blitContain(out, pageWidth, pageHeight, artwork.rgba, artwork.width, artwork.height, box);
        if (!placement) placement = drawn;
      });
    }
    const paintedText = [];
    if (shownText) paintedText.push(shownText);
    if (title) paintedText.push(String(title));
    return {
      rgba: out,
      width: pageWidth,
      height: pageHeight,
      layout,
      placement,
      text: shownText,
      paintedText,
      note: "",
      rewritten: false,
      fit: "contain"
    };
  }

  function paintCoverPage({ pageWidth, pageHeight, artwork = null, paper, pageNumber = 1 } = {}) {
    const layout = layoutCoverPage({ pageWidth, pageHeight, pageNumber });
    const ink = paper || PAPER;
    const out = new Uint8ClampedArray(pageWidth * pageHeight * 4);
    for (let index = 0; index < out.length; index += 4) {
      out[index] = ink[0];
      out[index + 1] = ink[1];
      out[index + 2] = ink[2];
      out[index + 3] = 255;
    }
    const placement = artwork
      ? blitContain(out, pageWidth, pageHeight, artwork.rgba, artwork.width, artwork.height, layout.art)
      : null;
    return {
      rgba: out,
      width: pageWidth,
      height: pageHeight,
      layout,
      placement,
      note: "",
      fit: "contain"
    };
  }

  function splitScanPages(rgba, width, height, options) {
    const settings = options || {};
    const source = toUint8(rgba, width, height);
    if (!width || !height || width < 2 || height < 2) {
      return { split: false, confidence: 0, pages: [{ rgba: source, width: Math.max(1, width || 1), height: Math.max(1, height || 1) }] };
    }
    const analysis = analyzeForeground(source, width, height, settings);
    if (settings.allowSplit !== false && analysis && analysis.split && analysis.confidence >= 0.45) {
      const splitX = analysis.split.x;
      return {
        split: true,
        confidence: analysis.confidence,
        pages: [
          { rgba: opaqueResult(crop(source, width, 0, 0, splitX, height)), width: splitX, height },
          { rgba: opaqueResult(crop(source, width, splitX, 0, width - splitX, height)), width: width - splitX, height }
        ]
      };
    }
    return {
      split: false,
      confidence: analysis ? analysis.confidence : 0,
      pages: [{ rgba: opaqueResult(source), width, height }]
    };
  }

  function downscaleNearest(rgba, width, height, maxEdge) {
    const edge = Math.max(width, height);
    if (edge <= maxEdge) return { rgba, width, height, scaleX: 1, scaleY: 1 };
    const scale = maxEdge / edge;
    const dw = Math.max(2, Math.round(width * scale));
    const dh = Math.max(2, Math.round(height * scale));
    const out = new Uint8ClampedArray(dw * dh * 4);
    for (let y = 0; y < dh; y += 1) {
      const sy = Math.min(height - 1, Math.floor((y + 0.5) * height / dh));
      for (let x = 0; x < dw; x += 1) {
        const sx = Math.min(width - 1, Math.floor((x + 0.5) * width / dw));
        const from = (sy * width + sx) * 4;
        const to = (y * dw + x) * 4;
        out[to] = rgba[from];
        out[to + 1] = rgba[from + 1];
        out[to + 2] = rgba[from + 2];
        out[to + 3] = 255;
      }
    }
    return { rgba: out, width: dw, height: dh, scaleX: width / dw, scaleY: height / dh };
  }

  function solveHomography(src, dst) {
    const matrix = [];
    for (let index = 0; index < 4; index += 1) {
      const x = dst[index].x;
      const y = dst[index].y;
      const u = src[index].x;
      const v = src[index].y;
      matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
      matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
    }
    const size = 8;
    for (let col = 0; col < size; col += 1) {
      let pivot = col;
      for (let row = col + 1; row < size; row += 1) {
        if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) pivot = row;
      }
      if (Math.abs(matrix[pivot][col]) < 1e-8) return null;
      if (pivot !== col) {
        const swap = matrix[col];
        matrix[col] = matrix[pivot];
        matrix[pivot] = swap;
      }
      const divisor = matrix[col][col];
      for (let colIndex = col; colIndex <= size; colIndex += 1) matrix[col][colIndex] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === col) continue;
        const factor = matrix[row][col];
        for (let colIndex = col; colIndex <= size; colIndex += 1) matrix[row][colIndex] -= factor * matrix[col][colIndex];
      }
    }
    return matrix.map((row) => row[size]);
  }

  function mapPoint(homography, x, y) {
    const weight = homography[6] * x + homography[7] * y + 1;
    if (!Number.isFinite(weight) || Math.abs(weight) < 1e-8) return null;
    return {
      x: (homography[0] * x + homography[1] * y + homography[2]) / weight,
      y: (homography[3] * x + homography[4] * y + homography[5]) / weight
    };
  }

  function sampleBilinear(rgba, width, height, x, y) {
    if (x < 0 || y < 0 || x > width - 1 || y > height - 1) return PAPER;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const tx = x - x0;
    const ty = y - y0;
    const weights = [
      [(1 - tx) * (1 - ty), x0, y0],
      [tx * (1 - ty), x1, y0],
      [(1 - tx) * ty, x0, y1],
      [tx * ty, x1, y1]
    ];
    const color = [0, 0, 0];
    weights.forEach(([weight, sx, sy]) => {
      const index = (sy * width + sx) * 4;
      color[0] += rgba[index] * weight;
      color[1] += rgba[index + 1] * weight;
      color[2] += rgba[index + 2] * weight;
    });
    return color.map((value) => Math.max(0, Math.min(255, Math.round(value))));
  }

  function quadArea(corners) {
    let sum = 0;
    for (let index = 0; index < corners.length; index += 1) {
      const next = corners[(index + 1) % corners.length];
      sum += corners[index].x * next.y - next.x * corners[index].y;
    }
    return Math.abs(sum) / 2;
  }

  function pageCorners(labels, keptIds, width, height) {
    const points = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (keptIds.has(labels[y * width + x])) points.push({ x, y });
      }
    }
    if (points.length < 16) return null;
    const pick = (score, low) => {
      const ranked = points.map((point) => ({ point, score: score(point) })).sort((a, b) => a.score - b.score);
      const index = low ? 0 : ranked.length - 1;
      return ranked[Math.max(0, Math.min(ranked.length - 1, index))].point;
    };
    return [
      pick((point) => point.x + point.y, true),
      pick((point) => point.y - point.x, true),
      pick((point) => point.x + point.y, false),
      pick((point) => point.x - point.y, true)
    ];
  }

  function warpPage(rgba, width, height, corners, maxEdge) {
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    let outWidth = Math.max(2, Math.round((distance(corners[0], corners[1]) + distance(corners[3], corners[2])) / 2));
    let outHeight = Math.max(2, Math.round((distance(corners[0], corners[3]) + distance(corners[1], corners[2])) / 2));
    const edge = Math.max(outWidth, outHeight);
    if (edge > maxEdge) {
      const scale = maxEdge / edge;
      outWidth = Math.max(2, Math.round(outWidth * scale));
      outHeight = Math.max(2, Math.round(outHeight * scale));
    }
    const destination = [
      { x: 0, y: 0 },
      { x: outWidth - 1, y: 0 },
      { x: outWidth - 1, y: outHeight - 1 },
      { x: 0, y: outHeight - 1 }
    ];
    const homography = solveHomography(corners, destination);
    if (!homography) return null;
    const out = new Uint8ClampedArray(outWidth * outHeight * 4);
    for (let y = 0; y < outHeight; y += 1) {
      for (let x = 0; x < outWidth; x += 1) {
        const source = mapPoint(homography, x, y);
        const color = source ? sampleBilinear(rgba, width, height, source.x, source.y) : PAPER;
        const index = (y * outWidth + x) * 4;
        out[index] = color[0];
        out[index + 1] = color[1];
        out[index + 2] = color[2];
        out[index + 3] = 255;
      }
    }
    return { rgba: out, width: outWidth, height: outHeight };
  }

  function rotateQuarter(rgba, width, height, turns) {
    let pixels = toUint8(rgba, width, height);
    let currentWidth = width;
    let currentHeight = height;
    const steps = ((Number(turns) || 0) % 4 + 4) % 4;
    for (let step = 0; step < steps; step += 1) {
      const next = new Uint8ClampedArray(currentWidth * currentHeight * 4);
      const nextWidth = currentHeight;
      for (let y = 0; y < currentHeight; y += 1) {
        for (let x = 0; x < currentWidth; x += 1) {
          const nx = y;
          const ny = currentWidth - 1 - x;
          const from = (y * currentWidth + x) * 4;
          const to = (ny * nextWidth + nx) * 4;
          next[to] = pixels[from];
          next[to + 1] = pixels[from + 1];
          next[to + 2] = pixels[from + 2];
          next[to + 3] = pixels[from + 3] || 255;
        }
      }
      pixels = next;
      const previousWidth = currentWidth;
      currentWidth = currentHeight;
      currentHeight = previousWidth;
    }
    return { rgba: pixels, width: currentWidth, height: currentHeight };
  }

  function componentBounds(labels, keptIds, width, height) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!keptIds.has(labels[y * width + x])) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return null;
    return { minX, minY, maxX, maxY };
  }

  function cropBounds(rgba, width, height, box, scaleX, scaleY) {
    const pad = Math.max(scaleX, scaleY) > 1.01 ? Math.ceil(Math.max(scaleX, scaleY)) : 0;
    const x0 = Math.max(0, Math.min(width - 2, Math.floor(box.minX * scaleX) - pad));
    const y0 = Math.max(0, Math.min(height - 2, Math.floor(box.minY * scaleY) - pad));
    const x1 = Math.max(x0 + 2, Math.min(width, Math.ceil((box.maxX + 1) * scaleX) + pad));
    const y1 = Math.max(y0 + 2, Math.min(height, Math.ceil((box.maxY + 1) * scaleY) + pad));
    return {
      rgba: opaqueResult(crop(rgba, width, x0, y0, x1 - x0, y1 - y0)),
      width: x1 - x0,
      height: y1 - y0
    };
  }

  function isMarkPixel(red, green, blue) {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    return luma < 165 || (max - min) > 42;
  }

  function orientationStats(rgba, width, height) {
    const rows = new Float64Array(height);
    let count = 0;
    let top = 0;
    let bottom = 0;
    let usedRows = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        if (!isMarkPixel(rgba[index], rgba[index + 1], rgba[index + 2])) continue;
        rows[y] += 1;
        count += 1;
        if (y < height * 0.34) top += 1;
        else if (y > height * 0.66) bottom += 1;
      }
      if (rows[y] > 0) usedRows += 1;
    }
    let sum = 0;
    let sumSq = 0;
    for (let y = 0; y < height; y += 1) {
      sum += rows[y];
      sumSq += rows[y] * rows[y];
    }
    const mean = height ? sum / height : 0;
    return {
      energy: height ? sumSq / height - mean * mean : 0,
      count,
      polarity: count ? (bottom - top) / count : 0,
      edgeRatio: count ? (top + bottom) / count : 0,
      occupancy: height ? usedRows / height : 1
    };
  }

  function chooseUprightTurns(rgba, width, height) {
    const view = downscaleNearest(rgba, width, height, 160);
    let pixels = view.rgba;
    let viewWidth = view.width;
    let viewHeight = view.height;
    const scores = [];
    for (let turns = 0; turns < 4; turns += 1) {
      scores.push({ turns, ...orientationStats(pixels, viewWidth, viewHeight) });
      if (turns < 3) {
        const next = rotateQuarter(pixels, viewWidth, viewHeight, 1);
        pixels = next.rgba;
        viewWidth = next.width;
        viewHeight = next.height;
      }
    }
    const base = scores[0];
    if (base.count < 8) return 0;
    const side = scores[1].energy >= scores[3].energy ? scores[1] : scores[3];
    if (side.energy > base.energy * 1.45 + 0.25 && side.energy >= scores[2].energy) return side.turns;
    const flipped = scores[2];
    const thin = base.occupancy < 0.22 && flipped.occupancy < 0.22;
    if (thin && base.edgeRatio > 0.75 && flipped.edgeRatio > 0.75 && flipped.polarity > base.polarity + 0.45) return 2;
    return 0;
  }

  function rotateFree(rgba, width, height, degrees) {
    const radians = degrees * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const outWidth = Math.max(2, Math.ceil(Math.abs(width * cosine) + Math.abs(height * sine)));
    const outHeight = Math.max(2, Math.ceil(Math.abs(width * sine) + Math.abs(height * cosine)));
    const out = new Uint8ClampedArray(outWidth * outHeight * 4);
    for (let index = 0; index < out.length; index += 4) {
      out[index] = PAPER[0];
      out[index + 1] = PAPER[1];
      out[index + 2] = PAPER[2];
      out[index + 3] = 255;
    }
    const cx = (width - 1) / 2;
    const cy = (height - 1) / 2;
    const ocx = (outWidth - 1) / 2;
    const ocy = (outHeight - 1) / 2;
    for (let y = 0; y < outHeight; y += 1) {
      for (let x = 0; x < outWidth; x += 1) {
        const dx = x - ocx;
        const dy = y - ocy;
        const color = sampleBilinear(rgba, width, height, cosine * dx + sine * dy + cx, -sine * dx + cosine * dy + cy);
        const index = (y * outWidth + x) * 4;
        out[index] = color[0];
        out[index + 1] = color[1];
        out[index + 2] = color[2];
        out[index + 3] = 255;
      }
    }
    return { rgba: out, width: outWidth, height: outHeight };
  }

  function projectionEnergy(points, degrees) {
    const radians = degrees * Math.PI / 180;
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    const bins = new Map();
    points.forEach((point) => {
      const row = Math.round(sine * point.x + cosine * point.y);
      bins.set(row, (bins.get(row) || 0) + 1);
    });
    let sum = 0;
    let sumSq = 0;
    bins.forEach((value) => {
      sum += value;
      sumSq += value * value;
    });
    const count = bins.size || 1;
    const mean = sum / count;
    return sumSq / count - mean * mean;
  }

  function bestSkewDegrees(rgba, width, height) {
    const view = downscaleNearest(rgba, width, height, 120);
    const points = [];
    for (let y = 0; y < view.height; y += 1) {
      for (let x = 0; x < view.width; x += 1) {
        const index = (y * view.width + x) * 4;
        if (!isMarkPixel(view.rgba[index], view.rgba[index + 1], view.rgba[index + 2])) continue;
        points.push({ x: x - view.width / 2, y: y - view.height / 2 });
      }
    }
    if (points.length < 12) return 0;
    let best = 0;
    const base = projectionEnergy(points, 0);
    let bestScore = base;
    for (let degrees = -12; degrees <= 12; degrees += 1) {
      const score = projectionEnergy(points, degrees);
      if (score > bestScore) {
        bestScore = score;
        best = degrees;
      }
    }
    if (Math.abs(best) < 3 || bestScore < base * 1.2) return 0;
    return best;
  }

  function uprightSheet(bitmap) {
    const turns = chooseUprightTurns(bitmap.rgba, bitmap.width, bitmap.height);
    const turned = turns ? rotateQuarter(bitmap.rgba, bitmap.width, bitmap.height, turns) : bitmap;
    const skew = bestSkewDegrees(turned.rgba, turned.width, turned.height);
    if (!skew) return { rgba: turned.rgba, width: turned.width, height: turned.height, turns, skew: 0 };
    const skewed = rotateFree(turned.rgba, turned.width, turned.height, skew);
    return { rgba: skewed.rgba, width: skewed.width, height: skewed.height, turns, skew };
  }

  function cornersReach(corners, box) {
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    return Math.min(...xs) <= box.minX + 1
      && Math.max(...xs) >= box.maxX - 1
      && Math.min(...ys) <= box.minY + 1
      && Math.max(...ys) >= box.maxY - 1;
  }

  function axisAlignedQuad(corners) {
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return corners.every((corner) => (
      (Math.abs(corner.x - minX) <= 1.5 || Math.abs(corner.x - maxX) <= 1.5)
      && (Math.abs(corner.y - minY) <= 1.5 || Math.abs(corner.y - maxY) <= 1.5)
    ));
  }

  function isolatedResult(bitmap, confidence, extra) {
    const fitted = bitmap.width > SCAN_MAX_EDGE || bitmap.height > SCAN_MAX_EDGE
      ? downscaleNearest(bitmap.rgba, bitmap.width, bitmap.height, SCAN_MAX_EDGE)
      : bitmap;
    const upright = uprightSheet(fitted);
    return Object.assign({
      isolated: true,
      rgba: upright.rgba,
      width: upright.width,
      height: upright.height,
      confidence,
      turns: upright.turns,
      skew: upright.skew
    }, extra);
  }

  function scanArtwork(rgba, width, height) {
    const source = opaqueResult(toUint8(rgba, width, height));
    const missed = { isolated: false, rgba: null, width: 0, height: 0, confidence: 0, turns: 0, skew: 0 };
    if (!width || !height || width < 8 || height < 8) return missed;
    if (isCleanScan(source, width, height)) {
      return isolatedResult({ rgba: source, width, height }, 1, { loose: false });
    }
    const view = downscaleNearest(source, width, height, 480);
    const analysis = analyzeForeground(view.rgba, view.width, view.height, {});
    if (!analysis || analysis.confidence < 0.45 || !analysis.keptIds || !analysis.keptIds.size) return missed;
    const smallBox = componentBounds(analysis.labels, analysis.keptIds, view.width, view.height);
    if (!smallBox) return missed;
    const loose = () => isolatedResult(
      cropBounds(source, width, height, smallBox, view.scaleX, view.scaleY),
      analysis.confidence,
      { loose: true }
    );
    const smallCorners = pageCorners(analysis.labels, analysis.keptIds, view.width, view.height);
    if (!smallCorners || !cornersReach(smallCorners, smallBox)) return loose();
    const corners = smallCorners.map((point) => ({
      x: (point.x + 0.5) * view.scaleX - 0.5,
      y: (point.y + 0.5) * view.scaleY - 0.5
    }));
    let turn = 0;
    let convex = true;
    for (let index = 0; index < corners.length; index += 1) {
      const current = corners[index];
      const next = corners[(index + 1) % corners.length];
      const after = corners[(index + 2) % corners.length];
      const cross = (next.x - current.x) * (after.y - next.y) - (next.y - current.y) * (after.x - next.x);
      if (Math.abs(cross) < 1) continue;
      const sign = Math.sign(cross);
      if (turn && sign !== turn) convex = false;
      turn = sign || turn;
    }
    if (!convex) return loose();
    const area = quadArea(corners);
    const frame = width * height;
    const minEdge = Math.min(
      Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y),
      Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y)
    );
    if (area < frame * 0.08 || minEdge < Math.min(width, height) * 0.12) return missed;
    if (area > frame * 0.94 || axisAlignedQuad(smallCorners)) return loose();
    const warped = warpPage(source, width, height, corners, SCAN_MAX_EDGE);
    if (!warped) return loose();
    const upright = uprightSheet(warped);
    return {
      isolated: true,
      rgba: upright.rgba,
      width: upright.width,
      height: upright.height,
      confidence: analysis.confidence,
      turns: upright.turns,
      skew: upright.skew,
      loose: false
    };
  }

  function creamPlaceholder(toPng) {
    const width = 40;
    const height = 56;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < rgba.length; index += 4) {
      rgba[index] = PAPER[0];
      rgba[index + 1] = PAPER[1];
      rgba[index + 2] = PAPER[2];
      rgba[index + 3] = 255;
    }
    return typeof toPng === "function" ? toPng(rgba, width, height) : "";
  }

  function cropSheet(rgba, width, height) {
    const source = opaqueResult(toUint8(rgba, width, height));
    return { rgba: source, width, height, cleaned: false, cropped: false };
  }

  function interpretPdfCraftResponse(statusCode, payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    const images = Array.isArray(body.images)
      ? body.images.filter((src) => typeof src === "string" && /^data:image\/(?:png|jpeg|jpg);base64,/i.test(src))
      : [];
    const artworks = images.map((dataUrl) => ({ dataUrl }));
    if (statusCode === 501 || body.status === "unavailable") {
      return { engine: "pdf-craft", textStatus: "unavailable", text: "", artworks: [], blocks: [], reason: body.reason || "ocr_not_configured", rewritten: false };
    }
    const blocks = body.status === "ok" && typeof body.text === "string"
      ? normalizeScanBlocks(body.blocks).filter((block) => block.kind !== "text" || body.text.includes(block.text))
      : [];
    if (body.status === "ok" && typeof body.text === "string" && body.text.trim()) {
      return { engine: "pdf-craft", textStatus: "ok", text: body.text, artworks, blocks, reason: body.reason || "extracted", rewritten: false };
    }
    return { engine: "pdf-craft", textStatus: "uncertain", text: "", artworks, blocks: [], reason: body.reason || "ocr_uncertain", rewritten: false };
  }

  async function requestBookIllustration(dataUrl, text, fetchImpl) {
    const fetchFn = fetchImpl || globalThis.fetch;
    if (typeof fetchFn !== "function" || !dataUrl) return { ok: false, reason: "illustration_not_configured" };
    try {
      const response = await fetchFn("/api/family-book/illustrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(90000) : undefined,
        body: JSON.stringify({ imageDataUrl: dataUrl, text: String(text || "").slice(0, 280) })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.imageDataUrl !== "string" || !/^data:image\/(?:png|jpeg|jpg);base64,/i.test(payload.imageDataUrl)) {
        return { ok: false, reason: payload.reason || "illustration_failed" };
      }
      return { ok: true, imageDataUrl: payload.imageDataUrl, reason: payload.reason || "illustrated" };
    } catch (_error) {
      return { ok: false, reason: "illustration_failed" };
    }
  }

  async function illustratePhotos(photos, { style, textFor, fetchImpl, onProgress } = {}) {
    if (normalizeInteriorStyle(style) !== "polished") return { fallback: false };
    const targets = (Array.isArray(photos) ? photos : []).filter((photo) => photo && photo.manuscript !== true && photo.scanIsolated !== false && photo.scanDataUrl);
    let fallback = false;
    for (let index = 0; index < targets.length; index += 1) {
      const photo = targets[index];
      const text = textFor ? textFor(photo) : "";
      const key = `${String(photo.scanDataUrl).length}:${String(text || "").slice(0, 280)}`;
      if (onProgress) onProgress(index, targets.length);
      if (photo.polishStatus === "ok" && photo.polishedDataUrl && photo.polishKey === key) continue;
      const result = await requestBookIllustration(photo.scanDataUrl, text, fetchImpl);
      if (result.ok) {
        photo.polishedDataUrl = result.imageDataUrl;
        photo.polishStatus = "ok";
        photo.polishKey = key;
      } else {
        photo.polishedDataUrl = "";
        photo.polishStatus = "fallback";
        photo.polishKey = key;
        fallback = true;
      }
    }
    return { fallback };
  }

  async function requestPdfCraftExtraction(dataUrl, fetchImpl) {
    const fetchFn = fetchImpl || globalThis.fetch;
    if (typeof fetchFn !== "function") {
      return { engine: "pdf-craft", textStatus: "unavailable", text: "", artworks: [], blocks: [], reason: "ocr_not_configured", rewritten: false };
    }
    try {
      const response = await fetchFn("/api/family-book/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl })
      });
      const payload = await response.json().catch(() => ({}));
      return interpretPdfCraftResponse(response.status, payload);
    } catch (_error) {
      return { engine: "pdf-craft", textStatus: "uncertain", text: "", artworks: [], blocks: [], reason: "extract_failed", rewritten: false };
    }
  }

  async function pagesFromPhonePhoto({ rgba, width, height, allowSplit = true, manuscript = false, extract, toPng } = {}) {
    const split = splitScanPages(rgba, width, height, { allowSplit });
    const pages = [];
    for (const page of split.pages) {
      const scanned = scanArtwork(page.rgba, page.width, page.height);
      if (!scanned.isolated) {
        const placeholder = creamPlaceholder(toPng);
        pages.push({
          dataUrl: placeholder,
          scanDataUrl: "",
          marksDataUrl: "",
          sheetCleaned: false,
          scanIsolated: false,
          artworks: [],
          text: "",
          textStatus: "uncertain",
          textEdited: false,
          manuscript: Boolean(manuscript),
          extractEngine: "pdf-craft",
          extractReason: "scan_not_isolated",
          split: split.split
        });
        continue;
      }
      const scanDataUrl = toPng(scanned.rgba, scanned.width, scanned.height);
      const extraction = extract ? await extract(scanDataUrl) : {
        textStatus: "unavailable",
        text: "",
        artworks: [],
        reason: "ocr_not_configured"
      };
      const textStatus = extraction.textStatus || "uncertain";
      const recognized = textStatus === "ok" ? String(extraction.text || "") : "";
      const figures = Array.isArray(extraction.artworks) ? extraction.artworks.filter((item) => item && item.dataUrl) : [];
      const layers = composeScanLayers({
        rgba: scanned.rgba,
        width: scanned.width,
        height: scanned.height,
        text: recognized,
        textStatus,
        blocks: extraction.blocks || [],
        toPng
      });
      const separatedArt = !figures.length && layers.separated
        ? layers.artworks.map((item) => ({ dataUrl: item.dataUrl, box: item.box || null })).filter((item) => item.dataUrl)
        : [];
      const artworks = figures.length ? figures : separatedArt.length ? separatedArt : [{ dataUrl: scanDataUrl }];
      pages.push({
        dataUrl: scanDataUrl,
        scanDataUrl,
        marksDataUrl: scanDataUrl,
        sheetCleaned: true,
        scanIsolated: true,
        artworks,
        lines: recognized ? layers.lines : [],
        layersSeparated: Boolean(recognized && (figures.length || separatedArt.length)),
        text: recognized,
        textStatus,
        textEdited: false,
        manuscript: Boolean(manuscript),
        extractEngine: "pdf-craft",
        extractReason: extraction.reason || "",
        split: split.split
      });
    }
    return { split: split.split, pages };
  }

  function wrapMeasured(context, text, maxWidth) {
    const value = String(text || "");
    if (!value) return [];
    if (!context.measureText) return [value];
    const characters = /[\u3400-\u9fff]/.test(value) ? Array.from(value) : value.split(/\s+/);
    const lines = [];
    let current = "";
    characters.forEach((part, index) => {
      const chunk = /[\u3400-\u9fff]/.test(value) ? `${current}${part}` : current ? `${current} ${part}` : part;
      if (context.measureText(chunk).width <= maxWidth || !current) current = chunk;
      else {
        lines.push(current);
        current = part;
      }
      if (index === characters.length - 1 && current) lines.push(current);
    });
    return lines.slice(0, 12);
  }

  function drawContain(context, image, box) {
    const srcWidth = image.naturalWidth || image.width;
    const srcHeight = image.naturalHeight || image.height;
    if (!srcWidth || !srcHeight || !box) return null;
    const placement = containPlacement(srcWidth, srcHeight, box);
    context.drawImage(image, placement.dx, placement.dy, placement.dw, placement.dh);
    return placement;
  }

  function drawRebuiltPage(context, options = {}) {
    const pageWidth = options.pageWidth;
    const pageHeight = options.pageHeight;
    const manuscript = options.manuscript === true;
    const status = options.status || "ok";
    const shownText = typesetText({
      text: options.text || "",
      status,
      edited: options.edited === true,
      manuscript
    });
    const pictures = selectPagePictures({
      artworks: options.artworks || [],
      marks: options.marks || null,
      showText: Boolean(shownText),
      manuscript,
      treatment: manuscript ? "original" : (options.treatment || ""),
      separated: manuscript ? false : options.separated === true
    });
    const layout = layoutRebuiltPage({
      pageWidth,
      pageHeight,
      artworkCount: pictures.length,
      showText: Boolean(shownText),
      title: options.title || options.subtitle || "",
      pageNumber: options.pageNumber || 1,
      textShare: options.textShare || 0
    });
    context.fillStyle = options.paper || PAPER_HEX;
    context.fillRect(0, 0, pageWidth, pageHeight);
    if (layout.art && pictures.length) {
      const band = layout.art.h / pictures.length;
      pictures.forEach((image, index) => {
        drawContain(context, image, { x: layout.art.x, y: layout.art.y + band * index, w: layout.art.w, h: band });
      });
    }
    const paintedText = [];
    if (layout.text && shownText) {
      paintedText.push(shownText);
      context.save();
      context.fillStyle = "#1c2420";
      context.font = `500 ${layout.caption.fontPx}px ${options.fontFamily || "sans-serif"}`;
      context.textAlign = "left";
      context.textBaseline = "top";
      const maxLines = Math.max(1, Math.floor(layout.text.h / layout.caption.leadingPx));
      const lines = wrapMeasured(context, shownText, layout.text.w).slice(0, maxLines);
      const blockHeight = lines.length * layout.caption.leadingPx;
      const textTop = layout.text.y + Math.max(0, (layout.text.h - blockHeight) / 2);
      lines.forEach((line, index) => {
        context.fillText(line, layout.text.x, textTop + index * layout.caption.leadingPx);
      });
      context.restore();
    }
    if ((options.title || options.subtitle) && layout.title) {
      const band = layout.title;
      const titleSize = Math.max(1, 18 * pageHeight / PAGE_HEIGHT_MM * 25.4 / 72);
      const subSize = Math.max(1, 12 * pageHeight / PAGE_HEIGHT_MM * 25.4 / 72);
      context.save();
      context.fillStyle = "#101817";
      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      if (options.title) {
        paintedText.push(String(options.title));
        context.font = options.titleFont || `700 ${titleSize}px serif`;
        wrapMeasured(context, options.title, band.w).slice(0, 2).forEach((line, index) => {
          context.fillText(line, band.x + band.w / 2, band.y + titleSize + index * titleSize * 1.15);
        });
      }
      if (options.subtitle) {
        paintedText.push(String(options.subtitle));
        context.fillStyle = "#3d4a44";
        context.font = options.subtitleFont || `600 ${subSize}px ${options.fontFamily || "sans-serif"}`;
        context.fillText(options.subtitle, band.x + band.w / 2, band.y + band.h - subSize * 0.3);
      }
      context.restore();
    }
    return { layout, text: shownText, paintedText, note: "", rewritten: false, fit: "contain" };
  }

  function drawCoverPage(context, options = {}) {
    const pageWidth = options.pageWidth;
    const pageHeight = options.pageHeight;
    const layout = layoutCoverPage({
      pageWidth,
      pageHeight,
      pageNumber: options.pageNumber || 1
    });
    context.fillStyle = options.paper || PAPER_HEX;
    context.fillRect(0, 0, pageWidth, pageHeight);
    if (options.image) drawContain(context, options.image, layout.art);
    const band = layout.title;
    const titleSize = Math.max(1, 22 * pageHeight / PAGE_HEIGHT_MM * 25.4 / 72);
    const subSize = Math.max(1, 12 * pageHeight / PAGE_HEIGHT_MM * 25.4 / 72);
    const paintedText = [];
    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#101817";
    if (options.title) {
      paintedText.push(String(options.title));
      context.font = options.titleFont || `700 ${titleSize}px serif`;
      const lines = wrapMeasured(context, options.title, band.w).slice(0, 2);
      const lineGap = titleSize * 1.15;
      const subGap = options.subtitle ? subSize * 1.5 : 0;
      let y = band.y + (band.h - lines.length * lineGap - subGap) / 2 + lineGap / 2;
      lines.forEach((line) => {
        context.fillText(line, band.x + band.w / 2, y);
        y += lineGap;
      });
      if (options.subtitle) {
        paintedText.push(String(options.subtitle));
        context.fillStyle = "#3d4a44";
        context.font = options.subtitleFont || `600 ${subSize}px ${options.fontFamily || "sans-serif"}`;
        context.fillText(options.subtitle, band.x + band.w / 2, y + subSize * 0.15);
      }
    } else if (options.subtitle) {
      paintedText.push(String(options.subtitle));
      context.fillStyle = "#3d4a44";
      context.font = options.subtitleFont || `600 ${subSize}px ${options.fontFamily || "sans-serif"}`;
      context.fillText(options.subtitle, band.x + band.w / 2, band.y + band.h / 2);
    }
    context.restore();
    return { layout, paintedText, note: "", fit: "contain" };
  }

  function drawImageFullBleed(context, image, pageWidth, pageHeight, paper) {
    const srcWidth = image.naturalWidth || image.width;
    const srcHeight = image.naturalHeight || image.height;
    const scratch = document.createElement("canvas");
    scratch.width = srcWidth;
    scratch.height = srcHeight;
    const sourceContext = scratch.getContext("2d", { alpha: true });
    sourceContext.drawImage(image, 0, 0);
    const imageData = sourceContext.getImageData(0, 0, srcWidth, srcHeight);
    const bounds = contentBounds(imageData.data, srcWidth, srcHeight);
    const placement = fullBleedPlacement(bounds.width, bounds.height, pageWidth, pageHeight);
    context.fillStyle = paper || PAPER_HEX;
    context.fillRect(0, 0, pageWidth, pageHeight);
    context.drawImage(
      image,
      bounds.x + placement.sx,
      bounds.y + placement.sy,
      placement.sw,
      placement.sh,
      0,
      0,
      pageWidth,
      pageHeight
    );
    return placement;
  }

  return {
    PAPER,
    PAPER_HEX,
    avatarUseDecision,
    compositeOntoPaper,
    consentRecord,
    contentBounds,
    BLEED_HEIGHT_PT,
    BLEED_MM,
    BLEED_PT,
    BLEED_WIDTH_PT,
    CAPTION_LEADING,
    CAPTION_SIZE_PT,
    COVER_BAND_MM,
    GUTTER_MM,
    PAGE_HEIGHT_MM,
    PAGE_HEIGHT_PX,
    PAGE_WIDTH_MM,
    PAGE_WIDTH_PX,
    PRINT_DPI,
    SAFE_MM,
    SCAN_MAX_EDGE,
    TRIM_HEIGHT_MM,
    TRIM_HEIGHT_PT,
    TRIM_WIDTH_MM,
    TRIM_WIDTH_PT,
    captionMetrics,
    containPlacement,
    coverHeroSource,
    cropSheet,
    drawCoverPage,
    illustratePhotos,
    interiorPageArt,
    normalizeInteriorStyle,
    layoutCoverPage,
    paintCoverPage,
    printSafeFrame,
    rotateQuarter,
    scanArtwork,
    selectPagePictures,
    drawImageFullBleed,
    drawRebuiltPage,
    fullBleedPlacement,
    illustrateAvatar,
    interpretPdfCraftResponse,
    layoutRebuiltPage,
    looksLikeManuscript,
    pagesFromPhonePhoto,
    paintFullBleed,
    paintRebuiltPage,
    parentalSignaturePresent,
    placementFillsPage,
    planBookPages,
    prepareArtwork,
    renderAuthorPreview,
    applyAssistantProposal,
    applyInteriorStyleArt,
    bindBookAssistant,
    composeScanLayers,
    dismissAssistantProposal,
    normalizeScanBlocks,
    proposeAssistantEdit,
    proposeProofreading,
    requestBookIllustration,
    requestPdfCraftExtraction,
    resolveArtProposal,
    retainBookEdits,
    segmentSheet,
    storyArtSources,
    rgbaToPngDataUrl,
    splitScanPages,
    typesetText
  };
});
