import { useLayoutEffect, useRef, useState } from "react"
import { mentionLabel, mentionPattern, searchKey, type People, type PersonId } from "./memories"

function readStory(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
  if (node instanceof HTMLElement) {
    if (node.tagName === "BR") return "\n"
    const person = node.dataset.person
    if (person) return `[${node.dataset.label}](fragments:person/${person})`
    if (node.matches("div, p") && node.childNodes.length === 1 && node.firstChild instanceof HTMLBRElement) {
      return node.previousSibling ? "\n" : ""
    }
    const text = Array.from(node.childNodes, readStory).join("")
    return /^(DIV|P)$/.test(node.tagName) && node.previousSibling ? "\n" + text : text
  }
  return ""
}

export function StoryInk({ value, change, identify, editorId, people }: {
  value: string
  change: (value: string) => void
  identify: (person: PersonId, anchor: HTMLElement) => void
  editorId: string
  people: People
}) {
  const ink = useRef<HTMLDivElement>(null)
  const [suggestion, setSuggestion] = useState("")
  const cursor = useRef<Range | null>(null)

  useLayoutEffect(() => {
    const element = ink.current
    if (!element) return
    if (readStory(element) === value) {
      for (const mark of element.querySelectorAll<HTMLButtonElement>("[data-person]")) {
        const name = people[mark.dataset.person ?? ""]?.name
        if (name && mark.textContent !== name) mark.textContent = name
      }
      return
    }
    let position = 0
    const nodes: Node[] = []
    for (const match of value.matchAll(mentionPattern)) {
      nodes.push(document.createTextNode(value.slice(position, match.index)))
      position = match.index + match[0].length
      const person = match[2] as PersonId
      if (Object.hasOwn(people, person)) nodes.push(personMark(person, people[person].name || mentionLabel(match[1]), match[1]))
      else nodes.push(document.createTextNode(match[0]))
    }
    nodes.push(document.createTextNode(value.slice(position)))
    element.replaceChildren(...nodes)
  }, [value,people])

  function update() {
    if (!ink.current) return
    const selection = window.getSelection()
    const node = selection?.anchorNode
    const end = selection?.anchorOffset ?? 0
    const match = node?.nodeType === Node.TEXT_NODE && ink.current.contains(node)
      ? node.textContent?.slice(0, end).match(/(?:^|\s)@([\p{L}\p{M}\u200c-]*)$/u)
      : null
    if (match && node && selection?.isCollapsed) {
      const range = document.createRange()
      range.setStart(node, end - match[1].length - 1)
      range.setEnd(node, end)
      cursor.current = range
      setSuggestion("@" + match[1])
    } else {
      cursor.current = null
      setSuggestion("")
    }
    change(readStory(ink.current))
  }

  function insert(person: PersonId) {
    const range = cursor.current
    if (!range || !ink.current?.contains(range.startContainer)) return
    const name = people[person].name
    const mark = personMark(person, name, name.replace(/[\\\]]/g, "\\$&"))
    const space = document.createTextNode(" ")
    range.deleteContents()
    range.insertNode(space)
    range.insertNode(mark)
    range.setStartAfter(space)
    range.collapse(true)
    ink.current.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    update()
  }

  const choices = suggestion ? Object.keys(people).filter(id =>
    searchKey(people[id].name).split(/\s+/).some(part => part.startsWith(searchKey(suggestion.slice(1))))).slice(0,8) : []

  return <div className="ink-wrap" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setSuggestion("")
      cursor.current = null
    }
  }}>
    <div ref={ink} id={editorId} className="story-ink" dir="auto" role="textbox" aria-multiline="true" aria-label="Story" contentEditable suppressContentEditableWarning
      data-placeholder="Write what you remember…"
      onInput={update}
      onClick={event => {
        const mark = (event.target as HTMLElement).closest<HTMLElement>("[data-person]")
        if (mark) identify(mark.dataset.person as PersonId, mark)
        else setSuggestion("")
      }}
      onKeyDown={event => {
        const mark = (event.target as HTMLElement).closest<HTMLElement>("[data-person]")
        if (mark && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault()
          identify(mark.dataset.person as PersonId, mark)
        } else if (choices.length && event.key === "ArrowDown" && !event.nativeEvent.isComposing) {
          event.preventDefault()
          event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(".ink-suggestions button")?.focus()
        } else if (suggestion && event.key === "Enter" && choices.length && !event.nativeEvent.isComposing) {
          event.preventDefault()
          insert(choices[0])
        } else if (event.key === "Escape") {
          setSuggestion("")
        }
      }}
      onPaste={event => {
        event.preventDefault()
        document.execCommand("insertText", false, event.clipboardData.getData("text/plain"))
      }}/>
    {choices.length > 0 && <div className="ink-suggestions" role="group" aria-label="People to link" onKeyDown={event => {
      if (event.key === "Escape") {
        setSuggestion("")
        cursor.current = null
        ink.current?.focus()
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
      event.preventDefault()
      const buttons = Array.from(event.currentTarget.querySelectorAll("button"))
      const index = buttons.indexOf(event.target as HTMLButtonElement)
      buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus()
    }}>
      {choices.map(person => <button key={person} dir="auto" title={people[person].note} onMouseDown={event => event.preventDefault()} onClick={() => insert(person)}>{people[person].name}{people[person].note && <small>{people[person].note}</small>}</button>)}
    </div>}
  </div>
}

function personMark(person: PersonId, name: string, label: string) {
  const mark = document.createElement("button")
  mark.type = "button"
  mark.className = "person-mark"
  mark.contentEditable = "false"
  mark.dataset.person = person
  mark.dataset.label = label
  mark.textContent = name
  mark.setAttribute("aria-haspopup", "dialog")
  return mark
}
