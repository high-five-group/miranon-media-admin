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
 * Körs i chromium-authenticated-projektet. Mock-tester (AC 1–3) är
 * deterministiska via page.route (hem-svitens regex-kontrakt); AC 4 kör
 * medvetet UTAN mockar — i byggd preview kontrollerar service workern sidan
 * och page.route är inte tillförlitlig genom SW-fetch, så assertionen
 * speglar renderat innehåll före/efter i stället för att styra datat.
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

    // Kastad cache ⇒ kalla laddlägets tre status-ytor, inget sentinel-data.
    const main = page.locator('main#main');
    await expect(main.getByRole('status')).toHaveCount(3);
    await expect(main.getByText('Signe Sparad')).toHaveCount(0);

    // Återhämtning: färsk hämtning ersätter laddläget (rent efter versionsbyte).
    mocken.hall = false;
    await mocken.slappAlla();
    await expect(main.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
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

    const main = page.locator('main#main');
    await expect(main.getByRole('status')).toHaveCount(3);
    await expect(main.getByText('Signe Sparad')).toHaveCount(0);

    mocken.hall = false;
    await mocken.slappAlla();
    await expect(main.getByRole('link', { name: /Signe Sparad/ })).toBeVisible();
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
