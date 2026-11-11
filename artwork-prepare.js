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

  function typesetText({ text = "", status = "ok", edited = false, manuscript = false } = {}) {
    if (manuscript) return "";
    if (status === "uncertain" || status === "unavailable" || status === "restored") {
      return edited ? String(text) : "";
    }
    if (status === "ok" || status === "parent") return String(text);
    return "";
  }

  function layoutRebuiltPage({ pageWidth, pageHeight, artworkCount = 0, showMarks = false, showText = false, title = "" } = {}) {
    const marginX = Math.max(1, Math.round(pageWidth * 0.08));
    const marginY = Math.max(1, Math.round(pageHeight * 0.06));
    const titleBand = title ? Math.round(pageHeight * 0.14) : 0;
    const innerW = Math.max(1, pageWidth - marginX * 2);
    const innerBottom = pageHeight - marginY - titleBand;
    const innerH = Math.max(1, innerBottom - marginY);
    const gap = Math.max(1, Math.round(pageHeight * 0.02));
    let cursor = marginY;
    const artH = artworkCount ? ((showMarks || showText) ? Math.round(innerH * 0.56) : innerH) : 0;
    const art = artworkCount ? { x: marginX, y: cursor, w: innerW, h: Math.max(1, artH) } : null;
    if (art) cursor += art.h + gap;
    const marksH = showMarks ? (showText ? Math.round(innerH * 0.28) : Math.max(1, innerBottom - cursor)) : 0;
    const marks = showMarks ? { x: marginX, y: cursor, w: innerW, h: Math.max(1, marksH) } : null;
    if (marks) cursor += marks.h + gap;
    const textBox = showText ? { x: marginX, y: cursor, w: innerW, h: Math.max(1, innerBottom - cursor) } : null;
    const titleBox = title ? { x: marginX, y: pageHeight - marginY - titleBand, w: innerW, h: titleBand } : null;
    return { marginX, marginY, art, marks, text: textBox, title: titleBox, fit: "contain" };
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
    forceMarks = false
  } = {}) {
    const shownText = typesetText({ text, status, edited, manuscript });
    const showMarks = Boolean(marks && (forceMarks || manuscript || (status !== "ok" && status !== "parent")));
    const layout = layoutRebuiltPage({
      pageWidth,
      pageHeight,
      artworkCount: artworks.length,
      showMarks,
      showText: Boolean(shownText),
      title
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
    if (layout.art && artworks.length) {
      const band = layout.art.h / artworks.length;
      artworks.forEach((artwork, index) => {
        const box = { x: layout.art.x, y: layout.art.y + band * index, w: layout.art.w, h: band };
        const drawn = blitContain(out, pageWidth, pageHeight, artwork.rgba, artwork.width, artwork.height, box);
        if (!placement) placement = drawn;
      });
    }
    if (layout.marks && marks) {
      const drawn = blitContain(out, pageWidth, pageHeight, marks.rgba, marks.width, marks.height, layout.marks);
      if (!placement) placement = drawn;
    }
    return {
      rgba: out,
      width: pageWidth,
      height: pageHeight,
      layout,
      placement,
      text: shownText,
      rewritten: false,
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
      const index = low ? Math.floor(ranked.length * 0.02) : Math.ceil(ranked.length * 0.98) - 1;
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

  function scanArtwork(rgba, width, height) {
    const source = opaqueResult(toUint8(rgba, width, height));
    const missed = { isolated: false, rgba: null, width: 0, height: 0, confidence: 0 };
    if (!width || !height || width < 8 || height < 8) return missed;
    if (isCleanScan(source, width, height)) {
      const fitted = downscaleNearest(source, width, height, 1600);
      return { isolated: true, rgba: fitted.rgba, width: fitted.width, height: fitted.height, confidence: 1 };
    }
    const view = downscaleNearest(source, width, height, 480);
    const analysis = analyzeForeground(view.rgba, view.width, view.height, {});
    if (!analysis || analysis.confidence < 0.45 || !analysis.keptIds || !analysis.keptIds.size) return missed;
    const smallCorners = pageCorners(analysis.labels, analysis.keptIds, view.width, view.height);
    if (!smallCorners) return missed;
    const corners = smallCorners.map((point) => ({
      x: (point.x + 0.5) * view.scaleX - 0.5,
      y: (point.y + 0.5) * view.scaleY - 0.5
    }));
    let turn = 0;
    for (let index = 0; index < corners.length; index += 1) {
      const current = corners[index];
      const next = corners[(index + 1) % corners.length];
      const after = corners[(index + 2) % corners.length];
      const cross = (next.x - current.x) * (after.y - next.y) - (next.y - current.y) * (after.x - next.x);
      if (Math.abs(cross) < 1) continue;
      const sign = Math.sign(cross);
      if (turn && sign !== turn) return missed;
      turn = sign;
    }
    const area = quadArea(corners);
    const frame = width * height;
    const minEdge = Math.min(
      Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y),
      Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y)
    );
    if (area < frame * 0.08 || area > frame * 0.94 || minEdge < Math.min(width, height) * 0.12) return missed;
    const warped = warpPage(source, width, height, corners, 1600);
    if (!warped) return missed;
    return { isolated: true, rgba: warped.rgba, width: warped.width, height: warped.height, confidence: analysis.confidence };
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
    const source = toUint8(rgba, width, height);
    const analysis = analyzeForeground(source, width, height, {});
    if (!analysis || analysis.confidence < 0.45 || !analysis.kept || !analysis.kept.length) {
      return { rgba: opaqueResult(source), width, height, cleaned: false };
    }
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    analysis.kept.forEach((item) => {
      if (item.minX < minX) minX = item.minX;
      if (item.minY < minY) minY = item.minY;
      if (item.maxX > maxX) maxX = item.maxX;
      if (item.maxY > maxY) maxY = item.maxY;
    });
    const pad = Math.round(Math.min(width, height) * 0.02);
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    if (cropWidth < 2 || cropHeight < 2 || cropWidth * cropHeight > width * height * 0.98) {
      return { rgba: opaqueResult(source), width, height, cleaned: false };
    }
    return {
      rgba: opaqueResult(crop(source, width, minX, minY, cropWidth, cropHeight)),
      width: cropWidth,
      height: cropHeight,
      cleaned: true
    };
  }

  function interpretPdfCraftResponse(statusCode, payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    const images = Array.isArray(body.images)
      ? body.images.filter((src) => typeof src === "string" && /^data:image\/(?:png|jpeg|jpg);base64,/i.test(src))
      : [];
    const artworks = images.map((dataUrl) => ({ dataUrl }));
    if (statusCode === 501 || body.status === "unavailable") {
      return { engine: "pdf-craft", textStatus: "unavailable", text: "", artworks: [], reason: body.reason || "ocr_not_configured", rewritten: false };
    }
    if (body.status === "ok" && typeof body.text === "string" && body.text.trim()) {
      return { engine: "pdf-craft", textStatus: "ok", text: body.text, artworks, reason: body.reason || "extracted", rewritten: false };
    }
    return { engine: "pdf-craft", textStatus: "uncertain", text: "", artworks, reason: body.reason || "ocr_uncertain", rewritten: false };
  }

  async function requestPdfCraftExtraction(dataUrl, fetchImpl) {
    const fetchFn = fetchImpl || globalThis.fetch;
    if (typeof fetchFn !== "function") {
      return { engine: "pdf-craft", textStatus: "unavailable", text: "", artworks: [], reason: "ocr_not_configured", rewritten: false };
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
      return { engine: "pdf-craft", textStatus: "uncertain", text: "", artworks: [], reason: "extract_failed", rewritten: false };
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
      const figures = Array.isArray(extraction.artworks) ? extraction.artworks : [];
      const artworks = figures.length ? figures : [{ dataUrl: scanDataUrl }];
      pages.push({
        dataUrl: (artworks[0] && artworks[0].dataUrl) || scanDataUrl,
        scanDataUrl,
        marksDataUrl: scanDataUrl,
        sheetCleaned: true,
        scanIsolated: true,
        artworks,
        text: textStatus === "ok" ? String(extraction.text || "") : "",
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
    const artworks = options.artworks || [];
    const showMarks = Boolean(options.marks && (options.forceMarks || manuscript || (status !== "ok" && status !== "parent")));
    const layout = layoutRebuiltPage({
      pageWidth,
      pageHeight,
      artworkCount: artworks.length,
      showMarks,
      showText: Boolean(shownText),
      title: options.title || options.subtitle || ""
    });
    context.fillStyle = options.paper || PAPER_HEX;
    context.fillRect(0, 0, pageWidth, pageHeight);
    if (layout.art && artworks.length) {
      const band = layout.art.h / artworks.length;
      artworks.forEach((image, index) => {
        drawContain(context, image, { x: layout.art.x, y: layout.art.y + band * index, w: layout.art.w, h: band });
      });
    }
    if (layout.marks && options.marks) drawContain(context, options.marks, layout.marks);
    if (layout.text && shownText) {
      context.save();
      context.fillStyle = "#1c2420";
      context.font = options.font || "500 42px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "top";
      wrapMeasured(context, shownText, layout.text.w).forEach((line, index) => {
        context.fillText(line, layout.text.x, layout.text.y + index * 56);
      });
      context.restore();
    }
    if (options.note) {
      context.save();
      context.fillStyle = "#6d5b3c";
      context.font = options.noteFont || "700 28px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "top";
      wrapMeasured(context, options.note, pageWidth - layout.marginX * 2).slice(0, 3).forEach((line, index) => {
        context.fillText(line, layout.marginX, layout.marginY + index * 36);
      });
      context.restore();
    }
    if (options.title || options.subtitle) {
      const band = layout.title;
      context.save();
      context.fillStyle = "#101817";
      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      if (options.title) {
        context.font = options.titleFont || "700 64px serif";
        wrapMeasured(context, options.title, band.w).slice(0, 2).forEach((line, index) => {
          context.fillText(line, pageWidth / 2, band.y + 52 + index * 72);
        });
      }
      if (options.subtitle) {
        context.fillStyle = "#3d4a44";
        context.font = options.subtitleFont || "600 32px sans-serif";
        context.fillText(options.subtitle, pageWidth / 2, band.y + band.h - 16);
      }
      context.restore();
    }
    return { layout, text: shownText, rewritten: false, fit: "contain" };
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
    containPlacement,
    cropSheet,
    rotateQuarter,
    scanArtwork,
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
    requestPdfCraftExtraction,
    rgbaToPngDataUrl,
    splitScanPages,
    typesetText
  };
});
