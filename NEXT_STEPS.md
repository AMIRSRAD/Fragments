Fragments — planning completion and next steps
Planning baseline complete · 14 November 2026

**The planning phase is complete.** The product vision, interface, journeys, archive model, privacy/recovery behavior, technical direction, and first-release milestones are now written. Application coding and visual prototyping have not started.

**What has been resolved.**

| Planning area | Result |
| --- | --- |
| Experience and navigation | UI_DESIGN.md defines the journal, Life, People, Chapters, Search, editing, lock, and archive views |
| Real usage and edge cases | USER_JOURNEYS.md defines 17 end-to-end stories and fictional visual content |
| Data ownership | ARCHIVE_FORMAT.md defines records, dates, relationships, originals, revisions, and exports |
| Privacy | PRIVACY_AND_RECOVERY.md includes encryption in version one, recovery kits, protected caches, and independent recovery |
| Stack | TECHNICAL_ARCHITECTURE.md selects Tauri/Rust, React/TypeScript/Vite, and a rebuildable SQLite index |
| First release | IMPLEMENTATION_PLAN.md defines included/deferred features, ordered milestones, and acceptance gates |
| Decision record | DECISIONS.md separates confirmed user requirements from selected implementation defaults |

Confirmed additions: English interface, Persian and English writing, both Gregorian and Persian calendars, and encryption in the first release.

**The next action is implementation milestone M0, when requested.** Prepare the fictional sample collection and initial screen compositions, establish the desktop project, and prove the risky integration paths: durable encrypted saves, independent decryption, encrypted media seeking without plaintext temporary files, portable editing, calendar conversion, and search snapshot performance.

Then follow M1 through M6 in IMPLEMENTATION_PLAN.md. The encrypted archive and core restoration come before real personal data capture. People and time organization, reflection, visual refinement, transfer surfaces, and release hardening follow.

**What remains to be demonstrated.** Visual studies, dependency pins, exact font choices, cryptographic integration, filesystem durability, media playback, measured performance, and usability are implementation work. They have not been tested or completed by these documents.

The full document map is in [README.md](README.md). No further broad planning phase is required before beginning the agreed implementation.
