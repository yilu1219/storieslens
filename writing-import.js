(() => {
  "use strict";

  const MAX_FILE_BYTES = 7 * 1024 * 1024;
  const IMAGE_ACCEPT_HINT = ".jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif,image/*";

  const readDocx = async (file) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = -1;
    for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index -= 1) {
      if (view.getUint32(index, true) === 0x06054b50) { end = index; break; }
    }
    if (end < 0) throw new Error("docx_archive_invalid");

    const decoder = new TextDecoder("utf-8");
    let cursor = view.getUint32(end + 16, true);
    let entry = null;
    while (cursor + 46 <= bytes.length && view.getUint32(cursor, true) === 0x02014b50) {
      const compression = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localOffset = view.getUint32(cursor + 42, true);
      const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
      if (name === "word/document.xml") entry = { compression, compressedSize, localOffset };
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    if (!entry || view.getUint32(entry.localOffset, true) !== 0x04034b50) throw new Error("docx_document_missing");
    const nameLength = view.getUint16(entry.localOffset + 26, true);
    const extraLength = view.getUint16(entry.localOffset + 28, true);
    const start = entry.localOffset + 30 + nameLength + extraLength;
    const compressed = bytes.slice(start, start + entry.compressedSize);
    let xmlBytes = compressed;
    if (entry.compression === 8) {
      if (!("DecompressionStream" in window)) throw new Error("docx_decompression_unavailable");
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      xmlBytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (entry.compression !== 0) {
      throw new Error("docx_compression_unsupported");
    }
    const parsed = new DOMParser().parseFromString(decoder.decode(xmlBytes), "application/xml");
    if (parsed.querySelector("parsererror")) throw new Error("docx_xml_invalid");
    return Array.from(parsed.getElementsByTagNameNS("*", "p"))
      .map((paragraph) => Array.from(paragraph.getElementsByTagNameNS("*", "t"))
        .map((node) => node.textContent || "").join("").trim())
      .filter(Boolean).join("\n\n");
  };

  const readFile = async (file) => {
    if (!file || file.size > MAX_FILE_BYTES) throw new Error("file_too_large");
    const name = String(file.name || "").toLowerCase();
    if (name.endsWith(".txt") || name.endsWith(".md")) return String(await file.text()).trim();
    if (name.endsWith(".docx")) return readDocx(file);
    throw new Error("unsupported_file");
  };

  const isImageFile = (file) => Boolean(window.StoriesLensArtworkSafety?.isSupportedImage?.(file));

  const extractWritingFromImage = async (file) => {
    if (!file || file.size > MAX_FILE_BYTES) throw new Error("file_too_large");
    if (!isImageFile(file)) throw new Error("unsupported_file");

    // HEIC/HEIF is converted by the existing on-device image pipeline first.
    // It strips location/device metadata before this sanitized derivative is sent
    // to the server, which performs the required safety/private-information
    // review once before text extraction.
    const sanitized = await window.StoriesLensArtworkSafety.removeMetadata(file);
    const response = await fetch("/api/extract-writing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: sanitized.dataUrl, metadataRemoved: true })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.text) {
      const error = new Error(payload.reasonCode || payload.error || "text_extraction_failed");
      error.reasonCode = payload.reasonCode || "text_extraction_failed";
      throw error;
    }
    return {
      text: String(payload.text).trim(),
      kind: "photo",
      convertedFromHeic: sanitized.convertedFromHeic === true,
      metadataRemoved: true
    };
  };

  const importFile = async (file) => {
    if (isImageFile(file)) return extractWritingFromImage(file);
    return { text: await readFile(file), kind: "document", convertedFromHeic: false, metadataRemoved: false };
  };

  window.StoriesLensWritingImport = { readFile, importFile, extractWritingFromImage, isImageFile, IMAGE_ACCEPT_HINT, MAX_FILE_BYTES };
})();
