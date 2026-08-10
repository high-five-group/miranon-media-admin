import path from 'node:path';
import { getResponse, http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';
import {
  aggregeraDodaStallen,
  byggDodaMeddelande,
  granskaRegistrering,
  granskaTest,
  InaktuellMarkeringError,
  kandaEfNamn,
  medvetetOanvand,
  OkantEfNamnError,
  OmatchadOverskuggningError,
  type Overskuggningsobservation,
  platsUrCallFrame,
} from '../support/fixturvarld/overskuggnings-vakt';

/**
 * Tvåsidigt self-test för överskuggnings-vakten (task-62).
 *
 * HEMVISTEN SPEGLAR SYSKONET. `hermetik-vakt.spec.ts` bor här, och båda vakterna
 * hör till samma fixturvärld. Den kunde INTE bo i `tests/acceptance/`: den
 * klassens kontrakt är att varje test hänger på fixturens svar och fälls med
 * `OmockadRequestError` i självtestregimen (`scripts/hermetik-sjalvtest.mjs`
 * `bedomPositivt`). Ett `test.fail()`-test rapporteras där som `expected` och
 * hade fått den grinden att avvisa sviten — alltså hade en ny vakt brutit en
 * befintlig. ADR-080 säger dessutom rakt ut att acceptance-klassen prövar
 * EXTERNT BETEENDE, aldrig fixturen.
 *
 * BEVISET ÄR TVÅDELAT, av samma skäl som hos syskonet:
 *
 *   1. Vaktens BESLUT prövas direkt — vad den fäller på, vad den tiger om, och
 *      vad meddelandet innehåller (AC 1 + 2 + 3). Båda mekanismerna har egen
 *      sektion: den IVRIGA (som äger stavfelsklassen) och den TRÖGA (som
 *      aggregerar per deklarationsställe och fil).
 *   2. Vaktens VERKAN prövas i den skarpa fixturen — att ett medvetet felstavat
 *      mönster faktiskt FÄLLER testet, och att ett korrekt mönster inte gör det
 *      (AC 2). `test.fail()` gör den röda körningen till leveransen: fäller
 *      vakten inte, rapporterar Playwright "expected to fail but passed".
 *
 * En grön svit kan aldrig ensam bevisa att en vakt fäller — bara ett test som
 * medvetet utlöser den kan det.
 */

/** Ett svar av EF-form; innehållet spelar ingen roll för vaktens bedömning. */
const svar = () => json({ persons: [], nextCursor: null });

/**
 * Kör handlern skarpt så att `isUsed` sätts av MSW självt, aldrig av testet.
 * `getResponse` är bibliotekets egen publika väg in i matchningen (msw 2.15.0,
 * `lib/core/getResponse.d.ts`) — att sätta flaggan för hand hade bevisat att vi
 * kan skriva `true`, inte att mekanismen fungerar.
 */
async function anvand(handler: Parameters<typeof getResponse>[0][number], url: string) {
  const respons = await getResponse([handler], new Request(url));
  expect(respons, `handlern matchade inte ${url} — testuppställningen är fel`).toBeDefined();
  return handler;
}

const PERSONS_URL = 'https://visual-fixture.supabase.co/functions/v1/get-persons';

/** Det anrop `/personer` faktiskt gör, i den form fixturen bokför det. */
const PERSONS_ANROP = [{ metod: 'GET', namn: 'get-persons', url: PERSONS_URL }] as const;

/** Fångar felet ur en funktion som ska kasta, utan att dölja att den inte gjorde det. */
function fangaFel(kor: () => void): Error {
  try {
    kor();
  } catch (kastat) {
    return kastat as Error;
  }
  throw new Error('Funktionen förväntades kasta, men returnerade utan fel.');
}

// ---------------------------------------------------------------------------
// 1. DEN IVRIGA KONTROLLEN — vid network.use()
// ---------------------------------------------------------------------------

test.describe('ivrig kontroll: mönstrets Edge Function måste finnas', () => {
  test('fäller ett felstavat EF-namn, och NAMNGER mönstret', () => {
    // AC 1: mönstersträngen ska stå i klartext. Utan den pekar felet mot
    // testdata och paginering — precis det som hände i mätningen som avtäckte
    // klassen (3 av 4 tester föll, inget nämnde överskuggningen).
    const fel = fangaFel(() => granskaRegistrering([http.get(EF('get-persosn'), svar)]));

    expect(fel).toBeInstanceOf(OkantEfNamnError);
    expect(fel.message).toContain('GET */functions/v1/get-persosn');
    expect(fel.message).toContain('Ingen Edge Function heter "get-persosn"');
    // Rådet ska peka mot NORMALLÄGET, alltså mot varför testet såg fel data.
    expect(fel.message).toContain('tests/support/fixturvarld/handlers.ts');
  });

  test('namnger DEKLARATIONSSTÄLLET, inte bara mönstret', () => {
    // AC 1 + steg 4 (Mockitos felmeddelande-form): båda ställena. `callFrame`
    // är det som gör raden möjlig, och den kortas mot repo-roten så att en
    // agent-worktree och huvudkatalogen ger samma sträng.
    const fel = fangaFel(() => granskaRegistrering([http.get(EF('get-persosn'), svar)]));

    expect(fel.message).toContain('tests/visual/overskuggnings-vakt.spec.ts:');
    expect(fel.message).not.toContain('file:///');
  });

  test('lyfter fram närmaste EF-namn vid stavfel', () => {
    // Utan förslaget måste utvecklaren jämföra två strängar tecken för tecken.
    // `get-evnets` är hermetik-vaktens eget stavfelsfall (task-57) — samma
    // maskineri, nu läst från det andra hållet.
    const fel = fangaFel(() => granskaRegistrering([http.get(EF('get-evnets'), svar)]));

    expect(fel.message).toContain('Menade du:    get-events');
  });

  test('OMKASTNING ger närmaste GRANNE, inte alltid det avsedda namnet', () => {
    // MÄTT, INTE ANTAGET, och pinnat här för att inte glömmas bort.
    //
    // Kortets egen symptom-sträng är `get-persosn` — en OMKASTNING av
    // `get-persons`. Under rent Levenshtein-avstånd kostar en omkastning TVÅ
    // (två ersättningar), medan grann-EF:en `get-person` bara ligger ETT bort
    // (en borttagning). Förslaget blir därför `get-person`, inte `get-persons`.
    //
    // VARFÖR DET FÅR STÅ SÅ. Avståndsmåttet är LÅNAT från TypeScripts
    // `getSpellingSuggestion` (`ef-namnforslag.ts`), och det maskineriet delas
    // med hermetik-vakten. Att byta till Damerau/OSA — där en omkastning kostar
    // ett — hade gett `get-persons` här, men samtidigt ändrat den befintliga
    // vaktens beteende och gjort källhänvisningen osann. Det beslutet hör inte
    // till denna skiva.
    //
    // VARFÖR DET INTE URHOLKAR VAKTEN: förslaget är ett TIPS, aldrig
    // fällningsgrunden. Fällningen vilar på att `get-persosn` inte finns i
    // supabase/functions/, och det oanvända mönstret står namngivet på egen rad.
    const fel = fangaFel(() => granskaRegistrering([http.get(EF('get-persosn'), svar)]));

    expect(fel.message).toContain('  registrerad:  GET */functions/v1/get-persosn');
    expect(fel.message).toContain('Menade du:    get-person\n');
  });

  test('föreslår ingen kandidat när ingen är rimligt nära', () => {
    // Tröskeln är 0,4 × namnlängd (delad med hermetik-vakten,
    // `ef-namnforslag.ts`). Ett självsäkert FEL förslag är sämre än inget.
    const fel = fangaFel(() => granskaRegistrering([http.get(EF('xyzzy-plugh-frobozz'), svar)]));

    expect(fel.message).toContain('GET */functions/v1/xyzzy-plugh-frobozz');
    expect(fel.message).not.toContain('Menade du:');
  });

  test('är TYST för varje Edge Function som faktiskt finns', () => {
    // Den andra halvan av det tvåsidiga beviset (AC 2). En vakt som fäller på
    // allt är lika värdelös som en som aldrig fäller — och kriteriet prövas mot
    // HELA katalogen, inte mot ett lyckligt valt namn.
    for (const namn of kandaEfNamn()) {
      expect(() => granskaRegistrering([http.get(EF(namn), svar)]), namn).not.toThrow();
    }
  });

  test('KRITERIET ÄR KATALOGEN, INTE NÄRHET — batch-paren fälls inte', () => {
    // MÄTT FÖRE BYGGET, och skälet till att den ivriga kontrollen inte fäller på
    // avstånd: närhetströskeln floor(0,4 × längd) parar ihop Edge Functions som
    // BÅDA är äkta —
    //
    //     create-registration ~ get-registrations   avstånd 5, tak 7
    //     create-event-note   ~ get-event-notes     avstånd 5, tak 6
    //
    // och det är precis fixturvärldens vanligaste batch-registreringar. Ett
    // närhetskriterium hade alltså fällt den population per-fil-aggregeringen
    // finns för att tysta (51 → 4 fällningar, mätt 2026-07-28).
    expect(() =>
      granskaRegistrering([
        http.post(EF('create-registration'), svar),
        http.post(EF('create-event-note'), svar),
      ]),
    ).not.toThrow();
  });

  test('bryr sig inte om mönster utanför Edge Function-pathen', () => {
    // Ett mönster som inte pekar under /functions/v1/ är en annan felklass —
    // hermetik-vaktens, som redan skiljer den ur (task-57).
    expect(() => granskaRegistrering([http.get('*/rest/v1/nagot', svar)])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. DEN IVRIGA KONTROLLEN — vid testets slut
// ---------------------------------------------------------------------------

test.describe('ivrig kontroll: EF:en anropades men överskuggningen matchade inte', () => {
  test('fäller, och namnger BÅDA ställena', async () => {
    // Steg 4:s felmeddelande-form från Mockito: registreringen OCH det faktiska
    // anropet. Rätt EF-namn men fel METOD — appen gör GET, mocken lyssnar POST.
    const felMetod = http.post(EF('get-persons'), svar);

    const { fel } = granskaTest({ overskuggningar: [felMetod], anrop: PERSONS_ANROP });

    expect(fel).toBeInstanceOf(OmatchadOverskuggningError);
    expect(fel?.message).toContain('  registrerad:  POST */functions/v1/get-persons');
    expect(fel?.message).toContain(`                GET ${PERSONS_URL}`);
    expect(fel?.message).toContain('tests/visual/overskuggnings-vakt.spec.ts:');
  });

  test('är TYST när EF:en aldrig anropades — det är den trögas fråga', () => {
    // Den avgörande avgränsningen. En oanvänd överskuggning vars Edge Function
    // testet aldrig rörde är i 92 % av fallen en batch-registrering som ett
    // ANNAT test i samma fil använder. Att fälla här hade återinfört exakt de 51
    // fällningar per-fil-aggregeringen tar bort.
    const { fel } = granskaTest({
      overskuggningar: [http.post(EF('send-email'), svar)],
      anrop: PERSONS_ANROP,
    });

    expect(fel).toBeUndefined();
  });

  test('är TYST när handlern matchade', async () => {
    const anvandHandler = await anvand(http.get(EF('get-persons'), svar), PERSONS_URL);

    const { fel } = granskaTest({
      overskuggningar: [anvandHandler],
      anrop: PERSONS_ANROP,
    });

    expect(fel).toBeUndefined();
  });

  test('är TYST när en ANNAN överskuggning för samma EF tog anropet', async () => {
    // SKUGGAD, INTE FELSKRIVEN — och regeln är MÄTT FRAM, inte teoretisk. Utan
    // detta led föll två tester i den fulla sviten 2026-07-28 på ett idiom som
    // testfilerna själva beskriver i klartext: en `beforeEach` sätter ett
    // grundsvar och ETT test registrerar sin egen variant i testkroppen.
    // `use()` prepend:ar, så den senare vinner och beforeEach-handlern blir
    // oanvänd trots att Edge Function:en anropades.
    const beforeEachHandler = http.get(EF('get-persons'), svar);
    const testLokal = await anvand(http.get(EF('get-persons'), svar), PERSONS_URL);

    const { fel } = granskaTest({
      overskuggningar: [testLokal, beforeEachHandler],
      anrop: PERSONS_ANROP,
    });

    expect(fel).toBeUndefined();
  });

  test('släpper igenom en tom lista — ett test utan överskuggningar', () => {
    // De allra flesta tester överskuggar ingenting. Fällde vakten dem vore
    // hela fixturvärlden obrukbar.
    const { observationer, fel } = granskaTest({ overskuggningar: [], anrop: [] });

    expect(fel).toBeUndefined();
    expect(observationer).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. VENTILEN — medvetetOanvand
// ---------------------------------------------------------------------------

const SKAL =
  'Negativ sensor: att anropet ALDRIG sker är testets resultat, så handlern förblir oanvänd.';

test.describe('ventil: medvetetOanvand', () => {
  test('en märkt oanvänd överskuggning rapporteras som förklarad', () => {
    // AC 3: en legitimt oanvänd överskuggning ska kunna undantas explicit, och
    // undantaget ska SYNAS I KODEN. Observationen bär skälet vidare till den
    // tröga kontrollen, som därför tiger om stället.
    const markt = medvetetOanvand(http.post(EF('send-email'), svar), SKAL);

    const { observationer, fel } = granskaTest({ overskuggningar: [markt], anrop: [] });

    expect(fel).toBeUndefined();
    expect(observationer[0].markningsSkal).toBe(SKAL);
  });

  test('märkningen skyddar BARA sin egen handler', () => {
    // Undantaget är per handler, inte per test — annars hade en enda märkning
    // tystat vakten för allt testet gör.
    const markt = medvetetOanvand(http.get(EF('get-persons'), svar), SKAL);
    const omarkt = http.post(EF('get-persons'), svar);

    const { fel } = granskaTest({ overskuggningar: [markt, omarkt], anrop: PERSONS_ANROP });

    expect(fel).toBeInstanceOf(OmatchadOverskuggningError);
  });

  test('ett för kort skäl fäller DIREKT vid anropet', () => {
    // Kostnaden ligger i skrivstunden. Ett undantag man kan råka skriva färdigt
    // är en avstängningsknapp.
    expect(() => medvetetOanvand(http.get(EF('get-persons'), svar), 'temp')).toThrow(
      /kräver ett SKÄL/,
    );
    expect(() => medvetetOanvand(http.get(EF('get-persons'), svar), '   ')).toThrow(
      /kräver ett SKÄL/,
    );
  });

  test('en INAKTUELL märkning fäller — @ts-expect-error-kontraktet', async () => {
    // Ett undantag som slutat behövas är i sig ett fel. Utan denna gren hade
    // märkningen kunnat ligga kvar för alltid utan att någon märkte det.
    const markt = medvetetOanvand(http.get(EF('get-persons'), svar), SKAL);
    await anvand(markt, PERSONS_URL);

    const { fel } = granskaTest({ overskuggningar: [markt], anrop: PERSONS_ANROP });

    expect(fel).toBeInstanceOf(InaktuellMarkeringError);
    expect(fel?.message).toContain('INAKTUELL');
    expect(fel?.message).toContain('GET */functions/v1/get-persons');
    // Skälet ska med: läsaren ska kunna avgöra om beskrivningen någonsin stämde.
    expect(fel?.message).toContain('Negativ sensor');
  });

  test('samma handler kan inte märkas två gånger', () => {
    const handler = medvetetOanvand(http.get(EF('get-persons'), svar), SKAL);

    expect(() => medvetetOanvand(handler, 'Ett andra skäl som är tillräckligt långt.')).toThrow(
      /redan satt/,
    );
  });
});

// ---------------------------------------------------------------------------
// 4. DEN TRÖGA KONTROLLEN — per deklarationsställe och fil
// ---------------------------------------------------------------------------

function obs(over: Partial<Overskuggningsobservation> = {}): Overskuggningsobservation {
  return {
    stalle: 'tests/acceptance/exempel.acceptance.test.ts:216:18',
    header: 'GET */functions/v1/get-event',
    anvand: false,
    falldeIvrigt: false,
    ...over,
  };
}

test.describe('trög kontroll: per deklarationsställe och fil', () => {
  test('ett ställe som INGET test använde rapporteras', () => {
    // Kärnan i steg 2 — Mockitos getUnusedStubbingsByLocation.
    const doda = aggregeraDodaStallen([
      { fil: 'a\them.ts', testerSomKorde: 3, observationer: [obs(), obs(), obs()] },
    ]);

    expect(doda).toHaveLength(1);
    expect(doda[0].registreratAv).toBe(3);
  });

  test('ETT test som använder stället räcker för att det ska leva', () => {
    // Den andra halvan av det tvåsidiga beviset för den tröga kontrollen, och
    // hela skälet till per-fil-aggregeringen: 51 → 4 fällningar, mätt över hela
    // acceptance-sviten 2026-07-28. Batch-registreringen i beforeEach som bara
    // en delmängd av filens tester utlöser är ett IDIOM, inte en bugg.
    const doda = aggregeraDodaStallen([
      {
        fil: 'a\them.ts',
        testerSomKorde: 3,
        observationer: [obs(), obs({ anvand: true }), obs()],
      },
    ]);

    expect(doda).toHaveLength(0);
  });

  test('samma ställe i TVÅ filer bedöms var för sig', () => {
    // Nyckeln är (fil, ställe). En delad hjälpfunktion som används i fil A och
    // är död i fil B ska rapporteras för B — annars hade A tystat B.
    const observationer = [obs(), obs()];
    const doda = aggregeraDodaStallen([
      { fil: 'a\tanvand.ts', testerSomKorde: 2, observationer: [obs({ anvand: true }), obs()] },
      { fil: 'a\tdod.ts', testerSomKorde: 2, observationer },
    ]);

    expect(doda.map((d) => d.fil)).toEqual(['a\tdod.ts']);
  });

  test('ett märkt ställe rapporteras inte — ventilen bär hit', () => {
    const doda = aggregeraDodaStallen([
      { fil: 'a\them.ts', testerSomKorde: 1, observationer: [obs({ markningsSkal: SKAL })] },
    ]);

    expect(doda).toHaveLength(0);
  });

  test('ett ställe som redan fällt IVRIGT rapporteras inte en andra gång', () => {
    // Samma fynd, en gång. Utan detta hade ett felstavat mönster gett både en
    // röd test-rad och en rapport-rad om samma sak.
    const doda = aggregeraDodaStallen([
      { fil: 'a\them.ts', testerSomKorde: 1, observationer: [obs({ falldeIvrigt: true })] },
    ]);

    expect(doda).toHaveLength(0);
  });

  test('rapporten namnger ställe, mönster och täckning', () => {
    // Steg 4:s form, för den tröga halvan: läsaren ska kunna gå direkt till
    // raden, och ska få veta hur många tester som faktiskt kördes — så att en
    // delmängds-körning inte misstas för ett äkta fynd.
    const doda = aggregeraDodaStallen([
      { fil: 'acceptance\them.ts', testerSomKorde: 24, observationer: [obs()] },
    ]);
    const meddelande = byggDodaMeddelande(doda, new Map([['acceptance\them.ts', 24]]));

    expect(meddelande).toContain('tests/acceptance/exempel.acceptance.test.ts:216:18');
    expect(meddelande).toContain('GET */functions/v1/get-event');
    expect(meddelande).toContain('registrerad av 1 av 24 körda tester i filen — använd av 0');
    expect(meddelande).toContain('medvetetOanvand');
    expect(meddelande).toContain('KÖRDES BARA EN DELMÄNGD AV FILEN');
  });
});

test.describe('callFrame-avläsningen', () => {
  test('kortar mot repo-roten och behåller rad + kolumn', () => {
    // Repo-roten räknas ur filens egen plats, inte ur cwd: vakten gör detsamma,
    // och en agent-worktree ska ge samma nyckel som huvudkatalogen.
    const repoRot = path.resolve(import.meta.dirname, '..', '..');
    const plats = platsUrCallFrame(
      `    at file://${repoRot}/tests/acceptance/hem.acceptance.test.ts:216:18`,
    );

    expect(plats).toBe('tests/acceptance/hem.acceptance.test.ts:216:18');
  });

  test('degraderar mjukt när MSW inte kunde avgöra platsen', () => {
    // Typen är `callFrame?: string` — optional i msw 2.15.0. Aggregeringen
    // faller tillbaka på headern som nyckel i stället för att krascha.
    expect(platsUrCallFrame(undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. VAKTENS VERKAN I DEN SKARPA FIXTUREN
// ---------------------------------------------------------------------------

test.describe('överskuggnings-vaktens verkan i den skarpa fixturen', () => {
  test('ett felstavat mönster FÄLLER redan på use()-raden', async ({ page, network }) => {
    test.fail();

    // Exakt mätningens fall: `get-persosn` i stället för `get-persons`. Den
    // IVRIGA kontrollen fäller här, innan sidan ens laddats — stack-tracen pekar
    // på raden nedan, inte på en fixtur långt bort.
    network.use(http.get(EF('get-persosn'), () => json({ persons: [], nextCursor: null })));

    // Nås aldrig. Stod här före task-62:s ombyggnad som bevis för att testet
    // annars blivit GRÖNT på normallägets data — den tysta felklassen.
    await page.goto('/personer');
    await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();
  });

  test('rätt EF men fel METOD fäller i teardown', async ({ page, network }) => {
    test.fail();

    // Andra ivriga klassen, i den skarpa fixturen: mönstrets Edge Function finns
    // och anropas, men handlern lyssnar på POST medan appen gör GET. Fällningen
    // kan först ske vid testets slut — då vet vakten både att handlern är
    // oanvänd och att EF:en anropades.
    network.use(http.post(EF('get-persons'), () => json({ persons: [], nextCursor: null })));

    await page.goto('/personer');

    // Passerar: överskuggningen missade, normalläget svarade.
    await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();
  });

  test('ett korrekt mönster fäller INTE testet', async ({ page, network }) => {
    // Spegelbilden ovan. Samma uppställning, rättstavat mönster och rätt metod:
    // överskuggningen slår igenom, vakten tiger, och testet är grönt.
    network.use(http.get(EF('get-persons'), () => json({ persons: [], nextCursor: null })));

    await page.goto('/personer');

    // Tomlägets copy följer den PROMOVERADE formen (utan punkt, ADR-103 B2
    // steg 1) — k11 gjorde tomläget till en bärande rad + en dämpad
    // förklaring i stället för en grå metarad.
    await expect(page.getByText('Inga personer ännu')).toBeVisible();
    await expect(page.getByText('Gunilla Granqvist')).toHaveCount(0);
  });
});
