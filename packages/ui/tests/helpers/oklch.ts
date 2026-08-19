/**
 * Re-export of the library's colour maths.
 *
 * The tests deliberately exercise the SHIPPED implementation rather than a
 * copy: `useTheme().setAccentHue()` depends on `maxChromaForHue()` at runtime,
 * so a bug there is a product bug, not a test-harness bug.
 */
export * from '../../src/theme/oklch'
