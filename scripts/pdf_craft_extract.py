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
import sys


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
        # No translator: pdf-craft must return the child's words, not a rewrite.
        PDFCraft(pdf=PDFOptions(ocr=ocr)).convert_pdf_to_markdown(
            args.pdf,
            args.markdown,
            assets_path=args.assets,
        )
    except Exception as exc:  # noqa: BLE001 — return a reason code, never the credential
        emit({
            "ok": False,
            "engine": "pdf-craft",
            "reason": failure_reason(exc),
            "errorType": type(exc).__name__,
            "text": "",
        })
        return 1

    emit({"ok": True, "engine": "pdf-craft", "reason": "extracted"})
    return 0


if __name__ == "__main__":
    sys.exit(main())
