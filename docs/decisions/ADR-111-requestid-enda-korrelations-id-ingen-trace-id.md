# ADR-111: `requestId` är enda korrelations-ID:t — inget separat `trace_id`

- **Status:** Accepted
- **Datum:** 2026-08-11
- **Fas:** 6.5

## Kontext

`byggplan.md` § Fas 6.5 (P3a, 2026-05-05) bokade en "Bonus-ADR" för frågan
`trace_id` kontra `requestId` — distinkta korrelerade ID:n, eller
sammanslagna — och sköt uttryckligen upp beslutet: *"Skrivs när Fas 6.5
implementeras, inte i P3a."* Marcus användarberättelse #13 i PRD `TASK-201`
kräver att varje loggpost bär `requestId`, "så att jag kan korrelera en post
mot serverloggarna vid felsökning" — Fas A M7 etablerade redan
`requestId`-propagering klient → `EdgeFunctionError` (se
`src/data/config/supabase-client.ts`, `src/data/config/EdgeFunctionError.ts`)
och server → strukturerad logg (`generateRequestId()` +
`mapErrorToResponse()` i `supabase/functions/_shared/errors.ts`). Frågan
grillades till samsyn i S105 Del 2 (2026-08-11,
`tasks/sessions/archive/2026-08/2026-08-11-session-105.md` § Beslut 4).

## Beslut

`requestId` ÄR aktivitetsloggens enda korrelations-ID. Det bärs i varje
xAPI-statements `context.extensions` under en dedikerad IRI-nyckel
(`https://admin.miranon.dev/xapi/extensions/requestId`, se
`src/domain/schemas/ActivityStatement.schema.ts`, `TASK-201.1`). Inget
separat `trace_id`-fält införs.

**Mätt grund:** varje användaråtgärd i appen är i dag exakt EN mutation → EN
Edge Function-anrop (kvittot `src/data/mutations/receipts.ts` och
`src/data/mutations/actionEmail.ts` verifierade i S105 — eventuella kedjor,
t.ex. kvitto-generering + mail, sker SERVER-SIDE inom samma request, inte som
flera klient-initierade anrop). Ett distinkt `trace_id` vore i det läget en
redundant kolumn: `requestId` identifierar redan entydigt exakt en request
över hela dess livscykel (klient → EF → activity_log-rad).

**Ingen tracing-infrastruktur existerar.** `grep -rniE
'opentelemetry|\botel\b|traceparent|trace_id|traceId' src/
supabase/functions/` gav noll träffar (verifierat vid mint av denna ADR,
2026-08-11) — det finns inget OpenTelemetry/W3C Trace Context-spår att
korrelera mot i dagsläget.

Marcus pressade rekommendationen (*"Är du säker?"*, S105 Del 2); svaret stod
på mätningen ovan, med resultatet att beslutet får en **tvådelad
omprövningstrigger** i stället för att stängas ovillkorligt:

1. **OpenTelemetry/W3C Trace Context införs** i projektet (backend- eller
   frontend-instrumentering) — då finns ett verkligt `trace_id`-koncept att
   relatera `requestId` till, och relationen (samma fält, alias, eller två
   distinkta ID:n) måste omprövas explicit.
2. **En användaråtgärd börjar orkestrera flera EF-anrop från klienten** — då
   upphör "en åtgärd = en request" att hålla, och ett ID som spänner över
   flera `requestId`:n kan bli nödvändigt för att korrelera dem som en enhet.

Marcus: *"Kvitterar."*

## Alternativ som övervägdes

1. **Distinkta `trace_id` + `requestId`, sammankopplade.** Avvisat under
   nuvarande mätning: ingen tracing-infrastruktur konsumerar `trace_id`, och
   "en åtgärd = en request" gör ett andra ID till ren duplicering av
   `requestId`. Trigger 1 ovan öppnar dörren för detta alternativ den dagen
   OTel faktiskt införs.
2. **Inget korrelations-ID alls i `context.extensions`.** Avvisat: river
   direkt användarberättelse #13 (Marcus vill kunna korrelera en loggpost mot
   serverloggarna) och kastar bort Fas A M7:s redan byggda
   `requestId`-propagering utan skäl.
3. **`registration`-fältet (xAPI-statementets inbyggda `context.registration`,
   en UUID avsedd för att gruppera relaterade statements i en "session")
   återanvänt som korrelations-ID i stället för en extension.** Avvisat:
   `registration` har en annan xAPI-semantik (en LÄR-sessions-gruppering, t.ex.
   ett kursförsök) som inte matchar "denna specifika HTTP-request" — att
   överlasta fältet hade brutit strikt xAPI-konformans (PRD § Testbeslut,
   användarberättelse #15) för en bekvämlighet extensions redan löser rent.

## Konsekvenser

**Positiva:** noll redundant kolumn/fält; `requestId` är redan byggt och
propagerat (Fas A M7) — ingen ny mekanism, bara en ny konsument
(`activity_log`); omprövningstriggerna gör beslutet levande utan att kräva en
ny ADR för varje litet skäl att ifrågasätta det — bara de två konkreta
händelser som faktiskt skulle ändra kalkylen.

**Negativa/skuld:** om trigger 1 eller 2 inträffar krävs en uppföljande ADR
(supersedering eller additiv korrigeringsnot, `docs/decisions/README.md` §
Korrigering vs supersedering) — detta ADR gör INTE anspråk på att vara sista
ordet, bara det korrekta ordet givet dagens mätta grund.

## Relaterat

- [ADR-110](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md) —
  lagringsytan `requestId` skrivs till.
- `tasks/sessions/archive/2026-08/2026-08-11-session-105.md` § Del 2 Beslut 4 — grillad
  samsyn, Marcus-kvittens.
- `supabase/functions/_shared/errors.ts` — `generateRequestId()` +
  server-loggens `requestId`-fält (Fas A M7-arvet).
- `src/data/config/EdgeFunctionError.ts` +
  `src/data/config/supabase-client.ts` — klient-sidans
  `requestId`-extraktion.
- `byggplan.md` § Fas 6.5 DoD #5 + § ADR-krav (Bonus-ADR) — den ursprungliga
  bokningen denna ADR löser in.
