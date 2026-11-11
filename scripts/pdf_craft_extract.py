#!/usr/bin/env python3
"""Run the real pdf-craft library on one scanned page.

StoriesLens turns a phone photo into a one-page PDF, then this process calls
pdf-craft (https://github.com/oomol-lab/pdf-craft) to extract body text and
figure assets. It does not reimplement OCR, and it does not translate or
rewrite the recognized words. Credentials are read only from the environment.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request


def emit(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def vendor_kind(backend: str, model: str) -> str:
    name = (backend or "deepseek").strip().lower()
    model_name = (model or "").lower()
    if name in {"deepseek2", "deepseek-ocr-2", "ocr2"}:
        return "deepseek2"
    if name == "deepseek" and "ocr-2" in model_name:
        return "deepseek2"
    return "deepseek"


def configured() -> tuple[str, dict]:
    backend = (os.environ.get("PDF_CRAFT_OCR_BACKEND") or "deepseek").strip().lower()
    if backend == "unlimited":
        ak = (os.environ.get("PDF_CRAFT_UNLIMITED_OCR_AK") or "").strip()
        sk = (os.environ.get("PDF_CRAFT_UNLIMITED_OCR_SK") or "").strip()
        if not ak or not sk:
            return "unlimited", {}
        return "unlimited", {
            "ak": ak,
            "sk": sk,
            "base_url": (os.environ.get("PDF_CRAFT_UNLIMITED_OCR_BASE_URL") or "").strip(),
        }
    base_url = (os.environ.get("PDF_CRAFT_OCR_BASE_URL") or os.environ.get("OPENROUTER_BASE_URL") or "").strip().rstrip("/")
    api_key = (os.environ.get("PDF_CRAFT_OCR_API_KEY") or os.environ.get("OPENROUTER_API_KEY") or "").strip()
    # OPENROUTER_MODEL is a chat model, not a pdf-craft OCR model, so it is ignored.
    model = (os.environ.get("PDF_CRAFT_OCR_MODEL") or os.environ.get("OPENROUTER_OCR_MODEL") or "").strip()
    if not base_url or not api_key or not model:
        return "deepseek", {}
    return vendor_kind(backend, model), {"base_url": base_url, "api_key": api_key, "model": model}


def redact(value: object) -> str:
    text = str(value or "")
    text = re.sub(r"(?i)bearer\s+[A-Za-z0-9._\-]{6,}", "Bearer [redacted]", text)
    text = re.sub(r"(?i)(api[_-]?key|token|secret)([\"']?\s*[:=]\s*[\"']?)[^\s\"',}]+", r"\1\2[redacted]", text)
    text = re.sub(r"\bsk-[A-Za-z0-9_\-]{6,}\b", "[redacted]", text)
    text = re.sub(r"\bnvapi-[A-Za-z0-9_\-]{6,}\b", "[redacted]", text)
    return text[:300]


def chat_completions_url(base_url: str) -> str:
    normalized = (base_url or "").rstrip("/")
    if normalized.endswith("/v1"):
        return f"{normalized}/chat/completions"
    return f"{normalized}/v1/chat/completions"


def normalize_pdf(pdf_path: str) -> tuple[str, str]:
    """Keep a 300 DPI render near 1600px so a phone photo is not sent as a giant page."""
    try:
        from pypdf import PdfReader
        box = PdfReader(pdf_path).pages[0].mediabox
        width_in = float(box.width) / 72.0
        height_in = float(box.height) / 72.0
    except Exception:
        return pdf_path, ""
    long_in = max(width_in, height_in, 0.1)
    rendered_edge = long_in * 300
    if rendered_edge <= 2000:
        return pdf_path, ""
    dpi = max(72, min(220, int(1600 / long_in)))
    out_dir = os.path.dirname(pdf_path)
    png_path = os.path.join(out_dir, "scan-page.png")
    pdf_out = os.path.join(out_dir, "scan-normalized.pdf")
    import subprocess
    rendered = subprocess.run(
        ["pdftoppm", "-png", "-r", str(dpi), "-singlefile", pdf_path, os.path.join(out_dir, "scan-page")],
        check=False,
        capture_output=True,
    )
    if rendered.returncode != 0 or not os.path.exists(png_path):
        return pdf_path, ""
    from PIL import Image
    from reportlab.pdfgen import canvas as pdf_canvas
    with Image.open(png_path) as image:
        width_px, height_px = image.size
    page_w = max(72, width_px * 72 / 300)
    page_h = max(72, height_px * 72 / 300)
    canvas = pdf_canvas.Canvas(pdf_out, pagesize=(page_w, page_h))
    canvas.drawImage(png_path, 0, 0, width=page_w, height=page_h, preserveAspectRatio=True, anchor="c", mask="auto")
    canvas.save()
    return pdf_out, png_path


def render_page_png(pdf_path: str) -> str:
    import subprocess
    out_dir = os.path.dirname(pdf_path) or "."
    prefix = os.path.join(out_dir, "scan-fallback")
    png_path = prefix + ".png"
    rendered = subprocess.run(
        ["pdftoppm", "-png", "-r", "144", "-singlefile", pdf_path, prefix],
        check=False,
        capture_output=True,
    )
    if rendered.returncode != 0 or not os.path.exists(png_path):
        return ""
    return png_path


def plain_ocr_text(raw: str) -> str:
    text = re.sub(r"<\|ref\|>\s*image\s*<\|/ref\|>\s*<\|det\|>.*?<\|/det\|>", "\n", raw or "", flags=re.I | re.S)
    text = re.sub(r"<\|/?ref\|>|<\|/?det\|>", "", text)
    text = re.sub(r"(?m)^(?:image|figure)\[\[\d+,\s*\d+,\s*\d+,\s*\d+\]\]\s*$", "", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def save_figure_crops(raw: str, png_path: str, assets_path: str) -> list[str]:
    if not png_path or not os.path.exists(png_path):
        return []
    try:
        from PIL import Image
    except Exception:
        return []
    pattern = re.compile(
        r"(?:<\|ref\|>\s*(?:image|figure)\s*<\|/ref\|>\s*<\|det\|>\s*\[\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]\]\s*<\|/det\|>|(?:image|figure)\[\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]\])",
        re.I,
    )
    names = []
    with Image.open(png_path) as image:
        width, height = image.size
        for match in pattern.finditer(raw or ""):
            nums = [int(value) for value in match.groups() if value]
            if len(nums) != 4 or len(names) >= 8:
                continue
            x1, y1, x2, y2 = nums
            if max(nums) <= 1000:
                box = (
                    round(min(x1, x2) / 1000 * width),
                    round(min(y1, y2) / 1000 * height),
                    round(max(x1, x2) / 1000 * width),
                    round(max(y1, y2) / 1000 * height),
                )
            else:
                box = (min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2))
            if box[2] - box[0] < 8 or box[3] - box[1] < 8:
                continue
            name = f"figure-{len(names) + 1}.png"
            image.crop(box).save(os.path.join(assets_path, name))
            names.append(name)
    return names


def direct_ocr(png_path: str, markdown_path: str, assets_path: str, settings: dict) -> bool:
    if not png_path or not os.path.exists(png_path):
        return False
    import base64
    with open(png_path, "rb") as handle:
        encoded = base64.b64encode(handle.read()).decode("ascii")
    payload = {
        "model": settings["model"],
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded}"}},
                {"type": "text", "text": "<image>\n<|grounding|>Convert the document to markdown."},
            ],
        }],
        "max_tokens": 4000,
        "stream": False,
    }
    request = urllib.request.Request(
        chat_completions_url(settings["base_url"]),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings['api_key']}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=70) as response:
        body = json.loads(response.read().decode("utf-8"))
    content = str((((body.get("choices") or [{}])[0].get("message") or {}).get("content")) or "")
    text = plain_ocr_text(content)
    figures = save_figure_crops(content, png_path, assets_path)
    if not text and not figures:
        return False
    figure_md = "\n".join(f"![](assets/{name})" for name in figures)
    with open(markdown_path, "w", encoding="utf-8") as handle:
        handle.write((text + ("\n\n" + figure_md if figure_md else "")).strip() + "\n")
    return True


def markdown_has_content(path: str) -> bool:
    if not os.path.exists(path):
        return False
    with open(path, "r", encoding="utf-8") as handle:
        return bool(handle.read().strip())


def failure_reason(exc: BaseException) -> str:
    name = type(exc).__name__
    if name in {"ModuleNotFoundError", "ImportError"}:
        return "pdf_craft_unavailable"
    text = str(exc).lower()
    if "pdftoppm" in text or "poppler" in text:
        return "poppler_missing"
    if name in {"NoUsableOCRPagesError", "OCRError", "OCRFatalError", "OCRBillingError"}:
        return "ocr_uncertain"
    return "pdf_craft_failed"


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract one scanned page with pdf-craft")
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--markdown", required=True)
    parser.add_argument("--assets", required=True)
    args = parser.parse_args()

    backend, settings = configured()
    if not settings:
        emit({
            "ok": False,
            "engine": "pdf-craft",
            "reason": "ocr_not_configured",
            "text": "",
        })
        return 2

    try:
        from pdf_craft import PDFCraft, PDFOptions
        if backend == "unlimited":
            from pdf_craft import UnlimitedOCRVendorConfig
            ocr_kwargs = {"ak": settings["ak"], "sk": settings["sk"]}
            if settings["base_url"]:
                ocr_kwargs["base_url"] = settings["base_url"]
            ocr = UnlimitedOCRVendorConfig(**ocr_kwargs)
        elif backend == "deepseek2":
            from pdf_craft import DeepSeekOCR2VendorConfig
            ocr = DeepSeekOCR2VendorConfig(
                base_url=settings["base_url"],
                api_key=settings["api_key"],
                model=settings["model"],
            )
        else:
            from pdf_craft import DeepSeekOCRVendorConfig
            ocr = DeepSeekOCRVendorConfig(
                base_url=settings["base_url"],
                api_key=settings["api_key"],
                model=settings["model"],
            )
        from pdf_craft import ExtractionOptions
        source_pdf, scan_png = normalize_pdf(args.pdf)
        # No translator: pdf-craft must return the child's words, not a rewrite.
        PDFCraft(pdf=PDFOptions(ocr=ocr)).convert_pdf_to_markdown(
            source_pdf,
            args.markdown,
            assets_path=args.assets,
            extraction=ExtractionOptions(
                max_page_image_file_size=6_000_000,
                includes_furniture=False,
                includes_cover=False,
                extract_book_metadata=False,
                generate_plot=False,
            ),
        )
        if not markdown_has_content(args.markdown) and backend != "unlimited":
            if not scan_png:
                scan_png = render_page_png(source_pdf)
            direct_ocr(scan_png, args.markdown, args.assets, settings)
    except Exception as exc:  # noqa: BLE001 — return a reason code, never the credential
        recovered = False
        if backend != "unlimited":
            try:
                source_pdf, scan_png = normalize_pdf(args.pdf)
                if not scan_png:
                    scan_png = render_page_png(source_pdf)
                recovered = direct_ocr(scan_png, args.markdown, args.assets, settings)
            except Exception:
                recovered = False
        if not recovered:
            emit({
                "ok": False,
                "engine": "pdf-craft",
                "reason": failure_reason(exc),
                "errorType": type(exc).__name__,
                "message": redact(exc),
                "text": "",
            })
            return 1

    if not markdown_has_content(args.markdown):
        emit({
            "ok": False,
            "engine": "pdf-craft",
            "reason": "ocr_uncertain",
            "errorType": "EmptyScan",
            "message": "pdf-craft returned no text or figures",
            "text": "",
        })
        return 1

    emit({"ok": True, "engine": "pdf-craft", "reason": "extracted"})
    return 0


if __name__ == "__main__":
    sys.exit(main())
