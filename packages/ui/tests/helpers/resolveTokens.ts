import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { oklchToRgb, type Rgb } from './oklch'

/**
 * Resolves the design system's tokens for a given (theme, skin), by parsing
 * the REAL `tokens.css` and `skins.css`.
 *
 * Reading the source of truth is the whole point: a test that restated the
 * token values in TypeScript would pass happily while the stylesheet drifted
 * underneath it, which is the exact failure this suite exists to catch.
 *
 * This is not a general CSS engine. It models the narrow, known structure of
 * those two files, and `assertParsedShape()` fails loudly if that structure
 * changes — so the suite can never quietly degrade into vacuous success.
 */

const dir = fileURLToPath(new URL('../../src/styles/', import.meta.url))

function read(file: string): string {
  return readFileSync(dir + file, 'utf8')
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Remove balanced @media blocks — an explicit data-theme never hits them. */
function stripAtRules(css: string): { css: string; removed: number } {
  let out = ''
  let i = 0
  let removed = 0
  while (i < css.length) {
    const at = css.indexOf('@media', i)
    if (at === -1) {
      out += css.slice(i)
      break
    }
    out += css.slice(i, at)
    let depth = 0
    let j = css.indexOf('{', at)
    if (j === -1) break
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    removed++
    i = j + 1
  }
  return { css: out, removed }
}

export interface Rule {
  selectors: string[]
  decls: Record<string, string>
  /** Source order across the concatenated files. */
  order: number
}

function parseRules(css: string, startOrder: number): Rule[] {
  const rules: Rule[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  let order = startOrder
  while ((m = re.exec(css))) {
    const selector = m[1]!.trim()
    if (!selector || selector.startsWith('@')) continue
    const decls: Record<string, string> = {}
    for (const part of m[2]!.split(';')) {
      const idx = part.indexOf(':')
      if (idx === -1) continue
      const prop = part.slice(0, idx).trim()
      const val = part.slice(idx + 1).trim()
      if (prop.startsWith('--')) decls[prop] = val
    }
    if (Object.keys(decls).length) {
      rules.push({ selectors: selector.split(',').map((s) => s.trim()), decls, order: order++ })
    }
  }
  return rules
}

/** Specificity of the selectors we actually use here (attributes + :root). */
function specificity(sel: string): number {
  const attrs = (sel.match(/\[[^\]]+\]/g) ?? []).length
  const pseudo = sel.includes(':root') ? 1 : 0
  return attrs + pseudo
}

function selectorMatches(sel: string, theme: string, skin: string): boolean {
  // Descendant combinator, e.g. "[data-theme='dark'] [data-skin='slate']" —
  // in our tests both attributes sit on the same <html>, but the rule is
  // authored to cover a nested skin too. Treat the compound parts as a set.
  const parts = sel.split(/\s+/).filter(Boolean)
  for (const part of parts) {
    if (part === ':root') continue
    if (part === '[data-skin]') continue // bare attribute — always present
    const t = part.match(/\[data-theme='([^']+)'\]/)
    if (t && t[1] !== theme) return false
    const s = part.match(/\[data-skin='([^']+)'\]/)
    if (s && s[1] !== skin) return false
    // Anything else (density/radius blocks) is not part of colour resolution.
    if (!t && !s && !/^\[data-(theme|skin)/.test(part) && /^\[data-/.test(part)) return false
  }
  return true
}

let cache: Rule[] | null = null

function allRules(): Rule[] {
  if (cache) return cache
  const tokens = stripAtRules(stripComments(read('tokens.css')))
  const skins = stripAtRules(stripComments(read('skins.css')))

  // The system-preference block must exist and must have been removed —
  // if it silently vanished from the stylesheet, that is itself a regression.
  if (tokens.removed < 1) {
    throw new Error('tokens.css: expected at least one @media block (prefers-color-scheme)')
  }

  const a = parseRules(tokens.css, 0)
  cache = [...a, ...parseRules(skins.css, a.length + 1000)]
  return cache
}

/** Cascade the custom properties for one (theme, skin) pair. */
function cascade(theme: string, skin: string): Record<string, string> {
  const matched = allRules()
    .map((r) => {
      const sels = r.selectors.filter((s) => selectorMatches(s, theme, skin))
      if (!sels.length) return null
      return { ...r, spec: Math.max(...sels.map(specificity)) }
    })
    .filter(Boolean) as (Rule & { spec: number })[]

  matched.sort((x, y) => x.spec - y.spec || x.order - y.order)

  const out: Record<string, string> = {}
  for (const r of matched) Object.assign(out, r.decls)
  return out
}

/** Recursively substitute var() references, exactly as computed-value time does. */
function resolveVar(value: string, vars: Record<string, string>, depth = 0): string {
  if (depth > 12) throw new Error(`var() recursion too deep: ${value}`)
  return value.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]*))?\)/g, (_, name: string, fallback?: string) => {
    const v = vars[name]
    if (v === undefined) {
      if (fallback !== undefined) return resolveVar(fallback, vars, depth + 1)
      throw new Error(`unresolved custom property: ${name}`)
    }
    return resolveVar(v, vars, depth + 1)
  })
}

/**
 * Evaluate the one calc() shape the tokens use: `calc(<num> * <num>)`, after
 * var() substitution. Deliberately not a general expression evaluator —
 * anything else should fail loudly rather than be silently mis-evaluated.
 */
function evalCalc(value: string): string {
  return value.replace(/calc\(([^()]*)\)/g, (whole, expr: string) => {
    const m = expr.trim().match(/^([\d.]+)\s*\*\s*([\d.]+)$/)
    if (!m) throw new Error(`unsupported calc() in tokens: ${whole}`)
    return String(Number(m[1]) * Number(m[2]))
  })
}

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/

export interface ResolvedColor extends Rgb {
  alpha: number
  raw: string
}

/** All `--lm-*` custom properties resolved to concrete values. */
export function resolveTokens(theme: string, skin: string): Record<string, string> {
  const vars = cascade(theme, skin)
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(vars)) out[k] = evalCalc(resolveVar(v, vars))
  return out
}

/** One token as an sRGB colour. Throws if it is not an oklch value. */
export function resolveColor(theme: string, skin: string, token: string): ResolvedColor {
  const all = resolveTokens(theme, skin)
  const raw = all[token]
  if (raw === undefined) throw new Error(`no such token: ${token} (theme=${theme} skin=${skin})`)
  const m = raw.replace(/\s+/g, ' ').trim().match(OKLCH)
  if (!m) throw new Error(`token ${token} is not a plain oklch value: "${raw}"`)
  const [L, C, H] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return { ...oklchToRgb(L, C, H), alpha: m[4] ? Number(m[4]) : 1, raw }
}

/** Raw L/C/H for a token — for gamut checks. */
export function resolveLch(theme: string, skin: string, token: string): [number, number, number] {
  const raw = resolveTokens(theme, skin)[token]!
  const m = raw.replace(/\s+/g, ' ').trim().match(OKLCH)!
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/**
 * Guard against the parser silently matching nothing. Every one of these must
 * resolve, or the suite is not testing what it claims to test.
 */
export function assertParsedShape(): void {
  const required = [
    '--lm-bg', '--lm-surface', '--lm-surface-2', '--lm-sunken',
    '--lm-fg', '--lm-muted', '--lm-subtle',
    '--lm-border', '--lm-border-strong',
    '--lm-accent', '--lm-accent-hover', '--lm-accent-soft', '--lm-accent-soft-2', '--lm-on-accent',
    '--lm-success', '--lm-warn', '--lm-danger', '--lm-info',
    '--lm-accent-h', '--lm-accent-l', '--lm-accent-c',
  ]
  const t = resolveTokens('light', 'violet')
  const missing = required.filter((k) => t[k] === undefined)
  if (missing.length) throw new Error(`resolver found no value for: ${missing.join(', ')}`)

  // The skin must actually change the hue, or the cascade model is wrong.
  if (resolveTokens('light', 'violet')['--lm-accent-h'] === resolveTokens('light', 'teal')['--lm-accent-h']) {
    throw new Error('resolver: data-skin is not being applied (violet and teal share a hue)')
  }
  // The theme must actually change the surface, likewise.
  if (resolveTokens('light', 'violet')['--lm-bg'] === resolveTokens('dark', 'violet')['--lm-bg']) {
    throw new Error('resolver: data-theme is not being applied (light and dark share a background)')
  }
}
