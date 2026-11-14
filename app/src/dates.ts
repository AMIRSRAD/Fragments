import { toGregorian } from "jalaali-js"

export type Timing =
  | { kind: "month"; calendar: "gregory" | "persian"; year: number; month: number }
  | { kind: "year"; calendar: "gregory" | "persian"; year: number }
  | { kind: "around"; calendar: "gregory" | "persian"; year: number; season?: string }
  | { kind: "range"; end: string }

export const dateObject = (iso: string) => new Date(iso + "T00:00:00Z")

export function dateAnchor(year: number, month: number, calendar: string) {
  const {gy:y,gm:m,gd:d} = calendar === "persian"
    ? toGregorian(year,month,1)
    : {gy:year,gm:month,gd:1}
  return [String(y).padStart(4,"0"), String(m).padStart(2,"0"), String(d).padStart(2,"0")].join("-")
}

export function dateLabel(date: string, timing: Timing | undefined, exact: Intl.DateTimeFormat) {
  if (!date) return "Undated"
  if (!timing) return exact.format(dateObject(date))
  if (timing.kind === "range") return exact.formatRange(dateObject(date),dateObject(timing.end))
  if (timing.kind === "around") return timing.season ? `${timing.season} ${timing.year}` : `Around ${timing.year}`
  if (timing.kind === "year") return String(timing.year)
  return new Intl.DateTimeFormat("en", {
    calendar:timing.calendar, month:"long", year:"numeric", timeZone:"UTC",
  }).format(dateObject(date))
}

export function yearBounds(year: number, calendar: string) {
  if (calendar === "persian" && (year < -60 || year > 3176)) return null
  return [dateAnchor(year,1,calendar), year === 9999 ? "9999-12-32" : dateAnchor(year+1,1,calendar)]
}

export function dateEnd(date: string, timing?: Timing) {
  if (!timing) return date
  if (timing.kind === "range") return timing.end
  const nextMonth = timing.kind === "month" ? timing.month % 12 + 1 : 1
  const nextYear = timing.year + Number(timing.kind !== "month" || nextMonth === 1)
  if (nextYear === 10000) return "9999-12-31"
  const end = dateObject(dateAnchor(nextYear,nextMonth,timing.calendar))
  end.setUTCDate(end.getUTCDate()-1)
  return end.toISOString().slice(0,10)
}

