import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventNoteSchema, EventSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * task-18.11 — Anteckningar (S73-facit K66–K71, ADR-075): tidsstämplad ström
 * (composer överst, nyast först), server-satt författare, HÄRLEDD Under/Efter-fas
 * (Innan omärkt) och auto-grow-composern.
 *
 * ACCEPTANCE-KLASSEN (task-59.6, ADR-080): filen flyttades hit ur e2e-sviten med
 * hela sitt bevisinnehåll intakt — a11y-assertionen inkluderad. Klassningen är
 * HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 17 restanrop,
 * samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstren byggs med `EF(namn)`
 * ur handlers-modulen och svaren med `json(...)`, aldrig som handskrivna strängar
 * — en överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler). VERBEN ÄR
 * VERIFIERADE mot appens anropsväg, inte antagna: `get-event`/`get-registrations`/
 * `get-attendance`/`get-event-notes` går via `callEdgeFunction` (GET),
 * `create-event-note` via `postEdgeFunction` (POST).
 *
 * `create-event-note` SKRIVER INTE SKARPT: anropet är avlyssnat, och det som bevisas
 * är klientflödet plus PAYLOADEN appen skickar (server-side-författar-beviset nedan).
 * SERVER-kontraktet (allowlist, faktisk skrivning, server-satt författare, omläsning)
 * bevisas av `tests/api/create-event-note.staging.test.ts` mot skarp staging och
 * ligger kvar där — filen är INTE i denna diff.
 *
 * VÄLJARENS LISTQUERY BÄRS AV NORMALLÄGET: e2e-formen stubbade `get-events` med
 * `mockValjarLista` för att slippa läcka mot staging. I acceptance-klassen finns
 * `get-events` redan i normalläget (`handlers.ts`), och denna fil asserterar
 * ingenting om listan — den behöver bara ett deterministiskt svar. Överskuggningen
 * är därför borta, inte glömd.
 */

const EVENT_ID = 'recNOTES000000001';

/**
 * Härledda ur schemana, ej beskrivna bredvid dem (TASK-63) — se `acceptance-bas.ts`
 * § fogen. Filen mockar TVÅ läs-EF:er med olika svarsform, så det tidigare
 * gemensamma `Json`-aliaset delas.
 */
type EventRow = z.infer<typeof EventSchema>;
type NoteRow = z.infer<typeof EventNoteSchema>;

/**
 * `Json` finns KVAR — men bara för den infångade REQUEST-payloaden, aldrig för en
 * fixturrad. Den är det appen SKICKAR till create-event-note, inte det EF:en
 * svarar, och har därför inget läs-schema att härledas ur; att binda den till
 * `EventNoteSchema` vore att påstå att write-formen är läs-formen. Testet
 * asserterar payloaden strukturellt (`toEqual`), vilket är rätt fog för den.
 */
type Json = Record<string, unknown>;

// Genomfört event 10–11 juni 2026 → fas-etiketterna kan bevisas (Under/Efter/Innan).
function eventGenomfort(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-06-10',
    slutdatum: '2026-06-11',
    tidKvarTillEvent: 'Avslutat',
    maxPlatser: 12,
    antalAnmalda: 0,
    platserKvar: 12,
    anmaldBelaggning: 0,
    bekraftadBelaggning: 0,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: 'Genomfört',
    eventKey: 'Event-42',
    ...overrides,
  };
}

// Demo-strömmen som EF:en levererar (redan sorterad nyast först). Tidpunkterna är
// alla mitt på dagen → fas-härledningen (dag mot eventdagarna) är tidszons-robust.
const NOTE_EFTER = {
  id: 'recNoteC',
  forfattare: 'Roger',
  text: 'Uppföljningsmail skickat till alla deltagare.',
  tidpunkt: '2026-06-15T09:00:00.000Z', // efter slut (06-11) → Efter eventet
  eventId: EVENT_ID,
};
const NOTE_UNDER = {
  id: 'recNoteB',
  forfattare: 'Lotta',
  text: 'Fin energi i gruppen efter förmiddagspasset.\nEn deltagare åkte hem tidigare.',
  tidpunkt: '2026-06-10T12:00:00.000Z', // på startdagen → Under eventet
  eventId: EVENT_ID,
};
const NOTE_INNAN = {
  id: 'recNoteA',
  forfattare: 'Roger',
  text: 'Lokalen bokad och betald.',
  tidpunkt: '2026-06-01T10:00:00.000Z', // före start → Innan (omärkt, tysta normen)
  eventId: EVENT_ID,
};
const DEMO_NOTES = [NOTE_EFTER, NOTE_UNDER, NOTE_INNAN];

interface MockOpts {
  notes?: NoteRow[];
  notesStatus?: number;
}

/**
 * Mockar hela eventsidan för Anteckningar-fokus. get-event-notes är STATEFUL: en
 * `mutable` lista så att create-event-note kan prepend:a den nya noten och den
 * efterföljande refetchen (onSettled-invalidering) ser den. `captured` fångar
 * create-payloaden (för server-side-författar-beviset).
 */
function mockSidan(network: NetworkFixture, opts: MockOpts = {}): { captured: () => Json | null } {
  const notesStatus = opts.notesStatus ?? 200;
  let notesList: NoteRow[] = opts.notes ?? DEMO_NOTES;
  let capturedBody: Json | null = null;

  network.use(
    http.get(EF('get-event'), () => json({ event: eventGenomfort() })),
    // Betalningar/Deltagare/Gruppdynamik + Närvaro (genomfört) — stubbas tomma.
    http.get(EF('get-registrations'), () => json({ registrations: [] })),
    http.get(EF('get-attendance'), () => json({ attendance: [] })),
    http.get(EF('get-event-notes'), () =>
      notesStatus === 200 ? json({ notes: notesList }) : json({ error: 'x' }, notesStatus),
    ),
    http.post(EF('create-event-note'), async ({ request }) => {
      capturedBody = (await request.json()) as Json;
      const created: NoteRow = {
        id: `recNew${notesList.length}`,
        forfattare: 'Lotta',
        text: String(capturedBody.text ?? ''),
        tidpunkt: new Date().toISOString(),
        eventId: EVENT_ID,
      };
      notesList = [created, ...notesList]; // nyast först
      return json(
        { note: created, record: { id: created.id, fields: {}, createdTime: created.tidpunkt } },
        201,
      );
    }),
  );

  return { captured: () => capturedBody };
}

const gruppen = (page: Page) => page.locator('section[aria-labelledby="grupp-anteckningar"]');

test.describe('Anteckningar — strömmen + faserna (task-18.11)', () => {
  test('strömmen renderas nyast först med författare + tidpunkt (aldrig rå ISO) + text', async ({
    page,
    network,
  }) => {
    mockSidan(network);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    await expect(grupp.getByRole('heading', { level: 2, name: 'Anteckningar' })).toBeVisible();

    // Nyast först: författarna i kort-ordning (Roger[efter] → Lotta[under] → Roger[innan]).
    //
    // WEB-FIRST, INTE ÖGONBLICKSBILD (task-64): `allTextContents()` läser EN gång
    // och auto-väntar inte. Raden ovan väntar bara in RUBRIKEN "Anteckningar", som
    // kan vara synlig innan alla tre article-elementen renderats — läsningen såg
    // därför listan i det skick den råkade ha, och jämförelsen efteråt (`toEqual`)
    // retryar inte. Det gjorde testet last-känsligt: uppmätt 3 av 8 fulla lokala
    // svitkörningar utan retries föll här (och 63 % av CI:s acceptance-jobb
    // rapporterade flaky, maskerat av `retries: 2`).
    //
    // `toHaveText(array)` är Playwrights egen form för samma påstående och
    // retryar tills BÅDE antalet element och texterna stämmer — dokumentationen
    // rekommenderar den uttryckligen framför all*Contents() "to prevent
    // flakiness". Att arrayen har tre poster bär dessutom antals-kravet: en
    // halvrenderad ström kan inte passera.
    await expect(grupp.locator('article span.font-semibold')).toHaveText([
      'Roger',
      'Lotta',
      'Roger',
    ]);

    // Texten renderad; radbrytningen bevarad (whitespace-pre-line).
    await expect(grupp.getByText('Uppföljningsmail skickat till alla deltagare.')).toBeVisible();
    await expect(grupp.getByText('Lokalen bokad och betald.')).toBeVisible();

    // Långdatum (Gunilla — aldrig rå ISO i läsytan).
    await expect(grupp.getByText(/1 juni 2026/)).toBeVisible();
    // FRÅNVARO-ASSERTIONEN ÄR ORDNINGSBEROENDE (task-64) — och ordningen är
    // BÄRANDE, inte kosmetisk. Noll träffar är sant också på ett tomt DOM, så
    // raden kan bara fälla när strömmen är BEVISAT renderad först. Beviset står
    // ovan: `toHaveText`-raden kräver exakt tre kort, och långdatum-raden kräver
    // att just detta datum renderats i läsbar form. Flyttas raden uppåt förbi
    // dem slutar den kunna fälla — den blir grön på fel grund, vilket är
    // allvarligare i tysthet än en flaky rad (den föregående formen,
    // `expect(await …count()).toBe(0)`, hade samma brist).
    await expect(grupp.getByText('2026-06-01T10:00:00.000Z')).toHaveCount(0);
  });

  test('fas-etiketterna härleds: Efter/Under markeras, Innan är omärkt (tysta normen)', async ({
    page,
    network,
  }) => {
    mockSidan(network);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    const kort = grupp.locator('article');

    // Kort 0 (nyast, 15 juni) = Efter; kort 1 (10 juni, startdagen) = Under;
    // kort 2 (1 juni, före start) = Innan → INGEN fas-etikett.
    await expect(kort.nth(0)).toContainText('Efter eventet');
    await expect(kort.nth(1)).toContainText('Under eventet');
    await expect(kort.nth(2)).not.toContainText('Under eventet');
    await expect(kort.nth(2)).not.toContainText('Efter eventet');
  });

  test('composern skriver via create-event-note: payloaden bär ENDAST eventId + text (författaren är server-side)', async ({
    page,
    network,
  }) => {
    const { captured } = mockSidan(network);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    const ruta = grupp.getByRole('textbox', { name: 'Ny anteckning' });
    await ruta.fill('Ny testanteckning från composern');
    await grupp.getByRole('button', { name: 'Spara', exact: true }).click();

    // Den nya noten dyker upp (refetch efter settle) och rutan töms.
    await expect(grupp.getByText('Ny testanteckning från composern')).toBeVisible();
    await expect(ruta).toHaveValue('');

    // SERVER-SIDE-FÖRFATTAR-BEVIS: klienten skickade ALDRIG forfattare (ADR-075).
    expect(captured()).toEqual({ eventId: EVENT_ID, text: 'Ny testanteckning från composern' });
  });

  /**
   * INTEGRITETS-VAKTEN (S105 kritiska kontroller, 2026-08-13) — PRD TASK-201
   * användarberättelse 10 + TASK-201.4 AC #2: en antecknings-post bär ATT något
   * antecknades, ALDRIG innehållet.
   *
   * VARFÖR DETTA TEST BEHÖVS TROTS ATT AC #2 REDAN ÄR AVBOCKAT: det befintliga
   * beviset (`tests/api/activity-log-resterande-statements.test.ts` § "AC #2 —
   * REGRESSIONSVAKT") bygger EGNA LOKALA KOPIOR av statementen och visar att
   * `eventActivityName()` ignorerar en tänkt anteckningstext. Det bevisar
   * hjälpfunktionen — inte att den VERKLIGA mutationskedjan (composern →
   * `useCreateEventNote.onSuccess` → `recordActivity` → `log-activity`)
   * avstår från texten. Skulle någon framtida ändring interpolera in
   * `text`-variabeln i `object.name` hade det gamla testet förblivit grönt.
   * Denna vakt läser den FAKTISKA utgående payloaden och kan därför fälla.
   *
   * Loggen är APPEND-ONLY (`service_role` har bara SELECT+INSERT — se
   * `supabase/migrations/20260812143131_grant_service_role_activity_log.sql`),
   * så en läckt anteckningstext i prod går strukturellt INTE att städa bort.
   * Det är skälet till att vakten sitter i den hermetiska klassen, där den
   * körs på varje PR, och inte som ett manuellt QA-steg.
   *
   * Söker i HELA serialiserade payloaden, inte bara `object.definition.name`:
   * en läcka kan lika gärna hamna i en extension, ett verb-display eller ett
   * framtida fält, och en assertion som bara tittar på det fält vi råkar
   * misstänka idag skyddar inte mot morgondagens form.
   */
  test('INTEGRITET (AC #2, användarberättelse 10): anteckningens TEXT når ALDRIG log-activity-payloaden — bara ATT något antecknades', async ({
    page,
    network,
  }) => {
    mockSidan(network);

    // Distinkt, omisskännlig sträng: träffar den i payloaden är det ett
    // äkta läckage, aldrig en slump i en fixtur eller ett eventnamn.
    const HEMLIG_TEXT = 'KANSLIG-ANTECKNING-Deltagaren har en pagaende konflikt med sin bror';

    let aktivitetsPayload: string | null = null;
    // Lokal override EFTER mockSidan(): MSW prövar senast-registrerade handler
    // först (samma mönster som `anmalan-detalj.acceptance.test.ts` § fire-and-
    // forget-testet), så denna vinner över normallägets log-activity-handler.
    network.use(
      http.post(EF('log-activity'), async ({ request }) => {
        const body = (await request.json()) as {
          id: string;
          timestamp: string;
          context: { extensions: Record<string, string> };
        };
        aktivitetsPayload = JSON.stringify(body);
        return json(
          {
            id: body.id,
            requestId: Object.values(body.context.extensions)[0],
            occurredAt: body.timestamp,
          },
          201,
        );
      }),
    );

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    await grupp.getByRole('textbox', { name: 'Ny anteckning' }).fill(HEMLIG_TEXT);
    await grupp.getByRole('button', { name: 'Spara', exact: true }).click();

    // Anteckningen sparades PÅ RIKTIGT (texten renderas i strömmen) — utan
    // detta steg vore frånvaro-assertionen nedan sann på ett tomt flöde och
    // kunde aldrig fälla (samma ordningsberoende som strömtestets
    // FRÅNVARO-ASSERTION ovan beskriver).
    await expect(grupp.getByText(HEMLIG_TEXT)).toBeVisible();

    // Loggningen skedde (fire-and-forget → vänta in anropet).
    await expect.poll(() => aktivitetsPayload).not.toBeNull();

    const payload = aktivitetsPayload as unknown as string;
    // KÄRNAN: hela statementet är fritt från anteckningens innehåll.
    expect(payload).not.toContain(HEMLIG_TEXT);
    expect(payload).not.toContain('KANSLIG-ANTECKNING');
    expect(payload).not.toContain('konflikt');

    // Och posten bär ändå ATT något hände: verbet + eventets namn, inget mer.
    const statement = JSON.parse(payload) as {
      verb: { display: Record<string, string> };
      object: { definition: { name: Record<string, string>; type: string } };
    };
    expect(statement.verb.display['sv-SE']).toBe('antecknade');
    expect(statement.object.definition.type).toContain('/activity-types/anteckning');
    expect(statement.object.definition.name['sv-SE']).toBe('Resor i medvetandet 1');
  });

  test('composern är auto-grow: field-sizing content + resize avstängd (facit-formen)', async ({
    page,
    network,
  }) => {
    mockSidan(network);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const ruta = gruppen(page).getByRole('textbox', { name: 'Ny anteckning' });
    const stil = await ruta.evaluate((el: Element) => {
      const s = getComputedStyle(el);
      return {
        resize: s.resize,
        fieldSizing: (s as unknown as { fieldSizing?: string }).fieldSizing,
      };
    });
    expect(stil.resize).toBe('none');
    // Chromium stöder field-sizing (autoGrow); värdet ska vara 'content'.
    expect(stil.fieldSizing).toBe('content');
  });

  test('tomt läge: lugn textrad när eventet saknar anteckningar', async ({ page, network }) => {
    mockSidan(network, { notes: [] });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Review-våg 2 (Marcus 2026-07-23): "Inga anteckningar ännu" och inget
    // mer — förklarings-svansen riven.
    await expect(gruppen(page).getByText('Inga anteckningar ännu', { exact: true })).toBeVisible();
  });

  test('läs-fel: get-event-notes 500 → role=alert i gruppen, resten av sidan intakt', async ({
    page,
    network,
  }) => {
    mockSidan(network, { notesStatus: 500 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // TIMEOUTEN ÄR RÄKNAD OCH MÄTT, INTE ÄRVD. 500 är retry-bart i BÅDA lagren
    // — kedjan och pekarna till källan står i `acceptance-bas.ts`
    // § SKRIVA ETT TEST I KLASSEN (härledningen bor där, inte här). `Strommen`s
    // retry-predikat undantar bara 4xx, så 500 går hela vägen: 4 query-försök ×
    // 4 HTTP-försök = 16 förfrågningar innan felytan finns att assertera på.
    //
    // KONSTRUERAT VÄRSTA FALL, enbart sömnerna: 4 × 1700 + 1400 = 8200 ms.
    // Termerna, kontrollräkningsbara: `fetchWithRetry` sover 200 + 400 + 800 =
    // 1400 ms per anrop, och jittret är `Math.random() * (baseDelay / 2)` med
    // `baseDelay = 200` (`src/data/utils.ts:60`) — alltså KONSTANT 0–100 ms per
    // sömn. Det skalar INTE med den exponentiella delayen; just det är felet som
    // är lätt att göra (fyndkortets ursprungliga 4 × 2100 + 1400 = 9800 ms antog
    // jitter = delay/2 och är rättat vid källan). Per anrop: 1400 + 3 × 100 =
    // 1700 ms. Ovanpå de fyra anropen lägger QueryClientens `retryDelay`
    // 200 + 400 + 800 = 1400 ms (`src/router.ts:19`, ingen jitter).
    // Bästa fall: 4 × 1400 + 1400 = 7000 ms.
    //
    // MÄTT lokalt (darwin), tiden från expect-anropet till alerten: 7902 · 7916
    // · 7927 · 7931 · 7948 ms i fem isolerade körningar av hela filen, och
    // 7756 ms i en FULL svit med CI-paritet (`CI=1`, retries 2, parallella
    // workers). Att lasten inte syns i talet är väntat och inte tur: kedjan är
    // wall-clock-sömner, inte CPU-arbete. Testets TOTALTID steg däremot
    // 9,7 → 15,1 s under samma last — det är navigering och uppstart, inte
    // kedjan. H1:an köper heller ingen tid: notes-anropet går i samma ögonblick
    // som rubriken finns (mätt: båda ≈ 0,9 s), så assertionen bär hela kedjan.
    //
    // Kedjans FORM är mätt, inte antagen: 16 anrop med mellanrummen
    // 284·403·801 | 206 | 250·500·846 | 406 | 218·475·883 | 806 | 230·436·860 ms
    // — tre sömnar per anrop plus en retryDelay emellan, och varje jitter under
    // 100 ms. Ett jitter som följde delayen hade gett upp mot 1200 ms på
    // 800-sömnen; störst uppmätt är 883. Efter sista anropet gick 346 ms till
    // svarshantering + render.
    //
    // VARFÖR TAKET ÄNDÅ ÄR MÅTTET OCH INTE MÄTNINGEN. Spridningen är liten (sex
    // körningar inom 200 ms) därför att tolv oberoende jitter-drag medelvärdar
    // ut sig — sd ≈ 100 ms kring ~7,6 s sömn. 8200 ms kräver att ALLA tolv
    // landar högt och är därmed en svans, inte ett normalutfall (fyndkortet
    // påstod motsatsen; rättat vid källan). Men ett tak man sällan ser är ändå
    // det tal en timeout ska dimensioneras mot: en timeout är ett skyddsnät, och
    // asymmetrin avgör — för HÖGT tal kostar noll på grönt, för LÅGT ger en
    // falsk röd på en obesläktad commit (samma signal-förstörelse som task-59.7
    // höjde jobbets tak för).
    //
    // DÄRFÖR 20 s OCH INTE 12. 12 s låg 3,8 s över det konstruerade taket
    // (8200 + ~350 ms svarshantering ≈ 8,55 s), före CI:s långsammare runner.
    // 20 s ger ~2,3× och ryms med marginal under Playwrights test-timeout på
    // 30 s (config sätter ingen egen), så ett trasigt felläge fäller fortfarande
    // på assertionen och inte på testramen. Samma tal som
    // `persons-list.acceptance.test.ts` — en kedja, ett tal.
    //
    // KOSTNADEN, ÄRLIGT MÄRKT. På GRÖNT kostar höjningen noll: assertionen
    // löser ut när alerten dyker upp (~7,9 s lokalt mätt). På RÖTT kostar den
    // 8 s extra per försök, och med `retries: 2` i CI upp till 24 s — ARITMETIK
    // på timeout-deltat, inte en CI-mätning. Att den ryms är däremot CI-mätt:
    // acceptance-jobbets median är 407 s mot taket 12 min (`ci-suite.yml`,
    // mätt i CI 2026-07-28).
    await expect(gruppen(page).getByRole('alert')).toContainText(
      'Kunde inte hämta anteckningarna',
      {
        timeout: 20_000,
      },
    );
  });

  test('axe 0 violations — Anteckningar-gruppen (ström + composer)', async ({ page, network }) => {
    mockSidan(network);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      gruppen(page).getByRole('heading', { level: 2, name: 'Anteckningar' }),
    ).toBeVisible();

    const taggar = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const resultat = await new AxeBuilder({ page })
      .include('section[aria-labelledby="grupp-anteckningar"]')
      .withTags(taggar)
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('review-våg 3: composern — Spara + Rensa som visas först vid innehåll (CRM-formen)', async ({
    page,
    network,
  }) => {
    // Marcus (2026-07-23): 'Lägg till anteckning' → 'Spara' + sekundär Rensa
    // som progressive disclosure vid dirty state (CRM-notes-klassens form —
    // HubSpot/Pipedrive-composern; K68–K71 revideras öppet). Rensa tömmer
    // fältet och fokus återförs till skrivrutan (knappen försvinner —
    // fokus får aldrig tappas till body).
    mockSidan(network, { notes: [] });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    const skrivruta = grupp.getByRole('textbox', { name: 'Ny anteckning' });
    const spara = grupp.getByRole('button', { name: 'Spara', exact: true });
    await expect(spara).toBeVisible();
    await expect(spara).toBeDisabled();
    await expect(grupp.getByRole('button', { name: 'Rensa', exact: true })).toHaveCount(0);

    await skrivruta.fill('Utkast som ångras');
    const rensa = grupp.getByRole('button', { name: 'Rensa', exact: true });
    await expect(rensa).toBeVisible();
    await expect(spara).toBeEnabled();

    await rensa.click();
    await expect(skrivruta).toHaveValue('');
    await expect(grupp.getByRole('button', { name: 'Rensa', exact: true })).toHaveCount(0);
    await expect(spara).toBeDisabled();
    await expect(skrivruta).toBeFocused();
  });
});
