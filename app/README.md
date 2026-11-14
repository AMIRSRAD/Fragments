# Fragments desktop preview

The preview opens a fictional notebook with 18 memories, four chapters, and six people. Scroll through its year spreads or use the year bookmarks. Type directly in an entry, click its date to change it, and use **Write here** to add a new memory below it. Add or drop a photo onto an entry, then write the caption beneath it. Type `@Ali` in a story to link a person and click a linked name to open its margin note. Changes last for the current session.

Install dependencies with `npm ci`. Run `npm run tauri -- dev` for Windows or `npm run dev` for the browser. Stop the browser server before starting Tauri because both use port 1420.

Run `npm run build:desktop` to build a standalone Windows executable with the notebook interface embedded. Open `src-tauri/target/debug/app.exe` after the build completes.

The Windows build offers a private notebook on its cover. Set a password of at least 12 characters. Edits save automatically, with the save status at the end of the notebook. That page also has **Lock** and **Export encrypted backup**. To restore a backup, open Fragments on a fresh installation or Windows account, choose the backup on the cover, and enter its original password.

Use **Add media** on a page to select multiple photos or videos. The star makes an attachment the cover. New attachments are encrypted separately in the notebook's media folder, so their bytes do not count toward the 30 MiB record snapshot limit. Old single-photo entries still open from their original snapshots. The picker accepts JPEG, PNG, WebP, GIF, MP4, M4V, WebM, and MOV files. Playback depends on the codecs available in Windows and WebView2.

New backups use a `.fragments` tar container with `notebook.json` and the referenced encrypted `media/*.age` files. Restore accepts these bundles as well as the older JSON-only backups. Keep the password separately. Archive selection, recovery keys, and readable export are pending.

Run `npm run build` to check the frontend and `cargo test --manifest-path src-tauri/Cargo.toml --lib` for the separate Rust encryption experiments. The preview editor keeps changes in memory.
