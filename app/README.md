# Fragments desktop preview

The preview opens a fictional notebook with 18 memories, four chapters, and six people. Scroll through its year spreads or use the year bookmarks. Type directly in an entry, click its date to change it, and use **Write here** to add a new memory below it. Add or drop a photo onto an entry, then write the caption beneath it. Type `@Ali` in a story to link a person and click a linked name to open its margin note. Changes last for the current session.

Install dependencies with `npm ci`. Run `npm run tauri -- dev` for Windows or `npm run dev` for the browser. Stop the browser server before starting Tauri because both use port 1420.

Run `npm run build:installer` on Windows to build the per-user installer under `src-tauri/target/release/bundle/nsis`. The installer adds Fragments to the Start menu. For a standalone debug build, run `npm run build:desktop` and open `src-tauri/target/debug/Fragments.exe`. Both launch as Windows apps without a console.

**About** in the title bar checks GitHub Releases at startup and every six hours while Fragments is open. You can turn off automatic checks or check manually. When a newer release is available, open its GitHub page to download the installer.

Download the Windows x64 installer from [GitHub Releases](https://github.com/AMIRSRAD/Fragments/releases/latest). It is unsigned.

The Windows build offers a private notebook on its cover. Set a password of at least 12 characters. Edits save automatically, with save status in the title bar. **Sign out** in the title bar locks the notebook and returns to the cover. Use **Export encrypted backup** in the footer. To restore, open Fragments under a Windows account without an existing notebook, choose the backup on the cover, and enter its original password.

Use the date picker for exact, month-and-year, approximate, or range dates. Add a reflection to revisit a memory without changing its original story. The **People** tab supports undated profile notes and a timeline of shared memories grouped into custom phases. Edits in People and Notebook affect the same entry. **Find** can filter by person, chapter, year, and photos.

Use **Add media** on a page to select multiple photos or videos. The star makes an attachment the cover. New attachments are encrypted separately in the notebook's media folder, so their bytes do not count toward the 30 MiB record snapshot limit. Old single-photo entries still open from their original snapshots. The picker accepts JPEG, PNG, WebP, GIF, MP4, M4V, WebM, and MOV files. Playback depends on the codecs available in Windows and WebView2.

New backups use a `.fragments` tar container with `notebook.json` and the referenced encrypted `media/*.age` files. Restore accepts these bundles as well as the older JSON-only backups. Keep the password separately. **Export HTML album** creates an unencrypted, standalone file for selected memories. Archive selection and recovery keys are pending.

For large notebooks, use an encrypted backup for the full archive. Import, backup, and restore stream attachment bytes. A backup needs free space for the entire new bundle on the destination drive. Fragments shows the bytes written and gives the file its final name after it has been flushed to disk. An interrupted export can leave a `.partial` file. Restore needs room for the extracted media in addition to the backup file if both are on the same drive. HTML album export limits embedded media to 64 MiB after encoding.

Run `npm run build` to check the frontend and `cargo test --manifest-path src-tauri/Cargo.toml --lib` for the separate Rust encryption experiments. The preview editor keeps changes in memory.
