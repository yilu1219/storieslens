# StoriesLens Teacher Publisher

## Product promise

Photograph one finished classroom bulletin board and turn the teacher-approved work into a dated private class book. If the wide photo is not clear enough, upload the student works separately.

This is one product with one responsive codebase:

- Web: works in a desktop browser for review, editing and printing.
- H5/PWA: works from a phone camera and can be installed on the home screen.
- Native app / WeChat mini program: later shells around the same workflow and API, not separate products.

## MVP now implemented

1. Choose **one bulletin-board photo** or **individual student works**.
2. Resize images and remove camera metadata in the browser.
3. Split a board photo into editable page candidates; one uploaded work becomes one full page.
4. Add book title, collection date, edition, class nickname and cover theme.
5. Rename, reorder or remove pages and use anonymous printed credits.
6. Require teacher confirmation for crop quality, visible personal information and permission.
7. Preview a dated cover and flip through the digital book.
8. Save the private draft in IndexedDB on the current device.
9. Download a self-contained digital book or print/save a PDF proof.
10. Resume the most recently saved private book.

## Product boundary

The current MVP uses deterministic grid crops to create page candidates. It does not yet claim semantic artwork detection, OCR, face detection or automatic redaction. The teacher must review every page before export.

Production recognition should add:

- perspective correction and board-edge detection;
- individual-paper boundary detection;
- OCR for dates, titles and identifying information;
- face, school name, contact information and QR-code detection;
- one-tap blur/redaction and a human review screen;
- a confidence score that recommends individual uploads when a board photo is too unclear.

## Privacy architecture

### Shared principles

- Raw student images are private by default.
- Remove EXIF metadata before storage or transmission.
- Use class nicknames instead of student full names.
- Separate teacher approval from family sharing and public publishing.
- Never train models on classroom content without separate, explicit consent.
- Provide deletion, retention and access logs before cloud accounts launch.

### International service

- Store each school's content in its selected region.
- Use a US/international API and storage environment for overseas customers.
- Add school/district agreements, parental-consent records and age-appropriate privacy controls before selling to schools.

### Mainland China service

- Use a China-region backend and object storage for China accounts.
- Do not send raw student content to the international environment by default.
- Complete the required Chinese hosting, privacy, content-safety and mini-program reviews before public launch.
- Keep the first China pilot closed to the founder's school and invited teachers.

This document is a product and engineering plan, not legal advice. Counsel in each launch region should review the final data flow and consent language.

## Recommended rollout

### Phase 1 — working pilot

- Web/H5/PWA only.
- Founder school plus 5–10 invited teachers.
- Device-only projects; teacher exports the final book.
- Measure: first book completion rate, time to first draft, pages corrected, and print-interest clicks.

### Phase 2 — reliable recognition

- Add edge detection, OCR/PII warnings and better page extraction.
- Add private teacher accounts, encrypted regional storage and deletion controls.
- Add family preview links that expire and cannot be indexed.

### Phase 3 — commerce

- Free digital proof with a visible proof mark.
- Paid high-resolution digital book.
- Print-on-demand class book with payment collected before production.
- Optional narrated class film priced by duration/credit usage.

### Phase 4 — distribution

- WeChat mini program for China capture and family sharing.
- PWA first for international teachers; native iOS/Android only after repeat usage proves the need for camera, notifications or offline capture.

## Non-loss pricing guardrail

Every paid output must be prepaid and credit-limited. The price floor is:

> payment processing + AI/OCR/rendering + storage/traffic + print/packing/shipping + support reserve + target gross margin

Do not include unlimited film generation in a subscription. Keep creation and review inexpensive, then charge for high-resolution export, print and video rendering.
