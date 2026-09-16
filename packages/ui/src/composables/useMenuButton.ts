import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * The WAI-ARIA **menu button** pattern, once.
 *
 * Two topbar controls now open a menu (the account menu and notifications),
 * and a third will follow. Re-typing the keyboard contract per component is
 * how it ends up subtly different in each one - and the parts that drift are
 * always the invisible ones: focus restore, wrapping, Tab.
 *
 * Deliberately NOT a focus trap. A menu is not modal: the page behind it stays
 * reachable, so it carries no `aria-modal` and trapping would contradict what
 * the markup promises. `useFocusTrap` is for overlays that claim inertness.
 *
 * Unlike `useSidebar` / `useTheme` this is NOT a singleton — every menu gets
 * its own state, or opening one would open them all.
 */
export function useMenuButton(options: {
  root: Ref<HTMLElement | null>
  trigger: Ref<HTMLElement | null>
  menu: Ref<HTMLElement | null>
}) {
  const open = ref(false)

  function items(): HTMLElement[] {
    return options.menu.value
      ? Array.from(options.menu.value.querySelectorAll<HTMLElement>('button:not([disabled])'))
      : []
  }

  /** Wrap at both ends — a menu that stops dead makes a keyboard user reverse. */
  function focusItem(index: number) {
    const all = items()
    if (all.length === 0) return
    all[(index + all.length) % all.length]?.focus()
  }

  function currentIndex(): number {
    return items().indexOf(document.activeElement as HTMLElement)
  }

  async function openMenu(focus: 'first' | 'last' = 'first') {
    open.value = true
    await nextTick()
    focusItem(focus === 'first' ? 0 : items().length - 1)
  }

  function closeMenu(restoreFocus = true) {
    if (!open.value) return
    open.value = false
    if (restoreFocus) options.trigger.value?.focus()
  }

  function toggle() {
    if (open.value) closeMenu(false)
    else void openMenu('first')
  }

  function onTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      void openMenu('first')
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      void openMenu('last')
    }
  }

  function onMenuKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusItem(currentIndex() + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        focusItem(currentIndex() - 1)
        break
      case 'Home':
        event.preventDefault()
        focusItem(0)
        break
      case 'End':
        event.preventDefault()
        focusItem(items().length - 1)
        break
      case 'Tab':
        // Close, but let the browser move focus onward as it normally would.
        closeMenu(false)
        break
    }
  }

  /* Escape is handled on the DOCUMENT, not on the menu element.
     Binding it to the menu assumes focus is still inside it, and focus can
     leave without the menu closing: an item that removes itself (notifications'
     "mark all read" hides once nothing is unread) drops focus to <body>, and
     from there a menu-scoped handler never fires. The user is then left with an
     open menu that Escape will not close. */
  function onDocumentKeydown(event: KeyboardEvent) {
    if (!open.value || event.key !== 'Escape') return
    event.preventDefault()
    closeMenu()
  }

  /* Focus can also be lost without leaving deliberately: an item that removes
     itself takes the focus ring with it and the browser falls back to <body>,
     which is reported as a focusout with a null relatedTarget. Pull focus back
     into the menu rather than letting the user restart from the top of the
     document. A real move elsewhere has a relatedTarget and is left alone. */
  function onMenuFocusOut(event: FocusEvent) {
    if (!open.value || event.relatedTarget !== null) return

    void nextTick(() => {
      if (!open.value) return
      if (options.menu.value?.contains(document.activeElement)) return
      focusItem(0)
    })
  }

  /* Pointerdown rather than click, so the menu is gone before whatever was
     clicked reacts to it. */
  function onDocumentPointerDown(event: Event) {
    if (!open.value) return
    if (options.root.value?.contains(event.target as Node)) return
    closeMenu(false)
  }

  onMounted(() => {
    document.addEventListener('pointerdown', onDocumentPointerDown)
    document.addEventListener('keydown', onDocumentKeydown)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    document.removeEventListener('keydown', onDocumentKeydown)
  })

  return {
    open,
    openMenu,
    closeMenu,
    toggle,
    focusItem,
    onTriggerKeydown,
    onMenuKeydown,
    onMenuFocusOut,
  }
}
