Fragments — first release and implementation sequence
Planning baseline · 14 November 2026

**This is the handoff from planning to building.** The scope, experience, data model, protection model, and technical direction are specified in the companion documents. Work below begins only when implementation is requested. Completion criteria are requirements to demonstrate, not claims that tests have already passed.

**The first release.** Deliver a Windows desktop journal that can create an encrypted archive, accept memories and original media, connect people and chapters, browse a life over time, support reflection, search, and survive export/restoration. English UI, Persian/English writing, and both calendars are included.

| Area | Included in version one | Later |
| --- | --- | --- |
| Capture | Text, photo/video/audio originals, attachments, captions, guided layouts, drafts and autosave | Free-position scrapbook canvas and built-in recording |
| Time | Exact/approximate/range/unknown dates, both calendars, timeline and period journal | Maps and automatic travel reconstruction |
| People | Profiles, aliases, explicit connection types, shared history, duplicate merge/undo | Face recognition, contact sync, relationship inference |
| Organization | Chapters, parent trip with dated moments, basic places, related-memory links | Deeply nested collection systems and automatic organization |
| Reflection | Separately dated reflections on memories and people | Annual-letter wizard and resurfacing prompts |
| Search | Local text and people/date/chapter/place/media filters | Semantic search, OCR, transcription, AI |
| Privacy | Encryption, password/recovery setup, lock behavior, encrypted caches/backups | Device biometrics, compromised-key rekey tooling |
| Preservation | Complete encrypted directory export, deliberate decrypted export, offline readable edition, restore and integrity checks | ZIP packaging, divergent-archive merge, sync |
| Delivery | Windows 11 x64, offline installation option, manual app upgrades | macOS/Linux/mobile UI and automatic updates |

Support promised media formats only after testing their actual encodings in the application. Other imported originals stay preserved even if no preview is available. Portability of the data is a first-release requirement; working interfaces on every platform are not.

**M0 — Establish the visual and technical foundations.** Produce the fictional sample collection described in USER_JOURNEYS.md, screen compositions for the reading/editor/people journey, and a bounded application skeleton. Set dependency pins, licenses, local assets, and reference-machine measurements.

Run small proofs for encrypted commit recovery on NTFS, age compatibility with an independent tool, media range playback without plaintext temporary files, Persian/English editor round-tripping, dual-calendar conversion, and encrypted index snapshots.

Exit: each proof has a reproducible result and any necessary library substitution is documented. Screen compositions show the warm journal direction with long text, mixed languages, small windows, and failure states. A failed preservation or encryption proof must be resolved before relying on the architecture.

**M1 — Build the encrypted archive core.** Implement the documented record format, encrypted objects, signed commits, single-writer lock, safe head publication, revisions, and validation. Add password/recovery wrappers and a minimal recovery reader.

Implement complete snapshot/restore at the core level now, before accumulating real personal content. Exports pin their commit and key generation. Add cache-independent reading and index rebuild.

Exit: an archive survives process termination at each save boundary; every acknowledged revision is retained or an explicit damaged-storage state is reported. A fresh environment can restore originals and records. Recovery works with the kit without the normal password. No personal plaintext is found in the app's archive, staging, or diagnostic output.

**M2 — Complete the first usable capture loop.** Build journal creation/unlock, add/edit memory, text/media blocks, date input, drafts, basic person selection, and memory reading. Import originals through bounded encrypted streams and generate previews safely.

Exit: J1–J3 and J11 work end to end in the actual desktop application. A memory added from a source folder remains intact after that source is renamed. Persian/English text and calendar display round-trip exactly. Save status distinguishes pending, local save, and backup.

**M3 — Organize people and life.** Add People, person profiles, explicit connection views, aliases, duplicate merging with undo, chapters, trip moments, Life navigation, the period journal, and search/filtering. Preserve back-navigation context.

Exit: J4–J7, J9–J10, and J17 pass. A mention never becomes attendance, a parent participant never leaks into every child, and shared content is stored only once. Deletion and duplicate merging preserve recoverable identities and links.

**M4 — Complete reflection and the reading experience.** Add independently dated reflections, related-memory navigation, refined compositions, media viewers, keyboard access, reduced motion, and the chosen visual styling.

Exit: J8 and J13 pass. Text-only entries are visually complete, every drag interaction has an alternative, mixed-direction content remains readable, and video/audio do not autoplay. Returning from a profile or viewer restores the correct context.

**M5 — Finish privacy, transfer, and recovery surfaces.** Expose backup/restore, archive validation, complete/decrypted/readable exports, password changes, recovery-kit handling, lock-on-idle/session/suspend, and encrypted cache management. Include optional daily backups while the app is running.

Exit: J12 and J14–J16 pass, including lock during playback and failed saving. An independent browser opens the readable edition offline; an independent tool can decrypt an archive copy. The transfer UI states clearly when an output is unencrypted or incomplete.

**M6 — Harden and package the release.** Run large-library tests, disk-space and permissions failures, interrupted imports, malicious/path-traversal import cases, incompatible-format handling, installer/uninstaller checks, and upgrades from an earlier fixture format. Complete keyboard, screen-reader, text-size, and resizing review.

Exit: all critical gates below pass on the reference Windows machine. The installer works offline, uninstalling does not delete the user-owned journal, and a manual update retains a recoverable archive. Publish known codec and capacity limitations with the release rather than hiding them.

**Dependency order.** M0 establishes feasibility. M1 is required before personal data capture. M2 provides the working loop. M3 and M4 deepen it. M5 completes user-facing preservation already established in M1. M6 is the release gate. Do not postpone encrypted storage or snapshot recovery until after the UI is filled with real memories.

**Acceptance matrix.**

| Gate | Evidence required |
| --- | --- |
| Original preservation | Imported/restored plaintext byte digests match, including a file larger than 4 GB |
| Save durability | Repeated forced termination before/after object, commit, and head publication; no false saved acknowledgement |
| Cache independence | Delete all caches and reconstruct memories, people, layouts, dates, and search |
| Content round-trip | Markdown/editor/export cycles preserve supported English/Persian writing, links, captions, and block order |
| Calendar correctness | Verified boundary/leap-year fixtures, approximate Persian year intervals, unknown time zones, and display switching |
| Relationship correctness | Separate attendance/mention/identification cases; duplicate names; merge and undo; trip participants |
| Encryption | Wrong password, corruption/truncation, forged manifest, lock access revocation, and no unintended plaintext app files |
| Recovery | Password-only restore, recovery-only restore, interrupted password change, and independent-tool recovery |
| Transfer | Snapshot consistency during active editing, missing-file reporting, readable links, safe restore to another destination |
| Accessibility | Keyboard completion, visible focus, reduced motion, text scaling, mixed direction, and narrow-window use |
| Large libraries | Reference dataset timings, bounded rendering/streaming, cold-rebuild progress, and memory measurements |
| Distribution | Fresh offline install, manual update, unsupported version read-only behavior, and archive-preserving uninstall |

**Test strategy.** Use Rust tests for archive operations, dates, identities, and fault recovery; round-trip fixture tests for portable writing; interface tests for navigation and editor interactions; and Windows desktop end-to-end checks for actual media, file access, lock events, and installation. Browser-only tests cannot establish desktop encryption or media behavior.

Use synthetic/fictitious content. Compare full restored records and original hashes, not just item counts. Tests should target loss, incorrect relationships, date drift, and failure recovery rather than mirror implementation details. Preserve compatibility fixtures with their expected interpretation.

**Performance targets.** Measure on Windows 11 x64 with 16 GB RAM and SSD storage. The baseline dataset is 20,000 memories, 2,000 people, and 100,000 media records. Aim for warm search within 300 ms, cached opening within 3 seconds after unlock, ordinary save acknowledgement within 1 second of dispatch, and clear progress for work exceeding 100 ms. Record cold rebuild, password derivation, media decode, and streaming separately. These are unmeasured targets; misses require optimization or an explicit documented scope decision before release.

**Primary risks and planned responses.**

| Risk | Response |
| --- | --- |
| Encrypted media seeking or browser caching leaks plaintext | Prove the actual Windows path in M0; change the handler before proceeding |
| File-based commits grow or recover poorly | Incremental commits and checkpoints; failure tests; visible history size; no silent pruning |
| Editor conversion drops content | Bounded formatting set and independent round-trip fixtures; replace adapter if needed |
| Persian conversion or bidirectional text differs across layers | One conversion authority; retained source calendar; cross-layer fixtures |
| Duplicate-person merge changes historical meaning | Redirect-based identity resolution with preview/undo and preserved labels |
| Large in-memory search index exceeds targets | Bound metadata; measure early; evaluate encrypted paging without weakening privacy |
| Library/codec changes break future reading | Pinned compatibility fixtures, original preservation, documented exports, and upgrade snapshots |
| Lost password or recovery secret | Clear setup, recovery verification, independent instructions; no fictitious server reset |

**What completion means.** The release is ready when a real user can add and revisit memories and people comfortably, trust the save/lock status, and recover the journal independently. A beautiful demo alone does not complete the release, and a technically durable archive alone does not complete the experience.

No calendar deadlines or effort estimates are asserted yet. Estimate after M0 exposes the actual cost of encryption/media integration and the chosen visual treatment. The immediate next work, if implementation is requested, is M0—not another open-ended planning phase.

