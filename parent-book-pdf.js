const { PDFDocument } = require("pdf-lib");

const A5_WIDTH_MM = 148;
const A5_HEIGHT_MM = 210;
const MM_TO_PT = 72 / 25.4;
const A5_WIDTH_PT = A5_WIDTH_MM * MM_TO_PT;
const A5_HEIGHT_PT = A5_HEIGHT_MM * MM_TO_PT;
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

async function buildParentBookPdf({ pages = [], title = "", childName = "", language = "zh", marginMm = 0, filenameHint = "" } = {}) {
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
  pdf.setCreator("StoriesLens Parent Book");
  pdf.setProducer("StoriesLens");
  pdf.setLanguage(language === "en" ? "en" : "zh-CN");

  const margin = Number(marginMm) > 0 ? Number(marginMm) * MM_TO_PT : 0;

  for (const page of pages) {
    const imageInput = normalizeImageInput(page);
    if (!imageInput) {
      throw Object.assign(new Error("invalid_image"), { statusCode: 400 });
    }
    const pdfPage = pdf.addPage([A5_WIDTH_PT, A5_HEIGHT_PT]);
    const image = await embedImage(pdf, imageInput);
    const boxWidth = A5_WIDTH_PT - margin * 2;
    const boxHeight = A5_HEIGHT_PT - margin * 2;
    const fitted = fitRect(image.width, image.height, boxWidth, boxHeight);
    pdfPage.drawImage(image, {
      x: margin + fitted.x,
      y: margin + fitted.y,
      width: fitted.width,
      height: fitted.height
    });
  }

  const bytes = await pdf.save({ useObjectStreams: false });
  return {
    buffer: Buffer.from(bytes),
    filename: `${cleanFilename(filenameHint || bookTitle)}.pdf`,
    pageCount: pages.length,
    pageSize: {
      widthPt: A5_WIDTH_PT,
      heightPt: A5_HEIGHT_PT,
      widthMm: A5_WIDTH_MM,
      heightMm: A5_HEIGHT_MM
    }
  };
}

async function readPdfPageSize(buffer) {
  const pdf = await PDFDocument.load(buffer);
  const pages = pdf.getPages();
  if (!pages.length) return null;
  const { width, height } = pages[0].getSize();
  return {
    pageCount: pages.length,
    widthPt: width,
    heightPt: height,
    widthMm: width / MM_TO_PT,
    heightMm: height / MM_TO_PT
  };
}

function isA5PageSize(size, tolerancePt = 0.5) {
  if (!size) return false;
  return Math.abs(size.widthPt - A5_WIDTH_PT) <= tolerancePt
    && Math.abs(size.heightPt - A5_HEIGHT_PT) <= tolerancePt;
}

module.exports = {
  A5_HEIGHT_MM,
  A5_HEIGHT_PT,
  A5_WIDTH_MM,
  A5_WIDTH_PT,
  MAX_IMAGE_BYTES,
  MAX_PAGES,
  MM_TO_PT,
  buildParentBookPdf,
  cleanFilename,
  isA5PageSize,
  parseImageDataUrl,
  readPdfPageSize
};
