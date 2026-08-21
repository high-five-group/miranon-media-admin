import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Kraschfönstrets sista lucka — externt beteende (ADR-047 § Amendering
 * 2026-08-13 (2), TASK-199-uppföljning, ADR-094).
 *
 * VAD SOM BEVISAS: när appens gamla kod försöker hämta en del som inte längre
 * finns på servern (Vites `vite:preloadError`) får Lotta en begriplig svensk
 * uppmaning i stället för en trasig sida utan förklaring, och ingenting laddas
 * om utan att hon väljer det.
 *
 * KLASSVALET är `webblasarbeteende`, inte `acceptance`, av exakt samma skäl som
 * `app-update-banner.test.ts` (se dess filhuvud): ytan har NOLL databeteende
 * och `scripts/hermetik-sjalvtest.mjs` (ADR-080 beslut 3) fäller sådana tester
 * i acceptance-klassen. Klassen är ändå BLOCKERANDE på PR: `ci-suite.yml` jobb
 * `webblasarbeteende`, instansierat av `ci.yml` jobb `suite`, som ligger i
 * `needs` för den enda required-checken `ci-passed`.
 *
 * VARFÖR EVENTET SKJUTS SYNTETISKT OCH INTE GENOM EN BLOCKERAD CHUNK:
 * `vite:preloadError` fyras ur preload-helpern som `buildImportAnalysisPlugin`
 * injicerar, och det pluginets egen källkommentar i
 * `node_modules/vite/dist/node/chunks/node.js` lyder `"Build only. During serve
 * this is performed as part of ./importAnalysis."` Dev-servern som denna klass
 * kör mot (port 5499) serverar varje modul separat via native ESM och har
 * ingen preload-helper att fela i. Att blockera en modul-URL i dev hade alltså
 * INTE producerat eventet, utan ett annat fel via en annan väg, och testet
 * hade bevisat något annat än det påstår. Eventet som skjuts här konstrueras
 * med `new Event('vite:preloadError', { cancelable: true })` — samma
 * konstruktor, samma namn och samma `cancelable`-flagga som Vites egen kod
 * använder. Lagergränsen testas därmed troget; samma mönster som
 * `install-prompt.test.ts` (`beforeinstallprompt`) och
 * `app-update-banner.test.ts`.
 *
 * RETRY-LOOPEN finns av samma skäl som i de två syskontesterna: en engångs
 * synkron dispatch racar mot att app-bundeln (och därmed modulens
 * window-lyssnare i `src/lib/chunk-laddningsfel.ts`) hunnit laddas. I
 * produktion sker felet vid en navigering långt efter boot, så fenomenet finns
 * inte där.
 *
 * PLACERINGEN (TASK-285.5, ADR-121 beslut 3): bannern lever numera i
 * `src/components/AppShell/ChunkBanner.tsx`, monterad av `AppShell` som
 * första barn i det inloggade skalets `<main>` — INTE längre vid den globala
 * roten. `/dev/primitives` ligger UTANFÖR skalet och monterar därför
 * `ChunkBanner` explicit själv (se den routens egen kommentar) — enda skälet
 * är att hålla DENNA sviten vid liv för komponentens BETEENDE (ersätter,
 * staplas inte; ingen tom alert-region; eventet sväljs inte). PLACERINGEN
 * under sidans `h1` i skalet är en ANNAN egenskap och prövas i stället i
 * acceptance-klassen (`tests/acceptance/hem.acceptance.test.ts`, describe
 * "Chunk-bannern — placering i skalet").
 */

const FEL_BANNER = '[data-testid="app-reload-required-banner"]';
const FEL_LADDA_OM = '[data-testid="app-reload-required-reload"]';
const UPPDATERINGS_BANNER = '[data-testid="app-update-banner"]';
const UPPDATERINGS_LADDA_OM = '[data-testid="app-update-reload"]';

/** Nyckel på `window` där loopen parkerar sitt mätvärde, se `skjutPreloadError`. */
const PREVENTED_NYCKEL = '__mmSistaPreloadErrorPrevented';

/** Går till demoytan och väntar tills React bevisligen har mountat. */
async function oppnaAppen(page: Page) {
  await page.goto('/dev/primitives');
  // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning — sedan
  // TASK-285.3 bär /dev/primitives ytterligare två h1-rubriker längre ner
  // (AppError-fallbackens demo-sektion, facit-formen), så ett oscopat
  // getByRole('heading', { level: 1 }) blir en strict-mode-krock.
  await page.getByRole('heading', { level: 1 }).first().waitFor();
}

/**
 * Skjuter Vites `vite:preloadError` UPPREPAT tills uppmaningen syns i DOM:en.
 *
 * Loopen sparar dessutom `defaultPrevented` för VARJE dispatch på `window`, så
 * att det sista värdet före fällningen är just den dispatch som satte
 * tillståndet. Det gör `defaultPrevented`-testet nedan till ett bevis om den
 * dispatch som faktiskt hanterades, inte om en senare no-op.
 */
async function skjutPreloadError(page: Page) {
  await page.waitForFunction(
    (nyckel) => {
      if (document.querySelector('[data-testid="app-reload-required-reload"]')) {
        return true;
      }
      const preloadFel = new Event('vite:preloadError', { cancelable: true });
      window.dispatchEvent(preloadFel);
      (window as unknown as Record<string, boolean>)[nyckel] = preloadFel.defaultPrevented;
      return false;
    },
    PREVENTED_NYCKEL,
    { timeout: 15_000, polling: 50 },
  );
}

/** Skjuter appens SW-uppdaterings-event (samma som `app-update-banner.test.ts`). */
async function skjutAppUppdatering(page: Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('mm:app-uppdatering-tillganglig'));
  });
}

test.describe('Chunk-laddningsfel', () => {
  // ── NEGATIVA SIDAN: inget syns i normalläget ──────────────────────────

  test('visar ingen omladdnings-uppmaning i normalläget', async ({ page }) => {
    await oppnaAppen(page);

    // Till skillnad från den ARTIGA regionen (`app-update-banner`, som måste
    // vara monterad före sitt innehåll) monteras den ASSERTIVA först när den
    // har något att säga. MDN, ARIA alert role: rollen annonseras när
    // elementet läggs till eller blir synligt.
    await expect(page.locator(FEL_BANNER)).toHaveCount(0);
    await expect(page.locator(FEL_LADDA_OM)).toHaveCount(0);
  });

  test('lämnar ingen tom alert-region kvar i en vy som inte har några', async ({ page }) => {
    // Regressionsvakt för en MÄTT miss i första utkastet: komponenten
    // monterade sin `role="alert"` alltid, tom, och lade därmed en andra
    // alert-region i VARJE vy. Det fällde tre orelaterade tester i denna klass
    // (`glomt-losenord`, `nytt-losenord`, `valkommen`) med Playwrights
    // `strict mode violation: getByRole('alert') resolved to 2 elements`, där
    // det andra elementet var formulärets egen `MessageBox`. Testfelet var
    // bara mätinstrumentet; samma tvetydighet möter den som navigerar via
    // regioner med skärmläsare.
    //
    // Vyn är `/glomt-losenord` och inte `/dev/primitives`: demoytan
    // DEMONSTRERAR `MessageBox` och bär därför två äkta alert-regioner i
    // normalläget (mätt). Den hade gjort vakten obegriplig. Inloggningsflödets
    // vyer bär noll alerts tills något går fel, vilket är exakt den egenskap
    // som ska skyddas.
    await page.goto('/glomt-losenord');
    await page.getByRole('heading', { level: 1 }).waitFor();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator(FEL_BANNER)).toHaveCount(0);
  });

  // ── POSITIVA SIDAN: uppmaningen syns när en del inte kunde hämtas ─────

  test('visar en kortad, begriplig uppmaning när en del av appen inte kunde hämtas (AC #3)', async ({
    page,
  }) => {
    await oppnaAppen(page);
    await skjutPreloadError(page);

    await expect(page.locator(FEL_LADDA_OM)).toBeVisible();

    // Gunilla-testet: orsak, följd och åtgärd ska alla finnas i klartext.
    const banner = page.locator(FEL_BANNER);
    // Rubriken EXAKT, UTAN punkt (AC #3 — kortningen, ADR-121 beslut 3).
    await expect(banner.getByText('Sidan behöver laddas om', { exact: true })).toBeVisible();
    await expect(banner).toContainText('Appen har uppdaterats');
    await expect(banner).toContainText('en del av sidan kunde inte laddas');
    // Datasäkerheten (ADR-121 § 8, ordagrant) ska stå i texten, inte bara i vår avsikt.
    await expect(banner).toContainText(
      'Har du skrivit något som inte är sparat, kopiera det först.',
    );
    // Kortningen (AC #3): den gamla, redundanta CTA-meningen är borta —
    // knappen bär "Ladda om" ensam, ingen upprepning i brödtexten.
    await expect(banner).not.toContainText('Ladda om för att fortsätta');
  });

  test('meddelandet ligger i en assertiv live-region och stjäl inte fokus', async ({ page }) => {
    await oppnaAppen(page);

    // Fokus parkeras på ett känt element FÖRE felet inträffar.
    // .first(): se `oppnaAppen()` ovan.
    await page
      .getByRole('heading', { level: 1 })
      .first()
      .evaluate((el: HTMLElement) => {
        el.setAttribute('tabindex', '-1');
        el.focus();
      });

    await skjutPreloadError(page);

    // role="alert" har implicit aria-live="assertive" (MDN, ARIA: alert role).
    // Lotta står och väntar på ett svar som aldrig kom; det ska annonseras nu,
    // inte när det passar.
    await expect(page.locator(FEL_BANNER)).toHaveAttribute('role', 'alert');

    // MDN, ARIA alert role: rollen får inte flytta fokus. Fokus ska ligga kvar
    // där Lotta lämnade det.
    const fokusKvar = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() ?? null,
    );
    expect(fokusKvar).toBe('h1');
  });

  test('knappen är nåbar med tangentbord och har ett begripligt namn', async ({ page }) => {
    await oppnaAppen(page);
    await skjutPreloadError(page);

    // Scopad till felbannern: sedan TASK-285.3 bär /dev/primitives
    // ytterligare "Ladda om"-knappar i AppError-fallbackens demo-sektion
    // (facit-formen), permanent synliga.
    const knapp = page.locator(FEL_BANNER).getByRole('button', { name: 'Ladda om' });
    await expect(knapp).toBeVisible();

    await knapp.focus();
    await expect(knapp).toBeFocused();
  });

  // ── DESIGNBESLUTEN, var för sig bevisade ─────────────────────────────

  test('felet sväljs INTE: eventet lämnas okancellerat så Vite kastar vidare', async ({ page }) => {
    await oppnaAppen(page);
    await skjutPreloadError(page);

    // Vites preload-helper (node_modules/vite/dist/node/chunks/node.js) gör
    // `if (!e.defaultPrevented) throw err;`. Anropar vi preventDefault()
    // resolvar __vitePreload med `undefined` i stället för modulen, och
    // anroparen kraschar en rad senare med ett meddelande som inte har med
    // saken att göra. Vi låter felet gå vidare till routerns
    // defaultErrorComponent (SectionError) i stället.
    const prevented = await page.evaluate(
      (nyckel) => (window as unknown as Record<string, boolean>)[nyckel],
      PREVENTED_NYCKEL,
    );
    expect(prevented).toBe(false);
  });

  test('ingenting laddas om av sig självt, men knappen laddar om', async ({ page }) => {
    await oppnaAppen(page);
    await skjutPreloadError(page);
    await expect(page.locator(FEL_LADDA_OM)).toBeVisible();

    // Kärnan i Marcus beslut: en tvångsomladdning kan slänga bort det Lotta
    // har skrivit. Uppmaningen står kvar tills hon agerar.
    await page.waitForTimeout(1000);
    await expect(page.locator(FEL_LADDA_OM)).toBeVisible();

    await Promise.all([page.waitForEvent('load'), page.locator(FEL_LADDA_OM).click()]);

    // Efter omladdningen är modultillståndet nollställt, så uppmaningen är
    // borta igen — vilket är precis vad "nu kör du den nya koden" ser ut som.
    // .first(): se `oppnaAppen()` ovan.
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    await expect(page.locator(FEL_BANNER)).toHaveCount(0);
    await expect(page.locator(FEL_LADDA_OM)).toHaveCount(0);
  });

  test('den brådskande uppmaningen ersätter den artiga, inte staplas på den', async ({ page }) => {
    await oppnaAppen(page);

    // Först det artiga läget: "det finns en nyare version".
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
    await expect(page.locator(UPPDATERINGS_LADDA_OM)).toBeVisible();

    // Sedan det brådskande: en del kunde inte hämtas.
    await skjutPreloadError(page);
    await skjutAppUppdatering(page);

    // Två samtidiga uppmaningar att ladda om vore två frågor där det bara
    // finns en. Den brådskande vinner och den artiga tystnar.
    await expect(page.locator(FEL_LADDA_OM)).toBeVisible();
    await expect(page.locator(UPPDATERINGS_LADDA_OM)).toHaveCount(0);
    await expect(page.locator(UPPDATERINGS_BANNER)).toHaveText('');
  });
});
