import { useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowDownRight } from "lucide-react"
import type { Entry } from "./NotebookEntry"

export function TimeJourney({years, entriesByYear, renderEntry}: {
  years: string[]
  entriesByYear: ReadonlyMap<string, Entry[]>
  renderEntry: (entry: Entry) => ReactNode
}) {
  const [active,setActive] = useState(years[0])
  const journal = useRef<HTMLDivElement>(null)
  const bookmarks = useRef<HTMLElement>(null)
  const yearKey = years.join("|")
  function jumpToYear(year: string, immediate = false) {
    document.getElementById(`year-${year}`)?.scrollIntoView({
      behavior: immediate || matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    })
  }

  function jumpToMemory(id: string) {
    const entry = document.getElementById(`entry-${id}`)
    entry?.focus({preventScroll:true})
    entry?.scrollIntoView({block:"start"})
  }

  useEffect(() => {
    const scroller = journal.current?.closest(".app-scroll")
    const leaves = Array.from(journal.current?.querySelectorAll<HTMLElement>("[data-year]") ?? [])
    if (!leaves.length) return
    let frame = 0
    function follow() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const railBottom = bookmarks.current?.parentElement?.getBoundingClientRect().bottom ?? 0
        const line = Math.max(window.innerHeight * .44, Math.min(railBottom + 1, window.innerHeight - 1))
        // Year sections are in document order, so their bottom edges are ordered.
        let low = 0
        let high = leaves.length - 1
        while (low < high) {
          const middle = Math.floor((low + high) / 2)
          if (leaves[middle].getBoundingClientRect().bottom > line) high = middle
          else low = middle + 1
        }
        const leaf = leaves[low]
        if (!leaf?.dataset.year) return
        setActive(leaf.dataset.year)
        const { top, height } = leaf.getBoundingClientRect()
        const progress = Math.min(1, Math.max(0, (line - top) / Math.max(1, height)))
        leaf.style.setProperty("--year-progress", String(progress))
      })
    }
    follow()
    scroller?.addEventListener("scroll",follow,{passive:true})
    window.addEventListener("resize",follow)
    window.addEventListener("focusin",follow)
    return () => {
      cancelAnimationFrame(frame)
      scroller?.removeEventListener("scroll",follow)
      window.removeEventListener("resize",follow)
      window.removeEventListener("focusin",follow)
    }
  }, [yearKey])

  useEffect(() => {
    const rail = bookmarks.current
    const current = rail?.querySelector("[aria-current]")
    if (!rail || !current) return
    const bounds = rail.getBoundingClientRect()
    const tab = current.getBoundingClientRect()
    if (tab.left < bounds.left) rail.scrollLeft += tab.left - bounds.left - 8
    if (tab.right > bounds.right) rail.scrollLeft += tab.right - bounds.right + 8
  }, [active])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add("ink-arrived")
        observer.unobserve(entry.target)
      }
    }, { threshold: .12 })
    const container = journal.current
    function observePages() {
      container?.querySelectorAll(".notebook-entry:not(.ink-arrived)").forEach(entry => observer.observe(entry))
    }
    observePages()
    const changes = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.removedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.matches(".notebook-entry")) observer.unobserve(node)
          node.querySelectorAll(".notebook-entry").forEach(entry => observer.unobserve(entry))
        }
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.matches(".notebook-entry:not(.ink-arrived)")) observer.observe(node)
          node.querySelectorAll(".notebook-entry:not(.ink-arrived)").forEach(entry => observer.observe(entry))
        }
      }
    })
    if (container) changes.observe(container, { childList: true, subtree: true })
    return () => { observer.disconnect(); changes.disconnect() }
  }, [])

  return <div ref={journal}>
    <div className="year-bar">
    <nav ref={bookmarks} className="year-thread" aria-label="Jump to year">
      {years.map(year => <button key={year} aria-current={active === year ? "location" : undefined} onClick={() => jumpToYear(year)}>{year}</button>)}
    </nav>
    {years.length > 0 && <label className="compact-year">
      <span>Year</span>
      <select aria-label="Jump to year" value={years.includes(active) ? active : years[0]} onChange={event => {
        setActive(event.target.value)
        jumpToYear(event.target.value, true)
      }}>
        {years.map(year => <option key={year}>{year}</option>)}
      </select>
    </label>}
    </div>
    {years.map(year => {
      const entries = entriesByYear.get(year) ?? []
      return <section id={`year-${year}`} data-year={year} aria-labelledby={`heading-${year}`} className={`year-leaf${year===active ? " current-leaf" : ""}`} key={year}>
        <div className="year-front">
          <h1 id={`heading-${year}`}>{year}</h1>
          <div className="year-progress" aria-hidden="true"><span/></div>
          <nav className="year-contents" aria-label={`Memories in ${year}`}>
            <p>{entries.length} {entries.length === 1 ? "memory" : "memories"}</p>
            <ul>
              {entries.map(entry => <li key={entry.id}>
                <button onClick={() => jumpToMemory(entry.id)}><span dir="auto">{entry.title.trim() || "Untitled memory"}</span><ArrowDownRight size={15} aria-hidden="true"/></button>
              </li>)}
            </ul>
          </nav>
        </div>
        <div className="leaf-writing">{entries.map(renderEntry)}</div>
      </section>
    })}
  </div>
}
