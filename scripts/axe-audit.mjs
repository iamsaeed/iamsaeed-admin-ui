/**
 * Rendered-DOM accessibility gate.
 *
 * `packages/ui/tests/contrast.test.ts` proves the TOKENS are accessible. It
 * cannot prove the markup uses them at a size that earns their bar — and on
 * 2026-08-19 that gap shipped: `--lm-subtle` passed the token suite at the
 * large-text threshold while the views applied it to 10px text, which owes
 * 4.5:1. The token suite was green; the product failed WCAG 1.4.3 on 1287
 * nodes.
 *
 * So this audits what a user actually receives: every route, every theme,
 * both viewports, against the real production build.
 *
 * IMPORTANT — the theme must be stamped explicitly. Headless Chrome resolves
 * `prefers-color-scheme` to dark and the default theme is `system`, so an
 * audit that skips the stamp silently measures dark only. Dark was 44 failing
 * nodes when light was 485.
 *
 *   npm run test:a11y                  # build + serve + audit, exits non-zero on any violation
 *   CHROME_PATH=/path/to/chrome npm run test:a11y
 *   A11Y_BASE=http://127.0.0.1:5200 npm run test:a11y   # audit an already-running server
 */
import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const PORT = Number(process.env.A11Y_PORT || 4173)
const EXTERNAL_BASE = process.env.A11Y_BASE || null
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/opt/google/chrome/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!CHROME) {
  console.error('No Chrome found. Set CHROME_PATH. Looked in:\n  ' + CHROME_CANDIDATES.join('\n  '))
  process.exit(2)
}

/** Every route the docs app exposes. Keep in sync with apps/docs/src/router. */
const ROUTES = [
  '/', '/dashboard', '/posts', '/pages', '/drafts', '/archive',
  '/media/images', '/media/videos', '/media/documents', '/comments',
  '/users', '/users/roles', '/users/invitations', '/taxonomies', '/analytics',
  '/kit/foundations', '/kit/buttons', '/kit/inputs', '/kit/controls',
  '/kit/data', '/kit/charts', '/kit/feedback', '/kit/navigation',
  '/kit/overlays', '/kit/media', '/kit/typography', '/kit/marketing',
  '/settings/general', '/settings/appearance', '/settings/integrations',
  '/settings/billing', '/help', '/signin', '/signup', '/forgot',
]

const THEMES = ['light', 'dark', 'sepia']
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812, isMobile: true, deviceScaleFactor: 2 },
]

const AXE_OPTS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  resultTypes: ['violations'],
}

/* ── server ─────────────────────────────────────────────────────────────── */

let server = null

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return true
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

async function startServer() {
  if (EXTERNAL_BASE) {
    console.log(`Using already-running server at ${BASE}`)
    if (!(await waitForServer(BASE))) throw new Error(`Nothing responding at ${BASE}`)
    return
  }
  console.log(`Starting vite preview on :${PORT} …`)
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
    cwd: new URL('../apps/docs', import.meta.url).pathname,
    stdio: 'ignore',
    detached: false,
  })
  if (!(await waitForServer(BASE))) throw new Error(`vite preview never came up on :${PORT}. Run \`npm run build\` first.`)
}

function stopServer() {
  if (server && !server.killed) server.kill('SIGTERM')
}

/* ── audit ──────────────────────────────────────────────────────────────── */

const rules = new Map()
const matrix = []

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
  })

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage()
      await page.setViewport(vp)

      for (const theme of THEMES) {
        let failing = 0

        for (const route of ROUTES) {
          await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 45000 })
          // Explicit stamp — see the header note. Without this the whole run
          // silently measures whatever the OS/headless default resolves to.
          await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
          await new Promise((r) => setTimeout(r, 200))
          await page.evaluate(axeSource)
          const res = await page.evaluate(async (o) => await window.axe.run(document, o), AXE_OPTS)

          for (const v of res.violations) {
            if (!rules.has(v.id)) {
              rules.set(v.id, { impact: v.impact, help: v.help, helpUrl: v.helpUrl, nodes: 0, where: new Set(), samples: [] })
            }
            const r = rules.get(v.id)
            r.nodes += v.nodes.length
            r.where.add(`${route} [${theme}/${vp.name}]`)
            for (const n of v.nodes) {
              if (r.samples.length >= 3) break
              r.samples.push({ route, theme, viewport: vp.name, target: n.target.join(' '), why: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 200) })
            }
            failing += v.nodes.length
          }
        }

        matrix.push({ viewport: vp.name, theme, failing })
        const mark = failing === 0 ? 'ok  ' : 'FAIL'
        console.log(`  ${mark} ${vp.name.padEnd(7)} ${theme.padEnd(6)} ${failing} failing nodes / ${ROUTES.length} routes`)
      }

      await page.close()
    }
  } finally {
    await browser.close()
  }
}

/* ── report ─────────────────────────────────────────────────────────────── */

console.log(`axe-core ${JSON.parse(readFileSync(require.resolve('axe-core/package.json'), 'utf8')).version} · ${ROUTES.length} routes × ${THEMES.length} themes × ${VIEWPORTS.length} viewports`)

let exitCode = 0
try {
  await startServer()
  await run()

  const total = matrix.reduce((a, m) => a + m.failing, 0)

  if (total > 0) {
    console.log('\n──────── violations ────────')
    const sorted = [...rules.entries()].sort((a, b) => b[1].nodes - a[1].nodes)
    for (const [id, r] of sorted) {
      console.log(`\n[${(r.impact || 'n/a').toUpperCase()}] ${id} — ${r.nodes} nodes`)
      console.log(`  ${r.help}`)
      console.log(`  ${r.helpUrl}`)
      for (const s of r.samples.slice(0, 2)) {
        console.log(`    ${s.route} [${s.theme}/${s.viewport}] ${s.target}`)
        console.log(`      ${s.why}`)
      }
    }
    console.log(`\nFAILED — ${total} failing nodes across ${rules.size} rules.`)
    exitCode = 1
  } else {
    console.log('\nPASSED — no violations in any theme or viewport.')
  }
} catch (err) {
  console.error('\nAudit could not run:', err.message)
  exitCode = 2
} finally {
  stopServer()
}

process.exit(exitCode)
