# Four-Page Teacher Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the teacher lesson builder into four distinct, stateful pages for Upload, Review, Assign, and Publish.

**Architecture:** A small browser module owns the versioned project draft, workflow guards, stage navigation, and local persistence. Four focused HTML pages reuse the existing visual language and render only the task for their stage.

**Tech Stack:** Static HTML/CSS, browser JavaScript, localStorage, Node assertion tests.

## Global Constraints

- Preserve the existing star-field teacher UI.
- Keep existing lesson analysis, CCSS matching, lesson-plan download, assignment, and publish behavior.
- Do not disturb current OpenRouter image/video integration or unrelated pages.

---

### Task 1: Lock the four-page contract with tests

**Files:**
- Modify: `tests/homepage.test.js`

**Interfaces:**
- Produces: assertions for the four page files, shared workflow script, stage navigation, and removal of scroll-based stage transitions.

- [ ] Add assertions that fail while Review, Assign, and Publish pages do not exist.
- [ ] Run `node tests/homepage.test.js` and confirm the missing-page failure.
- [ ] Keep the failing assertions focused on user-visible workflow structure.

### Task 2: Add the shared workflow state module

**Files:**
- Create: `create-project-flow.js`

**Interfaces:**
- Produces: `window.StoriesLensProjectFlow` with `readDraft()`, `writeDraft()`, `updateDraft()`, `requireStage()`, `completeStage()`, and `stageHref()`.

- [ ] Add test assertions for the public module contract.
- [ ] Run the tests and confirm the missing-module failure.
- [ ] Implement versioned localStorage persistence and stage guards.
- [ ] Run the tests and confirm the module contract passes.

### Task 3: Convert Upload into a focused first page

**Files:**
- Modify: `create-reading-project.html`

**Interfaces:**
- Consumes: `StoriesLensProjectFlow`.
- Produces: persisted reading text, project title, grade, framework, output type, class size, and generated lesson result.

- [ ] Add failing assertions that Upload contains no Review, Assign, or Publish sections.
- [ ] Run tests and confirm the old long-page markup fails.
- [ ] Retain only upload/setup content and navigate Continue to Review.
- [ ] Run tests and confirm Upload structure passes.

### Task 4: Build the Review page

**Files:**
- Create: `create-reading-review.html`

**Interfaces:**
- Consumes: persisted lesson draft and lesson result.
- Produces: accepted/edited review data and downloadable 45-minute lesson plan.

- [ ] Add failing assertions for Review cards, Back, and Continue to Assign.
- [ ] Run tests and confirm the page is missing.
- [ ] Implement focused Review UI and state restoration.
- [ ] Run tests and confirm Review passes.

### Task 5: Build Assign and Publish pages

**Files:**
- Create: `create-reading-assign.html`
- Create: `create-reading-publish.html`

**Interfaces:**
- Assign consumes project parts and produces student assignments.
- Publish consumes assignments and produces class code/student/teacher links.

- [ ] Add failing assertions for assignment controls and publish outputs.
- [ ] Run tests and confirm the pages are missing.
- [ ] Implement assignment persistence and publish summary.
- [ ] Run tests and confirm both pages pass.

### Task 6: Verify the complete workflow

**Files:**
- Modify only if verification reveals a defect.

**Interfaces:**
- Verifies: Upload to Review to Assign to Publish, Back navigation, refresh persistence, and direct-link guards.

- [ ] Run `node --check create-project-flow.js`.
- [ ] Run `node tests/homepage.test.js`.
- [ ] Exercise all four pages through `http://localhost:3000`.
- [ ] Check desktop and mobile layouts and ensure no console errors.
