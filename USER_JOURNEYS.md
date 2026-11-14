Fragments — complete interaction journeys
Planning baseline · 14 November 2026

**These are acceptance stories for the chosen UI.** All names and events below are fictional design fixtures. Each journey identifies the visible outcome, navigation behavior, and a failure case. They supplement UI_DESIGN.md and become implementation checks.

**J1 — Create a private journal.** Launch to Create a journal or Open an archive. Choose a title and local folder, set and confirm the password, then save the recovery kit separately and acknowledge its role. Finish on an empty warm page with Add your first memory.

Success means the folder contains an encrypted valid archive, the lock screen reveals no private title, and the recovery secret is not automatically stored with it. If creation fails, explain whether an incomplete folder exists and offer safe retry; never claim the journal is ready.

**J2 — Capture an ordinary afternoon.** Drop a photograph into the application. If reading, create a new draft; if editing, ask whether to add to this draft or begin another. Write one sentence, accept or correct the suggested event date, and add Sara through Who was there?. Save as ready.

The memory appears once in the correct time period and in Sara's Shared memories. Renaming the source photograph outside the archive does not break it. If the original copy fails, the writing remains a draft with a clearly incomplete media item; it cannot pretend that the original is safely stored.

**J3 — Write in Persian and use both calendars.** Add a Persian paragraph and an English paragraph to the same memory. Automatic direction can be overridden per block. Enter the date in the Persian calendar, inspect the Gregorian equivalent, and choose the preferred primary display.

Switching display calendar does not change the event. Editing, reopening, search, and export preserve Persian characters, half-spaces, names, and punctuation. A partial date such as a Persian year stays partial; the other calendar does not pretend to know an exact day.

**J4 — Travel through time and return.** Resume the journal where it was last read. Open Life, select a year, enter a chapter, and open a memory. Open a photograph, close it, visit a participant's profile, then follow another shared memory.

Back restores the actual preceding view, query, filters, focus, and reading position. Motion describes the transition but is interruptible. With reduced motion enabled, the same journey works with immediate changes or short fades.

**J5 — Remember someone who was absent.** In an outing with Ali, write “I thought about Sara” and link Sara's name. Ali is a participant. Sara is only a mention.

Ali's Shared memories includes the outing. Sara's Mentions includes it; her Shared memories does not. Identify Sara in a separately attached older photograph, and her Media view can include that photograph without changing who attended the outing.

**J6 — Distinguish and organize people.** Create two people named Sara with different optional portraits or notes. Their picker entries remain distinguishable. Add a nickname to one and search by it. Rename the other without losing history.

If two records are discovered to describe the same person, preview Merge people, choose the display profile, and keep redirect information for old references. Undo restores the separate records and their original connection ownership; historical prose labels are unchanged. No automatic same-name merging occurs.

**J7 — Record a trip with changing participants.** Create a three-day trip with individual moments. Ali attends the first day, Sara the second, and a final walk is alone. The trip has a date range; the moments have their own dates and participants.

The parent page offers a summary and links to moments. Person filters find the moments actually attended. Deleting the trip grouping explains that the child memories remain and become ungrouped. Cycles and multiple structural parents are rejected.

**J8 — Add perspective years later.** Open an old entry and choose Add a reflection. Write today's thoughts. Save a separately dated reflection that appears after the original story and in the related person's history when explicitly linked.

Editing the original text is a separate action. Reflection timestamps do not move the old event to today's place on the timeline. Recovery and export preserve both layers.

**J9 — Work with uncertain history.** Add an approximate childhood year, a month without a day, a date range, and an undated entry. Browse and search them.

Labels retain uncertainty. Overlapping date searches explain approximate matches. Undated material remains discoverable. The journal does not fill missing years with fabricated dates or imply that sparse periods contain nothing worth remembering.

**J10 — Search intentionally.** Search a sentence, add two people, choose All selected people and Present, then restrict to a chapter. Switch to Mentioned and observe the intentional change in results.

Open a result and return to exactly those criteria. Persian normalized matching preserves the original displayed text. An empty result offers useful filter changes; an index being rebuilt says so instead of reporting a false absence of memories.

**J11 — Interrupt editing and recover.** Begin a draft, edit its text, and leave the page. Reopen the draft after a normal app restart. Then exercise save failure due to read-only storage or no available space.

Saved on this device appears only after commit acknowledgement. A save failure preserves pending work where possible and offers retry/recovery. Force-termination tests distinguish the last acknowledged revision from edits that had not been saved. The UI never claims that all unsent keystrokes are guaranteed recoverable.

**J12 — Lock while the journal is open.** Start media playback and choose Lock now. The content disappears, playback stops, session media access is revoked, and the lock screen exposes no names. Unlock to restore the reading position.

Test inactivity, operating-system session lock, and suspend as well. A failed pending save follows the encrypted-recovery-buffer behavior in PRIVACY_AND_RECOVERY.md. No stale media URL should continue to return content after locking.

**J13 — Preserve an unsupported original.** Import a photograph or video whose format has no available preview. Display “Original saved; preview unavailable” with metadata, captions, and a clearly labeled export-original action.

The original survives complete export and byte-level restoration checks. The app never discards it or counts a missing thumbnail as a failed original import. Opening it in another application requires an intentional plaintext export choice for an encrypted journal.

**J14 — Move to another computer.** Create a Complete archive snapshot to another destination, wait for verified completion, then restore into a separate folder on a fresh installation. Unlock with the password, verify people links and chapters, play supported media, and rebuild the index if omitted.

Repeat using only the recovery kit, then set a new password. Original hashes, writing, dates, relationships, and portable presentation match. Device paths and window positions are configured for the new computer. Opening the same archive twice never imports duplicates.

**J15 — Read without Fragments.** Choose Readable edition, review included memories, people notes, reflections, and media, acknowledge that the result is unencrypted, and select a destination. Open the resulting index page in an ordinary offline browser.

Dates and Persian writing remain legible. People and chapter links work. Unsupported browser codecs still have usable original-file links. The independent age recovery procedure can also recover a complete archive without the installed app.

**J16 — Restore after damage.** Use a fixture with a missing original, altered encrypted object, truncated commit, or stale cache. Open the archive.

A stale cache rebuilds. A damaged original remains visibly missing or damaged without erasing its story. A corrupt head enters recovery and offers a verified prior state. The app reports what is intact and what needs attention; it must not silently substitute an older archive and claim that nothing changed.

**J17 — Keep control of deletion.** Move a memory to Recently deleted, undo it, then restore after restarting. Remove a chapter and confirm its memories remain. Remove a person and verify old references remain understandable through a recoverable tombstone.

Permanent cleanup is a separate explicit action. Shared media referenced elsewhere remains intact. Existing backups are independent copies and are not silently modified when an item is deleted from the active archive.

**Sample collection for visual work.** Prepare a fictional collection of 18 memories across four periods, six people including two identical names, three overlapping chapters, a trip with three moments, two later reflections, Persian/English writing, mixed media orientations, one undated entry, one draft, one unsupported file, and one missing-media state.

Polished visual previews and interactive prototypes are implementation artifacts still to be produced. These journeys define what they must show; this document does not claim usability testing or visual validation has already occurred.

