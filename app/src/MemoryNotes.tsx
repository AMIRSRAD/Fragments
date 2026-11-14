import { useState } from "react"
import { StoryInk } from "./StoryInk"
import type { People, PersonId } from "./memories"
import type { Entry, Reflection } from "./NotebookEntry"

export function participant(entry: Entry, id: PersonId, people: People) {
  // Early sample journals stored participant names instead of identifiers.
  return entry.people?.some(value => value === id || (!Object.hasOwn(people,value) && value === people[id]?.name)) ?? false
}

export function MemoryNotes({entry, people, identify, change, format}: {
  entry: Entry; people: People; identify: (id: PersonId, anchor: HTMLElement) => void
  change: (patch: Partial<Entry>) => void; format: (date: string) => string
}) {
  const [writing, setWriting] = useState(false)
  const [draft, setDraft] = useState("")
  function addReflection() {
    if (!draft.trim()) return
    const today = new Date()
    const date = [today.getFullYear(),today.getMonth()+1,today.getDate()].map((value,index) => String(value).padStart(index ? 2 : 4,"0")).join("-")
    const reflection: Reflection = {id:crypto.randomUUID(),date,text:draft.trim()}
    change({reflections:[...(entry.reflections ?? []),reflection]})
    setDraft("")
    setWriting(false)
  }

  return <div className="memory-notes">
    <details>
      <summary>People this memory is about{entry.about?.some(link=>!link.phaseOnly) ? ` · ${entry.about.filter(link=>!link.phaseOnly).map(link=>people[link.personId]?.name).filter(Boolean).join(", ")}` : ""}</summary>
      {Object.keys(people).length === 0 && <p>Add people from the People tab first.</p>}
      <div className="about-links">
        {Object.entries(people).map(([id, person]) => {
          const link = entry.about?.find(item=>item.personId === id)
          const other = (entry.about ?? []).filter(item=>item.personId !== id)
          return <div className="about-link" key={id}>
            <label><input type="checkbox" checked={Boolean(link && !link.phaseOnly)} onChange={event=>change({
              about:event.target.checked ? [...other,{personId:id,phaseId:link?.phaseId}] : other,
            })}/><bdi>{person.name}</bdi></label>
            {link && !link.phaseOnly && !!person.phases?.length && <select aria-label={`Phase for ${person.name}`} value={link.phaseId ?? ""} onChange={event=>change({
              about:[...other,{personId:id,phaseId:event.target.value || undefined}],
            })}>
              <option value="">No phase</option>{person.phases.map(phase=><option key={phase.id} value={phase.id}>{phase.name}</option>)}
            </select>}
          </div>
        })}
      </div>
    </details>
    <details>
      <summary>People who were there</summary>
      {Object.keys(people).length === 0 && <p>Add people from the People tab first.</p>}
      <div className="participants">
        {Object.entries(people).map(([id, person]) => <label key={id}>
          <input type="checkbox" checked={participant(entry,id,people)} onChange={event => {
            const remaining = (entry.people ?? []).filter(value => value !== id && (Object.hasOwn(people,value) || value !== person.name))
            change({people:event.target.checked ? [...remaining,id] : remaining})
          }}/><bdi>{person.name}</bdi>
        </label>)}
      </div>
    </details>
    {entry.reflections?.map(reflection => <section className="reflection" key={reflection.id}>
      <h3>Reflection <small>{format(reflection.date)}</small></h3>
      <StoryInk editorId={`reflection-${reflection.id}`} value={reflection.text} people={people} identify={identify}
        change={text=>change({reflections:entry.reflections?.map(note=>note.id === reflection.id ? {...note,text} : note)})}/>
      <button className="write-line" onClick={()=>change({reflections:entry.reflections?.filter(note=>note.id!==reflection.id)})}>Remove reflection</button>
    </section>)}
    {writing ? <form className="margin-form" onSubmit={event=>{event.preventDefault();addReflection()}}>
      <p className="reflection-hint">Add what you think or feel about this memory today. The original story stays as written.</p>
      <label>New reflection<textarea dir="auto" autoFocus required value={draft} onChange={event=>setDraft(event.target.value)}/></label>
      <div className="slip-actions">
        <button type="button" className="write-line" onClick={()=>setWriting(false)}>Cancel</button>
        <button className="primary-action" disabled={!draft.trim()}>Save reflection</button>
      </div>
    </form> : <button className="write-line" onClick={()=>setWriting(true)}>Add reflection</button>}
  </div>
}
