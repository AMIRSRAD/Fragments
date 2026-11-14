import { useState } from "react"
import { toJalaali } from "jalaali-js"
import { dateAnchor, type Timing } from "./dates"

export function FlexibleDate({date, timing, calendar, apply}: {
  date: string; timing?: Timing; calendar: string; apply: (date: string, timing?: Timing) => void
}) {
  const [kind,setKind] = useState<Timing["kind"]>(timing?.kind ?? "month")
  const [mode,setMode] = useState<"gregory" | "persian">(timing && "calendar" in timing ? timing.calendar : calendar === "persian" ? "persian" : "gregory")
  const [initial] = useState(() => {
    if (timing && "year" in timing) return { year:String(timing.year), month:timing.kind === "month" ? timing.month : 1 }
    const [y,m,d] = date.split("-").map(Number)
    if (mode === "gregory") return {year:date.slice(0,4),month:m || 1}
    if (y < 1799 || y > 2201) return {year:"",month:1}
    const {jy,jm} = toJalaali(y,m,d)
    return jy >= 1178 && jy <= 1579 ? {year:String(jy),month:jm} : {year:"",month:1}
  })
  const [year,setYear] = useState(initial.year)
  const [month,setMonth] = useState(initial.month)
  const [season,setSeason] = useState(timing?.kind === "around" ? timing.season ?? "" : "")
  const [start,setStart] = useState(date)
  const [end,setEnd] = useState(timing?.kind === "range" ? timing.end : "")
  const number = Number(year.replace(/[۰-۹٠-٩]/g,digit=>String(digit.charCodeAt(0)&15)))
  const low = mode === "persian" ? 1178 : 1
  const high = mode === "persian" ? 1579 : 9999
  const valid = kind === "range" ? !!start && !!end && start <= end && start.length === 10 && end.length === 10 :
    Number.isInteger(number) && number >= low && number <= high
  const months = mode === "persian"
    ? ["Farvardin","Ordibehesht","Khordad","Tir","Mordad","Shahrivar","Mehr","Aban","Azar","Dey","Bahman","Esfand"]
    : Array.from({length:12},(_,index)=>new Intl.DateTimeFormat("en",{month:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2024,index,1))))

  function commit() {
    if (!valid) return
    if (kind === "range") apply(start,{kind,end})
    else if (kind === "month") apply(dateAnchor(number,month,mode),{kind,calendar:mode,year:number,month})
    else if (kind === "year") apply(dateAnchor(number,1,mode),{kind,calendar:mode,year:number})
    else apply(dateAnchor(number,1,mode),{kind,calendar:mode,year:number,season:season || undefined})
  }

  return <div className="flexible-date">
    <label>Date precision<select value={kind} onChange={event=>setKind(event.target.value as Timing["kind"])}>
      <option value="month">Month and year</option><option value="year">Year only</option>
      <option value="around">Approximate year or season</option><option value="range">Date range</option>
    </select></label>
    {kind === "range" ? <>
      <p>Enter the start and end in the Gregorian calendar.</p>
      <label>Start date<input type="date" max="9999-12-31" value={start} onChange={event=>setStart(event.target.value)}/></label>
      <label>End date<input type="date" min={start || undefined} max="9999-12-31" value={end} onChange={event=>setEnd(event.target.value)}/></label>
    </> : <>
      <label>Calendar<select value={mode} onChange={event=>{setMode(event.target.value === "persian" ? "persian" : "gregory");setYear("")}}>
        <option value="gregory">Gregorian</option><option value="persian">Persian</option>
      </select></label>
      <label>Year<input inputMode="numeric" value={year} maxLength={4} placeholder={`${low}–${high}`} onChange={event=>setYear(event.target.value)}/></label>
      {kind === "month" && <label>Month<select value={month} onChange={event=>setMonth(Number(event.target.value))}>
        {months.map((name,index)=><option key={name} value={index+1}>{name}</option>)}
      </select></label>}
      {kind === "around" && <label>Season<select value={season} onChange={event=>setSeason(event.target.value)}>
        <option value="">Around this year</option>{["Spring","Summer","Autumn","Winter"].map(value=><option key={value}>{value}</option>)}
      </select></label>}
    </>}
    <div className="slip-actions"><button type="button" className="write-line" onClick={()=>apply("")}>Clear date</button>
      <button type="button" className="primary-action" disabled={!valid} onClick={commit}>Apply date</button></div>
  </div>
}
