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
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782.
 *
 * UPPGRADERAD TILL TOKEN-PROBE (TASK-317, Marcus-beslut 2026-08-24): de tre
 * `<details>`-korten (`InstalleraAppen.tsx` § "Andra enheter") bar tidigare
 * en STATISK `border-border`, redan synlig i normalläget, så grinden kunde
 * bara bevisa att gränsen förblev renderad (solid, bredd > 0), inte att
 * kontrastläget faktiskt gjorde något. TASK-317 lade till
 * `contrast-more:border-border-strong` på de tre korten — samma token-kedja
 * (`--mm-border-strong`) dörrlistans/`AnmalningarSida.tsx`s referens prövar.
 * Probeteknik identisk med `anmalningssidan-promoverings-grind.spec.ts`:
 * DOM-löst token jämfört mot den faktiskt renderade kantfärgen, plus en
 * fullsides pixel-baseline (samma idiom som filens ordinarie test ovan) och
 * axe 0.
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
    return { bredd: s.borderTopWidth, stil: s.borderTopStyle, farg: s.borderTopColor };
  });
  expect(kant.stil).toBe('solid');
  expect(Number.parseFloat(kant.bredd)).toBeGreaterThan(0);

  const strongToken = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--mm-border-strong)';
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  expect(kant.farg).toBe(strongToken);

  const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
  expect(resultat.violations).toEqual([]);

  await expect(page).toHaveScreenshot('installera-appen-kontrast.png', { fullPage: true });
});
