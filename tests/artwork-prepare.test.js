const assert = require("node:assert/strict");
const test = require("node:test");
const {
  PAPER,
  avatarUseDecision,
  compositeOntoPaper,
  illustrateAvatar,
  interpretPdfCraftResponse,
  looksLikeManuscript,
  pagesFromPhonePhoto,
  paintFullBleed,
  paintRebuiltPage,
  placementFillsPage,
  planBookPages,
  prepareArtwork,
  renderAuthorPreview,
  splitScanPages,
  typesetText
} = require("../artwork-prepare");

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
  assert.deepEqual(pages.map((page) => page.kind), ["cover", "author", "photo", "photo", "manuscript"]);
  assert.equal(pages[0].photoId, "c");
  assert.equal(pages.at(-1).photoId, "b");
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
