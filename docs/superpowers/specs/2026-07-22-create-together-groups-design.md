# Create Together Groups Design

## Goal

Expand Visual Write co-creation beyond classrooms while keeping teacher-controlled projects clear and safe.

## Entry Modes

- Join Teacher Project: class code plus teacher-assigned student name; the teacher owns assignments and publishing.
- Create Friend Group: project owner chooses a title, Class Book or Class Movie, part count, and member limit; the app generates an invite code and link.
- Join Friend Group: invite code plus display name; members claim open parts and contribute writing and visuals.

## Prototype Storage

The first version stores friend projects in localStorage so the complete interaction can be tested in one browser. The data contract is shaped for a later database migration. Cross-device invitations require the planned backend and are not represented as production-ready until that service exists.

## Safety Defaults

Projects are invite-only, use display names, have member limits, and default to owner approval for publishing. Members edit only their assigned or claimed part.
