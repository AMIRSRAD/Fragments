Fragments — archive format and preservation contract
Planning baseline · 14 November 2026 · Target format 1.0

**The archive belongs to the user.** This is the format contract for implementation, not an assertion that a serializer has been built or tested. Records use documented JSON, writing uses UTF-8 Markdown, and original media is retained byte-for-byte. The first release encrypts these contents at rest. Unlocking or explicitly exporting them reveals the same ordinary formats; encryption does not make the underlying journal dependent on a proprietary editor.

**One authoritative archive, with replaceable indexes.** Canonical records and media determine the journal. The search database, thumbnails, and UI caches are derived. Losing a cache cannot lose a memory, person, caption, date, or page arrangement. Do not maintain an independently editable database copy of the same content.

Every archive has a random stable archive ID. Every memory, person, chapter, reflection, media record, and content block has a stable random ID. Use lowercase UUID strings for logical IDs; revisions and stored objects have their own random IDs. Names and dates are never identity keys. Integrity digests use SHA-256 with the algorithm identified in the manifest.

**Physical container.** Use a normal directory with these responsibilities:

| Location | Contents | Protection |
| --- | --- | --- |
| archive.json | Container version, archive ID, current commit pointer and digest, key-envelope locations | Minimal public bootstrap; no journal title or personal labels |
| keys/ | Password and recovery wrappers for the archive key bundle | Standard encrypted files |
| objects/ | Immutable record revisions, Markdown, and original media under opaque random filenames | Encrypted |
| commits/ | Change manifests and occasional full record catalogs | Encrypted and signed |
| cache/ | Search snapshots and generated previews | Encrypted, replaceable, bound to archive and revision |
| staging/ | Incomplete work not yet committed | Encrypted; never plaintext scratch space |
| format/ | Format description, version information, recovery instructions | Public, with no personal content |

Canonical filenames use portable ASCII IDs and relative paths, never drive letters, user names, reserved Windows names, or paths that differ only by case. Preserve original filenames in encrypted metadata. Public file counts, ciphertext sizes, and filesystem timestamps remain observable; the encryption contract does not promise to hide them.

**Record envelope.** Every logical record carries its type, entity ID, revision ID, schema version, created/updated timestamps, lifecycle state, and optional namespaced extension fields. References identify records by ID and objects by ID plus integrity information. Unknown optional fields survive read/edit/write; unsupported required features make the archive read-only.

**The record model.**

| Record | Required meaning and important fields |
| --- | --- |
| Memory | Event-date expression; draft or ready status; optional title; ordered blocks; participant IDs; chapter IDs; optional place; optional parent-memory ID; related-memory links |
| Person | Display name; aliases; optional portrait media ID; introduction/notes; optional explicitly entered relationship periods |
| Chapter | Title; optional description, cover, date range, and associated people |
| Media | Original object reference; original filename; media kind; detected format; byte length; plaintext integrity digest; original metadata where readable; capture-date suggestion; explicit person identifications |
| Reflection | Target memory or person ID; authored timestamp; ordered writing/media blocks; independent revision history |
| Preferences | Portable presentation, calendar, and text preferences |
| Archive metadata | Journal title, description, owner-chosen presentation, format requirements |

A block is text, a single media item, an image group, or a divider. Captions and alternative descriptions belong to their media placement when context-specific. A media record's default description can be reused but must not overwrite placement-specific writing. Layout data contains meaningful choices such as image fit, crop, arrangement, and order; it does not store absolute screen coordinates.

A text block references an ordinary Markdown object. Supported first-release formatting is paragraphs, headings, emphasis, lists, quotations, and links. Person mentions use a documented link destination of the form fragments:person/<id> with a preserved visible label. The app interprets the target; plain Markdown readers still show the name. Export rewrites these links to ordinary local pages. Mentions are derived from these links, not a second editable list.

**Relationships have explicit ownership.** Participation belongs to a memory. Chapter membership belongs to the memory's chapter-ID list. Identification in media belongs to the media record. Chapter-associated people belong to the chapter. Person timelines are derived from these sources.

A person's name appearing as unlinked text does not establish a relationship. A chapter association does not create attendance. A parent trip does not pass its participants down to children automatically. Each child has at most one parent; cycles are invalid. Overlapping chapters remain unrestricted.

Basic location is a user-entered label with optional coordinates; a separate places directory or online geocoding service is outside version one.

**Dates retain what the user knows.** Event dates are distinct from UTC created/updated timestamps. A date expression contains kind (exact, approximate, range, unknown), original calendar (Gregorian or Persian), precision (year, month, day, minute, or second as applicable), original numeric components, optional local time, optional offset/time-zone context, and an optional explanation of uncertainty.

Missing components remain missing. A day without a time is never converted to midnight UTC. A local time without a known zone does not acquire an invented zone. An ambiguous clock time needs a user choice or stays unresolved. A known exact instant retains the entered local representation and offset as well as its normalized instant.

Preserve Persian input in its original calendar. Derived Gregorian comparison bounds and conversion-version metadata support filtering; they are projections, not replacements for the entered date. An approximate Persian year can overlap two Gregorian years. Date conversion, leap years, and boundary cases require verified examples before release.

Undated entries have a separate collection. Approximate entries display their precision. Range searches use overlap, with visibly approximate matches; ordering inside an unresolved period uses a stable tie-breaker without inventing an exact day.

**Originals and deduplication.** Import streams a copy into encrypted archive storage, records its length and digest, and verifies completion before a committed memory references it. Do not modify the source. Exact byte duplicates can reuse an original object while keeping separate memory placements. Visually similar photos remain distinct. Plaintext digests remain inside encrypted metadata.

Generated thumbnails, crops, and playback previews are disposable derivatives with their source revision and recipe recorded. A missing derivative is regenerated. A missing original is reported; it is never silently replaced by a lower-quality preview. Re-linking a file checks its digest; accepting a different file creates an explicit replacement revision.

**Saving and crash recovery.** Use one writer per archive. A save writes new immutable encrypted objects and a commit manifest identifying changed entity revisions and their dependencies. The commit binds its archive ID, parent commit, object digests, and optional checkpoint catalog with a signature verified against the unlocked archive key bundle.

Commit payloads include format version, archive ID, commit ID, parent reference/digest, changed record-to-revision references, and referenced-object ciphertext digests. A checkpoint additionally carries the complete current entity catalog. Sign the exact UTF-8 payload bytes with an explicit commit-type/version domain prefix using Ed25519, store the payload string and detached signature in an envelope, then encrypt that envelope. Verification uses the signing identity from the authenticated key bundle; recovery also checks the independently saved kit. Cache manifests use a distinct domain prefix.

Only after objects and commit are verified and durably written is the small current-head pointer replaced. Acknowledged saves refer to that published head. The pointer replacement and filesystem-flush sequence must be proven on the supported Windows filesystem with process-termination and disk-failure tests; the plan does not assume a rename alone guarantees power-loss durability.

Unpublished staging objects are not committed data. Startup validates the head and its referenced objects, uses an explicitly retained verified recovery head if needed, and reports recovery. It must not select the newest-looking file based on modification time. A corrupt head is a recovery state, not an empty journal.

Commits reference only changes; periodic signed catalog checkpoints bound replay work. Rebuilding the index loads a checkpoint and subsequent commits. Do not rewrite a complete lifetime catalog on every keystroke. Autosave coalesces edits, with explicit saves and navigation flushing the pending revision.

**History, deletion, and space.** Ready memories and unfinished drafts are preserved by the same commit mechanism. Recently deleted items remain restorable indefinitely until the user explicitly empties them. Deleting a chapter does not delete memories; deleting a parent trip does not cascade into its children.

Deleting a person retains a tombstone for existing references and offers restoration. Merging duplicates uses an alias/redirect record, rejects cycles, preserves the original identities and labels, and can be reversed before permanent cleanup. Search resolves redirects without rewriting historical prose.

Internal revisions are retained initially; autosaves are coalesced to limit growth. The first release reports archive, history, and cache sizes. Cache cleanup is safe and available. Destructive history compaction and shared-object garbage collection are deferred until independently validated; no silent pruning is allowed. This is a deliberate storage tradeoff, not a claim of unlimited capacity.

**Complete export.** Produce a standalone directory snapshot at one committed head, encrypted by default, including current records, recoverable deleted items, retained revisions, originals, applicable key envelopes, portable preferences, format documentation, and integrity manifest. Exclude device paths, credentials outside the archive, logs, and disposable caches. A folder is the first-release baseline; compressed packaging can follow without changing the format.

Pin the snapshot and its key-envelope generation while it copies. Later edits belong to a later snapshot. Export progress must distinguish copied from verified. An interrupted copy is labeled incomplete and never advertised as a usable backup.

An explicitly requested decrypted complete export materializes ordinary records and writing with a readable catalog and original media. It removes the encryption envelope, not the relationships or layout information. Warn at the point of choosing a plaintext destination.

**Readable edition.** Produce standalone HTML, local styles, original or available viewing media, and people/chapter pages with relative links. Include a Markdown reading copy and structured catalog so the text is easy to recover. No hosted fonts, scripts, sign-in, or runtime service is required. Native browser media playback can still vary by codec.

Export scope is explicit: ready memories by default, with drafts and deleted items opt-in. Private people notes and later reflections are included only when selected in the scope preview. The complete backup remains the full preservation artifact.

**Import, restoration, and compatibility.** Version one opens an existing archive or restores a complete archive into a separate destination. It does not merge independently edited archives. Opening the same archive repeatedly creates no new records.

Validate container versions, required features, path containment, duplicate IDs, relationship integrity, decrypted record shapes, signatures, and file digests before marking a restored archive healthy. Reject path traversal, unsafe links, and resource-exhaustion inputs. Report salvageable records separately from verified restoration.

Unknown major versions are never written. For known major versions with unfamiliar optional fields, preserve those fields. Upgrades create a verified recoverable snapshot first, are restartable, and never rewrite original media. A restored archive keeps its logical ID; it receives a new device-local instance identifier so the app can distinguish copies.

Cross-platform portability means documented data, portable filenames, calendar semantics, and independent decryption/export. Windows is the only promised first-release interface. Future platform releases require their own playback and filesystem validation.

