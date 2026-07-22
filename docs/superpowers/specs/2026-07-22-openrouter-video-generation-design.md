# OpenRouter Video Generation Design

## Goal

Connect the existing `Generate Scene Video` action to a real OpenRouter video-generation workflow. StoriesLens will animate the student's approved/generated scene image with `bytedance/seedance-2.0-fast`, show honest asynchronous progress, play the resulting MP4, and preserve enough metadata to save or regenerate the scene later.

## Product Flow

1. The student writes or revises a scene.
2. The student generates and approves a scene image.
3. `Generate Scene Video` becomes available after an image exists.
4. Clicking it submits a 5-second, 16:9, 720p image-to-video job.
5. The preview displays `Preparing`, `Generating`, and terminal success/failure states.
6. On success, the preview becomes a native video player with `Download Video`, `Regenerate`, and `Save to Works` actions.
7. The video credit is treated as consumed only after OpenRouter accepts the job. A rejected request does not consume a credit.

If no generated image exists, the video action does not submit a request. It directs the student to generate an image first.

## Architecture

The browser never calls OpenRouter directly and never receives the API key. `visual-write.html` calls local server routes in `server.js`. The server submits the OpenRouter job, validates and stores a local job record, proxies status polling, downloads completed MP4 bytes, and exposes the saved file through the existing static server.

The initial implementation keeps job state in memory because the current app is a local prototype. Browser metadata is also stored in `localStorage` so the current student can recover the most recent completed video. Persistent production jobs and quota accounting remain a future database concern.

## Server Interfaces

### Submit

`POST /api/generate-video`

Request:

```json
{
  "prompt": "Animate this approved story scene...",
  "imageUrl": "/public/generated/.../image.png",
  "model": "bytedance/seedance-2.0-fast",
  "duration": 5,
  "aspectRatio": "16:9",
  "resolution": "720p",
  "assetType": "FREE_CREATE_VIDEO"
}
```

The server resolves local generated-image URLs into a valid image input accepted by OpenRouter, rejects missing or unsupported image inputs, and submits to `POST https://openrouter.ai/api/v1/videos`.

Accepted response:

```json
{
  "jobId": "job-abc123",
  "status": "pending",
  "pollUrl": "/api/video-jobs/job-abc123"
}
```

### Poll

`GET /api/video-jobs/:jobId`

Normalized response:

```json
{
  "jobId": "job-abc123",
  "status": "in_progress",
  "progressMessage": "Generating your scene video..."
}
```

Completed response:

```json
{
  "jobId": "job-abc123",
  "status": "completed",
  "videoUrl": "/public/generated/videos/job-abc123.mp4",
  "downloadUrl": "/public/generated/videos/job-abc123.mp4"
}
```

Failed jobs return `status: "failed"` plus a concise, student-safe `error` string. Provider details may be logged server-side but are not exposed verbatim to children.

## OpenRouter Configuration

Environment variables:

```text
OPENROUTER_VIDEO_API_URL=https://openrouter.ai/api/v1/videos
OPENROUTER_VIDEO_MODEL=bytedance/seedance-2.0-fast
VIDEO_DURATION=5
VIDEO_ASPECT_RATIO=16:9
VIDEO_RESOLUTION=720p
```

The existing `OPENROUTER_API_KEY`, site URL, and site title are reused. No key is added to HTML, committed files, response payloads, or logs.

## Prompt Construction

The video prompt combines:

- the student's current writing;
- the selected scene mood;
- a directive to preserve the approved image's character identity, clothing, hairstyle, age, and illustration style;
- one clear subject action;
- subtle environmental motion;
- gentle camera movement;
- classroom-safe restrictions;
- no new characters, readable text, logos, violence, or abrupt scene changes.

The approved generated image is the primary source of visual truth. The video prompt animates it rather than redesigning it.

## Frontend States

The video button has five explicit states:

- `Generate Image First`: no approved/generated scene image exists.
- `Generate Scene Video`: ready to submit.
- `Preparing Video...`: request is being accepted.
- `Generating Video...`: asynchronous job is pending or in progress.
- `Regenerate Video`: a completed video exists.

The preview uses a native `<video controls playsinline>` element after completion. Polling runs at a bounded interval and stops on `completed`, `failed`, page unload, or timeout. A second click while a job is active is ignored.

## Storage

Completed video metadata is stored in:

```text
storieslens_<mode>_generated_video
```

Stored fields:

```json
{
  "jobId": "job-abc123",
  "videoUrl": "/public/generated/videos/job-abc123.mp4",
  "downloadUrl": "/public/generated/videos/job-abc123.mp4",
  "sourceImageUrl": "/public/generated/.../image.png",
  "prompt": "...",
  "savedAt": "2026-07-22T00:00:00.000Z"
}
```

The MP4 is saved beneath `public/generated/videos/`, which remains git-ignored.

## Error Handling

- Missing API key: return configuration guidance without exposing secrets.
- Missing source image: return `Generate an image before making a video.`
- Unsupported model parameters: return the provider message in server logs and a concise retry message in the UI.
- Failed or cancelled OpenRouter job: stop polling and preserve the source image.
- Poll timeout: stop polling and tell the user the task is still unavailable; do not pretend completion.
- Download failure after completion: retain the job ID and allow a retry.

## Testing

Automated tests cover:

- video environment defaults;
- submit route and required source-image validation;
- normalized pending/completed/failed responses;
- completed MP4 local persistence;
- frontend calls real video routes instead of the previous simulated toast;
- frontend video player and progress states;
- no API keys or provider debug payloads in student-facing HTML.

After automated tests pass, one paid local smoke test will submit a five-second Seedance Fast job using the most recent generated image, poll until terminal status, verify that the returned file is an MP4, and play it in `visual-write.html`.

## Out of Scope

- Production billing and durable database quota transactions.
- Class-movie scene stitching.
- Webhook handling.
- Alternative video-model selection in the student UI.
- Long videos, dialogue, avatars, or lip synchronization.
