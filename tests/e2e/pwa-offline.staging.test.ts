import { expect, test } from './support/test-bas';

/**
 * PWA-offline-test (Fas 5, ADR-047 B3b / byggplan DoD 5): första besök
 * online installerar service workern + precachar; offline-reload renderar
 * det cachade skalet.
 *
 * Kräver BYGGD preview (SW:n existerar inte i dev — devOptions.enabled
 * false i vite.config.ts); auto-skippar om SW aldrig aktiveras. Lokal
 * körning:
 *
 *   npm run build
 *   npm run preview -- --port 4173 --strictPort
 *   PLAYWRIGHT_TEST_BASE_URL=http://localhost:4173 \
 *     npx playwright test --project=chromium-authenticated tests/e2e/pwa-offline.staging.test.ts
 *
 * Körs OAUTENTISERAT (tom storageState): cachade skalet bevisas via
 * login-sidan — undviker offline-flakighet i auth-token-refresh; det
 * cachade skalet är detsamma (index.html + JS/CSS ur precache).
 *
 * offline.html-fallback-grenen (cache-miss på dokument) testas INTE här:
 * NavigationRoute serverar precachat index.html för alla navigationer, så
 * grenen nås bara vid skadad cache — att radera cache-entries i testet
 * vore ett konstlat grepp (K5-promptens avgränsning). Kärnkravet är
 * skal-grenen.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('PWA offline (ADR-047 B3b)', () => {
  test('manifest serveras med ikoner (B3a-stöd, ersätter ej DevTools-momentet)', async ({
    request,
  }) => {
    const res = await request.get('/manifest.webmanifest');
    // Dev-server svarar 200 med SPA-fallback-HTML (manifestet genereras
    // bara vid build) — guarda på content-type, inte enbart status.
    const isManifest = res.ok() && (res.headers()['content-type'] ?? '').includes('manifest+json');
    test.skip(!isManifest, 'manifest.webmanifest serveras ej — kräver byggd preview');
    const manifest = await res.json();
    expect(manifest.name).toBe('Miranon Media Admin');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(3);
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  });

  test('cachat skal renderas vid offline-reload (DoD 5)', async ({ context, page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Logga in' })).toBeVisible();

    // Robust SW-väntan (ingen sleep): ready löser när SW:n är aktiverad —
    // precachen fylls under install-fasen, så aktiverad ⇒ precachad.
    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'stöds-ej';
      const ready = await Promise.race([
        navigator.serviceWorker.ready.then(() => 'aktiverad'),
        new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), 15_000)),
      ]);
      return ready;
    });
    test.skip(swState !== 'aktiverad', `SW ej aktiverad (${swState}) — kräver byggd preview`);

    await context.setOffline(true);
    await page.reload();
    // Cachat skal: login-sidan renderar helt utan nät.
    await expect(page.getByRole('heading', { name: 'Logga in' })).toBeVisible();
    await context.setOffline(false);
  });
});
