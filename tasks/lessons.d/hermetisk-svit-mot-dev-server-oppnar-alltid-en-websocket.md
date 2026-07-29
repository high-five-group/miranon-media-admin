# En hermetisk svit mot en dev-server öppnar ALLTID en WebSocket — och `page.route` fångar den inte

**En hermetik-vakt som fäller på "all WebSocket-trafik" fäller hela sviten, för
Vites HMR-socket är en förutsättning för att dev-servern alls fungerar.
Localhost-undantaget är därför inte en artighet utan villkoret för att vakten går
att införa. Och HTTP-vakten skyddar inte WS: `page.route` fångar aldrig
WebSocket-uppgraderingar.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, `TASK-56`):** den hermetiska fixturvärlden hade sedan
`task-54.2` en vakt som fällde varje omockat HTTP-anrop med adressen namngiven.
WebSocket saknade motsvarighet — bindningen `@msw/playwright` registrerar
`context.routeWebSocket` med match-all och anropar `route.connectToServer()` när
ingen handler matchar, alltså en **verklig uppkoppling mot den riktiga adressen**.

Fyndet var latent: appen har inga realtime-funktioner, så ingen kod öppnar en
WebSocket. Men mätningen visade att **varje visuellt test redan öppnade en** —
Vites HMR-socket mot `ws://localhost:<port>`.

**En naiv "fäll alla WS"-vakt hade alltså fällt samtliga tolv baseline-tester.**
Det upptäcktes bara för att vakten mättes mot den verkliga sviten innan den
skrevs färdig.

**Formen som fungerade:** localhost-grenen anropar `server.connect()` och bevarar
dagens beteende exakt, vilket bevisades genom att alla tolv baselines förblev
**bitidentiska (sha1)**. Allt annat fälls med adressen namngiven och en egen
felklass.

**Två saker att bära vidare:**

1. **`page.route` fångar inte WebSocket.** En sid-vakt som ser heltäckande ut för
   HTTP lämnar WS orörd — och det syns inte, eftersom frånvaron av trafik ser
   likadan ut som frånvaron av en vakt. Klassen är repots återkommande: partiell
   täckning som inte är utskriven läses som fullständig.
2. **Mät vad sviten FAKTISKT gör innan du skriver en vakt mot den.** Vakten här
   var korrekt i sin idé och hade ändå fällt allt, eftersom idén byggde på en
   antagen trafikbild. Den positiva läckagemätningen — en egen lyssnare på
   IPv6-loopback, utanför localhost-undantaget — var det som gjorde bilden
   verklig: den fick `GET /realtime upgrade=websocket` **medan testet var grönt**.

**Jfr [[L322]]:** där handlade det om en grind som är fail-open; här om en grind
som inte finns för en hel trafikklass. Den senare är tystare — en fail-open grind
syns åtminstone i jobblistan.
