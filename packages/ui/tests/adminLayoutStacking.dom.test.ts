// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminLayout from '../src/layouts/AdminLayout.vue'

/**
 * The desktop rail is permanent chrome, so it must sit under the shared scrim
 * (`--lm-z-scrim`, 35) like the topbar does. It used the drawer layer (40) and
 * stayed undimmed and clickable behind every open dialog. Only the phone
 * drawer — which the scrim backs — belongs on the drawer layer.
 */
beforeEach(() => {
  // jsdom has no matchMedia; the breakpoint composable reads it on mount.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  )
})

describe('AdminLayout stacking', () => {
  it('puts the desktop rail on the sticky layer, below the scrim', () => {
    const w = mount(AdminLayout, { props: { nav: [] } })
    const rail = w.findAll('aside').find((a) => a.classes().includes('lg:block'))
    expect(rail, 'desktop rail').toBeTruthy()
    expect(rail!.classes()).toContain('z-(--lm-z-sticky)')
    expect(rail!.classes()).not.toContain('z-(--lm-z-drawer)')
  })
})
