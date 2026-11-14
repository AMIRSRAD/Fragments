import { memo, useId, useRef, useState } from "react"
import { ImagePlus, Plus, Star, Trash2, X } from "lucide-react"
import { type Memory, type People, type PersonId, type PersonMemoryLink } from "./memories"
import { StoryInk } from "./StoryInk"
import { convertFileSrc } from "@tauri-apps/api/core"
import { DateSlip } from "./DateSlip"

import { MemoryNotes } from "./MemoryNotes"
import type { Timing } from "./dates"

export type Reflection = { id: string; date: string; text: string }
export type Media = { id: string; mime: string; caption: string; url?: string }
export type Photograph = { id: string; url: string; caption: string }
export type Entry = Memory & { imageUrl?: string; imageName?: string; media?: Media[]; cover?: string; timing?: Timing; reflections?: Reflection[]; about?: PersonMemoryLink[] }

export function attachments(entry: Entry): Media[] {
  if (entry.media) return entry.media
  if (entry.imageUrl) return [{id:"legacy-cover",mime:"image/jpeg",caption:entry.imageName ?? ""}]
  if (entry.photo) return [{id:"sample-cover",mime:"image/png",caption:entry.imageName ?? "Caspian coast"}]
  return []
}

export function mediaUrl(entry: Entry, item: Media) {
  if (item.id === "sample-cover") return "/caspian.png"
  if (item.id === "legacy-cover") return entry.imageUrl ?? ""
  return item.url ?? convertFileSrc(`${item.id}/${item.mime.split("/")[1]}`, "notebook-media").replace("%2F","/")
}
type Props = {
  entry: Entry
  format: (date: string, timing?: Timing) => string
  actions: {
    change: (id: string, patch: Partial<Entry>) => void
    identify: (person: PersonId, anchor: HTMLElement) => void
    write: (entry: Entry) => void
    viewPhoto: (photos: Photograph[], id: string, trigger: HTMLButtonElement) => void
    attach: (id: string, files: File[]) => void
    remove: (entry: Entry) => void
  }
  nativeMedia: boolean
  calendar: string
  people: People
  chapters: string[]
}

export const NotebookEntry = memo(function NotebookEntry({ entry, format, actions, calendar, people, chapters, nativeMedia }: Props) {
  const {identify, viewPhoto} = actions
  const change = (patch: Partial<Entry>) => actions.change(entry.id,patch)
  const attach = (files: File[]) => actions.attach(entry.id,files)
  const file = useRef<HTMLInputElement>(null)
  const [dateOpen, setDateOpen] = useState(false)
  const dateControl = useRef<HTMLButtonElement>(null)
  const uid = useId()
  const items = attachments(entry)
  const cover = items.find(item => item.id === entry.cover) ?? items[0]
  const gallery = cover ? [cover,...items.filter(item=>item.id!==cover.id)] : []
  const [failed,setFailed] = useState<string[]>([])
  function openPhoto(id: string, trigger: HTMLButtonElement) {
    const photos = gallery.filter(item => !item.mime.startsWith("video/") && !failed.includes(item.id))
      .map(item => ({id:item.id, url:mediaUrl(entry,item), caption:item.caption}))
    viewPhoto(photos,id,trigger)
  }
  function closeDate() {
    setDateOpen(false)
    dateControl.current?.focus({preventScroll:true})
  }

  return <article className={gallery.length ? "notebook-entry has-media" : "notebook-entry"} id={`entry-${entry.id}`} tabIndex={-1}
    onDragOver={event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault() }}
    onDrop={event => {
      if (!event.dataTransfer.types.includes("Files")) return
      event.preventDefault()
      event.stopPropagation()
      attach(Array.from(event.dataTransfer.files))
    }}>
    <div className="entry-date">
      <button className="ink-label" ref={dateControl} onClick={() => setDateOpen(true)} aria-haspopup="dialog" aria-expanded={dateOpen} aria-controls={dateOpen ? uid : undefined}>{entry.date ? format(entry.date,entry.timing) : "Add a date"}</button>
      <span aria-hidden="true">·</span>
      <select aria-label="Chapter" value={entry.chapter} onChange={event => change({chapter: event.target.value})}>{[...new Set([entry.chapter, ...chapters])].map(chapter => <option key={chapter}>{chapter}</option>)}</select>
      {dateOpen && <DateSlip id={uid} date={entry.date} timing={entry.timing} calendar={calendar} close={closeDate} apply={(date,timing)=>{change({date,timing});closeDate()}}/>}
    </div>
    <h2 className="entry-heading" aria-label={entry.title || "Untitled memory"}><textarea aria-label="Memory title" rows={1} value={entry.title} placeholder="Give this a title" dir="auto"
      onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) event.preventDefault() }}
      onChange={event => change({title: event.target.value.replace(/[\r\n]+/g, " ")})}/></h2>
    {gallery.length > 0 && <div className="media-gallery">
      {gallery.map(item => {
        const url=mediaUrl(entry,item)
        return <figure className={`photo-print media-print${item.id===cover?.id ? " cover-print" : ""}`} key={item.id}>
          {failed.includes(item.id) ? <div className="media-unavailable"><p>Couldn’t display this attachment.</p><button className="write-line" onClick={()=>setFailed(previous=>previous.filter(id=>id!==item.id))}>Retry preview</button></div> : item.mime.startsWith("video/") ?
            <video src={url} controls preload="none" aria-label={item.caption || "Video"} onError={()=>setFailed(previous=>[...previous,item.id])}/> :
            <button className="print-image" aria-haspopup="dialog" aria-label={item.caption ? `Enlarge photograph: ${item.caption}` : "Enlarge photograph"} onClick={event=>openPhoto(item.id,event.currentTarget)}><img src={url} alt={item.caption} loading="lazy" onError={()=>setFailed(previous=>[...previous,item.id])}/></button>}
          <figcaption><textarea dir="auto" rows={1} value={item.caption} aria-label="Media caption" placeholder="Write a caption"
            onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) event.preventDefault() }}
            onChange={event=>change({media:items.map(value=>value.id===item.id ? {...value,caption:event.target.value.replace(/[\r\n]+/g," ")} : value)})}/>
          <div className="print-actions">
            <button type="button" className="icon-button" aria-label={item.id===cover?.id ? "Cover media" : "Make cover"} aria-pressed={item.id===cover?.id} title={item.id===cover?.id ? "Cover media" : "Make cover"} onClick={()=>change({cover:item.id})}><Star size={15} fill={item.id===cover?.id ? "currentColor" : "none"}/></button>
            <button type="button" className="icon-button" aria-label="Remove attachment" title="Remove attachment" onClick={()=>change({media:items.filter(value=>value.id!==item.id), ...(item.id==="legacy-cover" ? {imageUrl:undefined} : {}), ...(item.id==="sample-cover" ? {photo:false} : {})})}><X size={15}/></button>
          </div></figcaption>
        </figure>
      })}
    </div>}
    <StoryInk editorId={`story-${entry.id}`} value={entry.text} change={text => change({text})} identify={identify} people={people}/>
    <MemoryNotes entry={entry} people={people} identify={identify} change={change} format={format}/>
    <div className="entry-tools">
      <button className="add-media" onClick={() => nativeMedia ? attach([]) : file.current?.click()}><ImagePlus size={15}/>Add media</button>
      <button className="write-here" onClick={() => actions.write(entry)}><Plus size={15}/>Write here</button>
      <button className="icon-button trash-memory" aria-label="Move to Recently deleted" title="Move to Recently deleted" onClick={() => actions.remove(entry)}><Trash2 size={16}/></button>
      <input ref={file} type="file" hidden multiple accept="image/*,video/*" onChange={event => {
        attach(Array.from(event.currentTarget.files ?? []))
        event.currentTarget.value = ""
      }}/>
    </div>
  </article>
})
