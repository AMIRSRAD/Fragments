Fragments — UI design and interaction specification
Planning baseline · 14 November 2026

**Current notebook direction.** The notebook is the reading and writing surface. Year spreads reveal full entries as you scroll, with year bookmarks for direct navigation. Titles, stories, dates, chapters, and captions are editable on the page. New writing and photographs go beside the entry they belong to. Names link to people through inline mentions and open a note beside the text. Chapters, People, and Find open as notebook index pages. This direction supersedes the sidebar and separate reader/editor layouts described in the earlier baseline below.

**Purpose and status.** This document defines the selected interface baseline alongside DECISIONS.md and USER_JOURNEYS.md. The agreed direction is a warm physical journal whose movement feels like travelling through memories. Windows is the first platform. People, dates, and relationships must remain carefully organized, and the archive must remain usable outside the app.

Screen responsibilities, navigation, guided layouts, dual calendars, and encryption are selected. Exact typography, spacing, artwork, and motion will be refined through implementation studies. No mockups or working screens have yet been produced.

**1. The overall feeling: a journal with depth.** Opening Fragments should feel personal, quiet, and familiar. The content supplies the emotion: a face, a date, handwriting in a photographed note, a sentence written years ago. The interface gives these things space.

The physical-journal theme comes from warm surfaces, fine rules, generous margins, page-like composition, and careful typography. The dreamlike quality comes from moving smoothly between scales of time and following connections without losing your place.

The initial direction uses a spacious editorial journal with occasional scrapbook touches. Small overlaps or a photograph mounted on a paper-like surface can add character. Heavy decoration, artificial wear, or ornamental objects should not overwhelm reading and organization.

Original photographs retain their own colors. Warmth belongs to the surrounding interface; the app does not apply a nostalgic filter to every memory.

**2. The visual language.** The proposed palette uses warm ivory for the surrounding surface, slightly lighter paper for reading, dark brown-black ink for primary text, muted brown-gray for secondary labels, and a restrained terracotta accent for the main action or current position. Sage can mark a secondary selection or chapter accent. Exact shades will be selected and checked in visual studies.

Color always has a companion cue such as a label, underline, icon, or border. Secondary information must remain readable. Texture stays extremely subtle and should be removable through a plain-surface preference.

Use a characterful serif for chapter titles and prominent memory headings, paired with a clear reading and interface typeface. Long entries need comfortable line lengths and generous line spacing. Handwritten accents are optional decoration; handwriting is not the default for paragraphs, dates, or controls.

Photographs may use restrained borders and soft shadows where those help composition. Buttons and form fields should remain clearly recognizable. Avoid making every element a floating card: journal pages can use spacing and fine dividers to establish structure.

**3. The desktop shell.** A narrow, collapsible navigation column sits beside the main reading area. Primary destinations are Life, Journal, People, Chapters, and Search. Archive & settings and Lock sit near the bottom. A visible Add memory action remains available in the unlocked shell.

The main area has a compact context bar: a Back action when relevant, the current location or collection, and a small number of contextual controls. Reading content receives most of the window.

Drafts and Recently deleted are secondary destinations accessible from Journal and Archive respectively. A chapter opens a filtered journal; it does not create a second copy of the memories.

The opening experience is a state of the journal, not another permanent Home destination. After unlocking, returning users resume their previous reading position, with a route to the current period and the Life overview.

Collapsing navigation increases reading space while keeping destination names accessible. At smaller window sizes, the navigation becomes a drawer and secondary metadata becomes an expandable panel. The Windows layout should tolerate resizing and larger text without losing essential actions.

**4. First opening and an empty archive.** First use presents a welcoming, mostly empty page with Create a journal and Open or import an archive. Creating a journal asks for a name and storage location, then password confirmation and recovery-kit setup. Explain where the encrypted archive lives and why the recovery secret belongs elsewhere. Existing archives open to a neutral password screen without revealing personal content.

After setup, the page offers Add your first memory and a hint that photographs can be dropped into the window. There is no required biography, list of people, or daily-writing commitment.

An existing archive with no memories shows this same gentle invitation. An empty search or filter uses different language so the user can distinguish an empty collection from a filter that found nothing.

**5. Life: travelling through years.** The Life view presents a vertically flowing overview of years and chapters. Earlier time sits above later time. The initial position can be near the present or the last visited period, but the chronological direction stays consistent.

At the widest scale, each year has a clear marker and a small selection of memory previews or chapter labels. Opening a year reveals its periods. Opening a period enters the journal at that point.

A quiet time rail on a wide window shows the current year or month and provides direct jumps. It supplements normal scrolling; it is not the only way to move. A date control also allows a deliberate jump without scrolling through decades.

The rail follows actual dates. Reading space is flexible: a year with many memories can occupy more room without implying that it lasted longer. Sparse periods remain visible as quiet intervals without judgemental missing-day prompts.

Approximate dates display their uncertainty, such as Around 2008. Unknown dates live in an Undated collection rather than being assigned an invented position. Date ranges can span periods without duplicating the underlying memory.

The app should never force a long cinematic flight to reach a specific date. The user can navigate directly, and transitions can be interrupted.

**6. Journal: reading a period or chapter.** The Journal view is a continuous, page-like reading surface. A small heading identifies the selected period or chapter, with optional introductory writing and a cover image chosen by the user.

Memories follow in chronological order. Their previews vary with their content: a large photograph and a few lines, a text-only passage, a small image sequence, or a video still. Dates and linked names are visible but visually quieter than the memory itself.

The default order uses when a memory happened, not when it was entered into the app. Adding an old memory places it in its historical context. A Recent additions view can be available separately.

Select a preview to open the memory. The journal keeps its scroll position and selected filters. Longer entries use a clearly marked preview rather than silently omitting text.

A trip can appear as a parent story containing dated moments. Each moment retains its own participants and date. The design should make entering and leaving this grouping understandable.

**7. Memory: the intimate page.** A memory opens into a focused reading surface with its date, optional title, content, and contextual details. A photograph can be prominent, but entries without media receive an equally considered typographic layout.

The main content supports writing, photographs, image groups, video, audio, and captions. Metadata includes participants, chapter links, and a place if provided. At wide sizes, supporting details can sit in the margin; in smaller windows they move below the introduction or into an expandable details area.

The event date remains distinct from recording and reflection dates. An optional details view can show when the entry was created or edited without crowding the reading experience.

Primary actions are Edit and Add a reflection. Less frequent actions, including moving to Recently deleted, live in a labeled overflow menu.

Selecting a person's linked name opens their profile. A subtle hover or keyboard-focus preview may provide identity context, but essential details and navigation work without hover. Single-click interaction is sufficient; no feature depends on discovering a double-click gesture.

Back returns to the actual origin, such as a person profile or a filtered search, preserving that context. It does not always send the user to the timeline.

**8. Adding and editing a memory.** The editor resembles the reading page so the user understands the final result while working. A persistent status states Saving, Saved on this device, or Could not save. Local saving and backup completion use separate language.

The initial actions are Start writing and Add photos or media. Dropping files into the app opens a draft or an explicit import choice; it must not silently change the memory currently being read.

A compact details area contains the event date, Who was there?, place, and chapters. Titles are optional. Date entry includes exact, approximate, range, and unknown choices. Suggested photo dates are identified as suggestions and can be corrected.

Content is arranged through guided blocks. The proposed initial arrangements are text, a single image, a small image group, a video or audio item, and a caption. Users can reorder blocks through drag handles or move-up/move-down actions. Choose image fit or crop deliberately, and preserve the original.

Typing @ or selecting a name links a mention to a person. Who was there? separately records attendance. Existing people appear with enough context to distinguish identical names, and Add a person is available without leaving the draft.

Adding a new reflection opens a dated section attached to the original memory. Editing the old entry and reflecting on it later are distinct actions.

Leaving the editor preserves a draft. If saving fails, the app keeps the current work visible and offers retry and an available recovery action. It must not show a success state. Closing with unsaved changes requires an explicit choice.

**9. People: a collection of personal portraits.** The People view is a calm collection of portraits and names, with search and an alphabetical option. A person without a photograph gets a typographic placeholder; the interface does not invent an appearance.

Each person appears once even if they have several nicknames. Optional user-chosen ordering can be considered later. The app does not rank people by emotional importance or infer that the most photographed person matters most.

A profile begins with the chosen portrait, name, optional nicknames, and the user's own introduction. Beneath it, shared history unfolds chronologically.

Use clear views or filters for Shared memories, Mentions, Media, and About. Shared memories means recorded participation. Mentions includes writing about the person. Media uses explicit identification within the photograph or video. About contains personal notes and optional periods together.

Do not describe the earliest recorded memory as the first meeting unless the user explicitly records that fact. Likewise, the latest memory does not automatically mark the end of a relationship.

Someone no longer present in the user's life keeps their history. Optional resurfacing preferences can keep that history out of automatic suggestions without hiding it from deliberate browsing.

Editing a name keeps connections intact. Duplicate-person merging should preview affected records and offer recovery if implemented. Removing a person record must explain its effect on links and never silently delete shared memories.

**10. Chapters: personal periods of life.** The Chapters view presents titles, date spans where known, optional covers, and short introductions. Chapters can overlap and do not have to fit calendar years.

Opening one enters the corresponding journal. A memory can belong to several chapters and remains one record. Chapter editing controls membership and presentation.

A person connected to a chapter is not automatically a participant in every memory inside it. The interface must preserve that distinction when suggesting people or filtering content.

Removing a chapter should offer to remove its grouping while keeping the underlying memories, with a clear explanation of the result.

**11. Media viewing.** Selecting a photograph opens a focused viewer with a quiet surrounding surface, useful zoom controls, its caption, and a way to identify people pictured. The viewer shows the whole original by default even if its journal preview used a crop.

Previous and next actions stay within the current memory unless a wider collection was explicitly opened. Video and audio have visible playback controls, duration, and deliberate playback. Available captions or transcripts can be displayed.

Escape or Close returns to the same page and focus position. If a file is missing or unsupported, the viewer identifies the issue and preserves the surrounding writing and metadata. It offers Locate file or another appropriate recovery action without pretending the media has loaded.

**12. Search and deliberate discovery.** Search is reachable from the shell and a visible keyboard shortcut. Results show enough context to identify a memory: title or excerpt, date, relevant people, and a preview if available.

Filters cover people, dates, chapters, media type, and supplied places. Multiple people filters distinguish All selected people from Any selected person. A presence filter can search participation separately from mentions.

Opening a result and returning preserves the query, filters, and position. A no-results state suggests clearing a filter or including undated memories. Search indexing or loading should have a distinct progress state.

Optional memory suggestions belong in a later design. If introduced, they need clear controls and must respect exclusions for people, dates, and chapters.

**13. Archive and settings: visible ownership.** This area uses straightforward forms and clear status messages. Proposed groups are Archive, Backup & restore, Export & import, Appearance, and Dates & language.

The archive panel shows the journal name, location, storage information where available, and an action to reveal its folder. Backup information distinguishes last successful backup, work since that backup when known, destination, and any failure needing attention.

Export presents two clear choices: Complete archive and Readable edition. Complete archive stays encrypted by default; a decrypted complete copy is an explicit advanced choice. Readable edition explains that ordinary HTML and media will be unencrypted and previews the selected content. Explain what each includes in everyday language. Progress, cancellation where safe, completion, and the destination are visible. Failed or incomplete exports must not look like finished archives.

Import first shows what was found and any missing material or compatibility issue. Opening an archive and merging into the current archive are separate choices. A merge control appears only when its conflict-handling behavior is supported.

Restoration should default to creating or opening a separate restored archive rather than silently overwriting the current journal. A preview identifies the source and destination before a destructive replacement.

Portable appearance and display preferences are distinguished from device-specific locations and window choices. Settings that cannot be applied on another platform should be explained and handled safely.

Encryption is required in the first release. Include password change, recovery-kit management, Lock now, and idle-lock preferences as specified in PRIVACY_AND_RECOVERY.md. Do not display a successful locked state until content access is revoked. A save failure during locking follows the explicit recovery path rather than claiming work was saved.

**14. Movement and orientation.** Motion should communicate the relationship between views. A memory preview can expand into its page; a selected year can resolve into its periods; returning can restore the originating item to its place.

The proposed initial timing is brief: roughly 150–250 milliseconds for small controls and 250–400 milliseconds for larger navigation transitions, subject to prototype testing. Animation must not delay useful interaction or block rapid navigation.

Avoid continuous background movement, automatic drifting, forced parallax, and autoplay sound. Respect reduced-motion preferences with immediate transitions or brief fades. A visual selection and preserved focus should communicate location even without animation.

Scrolling remains ordinary and controllable. The app should not take over the mouse wheel to run an animation sequence. Keyboard navigation follows a meaningful reading order, and dialogs restore focus to their trigger.

**15. Essential states and recovery.** Every key screen needs its normal, empty, loading, and failure states. Use stable placeholders while thumbnails load so the page does not jump around.

Special cases include unfinished drafts, missing original media, interrupted imports, unavailable backup destinations, read-only archive locations, unsupported archive versions, and save failures. Messages should describe what happened, whether work is preserved, and the next useful action.

Ordinary deletion moves an item to Recently deleted and offers Undo. Permanent deletion is clearly separate. People and chapter changes must explain effects on relationships without implying that unrelated media will disappear.

Success messages should be modest and specific: Memory saved, Export ready, or Backup completed. They should never confuse local persistence with a verified second copy.

**16. Accessibility, language, and resizing.** All essential actions must be available through keyboard and visible controls. Focus should remain visible. Larger text must reflow, controls must have readable names, and interactions must not depend solely on color, dragging, hover, or animation.

The layout should accommodate long names, lengthy entries, portrait and landscape photographs, and narrow windows. Reading width stays comfortable on large displays rather than stretching paragraphs across the whole screen.

The interface remains English and left-to-right. Persian and English writing are both required: each text block supports automatic direction and a manual override, with mixed-direction handling for names, numbers, and links. Both calendars support input and display, with a selectable primary calendar and optional secondary date. Switching display never changes the event or invents precision.

The independent readable export should retain a sensible reading order, dates, captions, and working links between people and memories. Its usefulness must not depend on reproducing the desktop animations.

**17. The first visual walkthrough.** Use fictional sample content to show this complete path: open the journal, move to a year, enter a chapter, open a memory, view a photograph, visit a participant's profile, open another shared memory, and return.

A second walkthrough covers adding a memory, linking a person, saving a draft, finishing it, and adding a later reflection. A third covers complete export and restoration.

The first visual studies should include the opening page, Life overview, chapter journal, memory reader, memory editor, People collection, and person profile. Include at least one empty state and one save or media failure state so the design demonstrates more than ideal content.

**18. Selected design baseline.** Resume the last reading position after unlocking; use a spacious editorial journal with restrained scrapbook touches and guided reorderable blocks. English UI, Persian/English writing, both calendars, and encryption are included. The initial media matrix is in TECHNICAL_ARCHITECTURE.md. Exact typefaces, artwork, spacing, and timings will be refined through visual studies.

The design succeeds when a simple memory is easy to add, a person's history is accurately organized, moving through time feels expressive and understandable, and the archive's ownership and recovery remain clear.

**19. Initial composition and visual values.** Start desktop studies at a 1440 × 900 window. Use a roughly 208-pixel navigation column, a compact 56-pixel context bar, and a centered reading region with comfortable outer margins. A text column should usually stay around 60–72 characters wide; media can extend beyond it. These are starting layout values, not fixed dimensions that override text scaling.

At widths around 1000 pixels, collapse the secondary metadata margin. Around 760 pixels, move navigation into a labeled drawer and use one content column. Test usable reading and controls at 640-pixel window width and with enlarged text. Preserve normal scrolling and avoid horizontal scrolling for prose.

Start color studies with warm ivory #F4EEE4, paper #FFFAF1, dark ink #302820, secondary ink #6B6055, terracotta #8B4A34, sage #526B56, and a quiet rule #DED3C5. Check actual foreground/background pairs before shipping; pale rules are decorative, not the sole indication of field boundaries or focus. Body writing starts near 18 pixels with generous leading, controls near 16 pixels, and large chapter headings near 36 pixels, all scalable.

The opening journal shows context, a substantial memory preview, and room to breathe. A memory reader centers its story with metadata in the margin when space allows. The People collection uses consistent portrait/name groupings; a profile leads with the chosen portrait and introduction, then shared history. The editor retains the reading layout and reveals tools near selected content. This is the selected composition direction for the first implementation studies.

