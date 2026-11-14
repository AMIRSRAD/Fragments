Fragments — planning decisions
Planning baseline · 14 November 2026

**Planning status.** Product and architecture planning are complete enough to begin implementation when requested. No application code, visual prototype, installer, or working encryption has been produced. Early implementation proofs and visual refinement are scheduled work, not completed validation.

User-confirmed requirements take precedence over implementation defaults. This file records the current baseline and resolves earlier exploratory wording in PRODUCT_PLAN.md, NEXT_STEPS.md, and UI_DESIGN.md.

| ID | Decision | Basis |
| --- | --- | --- |
| D01 | A lifelong personal journal connecting writing, photos, videos, dates, reflection, and people | User confirmed |
| D02 | Warm physical-journal appearance; dreamlike feeling through navigation and movement | User confirmed |
| D03 | Windows is the first platform and primary capture device | User confirmed |
| D04 | Data and portable configuration must survive moving platforms or discontinuing the app | User confirmed |
| D05 | People have permanent organized histories and explicit memory/date connections | User confirmed |
| D06 | English UI, Persian and English writing, Gregorian and Persian date input/display | User confirmed in this planning phase |
| D07 | Archive encryption is required in the first release | User confirmed in this planning phase |
| D08 | Offline core; no account, cloud service, or network access required for normal use | Selected product baseline |
| D09 | Tauri 2 + Rust; React + TypeScript + Vite interface | Selected technical baseline |
| D10 | Documented JSON/Markdown/original media are authoritative; SQLite is a rebuildable index | Selected preservation baseline |
| D11 | age encryption, separate password/recovery wrappers, and signed commit manifests | Selected technical baseline; implementation review and compatibility tests required |
| D12 | Resume last reading position after unlocking; show an empty-journal invitation on first use | Selected UX baseline |
| D13 | Guided layouts with reorderable blocks; spacious editorial styling with restrained scrapbook touches | Selected UX baseline |
| D14 | Life, Journal, People, Chapters, Search; secondary Archive & settings and Lock | Selected navigation baseline |
| D15 | Chronology uses event dates; creation dates and later reflections remain distinct | Selected data baseline |
| D16 | One record appears in several views; no duplicated memories for each person or chapter | Selected data baseline |
| D17 | Attendance, writing mentions, media identification, and chapter association remain distinct | Selected data baseline |
| D18 | Complete encrypted directory exports and explicit plaintext readable editions ship in version one | Selected preservation baseline |
| D19 | Open and restore archives in version one; merge independently edited archives later | Selected scope baseline |
| D20 | First supported write environment is local Windows 11 x64/NTFS with one writer | Selected support baseline |
| D21 | Phone capture, sync, AI, face recognition, maps, printing, and unrestricted page placement follow later | Selected scope baseline |
| D22 | Lock manually, on session lock/suspend, and after a configurable 15-minute idle period | Selected privacy baseline |
| D23 | No silent deletion of backups, Recently deleted items, or internal history | Selected preservation baseline |
| D24 | Complete backups include the encrypted key wrappers but never the separately issued recovery secret | Selected recovery baseline |
| D25 | UI remains English; per-block writing direction and user-selected primary/secondary calendar support both languages | Selected UX baseline |

**Resolutions of earlier alternatives.** We are no longer choosing between a dark gallery and a warm journal, between an unrestricted canvas and guided layouts, or between plaintext-only storage and encryption later. The baseline chooses the warm journal, guided layouts, and encryption now.

Readable canonical formats describe the content after decryption. Live personal files are encrypted. Complete exports preserve that protection by default; independently readable HTML is explicitly unencrypted. These are complementary outputs with different purposes.

**First-release scope is substantial but bounded.** Include the full capture, people, time, reflection, search, encryption, backup, and recovery cycle. Keep complex synchronization and automatic interpretation of personal content outside it. Duplicate-person merging is local relationship maintenance; it does not imply support for merging two divergent archives.

**Remaining implementation refinements.** Exact dependency pins, final licensed font families, final icon artwork, calibrated password cost, supported calendar range, codec verification, and measured performance are resolved through the scheduled implementation proofs. They do not require another round of broad product planning.

Performance numbers are targets. Source documentation supports technology selection; it does not prove the application meets those targets. Cryptographic composition, filesystem durability, editor round-tripping, encrypted media playback, and independent restoration are release gates.

**Change control.** If an implementation proof fails, record the evidence and revise the smallest affected decision. Do not trade away original preservation, accurate people connections, encryption, or independent recovery to maintain a preferred library. Changes to confirmed user requirements need a user decision; ordinary implementation substitutions can be made within them.

**Working name.** Fragments remains the working name. Naming and final branding can change without affecting archive identity or compatibility.

