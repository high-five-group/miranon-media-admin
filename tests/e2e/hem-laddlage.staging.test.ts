import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '@playwright/test';

/**
 * Hem i Lugnt laddläge (task-8.4; princip: ORDLISTA "Lugnt laddläge" +
 * DESIGN-SYSTEM-SPEC §15 + PRD TASK-8 beslut 5–10). Vid tom cache renderas
 * Hem från FÖRSTA bildrutan med riktiga kortrubriker och riktig kort-chrome i
 * full slutgeometri — endast datakropparna bär Skeleton-primitivens block
 * (eventmeta-rader i Nästa event, talet i Obetalda, listrader i Nya
 * anmälningar); anmälningslistans yta är dimensionsreserverad; datalandningen
 * byter block → innehåll UTAN att något flyttar sig (layout-skift ≈ 0 är
 * grindkravet). 'Laddar…'-textraderna är borta och ingen spinner finns
 * (medvetet över FK-golvet, PRD-beslut 9).
 *
 * Bevisformer:
 * - Layout-skift ≈ 0 per task-4.5-bevismönstret (S55 Del 11): EF-svaren
 *   PARKERAS ofulfillade (håll-bar mock) → boundingBox-mätning UNDER
 *   laddning; svaren släpps → identisk mätning EFTER data (toEqual, exakta
 *   boxar — samma form som task-4.5 AC 2:s mät-stillhet).
 * - Framträdande-formen är mätlåst per task-8.1 (kommentaren på task-8.4):
 *   skeleton från första bildrutan, INGEN CSS-driven fördröjning — bevisas
 *   computed (L272) medan nätverket är parkerat.
 * - A11y per Roselli-mönstret (PRD-beslut 6): aria-busy på laddande
 *   containrar + sr-only-laddbesked (aria-busy honoreras sällan ensam);
 *   blocken aria-hidden; reduced-motion → statiska block (emulateMedia);
 *   axe 0 violations i laddläge.
 *
 * TOM CACHE arrangeras EXPLICIT: persist-lagret (task-8.3, ADR-072) gör
 * kallstarten sällsynt — auth.setup:s storageState kan bära en persistad
 * cache in i testkontexten. Init-scriptet tar bort persist-nyckeln FÖRE
 * app-boot (test-arrangemang före start — INTE runtime-tömning; den vägen
 * är queryClient.clear() per ADR-072 skyddsräcke 1), så varje test här
 * träffar den äkta kallstarten skeletonen byggdes för.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt). Deterministisk via page.route-mock av EF:erna
 * (hem-svitens regex-kontrakt).
 */

const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations/;
const GET_EVENTS = /\/functions\/v1\/get-events/;
const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';
const H1_HALSNING = /^Hej/;

type Row = Record<string, unknown>;

/** En komplett Registration-rad (EF-svarets form, Registration.schema). */
function reg(overrides: Row = {}): Row {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent1',
    personId: 'recPerson1',
    ...overrides,
  };
}

/** En komplett Event-rad (EF-svarets form, Event.schema). */
function ev(overrides: Row = {}): Row {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'RIM1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

/** Fullt slutinnehåll: kommande event med ort/datum/beläggning (alla
    metarader renderas) + 6 anmälningar (à ~83 px ⇒ scrollHeight > 320 ⇒
    listan står i sin fulla max-h-80-klienthöjd) varav en obetald.
    Dagsgamla inskickad-tider: relativa tidsformer glider inte under testet. */
function fulltData() {
  return {
    registrations: Array.from({ length: 6 }, (_, i) =>
      reg({
        id: `recRegStabil${i}`,
        fornamn: `Person${i}`,
        efternamn: i === 0 ? 'Andersson' : 'Testsson',
        eventId: 'recEvent1',
        anmalningsavgift: i === 0 ? 'Ej mottagen' : 'Mottagen',
        inskickad: new Date(Date.now() - (i + 2) * 86_400_000).toISOString(),
      }),
    ),
    events: [
      ev({
        id: 'recEvent1',
        eventNamn: 'Fjärrskådning',
        ort: 'Skövde',
        startdatum: '2099-09-15',
        antalAnmalda: 5,
        maxPlatser: 20,
      }),
    ],
  };
}

/** Håll-bar mock (task-4.5:s mönster): `hall = true` parkerar EF-anropen
    ofulfillade — laddläget står deterministiskt tills testet släpper svaren
    (ingen fast delay, TASK-3-klassen); `slappAlla` besvarar med `data`. */
function hallbarMock(page: Page, data: { registrations: Row[]; events: Row[] }) {
  const st = {
    data,
    hall: true,
    parkerade: [] as Route[],
    async slappAlla() {
      const rutter = this.parkerade.splice(0);
      for (const rutt of rutter) await uppfyll(rutt);
    },
  };
  const uppfyll = async (rutt: Route) => {
    const arEvents = /get-events/.test(rutt.request().url());
    await rutt.fulfill({
      status: 200,
      contentType: 'application/json',
      body: arEvents
        ? JSON.stringify({ events: st.data.events })
        : JSON.stringify({ registrations: st.data.registrations }),
    });
  };
  const hanterare = async (rutt: Route) => {
    if (st.hall) {
      st.parkerade.push(rutt);
      return;
    }
    await uppfyll(rutt);
  };
  return Promise.all([
    page.route(GET_REGISTRATIONS, hanterare),
    page.route(GET_EVENTS, hanterare),
  ]).then(() => st);
}

/** Tom cache-arrangemanget: persist-nyckeln bort FÖRE app-boot (körs vid
    varje dokumentstart i kontexten) — äkta kallstart, oavsett vad
    auth.setup:s storageState råkar bära. */
function arrangeraTomCache(page: Page) {
  return page.addInitScript((nyckel) => localStorage.removeItem(nyckel), PERSIST_KEY);
}

/** Löser en CSS-custom-property till computed färg via DOM-probe
    (Skeleton.spec-mönstret; L272: computed-assertioner, aldrig pixel-titt). */
async function resolvedTokenColor(page: Page, tokenNamn: string): Promise<string> {
  return page.evaluate((namn) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${namn})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, tokenNamn);
}

/** De tre kort-regionernas namn (aria-labelledby → h2-rubriken). */
const KORT = {
  nastaEvent: 'Nästa event',
  obetalda: 'Obetalda anmälningsavgifter',
  anmalningar: 'Nya anmälningar att hantera',
} as const;

test.describe('Hem — Lugnt laddläge (task-8.4)', () => {
  test('AC 1 — tom cache: rubriker + kort-chrome i slutgeometri från första bildrutan; skeleton-block endast i datakropparna', async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    await hallbarMock(page, fulltData()); // parkerad från start — äkta kallstartsfönster
    await page.goto('/hem');

    // Riktiga rubriker + riktig kort-chrome DIREKT (statiskt kända): h1 +
    // alla tre h2 synliga medan EF-svaren fortfarande är parkerade.
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    for (const namn of Object.values(KORT)) {
      await expect(page.getByRole('heading', { level: 2, name: namn })).toBeVisible();
    }

    // Chromen är den RIKTIGA (computed, L272): tonala ytor + radie renderade
    // redan i laddläget — Nästa event i primär-tint, Obetalda i bg-muted,
    // anmälningskortet med koppar-kontur (task-4.4-facitets accent).
    const nastaEvent = page.getByRole('region', { name: KORT.nastaEvent });
    const obetalda = page.getByRole('region', { name: KORT.obetalda });
    const anmalningar = page.getByRole('region', { name: KORT.anmalningar });
    expect(await nastaEvent.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await resolvedTokenColor(page, '--mm-primary-tint'),
    );
    expect(await obetalda.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await resolvedTokenColor(page, '--mm-bg-muted'),
    );
    expect(await anmalningar.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(
      await resolvedTokenColor(page, '--mm-accent'),
    );
    for (const kort of [nastaEvent, obetalda, anmalningar]) {
      expect(await kort.evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe('0px');
    }

    // Endast datakropparna bär skeleton-block, och blocken SPEGLAR kommande
    // innehåll: eventmeta-raderna (3 metarader + caption + stapelplats),
    // talet (1 number-block), listraderna (4 synliga listrads-block).
    const block = (region: ReturnType<Page['getByRole']>) =>
      region.getByRole('status').locator('span[aria-hidden="true"]');
    await expect(block(nastaEvent)).toHaveCount(5);
    await expect(block(obetalda)).toHaveCount(1);
    await expect(block(anmalningar)).toHaveCount(4);

    // Inga fel-ytor i laddläget.
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('AC 1 — grindkravet: kortens och listans boundingBox IDENTISK under laddning och efter data (layout-skift ≈ 0)', async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    const mocken = await hallbarMock(page, fulltData());
    await page.goto('/hem');

    // Laddläget står (EF-svaren parkerade): tre laddande containrar.
    const main = page.locator('main#main');
    await expect(main.getByRole('status')).toHaveCount(3);

    // L246-mätfällan: neutralisera muspekaren före mätning.
    await page.mouse.move(0, 0);

    // Mät UNDER laddning: main, alla tre korten, CTA:n och listytan
    // (task-4.5 AC 2:s mät-stillhets-form).
    const ytor = {
      main,
      nastaEvent: page.getByRole('region', { name: KORT.nastaEvent }),
      obetalda: page.getByRole('region', { name: KORT.obetalda }),
      anmalningar: page.getByRole('region', { name: KORT.anmalningar }),
      cta: page.getByRole('link', { name: 'Visa alla anmälningar' }),
    };
    const foreBoxar: Record<string, Awaited<ReturnType<typeof main.boundingBox>>> = {};
    for (const [namn, yta] of Object.entries(ytor)) foreBoxar[namn] = await yta.boundingBox();

    // Anmälningslistans dimensionsreserverade yta under laddning …
    const skelettLista = ytor.anmalningar.getByRole('status').locator('> div');
    const listYtaFore = await skelettLista.boundingBox();
    if (!listYtaFore) throw new Error('boundingBox saknas för skelett-listytan');

    // … släpp EF-svaren → innehållet landar …
    mocken.hall = false;
    await mocken.slappAlla();
    await expect(page.getByRole('link', { name: /Person0 Andersson/ })).toBeVisible();
    await expect(page.getByText('5 av 20 platser bokade')).toBeVisible();
    await expect(main.getByRole('status')).toHaveCount(0);
    // Deterministisk måla-klart-vänta (dubbel-rAF, task-4.5) — ingen fast delay.
    await page.evaluate(
      () => new Promise((klar) => requestAnimationFrame(() => requestAnimationFrame(klar))),
    );

    // … och INGENTING har flyttat sig: exakt samma boxar som under laddning.
    for (const [namn, yta] of Object.entries(ytor)) {
      expect(await yta.boundingBox(), `${namn} ska stå mät-still över datalandningen`).toEqual(
        foreBoxar[namn],
      );
    }

    // Listytan: den riktiga listan står EXAKT där skelettytan stod, i samma
    // storlek (dimensionsreservationen är sann — inget trycks ner när listan
    // dyker upp, användarberättelse 7).
    const lista = page.getByRole('list', { name: 'Senaste anmälningarna' });
    const listYtaEfter = await lista.boundingBox();
    if (!listYtaEfter) throw new Error('boundingBox saknas för den laddade listan');
    expect(listYtaEfter.y).toBeCloseTo(listYtaFore.y, 1);
    expect(listYtaEfter.x).toBeCloseTo(listYtaFore.x, 1);
    expect(listYtaEfter.width).toBeCloseTo(listYtaFore.width, 1);
    expect(listYtaEfter.height).toBeCloseTo(listYtaFore.height, 1);
  });

  test("AC 2 — 'Laddar…'-textraderna är borta ur Hem: laddbeskeden är enbart sr-only; ingen spinner", async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    await hallbarMock(page, fulltData());
    await page.goto('/hem');
    await expect(page.locator('main#main').getByRole('status')).toHaveCount(3);

    // Varje 'Laddar…'-förekomst är ett sr-only-besked (1×1, absolut) — den
    // gamla formens SYNLIGA textrader existerar inte längre.
    const laddTexter = page.getByText(/^Laddar/);
    await expect(laddTexter).toHaveCount(3);
    for (const el of await laddTexter.all()) {
      const stil = await el.evaluate((n) => {
        const s = getComputedStyle(n);
        return { position: s.position, width: s.width, height: s.height };
      });
      expect(stil).toEqual({ position: 'absolute', width: '1px', height: '1px' });
    }

    // Ingen spinner infördes (PRD-beslut 9 — medvetet över FK-golvet).
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  });

  test('AC 3 — framträdande-formen per task-8.1:s mätlåsta beslut: skeleton från första bildrutan, ingen fördröjningsmekanism', async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    await hallbarMock(page, fulltData());
    await page.goto('/hem');

    // Blocken är synliga MEDAN inget EF-svar levererats (nätverket parkerat
    // = det tidigast möjliga fönstret — första bildrutan i beteendetermer).
    const block = page.locator('main#main [role="status"] span[aria-hidden="true"]');
    await expect(block.first()).toBeVisible();

    // Ingen CSS-driven framträdande-fördröjning (den förkastade ~1 s-grenen,
    // PRD-beslut 8): blocket är fullt opakt direkt, utan transition-delay
    // och utan element-animation (shimmern bor på ::after-lagret och rör
    // inte framträdandet).
    const stil = await block.first().evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        opacity: s.opacity,
        transitionDelay: s.transitionDelay,
        animationName: s.animationName,
      };
    });
    expect(stil).toEqual({ opacity: '1', transitionDelay: '0s', animationName: 'none' });
  });

  test('AC 4 — laddande containrar bär aria-busy + tillgängligt laddbesked; blocken är dekorativa (Roselli-mönstret)', async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    await hallbarMock(page, fulltData());
    await page.goto('/hem');

    const laddande = page.locator('main#main').getByRole('status');
    await expect(laddande).toHaveCount(3);
    for (const container of await laddande.all()) {
      // aria-busy på containern som laddar …
      await expect(container).toHaveAttribute('aria-busy', 'true');
      // … ALLTID kompletterad med textbeskedet (få skärmläsare honorerar
      // busy ensam): exakt ett sr-only-besked per container.
      const besked = container.locator('.sr-only');
      await expect(besked).toHaveCount(1);
      await expect(besked).toContainText(/Laddar/);
      // … och samtliga skelettblock är dekorativa: aria-hidden utan text.
      for (const blockEl of await container.locator('span[aria-hidden="true"]').all()) {
        await expect(blockEl).toHaveText('');
      }
    }
  });

  test('AC 4 — reduced-motion ger statiska block; utan preferensen shimrar blocken långsamt', async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    await hallbarMock(page, fulltData());

    // Kontrollprovet först (L273-falsifikation): utan reducerad rörelse ÄR
    // shimmern deklarerad — annars bevisar reduce-grenen ingenting.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/hem');
    const block = page.locator('main#main [role="status"] span[aria-hidden="true"]').first();
    await expect(block).toBeVisible();
    const shimmer = await block.evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { namn: s.animationName, duration: s.animationDuration };
    });
    expect(shimmer.namn).toContain('skeleton-shimmer');
    expect(Number.parseFloat(shimmer.duration)).toBeGreaterThanOrEqual(2);

    // Reducerad rörelse: animationen är INTE deklarerad (media-gated vid
    // deklarationen — statiska block, WCAG 2.2.2-noten).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const efterReduce = await block.evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(efterReduce).toBe('none');
  });

  test('AC 4 — axe 0 violations på Hem i laddläge', async ({ page }) => {
    await arrangeraTomCache(page);
    await hallbarMock(page, fulltData());
    await page.goto('/hem');
    await expect(page.locator('main#main').getByRole('status')).toHaveCount(3);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
