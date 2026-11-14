Fragments — technical architecture
Planning baseline · 14 November 2026

**Selected implementation direction.** Use Tauri 2, a Rust application core, and a React + TypeScript interface built with Vite. This is a desktop application with bundled local assets. No hosted application server, account service, Node runtime sidecar, or remote content service is required for normal use.

Tauri separates core operations from the system webview; its Windows rendering environment is WebView2. React documents Vite as an option for applications built from scratch. These support the selected direction, while the archive format remains independent of either UI technology. [Tauri process model](https://v2.tauri.app/concept/process-model/), [React build guidance](https://react.dev/learn/build-a-react-app-from-scratch).

Exact dependency versions are pinned at implementation kickoff after checking their supported toolchains and licenses. This document selects responsibilities and interfaces rather than claiming that the development environment has already been installed.

**Responsibility boundaries.**

| Component | Owns | Must not own |
| --- | --- | --- |
| React interface | Navigation, accessible reading/editor views, transient interaction state, layout and motion | Archive keys, authoritative filesystem writes, long-lived plaintext storage |
| Rust domain core | Record validation, people/date semantics, revisions, transactions, exports, conflict detection | Visual layout and browser-specific behavior |
| Archive service | Encryption, single-writer locking, commit publication, recovery, snapshot pinning | Silent overwrites or inferred relationships |
| Media workers | Original import, metadata reading, encrypted derivatives, streaming playback access | Modification of source originals |
| Query service | Disposable SQLite search/index, filtering, incremental updates | The only copy of any user-authored content |
| Transfer service | Complete snapshots, readable edition, import/restore validation | Merging independent archives in version one |

Keep Rust domain and archive logic independent of the desktop shell so it can be tested without a webview and reused by future platform adapters or recovery tools.

**Data flow.** The interface submits an intentional operation with an entity ID, expected revision, and operation ID. Rust validates it, serializes the new canonical objects, encrypts and signs the commit, publishes the head, and acknowledges the committed revision. The index catches up afterward. The UI distinguishes a successful save from indexing progress.

Queries return bounded pages and lightweight metadata. Full media bytes use a controlled stream, not large base64 values passed through every UI update. Repeated operation IDs are safe to retry; stale expected revisions return a conflict rather than silently replacing newer data. Only one writer is allowed per archive, including across two desktop processes.

**Core operation families.** Plan operations for archive creation/open/unlock/lock; memory and reflection edits; people and chapter management; media imports and identification; timeline/search queries; encrypted snapshot creation; independent readable export; validation/restore; and preference updates.

Long operations return a job ID with progress, cancellation, completion, and failure states. Cancelled imports cannot publish incomplete references. Completed batches explain partial failures. All errors identify whether data is saved, pending, or recoverable.

**Editor and portable text.** Use Tiptap's local editor core as the initial adapter, with a deliberately bounded formatting set. Maintain a round-trip adapter between editor state and the Markdown/block model in ARCHIVE_FORMAT.md. Editor-specific JSON is transient and must not become the only authoritative representation.

Tiptap's Markdown extension is currently documented as beta with edge cases; its conversion must not be assumed lossless. Prove Persian text, mixed-direction paragraphs, links, mentions, lists, and punctuation survive repeated edit/save/export cycles. Disable unsupported rich formatting rather than silently discarding it. No paid conversion API or hosted editor service is part of the design. [Tiptap editor](https://tiptap.dev/docs/editor/getting-started/overview), [Markdown extension status](https://tiptap.dev/docs/editor/markdown).

Use CSS-based layout and modest native web animations first. Navigation state stores origin, selected IDs, filters, and reading position. The navigation stack and viewport state are device-local; meaningful page arrangements are portable.

**Search and calendars.** Use SQLite with FTS5 for derived search data; FTS5 provides local full-text indexing. Keep the unlocked database in memory and persist only authenticated encrypted snapshots, as required by the encryption plan. Index records incrementally and validate the indexed commit on reload. [SQLite FTS5](https://www.sqlite.org/fts5.html).

Preserve original writing exactly. Search may normalize Persian/Arabic forms of yeh and kaf, digits, and selected spacing for matching, while keeping an exact-text option. Do not change names or body text during normalization. Test half-spaces, diacritics, aliases, and mixed Latin/Persian queries. Language-aware stemming and semantic search are later features.

Use the Rust ICU4X calendar implementation as the baseline for Persian/Gregorian conversion. Keep one authoritative conversion path for storage and filtering, with frontend formatting checked against it. Preserve the original calendar expression and conversion version, especially for historical or approximate dates. [ICU Persian calendar](https://docs.rs/icu/latest/icu/calendar/cal/struct.Persian.html).

The English UI remains left-to-right. Writing direction is selected per text block, with automatic detection and an override. Both calendars support input and display; users choose a primary calendar and can show the secondary one. Supported conversion ranges are documented from the implementation and verified fixtures; out-of-range input must not be silently approximated.

**Media support boundary.**

| Material | First-release commitment |
| --- | --- |
| JPEG, PNG, WebP | Import, original preservation, thumbnails, viewing; verify orientation and color handling |
| MP4 with H.264/AAC | Target in-app playback and seeking on the reference Windows system, subject to an early encrypted-playback proof |
| MP3 and PCM WAV | Target local audio playback with encrypted streaming |
| HEIC/HEIF, RAW, MOV with other codecs, other recordings | Preserve originals and metadata when readable; show an honest unavailable-preview state if decoding is unsupported |
| Text or other attachments | Preserve through an explicit attachment action; no automatic script execution or embedded web rendering |

File extensions alone do not prove codec support. Record what was actually detected. A sample format matrix must accompany the release. Preserve files larger than 4 GB through streaming, even where the UI cannot play their encoding. Initial delivery does not depend on bundling a transcoder. Adding one later requires its own distribution, security, and format review.

**Encryption and controlled access.** Follow PRIVACY_AND_RECOVERY.md: age objects, separate password/recovery wrappers, signed manifests, opaque filenames, encrypted caches, and verified restoration. Use the age streaming reader as the starting point for bounded media reads; authentication and seeking are tested in the actual Windows app.

The renderer receives narrow operations rather than general filesystem or shell access. Configure Tauri capabilities explicitly and validate all command arguments in Rust; Tauri's capability layer does not replace validation inside application commands. [Tauri security](https://v2.tauri.app/security/), [Capabilities](https://v2.tauri.app/security/capabilities/).

Bundle fonts and other UI assets. Block unsolicited network loads, sanitize imported Markdown/HTML, reject executable embedded content, and open external links only on an intentional user action. Diagnostics contain operation IDs and error classes rather than memory text, names, passwords, or media content.

**Storage assumptions.** Version one writes to a user-selected local Windows NTFS directory with a single active writer. Exported snapshots use portable names and ordinary directories. Network shares and cloud-synchronized live archive folders are outside the supported write model; users can copy completed snapshots to their chosen destinations. Device preferences live outside the portable archive without private content or secrets.

The immutable-object and small-head publication design needs fault tests on Windows. File integrity, encryption integrity, and transaction integrity are separate checks. Treat unavailable or read-only storage as an explicit state.

**Performance design.** Page queries and journal rendering, bound media buffers, load thumbnails before originals, and run expensive import/index work away from the UI. The first target dataset is 20,000 memories, 2,000 people, and 100,000 media records. A 100,000-memory stress dataset is an exploratory capacity test, not a promised limit.

Reference measurements use Windows 11 x64, 16 GB RAM, SSD storage, and integrated graphics. Targets, not measured results: warm search within 300 ms; cached opening after unlock within 3 seconds; ordinary save acknowledgement within 1 second after autosave dispatch; useful feedback within 100 ms for long operations; metadata browsing memory below 1 GB, with large-media buffers measured separately. Unlock cost and cold index rebuild are reported separately.

A lifetime-sized archive must not be loaded into the DOM or decoded in full. If the in-memory index misses the target, evaluate an authenticated encrypted paged database before release; do not quietly introduce plaintext caches.

**Packaging and maintenance.** First delivery targets Windows 11 x64. Build a standard desktop installer and provide an offline installation option including the required WebView2 installer. Tauri documents offline runtime packaging; the downloaded-bootstrapper default is not enough to claim offline installation. [Windows installer options](https://v2.tauri.app/distribute/windows-installer/).

Use manual app upgrades initially, with archive-format compatibility checks and recovery snapshots. Keep versioned dependencies, license notices, reproducible build instructions, and a release checklist. Signing and additional architectures are distribution tasks, not prerequisites for preserving the documented data format.

**Early technical proofs.** Before implementing all screens, prove encrypted write/recovery on NTFS, independent decryption, seekable encrypted video without plaintext scratch files, portable editor round-tripping, calendar boundaries, and encrypted-index reload at target scale. These are the first implementation milestones, not unfinished product choices. If a proof fails, revise the relevant design with evidence and keep the preservation commitments intact.

