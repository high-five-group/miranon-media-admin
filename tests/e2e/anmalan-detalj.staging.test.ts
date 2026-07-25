import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '@playwright/test';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * task-18.17 — Per-anmälan-detaljvyn (S83-facit, Marcus-låst 2026-07-24):
 * route + läs-shape + vy; Anmäld-radens no-op → Link.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event, get-registrations,
 * get-registration och send-registration-confirmation — samma split som
 * 18.4/18.5/18.6: SERVER-kontraktet (detaljshapen, medföljande-inversen,
 * 404/400/401) bevisas av `tests/api/get-registration.staging.test.ts` mot
 * skarp staging; dessa e2e bevisar KLIENTENS form och beteende flak-fritt.
 *
 * Täckning (AC #2): navigeringen personkortets Anmäld-rad → anmälans sida
 * (Link, inte no-op) med INSTANT-beviset (header ur list-cachen medan
 * detaljen laddar — placeholder-skyddet: ingen "Anmälan #null"), shapen
 * renderad grupp för grupp mot facit (badge/pill/chip/behörighet/relationer/
 * tidslinje senast-överst), bekräfta-åtgärden ur Kontakt-sektionen
 * (optimistisk flytt som överlever refetch), 404-formen, axe 0 i båda
 * statuslägena. Computed-style-assertions (DoD #6): deadline-pillens vita
 * bg-surface + gröna knappens success-token — via token-proben, aldrig
 * hårdkodade färger.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const GET_REGISTRATION = /\/functions\/v1\/get-registration\?/;
const GET_EVENT_NOTES = '**/functions/v1/get-event-notes*';
const CONFIRM = '**/functions/v1/send-registration-confirmation';
const EVENT_ID = 'recANMDETALJ00001';

type Json = Record<string, unknown>;

function eventDetail(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 2',
    eventNamn: 'Resor i medvetandet 2',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-08-10',
    slutdatum: '2026-08-12',
    tidKvarTillEvent: '2 veckor och 3 dagar',
    maxPlatser: 12,
    antalAnmalda: 2,
    platserKvar: 10,
    anmaldBelaggning: 0.17,
    bekraftadBelaggning: 0.08,
    antalNyaAnmalningar: 1,
    antalAnmalningsavgifter: 1,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 2,
    status: 'Planerat',
    eventKey: 'Event-31',
    reserverade: 0,
    manuelltTillagda: 0,
    viaFormular: 1,
    medfoljande: 1,
    vantelista: 0,
    deltagarinfoAutoAvstangt: false,
    ...overrides,
  };
}

/** List-shapens rad (get-registrations, RegistrationSchema) — arbetsköns kort. */
function listRad(overrides: Json = {}): Json {
  return {
    id: 'recAnna',
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna.andersson@example.se',
    telefon: '070-123 45 67',
    eventNamn: 'Resor i medvetandet 2',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-30T12:32:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: 'recPersonAnna0001',
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: 1,
    borOver: true,
    erfarenhetsbadge: null,
    kurshistorik: null,
    ...overrides,
  };
}

/**
 * Detalj-shapen (get-registration, RegistrationDetailSchema) — list-raden +
 * detaljfälten. Baslinjen speglar facit-bilagan k04 (Anna: bekräftad,
 * RIM 2-godkänd via RIM 1-deltagande, +1:an Björn, deadline om 3 dagar).
 */
function detalj(overrides: Json = {}): Json {
  return {
    ...listRad({
      status: 'Bekräftad (mail skickat)',
      bekraftelseSkickad: '2026-07-01T07:15:00.000Z',
      motivering:
        'Har längtat efter att utveckla min medialitet i många år och känner att det är dags nu. ' +
        'Efter RIM 1 i våras har jag övat regelbundet med meditationerna och känner att jag har ' +
        'nått en platå där jag behöver nästa stegs verktyg för att komma vidare i utvecklingen.',
      notering: 'Vill sitta nära dörren (ryggbesvär).',
      kurshistorik: [
        {
          id: 'recDLT0000000001',
          kursnamn: 'Resor i medvetandet 1',
          eventLabel: 'RIM 1 — Skövde 2026-03-15',
          datum: '2026-03-15',
          session: 'Dag 1',
          status: 'Närvarande',
          narvaro: true,
          ort: 'Skövde',
          typ: 'Utbildning',
        },
      ],
      erfarenhetsbadge: 'Resenär steg 1',
    }),
    noteringAnmalningsavgift: 'Swish 2026-07-02',
    anmalanId: 247,
    franFormular: 'Huvudformulär',
    franFormularId: 'selQyiMaRVXuu7Nm5',
    fragorFunderingar: null,
    villkorOk: true,
    eventTyp: 'Utbildning',
    eventOrt: 'Skövde',
    startdatum: '2026-08-10',
    slutdatum: '2026-08-12',
    tidKvar: '2 veckor och 3 dagar',
    eventKey: 'Event-31',
    deadlineSlutbetalning: '2026-07-27',
    dagarKvarTillDeadline: 3,
    plusOneForfraganSkickad: null,
    medfoljandeTillNamn: null,
    plusEttor: [{ id: 'recBjorn', namn: 'Björn Berg' }],
    sidUrl: null,
    utm: null,
    ...overrides,
  };
}

/** Obekräftad +1:a (Björn — facit-bilagan k04-obekraftad). */
function detaljObekraftad(): Json {
  return detalj({
    id: 'recBjorn',
    namn: 'Björn Berg',
    fornamn: 'Björn',
    efternamn: 'Berg',
    email: 'bjorn.berg@example.se',
    telefon: '072-987 65 43',
    status: 'Obekräftad',
    bekraftelseSkickad: null,
    anmalanId: 248,
    inskickad: '2026-07-14T19:05:00.000Z',
    kalla: '+1',
    medfoljandeTill: 'recAnna',
    medfoljandeTillNamn: 'Anna Andersson',
    plusEttor: [],
    plusOneForfraganSkickad: '2026-07-14T19:06:00.000Z',
    franFormular: null,
    franFormularId: null,
    villkorOk: false,
    motivering: null,
    notering: null,
    kurshistorik: null,
    erfarenhetsbadge: null,
    antalGenomfordaEvent: null,
    anmalningsavgift: 'Ej mottagen',
    borOver: false,
    personId: null,
  });
}

/**
 * TILLSTÅNDSBÄRANDE mockar (18.6-mönstret): bekräftelse-anropet muterar
 * detaljen som get-registration serverar, så den optimistiska flytten bevisas
 * överleva onSettled-refetchen (annars hade badgen studsat tillbaka).
 */
async function mocka(
  page: Page,
  {
    detaljer,
    listor = [],
    manualRelease = false,
  }: { detaljer: Json[]; listor?: Json[]; manualRelease?: boolean },
): Promise<{ confirmCalls: Json[]; release: () => void }> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  const confirmCalls: Json[] = [];
  const perId = new Map(detaljer.map((d) => [d.id as string, d]));

  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;

  await page.route(GET_EVENT, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventDetail() }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: listor }),
    });
  });
  await page.route(GET_EVENT_NOTES, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ notes: [] }),
    });
  });
  await page.route(GET_REGISTRATION, async (route: Route) => {
    if (gate) await gate;
    const id = new URL(route.request().url()).searchParams.get('id');
    const hit = id ? perId.get(id) : undefined;
    await route.fulfill({
      status: hit ? 200 : 404,
      contentType: 'application/json',
      body: hit ? JSON.stringify({ registration: hit }) : JSON.stringify({ error: 'Not found' }),
    });
  });
  await page.route(CONFIRM, async (route: Route) => {
    const body = route.request().postDataJSON() as { registrationIds: string[] };
    confirmCalls.push(body as unknown as Json);
    const nu = '2026-07-25T08:00:00.000Z';
    for (const id of body.registrationIds) {
      const d = perId.get(id);
      if (d) {
        perId.set(id, { ...d, status: 'Bekräftad (mail skickat)', bekraftelseSkickad: nu });
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'sent',
        requested: body.registrationIds.length,
        attempted: body.registrationIds.length,
        confirmed: body.registrationIds,
        skipped: [],
        failed: [],
        bekraftelseSkickad: nu,
      }),
    });
  });
  return { confirmCalls, release };
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

test.describe('Per-anmälan-detaljvyn (task-18.17)', () => {
  test('navigering: personkortets Anmäld-rad är en LINK — INSTANT-header ur list-cachen, detaljen fylls på', async ({
    page,
  }) => {
    const lista = [listRad()]; // Obekräftad → kortet står i den ÖPPNA kön
    const { release } = await mocka(page, {
      detaljer: [detalj({ status: 'Obekräftad', bekraftelseSkickad: null })],
      listor: lista,
      manualRelease: true,
    });

    await page.goto(`/event/${EVENT_ID}`);

    // Anmäld-raden är en riktig LÄNK (no-op-knappen UTBYTT — AC #2) med
    // facit-K62-namnet.
    const anmaldRad = page.getByRole('link', { name: 'Öppna anmälan för Anna Andersson' });
    await expect(anmaldRad).toBeVisible();
    await anmaldRad.click();
    await expect(page).toHaveURL(`/event/${EVENT_ID}/anmalan/recAnna`);

    // INSTANT (ADR-078): headern står DIREKT ur list-cachen (namn + status)
    // medan detaljen laddar — och placeholder-skyddet håller: ingen
    // "Anmälan #"-pill förrän autonumret finns på riktigt.
    await expect(page.getByRole('heading', { level: 1, name: 'Anna Andersson' })).toBeVisible();
    await expect(page.getByText('Obekräftad', { exact: true })).toBeVisible();
    await expect(page.getByText(/Anmälan #/)).toHaveCount(0);
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();

    // Detaljen släpps → grupperna fylls på och pillen får sitt riktiga nummer.
    release();
    await expect(page.getByText('Anmälan #247')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Avser' })).toBeVisible();

    // Tillbaka-chevronen → eventsidan (kortets route-beslut).
    await expect(page.getByRole('link', { name: 'Tillbaka till eventet' })).toHaveAttribute(
      'href',
      `/event/${EVENT_ID}`,
    );
  });

  test('shapen mot facit (bekräftad): badge + tid, behörighet härledd, deadline-pill, relationer, formulär-chip, tidslinje senast överst', async ({
    page,
  }, testInfo) => {
    await mocka(page, { detaljer: [detalj()] });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/event/${EVENT_ID}/anmalan/recAnna`);

    // Header: h1 + autonummer-pill + tonal success-badge med tidsstämpel.
    const heading = page.getByRole('heading', { level: 1, name: 'Anna Andersson' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByText('Anmälan #247')).toBeVisible();
    await expect(page.getByText('Bekräftad', { exact: true })).toBeVisible();
    await expect(page.locator('header').getByText('1 juli 2026 kl. 09:15')).toBeVisible();

    // Kontakt FÖRST — bekräftad anmälan bär INGEN åtgärdsrad (handlingen är gjord).
    await expect(page.getByText('anna.andersson@example.se')).toBeVisible();
    await expect(page.getByText('070-123 45 67')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skicka bekräftelse' })).toHaveCount(0);

    // Avser: eventlänken (namn + EventKey) → eventsidan; raderna; BEHÖRIGHETEN
    // HÄRLEDD ur verifierat deltagande — grunden länkad till personkortet.
    // Grupperna scope:as via DetaljGrupps aria-labelledby-id (unikt per grupp —
    // sidRams yttre <section> gör ett rent section-has-uppslag tvetydigt).
    const avser = page.locator('section[aria-labelledby="grupp-eventet"]');
    const eventLank = avser.getByRole('link', { name: /Resor i medvetandet 2/ });
    await expect(eventLank).toHaveAttribute('href', `/event/${EVENT_ID}`);
    await expect(avser.getByText('Event-31')).toBeVisible();
    await expect(avser.getByText('Utbildning', { exact: true })).toBeVisible();
    await expect(avser.getByText('10 augusti 2026 – 12 augusti 2026')).toBeVisible();
    await expect(avser.getByText('2 veckor och 3 dagar')).toBeVisible();
    await expect(avser.getByText('Godkänd för RIM 2')).toBeVisible();
    const grund = avser.getByRole('link', {
      name: 'RIM 1 verifierad via deltagande (mars 2026)',
    });
    await expect(grund).toHaveAttribute('href', '/personer/recPersonAnna0001');

    // Betalningar: RÅ status + symmetriska noteringar (avgiftens notering satt,
    // slutbetalningens tomma rad visar 'Ingen notering' — aldrig ett hål) +
    // deadline med VIT dagar-kvar-pill (EventCards status-slot-grammatik;
    // computed-style-bevis mot bg-surface-token — DoD #6).
    const betalningar = page.locator('section[aria-labelledby="grupp-betalningar"]');
    await expect(betalningar.getByText('Mottagen', { exact: true })).toBeVisible();
    await expect(betalningar.getByText('Ej mottagen', { exact: true })).toBeVisible();
    await expect(betalningar.getByText('Swish 2026-07-02')).toBeVisible();
    await expect(betalningar.getByText('Ingen notering')).toBeVisible();
    await expect(betalningar.getByText('27 juli 2026')).toBeVisible();
    const pill = page.getByTestId('deadline-pill');
    await expect(pill).toHaveText('3 dagar kvar');
    await expect(pill).toHaveCSS('background-color', await tokenColor(page, '--mm-surface'));

    // Uppgifter: platser + bor över + relationerna som mini-kort (hela ytan
    // klickbar — länkarna bär namn + roll).
    const uppgifter = page.locator('section[aria-labelledby="grupp-uppgifter"]');
    await expect(uppgifter.getByText('Bor över')).toBeVisible();
    await expect(uppgifter.getByText('Ja', { exact: true })).toBeVisible();
    const plusEtta = page.getByRole('link', { name: 'Björn Berg Medföljande (+1)' });
    await expect(plusEtta).toHaveAttribute('href', `/event/${EVENT_ID}/anmalan/recBjorn`);
    const personkort = page.getByRole('link', { name: 'Anna Andersson Personkort' });
    await expect(personkort).toHaveAttribute('href', '/personer/recPersonAnna0001');

    // Ansökningssvar: läs mer-klippet (aria-expanded-kontraktet).
    const lasMer = page.getByRole('button', { name: 'Läs mer: Motivering' });
    await expect(lasMer).toHaveAttribute('aria-expanded', 'false');
    await lasMer.click();
    await expect(page.getByRole('button', { name: 'Visa mindre: Motivering' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // Inkom: inskickad med klockslag · formulärnamnet med kopierbart
    // options-ID (mono-chip) · Källa 'Formulär' (normen — dd-exakt så
    // radetiketten "Formulär" inte förväxlas) · Villkor 'Ja'.
    const inkom = page.locator('section[aria-labelledby="grupp-inkom"]');
    await expect(inkom.getByText('30 juni 2026 kl. 14:32')).toBeVisible();
    await expect(inkom.getByText('Huvudformulär')).toBeVisible();
    const chip = inkom.getByRole('button', {
      name: 'Kopiera formulär-ID: selQyiMaRVXuu7Nm5',
    });
    await expect(chip).toBeVisible();
    await page.context().grantPermissions(['clipboard-write']);
    await chip.click();
    await expect(chip).toContainText('Kopierat!');
    await expect(inkom.locator('dd').filter({ hasText: /^Formulär$/ })).toBeVisible();
    await expect(inkom.getByText('Ja', { exact: true })).toBeVisible();

    // Interna noteringar: interimet — dagens fält UTAN författarrad.
    await expect(page.getByText('Vill sitta nära dörren (ryggbesvär).')).toBeVisible();

    // Händelser: SENAST ÖVERST — bekräftelsen (1 juli) före inkom (30 juni).
    const handelser = page
      .locator('section[aria-labelledby="grupp-handelser"]')
      .getByRole('listitem');
    await expect(handelser).toHaveCount(2);
    await expect(handelser.nth(0)).toContainText('Bekräftelsemail skickat');
    await expect(handelser.nth(1)).toContainText('Anmälan inkom via Huvudformulär');

    // Facit-avprickningens renderade dump (DoD #6; 390×844 — 18.8-formen).
    await page.screenshot({
      path: testInfo.outputPath('facit-18-17-bekraftad.png'),
      fullPage: true,
    });
  });

  test('obekräftad +1:a: åtgärdsraden i Kontakt (grön 18.16-knapp) bekräftar optimistiskt; +1-formerna renderas ärligt', async ({
    page,
  }, testInfo) => {
    const { confirmCalls } = await mocka(page, { detaljer: [detaljObekraftad()] });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/event/${EVENT_ID}/anmalan/recBjorn`);

    // Header: warning-badge utan tidsstämpel.
    await expect(page.getByRole('heading', { level: 1, name: 'Björn Berg' })).toBeVisible();
    await expect(page.getByText('Obekräftad', { exact: true })).toBeVisible();
    await expect(page.getByText('Anmälan #248')).toBeVisible();

    // Behörigheten HÄRLEDD utan deltagande-belägg — ej-verifierad, grunden ärlig.
    await expect(page.getByText('Ej verifierad för RIM 2')).toBeVisible();
    await expect(page.getByText('Inget deltagande för RIM 1 registrerat')).toBeVisible();

    // +1-formerna: huvudanmälans mini-kort · Formulär '—' · Källa '+1' ·
    // villkoren EJ TILLÄMPLIGT (aldrig ett falskt "Nej").
    const huvud = page.getByRole('link', {
      name: 'Anna Andersson Huvudanmälan (denna anmälan är +1)',
    });
    await expect(huvud).toHaveAttribute('href', `/event/${EVENT_ID}/anmalan/recAnna`);
    await expect(page.getByText('Ej tillämpligt (+1)')).toBeVisible();

    // Tidslinjen: +1-proveniensen (skapad som medföljande) + förfrågan.
    const handelser = page
      .locator('section[aria-labelledby="grupp-handelser"]')
      .getByRole('listitem');
    await expect(handelser.nth(0)).toContainText('Plus-one-förfrågan skickad');
    await expect(handelser.nth(1)).toContainText(
      'Anmälan skapad som medföljande (+1) till Anna Andersson',
    );

    // Åtgärdsraden: texten + GRÖNA knappen (18.16-regeln: når utomstående ⇒
    // success-token; computed-style-bevis, DoD #6).
    await expect(page.getByText('Bekräftelsen skickas till e-postadressen ovan.')).toBeVisible();
    const knapp = page.getByRole('button', { name: 'Skicka bekräftelse' });
    await expect(knapp).toHaveCSS(
      'background-color',
      await tokenColor(page, '--mm-button-success-bg'),
    );

    // Facit-avprickningens renderade dump (DoD #6) FÖRE bekräftelsen.
    await page.screenshot({
      path: testInfo.outputPath('facit-18-17-obekraftad.png'),
      fullPage: true,
    });

    // Klicket: EN POST med exakt detta ID; optimistisk flytt (badge + tid) som
    // ÖVERLEVER refetchen (den tillståndsbärande mocken serverar nya läget);
    // åtgärdsraden försvinner och tidslinjen får mail-händelsen.
    await knapp.click();
    await expect(page.getByText('Bekräftad', { exact: true })).toBeVisible();
    await expect(page.getByText('Skicka bekräftelse')).toHaveCount(0);
    await expect(handelser.nth(0)).toContainText('Bekräftelsemail skickat');
    expect(confirmCalls).toHaveLength(1);
    expect(confirmCalls[0].registrationIds).toEqual(['recBjorn']);
  });

  test('avvikande status (Avbokad/Ombokad): RÅ statusen i neutral pill — aldrig falsk grön, aldrig skicka-knapp', async ({
    page,
  }) => {
    // Review-fynd F1: basens sex statusvärden får inte kollapsas till två —
    // en avbokad anmälan (nåbar via URL/+1-länkar; arbetskön filtrerar bort
    // den men detaljvyn gör det inte) ska visa sanningen, inte "Bekräftad".
    await mocka(page, {
      detaljer: [
        detalj({ status: 'Avbokad/Ombokad', bekraftelseSkickad: '2026-07-01T07:15:00.000Z' }),
      ],
    });
    await page.goto(`/event/${EVENT_ID}/anmalan/recAnna`);

    await expect(page.getByText('Anmälan #247')).toBeVisible();
    await expect(page.locator('header').getByText('Avbokad/Ombokad')).toBeVisible();
    await expect(page.getByText('Bekräftad', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Obekräftad', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Skicka bekräftelse' })).toHaveCount(0);
  });

  test('okänd anmälan → 404-formen (MessageBox, aldrig krasch)', async ({ page }) => {
    await mocka(page, { detaljer: [] });
    await page.goto(`/event/${EVENT_ID}/anmalan/recFinnsInte`);

    await expect(page.getByText('Anmälan hittades inte')).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('axe 0 violations — båda statuslägena (nya mönster: badge, mini-kort, chip, fritext, tidslinje)', async ({
    page,
  }) => {
    await mocka(page, { detaljer: [detalj(), detaljObekraftad()] });

    await page.goto(`/event/${EVENT_ID}/anmalan/recAnna`);
    await expect(page.getByText('Anmälan #247')).toBeVisible();
    const bekraftadLage = await new AxeBuilder({ page }).analyze();
    expect(bekraftadLage.violations).toEqual([]);

    await page.goto(`/event/${EVENT_ID}/anmalan/recBjorn`);
    await expect(page.getByText('Anmälan #248')).toBeVisible();
    const obekraftadLage = await new AxeBuilder({ page }).analyze();
    expect(obekraftadLage.violations).toEqual([]);
  });
});
