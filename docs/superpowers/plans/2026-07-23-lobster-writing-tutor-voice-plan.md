# Lobster Writing Tutor Voice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add classroom-friendly Play, Pause, and Replay narration controls to Group Project Studio Writing Assistant feedback.

**Architecture:** Extend the existing dynamically inserted group Writing Assistant with a small Lobster Tutor control row. A page-local speech controller will read the visible API response using browser `speechSynthesis`, cancel narration when a new assistant action begins, and reset when new feedback arrives.

**Tech Stack:** HTML, CSS, browser SpeechSynthesis API, Node static tests

## Global Constraints

- Do not autoplay feedback.
- Keep written feedback visible.
- Do not add a paid TTS dependency.
- Apply the change only to `group-project-studio.html`.

---

### Task 1: Lobster Tutor voice controls

**Files:**
- Modify: `tests/homepage.test.js`
- Modify: `group-project-studio.html`

**Interfaces:**
- Consumes: text rendered in `[data-group-assistant-answer]`
- Produces: `[data-tutor-play]`, `[data-tutor-pause]`, and `[data-tutor-replay]` controls

- [ ] **Step 1: Write the failing static test**

Assert that Group Project Studio includes the three tutor controls, `SpeechSynthesisUtterance`, and cancellation before a new request.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tests/homepage.test.js`

Expected: FAIL because Lobster Tutor voice controls are absent.

- [ ] **Step 3: Implement the minimal control row and speech controller**

Add Play, Pause, and Replay buttons; choose an English voice; use a learning-friendly rate; cancel narration before requests and when feedback changes.

- [ ] **Step 4: Run verification**

Run:

```powershell
node tests/homepage.test.js
git diff --check
```

Expected: all tests pass and no whitespace errors are reported.

- [ ] **Step 5: Verify in the browser**

Reload Group Project Studio, open Chapters / Scenes, generate a hint, and confirm the Lobster Tutor controls become available beside the returned feedback.
