# DateRangePicker — a date-range filter for list screens

**Status:** planned 2026-10-05 · **Package:** `@iamsaeed/admin-ui` · **Target release:** 0.5.0

## Why

Every admin list that grows without bound needs "show me these days". SSB shipped the first one
on 2026-10-05 (Entries, `9ea4901` in `EvaluitD/ssb-laravel`) as an app-local
`DateRangeFilter.vue`: a preset `<select>` plus two native `<input type="date">`. It works, but it
is the copy-per-project pattern this library exists to end, and it shows the native control's
limits:

- **Native date inputs follow the browser's locale, not the app's.** The same field reads
  `17/09/2026` on one machine and `09/17/2026` on the next. In a record of who crossed a border
  on which day, that ambiguity is a real defect.
- **They cannot be themed.** The calendar popup ignores `data-theme`/`data-skin`, so in dark mode
  a light OS calendar flashes over a dark panel.
- **Three controls for one idea.** In a `.filter-bar` grid they wrapped apart (the From box under
  the search box, the To box beside it). SSB fixed that by giving the range its own row, which is
  a layout workaround, not a design.
- **No way to see the range.** Two separate days do not show the span you have picked, and
  picking a range takes four steps (open, pick, open, pick).

The aptire CRM, campaign-saas and cortexai platform activity screens all have the same need.

## What ships

One component, one pure utility module, a kit demo and tests.

```
packages/ui/src/components/ui/DateRangePicker.vue    the control
packages/ui/src/utils/dateRange.ts                  pure date maths (no date library)
packages/ui/src/styles/components.css               .daterange-* classes
packages/ui/src/views/kit/InputsView.vue            demo block
packages/ui/tests/dateRange.test.ts                 the maths
packages/ui/tests/dateRangePicker.dom.test.ts       keyboard, focus, v-model, sheet trap
```

### The control

A **single trigger** that sits in a `.filter-bar` cell like any select. It reads `Any date`,
a preset's name (`Last 7 days`), or the span (`17 – 26 Sep 2026`). A clear (×) button appears in
the trigger once a range is set.

Opening it shows a panel:

| Width | Panel | Layout |
|---|---|---|
| ≥ md (desktop/tablet) | Popover anchored under the trigger, **non-modal** | Presets in a left rail, **two months** side by side, footer with From/To readout + Clear / Apply |
| < md (phone) | **Bottom sheet**, modal → `useFocusTrap` (hard rule 8) | Presets as a horizontally scrolling chip row, **one month**, sticky footer with Apply |

Picking works the way people expect from a booking site: first click sets the start, hovering
previews the span, second click sets the end (clicking an earlier day swaps them). Choosing a
preset applies at once and closes the panel. A typed custom range applies on **Apply** only, so a
half-picked range never fires a request.

### API

```vue
<DateRangePicker
  v-model:from="filters.from"      <!-- 'YYYY-MM-DD' or '' -->
  v-model:to="filters.to"          <!-- 'YYYY-MM-DD' or '' -->
  :presets="DEFAULT_DATE_PRESETS"  <!-- optional; [] hides the rail -->
  :min="'2026-01-01'"              <!-- optional bounds, inclusive -->
  :max="today"
  :week-starts-on="1"              <!-- 0 Sun … 6 Sat; default 1 (Monday) -->
  locale="en-IN"                   <!-- Intl locale for month/day names and the trigger label -->
  placeholder="Any date"
  label="Decided"                  <!-- accessible name; visually hidden unless show-label -->
  :max-days="366"                  <!-- optional longest allowed span -->
  :is-date-disabled="(d) => false" <!-- optional per-day block -->
  :fiscal-year-start="4"           <!-- month the financial year starts; default April -->
  time-zone="Asia/Kolkata"         <!-- what "today" means; default the browser's -->
  shiftable                        <!-- ‹ › on the trigger move the range by its length -->
  name="decided"                   <!-- hidden decided[from] / decided[to] for plain forms -->
/>
```

- **Strings, not `Date`s, on the model.** `YYYY-MM-DD` is exactly what list endpoints take and what
  `useListQuery`-style URL state stores, and it has no timezone. A `Date` on the model brings back
  the UTC-midnight bug (picked at 02:00 IST, a `toISOString()` names yesterday).
- Both ends are **inclusive** and either may be empty (open-ended "from the 1st").
- `from`/`to` emit together on Apply or preset, so a consumer watching both sees one change, not
  two requests.
- Presets are data: `{ key, label, range: (today: Date) => { from, to } }`. Defaults: Today,
  Yesterday, Last 7 days, Last 30 days, This month, Last month, This year, Last year, This
  financial year, Last financial year. Plus the relative "Last N units" row (`relative` prop,
  default on).

### Feature scope — what makes it a complete component

Reviewed 2026-10-05 after the first mock-up, which could only step one month at a time (so
reaching 10–20 years back took 120+ clicks). Everything in **v1** ships in 0.5.0; **later** items
are designed for now (the API leaves room) but built when a consumer needs them.

| # | Feature | v1 | Notes |
|---|---|---|---|
| 1 | **Month and year views.** Click the month heading → 12 months; click the year → a page of 12 years, with arrows to page by 12 | v1 | Any year in three clicks. The view resets to days on close |
| 2 | **Typed dates.** From/To are real text inputs, `DD/MM/YYYY` (pattern from `locale`), parsed on blur and Enter, and the calendar jumps to what was typed | v1 | Fastest for known far-off dates; also the keyboard-only path |
| 3 | **Year-scale presets.** This year, Last year, This financial year, Last financial year (`fiscalYearStart`, default April for India) | v1 | |
| 4 | **Relative range row.** "Last [N] [days/weeks/months/years]" → applies | v1 | Covers "last 10 years" without the calendar |
| 5 | **Validation.** Unparseable date, a day outside `min`/`max`, end before start and over `maxDays` each get a red field and a plain message, and Apply is disabled | v1 | Never fires a request that cannot be right |
| 6 | **Bounds.** `min`, `max`, `isDateDisabled(day)`, `maxDays` | v1 | Out-of-bounds months and years are disabled in their views too |
| 7 | **Span readout.** "10 days", and above a year "3,653 days · 10.0 years" | v1 | |
| 8 | **Shift arrows** on the trigger: move the whole range back or forward by its own length | v1 | Opt-in `shiftable`; "previous week" in one click |
| 9 | **Open-ended ranges.** Only From ("from 1 Oct") or only To ("until 30 Sep") | v1 | Already in the model; the trigger and readout must say it |
| 10 | **Form integration.** `name` (emits hidden `name[from]`/`name[to]` inputs), `required`, `disabled`, `readonly`, `invalid` + `error` text, and a working form reset | v1 | |
| 11 | **Slots.** `#preset`, `#footer`, `#day="{ day, inRange }"` (for example a dot or a count per day) | v1 | Per-app behaviour without forking |
| 12 | **Locale.** `locale`, `weekStartsOn`, `timeZone` for what "today" means (defaults to the browser's) | v1 | |
| 13 | **Single-date mode** (`mode="single"`), the same grid with one endpoint | later | `DateGrid` is internal so this is cheap |
| 14 | **RTL** (arrows and range band mirror) | later | The library has deferred RTL overall |
| 15 | **Time of day** on each end | later | A different control; ranges stay calendar days |
| 16 | **Compare to previous period** (analytics) | later | |

### `utils/dateRange.ts` (pure, exported)

`isoDay`, `parseIsoDay`, `addDays`, `startOfMonth`, `monthMatrix(year, month, weekStartsOn)`,
`presetRange`, `matchPreset`, `formatRangeLabel(from, to, locale)`, `clampToBounds`. All
local-calendar, no `Date.UTC`, no dependency. `matchPreset` is what lets a range restored from the
URL show "Last 7 days" instead of two dates. Ported from SSB's `useDateRange.ts` and extended.

### Accessibility (the part that drifts if it is not specified)

- Trigger: `<button aria-haspopup="dialog" aria-expanded>`; the accessible name includes the
  current value ("Decided: Last 7 days").
- Calendar: WAI-ARIA **grid** pattern. `role="grid"`, one tab stop (roving `tabindex`), arrows move
  a day/week, PageUp/PageDown a month, Shift+PageUp/Down a year, Home/End the week edges,
  Enter/Space pick. Each day cell is named in full ("Tuesday 17 September 2026"); in-range days
  carry `aria-selected="true"`; out-of-bounds days are `aria-disabled`, not removed.
- Escape closes and returns focus to the trigger. The phone sheet traps focus (`aria-modal`); the
  desktop popover does not, and so does not claim `aria-modal`.
- 44px touch targets on the phone grid (the library's touch floor); 36px on desktop.
- `prefers-reduced-motion` skips the sheet slide and month slide.

### Styling

New named classes in `components.css` (hard rule 5): `.daterange-trigger`, `.daterange-panel`,
`.daterange-presets`, `.daterange-month`, `.daterange-day` with state modifiers
`.is-today`, `.is-start`, `.is-end`, `.is-in-range`, `.is-outside`, `.is-disabled`. Layer-2 tokens
only (hard rules 1–2): range fill `--lm-accent-soft`, endpoints `--lm-accent` with
`--lm-accent-fg`, today ring `--lm-ring`. No new tokens expected; if the in-range fill misses AA
against day numbers in any of the 24 theme × skin pairs, solve a token rather than hard-code.

## Verification

The library's four layers plus the rendered audit:

1. `npm test`: new suites green. Maths cover month edges, leap day, `weekStartsOn` 0/1/6,
   bounds, swap-on-earlier-click and `matchPreset` round trips. DOM suites cover the keyboard
   map, roving tabindex, Escape plus focus restore, the sheet's focus trap, single emit on Apply
   and the clear button.
2. `npm run type-check` clean.
3. `npm run build` green.
4. The kit page in light, dark and sepia at 375px and 1440px, with zero console errors.
5. `npm run test:a11y` with the kit route included, so axe checks in-range day contrast in the
   real markup (the token suite cannot see that; see CLAUDE.md "Verification").

## Adoption

- **SSB** (`EvaluitD/ssb-laravel`): replace `components/ui/DateRangeFilter.vue` +
  `composables/useDateRange.ts` + the `.date-range` row CSS with the library component. SSB
  consumes a vendored tarball (`vendor-ui/iamsaeed-admin-ui-0.4.0.tgz`), so it needs a 0.5.0
  `npm pack` dropped in and `package.json` repointed. The SSB manual page (`entries.md`) and the
  `entries-list` screenshot change with it.
- **cortexai platform**: Activity log and Audit trail gain a date filter for free.
- **aptire CRM**: activities and invoices lists.

## Out of scope (noted, not planned)

- Single-date mode, RTL, time of day and compare-to-period: see "Feature scope" rows 13–16.
- **`AppTopbar` search toggle.** Found while doing SSB: the topbar always renders a search box and
  has no prop to hide it, so SSB hides it with a `:has()` CSS rule. A `showSearch` prop (default
  `true`) is a one-line addition and belongs in the same 0.5.0 release.

## Open questions

- Default `weekStartsOn`: Monday (ISO, India) is proposed. Should the default follow the locale
  instead (`Intl.Locale#weekInfo` is not in Firefox yet)?
- Should the phone sheet keep the two-month view in landscape? Proposed: no, one month, simpler.
