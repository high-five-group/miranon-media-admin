import { getResponse, http } from 'msw';
import { EF, handlers, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';
import {
  InaktuellMarkeringError,
  medvetetOanvand,
  OanvandOverskuggningError,
  skapaOverskuggningsVakt,
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
 *      vad meddelandet innehåller (AC 1 + 2 + 3).
 *   2. Vaktens VERKAN prövas i den skarpa fixturen — att ett medvetet felstavat
 *      mönster faktiskt FÄLLER testet, och att ett korrekt mönster inte gör det
 *      (AC 2). `test.fail()` gör den röda körningen till leveransen: fäller
 *      vakten inte, rapporterar Playwright "expected to fail but passed".
 *
 * En grön svit kan aldrig ensam bevisa att en vakt fäller — bara ett test som
 * medvetet utlöser den kan det.
 */

// ---------------------------------------------------------------------------
// 1. VAKTENS BESLUT
// ---------------------------------------------------------------------------

const vakt = skapaOverskuggningsVakt(handlers);

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

test.describe('överskuggnings-vaktens beslut', () => {
  test('fäller en överskuggning som aldrig matchade, och NAMNGER mönstret', () => {
    // AC 1: mönstersträngen ska stå i klartext. Utan den pekar felet mot
    // testdata och paginering — precis det som hände i mätningen som avtäckte
    // klassen (3 av 4 tester föll, inget nämnde överskuggningen).
    const oanvand = http.get(EF('get-persosn'), svar);

    let meddelande = '';
    try {
      vakt([oanvand]);
      throw new Error('Vakten tog emot en oanvänd överskuggning utan att fälla.');
    } catch (kastat) {
      expect(kastat).toBeInstanceOf(OanvandOverskuggningError);
      meddelande = (kastat as Error).message;
    }

    expect(meddelande).toContain('GET */functions/v1/get-persosn');
    expect(meddelande).toContain('aldrig matchade något anrop');
    // Rådet ska peka mot NORMALLÄGET, alltså mot varför testet såg fel data.
    expect(meddelande).toContain('tests/support/fixturvarld/handlers.ts');
  });

  test('lyfter fram närmaste normallägeshandler vid stavfel', async () => {
    // Utan förslaget måste utvecklaren jämföra två strängar tecken för tecken.
    // `get-evnets` är hermetik-vaktens eget stavfelsfall (task-57) — samma
    // maskineri, nu läst från det andra hållet.
    let meddelande = '';
    try {
      vakt([http.get(EF('get-evnets'), svar)]);
    } catch (kastat) {
      meddelande = (kastat as Error).message;
    }

    expect(meddelande).toContain('Menade du:');
    expect(meddelande).toContain('GET */functions/v1/get-events');
  });

  test('OMKASTNING ger närmaste GRANNE, inte alltid det avsedda namnet', async () => {
    // MÄTT, INTE ANTAGET, och pinnat här för att inte glömmas bort.
    //
    // Kortets egen symptom-sträng är `get-persosn` — en OMKASTNING av
    // `get-persons`. Under rent Levenshtein-avstånd kostar en omkastning TVÅ
    // (två ersättningar), medan grann-EF:en `get-person` bara ligger ETT bort
    // (en borttagning). Förslaget blir därför `get-person`, inte `get-persons`.
    // Mätt över hela normalläget: get-person 1 · get-persons 2 · övriga ≥ 6,
    // med taket floor(11 × 0,4) = 4.
    //
    // VARFÖR DET FÅR STÅ SÅ. Avståndsmåttet är LÅNAT från TypeScripts
    // `getSpellingSuggestion` (`ef-namnforslag.ts`), och det maskineriet delas
    // med hermetik-vakten. Att byta till Damerau/OSA — där en omkastning kostar
    // ett — hade gett `get-persons` här, men samtidigt ändrat den befintliga
    // vaktens beteende och gjort källhänvisningen osann. Det beslutet hör inte
    // till denna skiva.
    //
    // VARFÖR DET INTE URHOLKAR VAKTEN: förslaget är ett TIPS. Det oanvända
    // mönstret står namngivet på egen rad ovanför (AC 1), och det är den raden
    // som pekar felsökningen rätt.
    let meddelande = '';
    try {
      vakt([http.get(EF('get-persosn'), svar)]);
    } catch (kastat) {
      meddelande = (kastat as Error).message;
    }

    expect(meddelande).toContain('  GET */functions/v1/get-persosn');
    expect(meddelande).toContain('Menade du:  GET */functions/v1/get-person\n');
  });

  test('föreslår ingen kandidat när ingen är rimligt nära', async () => {
    // Tröskeln är 0,4 × namnlängd (delad med hermetik-vakten,
    // `ef-namnforslag.ts`). Ett självsäkert FEL förslag är sämre än inget.
    let meddelande = '';
    try {
      vakt([http.get(EF('xyzzy-plugh-frobozz'), svar)]);
    } catch (kastat) {
      meddelande = (kastat as Error).message;
    }

    expect(meddelande).toContain('GET */functions/v1/xyzzy-plugh-frobozz');
    expect(meddelande).not.toContain('Menade du:');
  });

  test('är TYST när mönstret matchade ett anrop', async () => {
    // Den andra halvan av det tvåsidiga beviset (AC 2). En vakt som fäller på
    // allt är lika värdelös som en som aldrig fäller.
    const anvandHandler = await anvand(http.get(EF('get-persons'), svar), PERSONS_URL);

    expect(() => vakt([anvandHandler])).not.toThrow();
  });

  test('pekar ut VILKEN av flera överskuggningar som inte matchade', async () => {
    // Med flera handlers i samma test räcker det inte att säga att något är
    // fel — listan skiljer den skyldiga från de oskyldiga.
    const anvandHandler = await anvand(http.get(EF('get-persons'), svar), PERSONS_URL);
    const oanvand = http.get(EF('get-evnets'), svar);

    let meddelande = '';
    try {
      vakt([oanvand, anvandHandler]);
    } catch (kastat) {
      meddelande = (kastat as Error).message;
    }

    expect(meddelande).toContain('✗ GET */functions/v1/get-evnets');
    expect(meddelande).toContain('✓ GET */functions/v1/get-persons');
  });

  test('släpper igenom en tom lista — ett test utan överskuggningar', () => {
    // De allra flesta tester överskuggar ingenting. Fällde vakten dem vore
    // hela fixturvärlden obrukbar.
    expect(() => vakt([])).not.toThrow();
  });
});

test.describe('opt-out: medvetetOanvand', () => {
  test('en märkt oanvänd överskuggning passerar', () => {
    // AC 3: en legitimt oanvänd överskuggning ska kunna undantas explicit.
    const markt = medvetetOanvand(
      http.get(EF('get-persons'), svar),
      'Grenen nås först efter bekräftelse-dialogen, som detta test inte öppnar.',
    );

    expect(() => vakt([markt])).not.toThrow();
  });

  test('märkningen skyddar BARA sin egen handler', () => {
    // Undantaget är per handler, inte per test — annars hade en enda märkning
    // tystat vakten för allt testet gör.
    const markt = medvetetOanvand(
      http.get(EF('get-persons'), svar),
      'Grenen nås först efter bekräftelse-dialogen, som detta test inte öppnar.',
    );
    const omarkt = http.get(EF('get-evnets'), svar);

    expect(() => vakt([markt, omarkt])).toThrow(OanvandOverskuggningError);
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
    const markt = medvetetOanvand(
      http.get(EF('get-persons'), svar),
      'Grenen nås först efter bekräftelse-dialogen, som detta test inte öppnar.',
    );
    await anvand(markt, PERSONS_URL);

    let meddelande = '';
    try {
      vakt([markt]);
      throw new Error('Vakten godtog en märkning som blivit inaktuell.');
    } catch (kastat) {
      expect(kastat).toBeInstanceOf(InaktuellMarkeringError);
      meddelande = (kastat as Error).message;
    }

    expect(meddelande).toContain('INAKTUELL');
    expect(meddelande).toContain('GET */functions/v1/get-persons');
    // Skälet ska med: läsaren ska kunna avgöra om beskrivningen någonsin stämde.
    expect(meddelande).toContain('bekräftelse-dialogen');
  });

  test('samma handler kan inte märkas två gånger', () => {
    const handler = medvetetOanvand(
      http.get(EF('get-persons'), svar),
      'Grenen nås först efter bekräftelse-dialogen, som detta test inte öppnar.',
    );

    expect(() =>
      medvetetOanvand(handler, 'Ett andra skäl som är tillräckligt långt för att passera.'),
    ).toThrow(/redan satt/);
  });
});

// ---------------------------------------------------------------------------
// 2. VAKTENS VERKAN I DEN SKARPA FIXTUREN
// ---------------------------------------------------------------------------

test.describe('överskuggnings-vaktens verkan i den skarpa fixturen', () => {
  test('ett felstavat mönster FÄLLER testet', async ({ page, network }) => {
    test.fail();

    // Exakt mätningens fall: `get-persosn` i stället för `get-persons`.
    network.use(http.get(EF('get-persosn'), () => json({ persons: [], nextCursor: null })));

    await page.goto('/personer');

    // ATT DENNA ASSERTION PASSERAR ÄR HELA POÄNGEN. Överskuggningen skulle ha
    // gett en TOM lista; i stället står fixturens normalläge kvar. Utan vakten
    // hade testet varit grönt på fel data — precis den tysta felklassen.
    await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();

    // Ingen assertion om vakten: fällningen ska komma från fixturens TEARDOWN.
    // Passerar testet ändå är vakten avstängd, och test.fail() gör det synligt.
  });

  test('ett korrekt mönster fäller INTE testet', async ({ page, network }) => {
    // Spegelbilden ovan. Samma uppställning, rättstavat mönster: överskuggningen
    // slår igenom, vakten tiger, och testet är grönt.
    network.use(http.get(EF('get-persons'), () => json({ persons: [], nextCursor: null })));

    await page.goto('/personer');

    await expect(page.getByText('Inga personer ännu.')).toBeVisible();
    await expect(page.getByText('Gunilla Granqvist')).toHaveCount(0);
  });
});
