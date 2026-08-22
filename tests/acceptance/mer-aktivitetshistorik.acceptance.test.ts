import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import {
  type ActivityStatementSchema,
  EVENT_ID_EXTENSION_IRI,
  PERSON_ID_EXTENSION_IRI,
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas';
import { FROZEN_NOW } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-201.6 — Aktivitetshistoriken, kärnvyn (A-formen): /mer/aktivitetshistorik.
 *
 * `get-activity-log` LIGGER I NORMALLÄGET SEDAN TASK-201.7 (hem-spalten
 * "Senaste aktivitet" hämtar loggen vid varje hem-rendering på ≥xl, och
 * acceptance-projektet kör 1280×720 — se `handlers.ts` § Aktivitetsloggens
 * LÄSVÄG). Fram till dess låg den utanför, som `get-mail-log` fortfarande gör.
 * FÖR DENNA FIL ÄNDRAR DET INGENTING I PRAKTIKEN: varje test här överskuggar
 * ändå med `network.use(http.get(EF('get-activity-log'), …))` eftersom det
 * äger sin egen datamängd (tomläge, cursor-round-trip, 500). Men skyddsnätet
 * är svagare än förr — ett test som GLÖMMER sin överskuggning fälls inte
 * längre av hermetik-vakten, det ser normallägets fem statements i stället.
 * Överskuggningen är därför inte längre valfri stil här, den är kravet.
 *
 * Täckning: AC #1 (route + vy, dagsgruppering Idag/Igår/långdatum, postform:
 * relativ tid vs klockslag, aktör i medium, händelse i naturligt språk med
 * `·`-separator, post-klick → eventet), AC #3 (tomläge), AC #4 (rubrikstruktur,
 * axe 0 på tom + ifylld), cursor-paginering (`useActivityLogHistory`,
 * TASK-201.5), fel-yta (role=alert).
 *
 * NAVIGATIONSTESTET FÖLJER `hem.acceptance.test.ts`:s precedent (task-62):
 * assertionen är `toHaveURL`, testet navigerar aldrig så långt att
 * eventdetaljsidan hämtar något — ingen `get-event`/`get-registrations`-
 * överskuggning behövs.
 */

type Statement = z.infer<typeof ActivityStatementSchema>;

let idCounter = 0;
/** Deterministisk v4-formad UUID (Zod `.uuid()` kräver giltig UUID-form). */
function testUuid(): string {
  idCounter += 1;
  return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
}

/**
 * Lokal tid N dagar bakåt (Stockholm-kalenderdag), på angiven svensk
 * klocktimme — relativt fixturvärldens FRUSNA klocka (`hermetic.ts` §
 * `page.clock.setFixedTime(FROZEN_NOW)`), INTE verklig väggklocka.
 * Komponentens `Date.now()` körs i BROWSERN, som fixerats vid FROZEN_NOW
 * OCH pinnats till `timezoneId: 'Europe/Stockholm'` (playwright.config.ts)
 * innan testet startar.
 *
 * TASK-27-KLASSEN (fälld skarpt i CI, run 31633396902/job 94239278496,
 * 3/3 — original + två retries, ingen flake): en tidigare version byggde
 * detta med `new Date(FROZEN_NOW); d.setDate(...); d.setHours(timme, minut)`
 * — `setDate`/`setHours` tolkas i TEST-PROCESSENS (Node) lokala tidszon, INTE
 * webbläsarens. På en Mac med `TZ=Europe/Stockholm` som systemdefault
 * sammanföll de två av en slump (lokal grönhet, fel MILJÖ — inte fel
 * mätning). I CI kör Node i UTC: `setHours(14, 30)` gav 14:30 UTC = 16:30
 * CEST i webbläsaren, och `getByText('14:30')` hittade aldrig strängen.
 *
 * FIXEN: bygg ISO-strängen med en EXPLICIT `+02:00`-offset via ren
 * UTC-aritmetik (Date.UTC/getUTCFullYear/getUTCDate) — noll lokala
 * Date-metoder, alltså noll beroende av VILKEN tidszon Node råkar köra i.
 * `+02:00` är ärligt för hela fixturvärlden: FROZEN_NOW och samtliga
 * `dagarBak`-värden denna fil använder (1, 6) ligger i september
 * (2026-09-09–2026-09-15) — långt före CEST→CET-skiftet i slutet av
 * oktober, så offset är konstant `+02:00` i hela intervallet.
 */
function lokalTid(dagarBak: number, timme: number, minut = 0): string {
  const bas = new Date(
    Date.UTC(FROZEN_NOW.getUTCFullYear(), FROZEN_NOW.getUTCMonth(), FROZEN_NOW.getUTCDate()),
  );
  bas.setUTCDate(bas.getUTCDate() - dagarBak);
  const datum = bas.toISOString().slice(0, 10); // "YYYY-MM-DD", TZ-oberoende
  const hh = String(timme).padStart(2, '0');
  const mm = String(minut).padStart(2, '0');
  return `${datum}T${hh}:${mm}:00+02:00`;
}

/** N minuter sedan — "Idag"-radens relativa tid, relativt FROZEN_NOW.
 * REDAN TZ-säker (ospårad av TASK-27-klassen, samma CI-körning): `getTime()`
 * är en absolut epok och `.toISOString()` skriver alltid UTC — ingen lokal
 * Date-metod inblandad. */
function minuterSedan(n: number): string {
  return new Date(FROZEN_NOW.getTime() - n * 60_000).toISOString();
}

/** Ett komplett xAPI-statement som passerar ActivityStatementSchema. */
function statement({
  actorName = 'Lotta',
  verbDisplay = 'markerade betalning',
  verbId = `${XAPI_IRI_BASE}/verbs/test-verb`,
  objectName = 'Anna Andersson (Fjärrskådning 2)',
  timestamp,
  eventId,
  personId,
}: {
  actorName?: string;
  verbDisplay?: string;
  /** S106: valfritt RIKTIGT verb-IRI för verbCopy-mappningens testfall —
   * defaulten test-verb saknar mappning och renderar lagrad display. */
  verbId?: string;
  objectName?: string;
  timestamp: string;
  eventId?: string;
  /** TASK-201.12 — personId-extensionen, samma valfria opt-in-form som eventId. */
  personId?: string;
}): Statement {
  return {
    id: testUuid(),
    actor: {
      objectType: 'Agent',
      name: actorName,
      account: { homePage: XAPI_IRI_BASE, name: testUuid() },
    },
    verb: { id: verbId, display: { 'sv-SE': verbDisplay } },
    object: {
      objectType: 'Activity',
      id: `${XAPI_IRI_BASE}/objects/registrations/rec-test-${idCounter}`,
      definition: {
        name: { 'sv-SE': objectName },
        type: `${XAPI_IRI_BASE}/activity-types/betalning`,
      },
    },
    context: {
      extensions: {
        [REQUEST_ID_EXTENSION_IRI]: testUuid(),
        ...(eventId ? { [EVENT_ID_EXTENSION_IRI]: eventId } : {}),
        ...(personId ? { [PERSON_ID_EXTENSION_IRI]: personId } : {}),
      },
    },
    timestamp,
  } satisfies Statement;
}

function mockActivityLog(
  network: NetworkFixture,
  respond: (
    url: URL,
  ) => { statements: Statement[]; nextCursor: string | null; total?: number } | { status: number },
): void {
  network.use(
    http.get(EF('get-activity-log'), ({ request }) => {
      const url = new URL(request.url);
      const out = respond(url);
      if ('status' in out) {
        return json({ error: 'Internal error', requestId: 'req-aktivitet-500' }, out.status);
      }
      return json(out);
    }),
  );
}

test.describe('Aktivitetshistoriken — kärnvyn (TASK-201.6, A-formen)', () => {
  test('AC #3 — tomläge första gången: vänlig, ej alarmerande text; fokus → h1', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, () => ({ statements: [], nextCursor: null }));
    await page.goto('/mer/aktivitetshistorik');

    const heading = page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    await expect(page.getByText('Ingen aktivitet ännu')).toBeVisible();
    await expect(page.getByText(/Här kommer du snart se allt du gör i appen/)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    // Tomläget bär inga dagsgrupper.
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
  });

  test('AC #1 — dagsgruppering (Idag/Igår/långdatum) + postform (aktör medium, · -separator, relativ tid/klockslag)', async ({
    page,
    network,
  }) => {
    const idagIso = minuterSedan(12);
    const igarIso = lokalTid(1, 14, 30);
    const aldreIso = lokalTid(6, 9, 15);
    // Literal, INTE härledd ur AktivitetsHistorik.tsx:s LANGDATUM-formatterare
    // (tautologi-fällan — en delad formatterare hade fått testet att passera
    // oavsett vad komponentens kod faktiskt gör). FROZEN_NOW är 2026-09-15;
    // 6 dagar bakåt (kalenderdag, TZ-oberoende UTC-aritmetik) är 2026-09-09 —
    // verifierat separat via `node -e "…"` innan denna sträng skrevs in.
    const aldreLabel = '9 september 2026';

    mockActivityLog(network, () => ({
      statements: [
        statement({
          actorName: 'Lotta',
          verbDisplay: 'markerade betalning',
          objectName: 'Anna Andersson (Fjärrskådning 2)',
          timestamp: idagIso,
        }),
        // S106 verbCopy-fallet: ett KÄNT verb-IRI → presentationslagrets
        // mappade text ("skapade ett event"), INTE den lagrade displayen
        // ("skapade eventet") — historiska rader får ny copy utan migrering.
        // Ligger i FALLANDE serverordning (30 min < 12 min-raden ovan) så
        // dagsgrupperingen inte får en andra "Idag"-grupp.
        statement({
          actorName: 'Lotta',
          verbId: `${XAPI_IRI_BASE}/verbs/skapade-event`,
          verbDisplay: 'skapade eventet',
          objectName: 'Fjärrskådning',
          timestamp: minuterSedan(30),
        }),
        statement({
          actorName: 'Roger',
          verbDisplay: 'bekräftade anmälan',
          objectName: 'Erik Holm (Medveten Kontakt)',
          timestamp: igarIso,
        }),
        statement({
          actorName: 'Marcus',
          verbDisplay: 'skickade bekräftelsemail',
          objectName: 'Sara Björk (Medveten Kontakt)',
          timestamp: aldreIso,
        }),
      ],
      nextCursor: null,
    }));

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();

    // Tre dagsgrupper, riktiga h2:or, i server-sorterad ordning (fallande).
    const grupper = page.getByRole('heading', { level: 2 });
    await expect(grupper).toHaveText(['Idag', 'Igår', aldreLabel]);

    // S106-formen: rad 1 = aktör + händelse; rad 2 = tid (som rubrik) +
    // mittpunkt + objekt. "Idag"-raden: relativ tid.
    await expect(
      page.getByText('för 12 min sedan · Anna Andersson (Fjärrskådning 2)'),
    ).toBeVisible();
    // "Igår"-raden: klockslag, INTE relativ tid.
    await expect(page.getByText('14:30 · Erik Holm (Medveten Kontakt)')).toBeVisible();
    // Äldre rad: klockslag också (dagen står redan i h2:n).
    await expect(page.getByText('09:15 · Sara Björk (Medveten Kontakt)')).toBeVisible();

    // Rad 1: aktör + händelse i naturligt språk (okänt verb-id → radens
    // lagrade display, verbCopy-fallbacken).
    await expect(page.getByText('Lotta markerade betalning')).toBeVisible();
    // Känt verb-id → mappad copy, INTE lagrad display (verbCopy-modulen).
    await expect(page.getByText('Lotta skapade ett event')).toBeVisible();
    await expect(page.getByText('Lotta skapade eventet')).toHaveCount(0);
    // MITTPUNKT-separator (Marcus-order 2026-08-12) — ALDRIG långt tankstreck.
    await expect(page.getByText(/—/)).toHaveCount(0);

    // Aktören bär font-medium (500) — computed, inte bara klass-närvaro.
    const aktorSpan = page.locator('span.font-medium', { hasText: 'Lotta' }).first();
    await expect(aktorSpan).toHaveText('Lotta');
    const vikt = await aktorSpan.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(vikt).toBe('500');
  });

  test('AC #1 — post-klick navigerar till eventet när eventId-extensionen finns; olänkad utan den', async ({
    page,
    network,
  }) => {
    const idagIso = minuterSedan(3);
    mockActivityLog(network, () => ({
      statements: [
        statement({
          actorName: 'Lotta',
          verbDisplay: 'bekräftade anmälan',
          objectName: 'Länkad Person (Test-event)',
          timestamp: idagIso,
          eventId: 'recEventTest123',
        }),
        statement({
          actorName: 'Lotta',
          verbDisplay: 'markerade betalning',
          objectName: 'Olänkad Person (Test-event)',
          timestamp: minuterSedan(4),
        }),
      ],
      nextCursor: null,
    }));

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();

    // Raden UTAN eventId-extension är INTE en länk (ärlig degradering — se
    // AktivitetsHistorik.tsx:s aktivitetensEventId-filhuvud för koordinerings-
    // skulden mot TASK-201.4).
    const olankadRad = page.getByRole('listitem').filter({ hasText: 'Olänkad Person' });
    await expect(olankadRad.getByRole('link')).toHaveCount(0);
    await expect(olankadRad).toBeVisible();

    // Raden MED eventId-extension navigerar (INGEN get-event-överskuggning —
    // toHaveURL-precedenten från hem.acceptance.test.ts, testet navigerar
    // aldrig så långt att detaljsidan hämtar något).
    await page.getByRole('link', { name: /Länkad Person/ }).click();
    await expect(page).toHaveURL(/\/event\/recEventTest123$/);
  });

  test('AC #1 (TASK-201.12) — post-klick navigerar till PERSONEN när endast personId-extensionen finns; eventId vinner prioritetsordningen när båda finns', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, () => ({
      statements: [
        // Endast personId (person-flagga/anteckning-formen) — INGET eventId.
        statement({
          verbDisplay: 'uppdaterade flagga',
          objectName: 'Enbart Person (flagga)',
          timestamp: minuterSedan(2),
          personId: 'recPersonTest456',
        }),
        // BÅDA — eventId ska vinna (oförändrat mål för redan fungerande rader,
        // se AktivitetsHistorik.tsx:s aktivitetensPersonId-prioritetskommentar).
        statement({
          verbDisplay: 'markerade betalning',
          objectName: 'Bada Extensioner (Test-event)',
          timestamp: minuterSedan(3),
          eventId: 'recEventBada789',
          personId: 'recPersonBada789',
        }),
      ],
      nextCursor: null,
    }));

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();

    await page.getByRole('link', { name: /Enbart Person/ }).click();
    await expect(page).toHaveURL(/\/personer\/recPersonTest456$/);

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();

    // Prioritetsbeviset: raden bär BÅDA extensionerna men länken går till
    // EVENTET, aldrig personen — annars hade denna assertion fällt.
    await page.getByRole('link', { name: /Bada Extensioner/ }).click();
    await expect(page).toHaveURL(/\/event\/recEventBada789$/);
  });

  test('cursor-round-trip via "Ladda fler" (TASK-201.5:s useInfiniteQuery)', async ({
    page,
    network,
  }) => {
    const sida1 = [
      statement({ objectName: 'Post 1', timestamp: minuterSedan(1) }),
      statement({ objectName: 'Post 2', timestamp: minuterSedan(2) }),
    ];
    const sida2 = [statement({ objectName: 'Post 3', timestamp: minuterSedan(3) })];

    // TASK-225.2: EF:en bär `total` — statusraden visar målformen
    // "Visar N av TOTAL". Övriga tester mockar UTAN total och bevisar
    // därmed skew-fallbacken (interimsformen) mot en äldre EF-deploy.
    mockActivityLog(network, (url) => {
      const cursor = url.searchParams.get('cursor');
      if (!cursor) return { statements: sida1, nextCursor: 'c1', total: 3 };
      if (cursor === 'c1') return { statements: sida2, nextCursor: null, total: 3 };
      return { statements: [], nextCursor: null, total: 3 };
    });

    await page.goto('/mer/aktivitetshistorik');
    const loadMore = page.getByRole('button', { name: 'Ladda fler' });

    await expect(page.getByText('Visar 2 av 3 poster.')).toBeVisible();
    await expect(loadMore).toBeVisible();

    await loadMore.click();
    await expect(page.getByText('Post 3')).toBeVisible();
    await expect(page.getByText('Visar alla 3 poster.')).toBeVisible();
    // A11y: aria-live annonserar antalet nya rader (speglar PersonsList.tsx).
    await expect(page.getByText('1 fler post laddade, 3 totalt.')).toHaveCount(1);
    // Sista sidan (nextCursor null) → knappen försvinner.
    await expect(loadMore).toHaveCount(0);
    // A11y: fokus tappas inte vid knappens försvinnande.
    await expect(page.getByText('Visar alla 3 poster.')).toBeFocused();
  });

  test('fel (500) → felytan via role=alert, ingen falsk tom lista', async ({ page, network }) => {
    mockActivityLog(network, () => ({ status: 500 }));
    await page.goto('/mer/aktivitetshistorik');

    // Default QueryClient-retry (router.ts: retry 3, retryDelay 200/400/800 ms)
    // — samma härledning som persons-list.acceptance.test.ts:s läs-fel-test
    // (ingen egen 4xx-undantagsgren i useActivityLogHistory). Rundlig marginal.
    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Kunde inte hämta aktivitetshistoriken' });
    await expect(alert).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Ingen aktivitet ännu')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
  });

  test('axe 0 violations på TOM vy', async ({ page, network }) => {
    mockActivityLog(network, () => ({ statements: [], nextCursor: null }));
    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ingen aktivitet ännu')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på IFYLLD vy (grupperad, klickbara + olänkade rader)', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, () => ({
      statements: [
        statement({ timestamp: minuterSedan(5), eventId: 'recEventAxe1' }),
        statement({ objectName: 'Rad utan länk', timestamp: lokalTid(1, 10, 0) }),
      ],
      nextCursor: null,
    }));
    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Igår' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

/**
 * TASK-299.1 — dev-växeln `?sidram=ny` (AC #4): den delade `SidRam`-
 * primitiven i husets kant-i-kant-dialekt (chevron + `px-4`-indragen
 * rubrik), bakom `import.meta.env.DEV`. UTAN parametern är ytan oförändrad
 * — bevisat av svitens övriga tester ovan, ingen navigerar med flaggan.
 * Rivs igen med växeln (TASK-299.2/299.6, ADR-103 B2 steg 4).
 */
test.describe('Aktivitetshistoriken — TASK-299.1 dev-växel `?sidram=ny`', () => {
  test('axe 0 violations på TOM vy med den nya sidramen', async ({ page, network }) => {
    mockActivityLog(network, () => ({ statements: [], nextCursor: null }));
    await page.goto('/mer/aktivitetshistorik?sidram=ny');
    await expect(page.getByText('Ingen aktivitet ännu')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på IFYLLD vy med den nya sidramen', async ({ page, network }) => {
    mockActivityLog(network, () => ({
      statements: [statement({ timestamp: minuterSedan(5), eventId: 'recEventAxe1' })],
      nextCursor: null,
    }));
    await page.goto('/mer/aktivitetshistorik?sidram=ny');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
