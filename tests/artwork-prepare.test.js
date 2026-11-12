const assert = require("node:assert/strict");
const test = require("node:test");
const {
  PAPER,
  SCAN_MAX_EDGE,
  avatarUseDecision,
  compositeOntoPaper,
  illustrateAvatar,
  interpretPdfCraftResponse,
  layoutRebuiltPage,
  looksLikeManuscript,
  pagesFromPhonePhoto,
  paintCoverPage,
  paintRebuiltPage,
  placementFillsPage,
  illustratePhotos,
  interiorPageArt,
  normalizeInteriorStyle,
  planBookPages,
  prepareArtwork,
  printSafeFrame,
  renderAuthorPreview,
  retainBookEdits,
  rotateQuarter,
  placeArt,
  scanArtwork,
  paintFullBleed,
  splitScanPages,
  typesetText,
  segmentSheet,
  composeScanLayers,
  proposeProofreading,
  applyAssistantProposal,
  applyInteriorStyleArt,
  coverHeroSource,
  dismissAssistantProposal,
  storyArtSources
} = require("../artwork-prepare");

const STATUS_COPY = "The words were not read confidently, so nothing was invented. The original marks stay on the page and can be corrected.";

function fill(width, height, color, alpha = 255) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = color[0];
    rgba[index + 1] = color[1];
    rgba[index + 2] = color[2];
    rgba[index + 3] = alpha;
  }
  return rgba;
}

function paintRect(rgba, width, x, y, rectWidth, rectHeight, color, alpha = 255) {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let col = x; col < x + rectWidth; col += 1) {
      const index = (row * width + col) * 4;
      rgba[index] = color[0];
      rgba[index + 1] = color[1];
      rgba[index + 2] = color[2];
      rgba[index + 3] = alpha;
    }
  }
}

function pixel(rgba, width, x, y) {
  const index = (y * width + x) * 4;
  return [rgba[index], rgba[index + 1], rgba[index + 2], rgba[index + 3]];
}

function noisyTable(width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const noise = (n - Math.floor(n) - 0.5) * 28;
      const index = (y * width + x) * 4;
      rgba[index] = 118 + noise;
      rgba[index + 1] = 74 + noise * 0.6;
      rgba[index + 2] = 42 + noise * 0.4;
      rgba[index + 3] = 255;
    }
  }
  return rgba;
}

test("a desk photo becomes a transparent cutout and the artwork stays", () => {
  const width = 80;
  const height = 60;
  const rgba = noisyTable(width, height);
  paintRect(rgba, width, 18, 10, 44, 40, [250, 248, 240]);
  paintRect(rgba, width, 30, 24, 8, 8, [200, 30, 40]);
  const result = prepareArtwork(rgba, width, height);
  assert.equal(result.keptOriginal, false);
  assert.equal(result.split, false);
  assert.equal(result.pages.length, 1);
  const page = result.pages[0];
  const table = pixel(page.rgba, page.width, 2, 2);
  const paper = pixel(page.rgba, page.width, 22, 16);
  const art = pixel(page.rgba, page.width, 33, 27);
  assert.equal(table[3], 0);
  assert.equal(paper[3], 255);
  assert.deepEqual(art.slice(0, 3), [200, 30, 40]);
  assert.equal(art[3], 255);
});

test("a clean scan is not wrecked", () => {
  const width = 70;
  const height = 90;
  const rgba = fill(width, height, [248, 244, 236]);
  paintRect(rgba, width, 12, 20, 3, 30, [30, 30, 30]);
  paintRect(rgba, width, 40, 18, 14, 2, [20, 20, 20]);
  const before = pixel(rgba, width, 13, 30);
  const result = prepareArtwork(rgba, width, height);
  assert.equal(result.reason, "clean_scan");
  assert.equal(result.keptOriginal, true);
  assert.equal(result.pages.length, 1);
  const after = pixel(result.pages[0].rgba, width, 13, 30);
  assert.deepEqual(after, [before[0], before[1], before[2], 255]);
  assert.equal(pixel(result.pages[0].rgba, width, 4, 4)[3], 255);
});

test("an already transparent PNG is left alone", () => {
  const width = 40;
  const height = 30;
  const rgba = fill(width, height, [120, 70, 40], 0);
  paintRect(rgba, width, 10, 8, 16, 14, [20, 140, 80], 255);
  const result = prepareArtwork(rgba, width, height);
  assert.equal(result.reason, "already_transparent");
  assert.equal(pixel(result.pages[0].rgba, width, 1, 1)[3], 0);
  assert.deepEqual(pixel(result.pages[0].rgba, width, 12, 10).slice(0, 3), [20, 140, 80]);
});

test("compositing transparency lands on cream paper, not a white or black matte", () => {
  const rgba = new Uint8ClampedArray(8);
  rgba.set([200, 30, 40, 255, 10, 10, 10, 0]);
  const flat = compositeOntoPaper(rgba, 2, 1);
  assert.deepEqual([flat[0], flat[1], flat[2], flat[3]], [200, 30, 40, 255]);
  assert.deepEqual([flat[4], flat[5], flat[6]], PAPER);
  assert.notDeepEqual([flat[4], flat[5], flat[6]], [255, 255, 255]);
  assert.notDeepEqual([flat[4], flat[5], flat[6]], [0, 0, 0]);
  assert.equal(rgba[7], 0);
});

test("a clear left and right pair becomes two pages and one wide work does not", () => {
  const width = 90;
  const height = 50;
  const pair = noisyTable(width, height);
  paintRect(pair, width, 4, 8, 28, 34, [250, 247, 238]);
  paintRect(pair, width, 58, 8, 28, 34, [250, 247, 238]);
  paintRect(pair, width, 10, 18, 6, 6, [180, 20, 40]);
  paintRect(pair, width, 66, 18, 6, 6, [20, 70, 180]);
  const split = prepareArtwork(pair, width, height);
  assert.equal(split.split, true);
  assert.equal(split.pages.length, 2);
  const left = split.pages[0];
  const right = split.pages[1];
  assert.equal(pixel(left.rgba, left.width, 0, 0)[3], 0);
  assert.equal(pixel(right.rgba, right.width, 0, 0)[3], 0);
  assert.deepEqual(pixel(left.rgba, left.width, 12, 20).slice(0, 3), [180, 20, 40]);
  assert.ok(pixel(left.rgba, left.width, 12, 20)[3] === 255);
  let leftHasBlue = false;
  let rightHasRed = false;
  let rightHasBlue = false;
  for (let y = 0; y < left.height; y += 1) {
    for (let x = 0; x < left.width; x += 1) {
      const sample = pixel(left.rgba, left.width, x, y);
      if (sample[2] > 150 && sample[0] < 40) leftHasBlue = true;
    }
  }
  for (let y = 0; y < right.height; y += 1) {
    for (let x = 0; x < right.width; x += 1) {
      const sample = pixel(right.rgba, right.width, x, y);
      if (sample[0] > 150 && sample[2] < 60) rightHasRed = true;
      if (sample[2] > 150 && sample[0] < 40) rightHasBlue = true;
    }
  }
  assert.equal(leftHasBlue, false);
  assert.equal(rightHasRed, false);
  assert.equal(rightHasBlue, true);

  const single = noisyTable(width, height);
  paintRect(single, width, 6, 8, 78, 34, [250, 247, 238]);
  paintRect(single, width, 12, 20, 6, 6, [180, 20, 40]);
  paintRect(single, width, 70, 20, 6, 6, [20, 70, 180]);
  const one = prepareArtwork(single, width, height);
  assert.equal(one.split, false);
  assert.equal(one.pages.length, 1);
  assert.deepEqual(pixel(one.pages[0].rgba, width, 14, 22).slice(0, 3), [180, 20, 40]);
  assert.deepEqual(pixel(one.pages[0].rgba, width, 72, 22).slice(0, 3), [20, 70, 180]);
});

test("full-bleed placement covers the A5 canvas instead of an inset frame", () => {
  const pageWidth = 30;
  const pageHeight = 42;
  const source = fill(40, 10, [210, 40, 50]);
  for (let y = 0; y < 10; y += 1) paintRect(source, 40, 20, y, 20, 1, [30, 90, 200]);
  const painted = paintFullBleed(source, 40, 10, pageWidth, pageHeight);
  assert.equal(painted.width, pageWidth);
  assert.equal(painted.height, pageHeight);
  assert.equal(placementFillsPage(painted.placement, pageWidth, pageHeight), true);
  assert.equal(painted.placement.dx, 0);
  assert.equal(painted.placement.dy, 0);
  assert.equal(painted.placement.dw, pageWidth);
  assert.equal(painted.placement.dh, pageHeight);
  const topLeft = pixel(painted.rgba, pageWidth, 0, 0);
  const topRight = pixel(painted.rgba, pageWidth, pageWidth - 1, 0);
  const bottomLeft = pixel(painted.rgba, pageWidth, 0, pageHeight - 1);
  assert.notDeepEqual(topLeft.slice(0, 3), PAPER);
  assert.notDeepEqual(topRight.slice(0, 3), PAPER);
  assert.notDeepEqual(bottomLeft.slice(0, 3), PAPER);
  assert.equal(topLeft[0] > topLeft[2], true);
  assert.equal(topRight[2] > topRight[0], true);

  const cutout = fill(40, 40, [90, 50, 30], 0);
  paintRect(cutout, 40, 12, 8, 16, 24, [200, 30, 40], 255);
  const filled = paintFullBleed(cutout, 40, 40, pageWidth, pageHeight);
  assert.deepEqual(pixel(filled.rgba, pageWidth, 0, 0).slice(0, 3), [200, 30, 40]);
  assert.deepEqual(pixel(filled.rgba, pageWidth, pageWidth - 1, pageHeight - 1).slice(0, 3), [200, 30, 40]);
  assert.notDeepEqual(pixel(filled.rgba, pageWidth, 1, 1).slice(0, 3), [90, 50, 30]);
});

test("pdf-craft pieces are recomposed on cream A5 and the raw photo is not full-bleed", () => {
  const pageWidth = 40;
  const pageHeight = 56;
  const art = fill(20, 10, [200, 30, 40]);
  paintRect(art, 20, 10, 0, 10, 10, [30, 90, 200]);
  const desk = fill(30, 40, [90, 50, 30]);
  const painted = paintRebuiltPage({
    pageWidth,
    pageHeight,
    artworks: [{ rgba: art, width: 20, height: 10 }],
    marks: { rgba: desk, width: 30, height: 40 },
    text: "teh catt",
    status: "ok"
  });
  assert.equal(painted.text, "teh catt");
  assert.equal(painted.rewritten, false);
  assert.equal(painted.fit, "contain");
  assert.equal(placementFillsPage(painted.placement, pageWidth, pageHeight), false);
  assert.ok(painted.placement.dx > 0 || painted.placement.dw < pageWidth);
  assert.deepEqual(pixel(painted.rgba, pageWidth, 0, 0).slice(0, 3), PAPER);
  assert.deepEqual(pixel(painted.rgba, pageWidth, pageWidth - 1, pageHeight - 1).slice(0, 3), PAPER);
  let sawRed = false;
  let sawBlue = false;
  let sawDesk = false;
  for (let y = 0; y < pageHeight; y += 1) {
    for (let x = 0; x < pageWidth; x += 1) {
      const sample = pixel(painted.rgba, pageWidth, x, y);
      if (sample[0] > 150 && sample[2] < 80) sawRed = true;
      if (sample[2] > 150 && sample[0] < 80) sawBlue = true;
      if (sample[0] > 70 && sample[0] < 110 && sample[1] > 40 && sample[1] < 70) sawDesk = true;
    }
  }
  assert.equal(sawRed, true);
  assert.equal(sawBlue, true);
  assert.equal(sawDesk, false);
});

test("uncertain OCR does not invent the child's words, and a parent correction is kept verbatim", () => {
  assert.equal(typesetText({ text: "a polished sentence", status: "uncertain" }), "");
  assert.equal(typesetText({ text: "a polished sentence", status: "unavailable" }), "");
  assert.equal(typesetText({ text: "teh catt", status: "ok" }), "teh catt");
  assert.equal(typesetText({ text: "家长改正", status: "uncertain", edited: true }), "家长改正");
  const response = interpretPdfCraftResponse(422, {
    status: "uncertain",
    text: "invented caption",
    images: ["data:image/png;base64,aaaa"],
    reason: "ocr_uncertain"
  });
  assert.equal(response.text, "");
  assert.equal(response.textStatus, "uncertain");
  assert.equal(response.artworks.length, 1);
  assert.equal(response.rewritten, false);
  const missing = interpretPdfCraftResponse(501, { status: "unavailable", text: "hello", reason: "ocr_not_configured" });
  assert.equal(missing.text, "");
  assert.equal(missing.artworks.length, 0);
  const faithful = interpretPdfCraftResponse(200, { status: "ok", text: "teh catt", images: [] });
  assert.equal(faithful.text, "teh catt");
});

test("a left and right scan still splits before each side is extracted", async () => {
  const width = 90;
  const height = 50;
  const pair = noisyTable(width, height);
  paintRect(pair, width, 4, 8, 28, 34, [250, 247, 238]);
  paintRect(pair, width, 58, 8, 28, 34, [250, 247, 238]);
  paintRect(pair, width, 10, 18, 6, 6, [180, 20, 40]);
  paintRect(pair, width, 66, 18, 6, 6, [20, 70, 180]);
  const split = splitScanPages(pair, width, height);
  assert.equal(split.split, true);
  assert.equal(split.pages.length, 2);
  assert.equal(pixel(split.pages[0].rgba, split.pages[0].width, 0, 0)[3], 255);
  let calls = 0;
  const built = await pagesFromPhonePhoto({
    rgba: pair,
    width,
    height,
    toPng: () => "data:image/png;base64,scan",
    extract: async () => {
      calls += 1;
      return calls === 1
        ? { textStatus: "ok", text: "left words", artworks: [{ dataUrl: "data:image/png;base64,left" }] }
        : { textStatus: "uncertain", text: "do not keep this guess", artworks: [] };
    }
  });
  assert.equal(built.split, true);
  assert.equal(built.pages.length, 2);
  assert.equal(built.pages[0].text, "left words");
  assert.equal(built.pages[0].extractEngine, "pdf-craft");
  assert.equal(built.pages[1].text, "");
  assert.equal(built.pages[1].textStatus, "uncertain");
  const single = noisyTable(width, height);
  paintRect(single, width, 6, 8, 78, 34, [250, 247, 238]);
  paintRect(single, width, 12, 20, 6, 6, [180, 20, 40]);
  paintRect(single, width, 70, 20, 6, 6, [20, 70, 180]);
  const one = splitScanPages(single, width, height);
  assert.equal(one.split, false);
  assert.equal(one.pages.length, 1);
});

test("manuscript photos close the book and the chosen cover is not stuck on the first upload", () => {
  assert.equal(looksLikeManuscript("child-手稿.jpg"), true);
  assert.equal(looksLikeManuscript("drawing.jpg"), false);
  const pages = planBookPages({
    photos: [
      { id: "a", manuscript: false },
      { id: "b", manuscript: true },
      { id: "c", manuscript: false }
    ],
    coverId: "c",
    includeAuthor: true
  });
  assert.deepEqual(pages.map((page) => page.kind), ["cover", "author", "photo", "photo", "manuscript", "manuscript", "manuscript"]);
  assert.equal(pages[0].photoId, "c");
  assert.deepEqual(pages.filter((page) => page.kind === "manuscript").map((page) => page.photoId), ["a", "c", "b"]);
  assert.equal(pages.at(-1).kind, "manuscript");
});

test("a real under-18 portrait needs a parental signature; an illustrated avatar does not", () => {
  const blocked = avatarUseDecision({ mode: "photo", under18: true, adultName: "", signature: null });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "parental_signature_required");
  const namedOnly = avatarUseDecision({
    mode: "photo",
    under18: true,
    adultName: "Parent Yi",
    signature: { adultName: "Parent Yi", ink: false, dataUrl: "" }
  });
  assert.equal(namedOnly.allowed, false);
  const signed = avatarUseDecision({
    mode: "photo",
    under18: true,
    signature: {
      adultName: "Parent Yi",
      ink: true,
      dataUrl: "data:image/png;base64,iVBORw0KGgo=",
      signedAt: "2026-11-11T00:00:00.000Z",
      statement: "I am the parent or guardian and I agree to use this real photo of a person under 18 as the author portrait."
    }
  });
  assert.equal(signed.allowed, true);
  assert.equal(signed.record.adultName, "Parent Yi");
  assert.equal(Object.hasOwn(signed.record, "dataUrl"), false);
  const illustrated = avatarUseDecision({ mode: "illustrated", under18: true, signature: null });
  assert.equal(illustrated.allowed, true);
  assert.equal(illustrated.requiresSignature, false);
  const avatar = fill(4, 4, [40, 90, 200]);
  const shown = renderAuthorPreview({ width: 20, height: 28, avatar, avatarWidth: 4, avatarHeight: 4, allowed: true });
  const hidden = renderAuthorPreview({ width: 20, height: 28, avatar, avatarWidth: 4, avatarHeight: 4, allowed: false });
  assert.equal(shown.shown, true);
  assert.equal(hidden.shown, false);
  assert.equal(pixel(shown.rgba, 20, 10, 4)[2] > 150, true);
  assert.deepEqual(pixel(hidden.rgba, 20, 10, 4).slice(0, 3), PAPER);
  const cartoon = illustrateAvatar(avatar, 4, 4);
  assert.equal(cartoon.length, avatar.length);
  assert.equal(cartoon[3], 255);
});

test("a phone photo is scanned off the desk before recognition, and a failed scan is not published", async () => {
  const width = 80;
  const height = 60;
  const rgba = noisyTable(width, height);
  paintRect(rgba, width, 16, 8, 48, 44, [250, 248, 240]);
  paintRect(rgba, width, 30, 22, 12, 12, [200, 30, 40]);
  const scanned = scanArtwork(rgba, width, height);
  assert.equal(scanned.isolated, true);
  const corner = pixel(scanned.rgba, scanned.width, 1, 1);
  assert.ok(corner[0] > 190 && corner[1] > 190, `scan corner still looks like the desk: ${corner.join(",")}`);
  let calls = 0;
  const built = await pagesFromPhonePhoto({
    rgba,
    width,
    height,
    toPng: (pixels, scanWidth) => {
      const sample = pixel(pixels, scanWidth, 0, 0);
      assert.ok(sample[0] > 180, `OCR input still shows the desk: ${sample.join(",")}`);
      return "data:image/png;base64,scan";
    },
    extract: async () => {
      calls += 1;
      return { textStatus: "ok", text: "teh catt", artworks: [{ dataUrl: "data:image/png;base64,fig" }] };
    }
  });
  assert.equal(calls, 1);
  assert.equal(built.pages[0].scanIsolated, true);
  assert.equal(built.pages[0].text, "teh catt");
  assert.equal(built.pages[0].artworks[0].dataUrl, "data:image/png;base64,fig");

  let blocked = 0;
  const missed = await pagesFromPhonePhoto({
    rgba: noisyTable(width, height),
    width,
    height,
    toPng: () => "data:image/png;base64,desk",
    extract: async () => {
      blocked += 1;
      return { textStatus: "ok", text: "should not run" };
    }
  });
  assert.equal(blocked, 0);
  assert.equal(missed.pages[0].scanIsolated, false);
  assert.equal(missed.pages[0].scanDataUrl, "");
  assert.equal(missed.pages[0].marksDataUrl, "");
  assert.equal(missed.pages[0].extractReason, "scan_not_isolated");
});

test("system status copy is never painted, and uncertain OCR does not invent a caption", () => {
  const art = fill(30, 40, [200, 30, 40]);
  const base = {
    pageWidth: 154,
    pageHeight: 216,
    artworks: [{ rgba: art, width: 30, height: 40 }],
    text: STATUS_COPY,
    status: "uncertain"
  };
  const plain = paintRebuiltPage(base);
  const noted = paintRebuiltPage({ ...base, note: STATUS_COPY });
  assert.equal(plain.text, "");
  assert.equal(noted.text, "");
  assert.equal(noted.note, "");
  assert.deepEqual(noted.paintedText, []);
  assert.equal(JSON.stringify(noted.paintedText).includes("invented"), false);
  assert.deepEqual(Array.from(noted.rgba), Array.from(plain.rgba));
  assert.equal(typesetText({ text: "invented caption", status: "uncertain" }), "");
});

test("artwork stays contained, near-A5 sheets fill the safe area, and a square stays centered", () => {
  const wide = fill(40, 10, [200, 30, 40]);
  const widePage = paintRebuiltPage({
    pageWidth: 154,
    pageHeight: 216,
    artworks: [{ rgba: wide, width: 40, height: 10 }],
    status: "uncertain"
  });
  assert.equal(widePage.fit, "contain");
  assert.ok(Math.abs(widePage.placement.dw / widePage.placement.dh - 4) < 0.02);

  const sheet = fill(148, 210, [30, 90, 200]);
  const sheetPage = paintRebuiltPage({
    pageWidth: 154,
    pageHeight: 216,
    artworks: [{ rgba: sheet, width: 148, height: 210 }],
    status: "uncertain"
  });
  const frame = printSafeFrame(154, 216, 1);
  assert.ok(sheetPage.placement.dw >= frame.w * 0.98);
  assert.ok(sheetPage.placement.dh <= frame.h + 0.5);
  assert.equal(placementFillsPage(sheetPage.placement, 154, 216), false);

  const square = fill(80, 80, [180, 20, 40]);
  const squarePage = paintRebuiltPage({
    pageWidth: 154,
    pageHeight: 216,
    artworks: [{ rgba: square, width: 80, height: 80 }],
    status: "uncertain"
  });
  const box = squarePage.layout.art;
  const left = squarePage.placement.dx - box.x;
  const right = box.x + box.w - (squarePage.placement.dx + squarePage.placement.dw);
  const top = squarePage.placement.dy - box.y;
  const bottom = box.y + box.h - (squarePage.placement.dy + squarePage.placement.dh);
  assert.ok(Math.abs(left - right) < 1);
  assert.ok(Math.abs(top - bottom) < 1);
  assert.ok(Math.abs(squarePage.placement.dw / squarePage.placement.dh - 1) < 0.02);
});

test("uncertain OCR shows the cleaned scan once, and caption pages share one type measure", () => {
  const scan = fill(20, 30, [20, 70, 180]);
  const figure = fill(20, 10, [200, 30, 40]);
  const uncertain = paintRebuiltPage({
    pageWidth: 154,
    pageHeight: 216,
    artworks: [{ rgba: figure, width: 20, height: 10 }],
    marks: { rgba: scan, width: 20, height: 30 },
    text: "invented caption",
    status: "uncertain",
    note: STATUS_COPY
  });
  assert.equal(uncertain.text, "");
  assert.equal(uncertain.layout.marks, null);
  let sawRed = false;
  let sawBlue = false;
  for (let y = 0; y < 216; y += 1) {
    for (let x = 0; x < 154; x += 1) {
      const sample = pixel(uncertain.rgba, 154, x, y);
      if (sample[0] > 150 && sample[2] < 80) sawRed = true;
      if (sample[2] > 150 && sample[0] < 80) sawBlue = true;
    }
  }
  assert.equal(sawBlue, true);
  assert.equal(sawRed, false);

  const odd = layoutRebuiltPage({ pageWidth: 1819, pageHeight: 2551, artworkCount: 1, showText: true, pageNumber: 1 });
  const even = layoutRebuiltPage({ pageWidth: 1819, pageHeight: 2551, artworkCount: 1, showText: true, pageNumber: 2 });
  assert.equal(odd.caption.sizePt, 11);
  assert.equal(odd.caption.leading, 1.35);
  assert.equal(odd.caption.fontPx, even.caption.fontPx);
  assert.equal(odd.caption.leadingPx, even.caption.leadingPx);
  assert.ok(Math.abs(odd.text.w - even.text.w) < 0.01);
  const oddFrame = printSafeFrame(154, 216, 1);
  const evenFrame = printSafeFrame(154, 216, 2);
  assert.ok(oddFrame.x > evenFrame.x);
  assert.ok(Math.abs(oddFrame.w - evenFrame.w) < 0.01);

  const cover = paintCoverPage({
    pageWidth: 154,
    pageHeight: 216,
    artwork: { rgba: figure, width: 20, height: 10 }
  });
  assert.ok(cover.layout.art.h > 154 * 0.55);
  assert.ok(cover.layout.art.y + cover.layout.art.h <= cover.layout.title.y + 0.01);
  assert.ok(Math.abs(cover.placement.dw / cover.placement.dh - 2) < 0.02);
});

test("a clean scan keeps enough pixels for a 300 dpi A5 bleed page", () => {
  assert.ok(SCAN_MAX_EDGE >= Math.round(216 * 300 / 25.4) - 1);
  const width = 1800;
  const height = 1200;
  const rgba = fill(width, height, [250, 247, 238]);
  const scanned = scanArtwork(rgba, width, height);
  assert.equal(scanned.isolated, true);
  assert.equal(Math.max(scanned.width, scanned.height), 1800);
});

test("rotation is a 90 degree clockwise turn and the first photo can stay the cover", () => {
  const width = 2;
  const height = 1;
  const rgba = new Uint8ClampedArray([
    10, 0, 0, 255,
    20, 0, 0, 255
  ]);
  const turned = rotateQuarter(rgba, width, height, 1);
  assert.equal(turned.width, 1);
  assert.equal(turned.height, 2);
  assert.equal(turned.rgba[0], 20);
  assert.equal(turned.rgba[4], 10);
  const full = rotateQuarter(rgba, width, height, 4);
  assert.equal(full.width, 2);
  assert.equal(full.rgba[0], 10);
  assert.equal(full.rgba[4], 20);
  const pages = planBookPages({
    photos: [
      { id: "first", manuscript: true },
      { id: "later", manuscript: false }
    ],
    coverId: "first",
    includeAuthor: false
  });
  assert.equal(pages[0].kind, "cover");
  assert.equal(pages[0].photoId, "first");
  assert.equal(pages.some((page) => page.kind === "manuscript" && page.photoId === "later"), true);
});

function countColor(rgba, width, height, color, tolerance = 36) {
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (Math.abs(rgba[index] - color[0]) <= tolerance
        && Math.abs(rgba[index + 1] - color[1]) <= tolerance
        && Math.abs(rgba[index + 2] - color[2]) <= tolerance) count += 1;
    }
  }
  return count;
}

test("a full sheet keeps marks at all four edges, and a square page is letterboxed", () => {
  const width = 80;
  const height = 60;
  const rgba = noisyTable(width, height);
  paintRect(rgba, width, 10, 8, 60, 44, [250, 248, 240]);
  paintRect(rgba, width, 10, 8, 4, 4, [220, 20, 20]);
  paintRect(rgba, width, 66, 8, 4, 4, [20, 180, 40]);
  paintRect(rgba, width, 10, 48, 4, 4, [20, 40, 220]);
  paintRect(rgba, width, 66, 48, 4, 4, [230, 200, 20]);
  const scanned = scanArtwork(rgba, width, height);
  assert.equal(scanned.isolated, true);
  assert.equal(scanned.width, 60);
  assert.equal(scanned.height, 44);
  assert.ok(countColor(scanned.rgba, scanned.width, scanned.height, [220, 20, 20]) >= 8);
  assert.ok(countColor(scanned.rgba, scanned.width, scanned.height, [20, 180, 40]) >= 8);
  assert.ok(countColor(scanned.rgba, scanned.width, scanned.height, [20, 40, 220]) >= 8);
  assert.ok(countColor(scanned.rgba, scanned.width, scanned.height, [230, 200, 20]) >= 8);

  const laid = paintRebuiltPage({
    pageWidth: 154,
    pageHeight: 216,
    marks: scanned,
    artworks: [{ rgba: fill(12, 12, [255, 0, 0]), width: 12, height: 12 }],
    text: "teh catt",
    status: "ok",
    treatment: "original",
    title: "手稿"
  });
  assert.equal(laid.placement.sw, scanned.width);
  assert.equal(laid.placement.sh, scanned.height);
  assert.equal(laid.fit, "contain");
  assert.equal(placementFillsPage(laid.placement, 154, 216), false);
  assert.deepEqual(pixel(laid.rgba, 154, 0, 0).slice(0, 3), PAPER);
  assert.ok(countColor(laid.rgba, 154, 216, [220, 20, 20]) > 0);
  assert.ok(countColor(laid.rgba, 154, 216, [20, 180, 40]) > 0);
  assert.ok(countColor(laid.rgba, 154, 216, [20, 40, 220]) > 0);
  assert.ok(countColor(laid.rgba, 154, 216, [230, 200, 20]) > 0);
  assert.equal(countColor(laid.rgba, 154, 216, [255, 0, 0], 8), 0);

  const square = fill(40, 40, [250, 248, 240]);
  paintRect(square, 40, 0, 0, 6, 6, [220, 20, 20]);
  paintRect(square, 40, 34, 0, 6, 6, [20, 180, 40]);
  paintRect(square, 40, 0, 34, 6, 6, [20, 40, 220]);
  paintRect(square, 40, 34, 34, 6, 6, [230, 200, 20]);
  const squarePage = paintRebuiltPage({
    pageWidth: 154,
    pageHeight: 216,
    artworks: [{ rgba: square, width: 40, height: 40 }],
    status: "uncertain"
  });
  assert.equal(squarePage.placement.sw, 40);
  assert.equal(squarePage.placement.sh, 40);
  assert.ok(Math.abs(squarePage.placement.dw / squarePage.placement.dh - 1) < 0.02);
  assert.equal(placementFillsPage(squarePage.placement, 154, 216), false);
  assert.deepEqual(pixel(squarePage.rgba, 154, 0, 0).slice(0, 3), PAPER);
  assert.deepEqual(pixel(squarePage.rgba, 154, 153, 215).slice(0, 3), PAPER);
  assert.ok(countColor(squarePage.rgba, 154, 216, [220, 20, 20]) > 0);
  assert.ok(countColor(squarePage.rgba, 154, 216, [20, 180, 40]) > 0);
  assert.ok(countColor(squarePage.rgba, 154, 216, [20, 40, 220]) > 0);
  assert.ok(countColor(squarePage.rgba, 154, 216, [230, 200, 20]) > 0);
});

function paintPoly(rgba, width, height, points, color) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point.y))));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(...points.map((point) => point.y))));
  for (let y = minY; y <= maxY; y += 1) {
    const xs = [];
    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      if ((start.y <= y && end.y > y) || (end.y <= y && start.y > y)) {
        xs.push(start.x + (y - start.y) / (end.y - start.y) * (end.x - start.x));
      }
    }
    xs.sort((a, b) => a - b);
    for (let index = 0; index + 1 < xs.length; index += 2) {
      const x0 = Math.max(0, Math.ceil(xs[index]));
      const x1 = Math.min(width - 1, Math.floor(xs[index + 1]));
      for (let x = x0; x <= x1; x += 1) {
        const offset = (y * width + x) * 4;
        rgba[offset] = color[0];
        rgba[offset + 1] = color[1];
        rgba[offset + 2] = color[2];
        rgba[offset + 3] = 255;
      }
    }
  }
}

test("a keystone sheet is lifted off the desk, and a parent can move art inside the safe box", () => {
  const width = 160;
  const height = 120;
  const rgba = fill(width, height, [220, 220, 216]);
  paintRect(rgba, width, 2, 2, 40, 30, [252, 252, 248]);
  paintPoly(rgba, width, height, [{ x: 36, y: 22 }, { x: 128, y: 14 }, { x: 146, y: 102 }, { x: 24, y: 108 }], [242, 206, 48]);
  paintRect(rgba, width, 70, 48, 16, 16, [40, 140, 200]);
  paintRect(rgba, width, 130, 40, 28, 50, [230, 176, 150]);
  const scanned = scanArtwork(rgba, width, height);
  assert.equal(scanned.isolated, true);
  assert.ok(scanned.width < width - 8);
  assert.ok(scanned.height < height);
  assert.ok(countColor(scanned.rgba, scanned.width, scanned.height, [40, 140, 200], 50) > 40);
  assert.equal(countColor(scanned.rgba, scanned.width, scanned.height, [252, 252, 248], 4), 0);
  assert.ok(countColor(scanned.rgba, scanned.width, scanned.height, [230, 176, 150], 18) < 700);
  const corner = pixel(scanned.rgba, scanned.width, 0, 0);
  assert.ok(Math.abs(corner[0] - 220) > 12);

  const pageWidth = 140;
  const pageHeight = 110;
  const page = fill(pageWidth, pageHeight, [208, 208, 204]);
  paintRect(page, pageWidth, 6, 4, 34, 16, [252, 252, 250]);
  paintRect(page, pageWidth, 18, 20, 100, 78, [250, 248, 240]);
  paintRect(page, pageWidth, 36, 40, 40, 5, [15, 15, 15]);
  paintRect(page, pageWidth, 108, 36, 30, 48, [232, 180, 154]);
  const white = scanArtwork(page, pageWidth, pageHeight);
  assert.equal(white.isolated, true);
  assert.ok(white.width < pageWidth - 8);
  assert.ok(countColor(white.rgba, white.width, white.height, [15, 15, 15], 12) > 20);
  assert.ok(countColor(white.rgba, white.width, white.height, [232, 180, 154], 16) < 40);

  const box = { x: 10, y: 12, w: 100, h: 80 };
  const base = placeArt(40, 20, box, null);
  const moved = placeArt(40, 20, box, { x: 1, y: 1, scale: 0.5 });
  assert.ok(moved.dw < base.dw - 1);
  assert.ok(moved.dx >= box.x - 0.01);
  assert.ok(moved.dy >= box.y - 0.01);
  assert.ok(moved.dx + moved.dw <= box.x + box.w + 0.01);
  assert.ok(moved.dy + moved.dh <= box.y + box.h + 0.01);
  assert.deepEqual(placeArt(40, 20, box, { x: 0, y: 0, scale: 1 }), base);
});

test("sideways, upside-down, and tilted sheets are made upright without a second crop", () => {
  const width = 70;
  const height = 96;
  const rgba = noisyTable(width, height);
  paintRect(rgba, width, 12, 10, 46, 76, [250, 248, 240]);
  paintRect(rgba, width, 18, 24, 34, 3, [10, 10, 10]);
  paintRect(rgba, width, 18, 40, 34, 3, [10, 10, 10]);
  paintRect(rgba, width, 18, 56, 34, 3, [10, 10, 10]);
  const turned = rotateQuarter(rgba, width, height, 1);
  const upright = scanArtwork(turned.rgba, turned.width, turned.height);
  assert.equal(upright.turns, 1);
  let peak = 0;
  for (let y = 0; y < upright.height; y += 1) {
    let dark = 0;
    for (let x = 0; x < upright.width; x += 1) if (upright.rgba[(y * upright.width + x) * 4] < 40) dark += 1;
    if (dark > peak) peak = dark;
  }
  assert.ok(peak >= 30);

  const upside = noisyTable(80, 100);
  paintRect(upside, 80, 8, 8, 64, 84, [250, 248, 240]);
  paintRect(upside, 80, 16, 12, 48, 4, [10, 10, 10]);
  const flipped = scanArtwork(upside, 80, 100);
  assert.equal(flipped.turns, 2);
  let mass = 0;
  let darkCount = 0;
  for (let y = 0; y < flipped.height; y += 1) {
    for (let x = 0; x < flipped.width; x += 1) {
      if (flipped.rgba[(y * flipped.width + x) * 4] < 40) {
        mass += y;
        darkCount += 1;
      }
    }
  }
  assert.ok(darkCount > 0 && mass / darkCount > flipped.height * 0.6);

  const tilted = fill(120, 80, [250, 248, 240]);
  for (let x = 8; x < 112; x += 1) {
    const y = Math.round(18 + (x - 8) * 0.18);
    paintRect(tilted, 120, x, y, 1, 3, [10, 10, 10]);
  }
  const leveled = scanArtwork(tilted, 120, 80);
  assert.equal(leveled.isolated, true);
  assert.ok(Math.abs(leveled.skew) >= 3);
  let levelPeak = 0;
  let minY = leveled.height;
  let maxY = 0;
  for (let y = 0; y < leveled.height; y += 1) {
    let dark = 0;
    for (let x = 0; x < leveled.width; x += 1) {
      if (leveled.rgba[(y * leveled.width + x) * 4] < 40) {
        dark += 1;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (dark > levelPeak) levelPeak = dark;
  }
  assert.ok(levelPeak > 40);
  assert.ok(maxY - minY < 12);
});

test("interior style defaults to original artwork, keeps edits, and does not invent a caption", async () => {
  assert.equal(normalizeInteriorStyle(undefined), "original");
  assert.equal(normalizeInteriorStyle("polished"), "polished");
  assert.equal(normalizeInteriorStyle("cover"), "original");
  const kept = retainBookEdits({
    title: "春天",
    author: "小羽",
    coverId: "c",
    coverStyle: "typographic",
    photos: [{ id: "a", text: "家长改正", textEdited: true, textStatus: "parent", manuscript: false, scanDataUrl: "scan" }]
  }, "polished");
  assert.equal(kept.interiorStyle, "polished");
  assert.equal(kept.title, "春天");
  assert.equal(kept.author, "小羽");
  assert.equal(kept.coverId, "c");
  assert.equal(kept.coverStyle, "typographic");
  assert.equal(kept.photos[0].text, "家长改正");
  assert.equal(kept.photos[0].textEdited, true);
  const back = retainBookEdits(kept, "original");
  assert.equal(back.interiorStyle, "original");
  assert.equal(back.photos[0].text, "家长改正");
  const plan = planBookPages({ photos: kept.photos, coverId: kept.coverId, includeAuthor: false });
  assert.deepEqual(plan.map((page) => page.kind), ["cover", "photo", "manuscript"]);
  assert.equal(typesetText({ text: "invented caption", status: "uncertain" }), "");
  const fallbackSentence = "A polished illustration was not created, so this page keeps the straightened original artwork.";
  const painted = paintRebuiltPage({
    pageWidth: 80,
    pageHeight: 112,
    marks: { rgba: fill(20, 30, [20, 70, 180]), width: 20, height: 30 },
    text: fallbackSentence,
    status: "uncertain",
    note: fallbackSentence,
    manuscript: true,
    title: "手稿",
    treatment: "original"
  });
  assert.equal(painted.text, "");
  assert.deepEqual(painted.paintedText, ["手稿"]);
  assert.equal(JSON.stringify(painted.paintedText).includes("polished"), false);
  const failed = [{ scanDataUrl: "data:image/png;base64,aa", scanIsolated: true, textStatus: "uncertain", text: "guess" }];
  const result = await illustratePhotos(failed, {
    style: "polished",
    textFor: (photo) => (photo.textStatus === "ok" || photo.textEdited ? photo.text : ""),
    fetchImpl: async () => ({ ok: false, status: 501, json: async () => ({ reason: "illustration_not_configured" }) })
  });
  assert.equal(result.fallback, true);
  assert.equal(failed[0].polishStatus, "fallback");
  const art = interiorPageArt({
    treatment: "polished",
    scanUrl: "scan",
    polishedUrl: failed[0].polishedDataUrl,
    polishOk: failed[0].polishStatus === "ok"
  });
  assert.equal(art.url, "scan");
  assert.equal(art.fallback, true);
  assert.equal(art.treatment, "original");
});

test("a sheet splits into an art frame and a text layer, and uncertain OCR does not invent words", () => {
  const width = 80;
  const height = 120;
  const rgba = fill(width, height, [248, 244, 236]);
  paintRect(rgba, width, 8, 8, 64, 58, [30, 144, 220]);
  paintRect(rgba, width, 18, 20, 20, 16, [220, 40, 40]);
  paintRect(rgba, width, 12, 86, 28, 3, [20, 20, 20]);
  paintRect(rgba, width, 44, 86, 18, 3, [20, 20, 20]);
  paintRect(rgba, width, 12, 98, 40, 3, [20, 20, 20]);
  const segmented = segmentSheet(rgba, width, height);
  assert.equal(segmented.separated, true);
  assert.ok(segmented.artBox.y + segmented.artBox.h < 86);
  assert.ok(segmented.textBoxes[0].y >= 80);
  const layers = composeScanLayers({
    rgba,
    width,
    height,
    text: "teh catt",
    textStatus: "ok",
    blocks: [{ kind: "text", text: "a polished sentence", confidence: 1, box: { x: 0, y: 0.8, w: 0.4, h: 0.1 } }]
  });
  assert.equal(layers.separated, true);
  assert.equal(layers.lines.map((line) => line.text).join("\n"), "teh catt");
  const unsure = composeScanLayers({
    rgba,
    width,
    height,
    text: "invented caption",
    textStatus: "uncertain",
    blocks: [{ kind: "text", text: "invented caption", confidence: 0.2, box: { x: 0, y: 0.8, w: 0.5, h: 0.1 } }]
  });
  assert.equal(unsure.separated, false);
  assert.deepEqual(unsure.lines, []);
  const story = layoutRebuiltPage({ pageWidth: 154, pageHeight: 216, artworkCount: 1, showText: true, pageNumber: 1 });
  assert.ok(story.text.h > story.frame.h * 0.28);
  assert.ok(story.art.h > story.text.h);
  assert.equal(story.caption.sizePt, 11);
  assert.equal(story.caption.leading, 1.35);
});

test("proofreading proposes spelling and 错别字, waits for Accept, and leaves names alone", () => {
  const typo = proposeProofreading({ text: "teh catt sat", textStatus: "ok" });
  const spelling = typo.find((item) => item.category === "wording");
  assert.equal(spelling.altersWords, true);
  assert.equal(spelling.accepted, false);
  assert.equal(spelling.after, "the cat sat");
  const typoPhoto = { id: "typo", text: "teh catt sat", textStatus: "ok", manuscript: false, artOverrideUrl: "", scanDataUrl: "scan" };
  assert.equal(applyAssistantProposal(typoPhoto, spelling).applied, false);
  assert.equal(typoPhoto.text, "teh catt sat");
  assert.equal(typoPhoto.scanDataUrl, "scan");
  const acceptedTypo = applyAssistantProposal(typoPhoto, { ...spelling, accepted: true });
  assert.equal(acceptedTypo.applied, true);
  assert.equal(acceptedTypo.photo.text, "the cat sat");
  assert.equal(acceptedTypo.photo.textEdited, true);
  assert.equal(acceptedTypo.photo.artOverrideUrl || "", "");
  assert.equal(typoPhoto.text, "teh catt sat");
  assert.equal(typesetText({ text: "teh catt sat", status: "ok", manuscript: true }), "");
  assert.equal(typesetText({ text: acceptedTypo.photo.text, status: "parent", edited: true, manuscript: true }), "");
  const named = proposeProofreading({ text: "Zorblax sat with Bibble and the wuggle", textStatus: "ok" });
  assert.equal(named.some((item) => item.changed), false);
  const coined = proposeProofreading({ text: "bibble sat down", textStatus: "ok" });
  assert.equal(coined.some((item) => item.changed && item.altersWords), false);
  const madeUp = proposeProofreading({ text: "波波星和喵喵怪在玩", textStatus: "ok" });
  assert.equal(madeUp.some((item) => item.changed), false);
  const chineseTypo = proposeProofreading({ text: "小朋友因该回家", textStatus: "ok" }).find((item) => item.category === "wording");
  assert.equal(chineseTypo.after, "小朋友应该回家");
  assert.equal(chineseTypo.altersWords, true);
  assert.equal(applyAssistantProposal({ text: "小朋友因该回家", textStatus: "ok" }, chineseTypo).applied, false);
  const grammar = proposeProofreading({ text: "a apple sat", textStatus: "ok" }).find((item) => item.category === "wording");
  assert.equal(grammar.after, "an apple sat");
  assert.equal(grammar.altersWords, true);
  const adverb = proposeProofreading({ text: "小猫慢慢的走", textStatus: "ok" }).find((item) => item.category === "wording");
  assert.equal(adverb.after, "小猫慢慢地走");
  assert.equal(adverb.altersWords, true);
  const clear = proposeProofreading({ text: "the cat sat on the mat", textStatus: "ok" });
  assert.equal(clear.some((item) => item.changed), false);
  const photo = { id: "p", text: "the the cat", textStatus: "ok", textEdited: false };
  const wording = proposeProofreading({ text: photo.text, textStatus: "ok" }).find((item) => item.category === "wording");
  assert.equal(wording.altersWords, true);
  assert.equal(wording.after, "the cat");
  assert.equal(applyAssistantProposal(photo, wording).applied, false);
  assert.equal(photo.text, "the the cat");
  const dismissed = dismissAssistantProposal(photo, wording);
  assert.equal(dismissed.applied, false);
  assert.equal(dismissed.photo.text, "the the cat");
  const accepted = applyAssistantProposal(photo, { ...wording, accepted: true });
  assert.equal(accepted.applied, true);
  assert.equal(accepted.photo.text, "the cat");
  assert.equal(accepted.photo.textEdited, true);
  assert.equal(photo.text, "the the cat");
  const punctPhoto = { text: "hello , cat", textStatus: "ok" };
  const punct = proposeProofreading({ text: punctPhoto.text, textStatus: "ok" }).find((item) => item.category === "punctuation");
  assert.equal(punct.altersWords, false);
  assert.equal(punct.after, "hello, cat");
  assert.equal(applyAssistantProposal(punctPhoto, punct).applied, false);
  assert.equal(punctPhoto.text, "hello , cat");
  const chinese = proposeProofreading({ text: "妈妈看着小猫小猫", textStatus: "ok" });
  assert.equal(chinese.some((item) => item.after === "妈妈看着小猫"), true);
  assert.equal(chinese.some((item) => item.before === "妈妈" || item.after === "妈"), false);
  const quote = proposeProofreading({ text: "“小猫坐在月亮上", textStatus: "ok" }).find((item) => item.category === "punctuation");
  assert.equal(quote.after, "“小猫坐在月亮上”");
  assert.equal(quote.altersWords, false);
  const uncertain = proposeProofreading({ text: "guessed sentence", textStatus: "uncertain" });
  assert.equal(uncertain.length, 1);
  assert.equal(uncertain[0].category, "confirm");
  const unreadTypo = proposeProofreading({ text: "teh cat", textStatus: "uncertain" });
  assert.equal(unreadTypo.some((item) => String(item.after).includes("the cat")), false);
  assert.equal(uncertain[0].before, "");
  assert.equal(uncertain[0].after, "");
  const confirmed = applyAssistantProposal({ text: "", textStatus: "uncertain" }, { ...uncertain[0], accepted: true });
  assert.equal(confirmed.applied, true);
  assert.equal(confirmed.photo.text, "");
  assert.equal(confirmed.acceptance.accepted, true);
  const low = proposeProofreading({
    text: "teh catt",
    textStatus: "ok",
    lines: [{ text: "teh catt", confidence: 0.4 }]
  });
  const confirm = low.find((item) => item.category === "confirm");
  assert.equal(confirm.before, "teh catt");
  assert.equal(confirm.after, "teh catt");
  assert.equal(confirm.changed, false);
  const kept = storyArtSources({
    manuscript: true,
    treatment: "original",
    scanUrl: "sheet",
    artworks: [{ dataUrl: "figure" }],
    layersSeparated: true
  });
  assert.equal(kept.marksUrl, "sheet");
  assert.equal(kept.separated, false);
  const spread = storyArtSources({
    manuscript: false,
    treatment: "original",
    scanUrl: "sheet",
    artworks: [{ dataUrl: "figure" }],
    layersSeparated: true
  });
  assert.deepEqual(spread.urls, ["figure"]);
  assert.equal(spread.separated, true);
});

test("an accepted art cleanup stays after a style switch and can be the cover", () => {
  const photo = { id: "a", scanDataUrl: "scan", scanIsolated: true, artSource: "", artOverrideUrl: "" };
  const other = { id: "b", scanDataUrl: "scan", scanIsolated: true, polishedDataUrl: "data:image/png;base64,cccc", polishStatus: "ok", artSource: "" };
  const accepted = applyAssistantProposal(photo, {
    id: "art-1",
    kind: "art",
    changed: true,
    accepted: true,
    imageDataUrl: "data:image/png;base64,aaaa"
  });
  assert.equal(accepted.applied, true);
  assert.equal(photo.artSource, "");
  assert.equal(photo.artOverrideUrl, "");
  const kept = retainBookEdits({
    title: "春天",
    author: "小羽",
    coverId: "a",
    photos: [accepted.photo, other]
  }, "polished");
  applyInteriorStyleArt(kept.photos);
  assert.equal(kept.interiorStyle, "polished");
  assert.equal(kept.photos[0].artSource, "accepted");
  assert.equal(kept.photos[0].artOverrideUrl, "data:image/png;base64,aaaa");
  assert.equal(kept.photos[1].artSource, "style");
  assert.equal(kept.photos[1].artOverrideUrl || "", "");
  const art = interiorPageArt({
    treatment: "polished",
    scanUrl: kept.photos[0].scanDataUrl,
    polishedUrl: "data:image/png;base64,bbbb",
    polishOk: true,
    artOverrideUrl: kept.photos[0].artOverrideUrl,
    artSource: kept.photos[0].artSource
  });
  assert.equal(art.treatment, "accepted");
  assert.equal(art.url, "data:image/png;base64,aaaa");
  const plain = interiorPageArt({
    treatment: "polished",
    scanUrl: kept.photos[1].scanDataUrl,
    polishedUrl: kept.photos[1].polishedDataUrl,
    polishOk: kept.photos[1].polishStatus === "ok",
    artOverrideUrl: kept.photos[1].artOverrideUrl,
    artSource: kept.photos[1].artSource
  });
  assert.equal(plain.treatment, "polished");
  assert.equal(plain.url, "data:image/png;base64,cccc");
  assert.equal(coverHeroSource(kept.photos[0], "original"), "data:image/png;base64,aaaa");
  assert.equal(coverHeroSource(kept.photos[1], "polished"), "data:image/png;base64,cccc");
});
