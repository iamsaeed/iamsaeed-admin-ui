import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLatestSearch } from '../src/composables/useLatestSearch'

/** Only the last search counts: one request per pause in typing, older ones aborted, late answers dropped. */

const later = (ms: number) => vi.advanceTimersByTimeAsync(ms)

/** A source whose every call can be answered by hand, in any order. */
function manualSource() {
  const calls: { text: string; signal: AbortSignal; answer: (v: string[]) => void; fail: (m: string) => void }[] = []
  const source = (text: string, signal: AbortSignal) =>
    new Promise<string[]>((resolve, reject) => {
      calls.push({ text, signal, answer: resolve, fail: (m) => reject(new Error(m)) })
    })
  return { calls, source }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useLatestSearch', () => {
  it('sends one search for a burst of typing, with the final text', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 200 })
    for (const t of ['a', 'ac', 'acm', 'acme']) { s.query(t); await later(50) }
    expect(calls).toHaveLength(0)
    await later(200)
    expect(calls.map((c) => c.text)).toEqual(['acme'])
    expect(s.loading.value).toBe(true)
    calls[0]!.answer(['Acme Ltd'])
    await later(0)
    expect(s.results.value).toEqual(['Acme Ltd'])
    expect(s.loading.value).toBe(false)
    expect(s.settled.value).toBe(true)
    expect(s.answeredFor.value).toBe('acme')
  })

  it('does not abort a search that already finished', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100 })
    s.query('ab'); await later(100)
    calls[0]!.answer(['done']); await later(0)
    s.query('abc'); await later(100)
    s.reset()
    expect(calls[0]!.signal.aborted).toBe(false)
    expect(calls[1]!.signal.aborted).toBe(true)   // the one still running is aborted as before
  })

  it('aborts the search in flight when a newer one starts', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100 })
    s.query('ab'); await later(100)
    expect(calls[0]!.signal.aborted).toBe(false)
    s.query('abc'); await later(100)
    expect(calls[0]!.signal.aborted).toBe(true)
    expect(calls[1]!.signal.aborted).toBe(false)
  })

  it('throws away a late answer from an older search, even if the source ignored the abort', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100 })
    s.query('ab'); await later(100)
    s.query('abc'); await later(100)
    calls[1]!.answer(['new'])
    await later(0)
    calls[0]!.answer(['OLD'])   // arrives last, belongs to the older search
    await later(0)
    expect(s.results.value).toEqual(['new'])
    expect(s.answeredFor.value).toBe('abc')
  })

  it('an old failure cannot show an error over newer results', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100 })
    s.query('ab'); await later(100)
    s.query('abc'); await later(100)
    calls[1]!.answer(['fine'])
    await later(0)
    calls[0]!.fail('boom')
    await later(0)
    expect(s.error.value).toBe('')
    expect(s.results.value).toEqual(['fine'])
  })

  it('reports a failure of the current search and clears the results', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100 })
    s.query('abc'); await later(100)
    calls[0]!.fail('Server busy')
    await later(0)
    expect(s.error.value).toBe('Server busy')
    expect(s.results.value).toEqual([])
    expect(s.loading.value).toBe(false)
    s.query('abcd'); await later(100)
    calls[1]!.answer(['ok']); await later(0)
    expect(s.error.value).toBe('')
  })

  it('does not search below the minimum length and clears the results', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100, minChars: 3 })
    s.query('ab'); await later(500)
    expect(calls).toHaveLength(0)
    expect(s.loading.value).toBe(false)
    s.query('abc'); await later(100)
    calls[0]!.answer(['hit']); await later(0)
    expect(s.results.value).toEqual(['hit'])
    s.query('a')
    expect(s.results.value).toEqual([])
    expect(s.settled.value).toBe(false)
  })

  it('shrinking the text back below the minimum cancels the pending search', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100, minChars: 2 })
    s.query('abc'); await later(100)
    s.query('a')
    expect(calls[0]!.signal.aborted).toBe(true)
    calls[0]!.answer(['late']); await later(0)
    expect(s.results.value).toEqual([])
  })

  it('reset drops everything pending', async () => {
    const { calls, source } = manualSource()
    const s = useLatestSearch(source, { delay: 100 })
    s.query('abc'); await later(100)
    s.reset()
    calls[0]!.answer(['late']); await later(0)
    expect(s.results.value).toEqual([])
    expect(s.loading.value).toBe(false)
    s.query('x'); s.reset(); await later(500)
    expect(calls).toHaveLength(1)
  })
})
