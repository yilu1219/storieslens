# Four-Page Teacher Workflow Design

## Goal

Replace the vertically scrolling teacher lesson builder with four distinct pages: Upload, Review, Assign, and Publish.

## Experience

- `create-reading-project.html` collects the reading text and lesson setup.
- `create-reading-review.html` presents editable text analysis, CCSS matches, model sentences, writing support, and the 45-minute lesson plan.
- `create-reading-assign.html` assigns chapters or scenes to students.
- `create-reading-publish.html` presents the class code, student link, teacher pack, and Teacher Studio entry.
- Every page uses the same four-step rail. Completed stages are links, the current stage is highlighted, and unavailable future stages are locked.
- Back and Continue controls replace vertical scrolling between workflow sections.

## State

The shared `create-project-flow.js` module stores a versioned lesson draft in `localStorage`. It owns draft defaults, validation, completed-stage tracking, page guards, and navigation. Existing lesson-result storage remains compatible with student and teacher pages.

## Visual Direction

Preserve the current star-field background, compact teacher-facing typography, dark glass panels, blue active state, and restrained purple accents. Each page has one primary task and keeps the next action visible near the bottom.

## Failure Handling

- Review requires a reading text and grade.
- Assign requires a generated lesson result.
- Publish requires assignments.
- Direct access to an unavailable stage redirects to the earliest incomplete page and shows a concise notice.
- Draft inputs save automatically so Back, refresh, and browser history do not discard work.

## Verification

Automated checks verify all four URLs, shared script loading, stage links, page-specific content, navigation controls, and the absence of the former scroll-based stage functions. Manual checks cover the full Upload to Publish flow at desktop and mobile widths.
