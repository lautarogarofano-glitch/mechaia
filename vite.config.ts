import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        name: 'MechaIA — Asistente de diagnóstico',
        short_name: 'MechaIA',
        description: 'Asistente IA para diagnóstico mecánico de vehículos. Cargá el auto, conversá con la IA y obtené un plan de reparación.',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        categories: ['productivity', 'utilities', 'business'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Excluir API y rutas de Supabase del cache (siempre online)
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.simpleicons\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'brand-logos-simpleicons',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/www\.google\.com\/s2\/favicons/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'brand-logos-favicons',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // habilitar manualmente para testing local del SW
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
