import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * AppUpdateBanner — externt beteende (ADR-047 § Amendering 2026-08-13,
 * TASK-199-uppföljning, ADR-094).
 *
 * KLASSVALET ÄR INTE GODTYCKLIGT, och det avviker från uppdragets antagande
 * att "det blockerande skyddet måste ligga i acceptance-lagret".
 * Uppdaterings-bannern har NOLL databeteende: den läser ett window-event och
 * ett modul-nivå tillstånd, aldrig ett nätverkssvar. Ett sådant test
 * ÖVERLEVER när fixturvärlden töms, och `scripts/hermetik-sjalvtest.mjs`
 * (ADR-080 beslut 3) fäller därför varje sådant test som läggs i
 * acceptance-klassen. Exakt det hände `InstallPrompt`s 11 tester i TASK-131
 * (CONTRIBUTING.md § Webbläsarbeteende-klassen). Klassen `webblasarbeteende`
 * är ändå BLOCKERANDE på PR: `ci-suite.yml` jobb `webblasarbeteende`,
 * instansierat av `ci.yml` jobb `suite`, som ligger i `needs` för den enda
 * required-checken `ci-passed`. Skyddet är alltså blockerande, bara i rätt
 * klass.
 *
 * VARFÖR TESTET INTE GÅR VIA EN RIKTIG SERVICE WORKER: `vite.config.ts` sätter
 * `devOptions.enabled: false`, så SW:n existerar inte alls i dev-servern som
 * denna klass kör mot (port 5499). Bannern lyssnar därför inte på
 * vite-plugin-pwa direkt utan på appens EGET window-event
 * (`mm:app-uppdatering-tillganglig`), som mekanismlagret
 * `src/lib/app-uppdatering.ts` dispatchar ur sin `onNeedReload`-callback. Att
 * skjuta det eventet syntetiskt är alltså inte en genväg förbi mekanismen
 * utan en trogen simulering av lagergränsen — samma mönster som
 * `install-prompt.test.ts` använder för `beforeinstallprompt`.
 *
 * RETRY-LOOPEN i `skjutAppUppdatering()` finns av samma skäl som i
 * `install-prompt.test.ts`: en EN GÅNGS synkron dispatch racar mot att
 * app-bundeln (och därmed modulens window-lyssnare) hunnit laddas. Hinner
 * dispatchen först är eventet förlorat för gott. Riktiga uppdateringar
 * skjuts av en service worker långt efter boot, så fenomenet finns inte i
 * produktion; loopen gör simuleringen robust utan att ändra vad som bevisas.
 */

const BANNER = '[data-testid="app-update-banner"]';
const LADDA_OM = '[data-testid="app-update-reload"]';

/** Går till demoytan och väntar tills React bevisligen har mountat. */
async function oppnaAppen(page: Page) {
  await page.goto('/dev/primitives');
  await page.getByRole('heading', { level: 1 }).waitFor();
}

/**
 * Skjuter appens uppdaterings-event UPPREPAT tills knappen syns i DOM:en.
 * Se filhuvudet för varför en engångsdispatch inte duger.
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

test.describe('AppUpdateBanner', () => {
  // ── NEGATIVA SIDAN: inget syns i normalläget ──────────────────────────

  test('visar ingen uppdaterings-uppmaning i normalläget', async ({ page }) => {
    await oppnaAppen(page);

    // Live-regionen SKA finnas (den måste vara monterad före sitt innehåll
    // för att annonseras, MDN ARIA live regions), men vara tom på innehåll.
    await expect(page.locator(BANNER)).toHaveCount(1);
    await expect(page.locator(LADDA_OM)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ladda om' })).toHaveCount(0);
    await expect(page.locator(BANNER)).toHaveText('');
  });

  test('den tomma live-regionen tar ingen visuell plats', async ({ page }) => {
    await oppnaAppen(page);

    // En tom region utan padding/border ska inte skjuta ned sidan. Bevisar
    // att "alltid monterad" inte kostar layout i normalläget.
    const hojd = await page.locator(BANNER).evaluate((el) => el.getBoundingClientRect().height);
    expect(hojd).toBe(0);
  });

  // ── POSITIVA SIDAN: bannern syns när en ny version är aktiv ───────────

  test('visar uppmaningen när en ny version har aktiverats', async ({ page }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);

    await expect(page.locator(LADDA_OM)).toBeVisible();
    await expect(page.locator(BANNER)).toContainText('Det finns en nyare version av appen.');
    // Lotta ska förstå konsekvensen, inte bara att något finns.
    await expect(page.locator(BANNER)).toContainText('annars kan det du har skrivit försvinna');
  });

  test('meddelandet ligger i en artig live-region och stjäl inte fokus', async ({ page }) => {
    await oppnaAppen(page);

    // Fokus parkeras på ett känt element FÖRE uppdateringen dyker upp.
    await page.getByRole('heading', { level: 1 }).evaluate((el: HTMLElement) => {
      el.setAttribute('tabindex', '-1');
      el.focus();
    });

    await skjutAppUppdatering(page);

    const banner = page.locator(BANNER);
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(banner).toHaveAttribute('aria-live', 'polite');

    // MDN, ARIA status role: "Do not give focus to the status when its
    // content updates." Fokus ska alltså ligga kvar där Lotta lämnade det.
    const fokusKvar = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() ?? null,
    );
    expect(fokusKvar).toBe('h1');
  });

  test('knappen är nåbar med tangentbord och har ett begripligt namn', async ({ page }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);

    const knapp = page.getByRole('button', { name: 'Ladda om' });
    await expect(knapp).toBeVisible();

    // Ett riktigt <button>-element som går att fokusera med tangentbord.
    await knapp.focus();
    await expect(knapp).toBeFocused();
  });

  test('omladdningen sker först när användaren väljer den', async ({ page }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(LADDA_OM)).toBeVisible();

    // Kärnan i Marcus beslut: inget laddas om av sig självt. Bannern står
    // kvar tills användaren agerar.
    await page.waitForTimeout(1000);
    await expect(page.locator(LADDA_OM)).toBeVisible();

    // Och NÄR användaren trycker: sidan laddas faktiskt om. Efter
    // omladdningen är modultillståndet nollställt, så bannern är tom igen —
    // vilket är precis vad "nu kör du den nya koden" ser ut som.
    await Promise.all([page.waitForEvent('load'), page.locator(LADDA_OM).click()]);

    await page.getByRole('heading', { level: 1 }).waitFor();
    await expect(page.locator(BANNER)).toHaveCount(1);
    await expect(page.locator(LADDA_OM)).toHaveCount(0);
  });
});
