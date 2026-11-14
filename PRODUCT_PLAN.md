Fragments — product vision and experience plan
Planning baseline · 14 November 2026

The detailed decisions are recorded in [DECISIONS.md](DECISIONS.md), with the full document map in [README.md](README.md). Product planning is complete; implementation and visual validation have not started.

**Fragments is a personal, lifelong journal for preserving memories and the people within them.** It brings writing, photographs, video, audio, dates, and reflection together into a book that grows with its owner. The experience should make it natural to record everyday life, revisit earlier chapters, and understand connections across years.

“Fragments” is a working name taken from the project folder. This document describes the intended product. The companion specifications select the implementation baseline; exact visual polish will be refined during implementation.

**Our agreed direction is a warm physical journal with the feeling of travelling through memories.** Paper tones, ink-like text, thoughtful typography, subtle texture, and spacious compositions provide the warmth. Movement, pacing, and connections between moments provide the dreamlike feeling.

Windows is the first platform, and the computer is the primary place for adding and organizing memories. The first release uses an English interface, supports Persian and English writing, accepts and displays Gregorian and Persian dates, and encrypts the archive. The archive and portable settings must be designed for use across platforms. A future app, or someone reading the exported files, should be able to understand the content even if Fragments is no longer maintained.

**Time, memories, people, and chapters form the structure.** A memory is the central record: something that happened, something observed, or something worth remembering. It may contain one sentence, a photograph, an entire story, or several kinds of media.

People connect memories across a life. Chapters provide personal context: “University,” “Our first home,” “Summer by the sea.” Chapters can overlap, and a memory can belong to more than one. Dates provide a chronological view without forcing every experience into a rigid calendar.

The timeline, book, and people pages are different views of the same records. A shared memory is stored once and appears wherever it belongs. Editing it updates all those views.

**Opening the app should feel like opening a familiar place.** After unlocking, resume the last reading position, with a route to the current period. A date, an image, and a few words establish the mood. First use presents an empty-journal invitation; visual compositions will refine this selected behavior.

Navigation works at three distances:

- Your life: years and chapters, with selected moments providing landmarks.
- A period: months, seasons, or chapters presented as a flowing sequence of memories.
- A memory: a focused page where its writing and media have room to breathe.

Moving between these distances should preserve your sense of place. Opening a memory and returning should bring you back to the same position. Following someone’s name into their history should leave a clear route back.

A date picker, search, and ordinary navigation remain available. Motion should be gentle, interruptible, and optional. Keyboard use, readable text, clear contrast, and reduced motion belong in the design from the beginning.

**The book should feel composed, while remaining easy to create.** The proposed direction is a flowing journal with flexible layouts for writing, photographs, video, audio, and captions. A small set of thoughtful arrangements can give pages variety without requiring the user to design every page manually.

A memory can stand alone as a photograph and one sentence. A richer memory can contain a sequence of images, longer writing, recordings, and later reflections. Media opens into a focused viewer and returns to its original context. Sound and video playback should be deliberate.

The first release uses guided layouts with reorderable content. Literal page turns, elaborate 3D scenes, and unrestricted scrapbook positioning are later possibilities.

**Adding a memory should begin with whatever you already have.** Drop in photographs, start writing, or choose a date. The app creates a draft that can be saved immediately and enriched later.

The proposed flow is to add content, confirm when it happened, identify who was there, and optionally connect a place or chapter. Titles, captions, and detailed organization should be optional wherever practical.

Available media information can suggest dates, but the user can correct it. Autosave should clearly communicate whether work is saved. Unfinished drafts should remain easy to find, and accidental edits or deletions should be recoverable.

Imported originals should be copied into the managed archive by default. Moving or renaming the source folder afterward should not break a memory.

**Dates must describe what is actually known.** The archive distinguishes when an event happened from when it was recorded or edited.

A memory can have an exact date and time, a day without a time, an approximate month or year, a date range, or an unknown date. Approximate dates should remain visibly approximate. Exact timestamps should retain the context needed to avoid shifting an event to the wrong day when moving between time zones.

A trip can contain several individually dated moments. Dates suggested from a camera are suggestions rather than unquestionable facts. Both Persian and Gregorian calendars are included. Preserve the entered calendar and precision while allowing the user to choose a primary display and show the equivalent secondary calendar.

**People deserve permanent, carefully organized places in the journal.** Each person can have a chosen portrait, a name and nicknames, personal notes, shared memories, connected media, and reflections written about them.

Their page gathers a chronological history from existing memories. Optional chapters together can describe periods such as school years, living together, or reconnecting. The user chooses the language for these relationships; the app should not infer relationship status.

Someone leaving your present life does not remove their place in its history.

Connections need distinct meanings:

- Present in a memory: the person was there.
- Mentioned in writing: the entry discusses the person, whether or not they attended.
- Appears in media: the person was identified in a particular photograph or video.
- Connected to a chapter: the person belongs to that broader period.

Writing “I thought about Sara on this trip” must not mark Sara as a trip participant. Likewise, appearing in one afternoon of a longer trip must not automatically imply attending every moment.

While writing, selecting a person’s name or using an @ mention links to their record. The finished page displays the name naturally. A separate “Who was there?” field records participants.

The organization should support people with identical names, nicknames, name changes, and safely merging duplicate records. Links use permanent identifiers so renaming someone does not disconnect their history. Earlier writing remains as written unless the user chooses to edit it.

**Shared memories should remain connected without duplication.** An entry such as “An afternoon by the sea” might include a date, a place, three participants, twelve photographs, and a story. It appears on the main timeline, in its chapter, and on each participant’s page.

Each photograph can identify the people actually pictured. Someone only mentioned in the story has a different connection. Searching for two people should be able to find the moments they attended together, with the relationship type made clear.

People pages should feel like personal portraits with a history unfolding beneath them. Sorting, filtering, and editing controls should remain available without dominating that experience.

**Reflection should preserve different versions of your perspective.** Returning to an old memory can mean adding a new reflection dated today, while keeping the original entry intact.

The larger vision includes connections between memories, annual letters, personal chapter introductions, and optional prompts for revisiting the past. These features should encourage reflection without requiring daily writing.

Controls over resurfacing matter. The user should be able to exclude particular people, dates, or chapters from unsolicited suggestions while keeping them accessible through intentional browsing. Streaks and productivity scoring are outside the proposed direction.

**Finding things should work as the archive grows.** Search should cover writing, titles, captions, people, chapters, dates, and places where supplied. Filters should support questions such as “memories with Sara and Ali during university.”

Large libraries need responsive browsing, previews, and background processing so opening a chapter does not require loading all its original media. Import progress should remain visible, and interrupted work should be recoverable. Supported media formats and any playback limitations will need to be documented.

Maps, automatic transcription, face recognition, and AI assistance are optional future explorations. The essential experience must work without them or an online service.

**The archive must remain useful independently of Fragments.** A user-owned encrypted folder contains original media, Markdown writing, documented JSON records, and portable preferences. Its decrypted contents use ordinary formats. SQLite supports browsing and search, with its index rebuildable from preserved records. Independent decryption and readable export are required.

The structure and transaction model are specified in [ARCHIVE_FORMAT.md](ARCHIVE_FORMAT.md). Their requirements include:

- Preserve original media and distinguish it from generated previews.
- Keep writing readable and document how page arrangements are represented.
- Preserve dates, date precision, captions, people, chapters, and their connections.
- Use relative file references instead of paths tied to a Windows account or drive.
- Give records stable identifiers and document the archive format and its versions.
- Keep portable preferences separate from device-specific settings.
- Preserve a recoverable archive when upgrading its format.

Appearance preferences and supported layout choices should travel with the archive. Window positions and local backup destinations should be configured for each device. An app that encounters settings it cannot support should explain this and handle them safely.

**Export and import are essential product features.** A complete export carries content, original media, relationships, layouts, matching key envelopes, and portable settings. It stays encrypted by default; decrypted export is an explicit choice.

A readable edition should provide ordinary HTML pages and linked media, including people pages and navigation between connected memories. It opens independently of the installed app, without a hosted service, and is explicitly unencrypted. A printable PDF can later provide a keepsake edition, while the complete archive retains the richer material.

Import validates the archive and reports missing or unsupported material. Version one opens or restores a separate archive; merging independently edited archives comes later. Repeated opening must not multiply memories, overwrite newer writing, or lose relationships.

Original media preservation does not guarantee that every future device can play every format. The export design should allow accessible viewing copies while retaining originals.

**Trust includes privacy, backups, and recovery.** Core use should work offline without a required account. Uploading private content should be an explicit user action.

Backups should include the content and relationships needed for a complete restore. The app should make backup status understandable and help the user keep another copy on a destination they control. Restore must be tested, including on a fresh installation.

Recoverable deletion, safe saving, and safe format upgrades belong in the early foundation. Encryption, password/recovery-kit setup, locked-state behavior, and encrypted backups are first-release requirements, specified in [PRIVACY_AND_RECOVERY.md](PRIVACY_AND_RECOVERY.md).

**The selected stack is Tauri 2 and Rust with React, TypeScript, and Vite.** Rust handles storage and background operations. The web interface provides the journal experience. SQLite provides replaceable indexing and queries. The age file format is the encryption baseline.

These choices are detailed in [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md). Early implementation proofs validate recovery, encryption, media seeking, editing, and calendars. The portable archive does not depend on one interface framework or database implementation to remain understandable.

**We should build the vision through complete, testable experiences.** The proposed sequence is:

1. Explore the visual experience with sample content: opening the journal, moving through time, opening a memory, visiting a person, and returning.
2. Establish the archive foundation: records, media ownership, dates, people connections, safe saving, export, import, and restoration.
3. Build the first complete journal experience: add a memory, connect people, find it in time, read it, edit it, reopen the app, and restore the archive elsewhere.
4. Deepen the book through chapters, richer layouts, reflections, search, and better media organization.
5. Evaluate later capabilities such as phone capture, optional synchronization, maps, transcription, and advanced discovery.

The first working version should demonstrate both the emotional experience and durable ownership. Its success is a real memory that is beautiful to revisit, correctly connected to its people, and recoverable outside the original installation.

**The next work is implementation, when requested.** Opening behavior, guided layouts, calendars, language scope, and encryption are selected. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) provides the milestone order and completion gates. Visual polish and measured technical proofs belong to that work; phone capture remains a later phase.

The lasting product principle is that a memory keeps its context: when it happened, who was there, what it meant then, and what it means now.

