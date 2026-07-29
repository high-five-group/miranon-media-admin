import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNetworkFixture, type NetworkFixture } from '@msw/playwright';
import { test as base, type Request as PlaywrightRequest } from '@playwright/test';
import type { AnyHandler } from 'msw';
import { efNamn } from './ef-namnforslag';
import { FROZEN_NOW } from './fixture-data';
import { handlers } from './handlers';
import { skapaHermetikVakt } from './hermetik-vakt';
import {
  ANNOTATION_TYP,
  type EfAnrop,
  granskaRegistrering,
  granskaTest,
} from './overskuggnings-vakt';

export { expect } from '@playwright/test';

/**
 * Hermetisk test-ram för fixturvärlden (task-36.7).
 *
 * HEMVISTEN ÄR KLASSDELAD, INTE VISUAL-ÄGD (task-59.1). Modulen bodde till och
 * med task-58 under `tests/visual/support/`, vilket lästes som att fixturvärlden
 * tillhörde den visuella sviten. Den gör den inte: acceptance-klassen
 * (ADR-080) hänger på SAMMA fixturvärld, och två parallella världar vore emot
 * både MSW:s och Playwrights uttalade designavsikt — en enda sanning om
 * nätverket, återanvänd tvärs testklasser. Flytten hit var därför ren: noll
 * beteendeändring, noll baseline-avvikelse.
 *
 * Varje test i ramen kör i en förseglad värld: frusen klocka (AC 5), seedad
 * session (autentiserade vyer utan staging-login), pinnade typsnitt och
 * mockade EF-svar. ALLT nätverk utanför localhost blockeras — hermetiken är
 * inte en konvention utan en vakt: ett anrop som slinker förbi mockarna FÄLLER
 * testet med sin egen URL namngiven, i stället för att tyst göra pixlarna
 * miljöberoende. Vakten bor i `hermetik-vakt.ts` (task-54.2).
 */

// supabase-js härleder lagringsnyckeln `sb-${hostname.split('.')[0]}-auth-token`
// — verifierad mot @supabase/supabase-js dist (defaultStorageKey, v2.110).
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';

/**
 * Fixtur-sessionens e-postadress. EXPORTERAD SEDAN task-59.3: acceptance-
 * klassens Hem-test asserterar att appen ALDRIG faller tillbaka på e-posten som
 * hälsning (Gunilla-principen), och den assertionen måste läsa adressen ur
 * samma källa som sessionen byggs av — en handskriven litteral i testet hade
 * kunnat drifta ifrån sessionen och tyst sluta bevisa något.
 */
export const FIXTUR_EPOST = 'lotta@visual-fixture.se';

const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');

// CORS-huvud för de mockade cross-origin-typsnitten. EF-svarens CORS bor hos
// handlers-modulen sedan task-54.1.
const CORS_HEADERS = { 'access-control-allow-origin': '*' };

/** Base64url utan padding — JWT-segmentens form. */
function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/**
 * Fabricerad session i supabase-js lagrings-form. `getSession()` läser
 * localStorage utan server-validering (AuthProvider-kontraktet, K3) — en
 * syntaktiskt giltig JWT med utgång långt efter FROZEN_NOW ger inloggat läge
 * utan nätverk: ingen refresh hinner schemaläggas inom testets livstid.
 */
function buildSession() {
  const expiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60;
  const user = {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: FIXTUR_EPOST,
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { display_name: 'Lotta' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: expiresAt }),
    'visual-fixture-signatur',
  ].join('.');
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'visual-fixture-refresh',
    user,
  };
}

/**
 * EF-lagret bärs av MSW sedan task-54.1 — handlers bor i `handlers.ts`.
 * Hermetiken vaktas av MSW:s `onUnhandledRequest` sedan task-54.2.
 *
 * Registreringen sker på CONTEXT-nivå (bibliotekets design: en enda
 * `context.route` under huven, ingen service worker inblandad). Page-routes
 * vinner över context-routes, vilket är precis vad typsnitts-pinningen nedan
 * utnyttjar — den ligger kvar på sid-nivå och når därför MSW aldrig.
 *
 * BÅDA OPTIONERNA ÄR SATTA EXPLICIT, OCH BÅDA MÅSTE VARA DET:
 *
 * `onUnhandledRequest` — bindningens default är `bypass` (tyst genomsläpp),
 * INTE `warn` som i MSW:s kärna. Utelämnas optionen är vakten avstängd utan
 * att något syns: sviten ser hermetisk ut medan den släpper igenom allt.
 * `hermetik-vakt.spec.ts` bevisar fällningen negativt — en avstängd vakt kan
 * inte se grön ut.
 *
 * `skipAssetRequests: false` — VILLKORET FÖR ATT VAKTEN SER ALLT. Bindningen
 * kortsluter tillgångs-formade anrop med `route.fallback()` FÖRE
 * `handleRequest` (`@msw/playwright` fixture.ts rad 98–103), alltså före
 * callbacken. Med defaultvärdet `true` skulle varje URL som slutar på .png,
 * .json, .css … gå rakt ut på nätet utan att vakten någonsin såg den. Mätt,
 * ej antaget: en probe med `.txt`-URL nådde aldrig callbacken och gick ut.
 *
 * Kostnaden mättes i stället för att ärvas från issue #13:s 3x-varning —
 * sviten gick 17,3 s med defaultvärdet och 14,9 s utan det, alltså ingen
 * mätbar kostnad i vår uppställning. Varningen gäller Vite-projekt med
 * betydligt fler moduler än fixturvärlden laddar.
 *
 * Sid-vakten som tidigare bar hermetiken (en `page.route('**' + '/*')` som
 * abort:ade allt utom localhost och EF-pathen) är BORTTAGEN i task-54.2:
 * hermetiken vaktas nu av EN mekanism, och den sitter där mockningen sker.
 *
 * ── ÖVERSKUGGA EN DELAD HANDLER I ETT ENSKILT TEST (task-58) ──────────────
 *
 * `handlers.ts` bär fixturvärldens NORMALLÄGE — svaren varje test får om det
 * inte säger något annat. Behöver ETT test ett annat svar (felvyn, tom lista,
 * långsamt svar) skrivs INGEN egen fixturvärld: testet överskuggar lokalt via
 * `network`-fixturen, som destruktureras ur testargumenten precis som `page`.
 *
 *     import { HttpResponse, http } from 'msw';
 *     import { expect, test } from '../support/fixturvarld/hermetic';
 *
 *     test('visar felvyn när eventlistan fallerar', async ({ page, network }) => {
 *       network.use(
 *         http.get('*' + '/functions/v1/get-events', () =>
 *           HttpResponse.json({ error: 'trasig' }, { status: 500 }),
 *         ),
 *       );
 *
 *       await page.goto('/event');
 *       await expect(page.getByRole('alert')).toBeVisible();
 *     });
 *
 * ÖVERSKUGGNINGEN GÄLLER ENDAST DET EGNA TESTET, och isoleringen är
 * STRUKTURELL — inget städsteg krävs och inget får glömmas. `network` är en
 * test-scopad Playwright-fixtur (default-scope; `{ auto: true }` styr bara att
 * den startar av sig själv). `defineNetworkFixture` körs alltså om för VARJE
 * test och bygger en ny handlers-controller ur den delade `handlers`-arrayen.
 * Nästa test ser aldrig föregående tests `use()`. Teardownens
 * `network.disable()` river context-routarna; den är inte det som ger
 * isoleringen.
 *
 * PRECEDENSEN: `use()` lägger sina handlers FÖRST
 * (`msw/lib/core/experimental/handlers-controller.js` rad 82:
 * `[...overridesForKind, ...existingForKind]`), och första träffen vinner.
 * Överskuggningen slår därför alltid den delade handlern — inte tvärtom.
 *
 * OBS ATT MÖNSTRET ÄR HOST-AGNOSTISKT och skrivs `'*' + '/functions/v1/…'` —
 * strängen är delad för att en `*` följd av snedstreck skulle STÄNGA denna
 * blockkommentar. Samma idiom bär `page.route('**' + '/*')` nedan. I en
 * riktig testfil skrivs mönstret förstås i ett stycke.
 *
 * FÄLLAN ÄR MEKANISERAD SEDAN task-62 — men känn den ändå: matchar
 * överskuggningens mönster inte det faktiska anropet (stavfel i pathen, glömt
 * värd-jokern) fäller INGEN av mockarna. Handlern läggs först men matchar
 * aldrig, anropet faller igenom till den delade handlern, och testet ser
 * normalläget i stället för sitt specialfall. Hermetik-vakten kan inte se detta
 * — anropet ÄR mockat, bara inte av den handler testet trodde.
 *
 * Det ser numera `overskuggnings-vakt.ts` i TVÅ steg: en IVRIG kontroll som
 * fäller redan på `use()`-raden när mönstrets Edge Function inte finns, och en
 * TRÖG som samlar hela körningen och rapporterar deklarationsställen ingen
 * använde (`overskuggnings-rapport.ts`). Ett överskuggat test som beter sig
 * precis som utan överskuggning behöver alltså inte längre MISSTÄNKAS för det —
 * det får besked. Är överskuggningen legitimt oanvänd — en negativ sensor som
 * bevisar att ett anrop ALDRIG sker — märks den med
 * `medvetetOanvand(handler, skäl)` ur samma modul.
 *
 * Signaturen är `use(...runtimeHandlers)` — flera handlers kan skickas i ett
 * anrop, och arrayer måste spridas.
 */
/**
 * SJÄLVTESTLÄGET — `HERMETIK_SJALVTEST=1` (task-60, tråd `T104`).
 *
 * Fram till och med task-59.4 bevisades hermetiken för hand: neutralisera
 * testets egna `network.use()`-överskuggningar, töm normalläget, kör, läs
 * utfallet, återställ ur en scratchpad-kopia. Tre skivor i rad gjorde det, och
 * **beviset fanns bara i agentens rapporttext** — inget i repot kunde köra om
 * det. Flaggan gör den rutinen till en körbar regim.
 *
 * BÅDA LEDEN KRÄVS, och det är inte en dubblering. Att bara tömma normalläget
 * räcker inte: en fil som överskuggar allt den behöver (`persons-list` gör det
 * avsiktligt, för att assertera exakta sidstorlekar) hade fortsatt få sina svar
 * ur sina egna handlers och passerat. Att bara neutralisera överskuggningarna
 * räcker heller inte: de flesta tester faller då tillbaka på normalläget. Först
 * med båda leden når anropen fram till vakten.
 *
 * VAKTEN BEHÅLLER DEN RIKTIGA LISTAN. `skapaHermetikVakt(handlers)` matas med
 * det verkliga normalläget även i självtestläge — annars hade felmeddelandets
 * "Mockat här (7)" krympt till noll och `task-57`:s stavfelsförslag tystnat,
 * alltså hade beviset körts mot ett meddelande ingen någonsin ser skarpt.
 *
 * Regimen ändrar INTE typsnitts-pinningen: den ligger på `page.route`-nivå och
 * prövas före MSW. Det är avsiktligt — annars hade varje test fällt på ett
 * typsnitt i stället för på sin Edge Function, och beviset pekat åt fel håll.
 */
const SJALVTEST = process.env.HERMETIK_SJALVTEST === '1';

/**
 * Vy över fixturen där `use()` är verkningslös. Proxy, inte spread eller
 * `Object.create`: `NetworkFixture` är en klassinstans (`SetupPlaywrightApi
 * extends SetupApi`) vars metoder bor på prototypen och läser privata fält —
 * en kopia hade tappat metoderna, och en prototypkedja hade bundit `this` till
 * fel objekt. Metoderna binds därför uttryckligen till målet.
 */
function utanOverskuggningar(network: NetworkFixture): NetworkFixture {
  return new Proxy(network, {
    get(mal, egenskap) {
      if (egenskap === 'use') return () => undefined;
      const varde = Reflect.get(mal, egenskap);
      return typeof varde === 'function' ? varde.bind(mal) : varde;
    },
  });
}

/**
 * Vy över fixturen där varje `use()` först passerar den IVRIGA vakten. Samma
 * Proxy-teknik och samma skäl som `utanOverskuggningar` ovan.
 *
 * VARFÖR VID `use()` OCH INTE VID TEARDOWN: att mönstrets Edge Function inte
 * finns är sant oberoende av vad testet sedan gör. Fällningen kan därför ske på
 * den tidigast möjliga punkten, och då pekar stack-tracen rakt på
 * `network.use()`-raden i testfilen i stället för på en fixtur långt bort. Det
 * är Mockitos `PotentialStubbingProblem`-position: fäll mitt i testet, på ett
 * bevis som redan finns.
 */
function medIvrigVakt(network: NetworkFixture): NetworkFixture {
  return new Proxy(network, {
    get(mal, egenskap) {
      if (egenskap === 'use') {
        return (...overskuggningar: Parameters<NetworkFixture['use']>) => {
          granskaRegistrering(overskuggningar);
          mal.use(...overskuggningar);
        };
      }
      const varde = Reflect.get(mal, egenskap);
      return typeof varde === 'function' ? varde.bind(mal) : varde;
    },
  });
}

/**
 * ÖVERSKUGGNINGS-VAKTEN INTEGRERAS I TVÅ PUNKTER (task-62), och valen nedan är
 * medvetna:
 *
 * URVALET GÖRS PÅ OBJEKT-IDENTITET, inte på position i listan. `listHandlers()`
 * ger `[...överskuggningar, ...normalläge]` (`handlers-controller.js` rad 82),
 * men att lita på ordningen hade bundit vakten till en intern implementationsdetalj.
 * Identitets-jämförelsen mot den normallägeslista fixturen SJÄLV matades med kan
 * inte drifta. Den är dessutom det enda korrekta urvalet: `handlers.ts`
 * exporterar modul-nivå-OBJEKT som delas av alla tester i samma worker, så deras
 * `isUsed` ackumuleras tvärs tester och säger ingenting om DETTA test.
 *
 * DEN FÄLLER ÄVEN NÄR TESTET REDAN ÄR RÖTT. Frestelsen är att tiga vid ett
 * misslyckat test för att slippa ett andra fel, men det hade tagit bort exakt
 * den signal kortet finns för: i mätningen som avtäckte klassen föll 3 av 4
 * tester med meddelanden som pekade mot testdata och paginering — mot fel
 * ställe. Det fjärde blev grönt på fel data. Tystnad vid rött hade fångat ett av
 * fyra. Playwright visar båda felen, så inget går förlorat.
 *
 * DEN ÄR EN NO-OP I SJÄLVTESTLÄGET, utan att villkoras på flaggan. Där är både
 * normalläget tömt och `use()` verkningslös, så `listHandlers()` ger tom lista
 * och det finns ingen överskuggning att bedöma. En explicit `if (SJALVTEST)`
 * hade varit en andra sanning om samma sak.
 *
 * ── ANROPEN RÄKNAS AV PLAYWRIGHT, INTE AV MSW ────────────────────────────
 *
 * Den ivriga kontrollen behöver veta vilka Edge Functions testet FAKTISKT
 * anropade. MSW:s livscykelhändelse `request:match` vore den naturliga källan
 * och finns på fixturen via `network.events` — men den är OANVÄNDBAR i den
 * installerade kombinationen, och det är mätt, inte antaget:
 *
 *   `SetupApi.emitter` är en `rettime`-Emitter (0.11.11) vars `emit(event)`
 *   läser `event.type` på ETT argument, medan `msw`s `handleRequest` (2.15.0)
 *   anropar den i den äldre formen `emit('request:start', { … })` med två.
 *   Så länge emittern saknar lyssnare kortsluter `emit` på
 *   `#listeners.size === 0` och inget märks. Registreras EN lyssnare — vilken
 *   som helst, på vilken händelse som helst — kastar hela request-hanteringen
 *   `TypeError: Cannot create property 'stopPropagation' on string
 *   'request:start'`. Verifierat med en isolerad probe mot just `handleRequest`,
 *   den kodväg `@msw/playwright` 0.6.7 använder (`build/index.mjs` rad 48):
 *   ingen lyssnare → 200, en lyssnare → kast, oavsett händelsenamn.
 *
 * Typen `LifeCycleEventsMap` är dessutom `@deprecated` i 2.15.0 med hänvisning
 * till `HttpNetworkFrameEventMap`, vars efterföljare bor under
 * `msw/lib/core/experimental/` och INTE exponeras genom `@msw/playwright`
 * (`NetworkFixture` typas mot `Omit<SetupApi<LifeCycleEventsMap>, 'dispose'>`).
 * Båda formerna bär bara `{ request, requestId }` — ingen handler-koppling — så
 * kopplingen anrop→handler hade fått räknas av oss ändå.
 *
 * Källan är därför Playwrights egen context-händelse. Den ser varje request
 * webbläsaren gör, inklusive dem `@msw/playwright` fångar med `context.route`,
 * den är inte deprecerad, och den kan inte gå sönder av att MSW byter
 * emitter-bibliotek. Samma mekanism som `handlers.ts`
 * § "INGEN PREFLIGHT-HANTERING" en gång mätte preflight-frånvaron med.
 *
 * ── MEN DET MÅSTE VARA `requestfinished`, INTE `request` (TASK-74) ────────
 *
 * Vaktens bedömning ställer TVÅ observatörer mot varandra, och de mäter vid
 * olika tidpunkter: Playwrights `request` fyrar när webbläsaren SKICKAR
 * anropet, medan MSW sätter `handler.isUsed` när handlern KÖRS. Ett anrop som
 * fortfarande är i flykten när testkroppen tar slut har därför räknats av den
 * ena men inte av den andra — och `granskaTest`, som kör i teardown direkt
 * efter `await use(...)`, läser då ett falskt "EF:en anropades men
 * överskuggningen matchade inte".
 *
 * MÄTT, EJ ANTAGET: TASK-74:s baslinje (10 fulla körningar, `--workers=8`,
 * `--retries=0`) fällde `event-ny-anmalan.acceptance.test.ts:734` på exakt den
 * formen i 2 av 10 körningar. Testets SISTA handling väljer ett event, vilket
 * utlöser `get-event`; formuläret renderas ur routen, så assertionerna passerar
 * medan svaret ännu är i flykten. Fönstret vidgas med maskinlast — alltså
 * samma last-känsliga symptomklass som resten av klass B, men en annan orsak.
 *
 * `requestfinished` stänger racet MED BEVIS, inte med en förhoppning:
 * `msw/lib/core/handlers/RequestHandler.js:149` sätter `isUsed = true` FÖRE
 * resolvern körs, och svaret kan per konstruktion inte levereras förrän
 * resolvern returnerat. Ett AVSLUTAT anrop implicerar därmed `isUsed === true`.
 *
 * PRISET, ÖPPET REDOVISAT: ett AVBRUTET anrop räknas inte längre. Vore just det
 * anropets överskuggning felskriven fälls den inte av det anropet. Det är rätt
 * avvägning — ett avbrutet anrop bevisar inte att överskuggningen BORDE ha
 * matchat — men det är en verklig känslighetsförlust, inte en gratis skärpning.
 * `granskaTest` självt är orört; enhetsspecen `tests/visual/
 * overskuggnings-vakt.spec.ts` matar den syntetiska anrops-listor och bevakar
 * fortfarande bedömningen, inte händelsevalet.
 */
export const test = base.extend<{ network: NetworkFixture }>({
  network: [
    async ({ context }, use, testInfo) => {
      const network = defineNetworkFixture({
        context,
        handlers: SJALVTEST ? [] : handlers,
        skipAssetRequests: false,
        onUnhandledRequest: skapaHermetikVakt(handlers),
      });
      await network.enable();

      const normallage = new Set<AnyHandler>(network.listHandlers());

      const anrop: EfAnrop[] = [];
      const rakna = (request: PlaywrightRequest) => {
        const url = new URL(request.url());
        const namn = efNamn(url.pathname);
        if (namn !== undefined) {
          anrop.push({ metod: request.method(), namn, url: `${url.origin}${url.pathname}` });
        }
      };
      context.on('requestfinished', rakna);

      try {
        await use(SJALVTEST ? utanOverskuggningar(network) : medIvrigVakt(network));

        const { observationer, fel } = granskaTest({
          overskuggningar: network.listHandlers().filter((handler) => !normallage.has(handler)),
          anrop,
        });

        // BOKFÖR FÖRE FÄLLNING. Annoteringen är den tröga kontrollens enda
        // underlag; kastar vi först försvinner testets ÖVRIGA observationer och
        // ett fullt levande deklarationsställe kan se dött ut i rapporten.
        if (observationer.length > 0) {
          testInfo.annotations.push({
            type: ANNOTATION_TYP,
            description: JSON.stringify(observationer),
          });
        }
        if (fel !== undefined) throw fel;
      } finally {
        context.off('requestfinished', rakna);
        // Context-routarna rivs även när vakten fäller — annars hade en
        // fällning läckt en route in i nästa test i samma context.
        await network.disable();
      }
    },
    { auto: true },
  ],

  // `network` deklareras som beroende — utan det är aktiveringsordningen
  // odefinierad och sidan kan hinna göra sitt första anrop innan handlers står.
  page: async ({ page, network: _network }, use) => {
    // Frusen klocka (AC 5): Date/new Date() fixeras vid FROZEN_NOW; timers
    // löper vidare så React/TanStack beter sig normalt.
    await page.clock.setFixedTime(FROZEN_NOW);

    // Sessionen seedas FÖRE app-JS via init-script — appen vaknar inloggad.
    await page.addInitScript(
      ([key, session]) => {
        window.localStorage.setItem(key as string, JSON.stringify(session));
      },
      [AUTH_STORAGE_KEY, buildSession()] as const,
    );

    // Typsnitts-pinning: base.css @import:ar Inter från Google Fonts — CDN:en
    // är både ett externt beroende och en drift-källa (ny font-version = nya
    // pixlar). CSS + woff2 (v20) är incheckade i assets/ och servas härifrån;
    // uppgraderas medvetet via kadens-regeln (AC 9), aldrig tyst av CDN:en.
    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({
        headers: CORS_HEADERS,
        contentType: 'text/css',
        body: readFileSync(path.join(ASSETS_DIR, 'inter.css'), 'utf8'),
      }),
    );
    await page.route('https://fonts.gstatic.com/**', (route) => {
      const filnamn = path.basename(new URL(route.request().url()).pathname);
      return route.fulfill({
        headers: CORS_HEADERS,
        contentType: 'font/woff2',
        body: readFileSync(path.join(ASSETS_DIR, filnamn)),
      });
    });

    // EF-lagret ligger hos MSW (se `network`-fixturen ovan) — ingen
    // route-registrering behövs här.

    await use(page);
  },
});
