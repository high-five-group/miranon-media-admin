import { HttpResponse, http, type JsonBodyType } from 'msw';
import {
  EVENT_ATTACHMENTS_RESPONSE,
  EVENT_DETAIL_RESPONSE,
  EVENT_FORMATS_RESPONSE,
  EVENT_NOTES_RESPONSE,
  EVENTS_RESPONSE,
  REGISTRATIONS_RESPONSE,
  resolvePersonNotesResponse,
  resolvePersonResponse,
  resolvePersonsResponse,
} from './fixture-data';

/**
 * MSW-handlers för fixturvärldens Edge Function-svar (task-54.1).
 *
 * Ersätter den handskrivna uppslagstabell + route-hanterare som tidigare bodde
 * i `hermetic.ts`. Formen är biblioteksburen: request-matchning och metod-urval
 * sköts av MSW i stället för av egen uppslagslogik.
 *
 * KONTRAKTET (ADR-080 § Snittet går vid protokollet): handlers uttrycks mot
 * EF-gränssnittet — path under `/functions/v1/` och svar i EF:ens egen form —
 * ALDRIG mot Airtables svarsform. Samma zod-scheman parsar dessa svar som
 * parsar skarpa svar; det är den fogen som gör att fixturvärlden bevisar något
 * om appen. Snittet är också portabilitets-snittet: byts datakällan behåller
 * dessa handlers sin form, eftersom EF-kontraktet är det som överlever.
 *
 * DESSA HANDLERS ÄR NORMALLÄGET, INTE HELA SANNINGEN. Ett enskilt test som
 * behöver ett annat svar — felvy, tom lista, långsamt svar — lägger INTE till
 * något här, utan överskuggar lokalt med `network.use(...)`. Mönstret,
 * isoleringen och fällan som får en överskuggning att tyst göra ingenting är
 * dokumenterade i `hermetic.ts` § Överskugga en delad handler (task-58).
 * Lägg bara till här när svaret ska gälla ALLA tester.
 */

/**
 * Host-agnostiskt: appen kan peka på vilken fixtur-origin som helst.
 *
 * EXPORTERAD SEDAN task-59.3, och det är en anti-drift-åtgärd. Ett test som
 * överskuggar en handler med `network.use()` måste träffa EXAKT det mönster
 * den delade handlern matchar — annars faller anropet igenom till normalläget
 * utan att något fälls (den tysta felklassen, se `hermetic.ts` § Överskugga en
 * delad handler). Skriver överskuggningen `EF('get-events')` i stället för en
 * egen sträng kan mönstret per konstruktion inte drifta ifrån originalet.
 */
export const EF = (namn: string) => `*/functions/v1/${namn}`;

/**
 * Cross-origin-svar kräver explicit CORS-huvud. MSW sätter det inte åt oss —
 * biblioteket avlyssnar, det simulerar inte en server-policy.
 */
const CORS = { 'access-control-allow-origin': '*' };

/**
 * INGEN PREFLIGHT-HANTERING — och det är avsiktligt, inte en glömska.
 *
 * Appens EF-anrop bär `Authorization` + `Content-Type: application/json`, vilka
 * båda ligger utanför CORS-safelistan och i en riktig webbläsarmiljö skulle
 * tvinga fram en `OPTIONS`-preflight. I fixturvärlden sker den ALDRIG:
 * route-interception ligger före webbläsarens CORS-logik, så requesten
 * uppfylls innan någon preflight hinner uppstå.
 *
 * MÄTT, INTE ANTAGET (task-54.1, 2026-07-27): en `page.on('request')`-logg över
 * både en omockad EF och en full vy-laddning visade enbart `GET` — noll
 * `OPTIONS`. Den gamla uppslagstabellen bar ett `OPTIONS`-block med samma
 * antagande; det var död kod och porterades inledningsvis hit innan mätningen
 * gjordes. Återinför det inte utan att först mäta att preflight faktiskt sker.
 */

/**
 * EF-svar med CORS-huvudet på. EXPORTERAD SEDAN task-59.3 av samma skäl som
 * `EF`: en överskuggning som bygger sitt svar för hand glömmer förr eller
 * senare huvudet, och utan det blockerar webbläsaren svaret — vilket i vyn ser
 * ut som ett trasigt EF, inte som ett trasigt test.
 */
export const json = (data: JsonBodyType, status = 200) =>
  HttpResponse.json(data, { status, headers: CORS });

export const handlers = [
  http.get(EF('get-events'), () => json(EVENTS_RESPONSE)),

  // Speglar EF:ens eventId-filter — utan det vore filtrerade vyer osynliga i
  // fixturvärlden.
  http.get(EF('get-registrations'), ({ request }) => {
    const eventId = new URL(request.url).searchParams.get('eventId');
    if (!eventId) return json(REGISTRATIONS_RESPONSE);
    return json({
      registrations: REGISTRATIONS_RESPONSE.registrations.filter((r) => r.eventId === eventId),
    });
  }),

  http.get(EF('get-event'), () => json(EVENT_DETAIL_RESPONSE)),
  http.get(EF('get-event-notes'), () => json(EVENT_NOTES_RESPONSE)),
  http.get(EF('get-event-formats'), () => json(EVENT_FORMATS_RESPONSE)),
  http.get(EF('get-event-attachments'), () => json(EVENT_ATTACHMENTS_RESPONSE)),

  // Personer: båda är resolvers. Listan speglar EF:ens search/pageSize/cursor
  // (annars vore sök och "Ladda fler" osynliga), detaljen slår upp `?id=` mot
  // de kuraterade personerna med härledd stomme som fallback.
  // Se fixture-data.ts § Personer-världen.
  http.get(EF('get-persons'), ({ request }) => json(resolvePersonsResponse(new URL(request.url)))),
  http.get(EF('get-person'), ({ request }) => json(resolvePersonResponse(new URL(request.url)))),
  // Persondetaljens anteckningsblock (B7) anropar denna ovillkorligt — utan
  // handlern fäller hermetik-vakten hela vyn (mätt S103 2026-08-12, grindens
  // första körning). Se fixture-data.ts § PERSON_NOTES_RESPONSE.
  http.get(EF('get-person-notes'), ({ request }) =>
    json(resolvePersonNotesResponse(new URL(request.url))),
  ),

  // Aktivitetsloggens skrivväg (TASK-201.3, ADR-110/ADR-111) — HÄR, i
  // normalläget, INTE per test. `recordActivity` fire-and-forget:ar EFTER
  // varenda instrumenterad mutation (markera betalning, bekräfta anmälan,
  // mail-åtgärd, och fler i TASK-201.4), så anropet är EXAKT lika mycket en
  // del av normalläget som `get-events`/`get-registrations` — ett svar
  // varje test i klassen behöver utan att säga något, inte ett svar en
  // enskild test-scenario äger. Skulle mocken bott per test hade varenda
  // svit som rör en instrumenterad mutation behövt upprepa den (OMOCKAD-
  // anropet är annars deterministiskt, inte flakigt — se hermetik-vaktens
  // egen `OmockadRequestError`).
  //
  // Svaret speglar EXAKT `log-activity`-EF:ens kontrakt vid framgång
  // (`supabase/functions/log-activity/index.ts`, `RecordActivityResultSchema`
  // i `src/domain/schemas/ActivityStatement.schema.ts`): `{id, requestId,
  // occurredAt}`, ekar tillbaka det klienten skickade — samma form som
  // `tests/e2e/atgarder-betalningar.staging.test.ts` § `mocka()` redan
  // etablerar för samma EF, i en annan testklass.
  http.post(EF('log-activity'), async ({ request }) => {
    const body = (await request.json()) as {
      id: string;
      timestamp: string;
      context: { extensions: Record<string, string> };
    };
    return json(
      {
        id: body.id,
        requestId: Object.values(body.context.extensions)[0],
        occurredAt: body.timestamp,
      },
      201,
    );
  }),
];

/**
 * INGEN CATCH-ALL-HANDLER — borttagen i task-54.2, och frånvaron är avsiktlig.
 *
 * Task-54.1 lade en `http.all` sist som svarade 501 på omockade Edge
 * Functions. Den var rätt då: `onUnhandledRequest` var ännu inte satt, och
 * bindningens default är tyst genomsläpp, så utan catch-allen hade en glömd
 * handler blivit en nätverksläcka.
 *
 * Nu bär `onUnhandledRequest` vakten (se `hermetik-vakt.ts`), och då blir
 * catch-allen aktivt skadlig: den MATCHAR, vilket betyder att anropet räknas
 * som hanterat och vakten aldrig får se det. EF-lagret hade därmed fått en
 * svagare spärr (ett 501-svar appen renderar en felvy för) än allt annat
 * nätverk (en fällning som namnger requesten). Två parallella mekanismer med
 * olika stränghet — precis vad task-54.2 finns för att ta bort.
 */
