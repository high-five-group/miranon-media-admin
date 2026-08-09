import * as Sentry from '@sentry/react';
import { env } from '@/env';

// Klient-side Sentry-init. Anropas från main.tsx FÖRE React mountas
// så att tidiga fel (env-validering, root-element-fel, ...) fångas.
//
// DSN-strategi: klient-DSN (publik per Gate A1 alternativ A). Säkrast
// eftersom hela klient-bundlen är publik ändå. Backend-proxy var
// alternativ B men avfärdades som overkill.
//
// Init körs ENDAST i production + staging:
//   - Lokal dev (MODE=development): skip — fel är förväntade och
//     skulle bara spam:a Sentry-quota
//   - Saknad DSN: skip + console.warn — appen fortsätter fungera
//
// K7-respekt: requestId från Edge Function-fel kan kopplas via
// Sentry.setContext('request', { requestId }) när klienten fångar
// 5xx-respons från backend. Strukturen håller även när requestId
// flyttas till audit_log (06b §C1) post-S-track.

export function initSentry(): void {
  // Lokal dev → skip
  const isProd = import.meta.env.PROD;
  const isStaging = import.meta.env.MODE === 'staging';
  if (!isProd && !isStaging) return;

  if (!env.VITE_SENTRY_DSN) {
    console.warn('[sentry] VITE_SENTRY_DSN not set - skipping init');
    return;
  }

  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // 10% sampling — annars bränner staging/prod-trafik kvotan snabbt.
    tracesSampleRate: 0.1,
    // PII-scrubbing: skicka inte automatiskt email/cookies/IP.
    sendDefaultPii: false,
    // Filter-hook: släng kända icke-actionable fel innan de når Sentry.
    beforeSend(event, hint) {
      const original = hint.originalException;

      // 4xx-statuskoder från fetch/HttpError är klient-fel, inte
      // server-side-bugg. Skall inte räknas som "fel att åtgärda".
      if (original && typeof original === 'object') {
        const maybeStatus = (original as { status?: unknown }).status;
        if (typeof maybeStatus === 'number' && maybeStatus >= 400 && maybeStatus < 500) {
          return null;
        }
      }

      // Kända icke-actionable React/browser-noise.
      const message = event.message ?? event.exception?.values?.[0]?.value ?? '';
      if (typeof message === 'string') {
        if (message.includes('ResizeObserver loop limit exceeded')) return null;
        if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return null;
        }
        // Network errors från avbruten fetch (user navigerar bort etc.)
        if (message === 'Load failed' || message === 'Failed to fetch') return null;
      }

      return event;
    },
  });
}

// Hjälpfunktion för att rapportera Edge Function-fel med requestId.
// Klienten kan anropa denna i sin fetch-error-handler för att binda
// frontend-context till backend-loggens requestId.
//
// K7-not: framtida audit_log (06b §C1) kan ta emot samma requestId
// utan API-ändring av denna helper.
export function reportEdgeFunctionError(
  error: unknown,
  requestId: string | undefined,
  endpoint: string,
): void {
  Sentry.withScope((scope) => {
    if (requestId) {
      scope.setContext('request', { requestId });
      scope.setTag('requestId', requestId);
    }
    scope.setTag('edgeFunction', endpoint);
    Sentry.captureException(error);
  });
}
