# StoriesLens Development Handoff

> Last updated: 2026-07-23  
> Repository: `https://github.com/yilu1219/storieslens`  
> Production: `https://www.storieslens.com`  
> Local workspace used during development: `D:\storieslens`

## 1. What StoriesLens Is

StoriesLens is a K-12 English reading, writing, and classroom co-creation product. Its central workflow is:

`Reading text -> CCSS skill match -> student writing -> AI feedback -> image/video generation -> shared book/movie`

The product currently supports three main experiences:

1. **Teacher lesson creation**
   - Upload or paste a reading passage.
   - Select grade and teaching framework.
   - Review CCSS matches, example sentences, and writing support.
   - Assign chapters or scenes.
   - Publish a class book or class movie plan.

2. **Student visual writing**
   - Free Writing for independent stories.
   - Join Teacher Project with a class code.
   - Create or join a Friend Group for informal co-writing.
   - Receive child-friendly Writing Assistant feedback.
   - Generate images and request scene videos.

3. **Group Project Studio**
   - Set a shared story.
   - Generate and approve a shared character reference.
   - Divide the story into chapters or scenes.
   - Review writing, images, videos, and votes in a group gallery.
   - Publish as an illustrated book or animated movie.

## 2. Current Architecture

This is a lightweight Node.js application with static HTML/CSS/JavaScript pages and a small server-side API.

- **Runtime:** Node.js
- **Server:** native Node `http` server in `server.js`
- **Frontend:** static HTML, CSS, and vanilla JavaScript
- **Document export:** `docx` npm package
- **AI gateway:** OpenRouter
- **Persistence:** mostly browser `localStorage`
- **Hosting:** Railway
- **Domain:** GoDaddy-managed domain pointing to Railway
- **Source control:** GitHub, `main` branch

There is currently no production database, authentication system, or true multi-device collaboration backend.

## 3. Repository and Deployment Relationship

### GitHub

- Remote: `https://github.com/yilu1219/storieslens.git`
- Primary branch: `main`
- Normal release flow:

```powershell
git status
git add <changed-files>
git commit -m "Describe the change"
git push origin main
```

### Railway

Railway deploys the GitHub repository and starts the application with:

```powershell
npm start
```

`package.json` maps this to:

```text
node server.js
```

When Railway is connected to the repository and automatic deployments are enabled, a successful push to `main` should trigger a new deployment. A GitHub push alone does **not** prove production is live; always check the Railway deployment status and then open the production page.

### Domain

- Canonical website: `https://www.storieslens.com`
- Apex domain: `https://storieslens.com` redirects to the `www` domain.
- DNS is managed in GoDaddy.
- The custom domain is attached to the Railway service.

Do not change GoDaddy DNS records unless the Railway custom-domain page explicitly provides a new target.

## 4. New Computer Setup

### Required software

Install:

1. Git
2. Node.js LTS (recommended: Node 20 or newer)
3. A code editor such as VS Code or Codex

### Clone and install

```powershell
git clone https://github.com/yilu1219/storieslens.git
cd storieslens
npm install
Copy-Item .env.example .env
```

Fill the new `.env` with valid credentials. Never copy API keys into source files or commit `.env`.

### Start locally

```powershell
npm start
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/visual-write.html`
- `http://localhost:3000/group-project-studio.html?code=STAR-DEMO`

Do not open pages with `file:///...` when testing API features. Image generation, video generation, AI feedback, Writing Assistant, and Word export require the Node server.

### Verify

```powershell
npm test
```

Also manually verify:

1. Homepage loads.
2. Teacher creation flow can move through all four pages.
3. Visual Write can generate an image.
4. Writing Assistant returns a response.
5. Group Project Studio can save a chapter and reopen it.
6. Book export downloads a `.docx`.

## 5. Environment Variables

The committed `.env.example` is the source of truth for variable names:

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Secret server-side OpenRouter credential |
| `OPENROUTER_BASE_URL` | Base URL for chat/text models |
| `OPENROUTER_MODEL` | Model used by AI Report and Writing Assistant |
| `OPENROUTER_IMAGE_API_URL` | Image-generation endpoint |
| `OPENROUTER_IMAGE_MODEL` | Image model identifier |
| `OPENROUTER_VIDEO_API_URL` | Video-generation endpoint |
| `OPENROUTER_VIDEO_MODEL` | Video model identifier |
| `IMAGE_PROVIDER` | Current provider selector; expected `OPENROUTER` |
| `IMAGE_ASPECT_RATIO` | Default image aspect ratio |
| `IMAGE_SIZE` | Image dimensions accepted by the selected model |
| `IMAGE_RESOLUTION` | Optional provider-specific image resolution |
| `VIDEO_DURATION` | Default video duration in seconds |
| `VIDEO_ASPECT_RATIO` | Default video aspect ratio |
| `VIDEO_RESOLUTION` | Default video resolution |
| `OPENROUTER_SITE_URL` | App URL sent in OpenRouter attribution headers |
| `OPENROUTER_SITE_TITLE` | App name sent in OpenRouter attribution headers |

### Security rules

- `.env` is in `.gitignore`.
- API keys must only be read by `server.js`.
- Never put an API key in HTML, CSS, client-side JavaScript, screenshots, handoff documents, Git commits, or chat messages.
- The OpenRouter key used during development was exposed in conversation history. **Revoke it and create a new key before handing off the project or launching publicly.**
- Add the replacement key in both:
  - local `.env`
  - Railway service variables

## 6. AI and Media APIs

### Image generation

Frontend pages call:

```text
POST /api/generate-image
```

The server:

1. Validates the request.
2. Builds a child-safe story illustration prompt.
3. Adds model, size, aspect ratio, style, asset type, and character context.
4. Calls the configured OpenRouter image endpoint.
5. Stores returned image data under `public/generated/` when needed.
6. Returns an `imageUrl` to the browser.

Current default model in `.env.example`:

```text
bytedance-seed/seedream-4.5
```

Important: image models do not all accept the same `size`, `resolution`, or aspect-ratio values. If an error says that `2560x1440` conflicts with `2K`, change the environment configuration to a supported combination rather than hard-coding a frontend workaround.

### Video generation

Frontend pages call:

```text
POST /api/generate-video
GET /api/video-jobs/:jobId
```

The server creates an asynchronous job, then the frontend polls for completion. Group Project Studio uses an approved chapter image as the visual reference before requesting a 5-second scene video.

Current default model in `.env.example`:

```text
bytedance/seedance-2.0-fast
```

Video support is provider/model dependent. Before a demo, test that:

- the selected OpenRouter account can access the model;
- the video endpoint accepts the configured request format;
- the account has sufficient balance;
- the job returns a downloadable video URL.

### AI Report

Endpoint:

```text
POST /api/ai-report
```

Purpose: return structured, student-friendly writing feedback such as:

- Glow
- Grow
- Next Step
- skill-level feedback

### Writing Assistant / Lobster Tutor

Endpoint:

```text
POST /api/writing-assistant
```

Used by Visual Write and Group Project Studio for:

- Give a Hint
- Check Sentence
- Add Details
- Check Continuity
- Turn into Scene

The endpoint sends grade, page context, project context, chapter text, shared character, and the requested action to the configured chat model. It expects structured JSON but includes a plain-text fallback.

Tutor voice playback uses the browser Web Speech API (`speechSynthesis`). Voice availability depends on the operating system and browser. Preferred child-friendly English voices include Jenny, Aria, Samantha, and Zira when installed. This voice playback is local browser functionality, not a paid TTS API.

## 7. Page and File Map

### Core shared files

| File | Responsibility |
|---|---|
| `server.js` | Static server and all server-side API endpoints |
| `styles.css` | Main site styling |
| `script.js` | Shared page behavior, Visual Read, legacy group writing, storage helpers |
| `package.json` | Start/test scripts and `docx` dependency |
| `.env.example` | Safe environment-variable template |

### Product pages

| File | Responsibility |
|---|---|
| `index.html` | Homepage, teacher/student entry paths, pricing |
| `visual-read.html` | CCSS visual reading prototype |
| `visual-write.html` | Free Writing, teacher assignment, Friend Group entry |
| `group-project-studio.html` | Five-step collaborative story studio |
| `group-write.html` | Earlier local group-novel prototype |
| `teacher-dashboard.html` | Teacher management prototype |
| `teacher-project.html` | Teacher project review prototype |
| `project-output.html` | Output selection/project result page |
| `wx-callback.html` | WeChat callback placeholder/prototype |

### Four-page teacher workflow

| Step | File | Purpose |
|---|---|---|
| 1 Upload | `create-reading-project.html` | Reading text and lesson setup |
| 2 Review | `create-reading-review.html` | CCSS match, summary, examples, writing support |
| 3 Assign | `create-reading-assign.html` | Chapters/scenes and student tasks |
| 4 Publish | `create-reading-publish.html` | Lesson plan and class output plan |

Shared files:

- `create-project-flow.js`
- `create-project-flow.css`

### Standards and tests

- `resources/source/ccss-ela-standards.pdf`
- `resources/ccss/ela-standards.json`
- `resources/ccss/ela-standards.draft.json`
- `resources/ccss/ccss-extracted-text.txt`
- `scripts/extract-ccss.js`
- `tests/homepage.test.js`

Design/specification notes are under `docs/superpowers/`.

## 8. Teacher Creation Flow

The four steps are separate pages, not vertical anchors on one long page.

### 1. Upload

Teacher provides:

- reading passage;
- project title;
- grade K-12;
- K-12 CCSS or Creative Writing framework;
- output type;
- class size.

The page saves a shared draft and moves to Review.

### 2. Review

Teacher reviews:

- reading summary;
- recommended CCSS;
- why the passage matches;
- source-text example sentences;
- teacher-facing Writing Support.

Teacher cards should show exact CCSS codes. Student-facing cards should show plain-language skill focus without codes.

### 3. Assign

Teacher chooses chapters or scenes and adjusts:

- part title;
- student writing task;
- skill focus;
- rewrite pattern;
- assignment ownership.

### 4. Publish

Teacher selects:

- Illustrated Book; or
- Animated Movie.

The page can produce a lesson-ready plan and route students toward the shared project workflow.

Current workflow data is stored in:

```text
storieslens_teacher_project_draft_v2
storieslens_create_lesson_result
```

## 9. Visual Write

Visual Write has two primary paths:

### Create Together

- Join Teacher Project
- Create Friend Group
- Join Friend Group

Friend Group creation produces an invite code and opens:

```text
/group-project-studio.html?code=<INVITE_CODE>
```

### Free Writing

Student chooses a grade, enters a story idea, writes a draft, gets AI feedback, generates an image/video, and saves the story.

The UI intentionally hides technical implementation details. Students see:

- Glow
- Grow
- Next Step
- Visual Preview

They do not see raw prompts, raw JSON, model names, API schemas, or endpoint details.

## 10. Group Project Studio

### Step 1: Story Setup

The project owner chooses:

- title;
- Illustrated Book or Animated Movie;
- premise;
- world;
- shared art style;
- number of chapters/scenes.

### Step 2: Characters

The owner defines and generates the shared character reference:

- name;
- age;
- role;
- hair;
- clothing;
- personality.

The character must be approved before later steps unlock. The approved character and art style become the Story Bible for all generated visuals.

### Step 3: Chapters / Scenes

Each part has:

- title;
- writer attribution;
- independent writing editor;
- chapter image generation;
- image-to-video generation;
- save state.

The editor includes:

- Focus Writing mode;
- autosave/status feedback;
- word count;
- contextual Writing Assistant;
- Lobster Tutor voice playback.

### Step 4: Group Gallery

Group members can:

- read each chapter;
- view candidate images;
- play generated clips;
- vote;
- select an image for the final book;
- regenerate;
- create a short video from an image.

### Step 5: Publish

For Illustrated Book:

- preview the ordered book;
- preserve writer attribution;
- save to Works;
- export a printable Word document;
- print/export PDF through the browser.

For Animated Movie:

- collect chapter scene videos;
- arrange them on a simple timeline;
- add student narration recordings;
- preview the sequence;
- download available media.

The current Movie Editor is a frontend prototype, not a full server-side video compositor. True final MP4 assembly, transitions, mixed audio, and cloud rendering require a media-processing backend such as FFmpeg workers or a dedicated video API.

## 11. Browser Storage and Data Migration

Most product data currently lives in the browser that created it.

Important keys include:

| Key | Data |
|---|---|
| `storieslens_teacher_project_draft_v2` | Four-page teacher workflow draft |
| `storieslens_create_lesson_result` | Generated lesson/project result |
| `storieslens_friend_group_projects` | Friend Group projects |
| `storieslens_active_friend_project` | Active group |
| `storieslens_works` | Saved group books/works |
| `storieslens_student_visual_write` | Student writing payload |
| `storieslens_student_identity` | Student/group identity |
| `storieslens_visual_read_drafts` | Visual Read drafts |
| `storieslens_reading_recordings` | Local reading recordings |
| `storieslens_identity_mode` | Student/teacher mode |
| `storieslens_write_generated_images` | Generated image records |
| `storieslens_lobster_tutor_voice` | Preferred browser voice |
| `storiesLens_group_novel` | Legacy group novel |
| `storiesLens_group_member` | Legacy group member |
| `storiesLens_group_chat` | Legacy group chat |

### Critical limitation

`localStorage` is not synced through GitHub, Railway, or the domain. It belongs to one browser profile on one device.

When moving to another computer:

- source code moves through Git;
- API configuration moves by manually recreating `.env` and Railway variables;
- browser projects do **not** move automatically;
- recordings and locally saved drafts may be lost unless exported.

Before relying on real classrooms, migrate project/user/media data to a backend database and object storage.

Recommended future stack:

- authentication;
- relational database for teachers, students, classes, projects, chapters, votes, and credits;
- object storage for images, recordings, videos, and exports;
- realtime collaboration channel;
- signed share links;
- audit logs and child-data consent controls.

## 12. Credits and Plan Logic

The UI concept separates:

1. product quotas:
   - projects;
   - class books;
   - classes;
   - students;
   - teacher seats;
   - export rights;
   - watermark removal;
   - parent share links;
   - class movie publishing;

2. generation credits:
   - one image generation = one image credit;
   - one scene video generation/regeneration = one video credit;
   - class movie cost = total generated scene videos.

At present, this is primarily a UI/product prototype. Production billing requires server-side metering, authenticated accounts, transactional credit deduction, payment integration, and abuse prevention.

## 13. What Is Real vs. Prototype

### Implemented and locally functional

- static pages and navigation;
- four-page teacher creation flow;
- CCSS data resource and matching UI;
- Free Writing and teacher assignment layouts;
- OpenRouter image API route;
- OpenRouter video job route/polling;
- AI Report route;
- contextual Writing Assistant route;
- browser speech synthesis;
- browser recording prototypes;
- local group projects;
- character approval gate;
- chapter image/video generation;
- gallery/voting UI;
- local Works saving;
- Word book export;
- GitHub-to-Railway deployment.

### Prototype or partial

- Friend Group sharing across different devices;
- simultaneous multi-user editing;
- classroom rosters;
- Teacher Dashboard live analytics;
- Google Classroom, DingTalk, WeCom, Seewo, and WPS integrations;
- WeChat login;
- actual subscriptions and credit billing;
- permanent cloud media library;
- final class-movie rendering;
- robust role-based authorization;
- parent share links;
- FERPA/COPPA-grade compliance controls.

### Not yet production-safe

- browser-only identity;
- localStorage as primary project store;
- invitation codes without backend authorization;
- no account recovery;
- no server database;
- no rate limiting or generation ledger;
- no moderation/teacher approval service beyond UI state.

## 14. Troubleshooting

### Page works under `file:///` but AI buttons fail

Cause: the static file is not connected to `server.js`.

Fix:

```powershell
npm start
```

Then use `http://localhost:3000/...`.

### `Writing help is unavailable`

Check:

1. local server is running;
2. `OPENROUTER_API_KEY` exists in `.env`;
3. model name is valid and accessible;
4. browser Network panel shows the response from `/api/writing-assistant`;
5. Railway has the same environment variables in production.

### Image size/resolution conflict

Check `IMAGE_SIZE`, `IMAGE_RESOLUTION`, and model documentation. Use only a combination supported by the selected image model.

### Image generation returns no picture

Check:

- OpenRouter balance;
- model access;
- endpoint/model compatibility;
- Railway logs;
- browser Network response;
- generated file path under `public/generated/`.

### Video button does not finish

Check:

- video model access;
- request endpoint;
- job ID returned by `/api/generate-video`;
- polling response from `/api/video-jobs/:jobId`;
- provider processing time and account credits.

### Changes are on GitHub but not on the website

Check:

1. the commit is on `origin/main`;
2. Railway started a deployment for that commit;
3. build and start logs succeeded;
4. custom domain points to the correct Railway service;
5. browser cache is refreshed.

### Railway says no start command

Confirm `package.json` contains:

```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

### Data disappeared on another computer

This is expected for browser-local projects. The repository does not contain localStorage data. Export important work before changing computers.

## 15. Safe Release Checklist

Before every production release:

1. Run `git status` and inspect every changed file.
2. Confirm no `.env`, key, generated media, or private student data is staged.
3. Run `npm test`.
4. Start locally with `npm start`.
5. Test homepage, teacher flow, Visual Write, Group Studio, image generation, Writing Assistant, and export.
6. Commit with a focused message.
7. Push `main`.
8. Check Railway deployment logs.
9. Open `https://www.storieslens.com` in a private/incognito window.
10. Test one real API call with a low-cost prompt.

## 16. Recommended Next Development Priorities

### Priority 1: Production data foundation

- Add authentication.
- Move projects, chapters, identities, and votes from localStorage to a database.
- Store media in object storage.
- Add role and ownership checks.

### Priority 2: Classroom collaboration

- Real invitation codes.
- Teacher-managed groups.
- Realtime chapter updates.
- submission/revision states;
- per-student attribution and activity history.

### Priority 3: Publishing quality

- page-by-page illustrated book builder;
- robust Word/PDF generation;
- FFmpeg-based movie assembly;
- audio narration mixing;
- transitions, captions, and final MP4 export.

### Priority 4: Safety and billing

- content moderation;
- child privacy and consent;
- server-side credit ledger;
- subscription/payment integration;
- usage limits and rate limiting;
- admin monitoring.

### Priority 5: Integrations

- Google Classroom for international schools;
- Excel roster import as the universal fallback;
- DingTalk/WeCom/Seewo/WPS only after core classroom data is stable.

## 17. Account Handoff Checklist

Record these securely outside the repository:

- GitHub account/repository access;
- Railway project/service access;
- GoDaddy domain and DNS access;
- OpenRouter account and billing access;
- production environment-variable inventory;
- recovery email and two-factor authentication method.

Before transferring ownership:

1. Rotate the exposed OpenRouter key.
2. Create a fresh production key with spending limits.
3. Confirm `.env` is not in Git history.
4. Add the new maintainer to GitHub and Railway.
5. Transfer or delegate domain access in GoDaddy.
6. Test deployment from the new account.
7. Export any browser-local demo projects needed for presentations.

## 18. Quick Recovery Card

```powershell
git clone https://github.com/yilu1219/storieslens.git
cd storieslens
npm install
Copy-Item .env.example .env
# Add new server-side credentials to .env
npm test
npm start
```

Then open `http://localhost:3000/`, verify the main workflows, and only then push or deploy.

