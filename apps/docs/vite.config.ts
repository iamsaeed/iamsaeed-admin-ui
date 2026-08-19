import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      // Point at source, not dist — the docs app is how we develop the
      // library, so HMR must reach the package's own .vue files.
      '@iamsaeed/admin-ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
      '@ui': fileURLToPath(new URL('../../packages/ui/src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5200,
    // vendor/ and node_modules watching is what blew the inotify limit before.
    watch: { ignored: ['**/node_modules/**', '**/dist/**'] },
  },
})
