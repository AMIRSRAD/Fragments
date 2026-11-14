import { useState, type ReactNode } from "react"
import type { Person } from "./memories"
import type { Entry } from "./NotebookEntry"

const fields = [
  ["alsoKnownAs", "Also known as"],
  ["relationship", "Relationship"],
  ["whereWeMet", "Where we met"],
  ["birthday", "Birthday"],
] as const

export function PersonProfile({person, personId, change, memories, renderMemory, memoryContext, write, assignPhase}: {
  person: Person
  personId: string
  change: (patch: Partial<Person>) => void
  memories: Entry[]
  renderMemory: (entry: Entry) => ReactNode
  memoryContext: (entry: Entry) => string
  write: (phaseId?: string) => void
  assignPhase: (entry: Entry, phaseId: string) => void
}) {
  const [phaseName,setPhaseName] = useState("")
  const phases = person.phases ?? []
  const unassigned = memories.filter(entry=>!phases.some(phase=>phase.id === entry.about?.find(link=>link.personId === personId)?.phaseId))

  function memoryRow(entry: Entry) {
    const phaseId = entry.about?.find(link=>link.personId === personId)?.phaseId
    return <div className="phase-memory" key={entry.id}>
      <div className="phase-memory-meta">
        <span>{memoryContext(entry)}</span>
        {!!phases.length && <label>Phase <select aria-label={`Phase for ${entry.title || "untitled memory"}`} value={phases.some(phase=>phase.id === phaseId) ? phaseId : ""}
          onChange={event=>assignPhase(entry,event.target.value)}>
          <option value="">No phase</option>{phases.map(phase=><option value={phase.id} key={phase.id}>{phase.name}</option>)}
        </select></label>}
      </div>
      {renderMemory(entry)}
    </div>
  }

  return <section className="index-leaf person-profile">
    <h1 dir="auto">{person.name || "Unnamed person"}</h1>
    <div className="person-profile-actions"><button className="primary-action" onClick={()=>write()}>Write a memory about them</button>
      <a className="write-line" href="#person-memories">Jump to memories</a></div>
    <div className="person-fields">
      <label>Name<input dir="auto" maxLength={100} value={person.name} onChange={event=>change({name:event.target.value})}
        onBlur={()=>change({name:person.name.trim() || "Unnamed person"})}/></label>
      {fields.map(([key,label])=><label key={key}>{label}<input dir="auto" value={person[key] ?? ""}
        maxLength={160} placeholder={key === "birthday" ? "e.g. 12 May" : undefined}
        onChange={event=>change({[key]:event.target.value})}/></label>)}
      <label className="person-summary">Short introduction<textarea dir="auto" rows={2} value={person.note}
        onChange={event=>change({note:event.target.value})}/></label>
    </div>
    <section className="person-writing">
      <h2>Writing about them</h2>
      <p>These notes live on this profile and don’t need a date or a linked memory.</p>
      <textarea aria-label="Writing about them" rows={8} dir="auto" value={person.writing ?? ""}
        placeholder="What do you want to remember about this person?"
        onChange={event=>change({writing:event.target.value})}/>
    </section>
    <section className="person-timeline" id="person-memories">
      <h2>Memories</h2>
      <p>These memories also appear in the notebook. Use phases to group them by periods in your relationship.</p>
      <form className="margin-form" onSubmit={event=>{
        event.preventDefault()
        if (!phaseName.trim()) return
        change({phases:[...phases,{id:crypto.randomUUID(),name:phaseName.trim()}]})
        setPhaseName("")
      }}>
        <label>New phase<input dir="auto" value={phaseName} maxLength={100} onChange={event=>setPhaseName(event.target.value)} placeholder="e.g. Friend era"/></label>
        <button className="write-line" disabled={!phaseName.trim()}>Add phase</button>
      </form>
      {phases.map(phase=>{
        const group = memories.filter(entry=>entry.about?.some(link=>link.personId===personId && link.phaseId===phase.id))
        return <section className="person-phase" key={phase.id}>
          <h3><input aria-label="Phase name" dir="auto" maxLength={100} value={phase.name}
            onChange={event=>change({phases:phases.map(item=>item.id===phase.id ? {...item,name:event.target.value} : item)})}
            onBlur={()=>{if (!phase.name.trim()) change({phases:phases.map(item=>item.id===phase.id ? {...item,name:"Untitled phase"} : item)})}}/></h3>
          <button id={`write-phase-${phase.id}`} className="write-line" onClick={()=>write(phase.id)}>Write in this phase</button>
          {group.map(memoryRow)}
        </section>
      })}
      {!!unassigned.length && <><h3>No phase</h3>{unassigned.map(memoryRow)}</>}
      {!memories.length && <p className="empty-state">No memories are linked to this person yet.</p>}
    </section>
  </section>
}
