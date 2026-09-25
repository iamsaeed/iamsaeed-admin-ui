import { readonly, shallowRef } from 'vue'
import type { IconName } from '../components/ui/icon-paths'

/** One entry in the settings section switcher. `id` is what `navigate` emits. */
export interface SettingsSection {
  id: string
  label: string
  icon: IconName
}

/** The four sections the bundled settings views ship with. */
export const DEFAULT_SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: 'settings.general', label: 'General', icon: 'settings' },
  { id: 'settings.appearance', label: 'Appearance', icon: 'sparkles' },
  { id: 'settings.integrations', label: 'Integrations', icon: 'plug' },
  { id: 'settings.billing', label: 'Billing', icon: 'credit-card' },
]

/*
 * Module-scoped, like useTheme: the settings views are routed individually, so
 * there is no common parent to pass a prop through. A consumer with sections of
 * its own (Profile, Security) sets the full list once at startup and every
 * SettingsLayout — the bundled views' and the consumer's own — shows the same
 * switcher. Before this the list was hard-coded, so an app's own settings pages
 * could not appear in the library's nav and had to fork the whole layout.
 */
const sections = shallowRef<readonly SettingsSection[]>(DEFAULT_SETTINGS_SECTIONS)

export function useSettingsSections() {
  function setSettingsSections(list: readonly SettingsSection[]): void {
    sections.value = list.length ? [...list] : DEFAULT_SETTINGS_SECTIONS
  }

  return { sections: readonly(sections), setSettingsSections }
}
