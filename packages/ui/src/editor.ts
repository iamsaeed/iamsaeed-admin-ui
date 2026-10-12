/**
 * `@iamsaeed/admin-ui/editor` - the rich-text editor.
 *
 * A separate entry on purpose, like `/views`: the editor carries a text-editing engine, and an app
 * that never writes rich text should not ship it. Import it only where it is used:
 *
 *     import { RichTextEditor } from '@iamsaeed/admin-ui/editor'
 *
 * Its styles are in the main stylesheet (`@iamsaeed/admin-ui/styles`), which you already import.
 */
export { default as RichTextEditor } from './components/editor/RichTextEditor.vue'
