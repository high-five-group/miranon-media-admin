import { ws } from 'msw';
import { handlers } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';
import { OmockadRequestError, skapaHermetikVakt } from '../support/fixturvarld/hermetik-vakt';
import { bedomWebSocket, byggWebSocketMeddelande } from '../support/fixturvarld/websocket-vakt';

/**
 * Negativt self-test för hermetik-vakten (task-54.2).
 *
 * Vakten är fixturvärldens enda spärr mot att ett omockat anrop går ut på
 * riktiga nätet. En GRÖN svit kan aldrig bevisa att den fäller — bara ett test
 * som medvetet gör ett omockat anrop kan det. Beviset är därför tvådelat:
 *
 *   1. Vaktens BESLUT prövas direkt (meddelandets innehåll — AC 2 + 3).
 *   2. Vaktens VERKAN prövas i den skarpa fixturen (att testet faktiskt fälls
 *      — AC 1 + 4). `test.fail()` gör den röda körningen till leveransen:
 *      fäller vakten inte, rapporterar Playwright "expected to fail but
 *      passed" och grinden faller. En avstängd vakt kan alltså inte se grön ut.
 *
 * Varför det inte räcker att lita på biblioteket: bindningens
 * `onUnhandledRequest` har defaultvärdet `bypass`, INTE `warn` som i MSW:s
 * kärna. Sätts optionen inte alls är vakten avstängd — tyst — och sviten ser
 * fortsatt hermetisk ut medan den släpper igenom allt.
 */

const OMOCKAD_URL = 'https://omockad-av-vakten.example.com/api/data';
const OMOCKAD_EF_URL = 'https://visual-fixture.supabase.co/functions/v1/finns-inte-alls';

/** Kör vakten och returnerar meddelandet. Fäller den inte är testet fel. */
function fanga(url: string, init?: RequestInit): string {
  const vakt = skapaHermetikVakt(handlers);

  try {
    vakt(new Request(url, init));
  } catch (kastat) {
    expect(kastat).toBeInstanceOf(OmockadRequestError);
    return (kastat as Error).message;
  }

  throw new Error(`Vakten släppte igenom ${url} — den skulle ha fällt.`);
}

test.describe('hermetik-vaktens beslut', () => {
  test('kastar för ett omockat anrop och namnger requesten', () => {
    // AC 2: metoden OCH den fulla URL:en ska stå i klartext — utan dem måste
    // utvecklaren gissa vilket av sidans anrop som saknade handler.
    const meddelande = fanga(OMOCKAD_URL, { method: 'POST' });

    expect(meddelande).toContain('POST');
    expect(meddelande).toContain(OMOCKAD_URL);
  });

  test('listar vad som VAR mockat när anropet gällde en Edge Function', () => {
    // AC 3: listan är skillnaden mellan "jag stavade fel" och "jag glömde
    // helt". Varje registrerad handler ska synas med metod + mönster.
    //
    // URL:en är en EF sedan task-57: listan hör till EF-klassen. En främmande
    // domän får ett annat meddelande — se nedan.
    const meddelande = fanga(OMOCKAD_EF_URL);

    for (const handler of handlers) {
      expect(meddelande).toContain(handler.info.header);
    }
  });

  test('lyfter fram närmaste handler vid stavfel (task-57)', () => {
    // QA:ns steg 2-fall: `get-evnets` mot registrerade `get-events`. Med sju
    // handlers går det att ögna fram träffen; med acceptance-klassens nitton
    // filer blir listan en vägg där rätt kandidat inte syns bättre än någon
    // annan. Därför ska den lyftas ur listan, inte ingå i den.
    const meddelande = fanga('https://visual-fixture.supabase.co/functions/v1/get-evnets');

    expect(meddelande).toContain('Menade du:');
    expect(meddelande).toContain('GET */functions/v1/get-events');
  });

  test('föreslår ingen kandidat när ingen är rimligt nära (task-57)', () => {
    // Tröskeln är 0,4 × namnlängd (TypeScripts getSpellingSuggestion). Ett
    // namn utan släktskap ska ge listan UTAN gissning — ett självsäkert fel
    // förslag är sämre än inget, eftersom det leder felsökningen fel.
    const meddelande = fanga('https://visual-fixture.supabase.co/functions/v1/xyzzy-plugh-frobozz');

    expect(meddelande).not.toContain('Menade du:');
    expect(meddelande).toContain('Ingen handler matchar denna Edge Function');
  });

  test('en främmande domän får INTE EF-rådet (task-57)', () => {
    // QA:ns steg 2, symptom 2: en helt extern adress fick exakt samma
    // meddelande som en omockad Edge Function — inklusive rådet att lägga
    // till en handler. För en tredjepartstjänst är det nästan aldrig rätt
    // åtgärd, och listan över EF-mockar är brus.
    const meddelande = fanga('https://api.nagon-extern-tjanst.com/v2/track');

    expect(meddelande).toContain('utanför');
    expect(meddelande).not.toContain('tests/support/fixturvarld/handlers.ts');
    expect(meddelande).not.toContain('Menade du:');
    for (const handler of handlers) {
      expect(meddelande).not.toContain(handler.info.header);
    }
  });

  test('släpper igenom fixtur-serverns egen trafik', () => {
    const vakt = skapaHermetikVakt(handlers);

    // Appen själv serveras över localhost. Fällde vakten den vore ingen sida
    // laddningsbar — passthrough här är villkoret för att vakten är brukbar.
    expect(() => vakt(new Request('http://localhost:5299/src/main.tsx'))).not.toThrow();
    expect(() => vakt(new Request('http://127.0.0.1:5299/index.html'))).not.toThrow();
  });
});

test.describe('hermetik-vaktens verkan i den skarpa fixturen', () => {
  test('ett omockat anrop FÄLLER testet', async ({ page }) => {
    test.fail();

    await page.goto('/');
    await page.evaluate((url) => fetch(url).catch(() => undefined), OMOCKAD_URL);
    // Ingen assertion: fällningen ska komma från VAKTEN, inte härifrån.
    // Passerar testet ändå är vakten avstängd — och test.fail() gör det synligt.
  });

  test('en omockad Edge Function FÄLLER testet — catch-allen är borta', async ({ page }) => {
    test.fail();

    await page.goto('/');
    // EF-lagret hade till task-54.1 en egen catch-all som svarade 501, alltså
    // en SVAGARE spärr än allt annat nätverk. Att detta anrop fälls bevisar att
    // den är borta och att EF:er nu vaktas av samma mekanism som resten.
    // Appens faktiska headers: båda ligger utanför CORS-safelistan.
    await page.evaluate(
      (url) =>
        fetch(url, {
          headers: { Authorization: 'Bearer fixtur', 'Content-Type': 'application/json' },
        }).catch(() => undefined),
      'https://visual-fixture.supabase.co/functions/v1/finns-inte-alls',
    );
  });
});

/**
 * WebSocket-vakten (task-56).
 *
 * Fyndet var LATENT när det stängdes: appen saknar realtime-funktioner, så
 * ingen kod öppnar en WebSocket mot en främmande adress. Det gör beviset
 * viktigare, inte mindre viktigt — utan ett test som medvetet öppnar en sådan
 * uppkoppling finns ingenting som skulle märka om vakten kopplades ur, och den
 * dag appen får realtime hade luckan upptäckts genom ett test som tyst gick på
 * nätet.
 */
const OMOCKAD_WS_URL = 'wss://omockad-ws.example.com/realtime';

test.describe('websocket-vaktens beslut', () => {
  test('bedömer en otäckt adress som omockad och namnger den', () => {
    // AC 1: adressen ska stå i klartext. Ett test som faller med "något gick
    // fel" är en sämre vakt än ingen — det lär läsaren att felmeddelandet inte
    // är värt att läsa.
    expect(bedomWebSocket(new URL(OMOCKAD_WS_URL), [])).toBe('omockad');

    const meddelande = byggWebSocketMeddelande(new URL(OMOCKAD_WS_URL));
    expect(meddelande).toContain(OMOCKAD_WS_URL);
    expect(meddelande).toContain('WebSocket');
  });

  test('släpper igenom fixtur-serverns egen värd — symmetriskt med HTTP-vakten', () => {
    // AC 3. Undantaget är inte en artighet: Vites HMR-socket går mot
    // ws://localhost:<port> i VARJE visuellt test, så utan denna gren hade
    // sviten fällt på sig själv. Båda värdformerna prövas, och listan är
    // fysiskt delad med HTTP-vakten (LOKALA_VARDAR) så de inte kan drifta isär.
    expect(bedomWebSocket(new URL('ws://localhost:5299/?token=abc'), [])).toBe('lokal');
    expect(bedomWebSocket(new URL('ws://127.0.0.1:5299/'), [])).toBe('lokal');
  });

  test('håller sig undan när en annan handler täcker adressen', () => {
    // Utan detta hade vakten fällt varje framtida WS-mock — ett falskt positivt
    // som hade gjort vakten till ett hinder någon river i stället för lagar.
    const tackande = ws
      .link('wss://omockad-ws.example.com/realtime')
      .addEventListener('connection', () => undefined);

    expect(bedomWebSocket(new URL(OMOCKAD_WS_URL), [tackande])).toBe('tackt');
    // En handler för en ANNAN adress räddar den inte.
    expect(bedomWebSocket(new URL('wss://nagon-annan.example.com/ws'), [tackande])).toBe('omockad');
  });
});

test.describe('websocket-vaktens verkan i den skarpa fixturen', () => {
  test('en omockad WebSocket-uppkoppling FÄLLER testet', async ({ page }) => {
    // AC 2, den tvåsidiga formen: samma `test.fail()`-mekanik som HTTP-vaktens
    // verkans-test ovan. Kopplas vakten ur når uppkopplingen
    // route.connectToServer(), testet passerar, och Playwright rapporterar
    // "expected to fail but passed" — alltså kan en avstängd vakt inte se grön
    // ut. Att den formen fångar just detta är MÄTT: utan vakten nådde ett
    // verkligt `GET /realtime upgrade=websocket` en lyssnare utanför
    // fixturvärlden, medan testet var grönt.
    test.fail();

    await page.goto('/');
    await page.evaluate((url) => {
      new WebSocket(url);
      return new Promise((klar) => setTimeout(klar, 1500));
    }, OMOCKAD_WS_URL);
    // Ingen assertion: fällningen ska komma från VAKTEN, inte härifrån.
  });
});
