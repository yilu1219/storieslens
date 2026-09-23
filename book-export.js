const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const JSZip = require("jszip");
const {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  LineRuleType,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
  convertMillimetersToTwip
} = require("docx");

const CN_FONT = "方正书宋_GBK";
const LATIN_FONT = "Times New Roman";
const A5_WIDTH_MM = 148;
const A5_HEIGHT_MM = 210;
const MARGIN_MM = 18;

async function patchEastAsiaFont(zip, fontName, { forceAllScripts = false } = {}) {
  const xmlPaths = Object.keys(zip.files).filter((entry) => /^word\/.+\.xml$/i.test(entry) && !zip.files[entry].dir);
  await Promise.all(xmlPaths.map(async (entry) => {
    const file = zip.file(entry);
    if (!file) return;
    const xml = await file.async("string");
    let patched = xml
      .replace(/w:eastAsia="Times New Roman"/g, `w:eastAsia="${fontName}"`)
      .replaceAll(CN_FONT, fontName);
    if (forceAllScripts) {
      patched = patched.replaceAll("Times New Roman", fontName);
    }
    if (patched !== xml) zip.file(entry, patched);
  }));
}

function cleanFilename(value) {
  return String(value || "storieslens-book")
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9\u3400-\u9fff_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "storieslens-book";
}

function imageType(mimeType) {
  const normalized = String(mimeType || "").split(";")[0].toLowerCase();
  if (normalized === "image/png") return "png";
  if (["image/jpeg", "image/jpg"].includes(normalized)) return "jpg";
  if (normalized === "image/gif") return "gif";
  if (normalized === "image/bmp") return "bmp";
  return "";
}

function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (!length) break;
    offset += 2 + length;
  }
  return null;
}

function imageDimensions(buffer, type) {
  return type === "png" ? pngSize(buffer) : type === "jpg" ? jpegSize(buffer) : null;
}

function fittedImageSize(buffer, type) {
  const source = imageDimensions(buffer, type) || { width: 4, height: 3 };
  const maxWidth = 378;
  const maxHeight = 472;
  const scale = Math.min(maxWidth / source.width, maxHeight / source.height, 1);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale))
  };
}

function fittedCoverImageSize(buffer, type) {
  const source = imageDimensions(buffer, type) || { width: 4, height: 5 };
  const maxWidth = 330;
  const maxHeight = 290;
  const scale = Math.min(maxWidth / source.width, maxHeight / source.height, 1);
  return { width: Math.max(1, Math.round(source.width * scale)), height: Math.max(1, Math.round(source.height * scale)) };
}

function authorNames(project) {
  const credits = Array.isArray(project.clientSnapshot?.credits) ? project.clientSnapshot.credits : [];
  const names = [...new Set(credits.map((item) => String(item?.authorName || "").trim()).filter(Boolean))];
  const soloAuthor = String(project.clientSnapshot?.authorProfile?.name || "").trim();
  if (!names.length && soloAuthor) names.push(soloAuthor);
  return names;
}

function pageSetup(start) {
  return {
    size: {
      width: convertMillimetersToTwip(A5_WIDTH_MM),
      height: convertMillimetersToTwip(A5_HEIGHT_MM),
      orientation: PageOrientation.PORTRAIT
    },
    margin: {
      top: convertMillimetersToTwip(MARGIN_MM),
      right: convertMillimetersToTwip(MARGIN_MM),
      bottom: convertMillimetersToTwip(MARGIN_MM),
      left: convertMillimetersToTwip(MARGIN_MM),
      header: convertMillimetersToTwip(8),
      footer: convertMillimetersToTwip(8)
    },
    ...(start ? { pageNumbers: { start } } : {})
  };
}

function footer() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: LATIN_FONT, size: 20, color: "655F57" })]
    })]
  });
}

function textParagraphs(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((text) => new Paragraph({
      style: "Biography Body",
      children: [new TextRun({ text })]
    }));
}

async function buildBookDocx(project, { loadImage } = {}) {
  const language = project.language === "zh" ? "zh" : "en";
  const names = authorNames(project);
  const byline = names.join(language === "zh" ? "、" : ", ") || (language === "zh" ? "StoriesLens 创作者" : "StoriesLens Creators");
  const scenes = Array.isArray(project.scenes) && project.scenes.length
    ? project.scenes
    : [{ title: project.title, text: project.draft || project.sourceText || "" }];

  let coverImageParagraph = null;
  if (loadImage && project.coverImageUrl) {
    const image = await loadImage(project.coverImageUrl).catch(() => null);
    const type = imageType(image?.mimeType);
    if (image?.buffer?.length && type) {
      coverImageParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        spacing: { after: 180 },
        children: [new ImageRun({
          data: image.buffer,
          type,
          transformation: fittedCoverImageSize(image.buffer, type),
          altText: { title: project.title, description: language === "zh" ? "故事封面" : "Story cover", name: "book-cover" }
        })]
      });
    }
  }

  const coverChildren = [
    new Paragraph({ text: "" }),
    new Paragraph({ style: "Biography Cover Meta", text: "STORIESLENS · 光年传记版式" }),
    ...(coverImageParagraph ? [coverImageParagraph] : Array.from({ length: 3 }, () => new Paragraph({ text: "" }))),
    new Paragraph({ style: "Biography Cover Title", text: language === "zh" ? `《${project.title}》` : project.title }),
    new Paragraph({ style: "Biography Cover Meta", text: language === "zh" ? `作者 · ${byline}` : `Written by ${byline}` }),
    new Paragraph({ style: "Biography Cover Motto", text: language === "zh" ? "从一份原创出发，写成属于自己的故事世界。" : "From something you made to a story world of your own." })
  ];

  const bodyChildren = [];
  const authorProfile = project.clientSnapshot?.authorProfile || {};
  if (authorProfile.bio || authorProfile.photoUrl) {
    bodyChildren.push(new Paragraph({ style: "Biography Chapter", text: language === "zh" ? "关于作者" : "About the Author" }));
    if (loadImage && authorProfile.photoUrl) {
      const image = await loadImage(authorProfile.photoUrl).catch(() => null);
      const type = imageType(image?.mimeType);
      if (image?.buffer?.length && type) {
        bodyChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { after: 220 },
          children: [new ImageRun({
            data: image.buffer,
            type,
            transformation: fittedCoverImageSize(image.buffer, type),
            altText: { title: authorProfile.name || byline, description: language === "zh" ? "作者照片" : "Author photo", name: "about-the-author" }
          })]
        }));
      }
    }
    bodyChildren.push(...textParagraphs(authorProfile.bio || ""));
    bodyChildren.push(new Paragraph({ style: "Biography Caption", text: language === "zh" ? `作者 · ${authorProfile.name || byline}` : `Author · ${authorProfile.name || byline}` }));
  }
  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index] || {};
    const chapterTitle = scene.title || (language === "zh" ? `第 ${index + 1} 章` : `Chapter ${index + 1}`);
    bodyChildren.push(new Paragraph({ style: "Biography Chapter", text: chapterTitle }));
    if (loadImage && scene.imageUrl) {
      const image = await loadImage(scene.imageUrl).catch(() => null);
      const type = imageType(image?.mimeType);
      if (image?.buffer?.length && type) {
        bodyChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { after: 140 },
          children: [new ImageRun({
            data: image.buffer,
            type,
            transformation: fittedImageSize(image.buffer, type),
            altText: { title: chapterTitle, description: language === "zh" ? "故事插图" : "Story illustration", name: `scene-${index + 1}` }
          })]
        }));
      }
    }
    const paragraphs = textParagraphs(scene.text || scene.caption || "");
    bodyChildren.push(...(paragraphs.length ? paragraphs : [new Paragraph({ style: "Biography Body", text: language === "zh" ? "本章正在创作中。" : "This chapter is still being created." })]));
    const credit = names[index] || String(chapterTitle).split("·").at(-1)?.trim() || byline;
    bodyChildren.push(new Paragraph({
      style: "Biography Caption",
      text: `${language === "zh" ? "本章创作者" : "Created by"} · ${credit}`
    }));
  }

  const document = new Document({
    creator: "StoriesLens",
    title: project.title,
    description: language === "zh" ? "StoriesLens A5 可编辑故事书" : "StoriesLens editable A5 story book",
    settings: { updateFields: true },
    styles: {
      default: {
        document: {
          run: { font: LATIN_FONT, size: 28 },
          paragraph: { spacing: { line: 576, lineRule: LineRuleType.AUTO, after: 80 } }
        }
      },
      paragraphStyles: [
        {
          id: "Biography Body", name: "Biography Body", basedOn: "Normal", next: "Biography Body", quickFormat: true,
          run: { font: { name: LATIN_FONT, eastAsia: CN_FONT }, size: 28, color: "171B19" },
          paragraph: { indent: { firstLine: 560 }, spacing: { line: 576, lineRule: LineRuleType.AUTO, after: 80 }, widowControl: true }
        },
        {
          id: "Biography Chapter", name: "Biography Chapter", basedOn: "Heading1", next: "Biography Body", quickFormat: true,
          run: { font: { name: LATIN_FONT, eastAsia: CN_FONT }, size: 44, color: "111A17" },
          paragraph: { alignment: AlignmentType.CENTER, pageBreakBefore: true, keepNext: true, spacing: { before: 260, after: 360 } }
        },
        {
          id: "Biography Cover Title", name: "Biography Cover Title", basedOn: "Title", next: "Biography Cover Meta", quickFormat: true,
          run: { font: { name: LATIN_FONT, eastAsia: CN_FONT }, size: 60, color: "172A24" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 180, after: 300 }, keepNext: true }
        },
        {
          id: "Biography Cover Meta", name: "Biography Cover Meta", basedOn: "Normal", next: "Biography Cover Meta", quickFormat: true,
          run: { font: { name: LATIN_FONT, eastAsia: CN_FONT }, size: 28, color: "6E5B4F" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 180 }, keepNext: true }
        },
        {
          id: "Biography Cover Motto", name: "Biography Cover Motto", basedOn: "Normal", next: "Biography Cover Motto", quickFormat: true,
          run: { font: { name: LATIN_FONT, eastAsia: CN_FONT }, size: 24, italics: true, color: "49655A" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 480 }, keepNext: true }
        },
        {
          id: "Biography Caption", name: "Biography Caption", basedOn: "Normal", next: "Biography Body", quickFormat: true,
          run: { font: { name: LATIN_FONT, eastAsia: CN_FONT }, size: 20, color: "74665D" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 100, after: 220 }, keepLines: true }
        }
      ]
    },
    sections: [
      {
        properties: { page: pageSetup(), titlePage: true },
        children: coverChildren
      },
      {
        properties: { type: SectionType.NEXT_PAGE, page: pageSetup(1) },
        footers: { default: footer() },
        children: bodyChildren
      }
    ]
  });

  const packed = await Packer.toBuffer(document);
  const zip = await JSZip.loadAsync(packed);
  await patchEastAsiaFont(zip, CN_FONT);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return {
    buffer,
    filename: `${cleanFilename(project.title)}.docx`,
    fontNotice: "方正书宋_GBK is named in the Word styles. Final print devices need a licensed copy; otherwise Word will substitute an available CJK serif font."
  };
}

function resolveLibreOfficeBinary() {
  const configured = String(process.env.LIBREOFFICE_BIN || "").trim();
  const candidates = [
    configured,
    "/usr/bin/libreoffice",
    "/usr/bin/soffice",
    "/opt/homebrew/bin/libreoffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/Users/december1219/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/soffice"
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function pdfCjkFont() {
  const configured = String(process.env.PDF_CJK_FONT || "").trim();
  if (configured) return configured;
  if (process.platform === "darwin" && fs.existsSync("/System/Library/Fonts/Supplemental/Songti.ttc")) return "Songti SC";
  return "Noto Serif CJK SC";
}

async function docxForPdf(docxBuffer) {
  const zip = await JSZip.loadAsync(docxBuffer);
  await patchEastAsiaFont(zip, pdfCjkFont(), { forceAllScripts: true });
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

function run(binary, args, cwd) {
  return new Promise((resolve, reject) => {
    const fontPaths = [
      String(process.env.SAL_FONTPATH || "").trim(),
      process.platform === "darwin" ? "/System/Library/Fonts" : "",
      process.platform === "darwin" ? "/System/Library/Fonts/Supplemental" : "",
      process.platform === "darwin" ? "/Library/Fonts" : ""
    ].filter(Boolean);
    const child = spawn(binary, args, {
      cwd,
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, ...(fontPaths.length ? { SAL_FONTPATH: fontPaths.join(path.delimiter) } : {}) }
    });
    let logs = "";
    child.stderr.on("data", (chunk) => { logs = `${logs}${chunk}`.slice(-12_000); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(logs.slice(-2500) || `LibreOffice exited with code ${code}.`)));
  });
}

async function convertDocxToPdf(root, docxBuffer, filename) {
  const binary = resolveLibreOfficeBinary();
  if (!binary) throw Object.assign(new Error("PDF export is temporarily unavailable because the private document renderer is not installed."), { statusCode: 503, code: "PDF_RENDERER_NOT_CONFIGURED" });
  const exportRoot = path.join(root, ".data", "document-exports");
  const workingDirectory = path.join(exportRoot, crypto.randomUUID());
  fs.mkdirSync(workingDirectory, { recursive: true, mode: 0o700 });
  const docxPath = path.join(workingDirectory, "book.docx");
  const profilePath = path.join(workingDirectory, "lo-profile");
  fs.writeFileSync(docxPath, await docxForPdf(docxBuffer), { mode: 0o600 });
  try {
    await run(binary, [
      `-env:UserInstallation=file://${profilePath}`,
      "--headless", "--convert-to", "pdf", "--outdir", workingDirectory, docxPath
    ], workingDirectory);
    const pdfPath = path.join(workingDirectory, "book.pdf");
    if (!fs.existsSync(pdfPath) || fs.statSync(pdfPath).size < 1024) throw new Error("The PDF renderer did not produce a valid file.");
    return { buffer: fs.readFileSync(pdfPath), filename: `${cleanFilename(filename.replace(/\.docx$/i, ""))}.pdf` };
  } finally {
    fs.rmSync(workingDirectory, { recursive: true, force: true });
  }
}

module.exports = {
  buildBookDocx,
  cleanFilename,
  convertDocxToPdf,
  fittedImageSize,
  imageType,
  resolveLibreOfficeBinary
};
