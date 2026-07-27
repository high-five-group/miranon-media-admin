import { HttpResponse, http, type JsonBodyType } from 'msw';
import {
  EVENT_DETAIL_RESPONSE,
  EVENT_FORMATS_RESPONSE,
  EVENT_NOTES_RESPONSE,
  EVENTS_RESPONSE,
  REGISTRATIONS_RESPONSE,
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
 */

/** Host-agnostiskt: appen kan peka på vilken fixtur-origin som helst. */
const EF = (namn: string) => `*/functions/v1/${namn}`;

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

const json = (data: JsonBodyType) => HttpResponse.json(data, { headers: CORS });

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

  // Personer: båda är resolvers. Listan speglar EF:ens search/pageSize/cursor
  // (annars vore sök och "Ladda fler" osynliga), detaljen slår upp `?id=` mot
  // de kuraterade personerna med härledd stomme som fallback.
  // Se fixture-data.ts § Personer-världen.
  http.get(EF('get-persons'), ({ request }) => json(resolvePersonsResponse(new URL(request.url)))),
  http.get(EF('get-person'), ({ request }) => json(resolvePersonResponse(new URL(request.url)))),

  /**
   * SIST: catch-all för omockade Edge Functions (Ghost-mönstret, ADR-080 § 4).
   *
   * MSW matchar handlers i ordning, så denna fångar allt de specifika missade.
   * Utan den vore en omockad EF en TYST NÄTVERKSLÄCKA: bindningens
   * `onUnhandledRequest` har defaultvärdet `bypass` — inte `warn` som i MSW:s
   * kärna — och hermetik-vakten släpper igenom `/functions/v1/`-mönstret för
   * att MSW ska nå det alls. Den gamla uppslagstabellen svarade 501 här, och
   * det skyddet får inte försvinna i bytet.
   *
   * Statuskod hellre än kastat fel: 501:an når appens egen felhantering med
   * EF-namnet i klartext — verifierat skarpt, inte antaget, i
   * `omockad-ef.spec.ts` med appens faktiska request-headers. Vaktens fulla
   * form — fällning med lista över vad som VAR mockat — är task-54.2.
   */
  http.all('*/functions/v1/*', ({ request }) => {
    const namn = new URL(request.url).pathname.split('/functions/v1/')[1] ?? '(okänd)';
    return HttpResponse.json(
      { error: `Omockad EF i visual-fixturvärlden: ${namn}` },
      { status: 501, headers: CORS },
    );
  }),
];
