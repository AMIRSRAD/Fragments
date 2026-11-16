import { useState } from "react"
import type { Entry } from "./NotebookEntry"
import type { Timing } from "./dates"

export function AlbumForm({entries, chapters, activeChapter, format, submit, close}: {
  entries: Entry[]; chapters: string[]; activeChapter?: string
  format: (date: string, timing?: Timing) => string
  submit: (entries: Entry[], title: string) => void; close: () => void
}) {
  const [chapter,setChapter] = useState(activeChapter ?? "")
  const [selected,setSelected] = useState<string[]>([])
  const options = entries.filter(entry => !chapter || entry.chapter === chapter)
  const chosen = options.filter(entry=>selected.includes(entry.id))
  return <section className="index-leaf">
    <h1>Export HTML album</h1>
    <p>This readable album is unencrypted. Anyone with the file can open the memories and attachments you include.</p>
    <p>Embedded attachments are limited to 64 MiB after encoding. Use an encrypted backup to include the entire notebook and all its media.</p>
    <div className="margin-form"><label>Chapter<select value={chapter} onChange={event=>{setChapter(event.target.value);setSelected([])}}>
      <option value="">All chapters</option>{chapters.map(name=><option key={name}>{name}</option>)}
    </select></label></div>
    <button className="write-line" disabled={!options.length} onClick={()=>setSelected(options.map(entry=>entry.id))}>Select all shown</button>
    {options.map(entry=><label className="album-choice" key={entry.id}>
      <input type="checkbox" checked={selected.includes(entry.id)} onChange={event=>setSelected(previous=>event.target.checked ? [...previous,entry.id] : previous.filter(id=>id!==entry.id))}/>
      <span><bdi>{entry.title || "Untitled memory"}</bdi><small>{format(entry.date,entry.timing)}</small></span>
    </label>)}
    <div className="slip-actions"><button className="write-line" onClick={close}>Cancel</button>
      <button className="primary-action" disabled={!chosen.length} onClick={()=>submit(chosen,chapter || "Fragments album")}>Export {chosen.length} {chosen.length === 1 ? "memory" : "memories"}</button></div>
  </section>
}
