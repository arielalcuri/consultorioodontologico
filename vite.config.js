import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // Esta línea es la más importante para GitHub Pages
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})