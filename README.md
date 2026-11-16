Fragments — project planning package
Planning baseline complete · 14 November 2026

Download the Windows x64 installer from [GitHub Releases](https://github.com/AMIRSRAD/Fragments/releases/latest). See the [desktop guide](app/README.md) for using Fragments and building it from source.

**Fragments is a lifelong local journal.** It combines memories, writing, photographs, video, people, dates, chapters, and reflection in a warm physical-journal interface with a dreamlike sense of moving through time.

The first interactive sample journal is available in [app](app/README.md). It demonstrates the reading, people, timeline, and editing experience with fictional content. Sample changes last for the current session. The planning documents below describe the full release.

**Confirmed first-release requirements.** Windows first; English interface; Persian and English writing; Gregorian and Persian date input/display; encryption from the first release; original media preservation; exportable/importable data and portable settings; permanent organized histories for people.

**Read the plan in this order.**

| Document | Purpose |
| --- | --- |
| [Product plan](PRODUCT_PLAN.md) | Purpose, emotional experience, and long-term product vision |
| [Decisions](DECISIONS.md) | Confirmed requirements and selected implementation defaults |
| [UI design](UI_DESIGN.md) | Screen layouts, interaction behavior, visual direction, and interface states |
| [User journeys](USER_JOURNEYS.md) | Complete stories covering capture, people, reflection, privacy, and recovery |
| [Archive format](ARCHIVE_FORMAT.md) | Authoritative records, dates, relationships, originals, and portability |
| [Privacy and recovery](PRIVACY_AND_RECOVERY.md) | Encryption, passwords, recovery kits, locking, and independent access |
| [Technical architecture](TECHNICAL_ARCHITECTURE.md) | Stack, component responsibilities, media handling, and early proofs |
| [Implementation plan](IMPLEMENTATION_PLAN.md) | First-release scope, ordered milestones, acceptance gates, and risks |
| [Next steps](NEXT_STEPS.md) | Short planning-completion record and implementation handoff |

**How the documents fit together.** DECISIONS.md resolves earlier alternatives. ARCHIVE_FORMAT.md defines preservation semantics; PRIVACY_AND_RECOVERY.md defines how they are protected. UI_DESIGN.md describes the experience, and IMPLEMENTATION_PLAN.md defines what must be demonstrated before release. The product vision includes future possibilities; the implementation plan sets the first-release boundary.

**Preservation and privacy together.** The live journal is encrypted. Its decrypted content uses ordinary documented records, writing, and media. Complete backups are encrypted by default. A readable HTML edition is a deliberate unencrypted export. Recovery instructions and independent tooling must make access possible without a running Fragments installation.

**Chosen technical direction.** Tauri 2 and Rust with React, TypeScript, and Vite. SQLite is a replaceable local index. The age file format is the selected encryption baseline, with password and recovery wrappers plus signed archive commits. These are planning choices requiring the validation described in the implementation plan.

The preview establishes the initial visual direction. Remaining foundation work includes durable encrypted archive storage, independent restoration, encrypted media playback, and Persian date entry.
