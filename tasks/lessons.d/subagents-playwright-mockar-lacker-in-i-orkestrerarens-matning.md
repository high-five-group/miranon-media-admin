# En subagents Playwright-mockar och query-cache läcker in i orkestrerarens efterföljande mätning [UNIVERSAL]

**Instans (2026-08-31, S113 design-slutdomen):** efter fix-agentens pass
visade orkestrerarens inkorgs-mätning på port 5173 agentens MOCKDATA
("ZZ-GRANSKNING-FIXD", "Anna Testperson Ternström") i stället för
staging-fixturen — trots att agenten körde sin dev-server på EGEN port
(5183). Första hypotesen ("agenten har raderat/ändrat fixturen i basen")
FALSIFIERADES med en direkt bas-mätning: S113-fixturens alla 8 anmälningar
var intakta. Mekanismen är dubbel:

1. **`page.route()`/context-routes i den DELADE Playwright-MCP-browsern**
   matchar på MÅL-URL:en (staging-EF:ernas `functions/v1/…`), inte på vilken
   lokal port sidan serveras från — agentens interceptorer fångar därför
   även orkestrerarens senare anrop från en annan port.
   `page.unrouteAll()` räcker inte; routes kan ligga på CONTEXT-nivå
   (`page.context().unrouteAll()`).
2. **Appens query-cache persistas i `localStorage`** (runbokens fälla 6) —
   mockade svar överlever navigering och hårdladdning som "riktig" data.

**Regeln:** efter att en subagent använt den delade Playwright-browsern,
rensa FÖRE egen mätning: `page.context().unrouteAll()` +
`localStorage.clear()` (och räkna med om-inloggning — auth-sessionen bor
också i localStorage, uppgifter i `.env.test`). Och omvänt: en mätning som
visar "omöjlig" data är en CACHE-/MOCK-HYPOTES före en incident-hypotes —
mät källan (basen) direkt innan slutsatser om dataförlust dras.
