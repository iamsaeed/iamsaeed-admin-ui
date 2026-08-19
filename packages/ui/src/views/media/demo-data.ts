import type { MediaItem } from './MediaGridView.vue'

/** Swatches stand in for real thumbnails; every one is a token-derived colour. */
export const IMAGES: MediaItem[] = [
  { id: 1, name: 'hero-launch.jpg', meta: '2400×1600 · 840 KB', swatch: 'linear-gradient(135deg, var(--lm-c1), var(--lm-c2))' },
  { id: 2, name: 'team-offsite.jpg', meta: '1920×1080 · 512 KB', swatch: 'linear-gradient(135deg, var(--lm-c3), var(--lm-c4))' },
  { id: 3, name: 'product-shot.png', meta: '1200×1200 · 288 KB', swatch: 'linear-gradient(135deg, var(--lm-c5), var(--lm-c1))' },
  { id: 4, name: 'og-default.png', meta: '1200×630 · 96 KB', swatch: 'linear-gradient(135deg, var(--lm-c2), var(--lm-c4))' },
  { id: 5, name: 'avatar-elena.jpg', meta: '512×512 · 44 KB', swatch: 'linear-gradient(135deg, var(--lm-c4), var(--lm-c3))' },
  { id: 6, name: 'diagram-arch.svg', meta: 'vector · 18 KB', swatch: 'linear-gradient(135deg, var(--lm-c1), var(--lm-c5))' },
]

export const VIDEOS: MediaItem[] = [
  { id: 21, name: 'onboarding-walkthrough.mp4', meta: '2:14 · 48 MB' },
  { id: 22, name: 'launch-teaser.mp4', meta: '0:30 · 12 MB' },
  { id: 23, name: 'webinar-q3.mp4', meta: '48:02 · 1.2 GB' },
]

export const DOCUMENTS: MediaItem[] = [
  { id: 31, name: 'brand-guidelines.pdf', meta: '24 pages · 4.1 MB' },
  { id: 32, name: 'press-kit.zip', meta: '18 files · 62 MB' },
  { id: 33, name: 'q3-report.xlsx', meta: '6 sheets · 340 KB' },
  { id: 34, name: 'contract-template.docx', meta: '9 pages · 88 KB' },
]
