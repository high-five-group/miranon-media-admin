import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Notisfamiljen — axe-svepet över de FYRA ytor som ännu inte hade en egen
 * axe-skan (TASK-285.9, AC #1). Familjen har SJU ytor totalt
 * (`docs/reference/` — se kortets egen tabell); de återstående tre är REDAN
 * axe-skannade och skanas INTE om här (dubbelarbete utan nytt bevisvärde,
 * samma princip som `InstallPrompt.spec.ts`s filhuvud):
 *
 * - `meddelanderutan` (alla fyra intents + knapprad/kryss-varianter):
 *   `primitives.spec.ts` ("MessageBox — sektion") + `MessageBox.spec.ts`.
 * - `appfel-sidan` (båda formerna — inbäddad och skarp): `primitives.spec.ts`
 *   ("AppError — appfel-sidan").
 *
 * DENNA FIL täcker de fyra som saknade en skan: `Notis`-primitivens två
 * konsumenter (Uppdateringsnotis, OfflineIndicator) och `MessageBox`s två
 * assertiva konsumenter i sina EGNA monteringspunkter, inte bara primitivens
 * demo-sektion (ChunkBanner, SectionError — båda felläges-varianter).
 *
 * METOD PER YTA: samma händelse-simulering som respektive
 * `webblasarbeteende`-syskonfil redan etablerat (lagergränsen testas troget,
 * ingen genväg) — se den filens docblock för fulla skälet:
 * - Uppdateringsnotis: `mm:app-uppdatering-tillganglig` (samma retry-loop
 *   som `app-update-banner.test.ts`).
 * - OfflineIndicator: `window.dispatchEvent(new Event('offline'))` (samma
 *   som `offline-notis.test.ts` — `onlineManager` läser bara webbläsarens
 *   egna online/offline-events, aldrig `navigator.onLine` direkt).
 * - ChunkBanner: `vite:preloadError` (samma som `app-chunk-laddningsfel.test.ts`).
 * - SectionError: `/dev/sektionsfel`s egna feltrigger-knappar (samma som
 *   `section-error-chunk-fel.test.ts`), ETT test per felläge (vanligt fel
 *   och chunk-fel bär olika rubrik/brödtext/knapp, TASK-285.7/285.8).
 *
 * TASK-285.13 (öppet, hos Marcus): vid ett chunk-fel på en RIKTIG
 * autentiserad sida monteras `ChunkBanner` (AppShell) och `SectionError`
 * (routens defaultErrorComponent) SAMTIDIGT, båda `role="alert"`, båda med
 * knappnamnet "Ladda om" — två fyllda alert-regioner med identiskt
 * tillgängligt namn. `/dev/sektionsfel` (denna fils SectionError-tester)
 * ligger UTANFÖR `AppShell` och monterar därför INTE `ChunkBanner` —
 * kollisionen kan alltså inte uppstå i just detta test. Den är inte löst
 * här (kortets egen instruktion: mät, bygg inte runt) — se PR-beskrivningen
 * för var den mättes.
 */

const NOTIS_REGION = '[data-testid="app-update-banner"]';
const NOTIS_LADDA_OM = '[data-testid="app-update-reload"]';
const OFFLINE_REGION = '[data-testid="offline-banner"]';
const OFFLINE_KORT = '[data-testid="offline-notis"]';
const CHUNK_REGION = '[data-testid="app-reload-required-banner"]';
const CHUNK_LADDA_OM = '[data-testid="app-reload-required-reload"]';

/** Skjuter appens uppdaterings-event UPPREPAT (samma retry-loop som syskonfilerna). */
async function skjutAppUppdatering(page: Page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-update-reload"]')) {
        return true;
      }
      window.dispatchEvent(new CustomEvent('mm:app-uppdatering-tillganglig'));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
}

/** Skjuter Vites `vite:preloadError` UPPREPAT (samma retry-loop som syskonfilen). */
async function skjutPreloadError(page: Page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-reload-required-reload"]')) {
        return true;
      }
      window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
}

test.describe('Uppdateringsnotis — axe-core 0 violations', () => {
  test('synlig notis (Ladda om / Inte nu), 0 violations', async ({ page, checkA11y }) => {
    await skjutAppUppdatering(page);
    await expect(page.locator(NOTIS_LADDA_OM)).toBeVisible();
    await checkA11y({ include: [NOTIS_REGION] });
  });
});

test.describe('OfflineIndicator — axe-core 0 violations', () => {
  test('synligt offline-besked, 0 violations', async ({ page, checkA11y }) => {
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.locator(OFFLINE_KORT)).toBeVisible();
    await checkA11y({ include: [OFFLINE_REGION] });
  });

  test('staplad (offline + uppdaterings-notisen samtidigt synliga), 0 violations', async ({
    page,
    checkA11y,
  }) => {
    // Båda notiserna samtidigt (TASK-285.6 AC #4) — inget nytt DOM-mönster,
    // men ett läge där TVÅ live-regioner bär innehåll samtidigt: axe ska
    // fortfarande ge noll violations över dem tillsammans.
    await skjutAppUppdatering(page);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.locator(OFFLINE_KORT)).toBeVisible();
    await expect(page.locator(NOTIS_LADDA_OM)).toBeVisible();
    await checkA11y({ include: [OFFLINE_REGION, NOTIS_REGION] });
  });
});

test.describe('ChunkBanner — axe-core 0 violations', () => {
  test('synlig omladdnings-uppmaning, 0 violations', async ({ page, checkA11y }) => {
    await skjutPreloadError(page);
    await expect(page.locator(CHUNK_LADDA_OM)).toBeVisible();
    await checkA11y({ include: [CHUNK_REGION] });
  });
});

test.describe('SectionError — axe-core 0 violations (TASK-285.7/285.8)', () => {
  test.use({ devPagePath: '/dev/sektionsfel' });

  test('ett vanligt fel ("Försök igen"), 0 violations', async ({ page, checkA11y }) => {
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Den här delen kunde inte visas' });
    await expect(alert).toBeVisible();
    await checkA11y();
  });

  // Chunk-grenen bär INGEN åtgärdsknapp sedan TASK-285.13 (chunk-bannern
  // äger "Ladda om") — axe-golvet gäller ändå, knapplös ruta som knapprad.
  test('ett chunk-fel (utan åtgärdsknapp), 0 violations', async ({ page, checkA11y }) => {
    await page.getByRole('button', { name: 'Kasta chunk-fel' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Den här delen behöver laddas om' });
    await expect(alert).toBeVisible();
    await checkA11y();
  });
});
