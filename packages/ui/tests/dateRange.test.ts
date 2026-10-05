import { describe, expect, it } from 'vitest'
import {
  addMonths,
  dateOrderFor,
  defaultDatePresets,
  fiscalYearStart,
  formatRangeLabel,
  formatSpan,
  formatTyped,
  isIsoDay,
  matchPreset,
  monthMatrix,
  parseTyped,
  relativeRange,
  spanDays,
  todayIn,
} from '../src/utils/dateRange'

/**
 * The date maths behind DateRangePicker. Every value is a calendar day string, so these pin the
 * edges that a `Date`-based version gets wrong: month ends, leap days, the UTC-midnight trap, and
 * typed dates that roll over instead of failing.
 */

const TODAY = '2026-10-05'
const presets = defaultDatePresets()
const range = (key: string) => presets.find((p) => p.key === key)!.range(TODAY)

describe('day arithmetic', () => {
  it('clamps a month step to the end of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
  })

  it('counts both ends of a span', () => {
    expect(spanDays('2026-09-17', '2026-09-17')).toBe(1)
    expect(spanDays('2026-09-17', '2026-09-26')).toBe(10)
    expect(spanDays('2024-02-28', '2024-03-01')).toBe(3)
  })

  it('accepts only real YYYY-MM-DD days', () => {
    expect(isIsoDay('2026-02-28')).toBe(true)
    expect(isIsoDay('2026-02-30')).toBe(false)
    expect(isIsoDay('26-02-2026')).toBe(false)
    expect(isIsoDay(null)).toBe(false)
  })

  it('names today in the zone asked for, not in UTC', () => {
    // 20:00 UTC on the 4th is 01:30 on the 5th in India.
    const late = new Date(Date.UTC(2026, 9, 4, 20, 0))
    expect(todayIn('Asia/Kolkata', late)).toBe('2026-10-05')
    expect(todayIn('UTC', late)).toBe('2026-10-04')
  })
})

describe('monthMatrix', () => {
  it('pads to whole weeks from the chosen first weekday', () => {
    // 1 September 2026 is a Tuesday.
    const monday = monthMatrix(2026, 8, 1)
    expect(monday[0]).toEqual([null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'])
    const sunday = monthMatrix(2026, 8, 0)
    expect(sunday[0].slice(0, 3)).toEqual([null, null, '2026-09-01'])
    const saturday = monthMatrix(2026, 8, 6)
    expect(saturday[0].slice(0, 4)).toEqual([null, null, null, '2026-09-01'])
  })

  it('every row has seven cells and every day appears once', () => {
    const weeks = monthMatrix(2024, 1, 1)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks.flat().filter(Boolean)).toHaveLength(29)
  })
})

describe('presets', () => {
  it('covers the year-scale ranges, financial year from April', () => {
    expect(range('last7')).toEqual({ from: '2026-09-29', to: TODAY })
    expect(range('last_month')).toEqual({ from: '2026-09-01', to: '2026-09-30' })
    expect(range('this_year')).toEqual({ from: '2026-01-01', to: TODAY })
    expect(range('last_year')).toEqual({ from: '2025-01-01', to: '2025-12-31' })
    expect(range('this_fy')).toEqual({ from: '2026-04-01', to: TODAY })
    expect(range('last_fy')).toEqual({ from: '2025-04-01', to: '2026-03-31' })
  })

  it('puts January to March in the financial year that started the April before', () => {
    expect(fiscalYearStart('2026-02-10', 4)).toBe('2025-04-01')
    expect(fiscalYearStart('2026-07-01', 7)).toBe('2026-07-01')
    expect(fiscalYearStart('2026-06-30', 7)).toBe('2025-07-01')
  })

  it('recognises a preset from its two days, and nothing else', () => {
    expect(matchPreset({ from: '2026-09-29', to: TODAY }, presets, TODAY)?.key).toBe('last7')
    expect(matchPreset({ from: '2026-09-28', to: TODAY }, presets, TODAY)).toBeNull()
    expect(matchPreset({ from: '2026-09-29', to: '' }, presets, TODAY)).toBeNull()
  })

  it('reads "last N units" as ending today, inclusive', () => {
    expect(relativeRange(1, 'days', TODAY)).toEqual({ from: TODAY, to: TODAY })
    expect(relativeRange(2, 'weeks', TODAY)).toEqual({ from: '2026-09-22', to: TODAY })
    expect(relativeRange(1, 'months', TODAY)).toEqual({ from: '2026-09-06', to: TODAY })
    expect(relativeRange(10, 'years', TODAY)).toEqual({ from: '2016-10-06', to: TODAY })
  })
})

describe('typed dates', () => {
  it('takes the order from the locale', () => {
    expect(dateOrderFor('en-IN')).toBe('DMY')
    expect(dateOrderFor('en-GB')).toBe('DMY')
    expect(dateOrderFor('en-US')).toBe('MDY')
  })

  it('reads loose separators and one-digit parts', () => {
    expect(parseTyped('5/10/2006', 'DMY')).toBe('2006-10-05')
    expect(parseTyped('05-10-2006', 'DMY')).toBe('2006-10-05')
    expect(parseTyped('05.10.2006', 'DMY')).toBe('2006-10-05')
    expect(parseTyped('10/5/2006', 'MDY')).toBe('2006-10-05')
    expect(parseTyped('2006-10-05', 'YMD')).toBe('2006-10-05')
  })

  it('rejects a day that does not exist rather than rolling it over', () => {
    expect(parseTyped('31/02/2020', 'DMY')).toBeNull()
    expect(parseTyped('29/02/2023', 'DMY')).toBeNull()
    expect(parseTyped('29/02/2024', 'DMY')).toBe('2024-02-29')
    expect(parseTyped('05/10/06', 'DMY')).toBeNull()
    expect(parseTyped('soon', 'DMY')).toBeNull()
  })

  it('round-trips through its own format', () => {
    for (const order of ['DMY', 'MDY', 'YMD'] as const) {
      expect(parseTyped(formatTyped('2026-09-17', order), order)).toBe('2026-09-17')
    }
  })
})

describe('labels', () => {
  const opts = { locale: 'en-GB', presets, today: TODAY }

  it('names a preset, an open end, or the span', () => {
    expect(formatRangeLabel({ from: '', to: '' }, opts)).toBe('Any date')
    expect(formatRangeLabel({ from: '2026-09-29', to: TODAY }, opts)).toBe('Last 7 days')
    expect(formatRangeLabel({ from: '2026-10-01', to: '' }, opts)).toBe('From 1 Oct 2026')
    expect(formatRangeLabel({ from: '', to: '2026-09-30' }, opts)).toBe('Until 30 Sept 2026')
    expect(formatRangeLabel({ from: '2026-09-17', to: '2026-09-17' }, opts)).toBe('17 Sept 2026')
    expect(formatRangeLabel({ from: '2026-09-17', to: '2026-09-26' }, opts)).toMatch(/^17\s?–\s?26 Sept 2026$/)
  })

  it('says how long a span is, in years past a year', () => {
    expect(formatSpan('2026-09-17', '2026-09-17', 'en-IN')).toBe('1 day')
    expect(formatSpan('2026-09-17', '2026-09-26', 'en-IN')).toBe('10 days')
    expect(formatSpan('2006-10-05', '2016-10-05', 'en-IN')).toBe('3,654 days · 10.0 years')
  })
})
