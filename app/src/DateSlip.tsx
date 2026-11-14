import { useEffect, useRef, useState, type FormEvent } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js"

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

export function DateSlip({date, calendar, apply, close, id}: {
  date: string
  calendar: string
  apply: (date: string) => void
  close: () => void
  id: string
}) {
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
  const [hasDate, setHasDate] = useState(Boolean(date))
  const [error, setError] = useState("")
  const validYear = Number(yearText) === year
  const months = mode === "persian" ? persianMonths : gregorianMonths
  const days = monthLength(year, month, mode)
  const firstDay = gregorianDate(inGregorian({year, month, day: 1}, mode)).getUTCDay()
  const offset = mode === "persian" ? (firstDay + 1) % 7 : firstDay

  useEffect(() => {
    const picker = dialog.current
    picker?.showModal()
    return () => picker?.close()
  }, [])

  function update(nextYear: number, nextMonth: number) {
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
    setDate(converted)
    setYearText(String(converted.year))
    setError("")
  }

  function dismiss() {
    dialog.current?.close()
    close()
  }

  function commit(value: string) {
    dialog.current?.close()
    apply(value)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!validYear || !hasDate) return
    commit(gregorianDate(inGregorian({year, month, day}, mode)).toISOString().slice(0, 10))
  }

  return <dialog ref={dialog} className="calendar-slip" id={id} aria-labelledby={id + "-heading"}
    onCancel={event => { event.preventDefault(); dismiss() }}
    onClick={event => { if (event.target === event.currentTarget) dismiss() }}>
    <form onSubmit={submit}>
      <div className="picker-heading">
        <h2 id={id + "-heading"}>Memory date</h2>
        <button className="icon-button" type="button" aria-label="Close date picker" onClick={dismiss}><X size={19}/></button>
      </div>
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
      <div className="calendar-days" dir={mode === "persian" ? "rtl" : "ltr"}>
        {weekdays[mode].map(label => <span key={label} aria-hidden="true">{label}</span>)}
        {Array.from({length: offset}, (_, index) => <span key={`space-${index}`} aria-hidden="true"/>)}
        {Array.from({length: days}, (_, index) => {
          const number = index + 1
          return <button type="button" key={number} aria-label={`Day ${number}`} aria-pressed={hasDate && day === number}
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
    </form>
  </dialog>
}
