import { expect, test } from './support/hermetic';

/**
 * Hem-vyn i den frusna fixturvärlden (task-36.7 steg 1-spiken).
 *
 * Spikens fråga: kan en AUTENTISERAD vy renderas hermetiskt med stabila
 * pixlar — seedad session + mockade EF-svar + pinnade typsnitt + frusen
 * klocka, utan ett enda anrop utanför localhost? Detta spec-fil är samtidigt
 * den första skarpa visual-specen: skarven bär verklig postur (L326-lärdomen
 * om spikes), inte en förenklad dev-route.
 */

test('hem — översikten ur den frusna fixturvärlden', async ({ page }) => {
  await page.goto('/hem');

  // Fixtur-förankrad synlighet före skottet: hälsningen bevisar seedad
  // session (display_name ur sessionen), eventnamnet bevisar mockad EF-data.
  await expect(page.getByText('Lotta')).toBeVisible();
  await expect(page.getByText('Utbildning Skövde').first()).toBeVisible();

  await expect(page).toHaveScreenshot('hem.png', { fullPage: true });
});
