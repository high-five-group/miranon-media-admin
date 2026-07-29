import { type AnyHandler, WebSocketHandler, ws } from 'msw';
import { LOKALA_VARDAR } from './hermetik-vakt';

/**
 * WebSocket-vakten för fixturvärlden (task-56).
 *
 * HERMETIKENS SISTA ÖPPNA VÄG. `hermetik-vakt.ts` vaktar allt HTTP-nätverk via
 * MSW:s `onUnhandledRequest`. WebSocket-trafik går INTE genom den vägen, och
 * den gamla sid-vakten såg den heller aldrig — `page.route` fångar inte
 * WebSocket. Luckan är alltså lika gammal som fixturvärlden själv.
 *
 * VAD BINDNINGEN GÖR UTAN DENNA MODUL. `@msw/playwright` registrerar en
 * match-all `context.routeWebSocket`, och när INGEN WebSocket-handler är
 * registrerad kopplar den uppkopplingen vidare till den riktiga adressen:
 *
 *     if (allWebSocketHandlers.length === 0) {
 *       route.connectToServer()      // ← ut på riktiga nätet, tyst
 *       return
 *     }
 *
 * (`@msw/playwright` 0.6.7 — `src/fixture.ts` rad 163–166, och i den kod som
 * faktiskt körs, `build/index.mjs` rad 68–71.)
 *
 * MÄTT, EJ ANTAGET. En lyssnare på IPv6-loopback — utanför localhost-undantaget
 * — fick ett verkligt `GET /realtime upgrade=websocket` från en sida i den
 * hermetiska sviten, medan testet passerade grönt. Med en WebSocket-handler
 * registrerad nådde inget upgrade-försök fram. Läckan var alltså inte en
 * läsning av källkoden utan ett observerat paket.
 *
 * ÅTGÄRDENS FORM ÄR VALD EFTER MEKANISMEN, INTE TVÄRTOM. En egen
 * `context.routeWebSocket` vore fel lager: Playwright matchar WS-routes med
 * `_webSocketRoutes.unshift()` + `.find()` och har INGEN fallback-mekanism
 * (`playwright-core` 1.61.1, `coreBundle.js` rad 60841 resp. 59831). Den
 * senast registrerade vinner ensam, så vår route hade tyst dödat MSW:s hela
 * WS-lager den dag appen får riktiga WS-mockar. Åtgärden bor därför i
 * MSW-lagret: en catch-all WebSocket-handler. Att den ENS EXISTERAR gör
 * `allWebSocketHandlers.length === 0` falskt, vilket är vad som stänger
 * `connectToServer()`-grenen — och servern kopplas därefter bara upp av en
 * handler som uttryckligen anropar `server.connect()`.
 *
 * VARFÖR ETT KAST OCH INTE EN TEARDOWN-RAPPORT. Kastet propagerar hela vägen
 * till testet (mätt: `WebSocketHandler.run` → bindningens route-callback →
 * Playwrights felrapport), vilket ger exakt samma upplevelse som HTTP-vaktens
 * fällning: testet faller på uppkopplingen, med adressen i klartext.
 */

/**
 * Vaktens mönster. En delad konstant, inte en literal per användning: `ws.link`
 * accepterar RegExp (`isPath`, `matchRequestUrl.js` rad 52–54), och mönstret
 * måste matcha ALLT för att grenen ovan ska vara död kod.
 */
const ALLA_UPPKOPPLINGAR = /.*/;

/**
 * Vaktens tre utfall.
 *
 * `tackt` prövas FÖRE `lokal` med avsikt. Anropar både vakten och en täckande
 * handler `server.connect()` sker uppkopplingen två gånger; genom att låta
 * täckningen vinna äger alltid exakt en handler uppkopplingen.
 */
export type WebSocketBedomning = 'lokal' | 'tackt' | 'omockad';

/**
 * Vaktens BESLUT, skilt från dess verkan — samma uppdelning som HTTP-vaktens,
 * och av samma skäl: ett beslut som är en ren funktion kan prövas utan att en
 * verklig uppkoppling behöver upprättas.
 */
export function bedomWebSocket(
  url: URL,
  andraHandlers: readonly WebSocketHandler[],
): WebSocketBedomning {
  if (andraHandlers.some((handler) => handler.test(url))) return 'tackt';
  if (LOKALA_VARDAR.has(url.hostname)) return 'lokal';
  return 'omockad';
}

export function byggWebSocketMeddelande(url: URL): string {
  return [
    'Hermetik-vakten stoppade en omockad WebSocket-uppkoppling i fixturvärlden.',
    '',
    `  WS ${url.href}`,
    '',
    'Ingen WebSocket-handler täcker denna adress. Utan vakten hade',
    '@msw/playwright kopplat uppkopplingen vidare till den RIKTIGA adressen',
    '(route.connectToServer()) — alltså ut ur den hermetiska världen, tyst.',
    '',
    'Ska uppkopplingen ske i test: mocka den med ws.link() ur msw och',
    'registrera handlern — delat i tests/support/fixturvarld/handlers.ts, eller',
    'bara för detta test via network.use() (se hermetic.ts § Överskugga en',
    'delad handler).',
    '',
    'Ska den INTE ske: undersök varför appen öppnar en WebSocket här. Ett',
    'realtime-beroende som bara syns under test är nästan alltid ett fel i',
    'appkoden, inte en saknad handler.',
  ].join('\n');
}

export class OmockadWebSocketError extends Error {
  constructor(url: URL) {
    super(byggWebSocketMeddelande(url));
    this.name = 'OmockadWebSocketError';
  }
}

/**
 * Bygger vakt-handlern.
 *
 * `hamtaHandlers` är en GETTER, inte en lista: handlern måste finnas redan när
 * fixturen konstrueras, medan de handlers den ska jämföra sig mot (testets egna
 * `network.use()`-överskuggningar) tillkommer först under körningen. Vakten
 * filtrerar bort sig själv på objekt-identitet — samma val som
 * överskuggnings-vakten gör, och av samma skäl: positionen i listan är en
 * intern implementationsdetalj, identiteten kan inte drifta.
 */
export function skapaWebSocketVakt(hamtaHandlers: () => readonly AnyHandler[]): WebSocketHandler {
  const vakten: WebSocketHandler = ws
    .link(ALLA_UPPKOPPLINGAR)
    .addEventListener('connection', ({ client, server }) => {
      const andra = hamtaHandlers().filter(
        (handler): handler is WebSocketHandler =>
          handler !== vakten && handler instanceof WebSocketHandler,
      );

      switch (bedomWebSocket(client.url, andra)) {
        case 'tackt':
          // En annan handler äger uppkopplingen och avgör själv om den ska nå
          // en riktig server. Vakten håller sig undan.
          return;
        case 'lokal':
          // Fixtur-serverns egen trafik. Vites HMR-socket går hit i VARJE
          // visuellt test — utan denna gren hade sviten fällt på sig själv.
          server.connect();
          return;
        case 'omockad':
          throw new OmockadWebSocketError(client.url);
      }
    });

  return vakten;
}
