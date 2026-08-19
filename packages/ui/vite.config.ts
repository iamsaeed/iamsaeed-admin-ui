import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    lib: {
      // Two entries: the design system, and the ported screens. Keeping them
      // separate means an app that never imports a view doesn't ship one.
      entry: {
        'admin-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        views: fileURLToPath(new URL('./src/views.ts', import.meta.url)),
      },
      formats: ['es'],
    },
    // Peers stay external so a consumer never ends up with two Vues.
    rollupOptions: { external: ['vue', 'vue-router'] },
  },
})
