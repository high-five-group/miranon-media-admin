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
 * i `hermetic.ts`. Formen är biblioteksburen: matchning, metod-urval och
 * preflight sköts av MSW i stället för av egen kod.
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

const PREFLIGHT = {
  ...CORS,
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

/** Alla EF-namn som fixturvärlden svarar för — en enda sanningskälla. */
const EF_NAMN = [
  'get-events',
  'get-registrations',
  'get-event',
  'get-event-notes',
  'get-event-formats',
  'get-persons',
  'get-person',
] as const;

const json = (data: JsonBodyType) => HttpResponse.json(data, { headers: CORS });

export const handlers = [
  // Preflight först: Authorization/Content-Type i EF-anropen triggar OPTIONS,
  // och utan svar faller anropet innan GET-handlern nås.
  ...EF_NAMN.map((namn) =>
    http.options(EF(namn), () => new HttpResponse(null, { status: 204, headers: PREFLIGHT })),
  ),

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
   * Statuskod hellre än kastat fel: felet syns i appens egen felhantering och
   * i testets nätverkslogg, med EF-namnet i klartext. Vaktens fulla form —
   * fällning med lista över vad som VAR mockat — är task-54.2.
   */
  http.all('*/functions/v1/*', ({ request }) => {
    const namn = new URL(request.url).pathname.split('/functions/v1/')[1] ?? '(okänd)';
    return HttpResponse.json(
      { error: `Omockad EF i visual-fixturvärlden: ${namn}` },
      { status: 501, headers: CORS },
    );
  }),
];
