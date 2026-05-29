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
      build: {
        // Optimisation des chunks pour réduire la taille
        rollupOptions: {
          output: {
            manualChunks: {
              // Séparer les grosses dépendances
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'date-vendor': ['date-fns'],
              'pdf-vendor': ['jspdf', 'html2canvas'],
              'ui-vendor': ['lucide-react', 'sonner'],
            }
          }
        },
        // Augmenter la limite de warning pour les chunks
        chunkSizeWarningLimit: 1000,
        // Optimisation de la minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production',
          }
        }
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
            theme_color: '#6366f1',
            background_color: '#080b14',
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
            // Ne pas précacher les fichiers de développement
            navigateFallback: null,
            navigateFallbackDenylist: [/^\/@/, /^\/node_modules/, /supabase\.co/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkOnly',
                options: {
                  cacheName: 'supabase-api',
                }
              },
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
        // La clé Gemini a été retirée du frontend pour des raisons de sécurité.
        // Utilisez Supabase Edge Functions.
      },
      envPrefix: 'VITE_',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
