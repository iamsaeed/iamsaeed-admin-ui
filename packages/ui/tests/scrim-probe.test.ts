import { describe, expect, it } from 'vitest'
import { SKINS, THEMES } from '../src/theme/config'
import { toHex } from './helpers/oklch'
import { resolveColor } from './helpers/resolveTokens'

/**
 * Palette snapshot.
 *
 * `contrast.test.ts` proves the palette is *accessible*; this proves it is
 * *stable*. Any edit to a token shows up here as a readable hex diff rather
 * than as a silent visual change nobody notices until it ships.
 *
 * When a change is intentional, run `vitest -u` and review the diff — the
 * point is that a human looks at it, not that it never moves.
 */
const ROLES = [
  '--lm-bg',
  '--lm-surface',
  '--lm-fg',
  '--lm-muted',
  '--lm-accent',
  '--lm-accent-hover',
  '--lm-accent-soft',
  '--lm-on-accent',
  '--lm-success',
  '--lm-warn',
  '--lm-danger',
  '--lm-info',
] as const

describe('palette snapshot', () => {
  it.each(THEMES)('%s', (theme) => {
    const table: Record<string, Record<string, string>> = {}
    for (const skin of SKINS) {
      table[skin] = Object.fromEntries(
        ROLES.map((r) => [r.replace('--lm-', ''), toHex(resolveColor(theme, skin, r))]),
      )
    }
    expect(table).toMatchSnapshot()
  })
})
