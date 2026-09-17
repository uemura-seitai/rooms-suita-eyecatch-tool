import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

// Offline caching is intentionally disabled so deployed updates never use a stale app shell.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations
      .filter((registration) => new URL(registration.scope).pathname === import.meta.env.BASE_URL)
      .map((registration) => registration.update()));
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((cacheName) => cacheName.startsWith('rooms-eyecatch-'))
      .map((cacheName) => caches.delete(cacheName)));
  });
}
