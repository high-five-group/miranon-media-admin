import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Validera env-variabler vid uppstart — kraschar direkt om något saknas.
import './env';

import './styles/base.css';
import './styles/tailwind.css';

import { reportWebVitals } from './lib/report-web-vitals';
import { initSentry } from './observability/sentry';

// M7: initiera Sentry FÖRE React mountas så att tidiga fel
// (env-validering, root-element-fel, ...) fångas. Skip i lokal dev.
initSentry();

function App() {
  return (
    <main className="min-h-screen bg-bg p-8 font-sans">
      <h1 className="text-4xl text-primary">Miranon Media Admin</h1>
      <p className="mt-4 text-body text-text-secondary">Fas 0 — projektsetup klar.</p>
    </main>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root-elementet #root saknas i index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// [GA] Registrera service worker (tom skelett i Fas 0, Workbox i Fas 5)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Tyst fallback — service workern utökas med Workbox i Fas 5
    });
  });
}

// [GA] Rapportera Core Web Vitals
reportWebVitals();
