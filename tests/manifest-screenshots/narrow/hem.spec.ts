import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../../support/fixturvarld/hermetic';

/**
 * Genererar manifestets STÅENDE skärmbild (TASK-126.4, AC #1 + #2).
 *
 * Körs ENDAST via `npm run generate:manifest-screenshots`
 * (PLAYWRIGHT_MANIFEST_SCREENSHOTS=1, projektet `manifest-screenshots` i
 * playwright.config.ts) — aldrig som en del av den vanliga testsviten.
 * Ingen `toHaveScreenshot`-jämförelse: filen SKA skrivas om varje körning,
 * det är hela poängen (reproducerbar generering, inte en regressions-
 * baseline).
 *
 * VYVAL: /hem — appens dashboard/översikt. Vald för att vara STABIL under
 * S93:s pågående UI-arbete (EventDetail.tsx + src/components/events/detail/*
 * — se git-loggen 2026-08-02/03): Hem rör ingen av de filerna, och har redan
 * en bevisat stabil hermetisk baseline (tests/visual/hem.spec.ts).
 *
 * VIEWPORT: samma dimensioner som visual-mobile-projektet (375×812,
 * deviceScaleFactor 2 — task-36.7 S81-beslutet) → verklig PNG-storlek
 * 750×1624, vilket är exakt `sizes`-strängen deklarerad i vite.config.ts.
 * Samma fixturvärld som visual-sviten (frusen klocka, seedad session,
 * mockade EF-svar, pinnade typsnitt) — ingen handbeskärning, ingen
 * miljöberoende pixel.
 */
test.use({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUTPUT_PATH = resolve(REPO_ROOT, 'public', 'screenshots', 'narrow-hem.png');

test('narrow — hem-vyn för installationsdialogens skärmbild', async ({ page }) => {
  await page.goto('/hem');

  // Samma synlighets-vakt som tests/visual/hem.spec.ts: hälsningen bevisar
  // seedad session, eventnamnet bevisar mockad EF-data — skottet tas aldrig
  // av en halvladdad sida.
  //
  // SCOPAD TILL h1:n (TASK-243.6, samma fix som tests/visual/hem.spec.ts —
  // denna spec-fil hade INTE fått den, TASK-311). `getByText('Lotta')` blev
  // strict-mode-fällande när `SenasteAktivitetKompakt.tsx`/bevakningsraden
  // landade på hem: aktörsnamn och bevakningsradens text matchar samma
  // sträng, så lokatorn löser ut till FLERA element. Rubriken bär avsikten
  // exakt — "Hej Lotta" är hälsningen, och `display_name` är dess enda källa.
  await expect(page.getByRole('heading', { level: 1, name: 'Hej Lotta' })).toBeVisible();
  await expect(page.getByText('Utbildning Skövde').first()).toBeVisible();

  // fullPage: false (default) — installationsdialogens skärmbild ska visa EN
  // skärm, inte en fullständigt nedskrollad sida.
  await page.screenshot({ path: OUTPUT_PATH });
});
