import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Installera appen — visual-baslinje-FÖRBEREDELSE (TASK-299.9 AC #4).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR — se `maillogg-visual.spec.ts`s
 * filhuvud (samma kort, samma regel, samma `CONTRIBUTING.md` §
 * Visuell regression-hänvisning): ingen `-linux.png` checkas in av denna
 * skiva.
 *
 * YTAN: den PROMOVERADE sidramen (`SidRam`, kant-i-kant-dialekten,
 * TASK-299.9) på den RIKTIGA, autentiserade routen `/mer/installera-appen`
 * — INTE `/dev/installera-appen` (den dev-guardade demo-routen som
 * `webblasarbeteende`/a11y-sviterna använder för att slippa AppShell/auth):
 * den här filen bevisar i stället PIXLARNA i den RIKTIGA `AppShell`-
 * kontexten, samma princip som `offline-visual.spec.ts` väljer `/hem`
 * i stället för en isolerad dev-route.
 *
 * NOLL NÄTVERKSANROP (`InstalleraAppen` är en statisk vy, se
 * `InstalleraAppen.tsx`s filhuvud) — inget `network.use()` behövs.
 *
 * DESKTOP + MOBIL: samma spec körs under BÅDA `visual-desktop` (1440×900)
 * och `visual-mobile` (375×812) via projektmatrisen i `playwright.config.ts`.
 */
test('installera appen (SidRam-sidkrom, default fallback-guidning) — /mer/installera-appen', async ({
  page,
}) => {
  await page.goto('/mer/installera-appen');
  await expect(page.getByRole('heading', { level: 1, name: 'Installera appen' })).toBeVisible();
  await expect(page.getByText('Leta efter en installationsikon')).toBeVisible();

  await expect(page).toHaveScreenshot('installera-appen-default.png', { fullPage: true });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782. De tre
 * `<details>`-korten (`InstalleraAppen.tsx` § "Andra enheter") bär en STATISK
 * `border-border` (verifierat, noll `contrast-more:`-träffar i filen) — redan
 * synlig i normalläget. Grinden bevisar att den befintliga gränsen förblir
 * renderad (solid, bredd > 0) under förstärkt kontrast, plus en fullsides
 * pixel-baseline (samma idiom som filens ordinarie test ovan) och axe 0.
 */
test('installera appen — hög-kontrast-läge (prefers-contrast: more)', async ({ page }) => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  await page.emulateMedia({ contrast: 'more' });
  await page.goto('/mer/installera-appen');
  await expect(page.getByRole('heading', { level: 1, name: 'Installera appen' })).toBeVisible();
  await expect(page.getByText('Leta efter en installationsikon')).toBeVisible();

  const detaljer = page.locator('details').first();
  const kant = await detaljer.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bredd: s.borderTopWidth, stil: s.borderTopStyle };
  });
  expect(kant.stil).toBe('solid');
  expect(Number.parseFloat(kant.bredd)).toBeGreaterThan(0);

  const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
  expect(resultat.violations).toEqual([]);

  await expect(page).toHaveScreenshot('installera-appen-kontrast.png', { fullPage: true });
});
