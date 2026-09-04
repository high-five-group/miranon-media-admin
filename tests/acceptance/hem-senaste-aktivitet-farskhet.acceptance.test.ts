import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import { REQUEST_ID_EXTENSION_IRI, XAPI_IRI_BASE } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * Hem-blocket "Senaste aktivitet" speglar en NYSS loggad handling (TASK-210,
 * Marcus-order 2026-08-13 "Lös det!"). TASK-243.3 — full omskrivning ur
 * `tests/acceptance/hem-senaste-aktivitet-farskhet.acceptance.test.ts` som
 * testade den RETIRERADE K10-formens `data-testid="senaste-aktivitet"`-spalt
 * och raderades helt i `27288c3e` ["full omskrivning i task-243.3"].
 *
 * BUGGEN (oförändrad sedan TASK-210, orört av hem-redesignen): appens globala
 * `staleTime` är 5 min (`src/router.ts`), så `useLatestActivity` serverade
 * cachad data i upp till fem minuter efter en skriven handling. FIXEN:
 * `recordActivity` invaliderar `queryKeys.activityLog.all` när ett statement
 * faktiskt skrivits — den globala `staleTime` är MEDVETET orörd.
 *
 * TVÅSIDIGT bevis, samma disciplin som den raderade filens rigg (ett
 * ensidigt test hade lika gärna passerat om någon sänkt den globala ribban
 * till noll):
 *   1. NEGATIVT (först): /hem → bort → tillbaka UTAN mutation ⇒ INGEN ny
 *      hämtning (staleTime-fönstret orört).
 *   2. POSITIVT (sedan): samma resa MED en loggad mutation emellan ⇒ ny
 *      hämtning, och den nya posten syns.
 *
 * HERMETISKT ENKLARE ÄN E2E-FÖREGÅNGAREN: fixturvärldens klocka är REDAN
 * fryst vid FROZEN_NOW (`hermetic.ts`: `page.clock.setFixedTime`) och rör sig
 * ALDRIG av sig själv (till skillnad från en riktig klocka) — React Querys
 * staleness-jämförelse (`Date.now() - dataUpdatedAt <= staleTime`) kan därför
 * strukturellt ALDRIG förfalla av att testet tar tid att köra. Den negativa
 * riktningen behöver därför ingen egen tidskontroll: bara EXPLICIT
 * invalidering (recordActivity) kan trigga en ny hämtning i detta scenario.
 *
 * ALL NAVIGERING SKER KLIENT-SIDE (länkklick), ALDRIG `page.goto` efter det
 * första besöket — en full sidladdning bygger en ny React Query-cache och
 * hade mätt sin egen omladdning i stället för invalideringen.
 *
 * VÄGEN: Hem-vyns "Nästa event"-block länkar rakt till eventdetaljen
 * (`get-event` normalläget speglar ALLTID `EVENTS_RESPONSE.events[0]`
 * — "Utbildning Skövde" — oavsett eventId i URL:en, se `fixture-data.ts`
 * § `EVENT_DETAIL_RESPONSE`), vars Anteckningar-composer driver
 * `useCreateEventNote` → `recordActivity`. TabBar bär tillbaka till Hem.
 */

const SPALT_NAMN = 'Senaste aktivitet';
/** Fixturvärldens frusna logg (`ACTIVITY_LOG_STATEMENTS`) bär EN känd rad —
 * bevisar att blocket alls är fyllt, med den MAPPADE verb-copyn
 * (`verbCopy.ts`, TASK-225.3), inte fixturens lagrade display. */
const BEFINTLIG_RAD = 'Lotta markerade en betalning · Alva Ekström (Utbildning Skövde)';
/** Radtexten den loggade anteckningen MÅSTE ge, räknad för hand ur koden —
 * inte härledd ur komponenten (tautologi-fällan, samma disciplin som
 * `hem-senaste-aktivitet.acceptance.test.ts`): aktör = 'Lotta' (fixtur-
 * sessionens `user_metadata.display_name`, `tests/support/fixturvarld/
 * hermetic.ts`), verb = 'skrev en anteckning' (`VERB_COPY.antecknade`),
 * objekt = 'Utbildning Skövde' (eventets namn). Mittpunkt-separatorn,
 * Marcus-order 2026-08-12.
 */
const NY_RAD = 'Lotta skrev en anteckning · Utbildning Skövde';
const EVENT_LANK_NAMN = 'Utbildning Skövde';

interface Rigg {
  /** Antal `get-activity-log`-anrop hittills — mätpunkten för båda riktningarna. */
  hamtningar: () => number;
  /** Antal statements servern faktiskt tagit emot via `log-activity`. */
  loggade: () => number;
}

/**
 * STATEFUL rigg — ERSÄTTER normalläget för dessa TRE EF:er i detta test
 * (normalläget `get-activity-log`/`log-activity` är OKOPPLADE: en POST till
 * `log-activity` i normalläget uppdaterar ALDRIG den statiska
 * `ACTIVITY_LOG_STATEMENTS`-listan `get-activity-log` läser ur — se
 * `handlers.ts` § Aktivitetsloggens skrivväg. DENNA fils hela poäng är att
 * bevisa kopplingen, så den bygger sin EGEN, medvetet ihopkopplade variant).
 *
 * `get-activity-log` returnerar EN känd startrad (BEFINTLIG_RAD) plus
 * whatever som loggats sedan dess, alltid nyast först — speglar `pageSize`
 * precis som normalläget.
 */
function riggaLoggen(network: NetworkFixture): Rigg {
  // Fälten nedan är schema-skarpa (`ActivityStatementSchema`), INTE
  // godtyckliga platshållarsträngar — `id`/`actor.account.name`/
  // `context.extensions`-värdet kräver `.uuid()`, `actor.account.homePage`/
  // `verb.id`/`object.id`/`object.definition.type` kräver `.url()`. En
  // icke-konform sträng gör inte testet rött på ett tydligt sätt — den
  // FÅR adapterns `.parse()` att kasta, och `useLatestActivity` går i
  // `isError` i stället: exakt samma DOM-symptom ("element(s) not found")
  // som en hem-form-lokator-bugg, mätt och rättat under detta korts eget
  // bygge (verifierad differential: bytet nedan, ensamt, gjorde testet
  // grönt).
  let statements: unknown[] = [
    {
      id: '00000000-0000-4000-8000-000000000201',
      actor: {
        objectType: 'Agent',
        name: 'Lotta',
        account: { homePage: XAPI_IRI_BASE, name: '00000000-0000-4000-8000-000000000001' },
      },
      verb: {
        id: `${XAPI_IRI_BASE}/verbs/markerade-betalning`,
        display: { 'sv-SE': 'markerade betalning' },
      },
      object: {
        objectType: 'Activity',
        id: `${XAPI_IRI_BASE}/objects/registrations/00000000-0000-4000-8000-000000000201`,
        definition: {
          name: { 'sv-SE': 'Alva Ekström (Utbildning Skövde)' },
          type: `${XAPI_IRI_BASE}/activity-types/anmalan`,
        },
      },
      context: {
        extensions: { [REQUEST_ID_EXTENSION_IRI]: '00000000-0000-4000-9000-000000000201' },
      },
      timestamp: '2026-09-15T08:00:00+02:00',
    },
  ];
  let hamtningar = 0;
  let loggade = 0;

  network.use(
    http.get(EF('get-activity-log'), ({ request }) => {
      hamtningar++;
      const url = new URL(request.url);
      if (url.searchParams.get('cursor')) return json({ statements: [], nextCursor: null });
      const begart = Number(url.searchParams.get('pageSize') ?? '20');
      const antal = Number.isFinite(begart) && begart > 0 ? begart : 20;
      return json({ statements: statements.slice(0, antal), nextCursor: null });
    }),

    http.post(EF('log-activity'), async ({ request }) => {
      const statement = (await request.json()) as {
        id: string;
        timestamp: string;
        context: { extensions: Record<string, string> };
      };
      loggade++;
      // Servern har tagit emot posten → den ingår i loggen från och med nu,
      // överst (EF:en sorterar `occurred_at` desc).
      statements = [statement, ...statements];
      return json(
        {
          id: statement.id,
          requestId: Object.values(statement.context.extensions)[0],
          occurredAt: statement.timestamp,
        },
        201,
      );
    }),

    // Eventsidans note-composer (samma svarsform som `event-anteckningar.
    // acceptance.test.ts` § mockSidan) — finns INTE i normalläget (till
    // skillnad från `get-event-notes`) — utan den fäller hermetik-vakten
    // mutationen.
    http.post(EF('create-event-note'), async ({ request }) => {
      const body = (await request.json()) as { text?: string };
      const created = {
        id: 'recNyAnteckning01',
        forfattare: 'Lotta',
        text: String(body.text ?? ''),
        // FROZEN_NOW — samma frusna klocka appen läser (hermetic.ts) — så den
        // nya postens ålder blir "nyss" (< 1 min), inte härlett/gissat.
        tidpunkt: '2026-09-15T10:00:00.000+02:00',
        eventId: 'recVisualEvent0001',
      };
      return json(
        { note: created, record: { id: created.id, fields: {}, createdTime: created.tidpunkt } },
        201,
      );
    }),
  );

  return { hamtningar: () => hamtningar, loggade: () => loggade };
}

const spalten = (page: Page) => page.getByRole('region', { name: SPALT_NAMN });

/** Klient-side: Hem → eventdetaljen, via "Nästa event"-blockets egen länk. */
async function tillEventet(page: Page): Promise<void> {
  await page
    .getByRole('region', { name: 'Nästa event' })
    .getByRole('link', { name: EVENT_LANK_NAMN })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Klient-side: var som helst → Hem, via TabBar. */
async function tillHem(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Hem' }).click();
  await expect(spalten(page)).toBeVisible();
}

test.describe('Hem-blocket "Senaste aktivitet" speglar en nyss loggad handling (TASK-210)', () => {
  test('BÅDA riktningarna: ingen omhämtning utan mutation — omedelbar färskhet med', async ({
    page,
    network,
  }) => {
    const rigg = riggaLoggen(network);

    // ── Utgångsläge: blocket hämtar en gång och cachar ──────────────────
    await page.goto('/hem');
    await expect(spalten(page)).toBeVisible();
    await expect(spalten(page).getByText(BEFINTLIG_RAD)).toBeVisible();
    await expect(spalten(page).getByRole('listitem')).toHaveCount(1);

    const efterForstaBesoket = rigg.hamtningar();
    expect(efterForstaBesoket).toBeGreaterThan(0);

    // ── RIKTNING 1/2 (NEGATIV): samma resa UTAN mutation ────────────────
    // Bort till eventet och tillbaka. Blocket avmonteras och monteras om,
    // men datan är färsk (global staleTime, 5 min, och klockan är dessutom
    // strukturellt fryst) → INGEN ny hämtning.
    await tillEventet(page);
    await tillHem(page);
    await expect(spalten(page).getByText(BEFINTLIG_RAD)).toBeVisible();

    // DEN KRITISKA ASSERTIONEN för denna riktning: räknaren står still.
    // Hade fixen varit "sänk den globala staleTime" hade detta tal ökat.
    expect(rigg.hamtningar()).toBe(efterForstaBesoket);
    expect(rigg.loggade()).toBe(0);
    // Den nya raden kan inte finnas ännu — ingenting har loggats.
    await expect(spalten(page).getByText(NY_RAD)).toHaveCount(0);

    // ── RIKTNING 2/2 (POSITIV): samma resa MED en loggad mutation ───────
    await tillEventet(page);

    const grupp = page.locator('section[aria-labelledby="grupp-anteckningar"]');
    await grupp.getByRole('textbox', { name: 'Ny anteckning' }).fill('Lokalen är bekräftad.');
    await grupp.getByRole('button', { name: 'Spara', exact: true }).click();

    // Loggningen är fire-and-forget — vänta tills servern FAKTISKT tagit emot
    // statementet, aldrig på en godtycklig tid.
    await expect.poll(() => rigg.loggade()).toBe(1);

    await tillHem(page);

    // DEN KRITISKA ASSERTIONEN för denna riktning: den nya posten syns —
    // utan omladdning, utan att vänta ut fem minuter.
    await expect(spalten(page).getByText(NY_RAD)).toBeVisible();
    await expect(spalten(page).getByText('nyss')).toBeVisible();
    // … och den kom från en VERKLIG omhämtning, inte ur cachen.
    expect(rigg.hamtningar()).toBeGreaterThan(efterForstaBesoket);
    // Blocket är alltjämt två rader — den nyaste trängde inte ut den enda
    // befintliga (fixturens rigg bär bara EN startrad, till skillnad från
    // fem — pageSize-cappen prövas i den syskonsviten).
    await expect(spalten(page).getByRole('listitem')).toHaveCount(2);
  });
});
