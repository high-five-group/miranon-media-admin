import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * Hem i Lugnt laddläge (task-8.4; princip: ORDLISTA "Lugnt laddläge" +
 * DESIGN-SYSTEM-SPEC §15 + PRD TASK-8 beslut 5–10). Vid tom cache renderas
 * Hem från FÖRSTA bildrutan med riktiga kortrubriker och riktig kort-chrome i
 * full slutgeometri — endast datakropparna bär Skeleton-primitivens block
 * (eventmeta-rader i Nästa event, räknar-rubriken i Nya anmälningar, listrader
 * i BÅDA Nya anmälningar OCH Förfallna betalningar — TASK-243.3: "Obetalda
 * anmälningsavgifter"-kortet retirerades av Morgonkollen-redesignen och
 * ersattes av Förfallna betalningar, samma laddläge-kontrakt oförändrat);
 * anmälningslistans yta är dimensionsreserverad; datalandningen byter block →
 * innehåll UTAN att något flyttar sig (layout-skift ≈ 0 är grindkravet).
 * 'Laddar…'-textraderna är borta och ingen spinner finns (medvetet över
 * FK-golvet, PRD-beslut 9).
 *
 * DE TRE MÄTTA CONTAINRARNA (`main#main [role="status"]`, count 3 nedan) är
 * Nästa event + Nya anmälningar + Förfallna betalningar — samtliga styrda av
 * `anmalDataPending`/`eventsQuery.isPending`. Senaste aktivitet-blocket
 * (`SenasteAktivitetKompakt.tsx`) bär SITT EGET, OBEROENDE `role="status"`
 * (egen query, `useLatestActivity`) — held-mock-riggen nedan parkerar bara
 * get-events/get-registrations, så den fjärde containern hinner alltid
 * settla (normalläget svarar utan konstgjord fördröjning) innan assertionerna
 * läses; en fjärde, permanent parkerad container hade krävt en egen
 * `get-activity-log`-hållning här, vilket denna svit inte behöver för att
 * bevisa sitt kontrakt.
 *
 * Bevisformer:
 * - Layout-skift ≈ 0 per task-4.5-bevismönstret (S55 Del 11): EF-svaren
 *   PARKERAS obesvarade (håll-bar mock) → boundingBox-mätning UNDER
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
 * kallstarten sällsynt — en persistad cache kan bära data in i testkontexten.
 * Init-scriptet tar bort persist-nyckeln FÖRE app-boot (test-arrangemang före
 * start — INTE runtime-tömning; den vägen är queryClient.clear() per ADR-072
 * skyddsräcke 1), så varje test här träffar den äkta kallstarten skeletonen
 * byggdes för. Arrangemanget behålls efter flytten till acceptance-klassen
 * trots att varje test där får en FÄRSK kontext med tom localStorage: det
 * kostar ingenting, och kravet det uttrycker (äkta kallstart) ska stå kvar i
 * testet även om kontext-isoleringen någon gång ändras.
 *
 * ACCEPTANCE-KLASSEN (task-59.3, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 15
 * restanrop, samtliga typsnitt, noll skarpa. Deterministisk via `network.use()`
 * mot fixturvärldens delade handlers — inte via page.route, som hade lagt en
 * andra avlyssningsmekanism ovanpå MSW och gjort EF-lagret svagare vaktat än
 * allt annat nätverk.
 */

const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

/**
 * Härledda ur schemana, ej beskrivna bredvid dem (TASK-63) — se `acceptance-bas.ts`
 * § fogen. Vyn läser TVÅ EF:er med olika svarsform, så det tidigare gemensamma
 * `Row`-aliaset delas: ett `Record<string, unknown>` kunde bära båda, en härledd
 * typ kan inte — och ska inte.
 */
type RegRow = z.infer<typeof RegistrationSchema>;
type EventRow = z.infer<typeof EventSchema>;

/** En komplett Registration-rad (EF-svarets form, Registration.schema). */
function reg(overrides: Partial<RegRow> = {}): RegRow {
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
function ev(overrides: Partial<EventRow> = {}): EventRow {
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
    obesvarade — laddläget står deterministiskt tills testet släpper svaren
    (ingen fast delay, TASK-3-klassen); `slappAlla` besvarar med `data`.

    ÖVERSKUGGNING, INTE EN ANDRA FIXTURVÄRLD (task-59.3): handlarna läggs på
    fixturvärldens normalläge via `network.use()` och gäller ENDAST detta test
    — isoleringen är strukturell, `network` byggs om per test. Mönstren byggs
    med `EF()` ur handlers-modulen så de per konstruktion matchar exakt det
    normalläget matchar; en egen sträng hade kunnat drifta och då fallit igenom
    till normalläget UTAN att något fälls (den tysta fällan, se hermetic.ts).

    Parkeringen bärs av ett obesvarat löfte i resolvern i stället för av ett
    uppskjutet Playwright-Route-objekt: MSW äger avlyssningen sedan task-54.1,
    och en resolver som inte återvänder håller anropet i luften precis som en
    oparkerad rutt gjorde. `slappAlla` löser dem, och svaret läses ur `st.data`
    VID släppet — så data kan bytas mellan pollarna. */
function hallbarMock(
  network: NetworkFixture,
  data: { registrations: RegRow[]; events: EventRow[] },
) {
  const st = {
    data,
    hall: true,
    parkerade: [] as Array<() => void>,
    slappAlla() {
      for (const slapp of this.parkerade.splice(0)) slapp();
    },
  };
  const svara = (arEvents: boolean) =>
    arEvents ? json({ events: st.data.events }) : json({ registrations: st.data.registrations });
  const hanterare = (arEvents: boolean) => async () => {
    if (st.hall) await new Promise<void>((slapp) => st.parkerade.push(slapp));
    return svara(arEvents);
  };
  network.use(
    http.get(EF('get-registrations'), hanterare(false)),
    http.get(EF('get-events'), hanterare(true)),
  );
  return st;
}

/** Tom cache-arrangemanget: persist-nyckeln bort FÖRE app-boot (körs vid
    varje dokumentstart i kontexten) — äkta kallstart, oavsett vad
    auth.setup:s storageState råkar bära. */
function arrangeraTomCache(page: Page) {
  return page.addInitScript((nyckel) => localStorage.removeItem(nyckel), PERSIST_KEY);
}

test.describe('Hem — Lugnt laddläge (task-8.4)', () => {
  test("AC 2 — 'Laddar…'-textraderna är borta ur Hem: laddbeskeden är enbart sr-only; ingen spinner", async ({
    page,
    network,
  }) => {
    await arrangeraTomCache(page);
    hallbarMock(network, fulltData());
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
    network,
  }) => {
    await arrangeraTomCache(page);
    hallbarMock(network, fulltData());
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
    network,
  }) => {
    await arrangeraTomCache(page);
    hallbarMock(network, fulltData());
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
    network,
  }) => {
    await arrangeraTomCache(page);
    hallbarMock(network, fulltData());

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

  test('AC 4 — axe 0 violations på Hem i laddläge', async ({ page, network }) => {
    await arrangeraTomCache(page);
    hallbarMock(network, fulltData());
    await page.goto('/hem');
    await expect(page.locator('main#main').getByRole('status')).toHaveCount(3);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
