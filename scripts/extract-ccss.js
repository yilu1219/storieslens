const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePdf = path.join(root, "resources", "source", "ccss-ela-standards.pdf");
const outputDir = path.join(root, "resources", "ccss");
const extractedTextPath = path.join(outputDir, "ccss-extracted-text.txt");
const curatedJsonPath = path.join(outputDir, "ela-standards.json");
const draftJsonPath = path.join(outputDir, "ela-standards.draft.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function roughExtractPdfText(pdfBuffer) {
  // This dependency-free extractor is intentionally conservative. It keeps a
  // human-readable text artifact for manual cleanup, then seeds draft JSON from
  // the curated MVP standards. A production import can replace this with
  // PDFBox, pdf-parse, or a backend document parser.
  return pdfBuffer
    .toString("latin1")
    .replace(/\r/g, "\n")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function loadCuratedStandards() {
  if (!fs.existsSync(curatedJsonPath)) return [];
  return JSON.parse(fs.readFileSync(curatedJsonPath, "utf8"));
}

function main() {
  ensureDir(outputDir);

  let extractedText = "";
  if (fs.existsSync(sourcePdf)) {
    extractedText = roughExtractPdfText(fs.readFileSync(sourcePdf));
  } else {
    extractedText = [
      "No source PDF found at resources/source/ccss-ela-standards.pdf.",
      "Place the CCSS ELA PDF there, then rerun: node scripts/extract-ccss.js.",
      "For the first MVP, resources/ccss/ela-standards.json provides curated Grade 2-6 candidates."
    ].join("\n");
  }

  fs.writeFileSync(extractedTextPath, extractedText, "utf8");
  fs.writeFileSync(draftJsonPath, JSON.stringify(loadCuratedStandards(), null, 2), "utf8");

  console.log(`Extracted text written to ${path.relative(root, extractedTextPath)}`);
  console.log(`Draft JSON written to ${path.relative(root, draftJsonPath)}`);
}

main();
