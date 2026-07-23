# Lobster Writing Tutor Voice Design

## Goal

Let students hear every Writing Assistant response in Group Project Studio without removing the readable feedback.

## Experience

- After a writing tool returns feedback, show a compact `Lobster AI Tutor` voice row beside the response.
- Provide `Play`, `Pause`, and `Replay` controls.
- Do not autoplay. Students explicitly start audio so the interface remains classroom-friendly.
- Use an English browser voice at a slightly slower learning pace.
- Starting a new writing-tool request stops the current narration.
- Generating a new response replaces the previous narration text and resets the controls.

## Technical Design

- Reuse the browser `speechSynthesis` and `SpeechSynthesisUtterance` APIs.
- Keep narration state local to the Group Project Studio page.
- Prefer an available English voice and fall back to the browser default.
- Disable or clearly report voice controls when speech synthesis is unsupported.
- Keep API-generated feedback as the source of both the visible text and spoken text.

## Scope

This change applies to the Writing Assistant embedded in `group-project-studio.html`. It does not add a paid text-to-speech service, voice cloning, automatic playback, or saved audio files.

## Verification

- Static tests confirm the Lobster Tutor controls and speech APIs are present.
- Browser verification confirms a generated hint exposes enabled voice controls.
- Starting another writing action cancels any active narration.
