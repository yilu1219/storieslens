# StoriesLens H5 product foundation

The product now has one mobile-first web app rather than separate consumer and teacher apps. `app.html` is the formal H5 entry, `my-stories.html` is the private library, `movie-studio.html` is the book/movie production workspace, and `classroom-archive.html` is the single-purpose teacher flow. The public `index.html` remains the marketing homepage.

Friendly production routes are also available: `/app`, `/create`, `/stories`, `/studio`, and `/classroom`. The installed PWA opens `/app.html` directly.

## What works locally

1. Guest sessions plus email or phone one-time-code login. Development codes appear only when `NODE_ENV` is not `production`.
2. Server-side project saving and automatic migration of the current browser draft into the signed-in account.
3. Mobile camera/file selection, client-side image rewrite (removing EXIF), private image storage, and browser voice recording.
4. Story DNA, draft, coach history and scene continuity stored together in each project.
5. Scene ordering, timing, captions, artwork, private narration and in-browser movie preview.
6. A5 Word/PDF book export and private FFmpeg MP4 assembly. Seedance (or another configured video model) creates optional scene clips; FFmpeg joins approved clips, images and narration without another AI video call. Files stay behind the owner session.
7. Under-18 privacy defaults, guardian approval, approval revocation, invitation revocation and project archive.
8. Temporary invite-only share URLs with Open Graph metadata for WeChat and other messaging apps. Shared pages are `noindex`.
9. One-time order records with Stripe Payment Link handoff. No subscription is created.
10. Installable PWA shell, cached previously opened pages, offline fallback, background local-draft sync and update prompts. Private API responses are never cached by the service worker.

Safe text can be drafted locally with the built-in bilingual blocklist when no external moderation key is present. Production should set `REQUIRE_EXTERNAL_TEXT_MODERATION=true`; images and video remain fail-closed unless external review succeeds.

## Real-person photo boundary

The private beta accepts safe personal photos only when `REAL_PERSON_PHOTO_UPLOADS_ENABLED=true`. The browser rewrites a selected image through canvas to remove EXIF before sending the sanitized copy to `/api/review-artwork`; the original file is not uploaded. A real-person photo is not automatically persisted: the owner must be signed in to an adult-owned account and record an affirmative relationship/permission confirmation. The server independently verifies the resulting consent record before it accepts the media. The review request is not written to disk, API responses use `Cache-Control: no-store`, and the provider request uses `store: false`. Sexual content, graphic violence, identity documents, visible contact or school information, and uncertain safety decisions remain blocked. Approved media is private by default and can be written under `.data/media/<owner-id>/` only in local development or routed to the account's configured private regional storage.

Do not market this as biometric identity verification or unrestricted face cloning. For minors, guardian approval is required before invite sharing or printing, and the source photo must never become a public gallery asset by default.

## Production connections still required

Copy `.env.example` to the production secret manager and configure these values there—never in browser JavaScript:

- `AUTH_DELIVERY_WEBHOOK_URL` and `AUTH_DELIVERY_WEBHOOK_SECRET`: an HTTPS adapter that sends email/SMS codes. Production authentication fails closed when it is absent.
- `WECHAT_APP_ID` and `WECHAT_APP_SECRET`: a verified WeChat Open Platform or Mini Program app. The current endpoint deliberately returns unavailable until real code exchange is added.
- `CHINA_ARK_BASE_URL`, `CHINA_ARK_API_KEY` and `CHINA_ARK_TEXT_MODEL`: a dedicated Volcano Engine Ark inference endpoint for Mainland accounts. Text requests fail closed instead of using OpenRouter for a signed-in account whose route is `cn`.
- `CHINA_ARK_IMAGE_MODEL=doubao-seedream-5-0-lite-260128`: the Mainland reference-led image route. Keep `CHINA_ARK_IMAGE_ENABLED=false` until a real safety and cost test passes.
- `CHINA_ARK_VIDEO_MODEL=doubao-seedance-2-0-mini-260615` and `CHINA_ARK_VIDEO_API_URL=https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`: the cost-first Mainland asynchronous video route. Keep `CHINA_ARK_VIDEO_ENABLED=false` and `SAFE_VIDEO_GENERATION_ENABLED=false` until the Ark model is active, the current per-second cost is recorded, output-frame safety review passes, and failed jobs demonstrably return credits. Completed clips are copied into the signed-in creator's private regional media storage rather than a public generated-files folder.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_LIVE_MODE`: official Stripe Checkout Sessions API and signed webhook fulfillment. Use a least-privilege restricted key (`rk_test_...` / `rk_live_...`) with Checkout Sessions write permission. Keep test mode until end-to-end payment and refund checks pass.
- `FFMPEG_BIN`: optional path to FFmpeg. The bundled `ffmpeg-static` binary is normally detected automatically.
- `LIBREOFFICE_BIN`: optional path to LibreOffice/soffice for one-click PDF export. Railway installs LibreOffice Writer and Noto CJK fonts through `nixpacks.toml`.
- `OPENAI_MODERATION_API_KEY` or `OPENAI_API_KEY`: required safe-content review for production image/video release.
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: optional web-push delivery. PWA installation and offline drafts work without push.

## Production data upgrade

The current server persists local development data under `.data/`, which is intentionally excluded from Git. Before a public pilot, replace this adapter with a managed database and private object storage in the launch region. Preserve the same API contract so the H5 pages do not need to change.

Minimum production tables/collections: users, sessions, auth challenges, projects, scenes, media, guardian consents, shares, orders, render jobs and notification subscriptions. Store only hashes for email/phone identity, encrypt media at rest, use signed media URLs, and run deletion/purge jobs from a durable queue.

### Regional private-media routing

The media API now uses `regional-object-storage.js`. It preserves the existing authenticated `/api/media/:id` contract while routing signed-in accounts by the region they explicitly confirmed:

- `cn`: a private Volcano Engine TOS bucket in China.
- `us`: a private Cloudflare R2 bucket created with the US jurisdiction.
- `intl`: a separate private Cloudflare R2 bucket for the initial international launch region.

Until all credentials for a route are configured, that route deliberately falls back to `.data/media` so local development remains usable. `/api/platform/status` reports `cloud-private` or `local-fallback` for each route without exposing bucket names, endpoints, or credentials. A public pilot must not begin while any intended launch route reports `local-fallback`.

Set `MEDIA_REQUIRED_REGIONS` in production to the comma-separated routes actually open for registration, for example `us` for the first US pilot or `cn,us,intl` after all three stacks are ready. When this setting is present, the server refuses to start if a required route is not fully configured. This prevents a deployment mistake from placing customer media on temporary server storage.

Set `ALLOWED_ACCOUNT_REGIONS` to the same currently launched subset. The account page disables unopened choices, and the server independently rejects them. In production, every allowed region is checked against live private storage at startup. This lets StoriesLens launch the US pilot first without accidentally accepting China or international media before those stacks are ready.

Storage cost is also bounded per owner before an upload reaches any bucket. The beta defaults are 20 MB for a guest session and 250 MB for a verified account; override them with `MEDIA_GUEST_QUOTA_BYTES` and `MEDIA_ACCOUNT_QUOTA_BYTES`. The account page shows used and remaining storage. Paid-plan entitlement should raise this limit from the server after payment verification; never trust a quota value sent by the browser.

Create storage credentials with object read/write access only. Do not give the runtime bucket-administration permission, do not make any media bucket public, and do not expose presigned storage URLs to pages. All reads continue through the owner-authenticated StoriesLens endpoint. Existing guest media ownership is transferred with the guest project when an account is created.

For `Other countries or regions`, retain the user's country code in the managed account database before expanding beyond the first launch countries. One international bucket is an operational starting point, not a claim that every country's data-residency requirements are identical.

## Launch sequence

1. Run the H5/PWA pilot with 20 families and one teacher.
2. Measure first-scene completion, seven-day return, finished-book intent and paid conversion.
3. Add the WeChat Mini Program as a thin China distribution client using the same APIs; do not fork the product or data model.
4. Package the same responsive web experience for the US App Store only after retention is proven.

This keeps one product, one account, one story library and one movie pipeline while allowing three distribution surfaces: web/PWA, WeChat Mini Program, and later native app wrappers.
