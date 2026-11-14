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

  function jumpToMemory(id: string) {
    const entry = document.getElementById(`entry-${id}`)
    entry?.focus({preventScroll:true})
    entry?.scrollIntoView({block:"start"})
  }

  useEffect(() => {
    let frame = 0
    function follow() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const leaves = Array.from(journal.current?.querySelectorAll<HTMLElement>("[data-year]") ?? [])
        const line = window.innerHeight * .44
        const leaf = leaves.find(item => item.getBoundingClientRect().bottom > line) ?? leaves.at(-1)
        if (!leaf?.dataset.year) return
        setActive(leaf.dataset.year)
        const { top, height } = leaf.getBoundingClientRect()
        const progress = Math.min(1, Math.max(0, (line - top) / Math.max(1, height)))
        leaf.style.setProperty("--year-progress", String(progress))
      })
    }
    follow()
    window.addEventListener("scroll",follow,{passive:true})
    window.addEventListener("resize",follow)
    window.addEventListener("focusin",follow)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll",follow)
      window.removeEventListener("resize",follow)
      window.removeEventListener("focusin",follow)
    }
  }, [years.join("|")])

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
      if (records.some(record => [...record.addedNodes].some(node => node instanceof HTMLElement && (node.matches(".notebook-entry") || node.querySelector(".notebook-entry"))))) observePages()
    })
    if (container) changes.observe(container, { childList: true, subtree: true })
    return () => { observer.disconnect(); changes.disconnect() }
  }, [])

  return <div ref={journal}>
    <div className="year-bar">
    <nav ref={bookmarks} className="year-thread" aria-label="Jump to year">
      {years.map(year => <button key={year} aria-current={active === year ? "location" : undefined} onClick={() => document.getElementById(`year-${year}`)?.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"})}>{year}</button>)}
    </nav>
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
