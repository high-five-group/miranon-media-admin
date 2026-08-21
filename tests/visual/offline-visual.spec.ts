import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * OfflineIndicator — visual-baslinje-FÖRBEREDELSE (TASK-285.9, AC #6).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR — se `notis-visual.spec.ts`s
 * filhuvud för den fullständiga motiveringen (samma kort, samma regel,
 * samma `CONTRIBUTING.md` § Visuell regression-hänvisning): ingen
 * `-linux.png` checkas in av denna skiva.
 *
 * YTAN: offline-beskedet (`OfflineIndicator`, TASK-285.6) på en RIKTIG
 * autentiserad sida (`/hem`) — komponenten lever bara i `AppShell` (det
 * inloggade skalet), så `/hem` är den enda skarpa ytan där den kan
 * fotograferas (till skillnad från `/dev/primitives`, som monterar den
 * separat för sitt eget beteende-syfte).
 *
 * TRIGGERN: samma `window` `offline`-event som `offline-notis.test.ts`
 * (se den filens filhuvud för varför en syntetisk dispatch och inte
 * `context.setOffline()`: TanStacks `onlineManager` läser bara webbläsarens
 * egna online/offline-events, aldrig `navigator.onLine` direkt).
 */
test('offline (OfflineIndicator) — /hem, "Du är offline" synligt', async ({ page }) => {
  await page.goto('/hem');
  await expect(page.getByText('Lotta').first()).toBeVisible();

  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.locator('[data-testid="offline-notis"]')).toBeVisible();

  await expect(page).toHaveScreenshot('offline-indicator.png', { fullPage: true });
});
