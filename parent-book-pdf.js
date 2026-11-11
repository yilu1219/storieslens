const { PDFDocument, rgb } = require("pdf-lib");

const A5_WIDTH_MM = 148;
const A5_HEIGHT_MM = 210;
const BLEED_MM = 3;
const BLEED_WIDTH_MM = A5_WIDTH_MM + BLEED_MM * 2;
const BLEED_HEIGHT_MM = A5_HEIGHT_MM + BLEED_MM * 2;
const MM_TO_PT = 72 / 25.4;
const A5_WIDTH_PT = A5_WIDTH_MM * MM_TO_PT;
const A5_HEIGHT_PT = A5_HEIGHT_MM * MM_TO_PT;
const BLEED_PT = BLEED_MM * MM_TO_PT;
const BLEED_WIDTH_PT = BLEED_WIDTH_MM * MM_TO_PT;
const BLEED_HEIGHT_PT = BLEED_HEIGHT_MM * MM_TO_PT;
const CREAM = rgb(0xf6 / 255, 0xf0 / 255, 0xe4 / 255);
const MAX_PAGES = 24;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function cleanFilename(value) {
  return String(value || "storieslens-book")
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9\u3400-\u9fff_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "storieslens-book";
}

function parseImageDataUrl(value) {
  const match = String(value || "").match(/^data:(image\/(?:jpeg|jpg|png));base64,([a-zA-Z0-9+/=\s]+)$/i);
  if (!match) return null;
  const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
  return { mimeType, buffer };
}

function isJpeg(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
}

function isPng(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 8 && buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG";
}

function normalizeImageInput(page) {
  if (page && Buffer.isBuffer(page.buffer) && page.buffer.length) {
    if (page.buffer.length > MAX_IMAGE_BYTES) return null;
    if (isPng(page.buffer)) return { mimeType: "image/png", buffer: page.buffer };
    if (isJpeg(page.buffer)) return { mimeType: "image/jpeg", buffer: page.buffer };
    return null;
  }
  return parseImageDataUrl(page?.imageDataUrl);
}

async function embedImage(pdf, image) {
  if (image.mimeType === "image/png") return pdf.embedPng(image.buffer);
  if (image.mimeType === "image/jpeg") return pdf.embedJpg(image.buffer);
  throw Object.assign(new Error("unsupported_image"), { statusCode: 400 });
}

function fitRect(imageWidth, imageHeight, boxWidth, boxHeight) {
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    x: (boxWidth - width) / 2,
    y: (boxHeight - height) / 2
  };
}

function applyPrintBoxes(pdfPage) {
  pdfPage.setMediaBox(0, 0, BLEED_WIDTH_PT, BLEED_HEIGHT_PT);
  pdfPage.setBleedBox(0, 0, BLEED_WIDTH_PT, BLEED_HEIGHT_PT);
  pdfPage.setTrimBox(BLEED_PT, BLEED_PT, A5_WIDTH_PT, A5_HEIGHT_PT);
}

function boxRecord(box) {
  if (!box) return null;
  return {
    xPt: box.x,
    yPt: box.y,
    widthPt: box.width,
    heightPt: box.height,
    widthMm: box.width / MM_TO_PT,
    heightMm: box.height / MM_TO_PT
  };
}

async function buildParentBookPdf({ pages = [], title = "", childName = "", language = "zh", marginMm = 0, filenameHint = "", preview = false } = {}) {
  if (!Array.isArray(pages) || !pages.length) {
    throw Object.assign(new Error("pages_required"), { statusCode: 400 });
  }
  if (pages.length > MAX_PAGES) {
    throw Object.assign(new Error("too_many_pages"), { statusCode: 400 });
  }

  const pdf = await PDFDocument.create();
  const bookTitle = String(title || "").trim() || (language === "en" ? "Our Family Book" : "我们的家庭绘本");
  pdf.setTitle(bookTitle);
  pdf.setAuthor(String(childName || "").trim() || "StoriesLens");
  pdf.setCreator(preview ? "StoriesLens Informal Preview" : "StoriesLens Parent Book");
  pdf.setProducer("StoriesLens");
  pdf.setLanguage(language === "en" ? "en" : "zh-CN");
  if (preview) {
    pdf.setSubject("StoriesLens informal preview. Not an official paid PDF. 非正式预览");
    pdf.setKeywords(["preview", "informal", "预览"]);
  }

  const margin = Number(marginMm) > 0 ? Number(marginMm) * MM_TO_PT : 0;
  const imageBoxWidth = Math.max(1, BLEED_WIDTH_PT - margin * 2);
  const imageBoxHeight = Math.max(1, BLEED_HEIGHT_PT - margin * 2);

  for (const page of pages) {
    const imageInput = normalizeImageInput(page);
    if (!imageInput) {
      throw Object.assign(new Error("invalid_image"), { statusCode: 400 });
    }
    const pdfPage = pdf.addPage([BLEED_WIDTH_PT, BLEED_HEIGHT_PT]);
    applyPrintBoxes(pdfPage);
    const image = await embedImage(pdf, imageInput);
    const pageAspect = imageBoxWidth / imageBoxHeight;
    const imageAspect = image.width / image.height;
    const matchesPage = Math.abs(imageAspect - pageAspect) / pageAspect < 0.01;
    if (matchesPage) {
      pdfPage.drawImage(image, {
        x: margin,
        y: margin,
        width: imageBoxWidth,
        height: imageBoxHeight
      });
    } else {
      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width: BLEED_WIDTH_PT,
        height: BLEED_HEIGHT_PT,
        color: CREAM
      });
      const fitted = fitRect(image.width, image.height, imageBoxWidth, imageBoxHeight);
      pdfPage.drawImage(image, {
        x: margin + fitted.x,
        y: margin + fitted.y,
        width: fitted.width,
        height: fitted.height
      });
    }
  }

  const bytes = await pdf.save({ useObjectStreams: false });
  return {
    buffer: Buffer.from(bytes),
    filename: `${cleanFilename(filenameHint || bookTitle)}.pdf`,
    pageCount: pages.length,
    pageSize: {
      widthPt: BLEED_WIDTH_PT,
      heightPt: BLEED_HEIGHT_PT,
      widthMm: BLEED_WIDTH_MM,
      heightMm: BLEED_HEIGHT_MM,
      trimWidthPt: A5_WIDTH_PT,
      trimHeightPt: A5_HEIGHT_PT,
      trimWidthMm: A5_WIDTH_MM,
      trimHeightMm: A5_HEIGHT_MM,
      bleedMm: BLEED_MM
    },
    preview: preview === true,
    official: preview !== true,
    paid: false
  };
}

async function buildInformalPreviewPdf(options = {}) {
  const filenameHint = options.filenameHint || `${options.title || "storieslens"}-preview`;
  return buildParentBookPdf({ ...options, filenameHint, preview: true });
}

async function readPdfPageSize(buffer) {
  const pdf = await PDFDocument.load(buffer);
  const pages = pdf.getPages();
  if (!pages.length) return null;
  const page = pages[0];
  const { width, height } = page.getSize();
  const media = page.getMediaBox();
  const trim = page.getTrimBox();
  const bleed = page.getBleedBox();
  return {
    pageCount: pages.length,
    widthPt: width,
    heightPt: height,
    widthMm: width / MM_TO_PT,
    heightMm: height / MM_TO_PT,
    media: boxRecord(media),
    trim: boxRecord(trim),
    bleed: boxRecord(bleed)
  };
}

function isA5TrimBox(size, tolerancePt = 0.5) {
  if (!size?.trim) return false;
  return Math.abs(size.trim.widthPt - A5_WIDTH_PT) <= tolerancePt
    && Math.abs(size.trim.heightPt - A5_HEIGHT_PT) <= tolerancePt
    && Math.abs(size.trim.xPt - BLEED_PT) <= tolerancePt
    && Math.abs(size.trim.yPt - BLEED_PT) <= tolerancePt;
}

function isPrintReadyPageSize(size, tolerancePt = 0.5) {
  if (!size) return false;
  const mediaMatches = Math.abs(size.widthPt - BLEED_WIDTH_PT) <= tolerancePt
    && Math.abs(size.heightPt - BLEED_HEIGHT_PT) <= tolerancePt;
  const bleedMatches = size.bleed
    && Math.abs(size.bleed.widthPt - BLEED_WIDTH_PT) <= tolerancePt
    && Math.abs(size.bleed.heightPt - BLEED_HEIGHT_PT) <= tolerancePt
    && Math.abs(size.bleed.xPt) <= tolerancePt
    && Math.abs(size.bleed.yPt) <= tolerancePt;
  return mediaMatches && bleedMatches && isA5TrimBox(size, tolerancePt);
}

function isA5PageSize(size, tolerancePt = 0.5) {
  return isPrintReadyPageSize(size, tolerancePt);
}

module.exports = {
  A5_HEIGHT_MM,
  A5_HEIGHT_PT,
  A5_WIDTH_MM,
  A5_WIDTH_PT,
  BLEED_HEIGHT_MM,
  BLEED_HEIGHT_PT,
  BLEED_MM,
  BLEED_PT,
  BLEED_WIDTH_MM,
  BLEED_WIDTH_PT,
  MAX_IMAGE_BYTES,
  MAX_PAGES,
  MM_TO_PT,
  buildInformalPreviewPdf,
  buildParentBookPdf,
  cleanFilename,
  isA5PageSize,
  isA5TrimBox,
  isPrintReadyPageSize,
  parseImageDataUrl,
  readPdfPageSize
};
