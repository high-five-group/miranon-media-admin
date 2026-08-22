import { expect, test } from '../support/fixturvarld/hermetic';

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
  //
  // SCOPAD TILL h1:n (TASK-243.6). `getByText('Lotta')` var entydig när denna
  // rad skrevs, men blev strict-mode-fällande när `SenasteAktivitetKompakt.tsx`
  // landade på hem i `d794669f` (TASK-243.1): aktörsnamnen i aktivitetsblocket
  // (`<span className="font-medium">{post.actor.name}</span>`) matchar samma
  // text, så lokatorn löste ut till TRE element. Rubriken bär avsikten exakt —
  // "Hej Lotta" är hälsningen, och `display_name` är dess enda källa.
  await expect(page.getByRole('heading', { level: 1, name: 'Hej Lotta' })).toBeVisible();
  await expect(page.getByText('Utbildning Skövde').first()).toBeVisible();

  await expect(page).toHaveScreenshot('hem.png', { fullPage: true });
});
