import type { Route } from '@playwright/test';
import { verbCopy } from '../../src/data/activityLog/verbCopy';
import { expect, type Page, test } from '../support/test-bas';
import { mockTommaAnteckningar } from './helpers/tomma-anteckningar';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-201.16 — Aktivitetsloggens e2e-skarv: en mail-fri åtgärd utförd i
 * staging → posten syns i hem-spalten ("Senaste aktivitet") UTAN OMLADDNING
 * (TASK-210-beteendet) och i historikvyn (`/mer/aktivitetshistorik`), med
 * rätt aktör, svensk sammanfattning och tid.
 *
 * PRD TASK-201 § Testbeslut speccar skarven ordagrant. Byggplanen § Fas 6.5
 * (docs/byggplan.md:818) namnger filen `tests/e2e/activityLog.spec.ts` —
 * ALDRIG byggd, och namnet är dessutom en STALE plan-referens: `.spec.ts`
 * förekommer ingenstans i denna svit. Den etablerade konventionen för en
 * staging-e2e-fil är `*.staging.test.ts` (`chromium-authenticated`-
 * projektets `testMatch`, playwright.config.ts) — den formen bärs här,
 * ordalydelsen i byggplanen viker (ADR-086 premiss-pass, öppet bokfört i
 * kortets slutrapport).
 *
 * `atgarder-betalningar.staging.test.ts` bevisar redan att en betalnings-
 * avprickning POSTAR ett korrekt xAPI-statement till `log-activity`
 * (TASK-201.3 AC #4, rad ~339–362) — men aldrig att spalten eller
 * historikvyn FAKTISKT visar posten. DENNA fil är den dedikerade skarven för
 * just det: två oberoende LÄS-ytor (`SenasteAktivitet.tsx`/`useLatestActivity`
 * och `AktivitetsHistorik.tsx`/`useActivityLogHistory`) som båda konsumerar
 * `get-activity-log`, verifierade mot samma skrivna post.
 *
 * ÅTGÄRDSTYPEN är en EVENT-ANTECKNING (`useCreateEventNote` →
 * `ANTECKNADE_VERB`, `src/data/mutations/useCreateEventNote.ts`) — mail-fri
 * (ABSOLUT MAILFÖRBUD, appen är i skarp drift) och den ENDA åtgärdstypen
 * vars logg-post per kontrakt ALDRIG får bära anteckningens innehåll
 * (`ACTIVITY_OBJECT_TYPES.anteckning`s egen docstring: "samma ATT-antecknade-
 * handling ... AC #2: aldrig innehåll") — vilket samtidigt täcker kortets
 * AC #3 utan en andra, separat scenario-gren.
 *
 * Deterministisk via `page.route`-mock (mark-paid/atgarder-betalningar-
 * precedentens split): SERVER-write-kontraktet (statement-form, RLS,
 * requestId-round-trip) prövas mot skarp staging i
 * `tests/api/log-activity.staging.test.ts`/`tests/api/get-activity-log.
 * staging.test.ts`; denna e2e bevisar KLIENTENS FULLA KEDJA — verklig
 * composer-interaktion → `create-event-note` → `recordActivity` →
 * `log-activity` → cache-invalidering → `get-activity-log` → BÅDA läsytorna
 * — flak-fritt och utan att mutera delad staging-data. `mutex`en (staging-
 * preflightens semafor) och `auth`en (storageState från `setup`-projektet)
 * är strukturella egenskaper hos `.staging.test.ts`-filklassen självt, precis
 * som i `mark-paid`/`atgarder-betalningar` — ingen egen kod krävs här.
 * `purge-medvetenhet`: eventet/namnen nedan är fiktiva och rör aldrig en
 * Airtable-rad (fullt mockat nätverk) — inget att purga.
 *
 * ALL NAVIGERING EFTER FÖRSTA `goto` ÄR KLIENT-SIDE (TASK-210s egen
 * disciplin, `hem-senaste-aktivitet-farskhet.acceptance.test.ts`s filhuvud):
 * en full sidladdning bygger en ny React Query-cache och hade gjort
 * "UTAN OMLADDNING"-påståendet obevisbart. Resan är Hem (spalten monteras,
 * tomläge) → Nästa event-kortets egen länk → eventsidan (anteckningen skrivs)
 * → TabBar "Hem" (spalten omonteras/monteras om, cachen är nu INAKTIV och
 * INVALIDERAD — exakt TASK-210s reparerade väg) → spaltens egen "Se all
 * aktivitetshistorik"-länk → historikvyn.
 */

const EVENT_ID = 'recAKTLOGGSKARV1';
const EVENT_NAMN = 'Loggskarvprövning';
const NOTE_TEXT = 'Hemlig provanteckning som ALDRIG får synas i aktivitetsloggen.';

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const CREATE_EVENT_NOTE = '**/functions/v1/create-event-note';
const LOG_ACTIVITY = '**/functions/v1/log-activity';
const GET_ACTIVITY_LOG = '**/functions/v1/get-activity-log*';

/** IRI-nyckeln xAPI-statementets `context.extensions` bär `requestId` under
 * (ADR-111) — återgiven här (inte importerad) av samma skäl som
 * `atgarder-betalningar.staging.test.ts`s egna lokala `Aktivitetslogg`-typ:
 * denna fil behöver bara NYCKELN, inte hela Zod-schemat. */
const REQUEST_ID_EXTENSION_IRI = 'https://admin.miranon.dev/xapi/extensions/requestId';

/** Det utgående xAPI-statementets form — bara de fält testet faktiskt läser
 * (samma minimal-typnings-disciplin som `atgarder-betalningar.staging.test.ts`
 * § `Aktivitetslogg`). */
interface UtgaendeStatement {
  id: string;
  actor: { name: string; account: { name: string } };
  verb: { id: string; display: Record<string, string> };
  object: { definition: { name: Record<string, string> } };
  context: { extensions: Record<string, string> };
  timestamp: string;
}

function eventMock(): Record<string, unknown> {
  return {
    id: EVENT_ID,
    eventlabel: `${EVENT_NAMN} (label)`,
    eventNamn: EVENT_NAMN,
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: null,
    maxPlatser: 12,
    antalAnmalda: 0,
    platserKvar: 12,
    anmaldBelaggning: 0,
    bekraftadBelaggning: 0,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    eventKey: 'Event-AKTLOGG',
    reserverade: 0,
    manuelltTillagda: 0,
    viaFormular: 0,
    medfoljande: 0,
    vantelista: 0,
  };
}

interface Rigg {
  /** Statements `log-activity` faktiskt tagit emot (POST-kroppen, oförändrad). */
  loggade: () => UtgaendeStatement[];
}

/**
 * Mockar HELA vägen för eventsidan + aktivitetsloggens BÅDA läsytor. STATEFUL
 * på precis ETT ställe (`get-activity-log`s bakomliggande array) — samma
 * princip som `hem-senaste-aktivitet-farskhet.acceptance.test.ts`s
 * `riggaLoggen()`: servern "kommer ihåg" en post från och med att
 * `log-activity` tagit emot den, vid NÄSTA läsning.
 */
async function mockSidan(page: Page): Promise<Rigg> {
  let statements: UtgaendeStatement[] = [];
  const loggade: UtgaendeStatement[] = [];

  await mockValjarLista(page, [
    valjarRad({
      id: EVENT_ID,
      namn: EVENT_NAMN,
      startdatum: '2099-06-01',
      slutdatum: '2099-06-02',
    }),
  ]);

  await page.route(GET_EVENT, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventMock() }),
    });
  });

  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: [] }),
    });
  });

  // Anteckningsströmmens EGEN visning är inte denna skivas yta (ADR-075
  // täcker den redan) — alltid tom, deterministisk, via delade sömmen
  // (TASK-47).
  await mockTommaAnteckningar(page);

  await page.route(CREATE_EVENT_NOTE, async (route: Route) => {
    const body = route.request().postDataJSON() as { text: string };
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        note: {
          id: 'recSkarvNote00001',
          forfattare: 'Testanvändare',
          text: body.text,
          tidpunkt: new Date().toISOString(),
          eventId: EVENT_ID,
        },
      }),
    });
  });

  await page.route(LOG_ACTIVITY, async (route: Route) => {
    const statement = route.request().postDataJSON() as UtgaendeStatement;
    loggade.push(statement);
    // Servern har tagit emot posten → den ingår i loggen från och med NU,
    // överst (get-activity-log-EF:en sorterar occurred_at desc).
    statements = [statement, ...statements];
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: statement.id,
        requestId: statement.context.extensions[REQUEST_ID_EXTENSION_IRI],
        occurredAt: statement.timestamp,
      }),
    });
  });

  await page.route(GET_ACTIVITY_LOG, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('cursor')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ statements: [], nextCursor: null }),
      });
      return;
    }
    const begart = Number(url.searchParams.get('pageSize') ?? '20');
    const antal = Number.isFinite(begart) && begart > 0 ? begart : 20;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ statements: statements.slice(0, antal), nextCursor: null }),
    });
  });

  return { loggade: () => loggade };
}

// TASK-243.3 (hem-form-skiftet): `data-testid="senaste-aktivitet"` fanns på
// den RETIRERADE `SenasteAktivitet.tsx` (K10-facit, xl-only-spalt). Den
// promoverade Morgonkollen-formen (`SenasteAktivitetKompakt.tsx`, ADR-102/
// 103) bär ingen testid — samma landmärke nås i stället via `aria-labelledby`
// (sektionens `role="region"`, namnet ur h2:n "Senaste aktivitet"), SAMMA
// mönster hem-acceptance-sviternas övriga block-lokatorer redan använder.
// Verifierat att den kombinerade aktör+verb+·+objekt-formen (raden nedan
// bygger `forvantadRad` mot) är STRUKTURELLT OFÖRÄNDRAD i den nya
// komponenten — bara denna lokator behövde bytas, ingenting nedanför.
const spalten = (page: Page) => page.getByRole('region', { name: 'Senaste aktivitet' });
const historikvyn = (page: Page) => page.getByTestId('aktivitetshistorik-yta');

test.describe('Aktivitetsloggens e2e-skarv (TASK-201.16): en anteckning → spalten och historikvyn', () => {
  test('anteckning på ett event syns i hem-spalten UTAN OMLADDNING och i historikvyn — rätt aktör, sammanfattning, tid; innehållet syns ALDRIG', async ({
    page,
  }) => {
    const rigg = await mockSidan(page);

    // ── Utgångsläge: Hem, spalten monteras och hämtar (tomt — inget loggat ännu) ──
    await page.goto('/hem');
    await expect(spalten(page)).toBeVisible();
    await expect(spalten(page).getByText('Ingen aktivitet ännu.')).toBeVisible();

    // ── Klient-side till eventsidan via "Nästa event"-kortets egen länk ──
    await page
      .getByRole('region', { name: 'Nästa event' })
      .getByRole('link', { name: EVENT_NAMN })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: EVENT_NAMN })).toBeVisible();

    // ── Den mail-fria åtgärden: skriv och spara en anteckning ──
    const grupp = page.locator('section[aria-labelledby="grupp-anteckningar"]');
    await grupp.getByRole('textbox', { name: 'Ny anteckning' }).fill(NOTE_TEXT);
    await grupp.getByRole('button', { name: 'Spara', exact: true }).click();

    // Loggningen är fire-and-forget (recordActivity.ts) — vänta tills
    // servern FAKTISKT tagit emot statementet, aldrig en godtycklig tid.
    await expect.poll(() => rigg.loggade().length).toBe(1);
    const [statement] = rigg.loggade();

    // Formen på det som faktiskt postades (round-trip-underlaget för
    // "rätt aktör" nedan — namnet kommer från den RIKTIGA staging-sessionen,
    // aldrig hårdkodat här, samma disciplin som atgarder-betalningar.staging.
    // test.ts § AKTIVITETSLOGGEN).
    expect(statement.actor.name.length).toBeGreaterThan(0);
    // Den LAGRADE displayen är frusen per rad (xAPI-arkivformatet, orört) —
    // se `verbCopy.ts`s docstring. Testets FÖRVÄNTAN nedan får aldrig frysa
    // presentationssträngen separat (TASK-235, regression i b924fb1b): den
    // byggs UR presentationslagret, så en framtida copy-ändring i
    // `verbCopy.ts` aldrig kan tysta detta test av misstag.
    expect(statement.verb.display['sv-SE']).toBe('antecknade');
    expect(statement.object.definition.name['sv-SE']).toBe(EVENT_NAMN);

    const forvantadRad = `${statement.actor.name} ${verbCopy(statement.verb)} · ${EVENT_NAMN}`;

    // ── Tillbaka till Hem, KLIENT-SIDE (TabBar) — cachen var inaktiv och ──
    // invaliderad; detta är precis den återhämtning TASK-210 reparerade.
    await page.getByRole('link', { name: 'Hem' }).click();
    await expect(spalten(page)).toBeVisible();

    // AC #2: posten syns — rätt aktör, svensk sammanfattning, och en tid
    // ("nyss", hela resan tar sekunder — ingen sömn, web-first poll ovan).
    await expect(spalten(page).getByText(forvantadRad)).toBeVisible();
    await expect(spalten(page).getByText('nyss')).toBeVisible();

    // AC #3: anteckningens INNEHÅLL syns ALDRIG — varken i spalten eller
    // NÅGONSTANS på hela Hem-sidan.
    await expect(page.getByText(NOTE_TEXT)).toHaveCount(0);

    // ── Klient-side till historikvyn via spaltens egen länk ──
    await page.getByRole('link', { name: 'Se all aktivitetshistorik' }).click();
    await expect(historikvyn(page)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();

    // AC #2 (andra läsytan): SAMMA post, rätt aktör/sammanfattning/tid.
    //
    // ROTORSAKAD BASELINE-ÄNDRING (task-244, 2026-08-16, disk-verifierad via
    // error-context.md): `forvantadRad` (rad ~271) byggs för SPALTENS form
    // (SenasteAktivitet.tsx — aktör+händelse+·+objekt i EN sammanhängande
    // <span>, TASK-235s facit) — men historikvyns rad (AktivitetsRad,
    // AktivitetsHistorik.tsx, S106-passets DOKUMENTERADE, avsiktliga form)
    // delar aktör+händelse och tid+objekt på TVÅ SEPARATA <p>-element ("tiden
    // som rubrik ... + objekt dämpat efter mittpunkten"). `forvantadRad` kan
    // därför STRUKTURELLT ALDRIG matcha en enda historikvy-nod — bekräftat:
    // error-context.md visade raden som två separata paragrafer ("Lotta
    // skrev en anteckning" / "nyss · Loggskarvprövning"). Detta är den ENDA
    // av kortets fyra fällningar som INTE är TASK-236-relaterad (task-236
    // flaggade den redan som "R1, task-235:s mål, ej rört där") — bara
    // täckt fel-form ärvd av task-235, som verifierade forvantadRad ENDAST
    // mot SenasteAktivitet.tsx:s renderingskedja (kortets egna
    // Implementation Notes), aldrig mot historikvyns.
    await expect(
      historikvyn(page).getByText(`${statement.actor.name} ${verbCopy(statement.verb)}`),
    ).toBeVisible();
    await expect(historikvyn(page).getByText(`nyss · ${EVENT_NAMN}`)).toBeVisible();

    // AC #3 (andra läsytan): innehållet syns fortfarande aldrig.
    await expect(page.getByText(NOTE_TEXT)).toHaveCount(0);
  });
});
