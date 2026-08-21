import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * PROMOVERINGS-GRINDEN (TASK-285.1, ADR-103 B4) — ariaSnapshot-referens för
 * uppdateringsnotisen, FÅNGAD FÖRE FLIPPEN.
 *
 * FACIT-LÅSNINGEN: `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`
 * (yta `uppdateringsnotis`, amenderad 2026-08-21 — ingen kontur, familjeregel).
 * Marcus, verbatim (samma manifest, `lasning`-fältet): *"Ja notisen är sjukt
 * mycket bättre än det vi har idag. Vi kör på det. Bygg skarpt."*
 *
 * TVÅFASPROCESSEN (ADR-103 B4: "ta referensen FÖRE flippen, flippa, verifiera
 * identisk efter"):
 *
 * 1. Referensen ('referens (variant-läget, FÖRE flippen)' nedan) fångades mot
 *    den worktree-lokala PRE-FLIP-koden — `AppUpdateBanner.tsx` gated ännu
 *    `Uppdateringsnotis` bakom `?variant=1`, och `Uppdateringsnotis.tsx` hade
 *    ännu inte extraherats till `Notis`-primitiven. Fångad via
 *    `git stash` av de två redan påbörjade refaktoreringsfilerna, en körning
 *    med `--update-snapshots`, och `git stash pop` (ingen kod förlorad,
 *    bara temporärt overkat under fångsten). `.aria.yml`-filen som
 *    resulterade är den checkade referensen nedan.
 * 2. Flippen (villkoret i `AppUpdateBanner.tsx` flippat + extraktionen till
 *    `Notis`-primitiven) landar i SAMMA commit som denna fil.
 * 3. 'promoverad (utan ?variant, EFTER flippen)' nedan navigerar till den
 *    NYA, ovillkorliga vägen (ingen query-param alls) och jämför mot EXAKT
 *    SAMMA referensfil — grön här bevisar att flippen + Notis-extraktionen
 *    inte ändrade ett enda strukturellt eller namngivet drag.
 * 4. 'stale ?variant=1 fortsätter peka på identisk form' — `?variant`-grenen
 *    RIVS INTE förrän Marcus godkänt (ADR-102 B3, `check-facit.sh`), så en
 *    gammal bokmärkt `?variant=1&data=ny-version`-länk måste fortsätta
 *    rendera EXAKT samma form. Samma mönster som
 *    `atgardssida-promoverings-grind.spec.ts` (TASK-171.5) och
 *    `segment.tsx` (TASK-249.5) redan etablerat för sina ytor.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (ADR-103 B4): deterministiskt, noll nya
 * beroenden, jämför STRUKTUR och tillgängligt namn — inte pixlar (den visuella
 * jämförelsen mot facit-bilderna är Marcus öga, TASK-285.10).
 *
 * KLASS: `webblasarbeteende`, inte `visual` (till skillnad från övriga
 * promoverings-grindar, som alla har fixturberoende data). Uppdaterings-
 * notisen har NOLL databeteende (samma klassificeringsskäl som
 * `app-update-banner.test.ts`s eget filhuvud) — `data=ny-version` tvingar
 * fram synligheten utan ett verkligt service worker-event, så ingen
 * MSW-fixturvärld eller nätverksmock behövs.
 */

const NOTIS_REGION = '[data-testid="app-update-banner"]';
const LADDA_OM = '[data-testid="app-update-reload"]';

async function oppnaAppen(page: Page) {
  // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning — sedan
  // TASK-285.3 bär /dev/primitives ytterligare två h1-rubriker längre ner
  // (AppError-fallbackens demo-sektion, facit-formen), så ett oscopat
  // getByRole('heading', { level: 1 }) blir en strict-mode-krock.
  await page.getByRole('heading', { level: 1 }).first().waitFor();
}

/**
 * Skjuter appens uppdaterings-event UPPREPAT tills knappen syns i DOM:en.
 * Samma retry-loop och samma skäl som `app-update-banner.test.ts`s
 * `skjutAppUppdatering` (en engångs synkron dispatch racar mot att
 * app-bundeln hunnit ladda sin window-lyssnare).
 */
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

test.describe('promoverings-grinden — ariaSnapshot-referens för uppdateringsnotisen (ADR-103 B4, TASK-285.1)', () => {
  test('referens (variant-läget, FÖRE flippen) — ?variant=1&data=ny-version', async ({ page }) => {
    await page.goto('/dev/primitives?variant=1&data=ny-version');
    await oppnaAppen(page);
    await expect(page.locator(LADDA_OM)).toBeVisible();
    await expect(page.locator(NOTIS_REGION)).toMatchAriaSnapshot({
      name: 'uppdateringsnotis.aria.yml',
    });
  });

  test('promoverad (utan ?variant, EFTER flippen) — identisk med referensen', async ({ page }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(NOTIS_REGION)).toMatchAriaSnapshot({
      name: 'uppdateringsnotis.aria.yml',
    });
  });

  test('stale ?variant=1 fortsätter peka på identisk form (rivningens framtida AC)', async ({
    page,
  }) => {
    await page.goto('/dev/primitives?variant=1&data=ny-version');
    await oppnaAppen(page);
    await expect(page.locator(LADDA_OM)).toBeVisible();
    await expect(page.locator(NOTIS_REGION)).toMatchAriaSnapshot({
      name: 'uppdateringsnotis.aria.yml',
    });
  });
});
