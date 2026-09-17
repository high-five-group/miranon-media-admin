---
id: TASK-416.16
title: >-
  Skiva: Närvaro på avsikt — prefetch av get-attendance för det event Lotta står
  på (eventdetaljens Check-in-ingång, hover/fokus + sidmount), aldrig för alla
  event
status: Done
assignee: []
created_date: '2026-09-06 13:27'
updated_date: '2026-09-17 09:05'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: high
ordinal: 743000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: research-passet docs/research/forvarma-allt-branschmonster-2026-09-06.md § 5 (b) punkt 2–3 och Dom (S123, orkestrerarens beslut på Marcus mandat 2026-09-06: bygg ordentligt eller inte alls — förvärm ALLT byggs INTE, 68 s mot 9 s-taket vid 57 event, ingen branschledare gör det). Rapport D §3: Check-in (/event/$eventId/narvaro) visar laddläget varje gång eftersom get-attendance inte värms (isPending = event || attendance || registrations, EventCheckin.tsx:211). Åtgärd, samma mönster som TASK-416.11 för bilagor och husets EventCard.tsx:38–58 / TabBar.tsx:65 (ADR-078 beslut 3): (1) prefetchQuery av attendance-nyckeln vid hover/fokus på Check-in-ingången i eventdetaljen (hitta länken/knappen i src/components/events/detail/), (2) prefetchQuery vid eventdetaljens sidmount för DET eventet (Lotta står redan på det; kostnad ett EF-anrop), (3) valfritt och mätt: på Hem, prefetch av attendance för Nästa event när eventet är i dag (dörrlistan är sannolikt nästa steg) — bara om mätningen visar att det inte förlänger Hem:s tid till interaktiv. Använd prefetchQuery, aldrig ensureQueryData (ADR-078 beslut 1). Samma query-nyckel som EventCheckin använder så cache-träffen är exakt. Mät: tid från klick på Check-in till listan synlig, före/efter, vid varm och kall cache mot staging.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hover/fokus på Check-in-ingången i eventdetaljen prefetchar attendance för eventet (nätverksanrop syns före klick)
- [x] #2 Eventdetaljens sidmount prefetchar attendance för det eventet; ingen prefetch sker för andra event
- [x] #3 Mätning bifogad: Check-in visar listan utan laddläge efter normal navigering från eventdetaljen (varm), och tid till lista före/efter vid kall cache
- [x] #4 ADR-078 beslut 1 respekterat: navigeringen blockeras aldrig; befintliga check-in-tester gröna, axe-svep grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Mätning mot staging (dev-server localhost:5173, äkta Airtable/EF via TEST_USER,
chrome-devtools MCP), 2026-09-06:

1) AC #1 (hover/fokus): koden binder onMouseEnter/onFocusCapture på samma
   `varmNarvaro`-callback som sidmount-effekten. Levande verifierat att
   funktionen fungerar (samma prefetchQuery-anrop, dedup korrekt — se punkt
   nedan); DIVERGENS: kunde inte isolera hovrets EGET nätverksanrop live
   eftersom sidmount alltid hinner före i appens enda nuvarande ingång till
   Check-in (EventDetail → CheckInKort) — mount-effekten har redan skjutit
   iväg/löst anropet innan ett verktygsanrop hinner hovra. Koden är korrekt
   och delar exakt samma mekanism; framtida ENTRY POINT #2 till Check-in
   (utan föregående EventDetail-sidmount) skulle exponera hovrets eget bidrag.

2) AC #2 (sidmount, event recSahYCeTbEzFFe6, staging):
   nätverkslogg direkt efter sidmount visade
   get-attendance?eventId=recSahYCeTbEzFFe6 [200] utan klick — ETT anrop,
   före någon interaktion. Hover på "Gå till check-in" gav INGEN ny begäran
   (dedup — React Query såg färsk/pågående query, exakt ADR-078 beslut 3).

3) AC #3 (varm vs kall, mätt med performance.getEntriesByType('resource')):
   KALL (direkt URL till /event/$id/narvaro, aldrig besökt eventets
   EventDetail — motsvarar läget FÖRE denna skiva): get-event 1224 ms,
   get-attendance 2098–5244 ms, get-registrations 2493–7196 ms (tre separata
   event uppmätta, staging-latensen varierade märkbart mellan körningarna —
   sannolikt delad Airtable-belastning under mätfönstret). isPending =
   event || attendance || registrations ⇒ skelettet står kvar tills DEN
   LÅNGSAMMASTE av de tre landat: 2,1–7,2 s uppmätt, snarare än en enda siffra.
   VARM (normal navigering eventdetalj → Check-in, event recolQdNGcKz1eX0n):
   identisk uppsättning nätverksanrop FÖRE och EFTER klicket (0 nya anrop) —
   listan (8 riktiga namn, kryssrutor, sökfält) syntes i samma snapshot som
   klicket, inget laddläge observerat. Eftersom navigeringen kostar noll
   nätverksanrop är den oberoende av Airtable-latensen — den kvalitativa
   skillnaden (nätverksbunden vänta vs ingen) är starkare bevis än en enda
   ms-siffra, som ADR-078 beslut 3 själv argumenterar.

4) AC #2/#4 (ingen läckage till andra event): nätverksloggen efter besök på
   recSahYCeTbEzFFe6 visade ENDAST det eventets attendance-anrop; ett senare
   besök på ett HELT annat event (recolQdNGcKz1eX0n, ny isolerad
   browser-kontext) visade likaså ENDAST det eventets eget anrop — aldrig
   det förra eventets.

DIVERGENS (upptäckt under bygget, ej i uppdragets premiss-pass): en
BEFINTLIG, avsiktlig e2e-invariant (tests/e2e/event-narvaro-register.staging.test.ts,
"kommande event → get-attendance anropas ALDRIG", motiverad "noll
e2e-rippel") skulle ha brutits av ett ovillkorligt sidmount-prefetch. Roten:
Check-in sker vid dörren MEDAN eventet pågår — sannolikt medan Status
fortfarande är "Planerat" (manuellt fält, flippas inte automatiskt) — så ett
villkor på "Genomfört" (som läsregistret Narvaro.tsx bär) hade gjort
prefetchen verkningslös för sitt eget syfte. Vald lösning: behöll prefetchen
OVILLKORLIG (matchar EventCheckins egen icke-villkorade attendance-fetch) och
uppdaterade den ENDA träffade testets assertion (0 → 1 anrop) med öppen
motivering i testet, plus lade till en delad tom-stub (helpers/tom-narvaro.ts,
samma mönster som helpers/tomma-anteckningar.ts) i sju e2e-filer och EN
handler i tests/support/fixturvarld/handlers.ts (visual+acceptance-klassen)
som annars hade läckt ett omockat get-attendance-anrop. Alla berörda filer
körda om grönt (se PR-kroppen för exakta räkningar).

SKIPPAT MED AVSIKT: del (3), valfri Hem→Nästa event-prefetch. Korten egen
gate ("bara om mätningen visar att det inte förlänger Hem:s tid till
interaktiv") kräver ett dedikerat mätpass (Hem är en tung, delad yta); given
tidsbudgeten för denna redan ripple-tunga skiva bedömdes det som ett eget,
uppmätt tillägg snarare än en riskabel gissning i samma landning. Ingen kod
ändrad i Hem.tsx/NastaEvent.tsx.

TILLÄGG (orkestrerar-uppdrag efter push, 2026-09-06): granskningsfokuserad
motivering för varför e2e-vakten "kommande event → get-attendance anropas
ALDRIG" (event-narvaro-register.staging.test.ts) medvetet ändrades 0 → 1,
inte bara konstaterande att den ändrades.

Vaktens EGET skäl, ordagrant ur testfilen innan denna skiva: "noll
e2e-rippel-motivet" — dvs. ett rent SVIT-HYGIENSKÄL (ett ovillkorligt anrop
här hade tvingat varje annan e2e-fil som råkar rendera EventDetail att mocka
get-attendance för att inte läcka mot riktig staging). Vakten var ALDRIG ett
PRODUKTSKÄL ("kommande event ska aldrig ha sin närvaro hämtad") — den var en
regressionsspärr mot precis den typen av oavsiktlig bred hämtning som
forvarma-allt-branschmonster-2026-09-06.md § 5 (c)/Dom avvisar ("förvärm
ALLT" byggs INTE).

Denna skiva river INTE det skälet — den upphäver det MEDVETET för EXAKT den
smala, avsiktsdrivna vägen § 5 (b) punkt 2–3 pekar ut: "Prefetch/mount-
hämtning ... NÄR EVENT-SIDAN monteras ... för DET event Lotta just öppnat"
och "Hover/fokus-prefetch vid INGÅNGARNA" — samma ADR-078 beslut 3-mönster
som redan gäller EventCard.tsx/TabBar.tsx/PersonsList.tsx. Skillnaden mot
det vakten skyddade mot: DENNA hämtning skalar med Lottas FAKTISKA besök
(en per öppnat event, aldrig alla 57), inte med eventregistrets storlek —
exakt den distinktion § 5 (b)/Dom drar mellan "förvärm det Lotta med hög
sannolikhet är på väg till" (billigt, görs) och "förvärm allt i förväg"
(dyrt, INTE görs). Vaktens hygienskäl (ett svit-brett ripple) hanterades
separat och mekaniskt: en delad tom-stub (helpers/tom-narvaro.ts + en
handler i fixturvarld/handlers.ts) i stället för att låta det stoppa
funktionen — själva svit-läckaget vakten varnade för är alltså åtgärdat,
bara inte längs vägen "gör aldrig anropet".

Sammanfattat för granskaren: vaktens 0-tal var en KONSEKVENS av att ingen
kod tidigare hade ett produktskäl att fråga; TASK-416.16 GER kod det skälet
(ADR-078 beslut 3 + forvarma-allt-branschmonster-2026-09-06.md § 5 (b)
punkt 2–3), så talet ändras till 1 — och endast till 1, aldrig till "varje
event" — vilket är precis vad AC #2/#4 (ingen läckage till andra event) och
mätningen ovan bevisar.

REVIEW-RUNDA 2 (PR #2403, Opus, 2026-09-06): punkt 1 ovan om hover/fokus är inaktuell sedan runda 2-fixen 730c6f74 — bindningen sker inte längre via onMouseEnter/onFocusCapture på en wrapper-div i EventDetail.tsx utan via HandlingsLank:s onIntent-prop (CheckInKort → HandlingsLank → Link onMouseEnter/onFocus, Atgarder.tsx), samma väg som AtgarderKort/TASK-416.11; wrapper, biome-ignore och den felaktiga kommentaren togs bort. Mätdatan i punkt 2–4 gäller oförändrat (sidmount-prefetch + dedup). Regressionstest för hover-prefetchen hör till TASK-416.20 (granskarens dom, bokförd). Landad 7396d823.

Bockad i efterhand av S125 mot belägg: PR #2403 mergad 7396d823 (2026-09-06), samtliga 4 AC redan bockade, Final Summary anger AC#4 72/72 gröna + DoD typecheck/biome/build/check-langa-streck 0. Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
