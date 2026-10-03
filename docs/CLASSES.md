# Class reference

Every class `@iamsaeed/admin-ui` defines, what it is for, and the markup it expects.

**These classes are the main API.** Most of a screen is plain HTML wearing these names — you do
not need a Vue component to build a card, a table or a form. Reach here first; write a utility
string only when nothing below fits.

Source of truth: `packages/ui/src/styles/components.css`. If a class is not on this page, it does
not exist — do not guess a name. Common wrong guesses are listed in [Not classes](#not-classes).

Everything reads Layer-2 design tokens, so every class follows the theme, skin, density and radius
axes with no extra work. Never hard-code a colour beside one.

---

## Contents

[Surface](#surface) · [Buttons](#buttons) · [Forms](#forms) · [Tables](#tables) ·
[Badges](#badges-pills-and-chips) · [Feedback](#feedback) · [Overlays](#overlays) ·
[Navigation](#navigation) · [Page furniture](#page-furniture) · [Dashboard](#dashboard) ·
[Avatars](#avatars) · [Text and utility](#text-and-utility) · [State classes](#state-classes)

---

## Surface

| Class | What it does |
|---|---|
| `.card` | The standard raised surface: background, border, radius, hairline shadow. **No padding** — add `.card-p`, or use `.card-hd` / `.card-body` structure |
| `.card-p` | Card padding. Separate from `.card` so a card can hold a flush table or image |
| `.card-hd` | Card header: flex row, space-between, padded, bottom border |
| `.card-title` | Header title text — display face, 15px, 600 |
| `.card-sub` | Secondary line under a title — 13px, muted |
| `.card-ft` | Card footer: padded, top border, sunken background, bottom corners rounded |
| `.card-interactive` | Makes a card clickable: pointer cursor, hover shadow and border, 1px lift **on mouse only** (no lift on touch, where it reads as jank) |
| `.panel` | Quieter inset surface — sunken background, small radius. For a well inside a card |

```html
<div class="card">
  <div class="card-hd">
    <div>
      <h2 class="card-title">Recent activity</h2>
      <p class="card-sub">Last 7 days</p>
    </div>
    <button class="btn btn-ghost btn-sm">View all</button>
  </div>
  <div class="card-p">…</div>
  <div class="card-ft">…</div>
</div>
```

There is no `.card-body` or `.card-header` — the names are `.card-p` and `.card-hd`.

---

## Buttons

`.btn` is the base and is **always required**; a variant alone is unstyled.

| Class | What it does |
|---|---|
| `.btn` | Base: inline-flex, centred, gap, token height, radius, 13px/550, no wrap |
| `.btn-primary` | Accent fill — the one primary action on a screen |
| `.btn-secondary` | Surface fill with a border — the default choice |
| `.btn-ghost` | Transparent, muted text; fills on hover. For toolbar and icon actions |
| `.btn-soft` | Accent-tinted fill, accent text. A quieter primary |
| `.btn-danger` | Solid danger fill. Destructive confirm |
| `.btn-danger-soft` | Danger-tinted fill, danger text. Destructive trigger |
| `.btn-link` | Looks like a link: no height, no padding, underlines on hover |
| `.btn-sm` | Small height, 12px |
| `.btn-lg` | Large height, 14px |
| `.btn-icon` | Square — width follows height. Pair with an `.sr-only` label or `Icon`'s `label` prop |
| `.btn-block` | Full width at every size |
| `.btn-block-mobile` | Full width **below 640px only**. Use on the primary action of a form |
| `.btn-group` | Segmented control. Wrap sibling `.btn`s; mark the current one `aria-pressed="true"` or `.is-active` |

```html
<button class="btn btn-primary">Save changes</button>
<button class="btn btn-secondary btn-sm">Cancel</button>
<button class="btn btn-ghost btn-icon" aria-label="Filter">
  <svg …></svg>
</button>

<div class="btn-group" role="group" aria-label="View">
  <button class="btn" aria-pressed="true">List</button>
  <button class="btn" aria-pressed="false">Board</button>
</div>
```

`:disabled` and `aria-disabled="true"` are both styled (50% opacity, no pointer events) — no
`.btn-disabled` class exists or is needed.

Variant names people expect that **do not exist**: `.btn-outline`, `.btn-default`, `.btn-warning`,
`.btn-success`, `.btn-xs`. Use `.btn-secondary` for outline and `.btn-sm` for small. There is no
status-coloured button other than danger, deliberately — a success-green button is a status
signal misused as an action.

---

## Forms

| Class | What it does |
|---|---|
| `.form-group` | Column flex wrapper for one label + control + hint |
| `.form-row` | Grid row with gap — one column by default |
| `.form-row-2` | With `.form-row`, two equal columns **from 768px**. Single column on phones |
| `.form-label` | Block label, 12px/550, muted, bottom margin |
| `.form-input` | Text input. Full width, token height and radius |
| `.form-select` | Select. Same box plus a CSS-drawn chevron and right padding |
| `.form-textarea` | Textarea. 6rem min-height, vertical resize only, relaxed line height |
| `.form-hint` | Helper text under a control — 12px, subtle |
| `.form-error` | Error text under a control — 12px, danger |
| `.input-group` | Relative wrapper that indents `.form-input` for a leading icon |
| `.input-group-icon` | The absolutely-positioned leading icon. Pointer-events off |
| `.switch` | Toggle. A `<button>`, driven entirely by `aria-checked` |

```html
<div class="form-row form-row-2">
  <div class="form-group">
    <label class="form-label" for="name">Full name</label>
    <input id="name" class="form-input" type="text" />
    <p class="form-hint">As it appears on the invoice.</p>
  </div>
  <div class="form-group">
    <label class="form-label" for="email">Email</label>
    <input id="email" class="form-input" type="email" aria-invalid="true" />
    <p class="form-error">That address is already in use.</p>
  </div>
</div>

<div class="input-group">
  <span class="input-group-icon"><svg …></svg></span>
  <input class="form-input" type="search" placeholder="Search…" />
</div>

<button class="switch" role="switch" aria-checked="true" aria-label="Email alerts"></button>
```

Three things the stylesheet does for you, which you must not undo:

- **Inputs are 16px on phones** and 13px from 640px. Anything under 16px makes iOS Safari zoom on
  focus and strands the user mid-form. Do not add a smaller `text-*` utility to a control.
- **`aria-invalid="true"` turns the border red.** Set that attribute rather than adding a class.
- **`.switch` reads `aria-checked`.** There is no checked class; drive the attribute.

---

## Tables

| Class | What it does |
|---|---|
| `.table-wrap` | Horizontal scroll container. Use when a table genuinely cannot re-flow |
| `.data-table` | The table: full width, collapsed borders, 13px, sticky uppercase header, row hover, token row height |
| `.data-table-stack` | **Below 768px**, re-flows rows into compact stacked blocks instead of scrolling |
| `.num` | On a `<td>`/`<th>` inside `.data-table`: right-aligned, tabular figures |
| `.td-title` | Primary label in a cell — block, 500, foreground |
| `.td-sub` | Secondary line under it — block, 11px, muted |
| `.td-action` | Trailing actions column — 1px wide, right aligned, no wrap |

`.td-title` and `.td-sub` are `display: block` on purpose. Applied to a `<span>` without it, the
two run together on one line and the sub's margin is silently dropped.

**`.data-table-stack` has a hard accessibility requirement.** Changing `display` on table elements
strips their implicit ARIA roles in every major browser, so a re-flowed table stops being a table
to assistive tech. Markup using it **must** carry explicit roles, and each `<td>` needs a
`data-label` for the visual column name:

```html
<table class="data-table data-table-stack" role="table">
  <thead>
    <tr role="row">
      <th role="columnheader">Company</th>
      <th role="columnheader">Owner</th>
      <th role="columnheader" class="num">Value</th>
      <th role="columnheader"><span class="sr-only">Actions</span></th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="cell" data-label="Company">
        <span class="td-title">Meridian Logistics</span>
        <span class="td-sub">Freight · Dubai</span>
      </td>
      <td role="cell" data-label="Owner">Sara N.</td>
      <td role="cell" data-label="Value" class="num">48,200</td>
      <td role="cell" class="td-action">
        <button class="btn btn-ghost btn-sm">Edit</button>
      </td>
    </tr>
  </tbody>
</table>
```

The roles are redundant and harmless at desktop width; they are what rescues the semantics at
phone width. The first cell becomes the block's heading and drops its `data-label` automatically.

---

## Badges, pills and chips

| Class | What it does |
|---|---|
| `.badge` | Base: inline-flex, small radius, 11px/550, no wrap. **Always required** |
| `.badge-neutral` | Sunken background, muted text |
| `.badge-accent` | Accent-soft background, accent text |
| `.badge-success` `.badge-warn` `.badge-danger` `.badge-info` | Status tones on their soft backgrounds |
| `.pill` | Add to `.badge` or `.chip` for a fully round shape |
| `.chip` | Removable filter token — bordered, pill, small-control height |
| `.dot` | 8px round status dot. Colour it with a token-backed utility, never a hex |

```html
<span class="badge badge-success">Paid</span>
<span class="badge badge-neutral pill">Draft</span>
<span class="chip">Dubai <button class="btn btn-ghost btn-icon btn-sm" aria-label="Remove">×</button></span>
```

Status tones are deliberately **not** skinned — danger reads as danger in every brand.

---

## Feedback

| Class | What it does |
|---|---|
| `.alert` | Inline message block. Base required |
| `.alert-success` `.alert-warn` `.alert-danger` `.alert-info` | Tones |
| `.toast` | A floating message card |
| `.toast-region` | Fixed stack for toasts: top full-width on phones (clear of the notch), bottom-right 22rem from 640px |
| `.progress` | Track — 8px, sunken, pill, clips its bar |
| `.progress-bar` | Fill. Drive with an inline `width` |
| `.skeleton` | Shimmering loading placeholder. Size it yourself |
| `.empty-state` | Centred column: icon, title, body, action |
| `.empty-state-icon` | 3rem rounded sunken tile for the icon |
| `.empty-state-title` | 600, foreground |
| `.empty-state-body` | 13px, muted |

```html
<div class="alert alert-warn" role="alert">
  <svg …></svg>
  <div>Two invoices are overdue.</div>
</div>

<div class="toast-region">
  <div class="toast" role="status" aria-live="polite">Saved.</div>
</div>

<div class="progress"><div class="progress-bar" style="width: 62%"></div></div>

<div class="empty-state">
  <div class="empty-state-icon"><svg …></svg></div>
  <p class="empty-state-title">No invoices yet</p>
  <p class="empty-state-body">They appear here once a deal is won.</p>
  <button class="btn btn-primary btn-sm">New invoice</button>
</div>
```

**The CSS positions a toast; the ARIA is what makes it exist.** A `.toast` without
`role="status"` (or `role="alert"` when it demands attention) is invisible to a screen reader.
Same for `.alert`.

---

## Overlays

Prefer the **`Dialog` component** — it ships the focus trap, Escape handling and focus restore.
Use these classes directly only for an overlay `Dialog` does not cover.

| Class | What it does |
|---|---|
| `.scrim` | Fixed full-screen backdrop with a slight blur |
| `.modal` | **Bottom sheet on phones**, centred 32rem dialog from 640px. Flex column, capped height |
| `.modal-hd` | Header — padded, bottom border |
| `.modal-body` | Body — padded, scrolls |
| `.modal-ft` | Footer — right-aligned action row, top border |
| `.modal-handle` | Sheet grab handle. Hidden from 640px |
| `.menu` | Dropdown surface — 12rem min, padded, bordered, shadowed |
| `.menu-item` | Row in a menu — full width, 2.25rem min height, left aligned |
| `.menu-item-danger` | Danger-coloured item |
| `.menu-sep` | 1px separator with vertical margin |
| `.tooltip` | Inverted small label. Pointer-events off |

> **If you hand-roll an overlay carrying `aria-modal="true"`, you must trap focus.**
> The attribute tells assistive tech the rest of the page is inert. Without a real trap that is a
> false promise: the screen-reader user is told they are in a modal while Tab quietly walks them
> into content they cannot see. Use the `useFocusTrap` composable — it also restores focus to the
> trigger on close, which is the half people forget.

---

## Navigation

| Class | What it does |
|---|---|
| `.nav-item` | Sidebar row — 44px min height, gap, radius, muted; fills on hover |
| `.nav-item-sub` | Child row — extra left indent, lighter weight |
| `.nav-section` | Uppercase group heading — 10px/600, tracked, subtle |
| `.tabs` | Tab strip — bottom border, horizontally scrollable, scrollbar hidden |
| `.tab` | One tab — muted; `.is-active` colours it and draws the accent underline |
| `.breadcrumb` | Trail row — 12px, subtle, with `a` hover states |

```html
<nav class="tabs" role="tablist">
  <button class="tab is-active" role="tab" aria-selected="true">Overview</button>
  <button class="tab" role="tab" aria-selected="false">Activity</button>
</nav>
```

The sidebar is normally rendered by `AppSidebar` from a nav schema — you rarely write `.nav-item`
by hand. Route destinations are **route names, never paths**.

---

## Page furniture

| Class | What it does |
|---|---|
| `.page` | Page padding, stepping up from 768px; extra bottom padding clears the phone bottom nav and home indicator |
| `.page-header` | Stacked on phones, row with space-between from 768px |
| `.page-title` | 24px/600, 28px from 768px |
| `.page-sub` | 13px muted line under the title |
| `.page-actions` | Wrapping action row |
| `.toolbar` | Filter/action row above content — wraps, bottom margin |
| `.grid-auto` | The standard tile grid: **two columns on phones**, auto-fill 15rem from 768px |

```html
<div class="page">
  <header class="page-header">
    <div>
      <h1 class="page-title">Invoices</h1>
      <p class="page-sub">32 open · 4 overdue</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary">Export</button>
      <button class="btn btn-primary btn-block-mobile">New invoice</button>
    </div>
  </header>
  <div class="grid-auto">…</div>
</div>
```

`.grid-auto` is two-up on phones on purpose. A naive `auto-fill` with a 15rem floor collapses to
one column below ~31rem, which turned a four-tile KPI row into four full-width blocks and pushed
everything else off-screen.

---

## Dashboard

| Class | What it does |
|---|---|
| `.kpi` | Padding for a metric tile. Use **with** `.card` |
| `.kpi-label` | 12px/500 muted caption |
| `.kpi-value` | The number — display face, 22px (28px from 768px), tabular figures |
| `.kpi-delta` | Change pill. Needs a direction class |
| `.kpi-delta-up` | Success tones |
| `.kpi-delta-down` | Danger tones |
| `.kpi-icon` | 2rem accent-soft rounded tile for the tile's icon |

```html
<div class="card kpi">
  <p class="kpi-label">Revenue</p>
  <p class="kpi-value">₹4,82,000</p>
  <span class="kpi-delta kpi-delta-up">+12.4%</span>
</div>
```

`.kpi` is padding only — without `.card` it has no surface.

---

## Avatars

| Class | What it does |
|---|---|
| `.avatar` | 2rem round accent-soft tile; centres an initial or clips an image |
| `.avatar-sm` | 1.5rem |
| `.avatar-lg` | 2.75rem |
| `.avatar-stack` | On a wrapper: overlaps child avatars with a ring in the surface colour |

```html
<div class="avatar-stack">
  <span class="avatar avatar-sm">A</span>
  <span class="avatar avatar-sm">S</span>
</div>
```

---

## Text and utility

| Class | What it does |
|---|---|
| `.muted` | Secondary text colour. Reach for this, **not** `.badge-neutral`, which turns a sentence into a pill |
| `.font-display` | The display typeface |
| `.font-mono` | The monospace typeface |
| `.section-label` | Uppercase 11px section caption |
| `.tnum` | Tabular figures — use on any number that changes in place |
| `.truncate-2` | Clamp to two lines with an ellipsis |
| `.hairline` | Single bottom border in the token colour |
| `.sr-only` | Visible to screen readers only. For an icon-only control's name |
| `.skip-link` | "Skip to content" — first focusable element, appears on focus. Shipped by `AdminLayout` |

Activity feed and detail-list helpers:

| Class | What it does |
|---|---|
| `.feed` | Column of feed items with a small gap |
| `.feed-item` | One entry — icon column plus content, padded |
| `.feed-icon` | 2.375rem sunken rounded tile |
| `.def-list` | Label/value pairs on a detail screen |
| `.fab` | Floating action button — fixed bottom-right, 3.5rem, clear of the safe area |

---

## State classes

Not standalone — added to a base class to mark the current item.

| Class | Applies to | Instead of |
|---|---|---|
| `.is-active` | `.nav-item`, `.tab`, `.btn-group > .btn` | `.active`, `.selected`, `.current` |
| `aria-pressed="true"` | `.btn-group > .btn` | A class. Prefer this — it is announced |
| `aria-checked="true"` | `.switch` | A class. The switch has no checked class |
| `aria-invalid="true"` | `.form-input`, `.form-select`, `.form-textarea` | `.is-error`, `.has-error` |
| `:disabled` / `aria-disabled="true"` | `.btn` | `.btn-disabled`, `.is-disabled` |

---

## Not classes

Frequently guessed names that **do not exist**. The right-hand column is what to use.

| Wrong | Right |
|---|---|
| `.card-header`, `.card-body`, `.card-footer` | `.card-hd`, `.card-p`, `.card-ft` |
| `.btn-outline`, `.btn-default` | `.btn-secondary` |
| `.btn-warning`, `.btn-success`, `.btn-info` | Not available — status colour is for badges and alerts, not buttons |
| `.btn-xs` | `.btn-sm` |
| `.table`, `.table-striped` | `.data-table` |
| `.input`, `.select`, `.textarea` | `.form-input`, `.form-select`, `.form-textarea` |
| `.label` | `.form-label` |
| `.text-muted` | `.muted` |
| `.modal-header`, `.modal-footer`, `.modal-content` | `.modal-hd`, `.modal-ft`, `.modal-body` |
| `.dropdown`, `.dropdown-item` | `.menu`, `.menu-item` |
| `.active`, `.selected` | `.is-active` |
| `.spinner`, `.loader` | `.skeleton` (or `.progress` for determinate work) |
| `.container`, `.row`, `.col` | `.page`, `.form-row`, `.grid-auto` |
| `.stat`, `.metric` | `.card` + `.kpi` |

---

## Rules when you extend

1. **Never write a raw colour beside these classes.** No hex, no `rgb()`, no `oklch()` literal.
   Every colour comes from a token so that the skin stays a one-line change.
2. **If the same utility run appears three times, it is a class.** Add it to your own app's
   stylesheet in the same shape — or open a PR here if it is genuinely generic.
3. **Mobile-first.** The unprefixed rule is the phone; `md:` / `lg:` are the enhancement. Never
   write a desktop rule then a `max-width` override to undo it.
4. **Touch targets have a 44px floor** under `@media (pointer: coarse)` that no density setting
   can undercut. Do not force a control smaller.
