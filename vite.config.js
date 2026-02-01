import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { version } from './package.json'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(version)
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'mask-icon.svg',
        'bg-skyjo.png',
        'info_premium.png',
        '*.png', // Logos and card backs in root/public
        '*.jpg',
        '*.svg',
        'avatars/*.png', // Avatars
        'Sounds/*.mp3',  // Game sounds
        'Music/*.mp3'    // Background music
      ],
      manifest: {
        name: 'SkyBrick - Modern Breakout',
        short_name: 'SkyBrick',
        description: 'L\'expérience de Casse-Briques moderne et sociale. Détruisez les briques, collectez des bonus et affrontez vos amis.',
        version: '1.0.1',
        theme_color: '#00f2ff',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192-v5.png?t=' + Date.now(),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512-v5.png?t=' + Date.now(),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})

