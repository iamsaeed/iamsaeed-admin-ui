import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS_SECTIONS, useSettingsSections } from '../src/composables/useSettingsSections'

describe('useSettingsSections', () => {
  it('starts with the four bundled sections', () => {
    const { sections, setSettingsSections } = useSettingsSections()
    setSettingsSections([])
    expect(sections.value.map((s) => s.id)).toEqual(DEFAULT_SETTINGS_SECTIONS.map((s) => s.id))
  })

  it('is shared: a list set by one caller is what every other caller sees', () => {
    useSettingsSections().setSettingsSections([
      { id: 'profile', label: 'Profile', icon: 'user' },
      ...DEFAULT_SETTINGS_SECTIONS,
    ])
    expect(useSettingsSections().sections.value[0].id).toBe('profile')
    expect(useSettingsSections().sections.value).toHaveLength(5)
  })

  it('falls back to the defaults when given an empty list', () => {
    const { sections, setSettingsSections } = useSettingsSections()
    setSettingsSections([])
    expect(sections.value).toHaveLength(4)
  })
})
