# Group Project Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a five-stage friend-group studio that locks shared character and art rules before collaborative chapter image/video generation.

**Architecture:** A dedicated static page reads the friend project created in Visual Write, persists its Story Bible, character approval, chapters, media candidates, votes, and publish state in localStorage, and calls the existing image/video proxy routes. Step guards keep Chapters, Gallery, and Publish unavailable until the owner approves the shared character.

**Tech Stack:** HTML/CSS, browser JavaScript, localStorage prototype data, existing `/api/generate-image` and `/api/generate-video` routes.

## Global Constraints

- Preserve the star-field visual language.
- Reuse existing image and video API routes.
- Shared character description and art style must be included in every chapter visual prompt.
- Students edit only their claimed chapter in the prototype UI.

---

### Task 1: Add the Group Project Studio contract
- [ ] Add failing tests for the page, five stages, character gate, chapter visual tools, gallery voting, and publishing actions.
- [ ] Run tests and confirm the page is missing.

### Task 2: Implement project setup and Story Bible
- [ ] Create `group-project-studio.html` with state restoration and Story Setup.
- [ ] Add real character image generation, regeneration, and approval.
- [ ] Verify Chapters stay locked until approval.

### Task 3: Implement collaboration and visual output
- [ ] Add claimable chapter cards and a chapter editor.
- [ ] Include approved character and art style in image prompts.
- [ ] Generate video only from an approved chapter image.

### Task 4: Implement Gallery and Publish
- [ ] Render chapter writing and visual candidates with Vote and Use in Book.
- [ ] Add print/PDF, video download, and share-link actions with writer credits.
- [ ] Run automated and browser workflow verification.
