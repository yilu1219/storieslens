# StoriesLens H5 product foundation

The product now has one mobile-first web app rather than separate consumer and teacher apps. `app.html` is the formal H5 entry, `my-stories.html` is the private library, `movie-studio.html` is the book/movie production workspace, and `classroom-archive.html` is the single-purpose teacher flow. The public `index.html` remains the marketing homepage.

Friendly production routes are also available: `/app`, `/create`, `/stories`, `/studio`, and `/classroom`. The installed PWA opens `/app.html` directly.

## What works locally

1. Guest sessions plus email or phone one-time-code login. Development codes appear only when `NODE_ENV` is not `production`.
2. Server-side project saving and automatic migration of the current browser draft into the signed-in account.
3. Mobile camera/file selection, client-side image rewrite (removing EXIF), private image storage, and browser voice recording.
4. Story DNA, draft, coach history and scene continuity stored together in each project.
5. Scene ordering, timing, captions, artwork, private narration and in-browser movie preview.
6. DOCX book export and a private HyperFrames MP4 render queue. Rendered MP4 files stay behind the owner session.
7. Under-18 privacy defaults, guardian approval, approval revocation, invitation revocation and project archive.
8. Temporary invite-only share URLs with Open Graph metadata for WeChat and other messaging apps. Shared pages are `noindex`.
9. One-time order records with Stripe Payment Link handoff. No subscription is created.
10. Installable PWA shell, cached previously opened pages, offline fallback, background local-draft sync and update prompts. Private API responses are never cached by the service worker.

Safe text can be drafted locally with the built-in bilingual blocklist when no external moderation key is present. Production should set `REQUIRE_EXTERNAL_TEXT_MODERATION=true`; images and video remain fail-closed unless external review succeeds.

## Real-person photo boundary

The current release is artwork-only. The browser rewrites a selected image through canvas to remove EXIF, then sends that sanitized copy to `/api/review-artwork`. The review request is not written to disk, API responses use `Cache-Control: no-store`, and the provider request uses `store: false`. If the classifier detects a real person, personal name, school information, contact information, identity document, non-artwork photo, or uncertainty, the media API refuses to persist it. Only approved artwork can be written under `.data/media/<owner-id>/` in local development.

Do not market this as fully on-device photo conversion. A future “I am the character” feature must be a separate parent-enabled mode with an on-device model; only its non-photorealistic avatar output—not the source photo—may enter project storage.

## Production connections still required

Copy `.env.example` to the production secret manager and configure these values there—never in browser JavaScript:

- `AUTH_DELIVERY_WEBHOOK_URL` and `AUTH_DELIVERY_WEBHOOK_SECRET`: an HTTPS adapter that sends email/SMS codes. Production authentication fails closed when it is absent.
- `WECHAT_APP_ID` and `WECHAT_APP_SECRET`: a verified WeChat Open Platform or Mini Program app. The current endpoint deliberately returns unavailable until real code exchange is added.
- `STRIPE_*_URL`: allowlisted Stripe Payment Links. Without them, an order is recorded as interest only and no money is collected.
- `HYPERFRAMES_BIN`: path to the local HyperFrames executable on the server. The desktop development installation is discovered automatically; a deployed container must install and set it explicitly.
- `OPENAI_MODERATION_API_KEY` or `OPENAI_API_KEY`: required safe-content review for production image/video release.
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: optional web-push delivery. PWA installation and offline drafts work without push.

## Production data upgrade

The current server persists local development data under `.data/`, which is intentionally excluded from Git. Before a public pilot, replace this adapter with a managed database and private object storage in the launch region. Preserve the same API contract so the H5 pages do not need to change.

Minimum production tables/collections: users, sessions, auth challenges, projects, scenes, media, guardian consents, shares, orders, render jobs and notification subscriptions. Store only hashes for email/phone identity, encrypt media at rest, use signed media URLs, and run deletion/purge jobs from a durable queue.

## Launch sequence

1. Run the H5/PWA pilot with 20 families and one teacher.
2. Measure first-scene completion, seven-day return, finished-book intent and paid conversion.
3. Add the WeChat Mini Program as a thin China distribution client using the same APIs; do not fork the product or data model.
4. Package the same responsive web experience for the US App Store only after retention is proven.

This keeps one product, one account, one story library and one movie pipeline while allowing three distribution surfaces: web/PWA, WeChat Mini Program, and later native app wrappers.
