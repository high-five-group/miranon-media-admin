import { readFileSync } from 'node:fs';
import { expect, type Page, type Route, test } from '../support/test-bas';

/**
 * Persist-lagret (task-8.3, ADR-072): query-cachen persistas synkront till
 * localStorage så att appen öppnar med senast kända data direkt — kallstarten
 * upphör i praktiken. Sviten bevisar kortets fyra AC:n som EXTERNT beteende:
 *
 * - AC 1 varm start: tidigare besök på enheten → Hem renderar senast kända
 *   data direkt utan synligt laddläge, med nätverksnivå-bevisad TYST
 *   bakgrundshämtning (EF-svaren parkeras ofulfillade — task-4.5:s
 *   håll-bar-mock-mönster — medan innehållet redan står renderat).
 * - AC 2 utloggning: logout tömmer den persistade cachen via
 *   queryClient.clear()-mönstret (ADR-072 skyddsräcke 1) — lagringen bär
 *   ingen tidigare data in i nästa inloggning. Restore läser ENBART
 *   lagringsnyckeln, så tom nyckel ⇒ nästa login startar rent.
 * - AC 3 skyddsräcken: buster i lagringen ÄR paketmanifestets version (samma
 *   källa som versionsraden på Hem — manifest-läsningens precedent i
 *   hem-sviten); främmande buster kastas vid restore; cache äldre än maxAge
 *   (24 h) kastas vid restore; gcTime ≥ maxAge bevisas via GC-fällan
 *   (inaktivitet långt över den GAMLA gcTime:n får inte kassera lagrad cache).
 *   Poll-lagrets befintliga svit (hem.staging.test.ts) är AC 3:s andra halva
 *   — kontraktet ADR-017 orört.
 * - AC 4 offline-öppning: pwa-offline-svitens mönster (byggd preview + SW,
 *   auto-skip annars) — offline-omladdning visar restaurerad data i stället
 *   för laddläge/fel (networkMode 'online' pausar hämtning per ADR-047 B5).
 *
 * TASK-218.4 (ADR-112, kallstartsfallet): ett ytterligare, FRISTÅENDE test
 * ("Kallstart …") bevisar hela gate-RESAN som EXTERNT beteende, i stället för
 * AC 3:s undertester som bara bevisar restore-SKYDDSRÄCKENA (buster/maxAge på
 * en redan en gång varmad cache). Kallstartstestet rensar persist-nyckeln
 * FÖRE app-boot (samma `arrangeraTomCache`-idiom som
 * `tests/e2e/events-list.staging.test.ts`/`hem-laddlage.acceptance.test.ts`)
 * — det äkta "aldrig varmad än"-fallet — och kör igenom: Förberedelseskärmen
 * syns (progressbar-roll + den låsta texten) → baren fylls progressivt →
 * skärmen släpper → Hem färdigt utan synliga skeletons → ett flikbyte (Event)
 * direkt utan laddindikator (events.list redan varmad och delad till
 * dashboard-nyckeln, ADR-112 beslut 4). "Baren når EXAKT fullt" (aria-valuenow
 * === totalt) är MEDVETET INTE en assertion: sista WARMUP_ITEMS-batchen
 * (activityLog, ensam sedan BATCH_SIZE 2 på 7 datamängder) settlar och
 * `slutlöfte` löser gaten till 'redo' i SAMMA mikrotask-kedja utan
 * mellanliggande async-gap (se `src/main.tsx`s InnerApp-effekt: `slutlofte
 * .then(() => setGate({typ:'redo'}))` kör direkt efter sista `emit()`) —
 * DOM-tillståndet "N av N" hinner därför strukturellt aldrig målas och är
 * overifierbart utifrån (varken CDP-poll eller `waitForFunction(...,{polling:
 * 'raf'})` kan fånga en frame som aldrig renderas till skärmen). Testet
 * bevisar i stället det sista STABILA, garanterat observerbara steget
 * (totalt−1, där den sista ensamma batchen fortfarande pågår mot RIKTIG
 * staging) plus det rena handslaget till ett färdigt Hem.
 *
 * Körs i chromium-authenticated-projektet. Mock-tester (AC 1–3) är
 * deterministiska via page.route (hem-svitens regex-kontrakt); AC 4 kör
 * medvetet UTAN mockar — i byggd preview kontrollerar service workern sidan
 * och page.route är inte tillförlitlig genom SW-fetch, så assertionen
 * speglar renderat innehåll före/efter i stället för att styra datat.
 *
 * TASK-218.3 (ADR-112, InnerApp-gaten i src/main.tsx): buster-/maxAge-
 * undertesten i AC 3 är de COLD-vägen tar — restoren lämnar queryClienten
 * TOM, samma signal gaten läser som "kall". De två testerna är justerade
 * (Förberedelseskärmen i stället för det gamla tre-status-mönstret) som en
 * DIREKT, nödvändig konsekvens av den ändringen — INTE ny kallstarts-
 * täckning (den är TASK-218.4s scope). Återhämtnings-assertionen i BÅDA är
 * DÄRFÖR inte längre helt page.route-deterministisk: startvärmningen hämtar
 * fem ytterligare datamängder (waitlist/intresserade/maillog/segment/
 * activityLog) mot RIKTIG staging (inga mockar för dem i denna fil) innan
 * `main#main` monteras — generösa timeouts (12 s) täcker motorns hårda
 * 9 s-tak (ADR-112 beslut 3) med marginal. gcTime-undertestet är OFÖRÄNDRAT
 * (varm väg — cachen kastas aldrig i det scenariot).
 *
 * Persist-nyckeln (REACT_QUERY_OFFLINE_CACHE, bibliotekets default) läses i
 * testerna ENDAST som observationsyta — aldrig som manipulations-API för
 * tömning (manuell nyckel-radering racear mot throttle-synken ~1 s,
 * maintainer-bekräftat; ADR-072 skyddsräcke 1). Payload-PATCHNING (buster/
 * timestamp) sker däremot medvetet: det simulerar "cache skriven av annan
 * version/tid" — själva restore-kontraktet som testas.
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
    fornamn: 'Signe',
    efternamn: 'Sparad',
    email: 'signe@example.se',
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

/** Stabil grunddata med sentinel-namnet 'Signe Sparad' (dagsgamla tider —
    relativa tidsformer glider inte inom testets sekunder). Obetalda = 1. */
function grunddata() {
  return {
    registrations: [
      reg({
        id: 'recRegSigne',
        fornamn: 'Signe',
        efternamn: 'Sparad',
        eventId: 'recEvent1',
        anmalningsavgift: 'Ej mottagen',
        inskickad: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      }),
      reg({
        id: 'recRegBo',
        fornamn: 'Bo',
        efternamn: 'Bevarad',
        eventId: 'recEvent1',
        inskickad: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      }),
    ],
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
    ofulfillade — bevisat aktiv hämtning på nätverksnivå; `slappAlla` besvarar
    dem med AKTUELL `data`. */
function hallbarMock(page: Page, data: { registrations: Row[]; events: Row[] }) {
  const st = {
    data,
    hall: false,
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

/** Läser persist-payloaden rå ur sidans localStorage (observationsyta). */
function lasPersistRaw(page: Page): Promise<string | null> {
  return page.evaluate((nyckel) => localStorage.getItem(nyckel), PERSIST_KEY);
}

/** Tom cache-arrangemang (ADR-072): persist-nyckeln bort FÖRE app-boot. Samma
    idiom som `tests/e2e/events-list.staging.test.ts`/
    `tests/acceptance/hem-laddlage.acceptance.test.ts` — det äkta
    kallstartsfallet (TASK-218.4), skiljt från AC 3:s undertester nedan som
    simulerar kallhet genom att MUTERA en redan en gång varmad cache. */
function arrangeraTomCache(page: Page) {
  return page.addInitScript((nyckel) => localStorage.removeItem(nyckel), PERSIST_KEY);
}

/** Väntar ut throttle-synken (~1 s) tills lagringen bär sentinel-strängen. */
async function vantaPaPersistInnehall(page: Page, sentinel: string): Promise<void> {
  await expect
    .poll(async () => (await lasPersistRaw(page)) ?? '', { timeout: 10_000 })
    .toContain(sentinel);
}

/** Antal dehydrerade queries i lagringen (0 när nyckeln saknas/är tömd). */
async function persistQueryAntal(page: Page): Promise<number> {
  const raw = await lasPersistRaw(page);
  if (!raw) return 0;
  const payload = JSON.parse(raw) as { clientState?: { queries?: unknown[] } };
  return payload.clientState?.queries?.length ?? 0;
}

test.describe('Persist-lagret (task-8.3, ADR-072)', () => {
  test('Kallstart (TASK-218.4, ADR-112) — tom persist-cache: Förberedelseskärmen syns, baren fylls, Hem färdigt utan skeleton, flikbyte direkt', async ({
    page,
  }) => {
    // Tom/rensad persist-cache FÖRE app-boot — det ÄKTA kallstartsfallet
    // (skiljt från AC 3:s undertester nedan, som simulerar kallhet genom att
    // mutera en redan en gång varmad cache).
    await arrangeraTomCache(page);
    const mocken = await hallbarMock(page, grunddata());
    // Håller registrations+events (WARMUP_ITEMS[0..1], startvarmningen.ts)
    // tillbaka — de är FÖRST i sekvensen (BATCH_SIZE 2), så resten av
    // batcherna kan strukturellt inte starta förrän denna batch settlar
    // (korAlla()s for-loop väntar batch för batch).
    mocken.hall = true;
    await page.goto('/hem');

    // Förberedelseskärmen SYNS: progressbar-ytan (roll, ALDRIG klassnamn) +
    // den MARCUS-LÅSTA texten (Forberedelseskarm.tsx). main#main INTE
    // monterad — gaten öppnar <RouterProvider> först vid gate.typ === 'redo'.
    const progressbar = page.getByRole('progressbar');
    await expect(progressbar).toBeVisible();
    await expect(page.getByText('Förbereder ditt administrationsverktyg')).toBeVisible();
    await expect(page.locator('main#main')).toHaveCount(0);

    // Vänta ut den RIKTIGA warmup-handlens första snapshot: initialt (innan
    // warmup-effekten hunnit köra) visar gaten `FORBEREDELSESKARM_VANTAR`
    // (`src/components/AppShell`, totalt: 1, en 0-lägesplatshållare) — den
    // äkta handlens totalt (WARMUP_ITEMS.length, i dag 7) skiljer sig alltid
    // från platshållarens, så "!= '1'" är en stabil signal på att den riktiga
    // startvärmningen är aktiv (inte bara auth-resolutionens 0-läge).
    await expect
      .poll(async () => progressbar.getAttribute('aria-valuemax'), { timeout: 5_000 })
      .not.toBe('1');
    await expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    const totaltStr = await progressbar.getAttribute('aria-valuemax');
    if (!totaltStr) throw new Error('progressbar saknar aria-valuemax efter stabilisering');

    // Släpp de två hållna mockarna. Resten av batcherna (waitlist+
    // intresserade, maillog+segment, activityLog ensam i sista batchen) körs
    // sekventiellt mot RIKTIG staging — samma "5 real, 2 mockade"-konvention
    // som AC 3:s undertester (se filhuvudet).
    mocken.hall = false;
    await mocken.slappAlla();

    // Baren FYLLS progressivt: batch 2 och batch 3 landar mot riktig staging
    // med äkta nätverkspauser mellan (observerbart) upp till totalt−1 — sista
    // batchen har bara EN datamängd (activityLog) kvar, och DESS
    // klar-tillstånd (totalt/totalt) hinner strukturellt aldrig målas innan
    // gaten släpper (se filhuvudets TASK-218.4-stycke för hela
    // mikrotask-resonemanget) — totalt−1 är alltså det sista STABILA,
    // garanterat observerbara steget.
    const sistaStabila = String(Number(totaltStr) - 1);
    await expect
      .poll(async () => progressbar.getAttribute('aria-valuenow'), { timeout: 12_000 })
      .toBe(sistaStabila);

    // Skärmen släpper: main monteras, Hem färdigt UTAN synliga skeletons.
    const main = page.locator('main#main');
    await expect(main.getByRole('link', { name: /Signe Sparad/ })).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(main.getByRole('status')).toHaveCount(0);

    // Minst ett flikbyte (Event) OMEDELBART utan laddindikator: events.list
    // redan varmad av startvärmningen och delad till dashboard-nyckeln
    // (ADR-112 beslut 4) — EventsList.tsx anropar samma nyckelfamilj, ingen
    // ny hämtning krävs.
    await page
      .getByRole('navigation', { name: 'Huvudnavigation' })
      .getByRole('link', { name: 'Event' })
      .click();
    await page.waitForURL('**/event');
    await expect(page.getByText('Fjärrskådning')).toBeVisible();
    await expect(main.getByRole('status')).toHaveCount(0);
  });

  test('AC 1 — varm start: senast kända data direkt utan synligt laddläge; tyst bakgrundshämtning nätverksnivå-bevisad', async ({
    page,
  }) => {
    // Första besöket: rendera + låt throttle-synken (~1 s, riktig klocka)
    // skriva cachen till lagringen.
    const mocken = await hallbarMock(page, grunddata());
    await page.goto('/hem');
    await expect(page.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
    await vantaPaPersistInnehall(page, 'Signe');

    // Varm start: flytta sidans klocka +6 min (över dashboard-staleTime 30 s
    // OCH globala 5 min) så restaurerad data är stale per gällande staleTime
    // → omedelbar tyst bakgrundshämtning (ADR-072 beslut 5). Klockan
    // installeras FÖRE omladdningen och överlever navigationen.
    await page.clock.install({ time: Date.now() + 6 * 60_000 });
    mocken.hall = true;
    await page.reload();

    // Senast kända data DIREKT — medan EF-svaren fortfarande är parkerade
    // (ingen mock har besvarats): innehållet kan bara komma ur lagringen.
    const main = page.locator('main#main');
    await expect(main.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
    await expect(page.getByText('5 av 20 platser reserverade')).toBeVisible();

    // Nätverksnivå-beviset: bakgrundshämtningen är AKTIV (två mottagna,
    // obesvarade anrop — get-registrations + get-events; registrations-queryn
    // dedupas över sina två kort) medan innehållet redan står renderat …
    await expect.poll(() => mocken.parkerade.length).toBe(2);
    // … och TYST: inget laddläge någonstans under aktiv hämtning.
    await expect(main.getByRole('status')).toHaveCount(0);
    await expect(main.getByText(/^Laddar/)).toHaveCount(0);

    // Släpp svaren med ÄNDRAT data (Bos avgift flippar → Obetalda 1 → 2):
    // den tysta hämtningen landar och uppdaterar per osynlighets-mekaniken.
    const nytt = grunddata();
    const bo = nytt.registrations[1];
    if (!bo) throw new Error('grunddatan saknar Bo-raden');
    bo.anmalningsavgift = 'Ej mottagen';
    mocken.data = nytt;
    mocken.hall = false;
    await mocken.slappAlla();
    const obetalda = page.getByRole('region', { name: 'Obetalda anmälningsavgifter' });
    await expect(obetalda.getByText('2', { exact: true })).toBeVisible();
  });

  test('AC 2 — utloggning tömmer persistad cache: ingen tidigare data i lagringen efter logout', async ({
    page,
  }) => {
    await hallbarMock(page, grunddata());
    await page.goto('/hem');
    await expect(page.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
    await vantaPaPersistInnehall(page, 'Signe');

    // Logga ut via auth-flödes-ytan (Mer-vyns riktiga logout-knapp — samma
    // väg som Lotta tar). Redirecten bärs av ADR-037-kedjan.
    await page.goto('/mer');
    await page.getByRole('button', { name: 'Logga ut' }).click();
    await expect(page).toHaveURL(/\/login/);

    // queryClient.clear()-mönstret (ADR-072 skyddsräcke 1): minnescachen
    // synkas TOM till lagringen av throttle-synken (~1 s) — poll:a tills
    // noll dehydrerade queries. Manuell nyckel-radering används ALDRIG.
    await expect.poll(() => persistQueryAntal(page), { timeout: 10_000 }).toBe(0);

    // Ingen tidigare data bärs in i nästa inloggning: restore läser enbart
    // denna nyckel, och den bär inte sentinel-datat längre.
    const raw = await lasPersistRaw(page);
    expect(raw ?? '').not.toContain('Signe');
  });

  test('AC 3 — buster är den build-injicerade app-versionen; cache från annan version kastas vid restore', async ({
    page,
  }) => {
    // Samma manifest-källa som versionsraden på Hem (task-4.2 B-NYTT2):
    // versionen läses ur package.json, aldrig hårdkodad i assertionen.
    const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    const mocken = await hallbarMock(page, grunddata());
    await page.goto('/hem');
    await expect(page.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
    await vantaPaPersistInnehall(page, 'Signe');

    // Skyddsräcke 3 (ADR-072 beslut 4): lagringens buster ÄR app-versionen.
    const raw = await lasPersistRaw(page);
    if (!raw) throw new Error('persist-nyckeln saknas efter flush');
    const payload = JSON.parse(raw) as { buster?: string };
    expect(payload.buster).toBe(version);

    // Cache skriven av ANNAN app-version: patcha buster-fältet (simulerar
    // lagring från föregående version) → restore ska KASTA cachen och visa
    // det ärliga kalla laddläget i stället för gammalt data.
    await page.evaluate(
      ([nyckel, frammande]) => {
        const lagrat = localStorage.getItem(nyckel as string);
        if (!lagrat) throw new Error('persist-nyckeln saknas');
        const p = JSON.parse(lagrat) as { buster?: string };
        p.buster = frammande as string;
        localStorage.setItem(nyckel as string, JSON.stringify(p));
      },
      [PERSIST_KEY, 'utgangen-app-version'],
    );
    mocken.hall = true;
    await page.reload();

    // Kastad cache ⇒ COLD-vägen (ADR-112/TASK-218.3, InnerApp-gaten i
    // src/main.tsx): restore lämnar queryClienten TOM (buster-mismatchen
    // gör att biblioteket aldrig hydrerar) — samma tomma-cache-signal gaten
    // läser för "kall". Förberedelseskärmen ersätter det GAMLA tre-status-
    // mönstret; main#main monteras inte förrän startvärmningen släpper.
    const main = page.locator('main#main');
    await expect(page.getByText('Förbereder ditt administrationsverktyg')).toBeVisible();
    await expect(main).toHaveCount(0);
    await expect(page.getByText('Signe Sparad')).toHaveCount(0);

    // Återhämtning: färsk hämtning ersätter laddläget (rent efter versionsbyte).
    // Startvärmningen kör sekventiella batcher (BATCH_SIZE 2, startvarmningen.ts)
    // mot RIKTIG staging för de fem här omockade datamängderna — generös
    // timeout täcker motorns hårda 9 s-tak (ADR-112 beslut 3) med marginal.
    mocken.hall = false;
    await mocken.slappAlla();
    await expect(main.getByRole('link', { name: /Signe Sparad/ })).toBeVisible({ timeout: 12_000 });
  });

  test('AC 3 — gcTime ≥ maxAge: inaktivitet långt över gamla gcTime:n kasserar inte lagrad cache (GC-fällan)', async ({
    page,
  }) => {
    // Falsk klocka FRÅN START: styr deterministiskt BÅDE ev. GC-timers och
    // persist-throttlen (setTimeout-drivna) — inga riktiga väntetider.
    await page.clock.install();
    const mocken = await hallbarMock(page, grunddata());
    await page.goto('/hem');
    await expect(page.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
    await page.clock.fastForward(1_500); // throttle-synken (~1 s) fyrar
    await vantaPaPersistInnehall(page, 'Signe');

    // Lämna Hem KLIENT-SIDE (tabbarens Mer-länk — ingen omladdning!) så att
    // dashboard-queries blir inaktiva med sina OBSERVER-satta gcTime-värden,
    // och passera 6 minuter — långt över poll-lagrets GAMLA gcTime (5 min,
    // ADR-017-erratum §4). Med gcTime < maxAge kasserar GC:n queryn här och
    // nästa throttle-synk skriver bort den ur lagringen (dokumenterade
    // GC-fällan, ADR-072 skyddsräcke 2) — varm start hade blivit kall igen.
    // (En page.goto hade i stället HYDRERAT om cachen med default-gcTime och
    // aldrig prövat poll-lagrets override — falsifierings-fyndet i bygget.)
    await page
      .getByRole('navigation', { name: 'Huvudnavigation' })
      .getByRole('link', { name: 'Mer' })
      .click();
    await expect(page.getByRole('heading', { name: 'Mer' })).toBeVisible();
    // Två klocksteg: fastForward fyrar bara timers som redan är schemalagda
    // vid anropet — steg 1 låter en ev. GC fyra (den är schemalagd sedan
    // avmonteringen), steg 2 låter throttle-synken (schemalagd av GC-eventet
    // UNDER steg 1) skriva lagringen. Utan steg 2 kan lagringen stå kvar
    // stale och maskera en GC (falsifierings-fynd 2 i bygget).
    await page.clock.fastForward(6 * 60_000);
    await page.clock.fastForward(2_000);

    // Lagringen bär KVAR dashboard-datat …
    expect((await lasPersistRaw(page)) ?? '').toContain('Signe');

    // … och återbesöket på Hem visar senast kända data direkt, utan laddläge,
    // med EF-svaren parkerade (samma varma beteende som AC 1).
    mocken.hall = true;
    await page.goto('/hem');
    const main = page.locator('main#main');
    await expect(main.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
    await expect(main.getByRole('status')).toHaveCount(0);
    mocken.hall = false;
    await mocken.slappAlla();
  });

  test('AC 3 — maxAge 24 h: cache äldre än 24 h kastas vid restore', async ({ page }) => {
    const mocken = await hallbarMock(page, grunddata());
    await page.goto('/hem');
    await expect(page.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
    await vantaPaPersistInnehall(page, 'Signe');

    // Åldra payloaden 25 h (simulerar lagring skriven i går) → utanför
    // maxAge-fönstret ⇒ restore kastar och det kalla laddläget visas.
    await page.evaluate((nyckel) => {
      const lagrat = localStorage.getItem(nyckel);
      if (!lagrat) throw new Error('persist-nyckeln saknas');
      const p = JSON.parse(lagrat) as { timestamp: number };
      p.timestamp -= 25 * 60 * 60 * 1000;
      localStorage.setItem(nyckel, JSON.stringify(p));
    }, PERSIST_KEY);
    mocken.hall = true;
    await page.reload();

    // Kastad cache ⇒ COLD-vägen (ADR-112/TASK-218.3) — se buster-testets
    // kommentar ovan för det fullständiga resonemanget (samma mekanism,
    // maxAge i stället för buster fäller restore).
    const main = page.locator('main#main');
    await expect(page.getByText('Förbereder ditt administrationsverktyg')).toBeVisible();
    await expect(main).toHaveCount(0);
    await expect(page.getByText('Signe Sparad')).toHaveCount(0);

    mocken.hall = false;
    await mocken.slappAlla();
    await expect(main.getByRole('link', { name: /Signe Sparad/ })).toBeVisible({ timeout: 12_000 });
  });
});

test.describe('AC 4 — offline-öppning visar restaurerad data (pwa-offline-mönstret)', () => {
  test('offline-omladdning renderar senast kända data — inget laddläge, inget felläge', async ({
    page,
    context,
  }) => {
    // MEDVETET utan page.route-mockar: i byggd preview kontrollerar service
    // workern sidan och route-mockning genom SW-fetch är inte tillförlitlig.
    // Assertionen speglar därför RENDERAT innehåll före/efter omladdningen
    // (datavärdes-fri) — riktiga läs-EF:er mot staging via semaforen.
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

    // SW-guarden (pwa-offline-svitens mönster): kräver byggd preview —
    // auto-skip i dev/CI där SW:n inte existerar (devOptions.enabled false).
    // Härdad mot dev-lanen: getRegistration() avgör DIREKT (registerSW är
    // no-op i dev ⇒ ingen registrering ⇒ instant skip — inget 15 s-fönster
    // där en dev-server-omladdning kan förstöra evaluate-kontexten), och en
    // ändå förstörd kontext klassas som skip, inte fel (preview-lanen har
    // ingen vite-klient som omladdar).
    const swState = await page
      .evaluate(async () => {
        if (!('serviceWorker' in navigator)) return 'stöds-ej';
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return 'ingen-registrering';
        const ready = await Promise.race([
          navigator.serviceWorker.ready.then(() => 'aktiverad'),
          new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), 15_000)),
        ]);
        return ready;
      })
      .catch(() => 'evaluate-avbruten');
    test.skip(swState !== 'aktiverad', `SW ej aktiverad (${swState}) — kräver byggd preview`);

    // Vänta ut datat (kalla EF-fönstret kan vara ~8 s, task-8.1-mätningen)
    // och persist-flushen (≥ 2 dehydrerade queries i lagringen).
    const main = page.locator('main#main');
    await expect(main.getByRole('status')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect.poll(() => persistQueryAntal(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

    // Spegla renderat innehåll (Obetalda-kortet: rubrik + antal — stabil yta).
    const obetalda = page.getByRole('region', { name: 'Obetalda anmälningsavgifter' });
    const obetaldaFore = await obetalda.textContent();

    // Offline-öppning: nätet av → omladdning → SW serverar skalet, persist
    // restaurerar datat, networkMode 'online' pausar hämtningsförsök
    // (ADR-047 B5 — offline visar cachad data utan hämtningsförsök).
    await context.setOffline(true);
    await page.reload();

    // h1 är besöks-form-beroende (B2, task-4.2: återbesök i sessionen visar
    // bara namnet — sessionStorage överlever reload) → assertera synlig h1,
    // inte Hej-formen.
    await expect(page.locator('h1')).toBeVisible();
    await expect(main.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    const obetaldaEfter = await obetalda.textContent();
    expect(obetaldaEfter).toBe(obetaldaFore);

    await context.setOffline(false);
  });
});
