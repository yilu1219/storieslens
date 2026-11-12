# Parent and teacher book flow — ship notes (2026-11-10)

A mobile-first chain now lives in `/workspace/StoriesLens/app` so Yi can walk it on a phone today:

1. Parents upload phone photos, get an auto cover, fill an author name and an editable author-intro, review optional suggestions, preview the book, and make a free short film.
2. Teachers upload student work, preview a class ebook, and share a private link or short code with parents.
3. Official digital A5 PDF (¥19.9 / about $2.99) is emailed only after the server confirms payment and the buyer confirms a delivery email. Printed books are chosen before checkout: softcover ¥129 (about $17.99) or premium hardcover ¥199 (about $27.99). Preview and the short film stay free.

## How to run locally

```bash
cd /workspace/StoriesLens/app
npm start
```

Then open (default port 3000 unless `PORT` is set):

- Homepage entries: `http://localhost:3000/` — parent card and teacher card
- Parent flow: `http://localhost:3000/照片成为电子书` and `http://localhost:3000/photos-to-ebook` (`/parent-book`, `/parent-book.html`, and `/family-book` redirect here)
- Teacher flow: `http://localhost:3000/teacher-book` (aliases: `/class-book`, `/teacher-book.html`)
- Parent opening a teacher share: `http://localhost:3000/book-share?t=<token>` or `http://localhost:3000/book-share?c=<CODE>` or `http://localhost:3000/b/<CODE>`
- Chinese studio entries: `http://localhost:3000/chinese-studio.html`

This workspace copy has no `.env`, so checkout is not connected. Prices are still shown. Preview stays free.

## Tests

```bash
cd /workspace/StoriesLens/app
node --test tests/parent-book.test.js tests/family-book.test.js
```

These cover A5 page size without LibreOffice, artwork/homework allow rules, ID/contact blocks, optional suggestions, catalog prices (digital ¥19.9, softcover ¥129, hardcover ¥199), unconfigured checkout, entitlement that never unlocks from a success query, official PDF email only after a confirmed digital entitlement, unpaid official PDF (402), paid download after a server-side grant and a saved delivery email, private share token + short code with no public listing, and homepage / teacher route wiring.

## What is free vs paid

- Free: parent and teacher book preview, teacher preview A5 PDF, parent short film, parent viewing a private teacher share on another phone (including WeChat).
- ¥19.9 (about $2.99): official digital A5 PDF. After the server confirms payment, the buyer must confirm a delivery email. `POST /api/family-book/email` then builds the official PDF and sends it with the existing Resend mail path (`RESEND_API_KEY`, `AUTH_EMAIL_FROM`). The buyer can resend to the saved or updated address. If Resend is not configured, the payment stays confirmed and the address is still saved, but the API returns 503 and does not claim the PDF was sent. Download remains available from `/api/family-book/download` after that address is saved. An unpaid or preview PDF is never emailed.
- ¥129 (about $17.99): softcover (`family-print-softcover`). Stripe Price ID: `STRIPE_PRICE_FAMILY_PRINT_SOFTCOVER`, with `STRIPE_PRICE_FAMILY_PRINT` kept as a fallback for this cover only.
- ¥199 (about $27.99): premium hardcover (`family-print-hardcover`). Stripe Price ID: `STRIPE_PRICE_FAMILY_PRINT_HARDCOVER`.

The buyer chooses 精美硬壳 or 软壳 before checkout on the parent page and on the private parent link opened from the teacher page. Print still needs an adult shipping address: name, phone, country, region, city, street, and postal code. The first batch is arranged and fulfilled manually after a real confirmed payment. There is no automated tracking and no claimed print factory, print partner, or live shipping integration.

A checkout success page, `?paid=1`, or any other query string is never proof of payment and never triggers an email or download. `/api/parent-book/pdf` returns 402; the official file is issued only by `/api/family-book/download` or `/api/family-book/email` after a server-confirmed entitlement. Minors do not check out: adult confirmation and an adult email are required. There is no child-facing payment form. Teachers do not check out on the teacher page.

## Payment limitations (current workspace)

Checkout reuses Stripe hosted checkout only through the dedicated family-book path (`/api/family-book/checkout`), not `/api/checkout-link` (that path is for signed-in credit packages). Live Price IDs are not invented. If `STRIPE_SECRET_KEY`, `PUBLIC_BASE_URL`, or — in live mode — `STRIPE_PRICE_FAMILY_DIGITAL` / `STRIPE_PRICE_FAMILY_PRINT_SOFTCOVER` (fallback `STRIPE_PRICE_FAMILY_PRINT`) / `STRIPE_PRICE_FAMILY_PRINT_HARDCOVER` are missing, the UI still shows ¥19.9, softcover ¥129, and hardcover ¥199, and a clear unpaid / unavailable state. Empty placeholders for those env names are documented in `.env.example`. When keys are present later, test mode may use Stripe `price_data` in CNY; live mode still requires real Price IDs. Paid-book email uses the same Resend configuration as sign-in mail. No second email vendor is added. WeChat Pay and Alipay are not part of this checkout.

Railway still needs the operator to set those names on the service (no values belong in git): `STRIPE_SECRET_KEY`, `PUBLIC_BASE_URL`, `STRIPE_PRICE_FAMILY_DIGITAL`, `STRIPE_PRICE_FAMILY_PRINT_SOFTCOVER` or the softcover fallback `STRIPE_PRICE_FAMILY_PRINT`, `STRIPE_PRICE_FAMILY_PRINT_HARDCOVER`, and the existing `RESEND_API_KEY` plus `AUTH_EMAIL_FROM`. Set `STRIPE_LIVE_MODE=true` only together with live keys and real Price IDs. Until Resend is set, a confirmed digital payment can save the delivery email and return 503 without claiming the PDF was sent.

## How a teacher share link works

- Teacher enters a class name (required), optional teacher name, and uploads photos (JPG/PNG/WEBP/HEIC, album cap 20 photos / 24 pages including the cover). Optional per-page student display names warn against full legal names or school IDs.
- After preview, the teacher creates a private share. The server stores share tokens and book images under `app/.data/family-books/` (gitignored). Tokens are 24-byte hex; short codes are 8 characters. Shares expire after 60 days.
- The teacher gets a private URL (`/book-share?t=…`) and a short code (`/book-share?c=CODE` or `/b/CODE`). Anyone with the link can preview. There is no public listing, no search index (`noindex` + `X-Robots-Tag`), and no secret logging of keys.
- A parent opening the link can flip through the book for free, then choose digital ¥19.9 or, before checkout, softcover ¥129 or premium hardcover ¥199, under the same payment rules as the parent flow.
- Teachers do not go through Yu mentoring or parent checkout to build or share the class book.

## Parent-flow additions kept on the existing page

- Auto cover stays. The parent fills an author name and an author-intro from short bilingual templates (the text is editable). The optional child display name remains.
- After generation, a lightweight check offers suggestions one by one (cover title, page order, author-intro clarity, missing fields). Every suggestion is optional and reversible. The child’s artwork and writing are never rewritten.

## Honest limitations

- This is a WeChat-ready H5 page, not a submitted WeChat mini program (no AppID, no review). Parents and teachers can open the URL inside WeChat now.
- WeChat iOS often blocks raw file downloads. The page previews the PDF and plays the video in place, and tells the adult to use “Open in Browser” to save.
- Client-side film fallback may be WebM on some browsers. iPhone and WeChat play the server MP4 most reliably, so keep ffmpeg available in production.
- Artwork review does **not** call the paid `/api/review-artwork` API. Filename/text heuristics will not catch a document photo named `IMG_1234.HEIC`. The upload notice asks adults not to upload IDs or contact information.
- Print is a manual first-batch promise after real payment only. If payment is not configured, the order is not marked paid and the UI does not pretend it succeeded.
- Preview images still exist in the browser, so a screenshot is possible. The product rule is that the official paid receipt / official PDF is not issued without server confirmation.
- Shared books are private-by-link: anyone who receives the URL can open the preview. They are not listed or indexed.
- Album size is capped like the parent flow (20 photos; 24 pages including the cover on the server). Images in a teacher share are stored as files under the private data directory.
- This workspace copy of the repo does not include the `assets/` folder (logo and icons), which is a pre-existing gap in the extracted tree. On storieslens.com those files already exist. The pages still function without the logo.

## Files created or changed in this chain

Parent book (first pass, still present):

- `app/parent-book.html`, `app/parent-book.css`, `app/parent-book.js`
- `app/parent-book-pdf.js` — A5 PDF via `pdf-lib` (no LibreOffice)
- `app/parent-book-film.js` — H.264/AAC MP4 slideshow via ffmpeg
- `app/parent-book-safety.js` — local filename/text checks
- `app/tests/parent-book.test.js`
- `app/vendor/pdf-lib.min.js`, `app/vendor/pdf-lib-LICENSE.md`

Payment, review, teacher share (this pass):

- `app/family-book-catalog.js`, `app/family-book-payments.js`, `app/family-book-review.js`
- `app/family-book-store.js`, `app/family-book-api.js`, `app/family-book-ui.css`
- `app/teacher-book.html`, `app/teacher-book.js`
- `app/book-share.html`, `app/book-share.js`
- `app/tests/family-book.test.js`

Also changed:

- `app/server.js` — `/parent-book`, `/family-book`, `/teacher-book`, `/class-book`, `/book-share`, `/b/:code`, family-book APIs, `/api/parent-book/pdf` gated to 402, film API still free
- `app/parent-book.html`, `app/parent-book.js` — author intro, suggestions, prices, adult/shipping form, paid download
- `app/index.html`, `app/portal-home.js`, `app/portal-home.css` — parent and teacher homepage entries
- `app/chinese-studio.html`, `app/chinese-studio.css` — parent and teacher Chinese-studio entries
- `.env.example` — empty `STRIPE_PRICE_FAMILY_DIGITAL`, `STRIPE_PRICE_FAMILY_PRINT_SOFTCOVER`, `STRIPE_PRICE_FAMILY_PRINT` (softcover fallback), and `STRIPE_PRICE_FAMILY_PRINT_HARDCOVER`
- `app/package.json` / `app/package-lock.json` — `pdf-lib` (from the first pass)

# Co-create film flow — added 2026-11-10

A walkable co-create → film path now lives alongside the parent/teacher book flows. It does not replace Story Squad or Movie Studio, and it does not require Yu mentoring, login, or checkout.

## How to run

```bash
cd /workspace/StoriesLens/app
npm start
```

Then open:

- Homepage CTA: `http://localhost:3000/` — “CO-CREATE A FILM / 共创电影”
- Create or open a group: `http://localhost:3000/cocreate-film` (alias: `/co-create-film`, also `/cocreate-film.html`)
- Join or continue with a share link: `http://localhost:3000/cocreate-film?t=<token>`
- Short code: `http://localhost:3000/cocreate-film?c=<CODE>` or `http://localhost:3000/f/<CODE>`
- Chinese studio entry: `http://localhost:3000/chinese-studio.html`

The parent book public URL is `/照片成为电子书` and `/photos-to-ebook`. `/parent-book` redirects there. `/teacher-book` and `/book-share` are unchanged.

## How create, join, and share work

1. An adult creates a private group (title, optional style, display name) and receives a private URL plus an 8-character short code.
2. Another person opens the link on another phone (including WeChat), enters a display name, and joins. Up to 8 members.
3. Each member can add a scene: short action/dialogue and an optional photo (HEIC included). Scene order is stable and can be adjusted with up/down. Album cap is 12 scenes.
4. Anyone in the group can tap “make the film”. The finished MP4 plays on the page and can be saved or re-opened from the same private link.
5. Shares are stored under `app/.data/cocreate-films/` (gitignored), expire after 60 days, are not listed publicly, and are served with `noindex` / `X-Robots-Tag`.

## When real AI video is used vs the fallback

- Real AI scene clips (OpenRouter/Seedance or China Ark) are used only if video generation is actually configured: `SAFE_VIDEO_GENERATION_ENABLED=true` and a real provider key is present. This workspace typically has no `.env` and no live keys, so AI video is **not configured**.
- If it is not configured, the chain still completes with a reliable 1280×720 H.264 + AAC MP4 (`+faststart`) motion slideshow / Ken Burns film made from the co-created scenes and text. The UI is explicit: this is **not** a Seedance-generated AI clip.
- If AI video is later connected, a failed clip falls back scene-by-scene to the motion slideshow, and the fallback is not labeled as Seedance.
- Creating, joining, previewing, and making this film are free today. Paid movie packs are not hooked up on this path. A success page is not treated as payment, and there is no child-facing checkout form. Do not invent Stripe Price IDs.

## Tests

```bash
cd /workspace/StoriesLens/app
node --test tests/parent-book.test.js tests/family-book.test.js tests/cocreate-film.test.js
```

## Key limitations

- WeChat-ready H5, not a submitted mini program. WeChat iOS often blocks raw downloads; the page plays the MP4 in place and points people to “Open in Browser”.
- Filename/text safety blocks IDs and contact information, but will not catch a document photo named `IMG_1234.HEIC`. Photo uploads ask for adult permission, especially if other people’s faces appear.
- Display names should be a first name or nickname, not a full legal name.
- The existing credited Movie Studio / `/api/generate-video` pipeline remains for accounts that already have video allowance. This simple path is intentionally usable without login or payment.
- Captions on the fallback film use system fonts when available (Noto Sans CJK on this box) via libass, because the bundled ffmpeg build does not include the `drawtext` filter.

## Files added or changed for this path

- `app/cocreate-film.html`, `app/cocreate-film.js`, `app/cocreate-film.css`
- `app/cocreate-film-status.js`, `app/cocreate-film-store.js`, `app/cocreate-film-render.js`, `app/cocreate-film-api.js`
- `app/tests/cocreate-film.test.js`
- `app/server.js` — `/cocreate-film`, `/co-create-film`, `/f/:code`, and `/api/cocreate-film/*`
- `app/index.html`, `app/portal-home.js`, `app/portal-home.css`
- `app/chinese-studio.html`, `app/chinese-studio.css`
