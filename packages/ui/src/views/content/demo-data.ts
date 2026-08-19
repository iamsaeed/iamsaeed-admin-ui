/**
 * Demo rows for the ported screens. Kept in one file, clearly named, so a
 * consumer deleting the sample data has exactly one place to look.
 */
import type { ContentRow } from './ContentListView.vue'

export const POSTS: ContentRow[] = [
  { id: 1, title: 'Designing for clarity', author: 'Marcus Tan', status: 'Published', views: '12,480', updated: '2h ago' },
  { id: 2, title: 'The case for oklch', author: 'Elena Marsh', status: 'Draft', updated: '5h ago' },
  { id: 3, title: 'Shipping a design system', author: 'Priya N.', status: 'Published', views: '8,204', updated: '1d ago' },
  { id: 4, title: 'Density without regret', author: 'Sam R.', status: 'Scheduled', updated: '2d ago' },
  { id: 5, title: 'Tokens all the way down', author: 'Marcus Tan', status: 'Published', views: '5,911', updated: '4d ago' },
  { id: 6, title: 'Retiring our old theme', author: 'Elena Marsh', status: 'Archived', views: '3,118', updated: '2w ago' },
]

export const PAGES: ContentRow[] = [
  { id: 11, title: 'About', author: 'Elena Marsh', status: 'Published', views: '44,102', updated: '3d ago' },
  { id: 12, title: 'Pricing', author: 'Priya N.', status: 'Published', views: '31,880', updated: '1w ago' },
  { id: 13, title: 'Careers', author: 'Sam R.', status: 'Draft', updated: '1w ago' },
  { id: 14, title: 'Contact', author: 'Marcus Tan', status: 'Published', views: '12,004', updated: '3w ago' },
]

export const DRAFTS: ContentRow[] = POSTS.filter((p) => p.status === 'Draft')
export const ARCHIVE: ContentRow[] = POSTS.filter((p) => p.status === 'Archived')
