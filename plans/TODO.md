# TODO — admin-panel theme

Tasks are added as `- [ ]` under the current date. Only the user checks items off.

## 2026-08-19

- [ ] Review the built theme and confirm the direction before it is adopted anywhere
- [ ] Decide the distribution mechanism — now that the repo exists, a git URL works today:
      `npm i git+ssh://git@github.com/iamsaeed/iamsaeed-admin-ui.git#main` (consumers need repo access,
      and it installs the monorepo root, so a `packages/ui` subpath or a published tarball may be needed)
- [ ] Adopt in one real project as a pilot (aptire full-stack-app is the closest fit)
- [x] Add a test suite — 445 assertions: WCAG AA + sRGB gamut for every theme × skin, colour
      maths pinned against Chrome, palette snapshot. Found and fixed six real contrast failures
      in the inherited palette (warn text was 1.78:1) — see the plan's "What the contrast suite
      found" section
- [x] Add Vitest coverage for the composables — `useTheme` (persistence, corrupt-storage
      handling, unknown-value rejection, hue clamping) and `useFocusTrap` (wrapping, escape
      recovery, focus restore, listener cleanup). 480 assertions total
- [ ] Accessibility pass on the remaining views — the shell and overlays are done; the ported
      screens have not been audited individually (form labels, table captions, heading order)
- [ ] `useSidebar` tests (breakpoint transitions, body-scroll lock)
- [ ] Decide whether `data-density` should be user-facing or dev-only in shipped products
- [ ] RTL support (token architecture allows it; implementation deferred)
- [x] First git commit + push — `iamsaeed/iamsaeed-admin-ui` (private, personal account), branch `main`
