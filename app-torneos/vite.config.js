import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // SUSTITUYE ESTO por el nombre exacto de tu repositorio en GitHub
  base: '/', 
  plugins: [
    react(),
    VitePWA({ registerType: 'autoUpdate' })
  ],
})
