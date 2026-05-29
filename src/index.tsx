import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MissionProvider } from './context/MissionContext';


const unregisterDevelopmentServiceWorkers = (): void => {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistrations()
    .then(async (registrations) => {
      if (registrations.length === 0) return;

      await Promise.all(registrations.map(registration => registration.unregister()));

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(cacheName =>
              cacheName.includes('workbox') ||
              cacheName.includes('precache') ||
              cacheName.includes('google-fonts') ||
              cacheName.includes('gstatic-fonts')
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }

      const reloadKey = 'neurotime:dev-service-worker-cleaned';
      if (navigator.serviceWorker.controller && sessionStorage.getItem(reloadKey) !== 'true') {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
      }
    })
    .catch(error => {
      console.error('Erreur lors du nettoyage du service worker de développement:', error);
    });
};

unregisterDevelopmentServiceWorkers();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MissionProvider>
          <App />
        </MissionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);