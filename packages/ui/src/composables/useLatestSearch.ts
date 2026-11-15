import { getCurrentInstance, onBeforeUnmount, ref, type Ref } from 'vue'

/**
 * Search-as-you-type where ONLY THE LAST SEARCH COUNTS.
 *
 * Every keystroke restarts a short wait; only when typing pauses does one request go out. If a
 * request is still in flight when a newer one starts, it is aborted (the `signal` is handed to the
 * source so a `fetch` can really stop), and even if the source ignores the signal, a late answer
 * from an older search is thrown away — it can never overwrite the results of a newer one.
 *
 * The source decides what a search is (an API call, a filter over a list) and gets the text plus an
 * AbortSignal. Nothing here knows about the page: state is returned as refs for a component to show.
 */

export interface LatestSearchOptions {
  /** Wait after the last keystroke before searching, in ms. */
  delay?: number
  /** Fewer characters than this clears the results and does not search. */
  minChars?: number
}

export interface LatestSearch<T> {
  results: Ref<T[]>
  /** A search is waiting to start or is running. */
  loading: Ref<boolean>
  /** The last finished search failed (never set by an aborted one). */
  error: Ref<string>
  /** The results on show answer the current text (false while typing, or before any search). */
  settled: Ref<boolean>
  /** The text the results on show were searched for. */
  answeredFor: Ref<string>
  /** Call on every change of the text. */
  query: (text: string) => void
  /** Drop everything pending and clear the results. */
  reset: () => void
}

export function useLatestSearch<T>(
  source: (text: string, signal: AbortSignal) => Promise<T[]>,
  options: LatestSearchOptions = {},
): LatestSearch<T> {
  const delay = options.delay ?? 250
  const minChars = options.minChars ?? 1

  const results = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref('')
  const settled = ref(false)
  const answeredFor = ref('')

  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let latest = 0

  function stop(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    controller?.abort()
    controller = undefined
  }

  async function run(text: string, id: number): Promise<void> {
    controller = new AbortController()
    const { signal } = controller
    try {
      const found = await source(text, signal)
      if (id !== latest) return // a newer search started while this one was away
      results.value = found
      answeredFor.value = text
      settled.value = true
      error.value = ''
    } catch (e) {
      if (id !== latest || signal.aborted) return
      error.value = e instanceof Error && e.message ? e.message : 'The search failed.'
      results.value = []
      settled.value = true
    } finally {
      if (id === latest) {
        loading.value = false
        controller = undefined   // finished: nothing left to abort, so a later search must not signal it
      }
    }
  }

  function query(text: string): void {
    stop()
    const id = ++latest
    settled.value = false
    if (text.trim().length < minChars) {
      results.value = []
      error.value = ''
      loading.value = false
      return
    }
    loading.value = true
    timer = setTimeout(() => void run(text.trim(), id), delay)
  }

  function reset(): void {
    stop()
    latest++
    results.value = []
    error.value = ''
    loading.value = false
    settled.value = false
    answeredFor.value = ''
  }

  if (getCurrentInstance()) onBeforeUnmount(stop)   // a component leaving must not leave a search running

  return { results, loading, error, settled, answeredFor, query, reset }
}
