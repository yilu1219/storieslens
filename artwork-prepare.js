(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StoriesLensArtworkPrepare = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PAPER = Object.freeze([0xf6, 0xf0, 0xe4]);
  const PAPER_HEX = "#f6f0e4";
  const MANUSCRIPT_NAME = /手稿|草稿|原稿|手写|manuscript|handwrit|draft/i;

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
    manuscript.forEach((photo) => pages.push({ kind: "manuscript", photoId: photo.id }));
    return pages;
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
    drawImageFullBleed,
    fullBleedPlacement,
    illustrateAvatar,
    looksLikeManuscript,
    paintFullBleed,
    parentalSignaturePresent,
    placementFillsPage,
    planBookPages,
    prepareArtwork,
    renderAuthorPreview,
    rgbaToPngDataUrl
  };
});
