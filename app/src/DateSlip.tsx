import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js"

import { FlexibleDate } from "./FlexibleDate"
import type { Timing } from "./dates"

type Calendar = "gregory" | "persian"
type DateParts = { year: number; month: number; day: number }

const persianMonths = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"]
const gregorianMonths = Array.from({length: 12}, (_, month) =>
  new Intl.DateTimeFormat("en", {month: "long", timeZone: "UTC"}).format(new Date(Date.UTC(2024, month, 1))))
const weekdays = {
  gregory: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  persian: ["ش","ی","د","س","چ","پ","ج"],
}
const digits = new Intl.NumberFormat("fa", {useGrouping: false})
const ascii = (value: string) => value.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) & 15))

function gregorianDate({year, month, day}: DateParts) {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return date
}

function inGregorian(date: DateParts, calendar: Calendar): DateParts {
  if (calendar === "gregory") return date
  const {gy, gm, gd} = toGregorian(date.year, date.month, date.day)
  return {year: gy, month: gm, day: gd}
}

function inPersian({year, month, day}: DateParts): DateParts {
  const {jy, jm, jd} = toJalaali(year, month, day)
  return {year: jy, month: jm, day: jd}
}

function yearInRange(year: number, calendar: Calendar) {
  return Number.isInteger(year) && (calendar === "persian" ? year >= 1178 && year <= 1579 : year >= 1 && year <= 9999)
}

function monthLength(year: number, month: number, calendar: Calendar) {
  return calendar === "persian" ? jalaaliMonthLength(year, month) : gregorianDate({year, month: month + 1, day: 0}).getUTCDate()
}

export function DateSlip({date, timing, calendar, apply, close, id}: {
  date: string
  calendar: string
  timing?: Timing
  apply: (date: string, timing?: Timing) => void
  close: () => void
  id: string
}) {
  const [flexible,setFlexible] = useState(Boolean(timing))
  const dialog = useRef<HTMLDialogElement>(null)
  const [initial] = useState(() => {
    const now = new Date()
    const [year, month, day] = date ? date.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    const gregorian = {year, month, day}
    if (calendar === "persian" && year >= 1799 && year <= 2201) {
      const persian = inPersian(gregorian)
      if (yearInRange(persian.year, "persian")) return {mode: "persian" as const, date: persian}
    }
    return {mode: "gregory" as const, date: gregorian}
  })
  const [mode, setMode] = useState<Calendar>(initial.mode)
  const [{year, month, day}, setDate] = useState(initial.date)
  const [yearText, setYearText] = useState(String(year))
  const [hasDate, setHasDate] = useState(Boolean(date && !timing))
  const [error, setError] = useState("")
  const grid = useRef<HTMLDivElement>(null)
  const nextFocus = useRef<number | null>(null)
  const [focusedDay, setFocusedDay] = useState<number | null>(null)
  const validYear = Number(yearText) === year
  const months = mode === "persian" ? persianMonths : gregorianMonths
  const days = monthLength(year, month, mode)
  const firstDay = gregorianDate(inGregorian({year, month, day: 1}, mode)).getUTCDay()
  const offset = mode === "persian" ? (firstDay + 1) % 7 : firstDay
  const tabDay = Math.min(focusedDay ?? day, days)

  useLayoutEffect(() => {
    if (nextFocus.current === null) return
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${nextFocus.current}"]`)?.focus()
    nextFocus.current = null
  }, [year, month])

  useEffect(() => {
    const picker = dialog.current
    picker?.showModal()
    return () => picker?.close()
  }, [])

  function update(nextYear: number, nextMonth: number) {
    setFocusedDay(null)
    setDate({year: nextYear, month: nextMonth, day: Math.min(day, monthLength(nextYear, nextMonth, mode))})
    setYearText(String(nextYear))
    setError("")
  }

  function adjacent(delta: number) {
    const next = month + delta
    return {year: year + (next === 0 ? -1 : next === 13 ? 1 : 0), month: (next + 11) % 12 + 1}
  }

  function move(delta: number) {
    const next = adjacent(delta)
    update(next.year, next.month)
  }

  function switchCalendar(next: Calendar) {
    const displayed = {year, month, day}
    if (next === "persian" && (year < 1799 || year > 2201 || !yearInRange(inPersian(displayed).year, next))) {
      setError("This date is outside the supported Persian calendar range.")
      return
    }
    const converted = next === "persian" ? inPersian(displayed) : inGregorian(displayed, mode)
    setMode(next)
    setFocusedDay(null)
    setDate(converted)
    setYearText(String(converted.year))
    setError("")
  }

  function dismiss() {
    dialog.current?.close()
    close()
  }

  function commit(value: string, timing?: Timing) {
    dialog.current?.close()
    apply(value,timing)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (flexible || !validYear || !hasDate) return
    commit(gregorianDate(inGregorian({year, month, day}, mode)).toISOString().slice(0, 10))
  }

  function navigateDays(event: KeyboardEvent<HTMLDivElement>) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-day]")
    if (!button || event.altKey || event.ctrlKey || event.metaKey || !validYear) return
    const current = Number(button.dataset.day)
    const direction = mode === "persian" ? -1 : 1
    const destinations: Record<string, number> = {
      ArrowLeft: current - direction,
      ArrowRight: current + direction,
      ArrowUp: current - 7,
      ArrowDown: current + 7,
      Home: 1,
      End: days,
    }
    const target = destinations[event.key]
    if (target === undefined) return
    event.preventDefault()
    if (target >= 1 && target <= days) {
      grid.current?.querySelector<HTMLButtonElement>(`[data-day="${target}"]`)?.focus()
      return
    }
    const next = adjacent(target < 1 ? -1 : 1)
    if (!yearInRange(next.year, mode)) return
    nextFocus.current = target < 1 ? monthLength(next.year, next.month, mode) + target : target - days
    update(next.year, next.month)
    setHasDate(false)
  }

  return <dialog ref={dialog} className="calendar-slip" id={id} aria-labelledby={id + "-heading"}
    onCancel={event => { event.preventDefault(); dismiss() }}
    onClick={event => { if (event.target === event.currentTarget) dismiss() }}>
    <form onSubmit={submit}>
      <div className="picker-heading">
        <h2 id={id + "-heading"}>Memory date</h2>
        <button className="icon-button" type="button" aria-label="Close date picker" onClick={dismiss}><X size={19}/></button>
      </div>
      <button className="write-line" type="button" onClick={()=>setFlexible(!flexible)}>{flexible ? "Choose an exact day" : "Month, year, or approximate date"}</button>
      {flexible ? <FlexibleDate date={date} timing={timing} calendar={calendar} apply={commit}/> : <>
      <label className="picker-calendar">Calendar
        <select autoFocus value={mode} disabled={!validYear} onChange={event => switchCalendar(event.target.value as Calendar)}>
          <option value="gregory">Gregorian</option><option value="persian">Persian</option>
        </select>
      </label>
      <div className="calendar-month">
        <button type="button" aria-label="Previous month" disabled={!yearInRange(adjacent(-1).year, mode)} onClick={() => move(-1)}><ChevronLeft size={18}/></button>
        <select aria-label="Month" lang={mode === "persian" ? "fa" : "en"} value={month} onChange={event => update(year, Number(event.target.value))}>
          {months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
        </select>
        <input aria-label="Year" aria-invalid={!validYear} inputMode="numeric" maxLength={4} value={yearText} onChange={event => {
          const value = ascii(event.target.value)
          setYearText(value)
          setError("")
          const next = Number(value)
          if (/^\d{1,4}$/.test(value) && yearInRange(next, mode)) {
            setDate({year: next, month, day: Math.min(day, monthLength(next, month, mode))})
          }
        }}/>
        <button type="button" aria-label="Next month" disabled={!yearInRange(adjacent(1).year, mode)} onClick={() => move(1)}><ChevronRight size={18}/></button>
      </div>
      <div ref={grid} className="calendar-days" role="group" aria-label="Days of the month" dir={mode === "persian" ? "rtl" : "ltr"} onKeyDown={navigateDays}>
        {weekdays[mode].map(label => <span key={label} aria-hidden="true">{label}</span>)}
        {Array.from({length: offset}, (_, index) => <span key={`space-${index}`} aria-hidden="true"/>)}
        {Array.from({length: days}, (_, index) => {
          const number = index + 1
          return <button type="button" key={number} data-day={number} tabIndex={number === tabDay ? 0 : -1}
            aria-label={`Day ${number}`} aria-pressed={hasDate && day === number}
            onFocus={() => setFocusedDay(number)}
            onClick={() => { setDate({year, month, day: number}); setHasDate(true) }}>
            {mode === "persian" ? digits.format(number) : number}
          </button>
        })}
      </div>
      {(error || !validYear) && <p className="picker-error" role="alert">{error || (mode === "persian" ? "Enter a year from 1178 to 1579." : "Enter a year from 1 to 9999.")}</p>}
      <div className="slip-actions">
        <button className="write-line" type="button" disabled={!date} onClick={() => commit("")}>Clear date</button>
        <button className="primary-action" type="submit" disabled={!validYear || !hasDate}>Apply date</button>
      </div>
      </>}
    </form>
  </dialog>
}
