import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Offline-notisen — externt beteende (TASK-285.6, ADR-047 B5, ADR-103/
 * ADR-121).
 *
 * PROMOVERINGEN (2026-08-21): offline-beskedet var tidigare en orange
 * helbreddsrad i flödet (`border-warning border-b`, `OfflineIndicator.tsx`),
 * som trycker ned sidan. Den formen FINNS INTE LÄNGRE i skarp kod — testerna
 * nedan är skrivna mot den NYA, överlagrade formen: samma facit-låsta
 * `Notis`-primitiv som uppdateringsnotisen (TASK-285.1,
 * `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`),
 * bara med annat innehåll och ingen knapp.
 *
 * KLASSVALET: precis som `app-update-banner.test.ts` — offline-notisen har
 * NOLL databeteende (ett DOM-online/offline-event, aldrig ett nätverkssvar),
 * så `hermetik-sjalvtest.mjs` (ADR-080 beslut 3) hade fällt den i
 * acceptance-klassen. `webblasarbeteende` är rätt hemvist och ändå
 * BLOCKERANDE på PR (samma resonemang, inte upprepat här).
 *
 * VARFÖR `/dev/primitives`: `OfflineIndicator` lever (liksom `ChunkBanner`,
 * TASK-285.5) bara i `AppShell` — det INLOGGADE skalet. `/dev/primitives`
 * monterar den explicit (samma mönster som `ChunkBanner`, se den routens
 * egen kommentar) som den ENDA vägen att pröva komponentens BETEENDE
 * hermetiskt, utan autentisering eller staging. Samma sida bär redan
 * `AppUpdateBanner` (global, `__root.tsx`), vilket gör sidan till rätt plats
 * att pröva STAPLINGEN mellan de två notiserna också (AC #4).
 *
 * VARFÖR `window.dispatchEvent(new Event('offline'/'online'))` OCH INTE
 * `context.setOffline()`: TanStack Querys `onlineManager` (mätt i
 * `node_modules/@tanstack/query-core/build/modern/onlineManager.js`)
 * reagerar ENDAST på webbläsarens egna `online`/`offline`-events på
 * `window` — den läser aldrig `navigator.onLine` direkt. Att dispatcha
 * eventet syntetiskt är alltså en TROGEN simulering av mekanismgränsen
 * (samma mönster som `app-update-banner.test.ts`s
 * `skjutAppUppdatering`), inte en genväg förbi den — och det håller sidans
 * övriga nätverk (Vite HMR, etc.) opåverkat, vilket en riktig
 * `context.setOffline()` inte hade gjort.
 */

const OFFLINE_BANNER = '[data-testid="offline-banner"]';
const OFFLINE_NOTIS = '[data-testid="offline-notis"]';
const UPDATE_NOTIS = '[data-testid="app-update-notis"]';
const UPDATE_INTE_NU = '[data-testid="app-update-inte-nu"]';

/** Går till demoytan och väntar tills React bevisligen har mountat. */
async function oppnaAppen(page: Page) {
  // .first(): se `app-update-banner.test.ts`s `oppnaAppen` — samma sida bär
  // flera h1-rubriker sedan TASK-285.3.
  await page.getByRole('heading', { level: 1 }).first().waitFor();
}

/** Simulerar att nätet försvinner — se filhuvudets rationale. */
async function gaOffline(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
}

/** Simulerar att nätet kommer tillbaka. */
async function gaOnline(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
}

/**
 * Skjuter appens uppdaterings-event UPPREPAT tills knappen syns i DOM:en.
 * Identisk retry-loop och samma skäl som `app-update-banner.test.ts`.
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

test.describe('OfflineIndicator', () => {
  // ── NEGATIVA SIDAN: inget syns i normalläget ──────────────────────────

  test('visar inget offline-besked i normalläget (online)', async ({ page }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    // Live-regionen SKA finnas (samma "alltid monterad"-invariant som
    // uppdateringsnotisen), men vara tom på innehåll.
    await expect(page.locator(OFFLINE_BANNER)).toHaveCount(1);
    await expect(page.locator(OFFLINE_NOTIS)).toHaveCount(0);
    await expect(page.locator(OFFLINE_BANNER)).toHaveText('');
  });

  test('den tomma live-regionen tar ingen visuell plats', async ({ page }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    const hojd = await page
      .locator(OFFLINE_BANNER)
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(hojd).toBe(0);
  });

  // ── POSITIVA SIDAN: besked + innehåll + ingen knapp ────────────────────

  test('visar "Du är offline" + en mening, utan knapp, när nätet försvinner', async ({ page }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    await gaOffline(page);

    await expect(page.locator(OFFLINE_NOTIS)).toBeVisible();
    await expect(page.locator(OFFLINE_BANNER)).toContainText('Du är offline');
    await expect(page.locator(OFFLINE_BANNER)).toContainText(
      'Visar senast hämtade data tills anslutningen är tillbaka.',
    );
    // AC #1: utan knapp — till skillnad från uppdateringsnotisen bär
    // offline-kortet ingen `actions`-slot alls.
    await expect(page.locator(OFFLINE_NOTIS).getByRole('button')).toHaveCount(0);
  });

  test('försvinner AV SIG SJÄLV när anslutningen är tillbaka — inget klick krävs', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    await gaOffline(page);
    await expect(page.locator(OFFLINE_NOTIS)).toBeVisible();

    await gaOnline(page);
    await expect(page.locator(OFFLINE_NOTIS)).toHaveCount(0);
    await expect(page.locator(OFFLINE_BANNER)).toHaveText('');
  });

  test('meddelandet ligger i en artig, namngiven live-region och stjäl inte fokus', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    // Fokus parkeras på ett känt element FÖRE beskedet dyker upp.
    await page
      .getByRole('heading', { level: 1 })
      .first()
      .evaluate((el: HTMLElement) => {
        el.setAttribute('tabindex', '-1');
        el.focus();
      });

    await gaOffline(page);

    const region = page.locator(OFFLINE_BANNER);
    await expect(region).toHaveAttribute('role', 'status');
    await expect(region).toHaveAttribute('aria-live', 'polite');
    await expect(region).toHaveAttribute('aria-label', 'Anslutningsstatus');
    await expect(page.getByRole('status', { name: 'Anslutningsstatus' })).toHaveCount(1);

    // MDN, ARIA status role: "Do not give focus to the status when its
    // content updates." — samma invariant som uppdateringsnotisen.
    const fokusKvar = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() ?? null,
    );
    expect(fokusKvar).toBe('h1');
  });
});

/**
 * [AC #2] Layoutförskjutningen vid offline-övergången är 0 — samma metod
 * som `app-update-banner.test.ts`s CLS-svit (`PerformanceObserver`,
 * `document.fonts.ready` väntad in FÖRE observatören startas — se den
 * filens filhuvud "ROTORSAK TILL EN CI-FÄLLNING" för hela skälet till
 * font-swap-väntan).
 */
test.describe('TASK-285.6 — layoutförskjutningen vid offline är 0 (AC #2)', () => {
  async function matCLS(page: Page, viewport: { width: number; height: number }) {
    await page.setViewportSize(viewport);
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    await page.evaluate(() => document.fonts.ready);

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

    await gaOffline(page);
    await expect(page.locator(OFFLINE_NOTIS)).toBeVisible();

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
 * [AC #1] Facit-formens strukturella drag — samma metod och samma facit
 * (`tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`,
 * yta `uppdateringsnotis`) som `app-update-banner.test.ts`s motsvarande
 * svit: "fast bredd max 22 rem, fixed right-4/sm:right-6 bottom-24 … INGEN
 * kontur … border-l-4 border-info". Offline-kortet återanvänder samma
 * `Notis`-primitiv, så samma strukturella drag gäller ordagrant (AC #1:
 * "identisk med facit … i form").
 */
test.describe('TASK-285.6 — facit-formens strukturella drag (AC #1)', () => {
  async function lasForm(page: Page) {
    return page.locator(OFFLINE_NOTIS).evaluate((el) => {
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

  /** Löser `--mm-info` via en DOM-probe, samma mönster som
   *  `app-update-banner.test.ts`. */
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
    test(`${viewport.namn} — fast bredd, ingen kontur utom vänsterkanten i info-färg, ingen animation, bottom-24 (ostaplad)`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dev/primitives');
      await oppnaAppen(page);
      await gaOffline(page);

      const form = await lasForm(page);
      const infoFarg = await infoTokenFarg(page);

      expect(form.position).toBe('fixed');
      expect(form.bottom).toBe('96px'); // bottom-24, ostaplad (ingen uppdatering visas)
      expect(form.maxWidth).toBe('352px'); // max-w-[22rem]

      expect(form.borderTopWidth).toBe('0px');
      expect(form.borderRightWidth).toBe('0px');
      expect(form.borderBottomWidth).toBe('0px');
      expect(form.borderLeftWidth).toBe('4px');
      expect(form.borderLeftColor).toBe(infoFarg);

      expect(Number.parseFloat(form.transitionDuration) || 0).toBeLessThanOrEqual(0);
      expect(form.animationName).toBe('none');
    });
  }

  test('prefers-contrast: more tänder en full kontur i info-färg', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    await page.goto('/dev/primitives');
    await oppnaAppen(page);
    await gaOffline(page);

    const form = await lasForm(page);
    expect(form.borderTopWidth).toBe('1px');
    expect(form.borderRightWidth).toBe('1px');
    expect(form.borderBottomWidth).toBe('1px');
  });

  test('print döljer notisen helt', async ({ page }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);
    await gaOffline(page);
    await expect(page.locator(OFFLINE_NOTIS)).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator(OFFLINE_NOTIS)).toBeHidden();
  });
});

/**
 * [AC #4] Stapling: offline + ny version samtidigt — offline överst, ingen
 * överlappning, båda helt synliga på 390 px ovanför TabBar-pillen.
 *
 * MEKANISMEN: `uppdateringsnotis-synlighet.ts` (skriven av
 * `AppUpdateBanner`s FÄRDIGA synlighetsberäkning). Offline-kortets `bottom`
 * går från `96px` (bottom-24, ensam) till `229px` (staplad) — 96px bas +
 * uppdateringsnotisens MÄTTA renderade höjd (121px, TASK-285.6-mätning
 * mot dev-servern) + 12px mellanrum. Se `Notis.tsx`s egen kommentar för
 * fulla räkningen.
 */
test.describe('TASK-285.6 — stapling med uppdateringsnotisen (AC #4)', () => {
  test('offline staplar sig ovanför uppdateringsnotisen, ingen överlappning, båda synliga på 390 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    await gaOffline(page);
    await expect(page.locator(OFFLINE_NOTIS)).toBeVisible();
    await skjutAppUppdatering(page);
    await expect(page.locator(UPDATE_NOTIS)).toBeVisible();

    const offlineBox = await page.locator(OFFLINE_NOTIS).boundingBox();
    const updateBox = await page.locator(UPDATE_NOTIS).boundingBox();
    if (!offlineBox || !updateBox) {
      throw new Error('Förväntade bounding boxes för båda korten, fick null.');
    }
    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Förväntade en satt viewport.');
    }

    // Offline ÖVERST: mindre `top`/`bottom`-värden (högre upp på skärmen).
    expect(offlineBox.y).toBeLessThan(updateBox.y);
    expect(offlineBox.y + offlineBox.height).toBeLessThanOrEqual(updateBox.y);

    // Ingen överlappning: ett faktiskt, mätbart mellanrum (> 0).
    const mellanrum = updateBox.y - (offlineBox.y + offlineBox.height);
    expect(mellanrum).toBeGreaterThan(0);

    // Båda helt inom viewporten (ovanför TabBar-pillen — ingen negativ
    // top, ingen bottom bortom viewportens höjd).
    expect(offlineBox.y).toBeGreaterThanOrEqual(0);
    expect(offlineBox.y + offlineBox.height).toBeLessThanOrEqual(viewport.height);
    expect(updateBox.y).toBeGreaterThanOrEqual(0);
    expect(updateBox.y + updateBox.height).toBeLessThanOrEqual(viewport.height);

    // Strukturellt: offline-kortets `bottom` är den staplade platsen, inte
    // facit-basen — och uppdateringsnotisens EGEN plats är OFÖRÄNDRAD
    // (bottom-24, facit-låst — stapling flyttar aldrig den).
    const offlineBottom = await page
      .locator(OFFLINE_NOTIS)
      .evaluate((el) => getComputedStyle(el).bottom);
    const updateBottom = await page
      .locator(UPDATE_NOTIS)
      .evaluate((el) => getComputedStyle(el).bottom);
    expect(offlineBottom).toBe('229px');
    expect(updateBottom).toBe('96px');
  });

  test('offline återgår till bottom-24 när uppdateringsnotisen avfärdas ("Inte nu")', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    await gaOffline(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(OFFLINE_NOTIS)).toHaveCSS('bottom', '229px');

    await page.locator(UPDATE_INTE_NU).click();
    await expect(page.locator(UPDATE_NOTIS)).toHaveCount(0);
    await expect(page.locator(OFFLINE_NOTIS)).toHaveCSS('bottom', '96px');
  });

  test('offline återgår till bottom-24 när anslutningen kommer tillbaka (oavsett uppdateringsnotisen)', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    await oppnaAppen(page);

    await gaOffline(page);
    await skjutAppUppdatering(page);
    await expect(page.locator(OFFLINE_NOTIS)).toHaveCSS('bottom', '229px');

    await gaOnline(page);
    await expect(page.locator(OFFLINE_NOTIS)).toHaveCount(0);
    // Uppdateringsnotisen (oberoende signal) står kvar orörd.
    await expect(page.locator(UPDATE_NOTIS)).toBeVisible();
  });
});
