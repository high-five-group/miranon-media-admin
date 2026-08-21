import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * AppUpdateBanner / Uppdateringsnotis — externt beteende (ADR-047 §
 * Amendering 2026-08-13, TASK-199-uppföljning, ADR-094; ÖVERLAGRAD FORM
 * promoverad TASK-285.1, ADR-103 B2 steg 1).
 *
 * PROMOVERINGEN (2026-08-21): den överlagrade notisen (`Uppdateringsnotis`,
 * konsument av `Notis`-primitiven) var tidigare bara nåbar bakom `?variant=1`
 * i DEV. Villkoret i `AppUpdateBanner.tsx` är nu flippat: den ÄR info-lägets
 * ovillkorliga form. Den gamla banner-formen (i flödet, "Det finns en nyare
 * version av appen. Ladda om … annars kan det du har skrivit försvinna.")
 * FINNS INTE LÄNGRE i skarp kod — testerna nedan är omskrivna mot den NYA
 * copyn ("Ny version av appen" / "Ladda om när du är klar med det du gör.").
 * `?variant=1&data=ny-version` fortsätter peka på EXAKT samma form (rörs inte
 * förrän Marcus godkänt promoveringen, `check-facit.sh`) — se den separata
 * ariaSnapshot-grinden `uppdateringsnotis-promoverings-grind.test.ts` för det
 * formella beviset (ADR-103 B4).
 *
 * KLASSVALET ÄR INTE GODTYCKLIGT, och det avviker från uppdragets antagande
 * att "det blockerande skyddet måste ligga i acceptance-lagret".
 * Uppdaterings-notisen har NOLL databeteende: den läser ett window-event och
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
const NOTIS_KORT = '[data-testid="app-update-notis"]';
const LADDA_OM = '[data-testid="app-update-reload"]';
const INTE_NU = '[data-testid="app-update-inte-nu"]';

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

  // ── POSITIVA SIDAN: notisen syns när en ny version är aktiv, UTAN ?variant ──

  test('visar den överlagrade notisen när en ny version har aktiverats — ingen ?variant behövs', async ({
    page,
  }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);

    await expect(page.locator(LADDA_OM)).toBeVisible();
    // AC #2: info-lägets gamla banner-copy ("Det finns en nyare version av
    // appen. Ladda om … annars kan det du har skrivit försvinna.") finns
    // inte längre i skarp kod — detta ÄR den nya, promoverade formens copy.
    await expect(page.locator(BANNER)).toContainText('Ny version av appen');
    await expect(page.locator(BANNER)).toContainText('Ladda om när du är klar med det du gör.');
  });

  test('meddelandet ligger i en artig, namngiven live-region och stjäl inte fokus', async ({
    page,
  }) => {
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
    // AC #5: regionen har ett tillgängligt namn. `toBeVisible()` passar inte
    // här — regionen är (med avsikt) `position: fixed`-barnets FÖRÄLDER och
    // har därför själv noll utbredning även när barnet syns (samma invariant
    // som "den tomma live-regionen tar ingen visuell plats" ovan) — attributet
    // är ändå där, oavsett boundingbox.
    await expect(banner).toHaveAttribute('aria-label', 'Meddelanden om appen');
    await expect(page.getByRole('status', { name: 'Meddelanden om appen' })).toHaveCount(1);

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

    // Kärnan i Marcus beslut: inget laddas om av sig självt. Notisen står
    // kvar tills användaren agerar — och ingen timer döljer den (AC #4/#7).
    await page.waitForTimeout(1000);
    await expect(page.locator(LADDA_OM)).toBeVisible();

    // Och NÄR användaren trycker: sidan laddas faktiskt om. Efter
    // omladdningen är modultillståndet nollställt, så notisen är tom igen —
    // vilket är precis vad "nu kör du den nya koden" ser ut som.
    await Promise.all([page.waitForEvent('load'), page.locator(LADDA_OM).click()]);

    await page.getByRole('heading', { level: 1 }).waitFor();
    await expect(page.locator(BANNER)).toHaveCount(1);
    await expect(page.locator(LADDA_OM)).toHaveCount(0);
  });
});

/**
 * [TASK-285.1, AC #4] "Inte nu" — sessionsskopad avfärdning.
 *
 * Se `AppUpdateBanner.tsx`s filhuvud ("INTE NU — SESSIONSSKOPAD AVFÄRDNING")
 * för hela mekaniken: `sessionStorage` (inte React-state, inte
 * `localStorage`) bär avfärdningen, så den överlever klient-sides navigation
 * OCH en manuell sidladdning inom samma flik, men aldrig en ny flik. En NY
 * version (i praktiken: en sidladdning där modul-tillståndet startar om från
 * `false`) nollställer avfärdningen proaktivt innan den nya signalen hinner
 * komma, så den visas garanterat.
 */
test.describe('"Inte nu" (TASK-285.1)', () => {
  test('döljer notisen omedelbart, utan att ta bort den alltid monterade regionen', async ({
    page,
  }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(NOTIS_KORT)).toBeVisible();

    await page.locator(INTE_NU).click();

    await expect(page.locator(NOTIS_KORT)).toHaveCount(0);
    // Regionen själv är kvar (bara tom) — samma invariant som normalläget.
    await expect(page.locator(BANNER)).toHaveCount(1);
    await expect(page.locator(BANNER)).toHaveText('');
  });

  test('ingen timer döljer notisen någonsin — den står kvar obegränsat utan klick', async ({
    page,
  }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(NOTIS_KORT)).toBeVisible();

    await page.waitForTimeout(1500);
    await expect(page.locator(NOTIS_KORT)).toBeVisible();
  });

  test('överlever klient-sides navigation (samma flik, ingen sidladdning)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('heading', { level: 1, name: 'Välkommen tillbaka' }).waitFor();
    await skjutAppUppdatering(page);

    await page.locator(INTE_NU).click();
    await expect(page.locator(BANNER)).toHaveText('');

    // Klient-sides navigation via en RIKTIG <Link> (TanStack Router fångar
    // klicket — ingen sidladdning, modul-tillståndet lever kvar).
    await page.getByRole('link', { name: 'Glömt lösenord?' }).click();
    await page.getByRole('heading', { level: 1, name: 'Glömt lösenord?' }).waitFor();
    await expect(page.locator(BANNER)).toHaveText('');

    // Om navigeringen HADE trigg­at en omontering av `AppUpdateBanner` (t.ex.
    // en regression där ruttbytet av misstag remonterar roten) skulle
    // avfärdningen ha nollställts, och en förnyad dispatch hade då visat
    // notisen igen. Att den INTE gör det bevisar att komponenten aldrig
    // omonterades och att avfärdningen faktiskt överlevde — inte bara att
    // ingenting hände.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mm:app-uppdatering-tillganglig'));
    });
    await expect(page.locator(BANNER)).toHaveText('');
  });

  test('skriver avfärdningen till sessionStorage (inte bara React-state)', async ({ page }) => {
    // Mekanism-nivå, inte bara beteende: `AppUpdateBanner` monteras EN gång
    // vid app-roten och överlever normal klient-sides navigation ändå — så
    // ett beteendetest som bara kollar "syns notisen efter navigering" kan
    // inte i sig skilja en sessionStorage-skrivning från ren React-state.
    // Detta test läser nyckeln direkt och bevisar att SKRIVNINGEN sker,
    // vilket är vad som gör avfärdningen tålig mot en manuell sidladdning
    // (F5) — ett fall ren React-state inte överlever.
    await oppnaAppen(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(BANNER)).not.toHaveText('');

    await page.locator(INTE_NU).click();

    const varde = await page.evaluate(() => sessionStorage.getItem('mmUppdateringsnotisAvfardad'));
    expect(varde).toBe('1');
  });

  test('en NY version efter en sidladdning visar notisen igen, trots tidigare avfärdning', async ({
    page,
  }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);
    await page.locator(INTE_NU).click();
    await expect(page.locator(BANNER)).toHaveText('');

    // En sidladdning (inte "Ladda om"-knappen — vilken sidladdning som helst)
    // nollställer modultillståndet. `uppdateringFinns` startar om som
    // `false`, vilket per AppUpdateBanner.tsx:s effekt nollställer den
    // kvarliggande `sessionStorage`-avfärdningen INNAN nästa signal hinner
    // komma.
    await page.reload();
    await page.getByRole('heading', { level: 1 }).waitFor();
    await expect(page.locator(BANNER)).toHaveText('');

    // "Nästa NYA version": en förnyad dispatch ska nu visa notisen igen,
    // inte förbli dold av den gamla avfärdningen.
    await skjutAppUppdatering(page);
    await expect(page.locator(NOTIS_KORT)).toBeVisible();
    await expect(page.locator(BANNER)).toContainText('Ny version av appen');
  });
});

/**
 * [TASK-285.1, AC #3] Layoutförskjutningen vid visning är 0 — mätt med
 * `PerformanceObserver` för `layout-shift`, samma metod som forskningspasset
 * (`docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`
 * § "A/B mot en överlagrad form": "noll skiften registrerade" för den
 * överlagrade formen, mot 0,0376–0,1469 för den gamla flödes-bannern).
 */
test.describe('TASK-285.1 — layoutförskjutningen vid visning är 0 (AC #3)', () => {
  async function matCLS(page: Page, viewport: { width: number; height: number }) {
    await page.setViewportSize(viewport);
    await oppnaAppen(page);

    // Observatören startas EFTER att sidan lugnat sig (heading redan
    // väntad i oppnaAppen), så bara notisens EGNA förskjutning fångas.
    await page.evaluate(() => {
      (window as unknown as { __mmClsSum: number }).__mmClsSum = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as Array<{
          value: number;
          hadRecentInput: boolean;
        }>) {
          if (!entry.hadRecentInput) {
            (window as unknown as { __mmClsSum: number }).__mmClsSum += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: false } as PerformanceObserverInit);
    });

    await skjutAppUppdatering(page);
    await expect(page.locator(NOTIS_KORT)).toBeVisible();

    const cls = await page.evaluate(() => (window as unknown as { __mmClsSum: number }).__mmClsSum);
    expect(cls).toBe(0);
  }

  test('390 px (mobil)', async ({ page }) => {
    await matCLS(page, { width: 390, height: 844 });
  });

  test('1280 px (desktop)', async ({ page }) => {
    await matCLS(page, { width: 1280, height: 800 });
  });
});

/**
 * [TASK-285.1, AC #1 + #7] Facit-formen (strukturella, mätbara drag) — den
 * VISUELLA jämförelsen pixel mot facit-bilderna är Marcus öga (TASK-285.10);
 * detta bevisar de drag facit-manifestet skriver ut i klartext:
 * `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`
 * ("fast bredd max 22 rem, fixed right-4/sm:right-6 bottom-24 … INGEN kontur
 * … border-l-4 border-info").
 */
test.describe('TASK-285.1 — facit-formens strukturella drag (AC #1, #7)', () => {
  async function lasForm(page: Page) {
    return page.locator(NOTIS_KORT).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        position: s.position,
        bottom: s.bottom,
        maxWidth: s.maxWidth,
        borderTopWidth: s.borderTopWidth,
        borderRightWidth: s.borderRightWidth,
        borderBottomWidth: s.borderBottomWidth,
        borderLeftWidth: s.borderLeftWidth,
        borderLeftColor: s.borderLeftColor,
        transitionDuration: s.transitionDuration,
        animationName: s.animationName,
      };
    });
  }

  /** Löser `--mm-info` via en DOM-probe (samma mönster som
   *  `atgardssida-promoverings-grind.spec.ts`), inte en hårdkodad hex. */
  async function infoTokenFarg(page: Page) {
    return page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-info)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
  }

  for (const viewport of [
    { width: 390, height: 844, namn: '390 px (mobil)' },
    { width: 1280, height: 800, namn: '1280 px (desktop)' },
  ]) {
    test(`${viewport.namn} — fast bredd, ingen kontur utom vänsterkanten i info-färg, ingen animation`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await oppnaAppen(page);
      await skjutAppUppdatering(page);

      const form = await lasForm(page);
      const infoFarg = await infoTokenFarg(page);

      expect(form.position).toBe('fixed');
      expect(form.bottom).toBe('96px'); // bottom-24, ovanför TabBar-pillen
      expect(form.maxWidth).toBe('352px'); // max-w-[22rem]

      // Ingen kontur — bara vänsterkanten bär färg (familjeregeln, ADR-121).
      expect(form.borderTopWidth).toBe('0px');
      expect(form.borderRightWidth).toBe('0px');
      expect(form.borderBottomWidth).toBe('0px');
      expect(form.borderLeftWidth).toBe('4px');
      expect(form.borderLeftColor).toBe(infoFarg);

      // AC #7: inga animationer eller transitions.
      expect(Number.parseFloat(form.transitionDuration) || 0).toBeLessThanOrEqual(0);
      expect(form.animationName).toBe('none');
    });
  }

  test('prefers-contrast: more tänder en full kontur i info-färg', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    await oppnaAppen(page);
    await skjutAppUppdatering(page);

    const form = await lasForm(page);
    expect(form.borderTopWidth).toBe('1px');
    expect(form.borderRightWidth).toBe('1px');
    expect(form.borderBottomWidth).toBe('1px');
  });

  test('print döljer notisen helt', async ({ page }) => {
    await oppnaAppen(page);
    await skjutAppUppdatering(page);
    // Kortet (NOTIS_KORT) har en verklig boundingbox till skillnad från den
    // alltid nollstora regionen (BANNER) — synligheten här är alltså en
    // meningsfull kontroll, inte redan sann av regionens egen zero-size-form.
    await expect(page.locator(NOTIS_KORT)).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    // `print:hidden` sitter på den YTTRE regionen (`display: none` under
    // print), vilket kaskaderar till kortet — kortet döljs alltså av sin
    // förälders CSS, inte av en egen print-regel.
    await expect(page.locator(NOTIS_KORT)).toBeHidden();
  });
});
