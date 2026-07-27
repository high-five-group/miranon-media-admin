import { handlers } from './support/handlers';
import { expect, test } from './support/hermetic';
import { OmockadRequestError, skapaHermetikVakt } from './support/hermetik-vakt';

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

test.describe('hermetik-vaktens beslut', () => {
  test('kastar för ett omockat anrop och namnger requesten', () => {
    const vakt = skapaHermetikVakt(handlers);

    let fel: unknown;
    try {
      vakt(new Request(OMOCKAD_URL, { method: 'POST' }));
    } catch (kastat) {
      fel = kastat;
    }

    expect(fel).toBeInstanceOf(OmockadRequestError);
    // AC 2: metoden OCH den fulla URL:en ska stå i klartext — utan dem måste
    // utvecklaren gissa vilket av sidans anrop som saknade handler.
    expect((fel as Error).message).toContain('POST');
    expect((fel as Error).message).toContain(OMOCKAD_URL);
  });

  test('listar vad som VAR mockat', () => {
    const vakt = skapaHermetikVakt(handlers);

    let fel: unknown;
    try {
      vakt(new Request(OMOCKAD_URL));
    } catch (kastat) {
      fel = kastat;
    }

    // AC 3: listan är skillnaden mellan "jag stavade fel" och "jag glömde
    // helt". Varje registrerad handler ska synas med metod + mönster.
    const meddelande = (fel as Error).message;
    for (const handler of handlers) {
      expect(meddelande).toContain(handler.info.header);
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
