import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '../support/test-bas';
import { mockTomNarvaro } from './helpers/tom-narvaro';
import { mockTommaAnteckningar } from './helpers/tomma-anteckningar';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * TASK-145.4 — Betalningsytan: blockets rivning, inflytten och läsyte-formen.
 *
 * Ersätter task-18.8:s svit för samma arbetsyta. Filnamnet behålls
 * ("mark-paid") som betalnings-flödets e2e-hem, men SUBJEKTET har flyttat på
 * TVÅ sätt sedan förra formen:
 *
 * 1. Betalningar är INTE längre ett eget toppnivå-block
 *    (`section[aria-labelledby="grupp-betalningar"]`, PRD TASK-145 § AC #1)
 *    — arbetsytan är inflyttad som fällbar LÄSYTA under registret, inuti
 *    "Anmälda deltagare" (`section[aria-labelledby="grupp-deltagare"]`).
 * 2. Ytan är INTE längre skrivbar. PRD TASK-145 § Implementationsbeslut
 *    river K27-anden öppet ("Lotta lämnar inte sidan för avprickning"):
 *    "en halv redigerbarhet (kryssa ja, skriva nej) är en sämre gräns än
 *    ingen alls." BÅDA betalnings-kryssen, noteringsredigeringen och
 *    Påminn-knappen flyttar till Åtgärds-sidan (TASK-147, ej byggd).
 *    Följaktligen är de gamla SKRIV-testerna (kryssets optimistiska
 *    live-härledning, av-bock, notering-blur-save, Påminn+mailto+historik-
 *    logg, fel-väg-rollback) INTE uppdaterade till nya lokatorer — de är
 *    KONVERTERADE till sin motsats: mekaniska bevis att ytan INTE kan
 *    skriva (DoD #7). Att låtsas testa ett skrivflöde som inte längre
 *    existerar vore otillförlitligt, inte bevarad täckning.
 *
 * "Betalningar — kortet med saknas-deltan"-sviten (de gamla `delta-avgifter`/
 * `delta-slutbetalningar`-testid-testerna mot `BetalningsInnehall`s egen
 * `<dl>`) är RIVEN i sin helhet, inte konverterad: den underliggande summan
 * (avgifter/slutbetalningar mottagna, röda deltan, avbokad-exkludering) är
 * SAMMA formel (`betalningsSplit()`, delad) som TASK-145.1/145.2:s
 * summeringsblock (`HallplatsToppA`) redan renderar ovillkorligt på
 * produktionens eventsida och redan har täckning för
 * (`tests/e2e/event-bor-over.staging.test.ts`, `Anmälningsavgifter…mottagna`-
 * assertionen). Ett duplicerat test mot ett element som inte längre
 * existerar (`BetalningsInnehall`s `<dl>`, borta med toppblocket) hade
 * bevisat samma sanning en gång till, inte utökat täckningen.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt). Deterministisk via
 * `page.route`-mock av get-event + get-registrations + update-record —
 * SERVER-write-kontraktet prövas mot skarp staging i
 * `tests/api/update-record.staging.test.ts`; dessa e2e bevisar klientens
 * form och beteende flak-fritt utan att mutera delad staging-data.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const UPDATE_RECORD = '**/functions/v1/update-record';
// [TASK-436] Beloppen per person kommer ur SAMMA anrop som inkorgen — mockas
// här med facit-rader så ytan är deterministisk (aldrig staging).
const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
// [TASK-438] Inbetalningarna i Händelseloggen kommer ur batch-vägen (POST med
// `anmalanRecordIds`, TASK-437) — mockas per anrop ur begärans egna id:n, så
// mocken svarar servertroget: en grupp per efterfrågat id, tom när inga rader.
const HAMTA_INBETALNINGAR = '**/functions/v1/hamta-inbetalningar*';
const EVENT_ID = 'recBETALNING0001';
// Scenario 2-id för tvåscenario-testerna (S75-diagnos 2): ADR-072 persistar
// query-cachen (throttle-synk ~1 s, src/queries/persist.ts) och global
// staleTime är 5 min (router.ts) — en re-goto på SAMMA id hydreras därför ur
// scenario 1:s cache och refetchar aldrig. Distinkta id ger distinkta
// query-nycklar (['events','detail',id] + ['registrations', event.id]) →
// scenario 1-data kan per konstruktion aldrig servera scenario 2.
const EVENT_ID_2 = 'recBETALNING0002';

type Mock = Record<string, unknown>;

/** Facit-koherent event (FACIT-betalningar-arbetsytan: demo-1-klassen). */
function eventMock(overrides: Mock = {}): Mock {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1 – 2026-07-31',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-07-31',
    slutdatum: '2026-08-01',
    tidKvarTillEvent: '1 vecka och 3 dagar',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 5,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 6,
    status: 'Planerat',
    eventKey: 'Event-21',
    reserverade: 1,
    manuelltTillagda: 1,
    viaFormular: 8,
    medfoljande: 1,
    vantelista: 0,
    // [TASK-436] Priset styr om beloppsraden alls kan finnas (`prisOkant`).
    pris: 2500,
    ...overrides,
  };
}

/** Komplett Registration som passerar RegistrationSchema (.parse i adaptern).
    Samtliga status='Bekräftad (mail skickat)' som DEFAULT — registrets steg-
    hinkar (TASK-145.1) sorterar annars obekräftade överst, vilket är
    korrekt men ovidkommande brus för denna sviten fokus (betalningsytan). */
function reg(id: string, namn: string, overrides: Mock = {}): Mock {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: null,
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: null,
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    ...overrides,
  };
}

/**
 * Facit-listan (fiktiva namn — PII-regeln; FACIT-betalningar-arbetsytan):
 * 8 aktiva → 5 av 8 avgifter mottagna (−3), 2 slutbetalningar (−6);
 * Saknar betalning (6) · Klara (2). Sara har notering (K34-demot: läs-
 * texten). En AVBOKAD rad ingår — den ska ALDRIG räknas (basens Är
 * aktiv-formel) och ska aldrig synas i "Öppna detaljer"-listan.
 */
function facitRegistrations(): Mock[] {
  return [
    reg('recBET000000eva1', 'Eva Lindqvist', { personId: 'recPERSONeva0001' }),
    reg('recBET00000johan', 'Johan Berg'),
    reg('recBET000000sara', 'Sara Nyström', {
      noteringAnmalningsavgift: 'Lovade betala efter lönen',
    }),
    reg('recBET00000peter', 'Peter Åkesson', { anmalningsavgift: 'Mottagen' }),
    reg('recBET00000maria', 'Maria Holm', { anmalningsavgift: 'Mottagen' }),
    reg('recBET0000anders', 'Anders Ek', { anmalningsavgift: 'Mottagen' }),
    reg('recBET00000karin', 'Karin Sjögren', {
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Mottagen',
      noteringAnmalningsavgift: 'Swishade 12/6',
      noteringSlutbetalning: 'Swishade 12/7',
    }),
    reg('recBET000000lars', 'Lars Öhman', {
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Mottagen',
    }),
    // Avbokad — utanför Är aktiv: syns aldrig i räkningar, register eller arbetsyta.
    reg('recBET0000avbokd', 'Avbokad Person', { status: 'Avbokad/Ombokad' }),
  ];
}

/** [TASK-436] EN öppen betalning (Postgres-sanningen bakom "Kvar att betala"),
    i EF-svarets form (`OppenBetalningSchema`). `saknas` är basens tal,
    `gallandePris - summaInbetalt` är det appen faktiskt räknar med. */
function oppen(anmalanRecordId: string, personNamn: string, overrides: Mock = {}): Mock {
  return {
    anmalanRecordId,
    personNamn,
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: 'Resor i medvetandet 1',
    eventStartdatum: '2026-07-31',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: 2500,
    gallandePris: 2500,
    anmalningsavgift: 1000,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: '2026-07-17',
    kvittonAttSkicka: 0,
    oskickadeKvitton: [],
    ...overrides,
  };
}

/** Facit: de sex som saknar något har en rad; Karin och Lars (klara) har ingen.
    Peter/Maria har betalat avgiften (1 000 av 2 500); Anders likaså, men hans
    spegel släpar — det är "Basen släpar"-fallet. */
function facitOppna(): Mock[] {
  return [
    oppen('recBET000000eva1', 'Eva Lindqvist'),
    oppen('recBET00000johan', 'Johan Berg'),
    oppen('recBET000000sara', 'Sara Nyström'),
    oppen('recBET00000peter', 'Peter Åkesson', {
      saknas: 1500,
      summaInbetalt: 1000,
      summaInbetaltSpegel: 1000,
    }),
    oppen('recBET00000maria', 'Maria Holm', {
      saknas: 1500,
      summaInbetalt: 1000,
      summaInbetaltSpegel: 1000,
    }),
    oppen('recBET0000anders', 'Anders Ek', {
      saknas: 2500,
      summaInbetalt: 1000,
      summaInbetaltSpegel: 0,
      spegelIFas: false,
    }),
  ];
}

/** [TASK-438] En inbetalningsrad i EF-svarets form (`InbetalningSchema`). */
function inbet(id: string, anmalanRecordId: string, overrides: Mock = {}): Mock {
  return {
    id,
    anmalanRecordId,
    ogonblicksbildNamn: 'Facit Person',
    ogonblicksbildEvent: 'Resor i medvetandet 1',
    ogonblicksbildEventdatum: '2026-07-31',
    belopp: 1000,
    betalsatt: 'Swish',
    betalningsdatum: '2026-07-15',
    typ: 'inbetalning',
    status: 'aktiv',
    makuleradSkal: null,
    makuleradNar: null,
    bankreferens: null,
    kvittoId: null,
    notering: null,
    skapadAv: 'facit@example.com',
    skapadNar: '2026-07-15T10:00:00.000Z',
    ...overrides,
  };
}

/** [TASK-438] Ett kvitto i EF-svarets form (`KvittoSchema`). */
function kvitto(id: string, inbetalningId: string, overrides: Mock = {}): Mock {
  return {
    id,
    kvittonummer: '2026-0042',
    ar: 2026,
    lopnummer: 42,
    inbetalningId,
    lagringsnyckel: 'kvitton/2026-0042.pdf',
    skickadNar: '2026-07-15T10:05:00.000Z',
    mottagare: 'eva.lindqvist@example.com',
    typ: 'kvitto',
    originalKvittoId: null,
    status: 'skickat',
    skapadNar: '2026-07-15T10:04:00.000Z',
    ...overrides,
  };
}

const EVA_INBET = 'a1a1a1a1-1111-4111-8111-000000000001';
const EVA_ATER = 'a1a1a1a1-1111-4111-8111-000000000002';
const EVA_KVITTO = 'b2b2b2b2-2222-4222-8222-000000000001';
const JOHAN_MAKULERAD = 'a1a1a1a1-1111-4111-8111-000000000003';

/** Facit-grupperna per anmälan: Eva har en Swish-inbetalning med skickat
    kvitto och notering samt en återbetalning utan kvitto; Johan en makulerad
    inbetalning. Alla andra: tomma grupper (EF-kontraktet: tomt, aldrig fel). */
function facitBatchGrupper(): Record<string, { inbetalningar: Mock[]; kvitton: Mock[] }> {
  return {
    recBET000000eva1: {
      inbetalningar: [
        inbet(EVA_INBET, 'recBET000000eva1', {
          kvittoId: EVA_KVITTO,
          notering: 'Swishade från mammas konto',
        }),
        inbet(EVA_ATER, 'recBET000000eva1', {
          belopp: -500,
          betalsatt: 'Bankgiro',
          betalningsdatum: '2026-07-20',
          typ: 'aterbetalning',
          skapadNar: '2026-07-20T10:00:00.000Z',
        }),
      ],
      kvitton: [kvitto(EVA_KVITTO, EVA_INBET)],
    },
    recBET00000johan: {
      inbetalningar: [
        inbet(JOHAN_MAKULERAD, 'recBET00000johan', {
          betalningsdatum: '2026-07-16',
          status: 'makulerad',
          makuleradSkal: 'Dubbelregistrering',
          makuleradNar: '2026-07-17T08:00:00.000Z',
        }),
      ],
      kvitton: [],
    },
  };
}

/** Servertroget batch-svar: EN grupp per efterfrågat id, tom när facit saknar rader. */
function batchSvar(anmalanRecordIds: string[], medFacit: boolean): Mock {
  const facit = medFacit ? facitBatchGrupper() : {};
  return {
    grupper: anmalanRecordIds.map((id) => ({
      anmalanRecordId: id,
      inbetalningar: facit[id]?.inbetalningar ?? [],
      kvitton: facit[id]?.kvitton ?? [],
      jobbfel: [],
    })),
  };
}

async function mockSidan(
  page: Page,
  {
    event = eventMock(),
    registrations = facitRegistrations(),
    oppna = facitOppna(),
    raknare,
    batch,
  }: {
    event?: Mock;
    registrations?: Mock[];
    oppna?: Mock[];
    raknare?: { anrop: number };
    /** [TASK-438] Batch-vägen: `facit` = Evas/Johans inbetalningar i svaret (default TOMMA
        grupper, så sviter skrivna före steg 2 ser samma värld); `anrop`/`ids` räknar och
        fångar begäran; `fel` = antal felsvar (400) som återstår innan mocken svarar 200. */
    batch?: { anrop?: number; ids?: string[][]; fel?: number; facit?: boolean };
  } = {},
) {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  await page.route(GET_EVENT, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event }),
    }),
  );
  await page.route(GET_REGISTRATIONS, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      // Servertrohet: get-registrations?eventId=X returnerar X:s anmälningar —
      // stämpla fixturernas eventId ur eventets id (no-op för EVENT_ID-fallen,
      // håller EVENT_ID_2-scenarierna koherenta utan call-site-brus).
      body: JSON.stringify({
        registrations: registrations.map((r) => ({ ...r, eventId: event.id })),
      }),
    }),
  );
  // Anteckningar-gruppen (task-18.11) fetchar get-event-notes för VARJE event —
  // stubbas tom via delade sömmen (TASK-47, tidigare TASK-205/TASK-212) så
  // eventsidans övriga sviter förblir deterministiska.
  await page.route(HAMTA_OPPNA_BETALNINGAR, (route) => {
    if (raknare) raknare.anrop += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: oppna, forfallna: 0 }),
    });
  });
  // [TASK-438] Batch-vägen (POST). GET-vägen (per anmälan/person) används inte av
  // eventsidan — ett GET-anrop hit vore i sig en regression och släpps vidare
  // till staging där det syns som ett oväntat anrop i räknaren.
  await page.route(HAMTA_INBETALNINGAR, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const kropp = JSON.parse(route.request().postData() ?? '{}') as { anmalanRecordIds?: string[] };
    const ids = kropp.anmalanRecordIds ?? [];
    if (batch) {
      batch.anrop = (batch.anrop ?? 0) + 1;
      batch.ids?.push(ids);
      if ((batch.fel ?? 0) > 0) {
        batch.fel = (batch.fel ?? 0) - 1;
        // 400, inte 500: husets retry-policy (`useBetalningar.ts`, `husetsRetryPolicy`)
        // retryar aldrig 4xx, medan en 5xx retryas i BÅDA lagren (EF-klienten och
        // React Query, TASK-420) och tar långt över expect-timeouten att nå ytan.
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: '{"error":"facit-fel"}',
        });
      }
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(batchSvar(ids, batch?.facit === true)),
    });
  });
  await mockTommaAnteckningar(page);
  // TASK-416.16: eventsidan prefetchar nu get-attendance ovillkorligt
  // (sidmount + Check-in-hover) — se helpers/tom-narvaro.ts.
  await mockTomNarvaro(page);
}

/** Resolva en tokens computed-färg (probe-mönstret — token-kedjan, ej hårdkod). */
async function tokenColor(page: Page, cssVar: string): Promise<string> {
  return page.evaluate((v) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${v})`;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, cssVar);
}

// Referensklockan är BROWSERNS tidszon (playwright.config.ts: timezoneId
// 'Europe/Stockholm'), aldrig Node-processens (UTC i CI) — all datumaritmetik
// och formattering förankras därför explicit i Europe/Stockholm (S75-diagnosen:
// Node-lokal "idag" kan vara en annan kalenderdag än browserns).
const TIDSZON = 'Europe/Stockholm';

const DAGMANAD = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  timeZone: TIDSZON,
});

/** Dagens datumdelar i Europe/Stockholm — oberoende av Node-processens TZ. */
function stockholmIdag(): { ar: number; manad: number; dag: number } {
  const delar = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIDSZON,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const del = (typ: string) => Number(delar.find((p) => p.type === typ)?.value);
  return { ar: del('year'), manad: del('month'), dag: del('day') };
}

/** Startdatum `dagar` dagar från idag (Stockholm-kalenderdag) som ISO-datum. */
function startdatumOmDagar(dagar: number): { iso: string; deadlineText: string } {
  const idag = stockholmIdag();
  // Kalenderaritmetiken görs i UTC-rummet (Date.UTC normaliserar överslag);
  // UTC-midnatt formatterad i Stockholm (alltid UTC+1/+2) är samma kalenderdag.
  const start = new Date(Date.UTC(idag.ar, idag.manad - 1, idag.dag + dagar));
  const iso = start.toISOString().slice(0, 10);
  const deadline = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() - 14),
  );
  return { iso, deadlineText: DAGMANAD.format(deadline) };
}

/** "Anmälda deltagare"-gruppen — arbetsytan är nu INFLYTTAD häri (AC #1/#2),
    inte längre ett eget `grupp-betalningar`-toppblock. */
function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

/** Den fällbara betalnings-arbetsytan SPECIFIKT (Deltagare.tsx:s
    `#deltagare-betalningsdetaljer`) — scopar bort registrets EGNA kort/namn
    så en persons namn i registret inte förväxlas med samma namn i
    arbetsytans egen person-rad. */
function arbetsytan(page: Page) {
  return page.locator('#deltagare-betalningsdetaljer');
}

async function oppnaDetaljer(page: Page) {
  await gruppen(page).getByRole('button', { name: 'Öppna detaljer' }).click();
}

/** En persons EGEN rad inuti den öppna arbetsytan. */
function personRad(page: Page, namn: string) {
  return arbetsytan(page).locator('li').filter({ hasText: namn });
}

test.describe('Betalningsytan — disclosure, flikar, deadline (TASK-145.4 AC #2/#3)', () => {
  test('disclosure öppnar arbetsytan (aria-expanded/controls); flikar med räknare; växling filtrerar', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);

    const grupp = gruppen(page);
    const toggle = grupp.getByRole('button', { name: 'Öppna detaljer' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const regionId = await toggle.getAttribute('aria-controls');
    expect(regionId).toBe('deltagare-betalningsdetaljer');

    await toggle.click();
    const stang = grupp.getByRole('button', { name: 'Stäng detaljer' });
    await expect(stang).toHaveAttribute('aria-expanded', 'true');

    // Flikarna i familje-kapseln (radiogroup-semantik) med facit-räknarna.
    const flikar = arbetsytan(page).getByRole('radiogroup', { name: 'Visa betalningar' });
    const saknarFlik = flikar.getByRole('radio', { name: 'Saknar betalning (6)' });
    const klaraFlik = flikar.getByRole('radio', { name: 'Klara (2)' });
    await expect(saknarFlik).toHaveAttribute('aria-checked', 'true');

    // Saknar-fliken: de sex med minst en obetald linje; klara syns inte.
    await expect(personRad(page, 'Eva Lindqvist')).toBeVisible();
    await expect(personRad(page, 'Peter Åkesson')).toBeVisible();
    await expect(personRad(page, 'Karin Sjögren')).toHaveCount(0);

    await klaraFlik.click();
    await expect(klaraFlik).toHaveAttribute('aria-checked', 'true');
    await expect(personRad(page, 'Karin Sjögren')).toBeVisible();
    await expect(personRad(page, 'Lars Öhman')).toBeVisible();
    await expect(personRad(page, 'Eva Lindqvist')).toHaveCount(0);

    // Avbokad Person syns ALDRIG i arbetsytan (Är aktiv-formeln, oförändrad).
    await expect(arbetsytan(page).getByText('Avbokad Person')).toHaveCount(0);
  });

  test('deadline-badgen bär start-minus-14-regeln: lugnt läge + passerad i error', async ({
    page,
  }) => {
    // Lugnt: start om 20 dagar → deadline om 6 dagar, neutral färg.
    const lugn = startdatumOmDagar(20);
    await mockSidan(page, { event: eventMock({ startdatum: lugn.iso }) });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const badge = arbetsytan(page).getByTestId('betalning-deadline');
    await expect(badge).toHaveText(`Deadline ${lugn.deadlineText} · om 6 dagar`);

    // Passerad: start om 3 dagar → deadline 11 dagar sedan, error-färg.
    await page.unrouteAll();
    const passerad = startdatumOmDagar(3);
    await mockSidan(page, { event: eventMock({ id: EVENT_ID_2, startdatum: passerad.iso }) });
    await page.goto(`/event/${EVENT_ID_2}`);
    await oppnaDetaljer(page);

    const badge2 = arbetsytan(page).getByTestId('betalning-deadline');
    await expect(badge2).toHaveText(`Deadline passerad · ${passerad.deadlineText}`);
    await expect(badge2).toHaveCSS('color', await tokenColor(page, '--mm-error'));
  });

  test('tomläge i fliken: alla har betalat', async ({ page }) => {
    const klara = [
      reg('recBET00000karin', 'Karin Sjögren', {
        anmalningsavgift: 'Mottagen',
        slutbetalning: 'Mottagen',
      }),
    ];
    await mockSidan(page, { registrations: klara });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    await expect(
      arbetsytan(page).getByRole('radio', { name: 'Saknar betalning (0)' }),
    ).toBeVisible();
    await expect(arbetsytan(page).getByText('Alla anmälda har betalat.')).toBeVisible();
  });

  test('utan aktiva anmälningar: ingen "Öppna detaljer" (arbetsytan har inget att visa)', async ({
    page,
  }) => {
    await mockSidan(page, { event: eventMock({ id: EVENT_ID_2 }), registrations: [] });
    await page.goto(`/event/${EVENT_ID_2}`);
    await expect(gruppen(page).getByRole('button', { name: 'Öppna detaljer' })).toHaveCount(0);
  });
});

test.describe('Betalningsytan — LÄSYTA, mekaniskt bevisad (TASK-145.4 AC #5/#9/#10, DoD #7)', () => {
  test('ytan bär inga kryssrutor, textrutor eller knappar per person — DoD #7: noll skriv-affordanser', async ({
    page,
  }) => {
    await mockSidan(page);
    let updateCalled = false;
    await page.route(UPDATE_RECORD, async (route) => {
      updateCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    // [TASK-436] De två permanent inaktiverade kryssrutorna per person är
    // RIVNA (en kontroll som ser ut som en kontroll men inte är det). Noll
    // kryss, noll textrutor, noll knappar inne i person-listan, noll
    // mailto — i BÅDA flikarna.
    for (const flik of ['Saknar betalning (6)', 'Klara (2)']) {
      await arbetsytan(page).getByRole('radio', { name: flik }).click();
      await expect(arbetsytan(page).getByRole('checkbox')).toHaveCount(0);
      await expect(arbetsytan(page).getByRole('textbox')).toHaveCount(0);
      await expect(arbetsytan(page).locator('ul button')).toHaveCount(0);
      await expect(arbetsytan(page).locator('a[href^="mailto:"]')).toHaveCount(0);
    }

    expect(updateCalled).toBe(false);
  });

  test('"Kvar att betala" per person ur öppna betalningar; Klara visar Allt betalt; spegel som släpar sägs rakt ut', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    // Eva: inget inbetalt → hela priset kvar. Peter: avgiften betald → 1 500 kvar.
    const eva = personRad(page, 'Eva Lindqvist');
    await expect(eva.getByText('Kvar att betala', { exact: true })).toBeVisible();
    await expect(eva.getByText('2 500 kr', { exact: true })).toBeVisible();
    await expect(
      personRad(page, 'Peter Åkesson').getByText('1 500 kr', { exact: true }),
    ).toBeVisible();

    // Anders: Postgres säger 1 000 inbetalt, spegeln 0 — pillen på namnraden.
    await expect(personRad(page, 'Anders Ek').getByText('Basen släpar')).toBeVisible();
    await expect(eva.getByText('Basen släpar')).toHaveCount(0);

    // Klara: ingen rad i öppna betalningar — spegeln själv säger klart.
    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    await expect(personRad(page, 'Karin Sjögren').getByText('Allt betalt.')).toBeVisible();
    await expect(personRad(page, 'Lars Öhman').getByText('Allt betalt.')).toBeVisible();
    await expect(arbetsytan(page).getByText('Kvar att betala', { exact: true })).toHaveCount(0);
  });

  test('beloppen hämtas först när detaljerna öppnas — noll anrop vid sidladdning, ett för hela eventet', async ({
    page,
  }) => {
    const raknare = { anrop: 0 };
    await mockSidan(page, { raknare });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(gruppen(page).getByRole('button', { name: 'Öppna detaljer' })).toBeVisible();
    expect(raknare.anrop).toBe(0);

    await oppnaDetaljer(page);
    await expect(personRad(page, 'Eva Lindqvist').getByText('Kvar att betala')).toBeVisible();
    expect(raknare.anrop).toBe(1);

    // Stäng och öppna igen: cachen bär (global staleTime 5 min, router.ts) —
    // en andra öppning kostar inget nytt anrop. Queryn delas med inkorgen, så
    // ett oväntat svar här hade varit en full omhämtning av alla öppna
    // betalningar per klick.
    await gruppen(page).getByRole('button', { name: 'Stäng detaljer' }).click();
    await oppnaDetaljer(page);
    await expect(personRad(page, 'Eva Lindqvist').getByText('Kvar att betala')).toBeVisible();
    expect(raknare.anrop).toBe(1);
  });

  test('Postgres vinner även under Klara: öppen rad trots spegel som säger klart; okänt pris i raden faller tillbaka på basens saknas', async ({
    page,
  }) => {
    const oppna = [
      // Karin: basen säger båda mottagna (fliken Klara), Postgres har 2 000 av
      // 2 500 — raden vinner, och spegelns eftersläpning sägs rakt ut.
      // Basens `saknas` (900) och Postgres-talet (2 500 - 2 000 = 500) SKILJER
      // SIG med avsikt: testet ska fälla en omkastad `??`-ordning, inte bara
      // bevisa att grenen nås (granskningsfynd runda 2).
      oppen('recBET00000karin', 'Karin Sjögren', {
        saknas: 900,
        summaInbetalt: 2000,
        summaInbetaltSpegel: 2500,
        spegelIFas: false,
      }),
      // Eva: raden finns men priset är okänt i Postgres — `kvar` blir null och
      // basens eget `saknas` är det enda talet som finns.
      oppen('recBET000000eva1', 'Eva Lindqvist', { gallandePris: null, saknas: 700 }),
    ];
    await mockSidan(page, { oppna });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    await expect(
      personRad(page, 'Eva Lindqvist').getByText('700 kr', { exact: true }),
    ).toBeVisible();

    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    const karin = personRad(page, 'Karin Sjögren');
    await expect(karin.getByText('Kvar att betala', { exact: true })).toBeVisible();
    await expect(karin.getByText('500 kr', { exact: true })).toBeVisible();
    await expect(karin.getByText('900 kr', { exact: true })).toHaveCount(0);
    await expect(karin.getByText('Basen släpar')).toBeVisible();
    await expect(karin.getByText('Allt betalt.')).toHaveCount(0);
    await expect(personRad(page, 'Lars Öhman').getByText('Allt betalt.')).toBeVisible();
  });

  test('eventet utan pris: EN notis på eventnivå, ingen beloppsrad per person', async ({
    page,
  }) => {
    await mockSidan(page, { event: eventMock({ pris: null }), oppna: [] });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    await expect(arbetsytan(page).getByText('Pris saknas i basen', { exact: true })).toHaveCount(1);
    await expect(arbetsytan(page).getByText('Kvar att betala', { exact: true })).toHaveCount(0);
    await expect(arbetsytan(page).getByText('Inget att betala.')).toHaveCount(0);

    // Klara-fliken vet mer än priset: spegeln säger klart.
    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    await expect(arbetsytan(page).getByText('Pris saknas i basen', { exact: true })).toHaveCount(0);
    await expect(personRad(page, 'Karin Sjögren').getByText('Allt betalt.')).toBeVisible();
  });

  test('Påminn-ikonen/mailto-länken finns inte längre — utskicket flyttar till Åtgärds-sidan', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    // Ingen mailto:-länk kvar NÅGONSTANS på ytan (BÅDA flikarna) — Påminn
    // (K33-slotten) är riven ur läsyte-formen, inte bara dolt.
    await expect(arbetsytan(page).locator('a[href^="mailto:"]')).toHaveCount(0);
    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    await expect(arbetsytan(page).locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('Ej relevant slutbetalning räknas som klar: Allt betalt, ingen kryss- eller textrad', async ({
    page,
  }) => {
    const lista = [
      reg('recBET0000forela', 'Föreläsnings Person', {
        anmalningsavgift: 'Mottagen',
        slutbetalning: 'Ej relevant (för föreläsningar)',
      }),
      reg('recBET00000johan', 'Johan Berg'),
    ];
    await mockSidan(page, {
      registrations: lista,
      oppna: [oppen('recBET00000johan', 'Johan Berg')],
    });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    await arbetsytan(page).getByRole('radio', { name: 'Klara (1)' }).click();
    const rad = personRad(page, 'Föreläsnings Person');
    await expect(rad).toBeVisible();
    await expect(rad.getByText('Allt betalt.')).toBeVisible();
    await expect(rad.getByText('Ej relevant')).toHaveCount(0);
    await expect(rad.getByRole('checkbox')).toHaveCount(0);
  });

  test('axe 0 på öppen arbetsyta (bägge flikarna)', async ({ page }) => {
    // [TASK-438] Med inbetalningar i loggen, så underraderna prövas av axe.
    await mockSidan(page, { batch: { facit: true } });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    await expect(
      arbetsytan(page).getByRole('radiogroup', { name: 'Visa betalningar' }),
    ).toBeVisible();

    const resultsSaknar = await new AxeBuilder({ page }).analyze();
    expect(resultsSaknar.violations).toEqual([]);

    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    const resultsKlara = await new AxeBuilder({ page }).analyze();
    expect(resultsKlara.violations).toEqual([]);
  });
});

test.describe('Händelseloggen som Tidslinje (TASK-145.4 AC #8, formen TASK-436)', () => {
  test('händelserna renderas som Tidslinje med KLOCKSLAG — detaljvyns ordval', async ({ page }) => {
    const lista = [
      reg('recBET000000eva1', 'Eva Lindqvist', {
        status: 'Bekräftad (mail skickat)',
        paminnelseAnmalningsavgiftSkickad: '2026-07-18T09:15:00.000Z',
      }),
    ];
    await mockSidan(page, { registrations: lista });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const eva = personRad(page, 'Eva Lindqvist');
    await expect(
      eva.getByText('Påminnelse om anmälningsavgift skickad', { exact: true }),
    ).toBeVisible();
    await expect(eva.getByText(/18 juli kl\. \d{2}:\d{2}/)).toBeVisible();
  });

  test('senast överst: anmälan, bekräftelse och påminnelse i omvänd tidsordning', async ({
    page,
  }) => {
    const lista = [
      reg('recBET000000eva1', 'Eva Lindqvist', {
        inskickad: '2026-07-10T08:00:00.000Z',
        bekraftelseSkickad: '2026-07-12T09:00:00.000Z',
        paminnelseAnmalningsavgiftSkickad: '2026-07-18T09:15:00.000Z',
      }),
    ];
    await mockSidan(page, { registrations: lista });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const eva = personRad(page, 'Eva Lindqvist');
    // Loggen bär sitt namn i aria, utan synlig rubrik (TASK-436 AC #3).
    await expect(eva.getByRole('list', { name: 'Händelselogg' })).toBeVisible();
    const noder = eva.locator('ol > li');
    await expect(noder).toHaveCount(3);
    await expect(noder.nth(0)).toContainText('Påminnelse om anmälningsavgift skickad');
    await expect(noder.nth(1)).toContainText('Bekräftelsemail skickat');
    await expect(noder.nth(2)).toContainText('Anmälan inkom');
  });

  test('tom logg: frånvaron sägs rakt ut, ingen klump-rad', async ({ page }) => {
    const lista = [reg('recBET00000johan', 'Johan Berg', { status: 'Bekräftad (mail skickat)' })];
    await mockSidan(page, { registrations: lista });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    await expect(
      personRad(page, 'Johan Berg').getByText('Inga händelser ännu för den här personen.'),
    ).toBeVisible();
  });
});

test.describe('Inbetalningarna i Händelseloggen — ett anrop per event (TASK-438)', () => {
  test('noll anrop vid sidladdning, ETT batch-anrop för hela eventet när detaljerna öppnas — med alla aktiva anmälnings-id:n', async ({
    page,
  }) => {
    const batch = { anrop: 0, ids: [] as string[][], facit: true };
    await mockSidan(page, { batch });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(gruppen(page).getByRole('button', { name: 'Öppna detaljer' })).toBeVisible();
    expect(batch.anrop).toBe(0);

    await oppnaDetaljer(page);
    await expect(
      personRad(page, 'Eva Lindqvist').getByText('Inbetalning 1 000 kr · Swish', { exact: true }),
    ).toBeVisible();
    expect(batch.anrop).toBe(1);
    // Batchen bär BÅDA flikarnas personer (fliken byts utan nytt anrop) — och
    // aldrig den avbokade, som inte finns i arbetsytan.
    const ids = batch.ids[0] ?? [];
    expect(ids).toHaveLength(8);
    expect(ids).toContain('recBET000000eva1');
    expect(ids).toContain('recBET00000karin');
    expect(ids).not.toContain('recBET0000avbokd');

    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    await expect(personRad(page, 'Karin Sjögren').getByText('Allt betalt.')).toBeVisible();
    expect(batch.anrop).toBe(1);
  });

  test('inbetalning, återbetalning och makulerad rad som händelser — belopp, betalsätt, kvittostatus, notering — senast överst blandat med utskicken', async ({
    page,
  }) => {
    const lista = [
      reg('recBET000000eva1', 'Eva Lindqvist', {
        inskickad: '2026-07-10T08:00:00.000Z',
        bekraftelseSkickad: '2026-07-12T09:00:00.000Z',
      }),
      reg('recBET00000johan', 'Johan Berg'),
    ];
    await mockSidan(page, { registrations: lista, batch: { facit: true } });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const eva = personRad(page, 'Eva Lindqvist');
    const logg = eva.getByRole('list', { name: 'Händelselogg' });
    // Ordningen: återbetalning 20 juli · inbetalning 15 juli · bekräftelse 12 juli · anmälan 10 juli.
    await expect(logg.getByRole('listitem')).toHaveText([
      /Återbetalning 500 kr · Bankgiro/,
      /Inbetalning 1\s000 kr · Swish/,
      /Bekräftelsemail skickat/,
      /Anmälan inkom/,
    ]);
    // Betalningen bär bara ett datum: dag och månad, aldrig ett påhittat klockslag.
    const inbetalning = logg.getByRole('listitem').filter({ hasText: 'Inbetalning 1 000 kr' });
    await expect(
      inbetalning.getByText('Kvitto 2026-0042 · skickat', { exact: true }),
    ).toBeVisible();
    await expect(
      inbetalning.getByText('Notering: Swishade från mammas konto', { exact: true }),
    ).toBeVisible();
    await expect(inbetalning.getByText('15 juli', { exact: true })).toBeVisible();
    await expect(inbetalning.getByText(/kl\./)).toHaveCount(0);
    const ater = logg.getByRole('listitem').filter({ hasText: 'Återbetalning 500 kr' });
    await expect(ater.getByText('Inget kvitto', { exact: true })).toBeVisible();
    await expect(ater.getByText('20 juli', { exact: true })).toBeVisible();
    // Utskicken har klockslag som förut.
    await expect(
      logg
        .getByRole('listitem')
        .filter({ hasText: 'Bekräftelsemail skickat' })
        .getByText(/12 juli kl\. \d{2}:\d{2}/),
    ).toBeVisible();

    // Johan: makulerad inbetalning syns med sitt skäl — historiken tystas aldrig (ADR-128).
    const johan = personRad(page, 'Johan Berg');
    await expect(johan.getByText('Inbetalning 1 000 kr · Swish', { exact: true })).toBeVisible();
    await expect(johan.getByText('Makulerad: Dubbelregistrering', { exact: true })).toBeVisible();

    // Fortfarande en läsyta: inga knappar, kryss eller textrutor per person.
    await expect(arbetsytan(page).getByRole('checkbox')).toHaveCount(0);
    await expect(arbetsytan(page).getByRole('textbox')).toHaveCount(0);
    await expect(arbetsytan(page).locator('ul button')).toHaveCount(0);
  });

  test('ett fel ger EN ruta med Försök igen som hämtar om; utskicken står kvar under tiden', async ({
    page,
  }) => {
    const lista = [
      reg('recBET000000eva1', 'Eva Lindqvist', { bekraftelseSkickad: '2026-07-12T09:00:00.000Z' }),
    ];
    // Mocken svarar fel tills "Försök igen" nollställer räknaren nedan.
    const batch = { anrop: 0, ids: [] as string[][], fel: 99, facit: true };
    await mockSidan(page, { registrations: lista, batch });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const ruta = arbetsytan(page).getByText('Inbetalningarna kunde inte hämtas', { exact: true });
    await expect(ruta).toBeVisible();
    await expect(arbetsytan(page).getByText('Inbetalningarna kunde inte hämtas')).toHaveCount(1);
    // Utskicken läser basen, inte Postgres — loggen står kvar med dem.
    await expect(
      personRad(page, 'Eva Lindqvist').getByText('Bekräftelsemail skickat', { exact: true }),
    ).toBeVisible();
    await expect(personRad(page, 'Eva Lindqvist').getByText('Inbetalning 1 000 kr')).toHaveCount(0);

    const anropVidFel = batch.anrop;
    expect(anropVidFel).toBeGreaterThanOrEqual(1);
    batch.fel = 0;
    await arbetsytan(page).getByRole('button', { name: 'Försök igen' }).click();
    await expect(
      personRad(page, 'Eva Lindqvist').getByText('Inbetalning 1 000 kr · Swish', { exact: true }),
    ).toBeVisible();
    await expect(ruta).toHaveCount(0);
    expect(batch.anrop).toBe(anropVidFel + 1);
  });
});
