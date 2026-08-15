---
id: TASK-229
title: >-
  Fynd: anmälningar utan Person-länk - Helena-instansen, olänkade-svep +
  anmälningskedjans rotorsak
status: In Progress
assignee: []
created_date: '2026-08-15 22:59'
updated_date: '2026-08-15 23:31'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 431000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 7 (Marcus 2026-08-16): Helena Skoglunds RIM 3-anmälan (rec1ft7CDqLJwZw9V, ID 911, EventKey Event-25, skapad 2026-06-29 via Huvudformulär) saknar Person-länk i prod - MCP-verifierat: personposten recoFAXvbggTQ8WrL finns med samma e-post, Antal genomförda event 3 och de tre ÄLDRE anmälningarna länkade; anmälningskedjans automatiska person-länkning missade den nya. Frontendkonsekvens: antalGenomfordaEvent blir null (Registration.ts-kontraktet) och deltagarkortets historikrad utelämnas (Deltagare.tsx rad ~910). RESOLUTION I BASEN per ADR-063, tre delar: (1) DATAFIX Helena: länka anmälan till personposten - PROD-WRITE, kräver Marcus-GO, utförs HITL eller av agent efter GO; (2) SVEP: räkna ALLA anmälningar utan Person-länk i prod (read-only) och rapportera lista + mönster (datum-fönster? formulär-väg?); (3) ROTORSAK: varför missade kedjan denna rad (automation-status via claude.ai-Airtable-connectorn - list_automations; jämför rad-skapad-datum mot automationens historik). Kortdesign-frågan (låst korthöjd vid null) är SEPARAT och ligger hos Marcus - inte i detta kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus-GO inhämtat och Helena-anmälan länkad till rätt personpost, verifierad i appen (historikraden syns)
- [x] #2 Olänkade-svepet rapporterat med antal + lista + mönsteranalys
- [x] #3 Rotorsaken belagd eller öppet bokförd som obestämbar med vad som uteslutits
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Del 1 — Datafix Helena (PROD-write, GO mottaget i uppdragstexten 2026-08-16: "Skicka agenter direkt på punkt 6 och 7")

Skrivet via mcp__airtable__update_records (PAT-servern), tabell Anmälningar
(tbloOcrppVoyrHbrq), fält Person (fldQekqRlLfup8x5K, multipleRecordLinks →
Personer, "Sätts normalt av A2; Edge Functions kan PATCH:a direkt" per
data-model.md rad 176).

FÖRE: rec1ft7CDqLJwZw9V (ID 911, Helena Skoglund, EventKey Event-25) — fältet
Person SAKNADES helt i fields (get_record-svaret innehöll ingen "Person"-nyckel).

SKRIVNING: update_records({id: rec1ft7CDqLJwZw9V, fields: {Person:
[recoFAXvbggTQ8WrL]}}).

EFTER (läst tillbaka från BÅDA sidor av länken):
- Anmälningar.rec1ft7CDqLJwZw9V.Person = ["recoFAXvbggTQ8WrL"] — länken sitter.
- Personer.recoFAXvbggTQ8WrL."Anmälningar (länkat fält)" =
  ["recRMiv1avQIizcJr","recrSWIdhdxel0GE2","rec5WozDB5dOeE7mj","rec1ft7CDqLJwZw9V"]
  — de tre ÄLDRE länkarna orörda, den nya tillagd (ej ersatt/skrivet över).
- Personer.recoFAXvbggTQ8WrL."Antal genomförda event" = 3 (oförändrat, korrekt
  — RIM 3 är ej genomfört ännu, Status Obekräftad).
- Rollupar som förväntat omräknade av basen (ej extra skrivningar från min sida):
  "Antal anmälningar (totalt)" 3→4, "Har en aktiv anmälan?" "Ingen aktiv
  anmälan"→"Aktiv".

App-verifiering (AC #1 "verifierad i appen"): källäst mekanismen i kod i
stället för en live prod-inloggad browser-session (ingen prod-app-session
tillgänglig för agenten). src/domain/schemas/Registration.schema.ts rad 44+50
och src/components/events/detail/Deltagare.tsx rad 770+910-916: genomforda =
reg.antalGenomfordaEvent hämtas från Personer.Antal genomförda event
(flddy8JND3YnlgZxe) via samma person-batch-lookup som antalGenomfordaEvent,
och historikraden ("N tidigare event hos Miranon Media") renderas endast när
genomforda != null. Innan fixen: Person-länken var tom → lookupen hittade
ingen Person → antalGenomfordaEvent null → raden dold. Efter fixen: länken
resolver till recoFAXvbggTQ8WrL vars Antal genomförda event = 3 →
antalGenomfordaEvent blir 3 → historikraden ska nu rendera "3 tidigare event
hos Miranon Media" på Helenas RIM 3-anmälan. Detta är en kod-mekanism-
verifiering, INTE en skärmdump/live-observation i appen — öppet bokfört som
gap mot AC #1s bokstav.

## Del 2 — Olänkade-svepet (read-only, filterByFormula {Person}=BLANK() mot
hela Anmälningar-tabellen, maxRecords 500, ingen trunkering — 7 träffar kvar
efter Del 1s fix, dvs 8 TOTALT innan fixen)

| ID | Namn | EventKey | Rad skapad | Från formulär | Status | Namngiven Person fanns redan? |
|---|---|---|---|---|---|---|
| 868 | Allan Nieminen | 11 (malformad, ej Event-11 — se not) | 2026-05-12 21:39 | Huvudformulär | Obekräftad | Ja (skapad 2026-05-12 08:52, samma dag, 2 äldre länkar) |
| 877 | Elin Melwinsson | Event-10 | 2026-05-18 18:56 | Huvudformulär | Obekräftad | Ja (skapad 2026-05-15, 0 äldre länkar) |
| 884 | Ulrika Arvas | Event-55 | 2026-05-29 15:05 | Huvudformulär | Obekräftad | Ja (skapad 2026-04-19, 2 äldre länkar) |
| 899 | Lena Maria Olsson | Event-55 | 2026-06-15 05:09 | Huvudformulär | Obekräftad | Ja (skapad 2026-04-19, 1 äldre länk) |
| 910 | maria lejdeby | Event-55 | 2026-06-28 07:38 | Huvudformulär | Obekräftad | Ja (skapad 2026-04-19, 1 äldre länk) |
| 911 | Helena Skoglund | Event-25 | 2026-06-29 18:28 | Huvudformulär | Obekräftad | Ja (FIXAD i Del 1) |
| 941 | Karl Areskough | Event-10 | 2026-07-15 18:15 | Huvudformulär | Obekräftad | Ja (skapad 2026-04-26, 0 äldre länkar) |
| 981 | Agneta Lindell | Event-10 | 2026-08-11 08:23 | Huvudformulär | Obekräftad | Ja (skapad 2026-05-10, 0 äldre länkar) |

Mönsteranalys:
- 8/8 (100%) Från formulär = Huvudformulär, 8/8 Status = Obekräftad.
- Datumspridning 2026-05-12 → 2026-08-11 (knappt 3 månader) — INGET enskilt
  tidsfönster/utfall; utesluter en enda avstängningsperiod som hel förklaring.
- 3/8 mot Event-10, 3/8 mot Event-55 — ingen uppenbar gemensam eventegenskap
  hittad (olika event, olika datum, ingen kapacitetsgräns korrelerad).
- EventKey "11" på Allan Nieminen (868) är EN SEPARAT, redan känd bugg
  (§Kända fällor 10 / §Reverse-flow F.2, "EventKey-format-bug i
  Huvudformulär — orsak okänd", tidigare sanerad 2026-04-26 för poster
  #220–#237+#847). Detta är en NY instans (2026-05-12, efter saneringen) —
  buggen har återkommit. Registreras här som observation, ej åtgärdad i detta
  kort (utanför scope) — kandidat för en ny post i data-model.md §Kända
  fällor, ej gjord av mig (scope-disciplin: detta kort skriver ingen ADR/
  referens-uppdatering).
- Kritiskt: I SAMTLIGA 8 fall fanns redan en NAMNGIVEN Personpost med
  matchande e-post FÖRE anmälans skapande-tidpunkt. Det är alltså inte
  "namnlös Person"-scenariot (§Kända fällor 21/22) — se Del 3.

## Del 3 — Rotorsak (claude.ai-Airtable-connectorn NÅDDES — pong via
mcp__claude_ai_Airtable__ping, ingen HITL-eskalering krävdes för
åtkomstdelen)

BELAGT via mcp__claude_ai_Airtable__list_automations(includeDeployedVersion:
true) mot app8uGPrVCVOm6LfD:
- A2 (wflRPMp5QNGEa7wH1) trigger recordCreated på Anmälningar,
  deploymentStatus=deployed, configurationStatus=valid. Automationen är
  alltså strukturellt PÅSLAGEN och giltigt konfigurerad — inte av- eller
  felkonfigurerad.
- A2s 4-grensbeslut (data-model.md §Anmälningskedjan "A2s decision — 4
  grenar") stämmer mot koden: Gren 1 (namnlös person) UPPDATERAR NAMN, sätter
  EJ Person-länk. Gren 2 (namngiven person hittad) SÄTTER Person-länk +
  skapar Touchpoint. Gren 3 (dubblett) loggar Error-log, sätter EJ länk.
  Gren 4 (ingen träff) skapar ny Person OCH sätter länk.

UTESLUTET (belagt, inte antaget):
- Gren 1 (namnlös person): alla 8 matchande Personer hade REDAN namn (Namn/
  Förnamn/Efternamn ifyllda) vid tidpunkten — Gren 1 kan inte ha triggat.
- Gren 3 (dubblett/Error-log): tabellen Error-log (tblnnmWswnRp9gFws) gav 0
  träffar totalt (list_records maxRecords 200, senast-först) — ingen
  dubblett-logg någonsin skriven för dessa fall.
- Gren 4 (ingen Person-träff alls): omöjlig — en matchande namngiven Person
  fanns redan i samtliga 8 fall (se Del 2-tabellen).
→ Kvar står ENDAST Gren 2 som den gren logiken SKULLE ha tagit.

STARKT INDICIUM (4 av 8 stickprovskontrollerade i Touchpoints-tabellen,
tbl22SCvlHrgcAiZi, filtrerat på Person-länk = Karl Areskough / Agneta
Lindell / Elin Melwinsson / Helena Skoglund): Gren 2 skapar ALLTID en
Touchpoint (Registrera händelsen i Touchpoints, nod wacXk240STE9j0Ory) i
SAMMA körning som länken sätts. Ingen av de 4 kontrollerade personerna har
en Touchpoint med Datum/tidsstämpel som matchar anmälans skapande — deras
ENDA Touchpoints är av Typ "Angett e-post för att ta del av ett
erbjudande" (från A4/lead-flödet, långt före anmälan). Det betyder att INTE
BARA länk-uppdateringen uteblev, utan HELA Gren 2-körningen (båda dess
actions) uteblev — automationen tog aldrig den grenen, snarare än att en
enskild action inom grenen fallerade.

OBESTÄMBART UTAN HITL-ÅTKOMST TILL AIRTABLES KÖRNINGSHISTORIK: varken
mcp__airtable__* (PAT-servern) eller mcp__claude_ai_Airtable__* exponerar
automationers run-history (Airtable UI: Automations → A2 → Run history,
eller motsvarande REST-endpoint) — ingen av de undersökta MCP-verktygen har
en list-runs/get-run-funktion. Detta är INTE samma sak som "connectorn
saknades" (den svarade pong och list_automations/get_automation fungerade
utan problem) — gapet är verktygsytan, inte åtkomsten. Kan alltså INTE
avgöra om (a) recordCreated-triggern aldrig avfyrades för dessa 8 specifika
poster (känt Airtable-plattformsbeteende: automationer kan i sällsynta fall
missa att avfyras för poster skapade via API/integration i snabb följd, ej
verifierat i just denna bas) eller (b) triggern avfyrades men A2s
exekvering felade tyst innan någon nod hann köra. Kräver: Airtable-UI-
åtkomst till Automations-fliken → A2 → Run history, filtrerat på de 8
tidsstämplarna ovan (2026-05-12T21:39, 05-18T18:56, 05-29T15:05,
06-15T05:09, 06-28T07:38, 06-29T18:28, 07-15T18:15, 08-11T08:23) — en
HITL-session.

SLUTSATS AC #3: rotorsaken är BELAGD till gren-nivå (Gren 2 tog aldrig sin
körning; Gren 1/3/4 uteslutna med belägg) men INTE till trigger-vs-
exekvering-nivå (kräver Airtable run-history, ej nåbar via MCP-ytan) —
öppet bokförd som obestämbar på den sista graden, med allt uteslutet
explicit ovan.
<!-- SECTION:NOTES:END -->
