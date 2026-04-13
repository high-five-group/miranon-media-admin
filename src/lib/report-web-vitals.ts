import { type Metric, onCLS, onINP, onLCP } from 'web-vitals';

/**
 * [GA] Core Web Vitals → Sentry/sendBeacon.
 *
 * Fas 0: rapporterar till en placeholder-endpoint via sendBeacon (fallback fetch).
 * Fas 7: byts till Sentry Performance Monitoring-transport.
 */
function send(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });

  // [GA] TODO Fas 7: byt till Sentry-transport
  const endpoint = '/api/web-vitals';

  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon(endpoint, body);
    return;
  }

  void fetch(endpoint, {
    body,
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {
    // Tyst fallback i dev — Sentry-transporten tar över i Fas 7
  });
}

export function reportWebVitals(): void {
  onCLS(send);
  onINP(send);
  onLCP(send);
}
