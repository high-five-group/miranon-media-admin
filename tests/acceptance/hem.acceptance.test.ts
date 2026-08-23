import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { FIXTUR_EPOST } from '../support/fixturvarld/hermetic';
import { expect, type Page, test } from './support/acceptance-bas';

/**
 * Hem-vyn — Morgonkollen, V1 "Lugna morgonen" (TASK-243.3, full omskrivning
 * mot den promoverade formen ur TASK-243.1/`src/components/hem/Hem.tsx`;
 * ersätter K10-formens skrivning som revs i `27288c3e`). Facit:
 * `tasks/sessions/bilagor/s102-hem-konvergens/facit.json`; `Hem.tsx` bär
 * facit-formens exakta blockordning i sin egen docblock — den upprepas inte
 * här. Blockordningen (Marcus-låst, S102 Del 8 + Del 10): fri hälsning utan
 * platta → Nästa event (fullbredd, primär-tint) → Bevakningsrad (helt
 * osynlig vid noll träffar) → Nya anmälningar (räknar-rubrik +
 * bekräftelsesvep) → Förfallna betalningar (tre tillståndsgrupper) →
 * Genvägar → Senaste aktivitet (kompakt, alla bredder). INGEN separat
 * "Hem"-rubrik: hälsningen ÄR sidans h1 → h1-assertions matchar /^Hej/
 * (miljö-neutralt: namn-delen styrs av sessionens display-namn, task-1.1).
 *
 * ACCEPTANCE-KLASSEN (task-59.3, ADR-080): filen flyttades ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 *
 * **Deterministisk via `network.use()`** — överskuggningar på fixturvärldens
 * delade normalläge, inte `page.route`. Skälet är inte smak: page-routes prövas
 * FÖRE MSW:s context-routes, så en page-route-mock hade lagt en andra
 * avlyssningsmekanism ovanpå den fixturvärlden bär och gett EF-lagret en annan
 * stränghet än allt annat nätverk — precis den tudelning task-54.2 tog bort.
 * Mönstren byggs med `EF(namn)` ur handlers-modulen: en egenskriven sträng som
 * inte matchar faller igenom till normalläget UTAN att något fälls, och testet
 * ser då normalläget i stället för sitt eget fall (den tysta fällan,
 * `hermetic.ts` § Överskugga en delad handler).
 *
 * Mockarna speglar EF-svaren `{ registrations: [...] }` / `{ events: [...] }`
 * (Registration.schema / Event.schema-rader → adapterns `.parse()` passerar).
 *
 * Täckning (TASK-243.3 AC #1 + PRD task-243 användarberättelser 1–9;
 * berättelse 10, Senaste aktivitet, har egen svit — `hem-senaste-
 * aktivitet.acceptance.test.ts`): blockordningen inkl. Bevakningsradens
 * villkorade plats, tomma läget per block, statusfiltret bakom "Nya
 * anmälningar", förfallna-definitionen + en-påminnelse-modellens tre
 * grupper, Bevakningsradens trigger + osynlighet, Genvägarna, hälsnings-h1,
 * axe 0 (sparsam OCH kitchen-sink), fel (4xx role=alert, no-retry). INGEN
 * h1-auto-fokus-assertion: /hem är default-landningsytan → containern flyttar
 * INTE fokus (skip-link-först-tab-ordning, speglar EventsList; se Hem.tsx +
 * shell DoD 2).
 *
 * FACIT-GRANSKNING (DoD #5): `Hem.tsx`/`Bevakningsrad.tsx`/
 * `BulkAtgardsknapp.tsx` m.fl. bär i sina egna docblocks den fullständiga
 * proveniensen mot facit (inkl. de öppet bokförda avvikelserna — B2-
 * återbesöksformen ej promoverad, versionsraden ej promoverad, helkorts-
 * klicket ej promoverat, dagar-kvar-pillen ej promoverad). Testerna nedan
 * asserterar mot KODENS faktiska, redan facit-korslästa beteende — de kräver
 * ingenting facit motsäger, och uppfinner ingen egen tolkning av bilderna.
 */

/** Sidrubriken = hälsningen (AC #6) — namn-delen är miljöberoende → prefix-match. */
const H1_HALSNING = /^Hej/;

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

/**
 * Överskuggar Hem-vyns två EF-svar för ETT test. Isoleringen är strukturell —
 * `network` byggs om per test, så nästa test ser aldrig dessa handlers.
 *
 * Anropas den flera gånger i samma test vinner det SENASTE anropet: MSW lägger
 * `use()`-handlers först (`handlers-controller.js` rad 82) och första träffen
 * vinner. Samma företräde som den tidigare page.route-formen hade.
 */
function mock(
  network: NetworkFixture,
  {
    registrations = [],
    events = [],
    regStatus = 200,
    eventStatus = 200,
  }: {
    registrations?: RegRow[];
    events?: EventRow[];
    regStatus?: number;
    eventStatus?: number;
  } = {},
) {
  network.use(
    http.get(EF('get-registrations'), () =>
      regStatus === 200 ? json({ registrations }) : json({ error: 'x' }, regStatus),
    ),
    http.get(EF('get-events'), () =>
      eventStatus === 200 ? json({ events }) : json({ error: 'x' }, eventStatus),
    ),
  );
}

test.describe('Hem — A-skelettet (task-1.3)', () => {
  test('get-registrations 4xx → fel-UI (role=alert) i BÅDA anmälnings-blocken, eventblocket opåverkat', async ({
    page,
    network,
  }) => {
    // 4xx = klient-fel → no-retry-grenen (speglar 6c). `regsError` delas av
    // Nya anmälningar OCH Förfallna betalningar (samma query, hem-derivations
    // AC #3) — båda visar VARSIN alert med sin egen title; Nästa event
    // (separat query, 200) renderar fint.
    mock(network, { regStatus: 404, events: [ev({ eventNamn: 'Resor i medvetandet 1' })] });
    await page.goto('/hem');

    await expect(page.getByRole('alert')).toHaveCount(2);
    await expect(
      page.getByRole('alert').filter({ hasText: 'Kunde inte hämta anmälningar' }),
    ).toBeVisible();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Kunde inte hämta betalningar' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Nästa event' }).getByRole('link', {
        name: 'Resor i medvetandet 1',
      }),
    ).toBeVisible();
  });

  test('axe 0 violations på den renderade Hem-vyn', async ({ page, network }) => {
    mock(network, {
      registrations: [reg({ anmalningsavgift: 'Ej mottagen' }), reg()],
      events: [ev()],
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

/**
 * Hälsningen (task-1.1 — namnkällan): display-namnet läses ur inloggnings-
 * kontots user_metadata (Supabase-sessionen i localStorage, seedad av
 * auth.setup via storageState). Hermetiskt via addInitScript-patch av den
 * lagrade sessionen — assertionerna är oberoende av staging-kontots faktiska
 * metadata (T26-klassen: miljö-beroende assertions är sköra). Patchen körs
 * FÖRE app-boot, så getSession() läser det patchade värdet.
 */
function patchStoredDisplayName(page: Page, displayName: string | null) {
  return page.addInitScript((name) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (!session?.user) continue;
      session.user.user_metadata = { ...session.user.user_metadata };
      if (name === null) delete session.user.user_metadata.display_name;
      else session.user.user_metadata.display_name = name;
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, displayName);
}

test.describe('Hälsningen (task-1.1 — namnkällan ur kontots metadata)', () => {
  test('display-namn i sessionen → h1 "Hej {namn}"', async ({ page, network }) => {
    // 'Lotta' speglar staging-kontots faktiska display-namn — en (osannolik)
    // mitt-i-testet token-refresh, där server-sanningen ersätter patchen, kan
    // då inte flippa texten. Hälsningen är sidans h1 (task-1.3 AC #6);
    // UTAN utropstecken sedan K10-facitet (task-4.2).
    await patchStoredDisplayName(page, 'Lotta');
    mock(network);
    await page.goto('/hem');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hej Lotta', exact: true }),
    ).toBeVisible();
  });

  test('utan display-namn → neutral hälsning, aldrig e-postadressen', async ({ page, network }) => {
    await patchStoredDisplayName(page, null);
    mock(network);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: 'Hej', exact: true })).toBeVisible();
    // E-posten är ALDRIG fallback (AC 2, Gunilla-principen). Adressen läses ur
    // fixturvärldens session (task-59.3) i stället för ur en staging-credential
    // i process.env — samma bevis, men utan miljöberoende. Riggkontrollen står
    // kvar: en tom sträng hade gjort assertionen meningslös.
    expect(FIXTUR_EPOST).not.toBe('');
    await expect(page.getByText(FIXTUR_EPOST)).toHaveCount(0);
  });

  /**
   * TASK-220 kantfall — AuthProviderns `sessionToUser` trimmar bara det
   * OMGIVANDE whitespace:t (`rawName.trim()`); inre extra mellanslag når
   * hälsningens `fornamn()` orörda. Beviset står här, inte i AuthProvider —
   * extraktionen (och därmed robustheten) bor i hälsningens visningslogik.
   */
  test('TASK-220 kantfall — omgivande/inre whitespace i display-namnet trimmas robust', async ({
    page,
    network,
  }) => {
    await patchStoredDisplayName(page, '  Marcus   Johansson  ');
    mock(network);
    await page.goto('/hem');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hej Marcus', exact: true }),
    ).toBeVisible();
  });
});

test.describe('Hem polling (Fas 6d L2 — ADR-017 + erratum)', () => {
  // RefreshButton-invalidate-testet borttaget med kontrollen (B5, task-4.2):
  // manuella uppdatera-vägen finns inte längre — poll-lagret (testet nedan)
  // är färskhetens enda bärare (ADR-017 Updates-noten).

  test('refetchInterval (60s) triggar polling-refetch — falsk klocka', async ({
    page,
    network,
  }) => {
    // page.clock fakar timers → vi kan avancera förbi 60s-intervallet deterministiskt
    // utan att vänta i realtid. refetchIntervalInBackground:false pausar bara när
    // fliken är dold; i testet är document synligt → intervallet är aktivt.
    await page.clock.install();
    // Räknaren mäter APPENS beteende (att intervallet fyrar en ny hämtning),
    // inte att en handler anropades — klassen testar aldrig fixturen. Utan
    // räknaren finns ingen observerbar skillnad mellan "pollade" och "pollade
    // inte", eftersom svaret är identiskt.
    let evCalls = 0;
    network.use(
      http.get(EF('get-registrations'), () => json({ registrations: [reg()] })),
      http.get(EF('get-events'), () => {
        evCalls += 1;
        return json({ events: [ev()] });
      }),
    );
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect.poll(() => evCalls).toBe(1); // initial hämtning

    // Avancera förbi 60s → refetchInterval fyrar en polling-refetch.
    await page.clock.fastForward(61_000);
    await expect.poll(() => evCalls).toBeGreaterThan(1);
  });
});

/**
 * Nästa event — Morgonkollens hero-block (PRD task-243 användarberättelse 2;
 * `NastaEvent.tsx`, promoverad ur `dev/hem-prototyp/VariantRo.tsx`). Renderad
 * verifiering per L246 för beläggningsstapeln (boxmätning, aldrig enbart
 * klass-närvaro). Dagar-kvar-formen är EN RAD under eventnamnet (INTE en
 * positionerad pill — den formen hörde K10-facitet till och är INTE
 * promoverad, öppet bokfört i `NastaEvent.tsx`s docblock).
 */
test.describe('Nästa event till facit (PRD task-243 berättelse 2)', () => {
  test('dagar-kvar-formens tre exakta texter: "Idag" / "1 dag kvar" / "N dagar kvar"', async ({
    page,
    network,
  }) => {
    // FROZEN_NOW = 2026-09-15T10:00+02:00 (fixture-data.ts) → Stockholm-
    // midnatt "idag" = 2026-09-15T00:00+02:00. Ett datumlöst (endast
    // ÅÅÅÅ-MM-DD) startdatum parsar som UTC-midnatt; `dagarKvarText` rundar
    // (start−idagStart)/dygn — för varje kalenderdag D dagar efter idag ger
    // det EXAKT D (den 2-timmars UTC-offseten rundar alltid ned), räknat och
    // verifierat separat innan värdena skrevs in (samma disciplin som
    // `relativTid`-testernas tidsstränglitteraler — tautologi-fällan).
    const fall = [
      { startdatum: '2026-09-15', text: 'Idag' },
      { startdatum: '2026-09-16', text: '1 dag kvar' },
      { startdatum: '2026-09-25', text: '10 dagar kvar' },
    ] as const;

    for (const { startdatum, text } of fall) {
      mock(network, {
        registrations: [],
        events: [ev({ eventNamn: 'Fjärrskådning', startdatum })],
      });
      await page.goto('/hem');
      const kort = page.getByRole('region', { name: 'Nästa event' });
      await expect(kort.getByText(text, { exact: true })).toBeVisible();
    }
  });

  test('AC 4 — "X av Y platser reserverade" + beläggningsstapelns fyllnadsandel matchar X/Y (renderad mätning)', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [],
      events: [
        ev({
          eventNamn: 'Fjärrskådning',
          startdatum: '2099-09-15',
          antalAnmalda: 5,
          maxPlatser: 20,
        }),
      ],
    });
    await page.goto('/hem');
    const kort = page.getByRole('region', { name: 'Nästa event' });

    // Caption-texten är informationsbäraren (stapeln aldrig ensam): 12px
    // (text-caption) i secondary (--mm-text-secondary #525151).
    const caption = kort.getByText('5 av 20 platser reserverade', { exact: true });
    await expect(caption).toBeVisible();
    const captionStil = await caption.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, farg: s.color };
    });
    expect(captionStil).toEqual({ storlek: '12px', farg: 'rgb(82, 81, 81)' });

    // Stapeln RENDERAD (L246-boxmätning): fyllnadsbredd / trackbredd == 5/20.
    // Track = kortets enda aria-dolda div (ikonerna är svg, pillen span).
    const track = kort.locator('div[aria-hidden="true"]');
    await expect(track).toHaveCount(1);
    const fyllnad = track.locator('div');
    const trackBox = await track.boundingBox();
    const fyllnadBox = await fyllnad.boundingBox();
    if (!trackBox || !fyllnadBox) throw new Error('boundingBox saknas för stapel-mätningen');
    expect(fyllnadBox.width / trackBox.width).toBeGreaterThan(0.23);
    expect(fyllnadBox.width / trackBox.width).toBeLessThan(0.27);

    // Färgerna renderade: vit track (--mm-surface), primär-dämpad fyllnad
    // (--mm-primary-muted #c4a840) — tokensystemet, inga hårdkodade färger.
    const farger = await track.evaluate((el) => {
      const fill = el.firstElementChild;
      if (!fill) throw new Error('fyllnadselementet saknas');
      return {
        track: getComputedStyle(el).backgroundColor,
        fyllnad: getComputedStyle(fill).backgroundColor,
      };
    });
    expect(farger).toEqual({ track: 'rgb(255, 255, 255)', fyllnad: 'rgb(196, 168, 64)' });
  });
});

test.describe('AppShell-kontraktet — hem ärver skalets kolumnbredd (TASK-247)', () => {
  test('kolumnen 600 px skärm-centrerad på desktop; headern borta (AC 1–2)', async ({
    page,
    network,
  }) => {
    mock(network);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('header')).toHaveCount(0);
    const box = await page.locator('main#main').boundingBox();
    if (!box) throw new Error('main saknar boundingBox');
    // Renderad mätning (L246): 600-boxen + skärm-centrering (viewport 1280).
    expect(box.width).toBe(600);
    expect(Math.abs(box.x - (1280 - 600) / 2)).toBeLessThanOrEqual(1);
  });
});

/**
 * Chunk-bannern — PLACERINGEN i skalet (TASK-285.5 AC #1 + #5, ADR-121
 * beslut 3). Komponentens BETEENDE (ersätter/staplas inte, ingen tom
 * alert-region, eventet sväljs inte) hör till `webblasarbeteende`-klassen
 * (`tests/webblasarbeteende/app-chunk-laddningsfel.test.ts`, oförändrad
 * täckning) — DENNA describe bevisar bara den nya egenskapen kortet kräver:
 * att bannern renderas som FÖRSTA barn i `main#main`, före sidans `h1`, i
 * skalets innehållsbredd. `/hem` valdes som fixtur-vy: den delar samma
 * `mock()`-hjälpare och `H1_HALSNING`-konstant som "AppShell-kontraktet"
 * ovan, så testet hänger på EXAKT samma EF-mockning (hermetik-självtestets
 * krav, ADR-080 beslut 3) — utan riktiga anmälningar/event att rendera
 * fanns ingen `h1` att jämföra bannerns placering mot.
 */
test.describe('Chunk-bannern — placering i skalet (TASK-285.5, ADR-121 beslut 3)', () => {
  test('renderas som FÖRSTA barn i main#main, före h1, i skalets innehållsbredd (AC #1)', async ({
    page,
    network,
  }) => {
    mock(network);
    await page.goto('/hem');
    const h1 = page.getByRole('heading', { level: 1, name: H1_HALSNING });
    await expect(h1).toBeVisible();

    // Samma syntetiska dispatch som webblasarbeteende-sviten
    // (`app-chunk-laddningsfel.test.ts`s `skjutPreloadError`) — Vites
    // `vite:preloadError`, samma konstruktor/namn/`cancelable`-flagga som
    // Vites egen preload-helper använder (se den filens filhuvud för hela
    // resonemanget kring varför en syntetisk dispatch och inte en riktigt
    // blockerad chunk).
    await page.waitForFunction(
      () => {
        if (document.querySelector('[data-testid="app-reload-required-banner"]')) return true;
        window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
        return false;
      },
      undefined,
      { timeout: 15_000, polling: 50 },
    );

    const main = page.locator('main#main');
    const banner = page.locator('[data-testid="app-reload-required-banner"]');
    await expect(banner).toHaveAttribute('role', 'alert');

    // FÖRSTA BARNET i innehållsytan — ett DIREKT barn av main#main, inte
    // bara "finns någonstans inuti" (AC #1: "första barn i innehållsytan").
    const forstaBarnetsTestId = await main
      .locator(':scope > *')
      .first()
      .getAttribute('data-testid');
    expect(forstaBarnetsTestId).toBe('app-reload-required-banner');

    // Ordning + bredd (renderad mätning, L246): bannern ligger OVANFÖR h1
    // (omedelbart före, per AC #1) och delar h1s content-bredd — den ärver
    // skalets innehållskolumn i stället för att spänna hela vyporten.
    const [bannerBox, h1Box] = await Promise.all([banner.boundingBox(), h1.boundingBox()]);
    if (!bannerBox || !h1Box) {
      throw new Error('boundingBox saknas i chunk-bannerns placeringsmätning');
    }
    expect(bannerBox.y).toBeLessThan(h1Box.y);
    expect(Math.abs(bannerBox.width - h1Box.width)).toBeLessThanOrEqual(1);
  });
});

/**
 * Notisfamiljens tangentbordsnavigering på en RIKTIG, autentiserad sida
 * (TASK-285.9, AC #4): "Notisens knappar nås via tangentbord inom högst
 * fem tabbsteg från dokumentets början på /hem; fokusringen syns."
 *
 * VARFÖR HÄR OCH INTE I `webblasarbeteende`: den klassen bevisar
 * KOMPONENT-beteende isolerat (`/dev/primitives`, ingen autentiserad
 * session) — den här ACen bevisar en INTEGRATIONS-egenskap: var i den
 * RIKTIGA sidans faktiska DOM-ordning (SkipLink, AppShell, TabBar,
 * sidans eget innehåll) Uppdateringsnotisens knappar hamnar i tabbflödet.
 * `/hem` kräver en autentiserad, fixturvärlds-backad session — exakt vad
 * `acceptance`-klassen ger (samma `mock()`-hjälpare som `Chunk-bannern —
 * placering i skalet` ovan).
 *
 * VARFÖR SIFFRAN BLIR SÅ LÅG (strukturellt, inte en tillfällighet):
 * `AppUpdateBanner` monteras i `__root.tsx` FÖRE `<Outlet />` (all inloggad
 * OCH utloggad yta) — DOM-ordning avgör tabbordning när inget explicit
 * `tabindex` satts, så notisens knappar hamnar TIDIGARE i dokumentet än
 * `AppShell`s `SkipLink` (som i sin tur kommer FÖRE huvudinnehållet och
 * TabBar). Se `AppUpdateBanner.tsx`/`__root.tsx`/`AppShell.tsx` för
 * monteringsordningen — denna test bevisar den FAKTISKA konsekvensen,
 * bygger inte på den i förväg.
 */
test.describe('Notisfamiljens tangentbordsnavigering på /hem (TASK-285.9, AC #4)', () => {
  test('Uppdateringsnotisens knappar nås inom fem tabbsteg; fokusringen syns', async ({
    page,
    network,
  }) => {
    mock(network);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

    // Samma syntetiska dispatch som webblasarbeteende-sviten
    // (`app-update-banner.test.ts`s `skjutAppUppdatering`).
    await page.waitForFunction(
      () => {
        if (document.querySelector('[data-testid="app-update-reload"]')) return true;
        window.dispatchEvent(new CustomEvent('mm:app-uppdatering-tillganglig'));
        return false;
      },
      undefined,
      { timeout: 15_000, polling: 50 },
    );
    const laddaOm = page.locator('[data-testid="app-update-reload"]');
    await expect(laddaOm).toBeVisible();

    // Tabbar från DOKUMENTETS BÖRJAN (`document.body`, inget element
    // fokuserat), precis som en riktig tangentbordsanvändare som just
    // laddat sidan. Räknar STEG (Tab-tryck), inte "index i en lista av
    // fokuserbara element" — samma sak Lotta faktiskt upplever.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const MAX_STEG = 5;
    let steg = 0;
    let hittadTestid: string | null = null;
    while (steg < MAX_STEG) {
      await page.keyboard.press('Tab');
      steg += 1;
      hittadTestid = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      if (hittadTestid === 'app-update-reload' || hittadTestid === 'app-update-inte-nu') {
        break;
      }
    }

    expect(steg).toBeLessThanOrEqual(MAX_STEG);
    expect(['app-update-reload', 'app-update-inte-nu']).toContain(hittadTestid);

    // Fokusringen (AC #4): den globala `*:focus-visible`-regeln
    // (`base.css`) — outline i `--mm-focus-ring`-tokenfärgen, inte `none`.
    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth };
    });
    expect(ring.outlineStyle).toBe('solid');
    expect(Number.parseFloat(ring.outlineWidth)).toBeGreaterThan(0);
  });
});

/**
 * Blockordningen (Marcus-låst, S102 Del 8 + Del 10; TASK-243.3 AC #1).
 * Bevakningsraden är det enda VILLKORADE blocket — de övriga står alltid
 * kvar (med sitt eget tomma-läge-kvitto), Bevakningsraden är HELT frånvarande
 * ur DOM:en vid noll träffar (asymmetrin är Marcus-låst, se
 * `Bevakningsrad.tsx`s docblock).
 */
test.describe('Blockordningen (S102 Del 8 + Del 10, AC #1)', () => {
  test('samtliga rubriker i facit-ordning; Bevakningsraden mellan Nästa event och Nya anmälningar när den finns', async ({
    page,
    network,
  }) => {
    // Event 15 dagar bort (inom Bevakningsradens 21-dagarsfönster, UTANFÖR
    // Förfallna-betalningars 14-dagarsdeadline) med EN bekräftad anmälan som
    // saknar Deltagarinfo-stämpeln → triggar ENDAST Bevakningsraden, inget
    // annat block får data.
    mock(network, {
      registrations: [
        reg({
          fornamn: 'Vera',
          efternamn: 'Vik',
          eventId: 'recEvBevakning',
          status: 'Bekräftad (mail skickat)',
          anmalningsavgift: 'Mottagen',
          slutbetalning: 'Mottagen',
          deltagarinfoSkickad: null,
        }),
      ],
      events: [ev({ id: 'recEvBevakning', eventNamn: 'Fjärrskådning', startdatum: '2026-09-30' })],
    });
    await page.goto('/hem');
    // `allTextContents()` är en ÖGONBLICKSBILD (ingen auto-retry, task-64s
    // web-first-disciplin) — vänta in SISTA blockets rubrik FÖRST, annars
    // läses listan innan Hem hunnit rendera klart (tomt/partiellt resultat).
    await expect(page.getByRole('heading', { level: 2, name: 'Senaste aktivitet' })).toBeVisible();

    // Rubrikerna i DOM-ordning — h1 (hälsningen) räknas med separat.
    // Bevakningsraden bär INGEN rubrik (Marcus-låst asymmetri) och syns
    // därför inte i denna lista — dess PLATS bevisas separat nedan via
    // renderad ordning (L246).
    const rubriker = await page.locator('main#main').getByRole('heading').allTextContents();
    expect(rubriker[0]).toMatch(H1_HALSNING);
    expect(rubriker.slice(1)).toEqual([
      'Nästa event',
      '0 nya anmälningar att bekräfta',
      '0 förfallna betalningar',
      'Genvägar',
      'Senaste aktivitet',
    ]);

    const nastaEvent = page.getByRole('region', { name: 'Nästa event' });
    const bevakningsrad = page.getByRole('list', { name: 'Bevakningar' });
    const nyaAnmalningar = page.getByRole('heading', { level: 2, name: /att bekräfta$/ });
    await expect(bevakningsrad).toBeVisible();
    const [nastaBox, bevakningBox, nyaBox] = await Promise.all([
      nastaEvent.boundingBox(),
      bevakningsrad.boundingBox(),
      nyaAnmalningar.boundingBox(),
    ]);
    if (!nastaBox || !bevakningBox || !nyaBox) {
      throw new Error('boundingBox saknas i ordnings-mätningen');
    }
    expect(nastaBox.y).toBeLessThan(bevakningBox.y);
    expect(bevakningBox.y).toBeLessThan(nyaBox.y);
  });

  test('noll bevakningsträffar → Bevakningsraden HELT FRÅNVARANDE ur DOM:en (ingen wrapper, ingen rubrik)', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [reg()],
      events: [ev({ startdatum: '2099-06-01' })], // långt utanför 21-dagarsfönstret
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Bevakningar' })).toHaveCount(0);
  });
});

/**
 * Åtgärdskön — bevakningsradstypen (TASK-284.4; ADR-122 beslut 7, §22
 * Åtgärdskön i DESIGN-SYSTEM-SPEC.md). Skarven pekas ut av kortet: DENNA
 * describe-blocket är den nya bevakningsradstypens tester, sida vid sida
 * med "Blockordningen"-blockets två eventinfo-bevakningsradstester ovan
 * (samma fil, samma `mock()`-hjälpare — ingen ny testfil, TASK-284.4-
 * uppdraget). Räknaren härleds ur `Registration.eventmatchning` (AC #3) —
 * fixturerna nedan sätter fältet direkt, aldrig en egen tolkning av vad
 * "behöver hanteras" betyder.
 */
test.describe('Åtgärdskön — bevakningsradstypen (TASK-284.4, ADR-122 beslut 7)', () => {
  test('två flaggade anmälningar (Avviker + Utan event) → räknad rad, klick navigerar förfiltrerat till /mer/anmalningar, axe 0', async ({
    page,
    network,
  }) => {
    // TRE anmälningar, ETT event (eventlöst för åtgärdskön i sig — raden är
    // global, inte per-event): Vera avviker (fel event), Wilma saknar
    // eventlänk helt, Xavier är OK — bara de FÖRSTA TVÅ ska räknas
    // (AC #3: räknat ur fältet, aldrig gissat).
    mock(network, {
      registrations: [
        reg({ fornamn: 'Vera', efternamn: 'Vik', eventmatchning: 'Avviker' }),
        reg({
          fornamn: 'Wilma',
          efternamn: 'Wall',
          eventId: null,
          eventmatchning: 'Utan event',
        }),
        reg({ fornamn: 'Xavier', efternamn: 'Xin', eventmatchning: 'OK' }),
      ],
      events: [], // inget eventinfo-bevakningsläge ska kunna trigga här — isolerar åtgärdskö-raden
    });
    await page.goto('/hem');

    const bevakningsrad = page.getByRole('list', { name: 'Bevakningar' });
    await expect(bevakningsrad).toBeVisible();
    // EXAKT en rad — Xavier (OK) räknas inte med, och det finns inget
    // eventinfo-läge (events: []) som skulle lägga till en andra rad.
    await expect(bevakningsrad.getByRole('listitem')).toHaveCount(1);

    // [TASK-291 AC #3] Den promoverade radens copy är TVÅDELAD: talet i
    // rubriken, orsaken i undertexten (Marcus S111 Del 5). Länkens
    // tillgängliga namn är därför båda delarna, inte den gamla enmenings-
    // formen `atgardskoText` — den lever kvar oförändrad på
    // `/mer/anmalningar` och asserteras på den ytan längre ned i testet.
    const atgardskoLank = page.getByRole('link', {
      name: '2 kräver åtgärd Kunde inte kopplas till rätt event',
    });
    await expect(atgardskoLank).toBeVisible();
    // Särskiljningen mot deltagarinfo-raden (QA-fynd 284.5) bärs av en
    // ledande markör som är `aria-hidden` — den får därför ALDRIG synas i
    // det tillgängliga namnet ovan, och betydelsen ligger aldrig i den
    // ensam (284.4 AC #5). Att namnet matchar exakt är beviset.

    // axe FÖRE klick — samma sida, med raden synlig (AC #5 "fyllt läge").
    const fylldaResultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(fylldaResultat.violations).toEqual([]);

    // Klick → riktig navigation (AC #4: åtgärdsytan förfiltrerad).
    await atgardskoLank.click();
    await expect(page).toHaveURL(/\/mer\/anmalningar\?visa=atgardskon$/);

    // Destinationen (AnmalningarList, `visaAtgardskon`): ENDAST de två
    // flaggade raderna, Xavier (OK) är BORTFILTRERAD.
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
    await expect(page.getByText('2 anmälningar kunde inte kopplas till rätt event')).toBeVisible();
    const anmalningarLista = page.getByRole('list', { name: 'Anmälningar' });
    await expect(anmalningarLista.getByText('Vera Vik')).toBeVisible();
    await expect(anmalningarLista.getByText('Wilma Wall')).toBeVisible();
    await expect(anmalningarLista.getByText('Xavier Xin')).toHaveCount(0);

    // Vägen tillbaka ur filtret finns och nollställer search-parametern.
    const visaAllaLank = page.getByRole('link', { name: 'Visa alla anmälningar' });
    await expect(visaAllaLank).toBeVisible();
    await visaAllaLank.click();
    await expect(page).toHaveURL(/\/mer\/anmalningar$/);
    await expect(page.getByText('3 anmälningar')).toBeVisible();
  });

  test('noll flaggade anmälningar (alla OK) → Åtgärdskö-raden HELT FRÅNVARANDE, axe 0 (tomt läge för denna radtyp)', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({ fornamn: 'Yara', efternamn: 'Yl', eventmatchning: 'OK' }),
        reg({ fornamn: 'Zack', efternamn: 'Zorn', eventmatchning: null }),
      ],
      events: [],
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    // Samma osynlig-vid-noll-kontrakt som eventinfo-raden — HELA `<ul>` saknas.
    await expect(page.getByRole('list', { name: 'Bevakningar' })).toHaveCount(0);
    // BÅDA delarna av den promoverade radens tvådelade copy måste vara borta
    // — en frånvarande rubrik med kvarstående undertext hade varit ett halvt
    // rivet läge. Skiftlägesokänslig regex: rubriken bär versal K sedan
    // TASK-291 AC #3 ("Kunde inte kopplas till rätt event" som egen mening).
    await expect(page.getByText(/kunde inte kopplas till rätt event/i)).toHaveCount(0);
    await expect(page.getByText(/kräver åtgärd/i)).toHaveCount(0);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});

/**
 * Tomma läget (PRD task-243 användarberättelse 8): grön bock, "läget är
 * under kontroll" — trygghet, inte "trasigt". Bevakningsraden är asymmetrisk
 * mot detta (se ovan): den har inget eget tomt-läge-kvitto, den är bara borta.
 */
test.describe('Tomma läget (PRD task-243 berättelse 8)', () => {
  test('noll data överallt → grön bock i Nya anmälningar och Förfallna betalningar, ingen bevakningsrad, inga alerts, inga bulk-knappar', async ({
    page,
    network,
  }) => {
    mock(network, { registrations: [], events: [] });
    await page.goto('/hem');

    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    // Nästa event — vänlig tom-text, byte-identisk med facit-prototypen.
    await expect(
      page.getByRole('region', { name: 'Nästa event' }).getByText('Inga kommande event just nu.'),
    ).toBeVisible();

    await expect(
      page.getByText('Inga nya anmälningar att bekräfta, läget är under kontroll.'),
    ).toBeVisible();
    await expect(page.getByText('Inga förfallna betalningar.')).toBeVisible();

    // Bevakningsraden är HELT osynlig — den bär inget eget kvitto.
    await expect(page.getByRole('list', { name: 'Bevakningar' })).toHaveCount(0);

    // Ingen bulk-knapp renderas när det inte finns något att agera på.
    await expect(page.getByRole('button', { name: 'Bekräfta alla' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Skicka påminnelse till alla' })).toHaveCount(0);

    // Inga fel-alerts i det tomma, lyckade läget.
    await expect(page.getByRole('alert')).toHaveCount(0);

    // Genvägarna och Senaste aktivitet-blocket kvarstår alltid.
    await expect(page.getByRole('heading', { level: 2, name: 'Genvägar' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Senaste aktivitet' })).toBeVisible();
  });
});

/**
 * Nya anmälningar — statusfiltret, räknar-rubriken, bekräftelsesvep-knappen,
 * anmälans ålder (PRD task-243 berättelser 3, 4, 6). `obekraftadeAnmalningar`
 * kräver `status === 'Obekräftad'` — recency-utan-filter är INTE facit-formen.
 */
test.describe('Nya anmälningar — statusfilter, räknare, bekräftelsesvep, ålder (PRD berättelse 3, 4, 6)', () => {
  test('räknar-rubriken räknar ENDAST status Obekräftad; recency-sorterat; ålder som relativ tid; bulk-knappen öppnar bekräftelsesvepets sändyta', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({
          fornamn: 'Alice',
          efternamn: 'Ek',
          status: 'Obekräftad',
          inskickad: '2026-09-15T06:00:00.000Z', // 2 tim före FROZEN_NOW (10:00+02:00 = 08:00Z)
        }),
        reg({
          fornamn: 'Bertil',
          efternamn: 'Berg',
          status: 'Obekräftad',
          inskickad: '2026-09-15T07:55:00.000Z', // 5 min före FROZEN_NOW
        }),
        // Redan bekräftad — räknas INTE (facit-kravet, hem-derivations.ts §
        // obekraftadeAnmalningar).
        reg({ fornamn: 'Cecilia', efternamn: 'Cold', status: 'Bekräftad (mail skickat)' }),
      ],
      // EXPLICIT id, matchar reg()-defaultens eventId 'recEvent1' — annars
      // (ev()s slumpade default-id) faller Alice/Bertil ur
      // `bekraftelsesvepUrval`s eventId→eventsMap-koppling (dokumenterad
      // gräns, `svep-urval.ts`) och dialogens "Skicka till N personer"-läge
      // hade aldrig prövats, bara det tomma undantagsläget.
      events: [ev({ id: 'recEvent1' })],
    });
    await page.goto('/hem');
    const block = page.getByRole('region', { name: '2 nya anmälningar att bekräfta' });
    await expect(block).toBeVisible();
    await expect(page.getByText('Cecilia Cold')).toHaveCount(0);

    // Senast inskickad först (Bertil, 5 min sedan) — recency-sorterat.
    const rader = block.getByRole('listitem');
    await expect(rader).toHaveCount(2);
    await expect(rader.first()).toContainText('Bertil');
    await expect(rader.last()).toContainText('Alice');

    // Ålder som relativ tid (PRD berättelse 4) — beräknat för hand mot
    // FROZEN_NOW, samma tautologi-vakt som `relativTid`-testerna nedan.
    await expect(block.getByText('för 5 min sedan', { exact: true })).toBeVisible();
    await expect(block.getByText('för 2 tim sedan', { exact: true })).toBeVisible();

    // Bekräftelsesvep-knappen: sedan [TASK-241.2] en RIKTIG, klickbar knapp
    // — `BulkAtgardsknapp.tsx`s `onPress`-gren (Hem pekar, svepet skickar,
    // ADR-114). ForfallnaBetalningars syskonknapp "Skicka påminnelse till
    // alla" fick SAMMA behandling i [TASK-241.4] — se den describen nedan
    // (§ "Förfallna betalningar"). Den gamla no-op-formen (`aria-disabled` +
    // tooltip, `onPress` UTELÄMNAD) finns inte längre kvar på NÅGON av de
    // två bulk-knapparna. Visuellt OFÖRÄNDRAD i båda lägena (samma
    // `intent="primary"`, samma fullbredd); `aria-disabled`/`onPress` är det
    // enda som skiljer dem, per `BulkAtgardsknapp.tsx`s docblock.
    const knapp = block.getByRole('button', { name: 'Bekräfta alla' });
    await expect(knapp).toBeVisible();
    await expect(knapp).not.toHaveAttribute('aria-disabled');

    // Öppnar sändytans dialog (`SvepOverlay`, `role="dialog"` via
    // react-aria-components `Dialog`, namnet ur `title="Bekräfta alla"`) —
    // och Escape stänger den igen UTAN sidoeffekter: samma två anmälningar
    // står kvar, ingen ny alert, ingen navigering bort från /hem
    // (`Modal isDismissable` bär Escape-hanteringen, `Hem.tsx`s docblock).
    await knapp.click();
    const dialog = page.getByRole('dialog', { name: 'Bekräfta alla' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/hem$/);
    await expect(rader).toHaveCount(2);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('singular — exakt EN ny anmälan → "1 ny anmälan att bekräfta"', async ({
    page,
    network,
  }) => {
    mock(network, { registrations: [reg({ status: 'Obekräftad' })], events: [ev()] });
    await page.goto('/hem');
    await expect(
      page.getByRole('heading', { level: 2, name: '1 ny anmälan att bekräfta' }),
    ).toBeVisible();
  });

  test('inline-rullning ALLA rader — ingen kapad lista, ingen "visa alla"-länk, rullytan tangentbordsfokuserbar', async ({
    page,
    network,
  }) => {
    const manga = Array.from({ length: 30 }, (_, i) =>
      reg({
        fornamn: `Person${String(i).padStart(2, '0')}`,
        efternamn: 'Testsson',
        status: 'Obekräftad',
        inskickad: new Date(Date.UTC(2026, 8, 1, 12, 0, 0) - i * 3_600_000).toISOString(),
      }),
    );
    mock(network, { registrations: manga, events: [ev()] });
    await page.goto('/hem');
    const lista = page.getByRole('list', { name: 'Nya anmälningar att bekräfta' });
    await expect(lista.getByRole('listitem')).toHaveCount(30);
    // WCAG 2.1.1/axe scrollable-region-focusable.
    await expect(lista).toHaveAttribute('tabindex', '0');
    // Ingen extern "Visa alla →"-länk (K10-formens navigation) — inline-scroll
    // bär hela ansvaret (PRD berättelse 6).
    await expect(page.getByRole('link', { name: /Visa alla/ })).toHaveCount(0);
  });
});

/**
 * Förfallna betalningar — avgiftstyp per rad, skickat-markören, en-
 * påminnelse-modellens TRE tillståndsgrupper (PRD berättelse 5; S102 Del 10
 * beslut 7–8; `ForfallnaBetalningar.tsx`). Deadline = eventstart − 14 dagar;
 * samtliga event nedan har startdatum 2026-09-20 (deadline 2026-09-06, redan
 * passerad mot FROZEN_NOW 2026-09-15).
 *
 * BULK-KNAPPENS SÄNDVÄG (TASK-241.4, ände-till-ände + negativa sensorn för
 * en-påminnelse-modellens läge 1-filter) HAR EN EGEN FIL:
 * `svep-paminnelse-send.acceptance.test.ts` — samma uppdelning som
 * bekräftelsesvepets `svep-bekraftelse-send.acceptance.test.ts` (TASK-241.3).
 * Testet nedan bevisar bara att knappen ÄR den öppnande ingången (rebase-
 * semantiken, samma mall som `44649e54`s "Bekräfta alla"-fix), inte hela
 * sändflödet.
 */
test.describe('Förfallna betalningar — avgiftstyp, skickat-markör, tre tillståndsgrupper (PRD berättelse 5, S102 Del 10 beslut 7–8)', () => {
  test('EN registrering som saknar BÅDA avgifterna ger TVÅ rader; "Att påminna" när ingen påminnelse skickats; bulk-knappen öppnar påminnelsesvepets sändyta', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({
          fornamn: 'Disa',
          efternamn: 'Dahl',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
          slutbetalning: 'Ej mottagen',
        }),
      ],
      events: [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    });
    await page.goto('/hem');
    await expect(page.getByRole('region', { name: '2 förfallna betalningar' })).toBeVisible();

    const attPaminna = page.getByRole('heading', { level: 3, name: /^Att påminna/ }).locator('..');
    await expect(attPaminna).toContainText('Anmälningsavgift · Fjärrskådning');
    await expect(attPaminna).toContainText('Slutbetalning · Fjärrskådning');
    await expect(attPaminna.getByRole('listitem')).toHaveCount(2);

    await expect(page.getByRole('heading', { level: 3, name: /^Väntar/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 3, name: /^Dags att ringa/ })).toHaveCount(0);

    // BulkAtgardsknappens syskon lever ENSAM i "Att påminna" (Marcus-låst) —
    // och är sedan [TASK-241.4] en RIKTIG, klickbar knapp (`onSkickaPaminnelseAlla`,
    // ADR-114), inte längre den aria-disabled no-op-formen TASK-243.1 lämnade
    // den i (samma rebase-mönster som `44649e54`s "Bekräfta alla"-fix).
    const knapp = page.getByRole('button', { name: 'Skicka påminnelse till alla' });
    await expect(knapp).toBeVisible();
    await expect(knapp).not.toHaveAttribute('aria-disabled');

    // Öppnar sändytans dialog (`SvepOverlay`, namnet ur `title="Skicka
    // påminnelse till alla"`) — och Escape stänger den igen UTAN
    // sidoeffekter: raden står kvar, ingen ny alert, ingen navigering bort
    // från /hem.
    await knapp.click();
    const dialog = page.getByRole('dialog', { name: 'Skicka påminnelse till alla' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/hem$/);
    await expect(attPaminna.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('"Väntar" — påminnelse skickad för < 7 dagar sedan, med skickat-markören; ingen bulk-knapp', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({
          fornamn: 'Egon',
          efternamn: 'Ek',
          eventId: 'recEvForf',
          anmalningsavgift: 'Mottagen',
          slutbetalning: 'Ej mottagen',
          paminnelseSlutbetalningSkickad: '2026-09-13T08:00:00.000Z', // 2 dagar sedan
        }),
      ],
      events: [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 3, name: /^Väntar · 1$/ })).toBeVisible();
    await expect(page.getByText('Påminnelse skickad 2026-09-13')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skicka påminnelse till alla' })).toHaveCount(0);
  });

  test('"Dags att ringa" — påminnelse ≥ 7 dagar sedan → konstaterande copy + telefon + avgiftstypens notering', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({
          fornamn: 'Frida',
          efternamn: 'Falk',
          eventId: 'recEvForf',
          telefon: '070-9998877',
          anmalningsavgift: 'Ej mottagen',
          slutbetalning: 'Mottagen',
          paminnelseAnmalningsavgiftSkickad: '2026-09-01T08:00:00.000Z', // 14 dagar sedan
          noteringAnmalningsavgift: 'Ringde, inget svar förra veckan.',
        }),
      ],
      events: [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    });
    await page.goto('/hem');
    const grupp = page.getByRole('heading', { level: 3, name: /^Dags att ringa/ }).locator('..');
    await expect(grupp).toContainText('Påmind 1 sep · obetald · 070-9998877');
    await expect(grupp).toContainText('Ringde, inget svar förra veckan.');
  });
});

/**
 * Bevakningsraden — trigger, radanatomi, två lägen (PRD berättelse 7; S102
 * Del 10 beslut 2–4; `Bevakningsrad.tsx`).
 *
 * [TASK-291 AC #3 + TASK-303, 2026-08-23] KRAVET ÄR OMFORMULERAT, inte
 * uppmjukat. Fram till den promoverade formen löd det "ALDRIG ellips på
 * meningsbärande text — `line-clamp-2`, aldrig `truncate`". Den godkända
 * anatomin (rubrikrad + undertext, båda alltid en rad) bär `truncate` på
 * RUBRIKEN, så den bokstaven kan inte längre hållas för eventnamnet. Vad
 * som består är SKÄLET: hela texten finns kvar i DOM:en (klippningen är
 * visuell, aldrig i innehållet, så skärmläsaren läser hela namnet), och
 * MENINGARNA — undertexten i båda lägen — klipps inte. Se
 * `Bevakningsrad.tsx` § KVARSTÅENDE KLIPPNING för avvägningen och för varför
 * TASK-303 AC #3 därmed inte kan bockas utan Marcus ord.
 */
test.describe('Bevakningsraden — radanatomi och två lägen (PRD berättelse 7, S102 Del 10 beslut 2–4)', () => {
  test('"ej-skickad" — ALLA bekräftade saknar stämpeln → "Deltagarinfo saknas"; hela det långa eventnamnet finns kvar i DOM:en', async ({
    page,
    network,
  }) => {
    const langtNamn =
      'Fjärrskådning och medveten närvaro i gränslandet mellan sömn och vakenhet — en fördjupningshelg';
    mock(network, {
      registrations: [
        reg({
          eventId: 'recEvBev',
          status: 'Bekräftad (mail skickat)',
          anmalningsavgift: 'Mottagen',
          slutbetalning: 'Mottagen',
          deltagarinfoSkickad: null,
        }),
      ],
      events: [ev({ id: 'recEvBev', eventNamn: langtNamn, startdatum: '2026-09-30' })],
    });
    await page.goto('/hem');
    const rad = page.getByRole('list', { name: 'Bevakningar' }).getByRole('listitem');
    await expect(rad).toHaveCount(1);
    // HELA namnet finns i DOM:en — `truncate` klipper VISUELLT (CSS), aldrig
    // textinnehållet, så skärmläsaren får hela strängen.
    await expect(rad).toContainText(langtNamn);
    await expect(rad).toContainText('Deltagarinfo saknas');
    await expect(rad).toContainText('15 dagar kvar');
    // Riktig knapp med chevron — leder framåt men no-op (svep-PRD:n bygger
    // inte här, task-241).
    const knapp = rad.getByRole('button');
    await expect(knapp).toBeVisible();
    await expect(knapp.locator('svg')).toHaveCount(1);
    // [TASK-303] ANATOMIN, inte radbrytningen: rubriken bär hela namnet på EN
    // rad och undertexten är en EGEN rad — båda alltid renderade. Att
    // `line-clamp-2` är HELT borta ur raden är den mekaniska sidan av samma
    // sak: kvarlämnad hade den låtit höjden variera igen.
    await expect(rad.locator('span.line-clamp-2')).toHaveCount(0);
    const rubrik = rad.locator('span.truncate.font-semibold');
    await expect(rubrik).toHaveText(langtNamn);
    const undertext = rad.locator('span.truncate.text-caption');
    await expect(undertext).toHaveText('Deltagarinfo saknas');
    // MENINGEN klipps inte: undertextens innehåll ryms i sin egen bredd
    // (`scrollWidth <= clientWidth`). Det är den del av Gunilla-principen som
    // består efter TASK-303 — rubriken (ett egennamn) är undantagen, se
    // describe-blockets huvud.
    const meningsbredd = await undertext.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(meningsbredd.scrollWidth).toBeLessThanOrEqual(meningsbredd.clientWidth);
  });

  test('"eftersalantrare" — NÅGRA (inte alla) bekräftade saknar stämpeln → "N nya saknar deltagarinfo"', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({
          fornamn: 'Gun',
          efternamn: 'Gren',
          eventId: 'recEvBev',
          status: 'Bekräftad (mail skickat)',
          anmalningsavgift: 'Mottagen',
          slutbetalning: 'Mottagen',
          deltagarinfoSkickad: null,
        }),
        reg({
          fornamn: 'Hans',
          efternamn: 'Holm',
          eventId: 'recEvBev',
          status: 'Bekräftad (mail skickat)',
          anmalningsavgift: 'Mottagen',
          slutbetalning: 'Mottagen',
          deltagarinfoSkickad: '2026-09-10T08:00:00.000Z', // redan skickad
        }),
        // Obekräftad räknas INTE med bland "bekräftade" (definition B).
        reg({ fornamn: 'Iris', efternamn: 'Idun', eventId: 'recEvBev', status: 'Obekräftad' }),
      ],
      events: [ev({ id: 'recEvBev', eventNamn: 'Fjärrskådning', startdatum: '2026-09-30' })],
    });
    await page.goto('/hem');
    const rad = page.getByRole('list', { name: 'Bevakningar' }).getByRole('listitem');
    await expect(rad).toHaveCount(1);
    // [TASK-303 AC #4] Ordet "deltagare" är struket, ordet "nya" står kvar —
    // den enda formen båda ytorna bär efter promoveringen. Se
    // `hem-derivations.ts` § `bevakningStatusText` för Marcus skäl.
    await expect(rad).toContainText('1 nya saknar deltagarinfo');
    await expect(rad).not.toContainText('nya deltagare saknar');
  });
});

/**
 * [TASK-303 AC #1] HÖJDLÅSET SOM BETEENDE — ersätter TASK-241.8:s
 * `line-clamp-2`-geometribevis, som mätte en mekanism som inte längre finns.
 *
 * VAD SOM ÄNDRADES OCH VARFÖR DET GAMLA TESTET INTE KUNDE BEHÅLLAS: fram
 * till promoveringen bar båda radtyperna `line-clamp-2`, och beviset var att
 * copyn RYMDES inom två rader. Det var precis den mekanism som lät höjden
 * variera med copyns längd (TASK-303:s fynd), och den fällde skarpt på
 * `943639a4` efter ordbytet Eventinfo → Deltagarinfo: `scrollHeight` 72 mot
 * `clientHeight` 48 vid 1440 px. Den godkända formen löser det med ANATOMI i
 * stället — rubrikrad + undertext, båda alltid exakt en rad — så det som ska
 * bevisas är inte längre "ryms" utan "rör sig aldrig".
 *
 * MÄTMETODEN: `getBoundingClientRect().height` på varje `<li>`, inte en
 * helsidesbild (`fullPage`-screenshots ljuger om fixed-element, S107) och
 * inte `scrollHeight` (som mäter innehåll, inte den renderade raden).
 *
 * VARFÖR EXAKT 70 OCH INTE ETT INTERVALL: höjden är härledd ur explicita
 * line-heights, inte ur fontmetrik — `--text-body--line-height: 1.5` (24 px)
 * + `gap-y-0.5` (2 px) + `--text-caption--line-height: 1.5` (18 px) +
 * `py-3` (24 px) + 1 px kant i vardera änden = 70. Ett intervall hade dolt
 * exakt den drift talet finns för att fånga. Samma 70 px Marcus godkände i
 * S111 Del 5.
 *
 * MATRISEN är den TASK-303-kortet krävde: smalaste stödda bredd (375) och
 * uppåt, kort OCH lång copy, ett- till fyrsiffriga tal, BÅDA radtyperna
 * samtidigt, plus `ej-skickad`-lägets egen copy. Värsta-fall-namnet är
 * PR #1388:s permanenta 91-teckens fixtur.
 */
test.describe('Bevakningsraden — höjdlåset som beteende (TASK-303 AC #1)', () => {
  /** Den mätta, Marcus-godkända radhöjden. Se describe-huvudet för härledningen. */
  const RADHOJD = 70;

  const KORT_NAMN = 'Fjärrskådning';
  /** PR #1388:s permanenta värsta-fall-fixtur, 91 tecken. */
  const VARSTA_FALL_NAMN =
    'Demo: Fördjupningskurs i konflikthantering och medling för föreningsledare i Västerbotten';

  /**
   * EN registreringsmängd ger BÅDA radernas tal: varje rad är samtidigt en
   * bekräftad utan deltagarinfo-stämpel (driver deltagarinfo-radens N) och
   * eventmatchnings-flaggad (driver åtgärdskö-radens N). Att slå ihop dem
   * håller fixturen liten även vid fyrsiffriga tal — 1234 poster i stället
   * för 2468.
   */
  function radRegs(antal: number, medStampel: boolean): RegRow[] {
    const flaggade = Array.from({ length: antal }, (_, idx) =>
      reg({
        fornamn: `Rad${idx + 1}`,
        efternamn: 'Ostampad',
        eventId: 'recEvHojd',
        status: 'Bekräftad (mail skickat)',
        anmalningsavgift: 'Mottagen',
        slutbetalning: 'Mottagen',
        deltagarinfoSkickad: null,
        eventmatchning: 'Avviker',
      }),
    );
    // Utan denna rad är ALLA bekräftade ostämplade och läget blir
    // `ej-skickad` ("Deltagarinfo saknas") i stället för eftersläntrare.
    const stampel = reg({
      fornamn: 'Redan',
      efternamn: 'Skickad',
      eventId: 'recEvHojd',
      status: 'Bekräftad (mail skickat)',
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Mottagen',
      deltagarinfoSkickad: '2026-09-10T08:00:00.000Z',
      eventmatchning: 'OK',
    });
    return medStampel ? [...flaggade, stampel] : flaggade;
  }

  const FALL = [
    { namn: 'kort namn, ensiffrigt tal', eventNamn: KORT_NAMN, antal: 1, medStampel: true },
    { namn: 'kort namn, tvåsiffrigt tal', eventNamn: KORT_NAMN, antal: 12, medStampel: true },
    {
      namn: '91-teckens namn, tresiffrigt tal',
      eventNamn: VARSTA_FALL_NAMN,
      antal: 123,
      medStampel: true,
    },
    {
      namn: '91-teckens namn, fyrsiffrigt tal',
      eventNamn: VARSTA_FALL_NAMN,
      antal: 1234,
      medStampel: true,
    },
    {
      namn: 'ej-skickad-lägets egen copy ("Deltagarinfo saknas")',
      eventNamn: KORT_NAMN,
      antal: 8,
      medStampel: false,
    },
  ];

  for (const viewport of [375, 390, 768, 1280]) {
    test(`${viewport}px: båda radtyperna är exakt ${RADHOJD}px i alla fem fall`, async ({
      page,
      network,
    }) => {
      await page.setViewportSize({ width: viewport, height: 900 });
      const matning: { fall: string; hojder: number[] }[] = [];

      for (const fall of FALL) {
        mock(network, {
          registrations: radRegs(fall.antal, fall.medStampel),
          events: [ev({ id: 'recEvHojd', eventNamn: fall.eventNamn, startdatum: '2026-09-30' })],
        });
        await page.goto('/hem');

        const rader = page.getByRole('list', { name: 'Bevakningar' }).getByRole('listitem');
        // BÅDA radtyperna samtidigt — åtgärdskö-raden först (Hem.tsx
        // § ORDNING), deltagarinfo-raden därefter.
        await expect(rader).toHaveCount(2);
        await expect(rader.first()).toContainText(`${fall.antal} kräver åtgärd`);

        const hojder = await rader.evaluateAll((els) =>
          els.map((el) => el.getBoundingClientRect().height),
        );
        matning.push({ fall: fall.namn, hojder });
      }

      // Rapporterbart spår, inte bara en bock (ADR-103 B4: "körningen lämnar
      // spår"). Syns i Playwrights rapport när fallet fäller.
      test.info().annotations.push({ type: 'höjdlås', description: JSON.stringify(matning) });

      for (const { fall, hojder } of matning) {
        expect(hojder, `${fall} @ ${viewport}px`).toEqual([RADHOJD, RADHOJD]);
      }
    });
  }

  /**
   * NEGATIVKONTROLLEN (TASK-303-kortets uttryckliga beviskrav: "bryt
   * reserveringen medvetet, mät att testet fäller, återställ"). Ett test som
   * inte kan fälla bevisar ingenting — precedent: TASK-299.3:s agent mätte
   * 28,5 px skillnad i sin egen negativkontroll.
   *
   * Här bryts låsets BÄRANDE mekanism direkt i DOM:en — `truncate` tas bort
   * från undertexten och innehållet görs långt nog att brytas. Mätningen
   * ovan (samma `getBoundingClientRect().height` på samma `<li>`) måste då
   * ge ett ANNAT tal än 70. Görs i den smalaste vyporten, där marginalen är
   * minst.
   */
  test('375px: negativkontroll — bryts truncate på undertexten rör sig höjden, alltså kan mätningen fälla', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    mock(network, {
      registrations: radRegs(12, true),
      events: [ev({ id: 'recEvHojd', eventNamn: KORT_NAMN, startdatum: '2026-09-30' })],
    });
    await page.goto('/hem');

    const deltagarinfoRad = page
      .getByRole('list', { name: 'Bevakningar' })
      .getByRole('listitem')
      .filter({ has: page.getByRole('button') });
    await expect(deltagarinfoRad).toContainText('12 nya saknar deltagarinfo');

    const fore = await deltagarinfoRad.evaluate((el) => el.getBoundingClientRect().height);
    expect(fore).toBe(RADHOJD);

    const efter = await deltagarinfoRad.evaluate((el) => {
      const undertext = el.querySelector('span.truncate.text-caption');
      if (!undertext) throw new Error('undertexten hittades inte — negativkontrollen mäter inget');
      undertext.classList.remove('truncate');
      undertext.textContent = 'lorem ipsum dolor sit amet '.repeat(12);
      return el.getBoundingClientRect().height;
    });
    expect(efter).toBeGreaterThan(RADHOJD);
  });
});

/** Genvägar (PRD task-243 användarberättelse 9) — BÅDA är redan skarpa, byggda routes. */
test.describe('Genvägar (PRD berättelse 9)', () => {
  test('två genvägar med korrekta hrefs och etiketter, inuti nav[aria-label="Genvägar"]', async ({
    page,
    network,
  }) => {
    mock(network);
    await page.goto('/hem');
    const nav = page.getByRole('navigation', { name: 'Genvägar' });
    await expect(nav.getByRole('link', { name: 'Lägg till manuell anmälan' })).toHaveAttribute(
      'href',
      '/anmalan/ny',
    );
    await expect(nav.getByRole('link', { name: 'Gå till åtgärder' })).toHaveAttribute(
      'href',
      '/atgarder',
    );
  });
});

/**
 * Tillgänglighet (TASK-243.3 AC #2): rubrikstruktur, axe 0 på det FULLA
 * "kitchen sink"-läget (Bevakningsrad + alla tre förfallna-grupper samtidigt
 * — den sparsamma axe-svepningen ovan i "Hem — A-skelettet" täcker redan det
 * enkla läget).
 */
test.describe('Tillgänglighet — rubrikstruktur och kitchen-sink axe (AC #2)', () => {
  test('alla block populerade samtidigt (Bevakningsrad + tre förfallna-grupper) → axe 0 violations', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({ fornamn: 'Alice', efternamn: 'Ek', status: 'Obekräftad' }),
        reg({
          fornamn: 'Bertil',
          efternamn: 'Berg',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
          slutbetalning: 'Mottagen',
        }),
        reg({
          fornamn: 'Cecilia',
          efternamn: 'Cold',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
          slutbetalning: 'Mottagen',
          paminnelseAnmalningsavgiftSkickad: '2026-09-13T08:00:00.000Z',
        }),
        reg({
          fornamn: 'David',
          efternamn: 'Dag',
          eventId: 'recEvForf',
          anmalningsavgift: 'Mottagen',
          slutbetalning: 'Ej mottagen',
          paminnelseSlutbetalningSkickad: '2026-09-01T08:00:00.000Z',
        }),
        reg({
          fornamn: 'Elin',
          efternamn: 'Edman',
          eventId: 'recEvBev',
          status: 'Bekräftad (mail skickat)',
          anmalningsavgift: 'Mottagen',
          slutbetalning: 'Mottagen',
          deltagarinfoSkickad: null,
        }),
      ],
      events: [
        ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' }),
        ev({ id: 'recEvBev', eventNamn: 'Meditation i tystnad', startdatum: '2026-09-30' }),
      ],
    });
    await page.goto('/hem');
    await expect(page.getByRole('list', { name: 'Bevakningar' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /^Dags att ringa/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /^Väntar/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /^Att påminna/ })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('rubrikstrukturen är h1 → h2 → h3 utan hopp; Bevakningsraden bär medvetet ingen egen rubrik', async ({
    page,
    network,
  }) => {
    mock(network, {
      registrations: [
        reg({
          fornamn: 'Frida',
          efternamn: 'Falk',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
          slutbetalning: 'Mottagen',
        }),
      ],
      events: [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    });
    await page.goto('/hem');
    // `evaluateAll()` är en ÖGONBLICKSBILD (ingen auto-retry) — vänta in
    // förfallna-gruppens h3 FÖRST (sist renderade nivå i detta scenario).
    await expect(page.getByRole('heading', { level: 3, name: /^Att påminna/ })).toBeVisible();
    const nivaer = await page
      .locator('main#main')
      .getByRole('heading')
      .evaluateAll((els) => els.map((el) => Number(el.tagName.slice(1))));
    // Aldrig ett hopp uppåt på mer än en nivå (WCAG 1.3.1/2.4.6-andan).
    for (let i = 1; i < nivaer.length; i += 1) {
      expect(nivaer[i] - nivaer[i - 1]).toBeLessThanOrEqual(1);
    }
    expect(nivaer[0]).toBe(1);
    expect(nivaer).toContain(2);
    expect(nivaer).toContain(3); // "Att påminna" (Förfallna betalningars undergrupp)
  });
});
