Fragments — encryption, privacy, and recovery
Planning baseline · 14 November 2026

**Confirmed requirement: encryption ships in the first release.** New journals are encrypted by default. English is the interface language; personal writing may be Persian or English. Encryption covers records, writing, people, dates, media, drafts, history, search snapshots, and thumbnails. A password prompt over plaintext files is not an acceptable implementation.

**Protection boundary.** The product protects a locked archive and copied backups from being read without its password or recovery secret. While unlocked, the app must decrypt content to display it. It cannot promise protection against a compromised operating system, screen capture, an observer at an unlocked computer, memory inspection, or operating-system swap and crash dumps. File sizes, counts, and modification times can remain visible.

**Selected format approach.** Use the documented age file format through its Rust implementation for encrypted objects. age provides a published format and independent tooling, while its Rust reader supports seeking over a seekable encrypted source. This makes it a suitable baseline to investigate for large local media without inventing a cipher or container encryption scheme. Actual Tauri video-range playback remains an early implementation proof. [age format](https://age-encryption.org/v1), [Rust stream reader](https://docs.rs/age/latest/age/stream/struct.StreamReader.html).

Generate an age X25519 archive identity and a separate Ed25519 signing key. Encrypt objects to the archive identity. Sign commit manifests and bind their referenced SHA-256 object digests; possession of a public encryption recipient alone must not permit forging the authoritative journal. Use maintained implementations of these standard primitives, with compatibility fixtures and focused review of their composition. The selected Rust signing implementation is ed25519-dalek. [Ed25519 implementation documentation](https://docs.rs/ed25519-dalek/latest/ed25519_dalek/).

The archive secret bundle contains the encryption identity, signing secret, archive ID, and key generation. Store one password-protected wrapper and a separate recovery-protected wrapper. The password wrapper uses age's native scrypt password mode. Keep the wrappers separate: the format does not permit mixing scrypt and recipient stanzas in a single file. [age password mode](https://docs.rs/age/latest/age/scrypt/index.html), [age format rules](https://age-encryption.org/v1).

Pin supported format profiles and library versions when implementation begins. Record password work parameters and enforce resource bounds when reading imported wrappers. Password normalization must not silently change what the user entered. Library defaults and practical unlock cost must be tested on the reference computer.

**First-run experience.** Create a journal name and destination, enter and confirm a password, then generate a recovery kit. Explain that the recovery kit opens the archive and must be stored separately. Let the user save or copy it intentionally and verify possession through a brief confirmation. Choosing to proceed without saving it is an explicit acknowledgement, not a hidden default.

The recovery kit contains a standard age X25519 recovery identity, archive ID, the archive signing public key and its fingerprint, format/profile version, and plain-language instructions. Recovery verifies the recovered bundle against that independently saved signing identity; it must not trust a replacement wrapper merely because it decrypts. The kit contains no photographs or writing. Do not automatically save it alongside the archive or include its recovery secret in backups.

**Unlocking and locking.** Opening an encrypted journal shows a neutral lock screen without names, photographs, or its private title. Passwords and keys are handled in Rust and are never retained in frontend state longer than the input exchange requires. Do not persist keys in browser storage or application logs.

Provide Lock now; lock on operating-system session lock or suspend; default to locking after 15 minutes of inactivity, configurable. Active typing and intentional playback count as use. Before locking, persist pending drafts when possible, stop media, blank the interface, revoke media access, dispose of decrypted indexes and buffers, and recreate the content view when necessary.

Failure to save during locking must not produce a false Saved message. The design must preserve pending work as an encrypted recovery buffer when possible, show that a save failed without exposing content, and require unlocking to recover it. This path needs fault-injection testing before the first release.

Do not promise perfect memory erasure in a managed rendering process. Keep secrets out of that process where possible and explicitly test what reaches disk.

**Search, previews, and media.** Use an in-memory SQLite index while unlocked, with encrypted persisted snapshots bound to the source commit. Authenticate cache manifests with the archive signing key, including archive identity, source commit, and ciphertext digests. Disable plaintext temporary database files and spill paths. Caches fail closed or rebuild when verification fails. Preview generation reads decrypted streams in memory and writes only encrypted derivatives.

Media access is through an archive-scoped Rust handler with revocable session access. It must support bounded reads and cancellation. Do not decrypt full videos into a temporary folder to make playback convenient. Range reads must authenticate the returned chunks; full-object verification is a distinct operation performed on import, restoration, or an integrity scan.

Configure and test the renderer so plaintext content is not left in browser caches, recovery files, logs, or developer diagnostics. If a proposed media path cannot meet this condition, change that path before claiming encrypted-media support.

**Password changes and recovery.** Changing a password rewraps the same archive secret bundle, verifies the new wrapper, and publishes the new envelope generation safely. It does not re-encrypt all photographs. Remove superseded wrappers from the active archive after successful publication, without claiming secure erasure of old disk blocks.

Older backups retain their old password wrapper. A password change cannot revoke a previously copied backup or key bundle. Replacing a compromised archive key requires a separately designed full rekey operation; that operation is deferred beyond version one.

Recovery uses the kit to unlock the secret bundle and set a new password. There is no online password reset or service-held bypass. If both password and recovery secret are lost, the application cannot recover the journal.

Whole-archive rollback to an older authentic snapshot cannot be reliably detected on a fresh offline computer without an independently stored latest-state record. Signatures provide authenticity and integrity, not a promise of detecting every rollback.

**Backups.** Complete backups preserve ciphertext and the matching password/recovery wrappers, not the recovery secret. They remain usable independently of the current installation. Offer Backup now and an opt-in daily backup while the app is open and the destination is available. An unavailable destination reports a missed backup; closing the app does not imply a background scheduler exists.

A backup in the same physical location should be identified as a same-device copy. The user selects another destination for a separate copy. Backups are standalone snapshots; initial retention is manual, with no automatic deletion. Reading back checksums establishes copy integrity; the application must report full restoration verification separately.

**Plaintext export is deliberate.** An independent readable HTML edition is unencrypted so an ordinary browser can open it. The export preview says this clearly and identifies the destination and selected content. A decrypted full archive is also an explicit choice. Ordinary complete backups remain encrypted by default.

A future encrypted viewer can be considered separately. We will not claim that a standalone plaintext HTML folder remains protected by the app password.

**Recovery outside Fragments.** Ship public format and recovery instructions with every complete archive. They explain how an independent age tool decrypts a password or recovery wrapper, how to use the recovered archive identity on objects, and how signed commits/catalogs map those objects to records and original filenames. A decrypted full export removes the need to reconstruct the journal from the commit history.

An independent recovery demonstration using a copy of the archive is a release requirement. No cloud account, device-specific secret, paid conversion service, or running Fragments installation may be required.

**Required verification.** Before trusting the release with irreplaceable content, test incorrect passwords, altered and truncated ciphertext, forged/replaced manifests, interrupted password changes, recovery-only restoration, leaked-temp-file scans, lock during playback, lock during failed saving, deleted caches, and full offline recovery on a fresh installation. These are implementation gates, not claims that verification has already happened.

