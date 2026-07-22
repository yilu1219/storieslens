# OpenRouter Video Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simulated StoriesLens scene-video action with a real OpenRouter Seedance image-to-video job, status polling, local MP4 persistence, and an interactive frontend player.

**Architecture:** Extend the existing Node HTTP server with an in-memory video job map and three local routes: submit, poll, and static MP4 delivery. The browser submits the most recently generated image, polls the normalized local status route, then renders a native video player and stores completed metadata in local storage.

**Tech Stack:** Node.js built-in `http`, `fetch`, `fs`, and `path`; plain HTML/CSS/JavaScript; OpenRouter asynchronous Videos API; existing Node assertion test suite.

## Global Constraints

- Use `bytedance/seedance-2.0-fast` for the first release.
- Generate 5-second, 16:9, 720p image-to-video clips.
- Never expose `OPENROUTER_API_KEY` in HTML, browser storage, responses, or logs.
- Require a generated source image before video submission.
- Treat one video credit as consumed only after OpenRouter accepts the request.
- Preserve the existing Free Creation and Teacher Assignment layouts.
- Save generated MP4 files beneath git-ignored `public/generated/videos/`.

---

### Task 1: Video API Contract and Provider

**Files:**
- Modify: `tests/homepage.test.js`
- Modify: `.env.example`
- Modify: `server.js`

**Interfaces:**
- Consumes: existing `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `sendJson()`, and `readJsonBody()`.
- Produces: `POST /api/generate-video` returning `{ jobId, status, pollUrl }`, and `GET /api/video-jobs/:jobId` returning normalized pending, completed, or failed data.

- [ ] **Step 1: Write failing structural assertions**

Add assertions that require `OPENROUTER_VIDEO_API_URL`, `OPENROUTER_VIDEO_MODEL`, `/api/generate-video`, `/api/video-jobs/`, `bytedance/seedance-2.0-fast`, and local video persistence markers.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/homepage.test.js`

Expected: FAIL because the video configuration and routes do not exist.

- [ ] **Step 3: Implement server video configuration and submission**

Add a `videoJobs` map, `getVideoConfig()`, prompt/input validation, OpenRouter request submission to `/api/v1/videos`, and normalized accepted response:

```js
{
  jobId: upstreamData.id,
  status: upstreamData.status || "pending",
  pollUrl: `/api/video-jobs/${encodeURIComponent(upstreamData.id)}`
}
```

The request body must include `model`, `prompt`, `aspect_ratio`, `duration`, `resolution`, and image-to-video frame input in the OpenRouter-supported shape.

- [ ] **Step 4: Implement polling and MP4 persistence**

Poll OpenRouter with the API key on the server. When complete, download index `0`, validate a video content type, save bytes to `public/generated/videos/<safe-job-id>.mp4`, and return the local URL. Normalize failures to a student-safe error while retaining diagnostic details server-side.

- [ ] **Step 5: Run server and structural tests**

Run: `node --check server.js`

Run: `node tests/homepage.test.js`

Expected: both PASS.

### Task 2: Frontend Video State Machine and Player

**Files:**
- Modify: `tests/homepage.test.js`
- Modify: `visual-write.html`

**Interfaces:**
- Consumes: `POST /api/generate-video`, `GET /api/video-jobs/:jobId`, and `storieslens_<mode>_generated_image`.
- Produces: `requestVideoFromApi(mode)`, `pollVideoJob(jobId)`, a native video preview, and `storieslens_<mode>_generated_video` metadata.

- [ ] **Step 1: Write failing frontend assertions**

Require the real video route, polling route, `<video controls playsinline>`, `Generate Image First`, `Preparing Video...`, `Generating Video...`, `Regenerate Video`, `Download Video`, and absence of the simulated `Scene video preview prepared` message.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/homepage.test.js`

Expected: FAIL because the frontend still uses a simulated image preview.

- [ ] **Step 3: Implement source-image recovery and button state**

Read the latest generated image metadata for each mode. Disable video submission without an image and change its label to `Generate Image First`. Restore completed video metadata and player state after reload.

- [ ] **Step 4: Implement submit, polling, and player rendering**

Submit the current story prompt and source image. Poll with a bounded interval until `completed` or `failed`. Render:

```html
<video controls playsinline preload="metadata" src="/public/generated/videos/job-id.mp4"></video>
<div class="student-video-actions">
  <a download href="/public/generated/videos/job-id.mp4">Download Video</a>
  <button type="button">Regenerate Video</button>
</div>
```

Disable duplicate requests while active and stop polling on terminal status or timeout.

- [ ] **Step 5: Run structural and syntax verification**

Run: `node tests/homepage.test.js`

Expected: PASS, including inline script parsing.

### Task 3: Local End-to-End Verification

**Files:**
- Verify: `server.js`
- Verify: `visual-write.html`
- Generated only: `public/generated/videos/*.mp4`

**Interfaces:**
- Consumes: configured local `.env`, a previously generated image, and the local site at port 3000.
- Produces: one playable five-second MP4 and verified browser behavior.

- [ ] **Step 1: Restart the local server**

Stop only the process listening on port 3000, then start `node server.js` from `D:\storieslens`.

- [ ] **Step 2: Verify configuration without exposing secrets**

Confirm only that the OpenRouter key is present and the video model resolves to `bytedance/seedance-2.0-fast`; never print the key.

- [ ] **Step 3: Submit one paid smoke test**

Use the current generated scene image, submit a five-second job, and poll until `completed` or `failed`.

- [ ] **Step 4: Verify the artifact**

Confirm HTTP 200, `Content-Type: video/mp4`, non-zero file size, and playable `<video>` rendering in `visual-write.html`.

- [ ] **Step 5: Run final regression checks**

Run: `npm test`

Run: `node --check server.js`

Run: `git diff --check`

Expected: tests and syntax pass; `git diff --check` reports no whitespace errors.
