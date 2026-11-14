import { invoke, isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, CalendarDays, ChevronLeft, ChevronRight, Feather, Plus, Search, Users, X } from "lucide-react"
import { chapters, mentions, sampleMemories, searchKey, storyPeople, storyText, type PersonId, type People } from "./memories"
import { NotebookEntry, attachments, type Entry, type Media, type Photograph } from "./NotebookEntry"
import { TimeJourney } from "./TimeJourney"
import { TitleBar } from "./TitleBar"
import "@fontsource/instrument-serif"
import "@fontsource/instrument-serif/400-italic.css"
import "@fontsource/dm-sans/400.css"
import "@fontsource/dm-sans/600.css"
import "./App.css"
import { dateLabel, dateEnd, yearBounds, type Timing } from "./dates"
import { participant } from "./MemoryNotes"
import { PersonProfile } from "./PersonProfile"
import { AlbumForm } from "./AlbumForm"
import { exportAlbum } from "./album"

const bookmarks = [
  { page: "Notebook", Icon: BookOpen },
  { page: "Chapters", Icon: Bookmark },
  { page: "People", Icon: Users },
  { page: "Find", Icon: Search },
] as const

type Place = { page: "Notebook" | "Chapters" | "People" | "Find" | "Deleted" | "Album"; key?: string }
type ReturnPoint = { place: Place; top: number; focusId?: string }

type Contents = { entries: Entry[]; calendar: string; people?: People; deleted?: Entry[]; chapters?: string[] }
const dateObject = (value: string) => new Date(value + "T00:00:00Z")

function dismissOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
  const dialog = event.currentTarget
  if (event.target !== dialog) return
  const rect = dialog.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close()
}

export default function App() {
  return <>
    {isTauri() && <TitleBar/>}
    <Journal/>
  </>
}

function Journal() {
  const [contents, setContents] = useState<Contents | null>(null)
  const [sample, setSample] = useState(!isTauri())
  const [exists,setExists] = useState<boolean | null>(null)
  const [password,setPassword] = useState("")
  const [confirm,setConfirm] = useState("")
  const [backup,setBackup] = useState<string>()
  const [choosingBackup,setChoosingBackup] = useState(false)
  const [error,setError] = useState("")
  const [busy,setBusy] = useState(false)
  const [slow,setSlow] = useState(false)
  const passwordField = useRef<HTMLInputElement>(null)

  function checkArchive() {
    setError("")
    void invoke<boolean>("archive_exists").then(setExists).catch(error => setError(String(error)))
  }

  useEffect(() => { if (isTauri()) checkArchive() }, [])
  useEffect(() => {
    if (!busy && !choosingBackup && !sample && !contents) passwordField.current?.focus()
  }, [exists, backup, busy, choosingBackup, sample, contents])
  useEffect(() => {
    if (!busy) return
    const timer = window.setTimeout(() => setSlow(true), 3000)
    return () => window.clearTimeout(timer)
  }, [busy])

  async function open(event: React.FormEvent) {
    event.preventDefault()
    if (busy || choosingBackup || exists === null) return
    if (!exists && !backup && Array.from(password).length < 12) {
      setError("Choose a password with at least 12 characters.")
      return
    }
    if (!exists && !backup && password !== confirm) {setError("The passwords do not match.");return}
    setBusy(true)
    setSlow(false)
    setError("")
    try {
      const raw = await invoke<string>("open_archive",{password, backupPath:backup ?? null})
      setContents(JSON.parse(raw) as Contents)
      setExists(true)
      setBackup(undefined)
      setPassword("")
      setConfirm("")
    } catch (error) {setError(String(error))}
    finally {setBusy(false)}
  }

  async function chooseBackup() {
    setChoosingBackup(true)
    setError("")
    try {
      const path = await invoke<string | null>("choose_backup")
      if (path) setBackup(path)
    } catch (error) {
      setError(String(error))
    } finally {
      setChoosingBackup(false)
    }
  }

  if (sample || contents) return <Notebook initial={contents ?? {entries:sampleMemories,calendar:"gregory"}} persistent={!!contents}
    close={() => {setContents(null);setSample(false)}}/>

  return <div className="archive-landing"><main className="archive-cover book">
    <div className="cover-title"><Feather size={24} aria-hidden="true"/><h1>Fragments</h1></div>
    <p>{exists === null ? error ? "Could not check for a local notebook." : "Checking for your notebook…" : exists ? "Unlock your notebook." : backup ? "Restore an encrypted backup." : "Begin a private notebook."}</p>
    {exists === null && error && <button className="write-line" onClick={checkArchive}>Try again</button>}
    {exists !== null && <form onSubmit={open}>
      <label>Password<input ref={passwordField} type="password" value={password} autoComplete={exists || backup ? "current-password" : "new-password"} onChange={event=>setPassword(event.target.value)} disabled={busy || choosingBackup} required/></label>
      {exists === false && !backup && <label>Confirm password<input type="password" value={confirm} autoComplete="new-password" onChange={event=>setConfirm(event.target.value)} disabled={busy || choosingBackup} required/></label>}
      <button className="write-line" disabled={busy || choosingBackup}>{busy ? exists ? "Unlocking…" : backup ? "Restoring…" : "Creating…" : exists ? "Unlock" : backup ? "Restore notebook" : "Create notebook"}</button>
    </form>}
    {busy && <p role="status">{slow ? "Still processing the encrypted notebook. Larger archives can take longer." : exists ? "Checking your password…" : backup ? "Checking and restoring your backup…" : "Setting up encryption…"}</p>}
    <div className="cover-options">
    {exists === false && <button className="write-line" disabled={busy || choosingBackup} onClick={()=>void chooseBackup()}>Choose a backup</button>}
    {backup && <div className="backup-selection"><bdi>{backup.split(/[\\\\/]/).at(-1)}</bdi><button className="icon-button" aria-label="Clear backup selection" disabled={busy || choosingBackup} onClick={()=>{setBackup(undefined);setError("")}}><X size={16}/></button></div>}
    {error && <p role="alert">{error}</p>}
    <button className="write-line" disabled={busy || choosingBackup} onClick={()=>setSample(true)}>Open the sample notebook</button>
    </div>
  </main></div>
}

function Notebook({initial,persistent,close}: {initial:Contents; persistent:boolean; close:()=>void}) {
  const [people,setPeople] = useState<People>(initial.people ?? (persistent ? {} : storyPeople))
  const [deleted,setDeleted] = useState<Entry[]>(initial.deleted ?? [])
  const [customChapters,setCustomChapters] = useState<string[]>(initial.chapters ?? [])
  const [newPerson,setNewPerson] = useState("")
  const [personForm,setPersonForm] = useState(false)
  const [peopleQuery,setPeopleQuery] = useState("")
  const [chapterForm,setChapterForm] = useState(false)
  const [newChapter,setNewChapter] = useState("")
  const [entries, setEntries] = useState<Entry[]>(() => initial.entries.map(entry => ({
    ...entry,
    people: (entry.people ?? []).map(value => Object.hasOwn(people,value) ? value :
      Object.keys(people).find(id => people[id].name === value) ?? value),
  })))
  const [place, setPlace] = useState<Place>({page:"Notebook"})
  const [history, setHistory] = useState<ReturnPoint[]>([])
  const returnPoint = useRef<ReturnPoint | null>(null)
  const [calendar, setCalendar] = useState(initial.calendar)
  const [query, setQuery] = useState("")
  const [filters,setFilters] = useState({person:"",chapter:"",year:"",photos:false})
  const bookCover = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const cover = bookCover.current
    if (!cover) return
    const root = document.documentElement
    const measure = () => root.style.setProperty("--measured-header-height", `${cover.getBoundingClientRect().height}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(cover, {box:"border-box"})
    return () => {
      observer.disconnect()
      root.style.removeProperty("--measured-header-height")
    }
  }, [])
  const [pending, setPending] = useState<{id:string; focus?: "title" | "date" | "media"} | null>(null)
  const [person, setPerson] = useState<PersonId | null>(null)
  const [viewer, setViewer] = useState<{photos: Photograph[]; index: number; trigger: HTMLButtonElement} | null>(null)
  const photo = viewer?.photos[viewer.index]
  const [notePosition, setNotePosition] = useState({top: 0, left: 0})
  const sampleMedia = useRef(new Set<string>())
  useEffect(() => {
    const urls=sampleMedia.current
    return ()=>{for (const url of urls) URL.revokeObjectURL(url)}
  },[])
  const note = useRef<HTMLDialogElement>(null)
  const lightbox = useRef<HTMLDialogElement>(null)
  const [status,setStatus] = useState(persistent ? "Saved on this device" : "Sample notebook · session only")
  const [issue,setIssue] = useState("")
  const [saveIssue,setSaveIssue] = useState("")
  const [notice,setNotice] = useState("")
  const [undo, setUndo] = useState<{entry: Entry; index: number} | null>(null)
  useEffect(() => {
    if (!undo) return
    const timer = window.setTimeout(() => setUndo(null), 10000)
    return () => window.clearTimeout(timer)
  }, [undo])
  const [working,setWorking] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeInProgress = useRef(false)
  const busy = useRef(false)
  busy.current = working
  const [activity,setActivity] = useState("")
  const backupButton = useRef<HTMLButtonElement>(null)
  const restoreBackupFocus = useRef(false)
  useLayoutEffect(() => {
    if (working || !restoreBackupFocus.current) return
    restoreBackupFocus.current = false
    backupButton.current?.focus({preventScroll:true})
  }, [working])
  const queue = useRef<Promise<void>>(Promise.resolve())
  const snapshot = useMemo(() => ({entries,calendar,people,deleted,chapters:customChapters}), [entries,calendar,people,deleted,customChapters])
  const published = useRef(snapshot)
  const currentSnapshot = useRef(snapshot)
  currentSnapshot.current = snapshot

  function save(value: typeof snapshot) {
    const job = queue.current.catch(() => {}).then(async () => {
      if (published.current === value) return
      await invoke("save_archive",{contents:JSON.stringify(value)})
      published.current = value
    })
    queue.current = job
    return job
  }

  useEffect(() => {
    if (!persistent || working) return
    if (snapshot !== published.current) setStatus("Saving…")
    let cancelled = false
    const timer = window.setTimeout(() => {
      void save(snapshot).then(() => {
        if (!cancelled) {setStatus("Saved on this device");setSaveIssue("")}
      }).catch(error => {
        if (!cancelled) {setStatus("Changes pending");setSaveIssue(String(error))}
      })
    },350)
    return () => {cancelled = true;window.clearTimeout(timer)}
  },[snapshot,persistent,working])

  useEffect(() => {
    if (!persistent) return
    const appWindow = getCurrentWindow()
    const remove = appWindow.onCloseRequested(event => {
      if (busy.current) {
        event.preventDefault()
        setNotice("Finish or cancel the current operation before closing.")
        return
      }
      if (closeInProgress.current) {
        event.preventDefault()
        return
      }
      if (currentSnapshot.current === published.current) return
      event.preventDefault()
      closeInProgress.current = true
      setClosing(true)
      setStatus("Saving before closing…")
      void (async () => {
        // Wait for the latest committed edit before destroying the window.
        do {
          await save(currentSnapshot.current)
        } while (currentSnapshot.current !== published.current)
        setSaveIssue("")
        setStatus("Saved on this device")
        await appWindow.destroy()
      })().catch(error => {
        setStatus(currentSnapshot.current === published.current ? "Saved on this device" : "Changes pending")
        setSaveIssue(String(error))
      }).finally(() => {
        closeInProgress.current = false
        setClosing(false)
      })
    })
    return () => {void remove.then(unlisten=>unlisten()).catch(console.error)}
  },[persistent])

  async function archiveAction(action: "backup" | "lock") {
    if (working) return
    setWorking(true)
    setIssue("")
    setNotice("")
    setActivity(action === "backup" ? "Preparing encrypted backup…" : "Locking notebook…")
    try {
      await save(currentSnapshot.current)
      if (action === "lock") {
        await invoke("lock_archive")
        close()
      } else {
        setActivity("Choose where to save the encrypted backup.")
        const exported = await invoke<boolean>("backup_archive")
        if (exported) setNotice("Encrypted backup exported.")
      }
    } catch (error) {setIssue(String(error))}
    finally {
      restoreBackupFocus.current = action === "backup"
      setWorking(false)
    }
  }

  async function attach(id: string, files: File[]) {
    if (working) return
    setIssue("")
    try {
      let added: Media[]
      if (persistent) {
        if (files.length) {
          setIssue("Use Add media to select files for the encrypted notebook.")
          return
        }
        setWorking(true)
        setActivity("Adding media…")
        added = await invoke<Media[]>("import_media")
      } else {
        added = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"))
          .map(file => ({id:crypto.randomUUID(),mime:file.type,caption:file.name.replace(/\.[^.]+$/,""),url:URL.createObjectURL(file)}))
        for (const item of added) sampleMedia.current.add(item.url!)
        if (added.length !== files.length) setIssue("Choose photos or videos.")
      }
      if (added.length) setEntries(previous=>previous.map(entry=>entry.id===id ? {...entry,media:[...attachments(entry),...added]} : entry))
    } catch (error) {setIssue(String(error))}
    finally {
      setWorking(false)
      if (persistent) setPending({id,focus:"media"})
    }
  }

  useEffect(() => {
    function keepFilesInNotebook(event: DragEvent) {
      if (!event.dataTransfer?.types.includes("Files")) return
      event.preventDefault()
      if (event.type === "drop") setIssue("Drop photos or videos onto a memory.")
      else event.dataTransfer.dropEffect = "none"
    }
    window.addEventListener("dragover",keepFilesInNotebook)
    window.addEventListener("drop",keepFilesInNotebook)
    return () => {
      window.removeEventListener("dragover",keepFilesInNotebook)
      window.removeEventListener("drop",keepFilesInNotebook)
    }
  },[])

  const formatDate = useMemo(() => new Intl.DateTimeFormat("en", {dateStyle:"long", calendar, timeZone:"UTC"}), [calendar])
  const format = useMemo(() => (date: string, timing?: Timing) => dateLabel(date,timing,formatDate), [formatDate])
  const yearOf = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en", {year:"numeric", calendar, timeZone:"UTC"})
    const yearsByDate = new Map<string, string>()
    return (date: string) => {
      if (!date) return "Undated"
      const cached = yearsByDate.get(date)
      if (cached !== undefined) return cached
      const year = formatter.formatToParts(dateObject(date)).find(part => part.type === "year")?.value ?? date.slice(0,4)
      yearsByDate.set(date, year)
      return year
    }
  }, [calendar])
  const groups = new Map<string, Entry[]>()
  const chapterNames = useMemo(() => [...new Set([...(persistent ? ["My notebook"] : chapters),...customChapters,...entries.map(entry => entry.chapter)])], [persistent, customChapters, entries])
  for (const entry of entries) {
    const year = yearOf(entry.date)
    const group = groups.get(year)
    if (group) group.push(entry)
    else groups.set(year, [entry])
  }
  const years = [...groups.keys()].sort((a,b) => a === "Undated" ? 1 : b === "Undated" ? -1 : Number(b) - Number(a))
  const filterYears = useMemo(() => {
    if (place.page !== "Find") return []
    const values = new Set<string>()
    for (const entry of entries) {
      const first = yearOf(entry.date)
      values.add(first)
      if (!entry.timing || !entry.date) continue
      const last = Number(yearOf(dateEnd(entry.date,entry.timing)))
      for (let year = Number(first) + 1; year <= last; year++) values.add(String(year))
    }
    return [...values].sort((a,b) => a === "Undated" ? 1 : b === "Undated" ? -1 : Number(b) - Number(a))
  }, [entries,place.page,yearOf])
  const search = searchKey(query.trim())
  const searchable = useMemo(() => new WeakMap<Entry, string>(), [people, calendar])
  const hasFilters = Boolean(filters.person || filters.chapter || filters.year || filters.photos)
  function writtenAbout(entry: Entry, id: PersonId) {
    return mentions(entry.text,id) || (entry.reflections ?? []).some(note=>mentions(note.text,id))
  }
  function aboutPerson(entry: Entry,id: PersonId) {
    return entry.about?.some(link=>link.personId === id && !link.phaseOnly) ?? false
  }
  const yearWindow = filters.year && filters.year !== "Undated" ? yearBounds(Number(filters.year),calendar) : null
  const matches = place.page === "Find" && (search || hasFilters) ? entries.filter(entry => {
    if (filters.chapter && entry.chapter !== filters.chapter) return false
    if (filters.person && !participant(entry,filters.person,people) && !writtenAbout(entry,filters.person) && !aboutPerson(entry,filters.person)) return false
    if (filters.photos && !attachments(entry).some(item=>item.mime.startsWith("image/"))) return false
    if (filters.year === "Undated" && entry.date) return false
    if (yearWindow && (!entry.date || entry.date >= yearWindow[1] || dateEnd(entry.date,entry.timing) < yearWindow[0])) return false
    if (!search) return true
    let text = searchable.get(entry)
    if (text === undefined) {
      text = searchKey([
    entry.title, storyText(entry.text), entry.chapter, format(entry.date,entry.timing),
    ...(entry.reflections ?? []).map(note=>storyText(note.text)),
    ...attachments(entry).map(item => item.caption),
    ...Object.keys(people).filter(id => (writtenAbout(entry,id) || participant(entry,id,people) || aboutPerson(entry,id))).map(id => people[id].name),
  ].join(" "))
      searchable.set(entry,text)
    }
    return text.includes(search)
  }) : []

  useLayoutEffect(() => {
    const point = returnPoint.current
    returnPoint.current = null
    if (point) {
      const origin = point.focusId ? document.getElementById(point.focusId) : null
      const focus = origin ?? document.getElementById("notebook-main")
      focus?.focus({preventScroll:true})
      window.scrollTo(0, point.top)
      return
    }
    if (!pending) return
    const entry = document.getElementById(`entry-${pending.id}`)
    const focus = pending.focus === "title" ? entry?.querySelector("textarea") :
      pending.focus === "media" ? entry?.querySelector<HTMLButtonElement>(".add-media") :
      pending.focus === "date" ? entry?.querySelector<HTMLButtonElement>(".ink-label") : entry
    focus?.focus({preventScroll:true})
    if (pending.focus === "media") focus?.scrollIntoView({block:"nearest"})
    else entry?.scrollIntoView({block:"start"})
  }, [place, pending])

  function selectTab(page: Place["page"]) {
    setHistory([])
    setPlace({page})
    setPending(null)
    window.scrollTo(0,0)
  }

  function turn(next: Place, entry?: string, focusId?: string) {
    if (next.page === place.page && next.key === place.key) {
      if (entry) setPending({id:entry})
      return
    }
    const point = {place, top:window.scrollY, focusId:focusId ?? document.activeElement?.id}
    setHistory(previous => [...previous, point])
    setPlace(next)
    setPending(entry ? {id:entry} : null)
    if (!entry) window.scrollTo(0,0)
  }

  function back() {
    const previous = history.at(-1)
    if (!previous) return
    returnPoint.current = previous
    setHistory(history.slice(0,-1))
    setPlace(previous.place)
    setPending(null)
  }

  function write(beside?: Entry, phaseId?: string) {
    const local = new Date()
    const today = [local.getFullYear(), String(local.getMonth()+1).padStart(2,"0"), String(local.getDate()).padStart(2,"0")].join("-")
    const personId = place.page === "People" ? place.key : undefined
    const entry: Entry = {id:crypto.randomUUID(), title:"", text:"", date:beside?.date ?? today, timing:beside?.timing, chapter:beside?.chapter ?? (place.page === "Chapters" ? place.key : undefined) ?? (persistent ? "My notebook" : chapters[0]), people:[],
      about:personId ? [{personId,phaseId:phaseId ?? beside?.about?.find(link=>link.personId===personId)?.phaseId}] : undefined}
    setEntries(previous => {
      const index = beside ? previous.findIndex(item => item.id === beside.id) + 1 : 0
      return [...previous.slice(0,index), entry, ...previous.slice(index)]
    })
    if (place.page !== "Notebook" && !personId && !(place.page === "Chapters" && place.key)) {
      turn({page:"Notebook"}, entry.id)
    }
    setPending({id:entry.id,focus:"title"})
  }

  function change(id: string, patch: Partial<Entry>) {
    const previousEntry = entries.find(entry => entry.id === id)
    if (place.page === "People" && place.key && previousEntry && patch.about) {
      const personId = place.key
      const before = previousEntry.about?.find(link=>link.personId===personId)
      const after = patch.about.find(link=>link.personId===personId)
      if (before?.phaseId !== after?.phaseId || Boolean(before) !== Boolean(after)) {
        if (after || participant(previousEntry,personId,people) || writtenAbout(previousEntry,personId)) setPending({id})
        else focusAfterRemoval(id)
      }
    }
    if (place.page === "Notebook" && patch.date !== undefined && previousEntry && yearOf(previousEntry.date) !== yearOf(patch.date)) {
      setPending({id,focus:"date"})
    }
    setEntries(previous => previous.map(entry => entry.id === id ? {...entry,...patch} : entry))
    if (patch.chapter !== undefined && patch.chapter !== previousEntry?.chapter) {
      setNotice(`Memory moved to ${patch.chapter}.`)
      if (place.page === "Chapters" && place.key && patch.chapter !== place.key) focusAfterRemoval(id)
    }
  }

  function focusAfterRemoval(id: string) {
    const articles = Array.from(document.querySelectorAll<HTMLElement>(".notebook-entry"))
    const index = articles.findIndex(article => article.id === `entry-${id}`)
    const neighbor = articles[index + 1] ?? articles[index - 1]
    if (neighbor) setPending({id:neighbor.id.slice("entry-".length)})
    else document.getElementById("notebook-main")?.focus({preventScroll:true})
  }

  function identify(id: PersonId, anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect()
    setPerson(id)
    setNotePosition({left:Math.max(16,Math.min(rect.left,window.innerWidth-352)),top:Math.max(16,Math.min(rect.bottom+9,window.innerHeight-260))})
    note.current?.showModal()
  }

  function remove(entry: Entry) {
    setUndo({entry, index:entries.indexOf(entry)})
    setDeleted(previous => [...previous,entry])
    setEntries(previous => previous.filter(item => item.id !== entry.id))
    focusAfterRemoval(entry.id)
  }

  function restore(entry: Entry, index: number) {
    setEntries(previous => previous.some(item => item.id === entry.id) ? previous :
      [...previous.slice(0,index), entry, ...previous.slice(index)])
    setDeleted(previous => previous.filter(item => item.id !== entry.id))
    if (undo?.entry.id === entry.id) setUndo(null)
  }

  function viewPhoto(photos: Photograph[], id: string, trigger: HTMLButtonElement) {
    const index = photos.findIndex(photo => photo.id === id)
    if (index < 0) return
    setViewer({photos,index,trigger})
    lightbox.current?.showModal()
  }

  function stepPhoto(delta: number) {
    setViewer(current => current && ({...current, index: Math.max(0, Math.min(current.photos.length - 1, current.index + delta))}))
  }

  const latestActions = useRef({change, identify, write, viewPhoto, attach, remove})
  useLayoutEffect(() => {
    latestActions.current = {change, identify, write, viewPhoto, attach, remove}
  })
  const actions = useMemo(() => ({
    change: (id: string, patch: Partial<Entry>) => latestActions.current.change(id,patch),
    identify: (id: PersonId, anchor: HTMLElement) => latestActions.current.identify(id,anchor),
    write: (entry: Entry) => latestActions.current.write(entry),
    viewPhoto: (photos: Photograph[], id: string, trigger: HTMLButtonElement) => latestActions.current.viewPhoto(photos,id,trigger),
    attach: (id: string, files: File[]) => void latestActions.current.attach(id,files),
    remove: (entry: Entry) => latestActions.current.remove(entry),
  }), [])
  const chapterKey = JSON.stringify(chapterNames)
  const entryChapters = useMemo(() => JSON.parse(chapterKey) as string[], [chapterKey])

  function pageEntry(entry: Entry) {
    return <NotebookEntry key={entry.id} entry={entry} format={format} actions={actions}
      nativeMedia={persistent} calendar={calendar} people={people} chapters={entryChapters}/>
  }

  function finding(entry: Entry, context: string) {
    const id = `result-${context}-${entry.id}`
    return <button className="index-line" id={id} key={entry.id} onClick={() => turn({page:"Notebook"},entry.id,id)}>
      <span><bdi>{entry.title || "Untitled memory"}</bdi><small>{format(entry.date,entry.timing)}</small></span><ArrowRight size={17}/>
    </button>
  }

  return <>
    <header ref={bookCover} className="book-cover" inert={working || closing}>
      <div className="cover-name"><Feather size={19}/><button onClick={() => selectTab("Notebook")}>Fragments</button></div>
      <nav aria-label="Notebook bookmarks" className="bookmarks">
        {bookmarks.map(({page, Icon}) => <button key={page} aria-current={place.page === page ? "page" : undefined} onClick={() => selectTab(page)}><Icon size={16} aria-hidden="true"/>{page}</button>)}
      </nav>
      <div className="cover-actions">
        <label className="calendar-choice"><CalendarDays size={16} aria-hidden="true"/><span className="sr-only">Display calendar</span><select value={calendar} onChange={event => {setCalendar(event.target.value);setFilters(previous=>({...previous,year:""}))}}><option value="gregory">Gregorian</option><option value="persian">Persian</option></select></label>
        <button className="primary-action" id="write-memory" onClick={() => write()} aria-label="Write a memory"><Plus size={17} aria-hidden="true"/><span>Write<span className="wide-action-label"> a memory</span></span></button>
      </div>
      <div className="journal-status" role="status">{closing ? "Saving before closing…" : working ? activity : status}</div>
    </header>
    <main className="book notebook-body" id="notebook-main" tabIndex={-1} inert={working || closing}>
      {history.length > 0 && <button className="back-mark" onClick={back}><ArrowLeft size={15}/> Back</button>}
      {place.page === "Notebook" && <>
        <TimeJourney years={years} entriesByYear={groups} renderEntry={pageEntry}/>
        {!years.length && <div className="index-leaf"><h1>Your first page</h1><button className="write-line" onClick={() => write()}><Plus size={17}/> Write a memory</button></div>}
      </>}
      {place.page === "Chapters" && <section className="index-leaf" key={place.key ?? "chapter-index"}>
        <h1 dir="auto">{place.key ?? "Chapters"}</h1>
        {place.key ? <>
          {!entries.some(entry => entry.chapter === place.key) && <p className="empty-state">This chapter has no memories yet.</p>}
          {entries.filter(entry => entry.chapter === place.key).map(pageEntry)}
          <button className="write-line" onClick={() => write()}><Plus size={17}/> Write in this chapter</button>
        </> : <>
          <button className="write-line" onClick={()=>setChapterForm(!chapterForm)}><Plus size={17}/> New chapter</button>
          {chapterForm && <form className="margin-form" onSubmit={event=>{
            event.preventDefault()
            const name=newChapter.trim()
            if(!name) return
            setCustomChapters(previous=>[...new Set([...previous,name])])
            setNewChapter("");setChapterForm(false);turn({page:"Chapters",key:name})
          }}><label>Chapter title<input autoFocus required maxLength={80} value={newChapter} onChange={event=>setNewChapter(event.target.value)}/></label><button className="write-line">Create chapter</button></form>}
          {chapterNames.map(chapter => {
            const id = `chapter-${encodeURIComponent(chapter)}`
            const count = entries.filter(entry => entry.chapter === chapter).length
            return <button className="index-line" id={id} key={chapter} onClick={() => turn({page:"Chapters",key:chapter},undefined,id)}><span><bdi>{chapter}</bdi><small>{count} {count === 1 ? "entry" : "entries"}</small></span><ArrowRight size={17}/></button>
          })}</>}
      </section>}
      {place.page === "People" && place.key && people[place.key] && (() => {
        const id = place.key
        const ordered = [...entries].sort((a,b)=>b.date.localeCompare(a.date))
        return <PersonProfile key={id} personId={id} person={people[id]} change={patch=>setPeople(previous=>({...previous,[id]:{...previous[id],...patch}}))}
          memories={ordered.filter(entry=>aboutPerson(entry,id) || participant(entry,id,people) || writtenAbout(entry,id))} renderMemory={pageEntry}
          memoryContext={entry=>[
            aboutPerson(entry,id) && "About them",
            participant(entry,id,people) && "They were there",
            writtenAbout(entry,id) && "Mentioned",
          ].filter(Boolean).join(" · ")}
          write={phaseId=>write(undefined,phaseId)} assignPhase={(entry,phaseId)=>{
            const other = (entry.about ?? []).filter(link=>link.personId!==id)
            const phaseOnly = !aboutPerson(entry,id)
            change(entry.id,{about:phaseId || !phaseOnly ? [...other,{personId:id,phaseId:phaseId || undefined,phaseOnly}] : other})
          }}
          />
      })()}
      {place.page === "People" && !place.key && <section className="index-leaf">
        <h1>People</h1>
        <button className="write-line" id="add-person" onClick={()=>setPersonForm(!personForm)}><Plus size={17}/> Add a person</button>
        {personForm && <form className="margin-form" onSubmit={event=>{
          event.preventDefault()
          const name=newPerson.trim()
          if(!name) return
          const id=crypto.randomUUID()
          setPeople(previous=>({...previous,[id]:{name,note:""}}))
          setNewPerson("");setPersonForm(false);setPeopleQuery("")
          turn({page:"People",key:id},undefined,"add-person")
        }}><label>New person's name<input dir="auto" autoFocus required maxLength={100} value={newPerson} onChange={event=>setNewPerson(event.target.value)}/></label><button className="write-line">Add person</button></form>}
        {Object.keys(people).length ? <>
          <div className="search-field"><Search size={19} aria-hidden="true"/><input className="find-line" type="search" aria-label="Find people" dir="auto" placeholder="Find by name or relationship" value={peopleQuery} onChange={event=>setPeopleQuery(event.target.value)}/></div>
          {Object.entries(people).filter(([,record])=>searchKey([record.name,record.alsoKnownAs,record.relationship].join(" ")).includes(searchKey(peopleQuery.trim())))
            .sort(([,a],[,b])=>a.name.localeCompare(b.name)).map(([id,record])=><button className="index-line" id={`person-${id}`} key={id} onClick={()=>turn({page:"People",key:id},undefined,`person-${id}`)}>
              <span><bdi>{record.name}</bdi>{(record.relationship || record.alsoKnownAs) && <small dir="auto">{[record.relationship,record.alsoKnownAs].filter(Boolean).join(" · ")}</small>}</span><ArrowRight size={17}/>
            </button>)}
          {peopleQuery.trim() && !Object.values(people).some(record=>searchKey([record.name,record.alsoKnownAs,record.relationship].join(" ")).includes(searchKey(peopleQuery.trim()))) && <p role="status">No matching people.</p>}
        </> : <p>Create a profile to write about someone or link them to memories.</p>}
      </section>}
      {place.page === "Find" && <section className="index-leaf"><h1>Find a memory</h1>
        <div className="search-field"><Search size={19} aria-hidden="true"/><input className="find-line" type="search" aria-label="Search your notebook" placeholder="A word, a name, a line…" autoFocus value={query} onChange={event => setQuery(event.target.value)}/></div>
        <div className="search-filters">
          <label>Person<select value={filters.person} onChange={event=>setFilters({...filters,person:event.target.value})}><option value="">Anyone</option>{Object.entries(people).map(([id,person])=><option key={id} value={id}>{person.name}</option>)}</select></label>
          <label>Chapter<select value={filters.chapter} onChange={event=>setFilters({...filters,chapter:event.target.value})}><option value="">Any chapter</option>{chapterNames.map(name=><option key={name}>{name}</option>)}</select></label>
          <label>Year<select value={filters.year} onChange={event=>setFilters({...filters,year:event.target.value})}><option value="">Any year</option>{filterYears.map(year=><option key={year}>{year}</option>)}</select></label>
          <label className="photos-filter"><input type="checkbox" checked={filters.photos} onChange={event=>setFilters({...filters,photos:event.target.checked})}/>Has photos</label>
        </div>
        {(query.trim() || hasFilters) && (matches.length ? matches.map(entry => finding(entry,"search")) : <>
          <p className="empty-state" role="status">No matching memories. Try a title, caption, or person’s name.</p>
          <button className="write-line" onClick={() => {setQuery("");setFilters({person:"",chapter:"",year:"",photos:false});document.querySelector<HTMLInputElement>(".find-line")?.focus()}}>Clear search</button>
        </>)}
      </section>}
      {place.page === "Album" && <AlbumForm entries={entries} chapters={chapterNames} activeChapter={place.key} format={format} close={back} submit={async (selected,title)=>{
        setWorking(true)
        setActivity("Preparing readable album…")
        setIssue("")
        setNotice("")
        try {
          const result = await exportAlbum(selected,title,format,people,persistent)
          if (result.saved) setNotice(result.missing ? `Album exported. ${result.missing} attachments could not be included.` : "Readable album exported.")
        } catch (error) {setIssue(String(error))}
        finally {setWorking(false)}
      }}/>}
      {place.page === "Deleted" && <section className="index-leaf"><h1>Recently deleted</h1>
        {!deleted.length && <p>No deleted memories.</p>}
        {deleted.map(entry=><div className="index-line" key={entry.id}><span>{entry.title || "Untitled memory"}<small>{format(entry.date,entry.timing)}</small></span><button className="write-line" onClick={()=>{
          restore(entry, undo?.entry.id === entry.id ? undo.index : entries.length)
          turn({page:"Notebook"},entry.id)
        }}>Restore</button></div>)}
      </section>}
      <footer className="book-end"><button id="export-album" onClick={()=>turn({page:"Album",key:place.page === "Chapters" ? place.key : undefined},undefined,"export-album")}>Export HTML album</button><button id="open-deleted" onClick={()=>turn({page:"Deleted"},undefined,"open-deleted")}>Recently deleted{deleted.length ? ` (${deleted.length})` : ""}</button>
        {persistent && <><button ref={backupButton} disabled={working} onClick={()=>void archiveAction("backup")}>Export encrypted backup</button><button disabled={working} onClick={()=>void archiveAction("lock")}>Lock</button></>}
        {!persistent && isTauri() && <button onClick={close}>Return to notebook cover</button>}
      </footer>
    </main>
    {working && <div className="media-status" role="status">{activity}</div>}
    {closing && <div className="media-status" role="status">Saving before closing…</div>}
    {!working && !closing && (saveIssue || issue || notice || undo) && <aside className="save-issue">
      {saveIssue && <div className="notification"><span role="alert">{saveIssue}</span><button className="write-line" onClick={()=>{
        setStatus("Saving…")
        void save(currentSnapshot.current).then(()=>{
          setSaveIssue("")
          setStatus(currentSnapshot.current === published.current ? "Saved on this device" : "Saving…")
        }).catch(error=>{setStatus("Changes pending");setSaveIssue(String(error))})
      }}>Retry save</button></div>}
      {(issue || notice) && <div className="notification"><span role={issue ? "alert" : "status"}>{issue || notice}</span><button className="icon-button" onClick={()=>issue ? setIssue("") : setNotice("")} aria-label="Dismiss message"><X size={16}/></button></div>}
      {undo && <div className="notification"><span role="status">Memory moved to Recently deleted.</span><button className="write-line" onClick={()=>{
        restore(undo.entry, undo.index)
        setNotice("Memory restored.")
        if (place.page !== "Deleted") setPending({id:undo.entry.id})
      }}>Undo</button></div>}
    </aside>}
    <dialog ref={note} className="margin-note" aria-label="Person mentioned in the story" style={notePosition} onClose={() => setPerson(null)}
      onClick={dismissOnBackdrop}>
      {person && people[person] && <><button className="note-close" aria-label="Close person note" onClick={() => note.current?.close()}><X size={17}/></button>
        <h2 dir="auto">{people[person].name}</h2><p dir="auto">{people[person].note}</p>
        <button className="write-line" onClick={()=>{note.current?.close();turn({page:"People",key:person})}}>Open profile</button>
        {entries.filter(entry => writtenAbout(entry,person)).map(entry => <button className="note-reference" key={entry.id} onClick={() => {note.current?.close();turn({page:"Notebook"},entry.id)}}>{entry.title || "Untitled memory"} <ArrowRight size={14}/></button>)}
      </>}
    </dialog>
    <dialog ref={lightbox} className="lightbox" aria-label="Photographs" onClose={() => {
      viewer?.trigger.focus({preventScroll:true})
      setViewer(null)
    }} onClick={dismissOnBackdrop} onKeyDown={event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      event.preventDefault()
      stepPhoto(event.key === "ArrowLeft" ? -1 : 1)
    }}>
      <div className="photo-viewer-toolbar">
        {viewer && viewer.photos.length > 1 && <>
          <button className="icon-button" aria-label="Previous photograph" aria-disabled={viewer.index === 0} onClick={()=>stepPhoto(-1)}><ChevronLeft size={18}/></button>
          <span role="status">{viewer.index + 1} / {viewer.photos.length}</span>
          <button className="icon-button" aria-label="Next photograph" aria-disabled={viewer.index === viewer.photos.length - 1} onClick={()=>stepPhoto(1)}><ChevronRight size={18}/></button>
        </>}
        <button className="icon-button photo-viewer-close" aria-label="Close photograph" autoFocus onClick={() => lightbox.current?.close()}><X size={20}/></button>
      </div>
      {photo && <figure>
        <img key={photo.id} src={photo.url} alt={photo.caption || "Journal photograph"}/>
        {photo.caption && <figcaption dir="auto">{photo.caption}</figcaption>}
      </figure>}
    </dialog>
  </>
}

