/**
 * Calendar-day maths for `DateRangePicker`, with no date library.
 *
 * Every value is a `YYYY-MM-DD` string — a CALENDAR DAY, not an instant. That is what list
 * endpoints take and what URL state stores, and it has no timezone to get wrong. The one place an
 * instant becomes a day is `todayIn()`, which asks `Intl` for the date in a named zone; everything
 * else builds dates from local parts and never calls `toISOString()` (which is UTC, so before
 * 05:30 in India it names yesterday).
 *
 * Exported because a consumer filtering on the server needs the same rules — what "Last 7 days"
 * covers, how a typed date is read — and a second copy is how the two drift apart.
 */

export type IsoDay = string

export interface DateRange {
  from: IsoDay | ''
  to: IsoDay | ''
}

export interface DatePreset {
  key: string
  label: string
  /** The range this preset stands for, given today. Both ends inclusive. */
  range: (today: IsoDay) => { from: IsoDay; to: IsoDay }
}

export type RelativeUnit = 'days' | 'weeks' | 'months' | 'years'

/** Day, month and year order for typed dates. */
export type DateOrder = 'DMY' | 'MDY' | 'YMD'

const pad = (n: number) => String(n).padStart(2, '0')

/** `YYYY-MM-DD` for a year, zero-based month and day — overflow rolls over, as `Date` does. */
export function isoDay(year: number, month: number, day: number): IsoDay {
  const d = new Date(year, month, day)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** A local `Date` at midnight for a day. */
export function toDate(day: IsoDay): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fromDate(date: Date): IsoDay {
  return isoDay(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isIsoDay(value: unknown): value is IsoDay {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return fromDate(toDate(value)) === value
}

export function addDays(day: IsoDay, n: number): IsoDay {
  const d = toDate(day)
  return isoDay(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** Same day of the month `n` months on, clamped to the month's last day (31 Jan + 1 = 28/29 Feb). */
export function addMonths(day: IsoDay, n: number): IsoDay {
  const d = toDate(day)
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return isoDay(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last))
}

/** Inclusive length of a range in days: the same day twice is 1. */
export function spanDays(from: IsoDay, to: IsoDay): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000) + 1
}

export function startOfMonth(day: IsoDay): IsoDay {
  return day.slice(0, 8) + '01'
}

export function endOfMonth(day: IsoDay): IsoDay {
  const d = toDate(day)
  return isoDay(d.getFullYear(), d.getMonth() + 1, 0)
}

/**
 * Today in a named timezone, as a calendar day.
 *
 * `undefined` means the browser's own zone. A system whose records are kept for one place (a post
 * in India read from a laptop set to UTC) passes that place's zone, so "Today" means the same day
 * to everyone looking at the same records.
 */
export function todayIn(timeZone?: string, now: Date = new Date()): IsoDay {
  if (!timeZone) return fromDate(now)
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * The weeks of a month as rows of seven, `null` for the padding days of the months either side.
 * `weekStartsOn`: 0 Sunday … 6 Saturday.
 */
export function monthMatrix(year: number, month: number, weekStartsOn = 1): (IsoDay | null)[][] {
  const lead = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7
  const count = new Date(year, month + 1, 0).getDate()
  const cells: (IsoDay | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= count; d++) cells.push(isoDay(year, month, d))
  while (cells.length % 7) cells.push(null)

  const weeks: (IsoDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** Short weekday names in display order, from the locale. */
export function weekdayNames(locale: string, weekStartsOn = 1, style: 'narrow' | 'short' | 'long' = 'short'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: style })
  // 2023-01-01 was a Sunday, so day i of that week is weekday i.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + ((i + weekStartsOn) % 7))))
}

export function monthNames(locale: string, style: 'short' | 'long' = 'long'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: style })
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2023, m, 1)))
}

/* ── presets ─────────────────────────────────────────────────────────────── */

/** The start of the financial year containing `day`. `startMonth` is 1-based (4 = April). */
export function fiscalYearStart(day: IsoDay, startMonth = 4): IsoDay {
  const d = toDate(day)
  const year = d.getMonth() + 1 >= startMonth ? d.getFullYear() : d.getFullYear() - 1
  return isoDay(year, startMonth - 1, 1)
}

/**
 * The default quick ranges. A factory because the financial year depends on where the product is
 * used — April in India, July in Australia, January for most of the rest.
 */
export function defaultDatePresets(options: { fiscalYearStart?: number } = {}): DatePreset[] {
  const fy = options.fiscalYearStart ?? 4
  return [
    { key: 'today', label: 'Today', range: (t) => ({ from: t, to: t }) },
    { key: 'yesterday', label: 'Yesterday', range: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
    { key: 'last7', label: 'Last 7 days', range: (t) => ({ from: addDays(t, -6), to: t }) },
    { key: 'last30', label: 'Last 30 days', range: (t) => ({ from: addDays(t, -29), to: t }) },
    { key: 'this_month', label: 'This month', range: (t) => ({ from: startOfMonth(t), to: t }) },
    {
      key: 'last_month',
      label: 'Last month',
      range: (t) => {
        const prev = addMonths(startOfMonth(t), -1)
        return { from: prev, to: endOfMonth(prev) }
      },
    },
    { key: 'this_year', label: 'This year', range: (t) => ({ from: `${t.slice(0, 4)}-01-01`, to: t }) },
    {
      key: 'last_year',
      label: 'Last year',
      range: (t) => {
        const y = Number(t.slice(0, 4)) - 1
        return { from: `${y}-01-01`, to: `${y}-12-31` }
      },
    },
    { key: 'this_fy', label: 'This financial year', range: (t) => ({ from: fiscalYearStart(t, fy), to: t }) },
    {
      key: 'last_fy',
      label: 'Last financial year',
      range: (t) => {
        const start = fiscalYearStart(t, fy)
        return { from: addMonths(start, -12), to: addDays(start, -1) }
      },
    },
  ]
}

/** Which preset a range is, so a range restored from a URL shows "Last 7 days", not two dates. */
export function matchPreset(range: DateRange, presets: DatePreset[], today: IsoDay): DatePreset | null {
  if (!range.from || !range.to) return null
  return presets.find((p) => {
    const r = p.range(today)
    return r.from === range.from && r.to === range.to
  }) ?? null
}

/**
 * "Last N units", ending today, inclusive. Last 1 day is today; last 1 month is the day after this
 * date last month through today, so consecutive "last month" ranges tile without overlap.
 */
export function relativeRange(n: number, unit: RelativeUnit, today: IsoDay): { from: IsoDay; to: IsoDay } {
  const count = Math.max(1, Math.floor(n))
  switch (unit) {
    case 'days':
      return { from: addDays(today, -(count - 1)), to: today }
    case 'weeks':
      return { from: addDays(today, -(7 * count - 1)), to: today }
    case 'months':
      return { from: addDays(addMonths(today, -count), 1), to: today }
    case 'years':
      return { from: addDays(addMonths(today, -12 * count), 1), to: today }
  }
}

/* ── typed dates ─────────────────────────────────────────────────────────── */

/** The typed-date order a locale expects: en-US is MDY, en-IN and en-GB are DMY, sv and ja YMD. */
export function dateOrderFor(locale: string): DateOrder {
  const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(2023, 10, 22))
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.type[0].toUpperCase())
    .join('')
  return parts === 'MDY' || parts === 'YMD' ? parts : 'DMY'
}

export function typedPlaceholder(order: DateOrder): string {
  return { DMY: 'DD/MM/YYYY', MDY: 'MM/DD/YYYY', YMD: 'YYYY-MM-DD' }[order]
}

export function formatTyped(day: IsoDay | '', order: DateOrder): string {
  if (!day) return ''
  const [y, m, d] = day.split('-')
  if (order === 'YMD') return `${y}-${m}-${d}`
  return order === 'MDY' ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
}

/**
 * Read a typed date, or `null` if it is not a real day. Accepts `/`, `-` or `.` between parts and
 * one-digit days and months; rejects 31/02 rather than rolling it into March.
 */
export function parseTyped(value: string, order: DateOrder): IsoDay | null {
  const parts = value.trim().split(/[/.\-\s]+/)
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) return null

  const [a, b, c] = parts.map(Number)
  const [y, m, d] = order === 'YMD' ? [a, b, c] : order === 'MDY' ? [c, a, b] : [c, b, a]
  if (String(y).length !== 4) return null

  const day = isoDay(y, m - 1, d)
  return day === `${y}-${pad(m)}-${pad(d)}` ? day : null
}

/* ── labels ──────────────────────────────────────────────────────────────── */

export function formatDay(day: IsoDay, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(toDate(day))
}

/** "Tuesday 17 September 2026" — the accessible name of a day cell. */
export function formatDayLong(day: IsoDay, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(toDate(day))
}

/**
 * The trigger's text: a preset's name, an open end ("From 1 Oct 2026"), or the span with the shared
 * parts named once ("17 – 26 Sep 2026", "28 Sep – 4 Oct 2026").
 */
export function formatRangeLabel(
  range: DateRange,
  options: { locale: string; presets?: DatePreset[]; today: IsoDay; placeholder?: string },
): string {
  const { from, to } = range
  if (!from && !to) return options.placeholder ?? 'Any date'

  const preset = options.presets ? matchPreset(range, options.presets, options.today) : null
  if (preset) return preset.label

  if (from && !to) return `From ${formatDay(from, options.locale)}`
  if (!from && to) return `Until ${formatDay(to, options.locale)}`
  if (from === to) return formatDay(from as IsoDay, options.locale)

  const fmt = new Intl.DateTimeFormat(options.locale, { day: 'numeric', month: 'short', year: 'numeric' })
  // formatRange collapses the shared month and year where the locale allows it.
  return fmt.formatRange(toDate(from as IsoDay), toDate(to as IsoDay))
}

/** "10 days", and past a year "3,654 days · 10.0 years". */
export function formatSpan(from: IsoDay, to: IsoDay, locale: string): string {
  const days = spanDays(from, to)
  if (days === 1) return '1 day'
  const n = new Intl.NumberFormat(locale).format(days)
  return days < 365 ? `${n} days` : `${n} days · ${(days / 365.25).toFixed(1)} years`
}
