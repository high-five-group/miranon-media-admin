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
