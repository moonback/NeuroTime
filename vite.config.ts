import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192x192.png', 'icon-512x512.png'],
          manifest: {
            name: 'NeuroTime - Gestion Personnelle',
            short_name: 'NeuroTime',
            description: 'Application de gestion personnelle pour freelances - Suivi de missions et statistiques',
            theme_color: '#008CFF',
            background_color: '#0f172a',
            display: 'standalone',
            orientation: 'any',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any'
              }
            ],
            shortcuts: [
              {
                name: 'Nouvelle mission',
                short_name: 'Mission',
                description: 'Créer une nouvelle mission rapidement',
                url: '/?action=new-mission',
                icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Tableau de bord',
                short_name: 'Dashboard',
                description: 'Voir les statistiques',
                url: '/?view=dashboard',
                icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            // Ignorer les fichiers de développement Vite
            globIgnores: ['**/node_modules/**/*', '**/@vite/**/*', '**/@react-refresh/**/*'],
            // Désactiver les warnings en développement
            mode: mode === 'development' ? 'development' : 'production',
            // Ne pas précacher les fichiers de développement
            navigateFallback: null,
            navigateFallbackDenylist: [/^\/@/, /^\/node_modules/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 // 1 heure
                  },
                  networkTimeoutSeconds: 10
                }
              },
              {
                urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'nominatim-cache',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 // 1 jour
                  },
                  networkTimeoutSeconds: 5
                }
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
            // Réduire les warnings en développement
            suppressWarnings: true
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      envPrefix: 'VITE_',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
