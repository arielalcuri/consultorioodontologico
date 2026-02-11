import { defineConfig } from 'vite'
import vue from '@vitejs/vue'

// https://vitejs.dev/config/
export default defineConfig({
  // Esta línea es la más importante para GitHub Pages
  base: '/consultorioodontologico/', 
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})