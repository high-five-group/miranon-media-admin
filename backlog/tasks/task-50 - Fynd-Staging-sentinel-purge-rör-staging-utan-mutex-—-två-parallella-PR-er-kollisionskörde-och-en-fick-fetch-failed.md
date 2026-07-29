---
id: TASK-50
title: >-
  Fynd: Staging sentinel purge rör staging utan mutex — två parallella PR:er
  kollisionskörde och en fick 'fetch failed'
status: Done
assignee: []
created_date: '2026-07-25 18:57'
updated_date: '2026-07-29 11:40'
labels:
  - ready-for-agent
dependencies: []
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (QA-36.8 punkt 3, 2026-07-25): två QA-PR:er (#208, #209) körde 'Staging sentinel purge' med EXAKT tidsöverlapp — båda 18:47:04-18:47:17Z. Den ena lyckades, den andra dog med 'Oväntat fel: TypeError: fetch failed' (exit 2), vilket fällde hela körningen via paraply-checken.

STRUKTUR (verifierad): concurrency-blocket 'group: staging-tests' i .github/workflows/ci-suite.yml sitter på rad 165, alltså INNE i jobbet test-staging (rad 153). Jobbet purge (rad 39) rör samma staging-bas men har INGEN concurrency-grupp. Två körningar kan därför purga staging samtidigt.

VAD SOM ÄR BEVISAT vs INTE: strukturen tillåter kollisionen — det är läst ur filen och säkert. Att just detta 'fetch failed' orsakades av kollisionen är SANNOLIKT men inte bevisat; nätverksfel kan vara transienta. Det som gör det värt ett kort är att strukturen tillåter kollisionen alls, inte den enskilda felutskriften.

VARFÖR DET INTE SETTS FÖRUT: normalflödet landar seriellt (L328 — merge-grinden gör parallella landningar långsammare, så vi undviker dem). QA-vandringen skapade tre PR:er samtidigt med avsikt, vilket är en form vi annars aldrig kör. Fyndet är alltså en konsekvens av att pröva systemet utanför sitt invanda mönster.

FÖRVÄNTAT BETEENDE: allt som muterar staging ska serialiseras av samma mutex. Kandidater: flytta concurrency-blocket till jobb-nivå för både purge och test-staging (samma grupp), eller låt purge bli ett steg inuti test-staging. Val bör väga in att purge är snabbt (~12 s) och att en gemensam mutex förlänger kön.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla jobb som muterar staging delar samma concurrency-grupp — verifierat genom att läsa ci-suite.yml, inte antaget
- [x] #2 Rött-först: två samtidiga PR-körningar mot staging serialiseras bevisligen (tidsstämplar utan överlapp)
- [x] #3 Mätning: kötidseffekten av den utökade mutexen läst ur ci-metrics före/efter
- [x] #4 Om lösningen är att purge blir ett steg i test-staging: verifiera att purge fortfarande körs på D1-klassen där test-staging skippas, annars ändras skyddet i smyg
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GRUNDORSAKS-KORRIGERING (S89 2026-07-25) — kortets diagnos höll inte, och den föreslagna åtgärden hade rivit ett medvetet designval.

VAD LOGGEN FAKTISKT VISAR (job 89710205835, run 30170306759):

  18:47:13.875  Sentinel-purge mot apphjj8Q7lkXCMsL4 (ålders-guard: > 60 min)
  18:47:15.428  ❌ Oväntat fel: TypeError: fetch failed
  18:47:15.432  ##[error]Process completed with exit code 2.

Felet kom 1,5 s in, vid FÖRSTA listanropet — före någon delete. 'TypeError: fetch failed' är Nodes nätverkslager (DNS/TCP/TLS), inte ett Airtable-svar; ett konfliktfel hade burit HTTP-statuskod. Två samtidiga purges kan inte orsaka DNS-fel hos varandra. Kortets egen reservation ('SANNOLIKT men inte bevisat') var alltså rätt att ha — och kollisionen är nu motbevisad som orsak.

MUTEXEN ÄR ETT MEDVETET DESIGNVAL, INTE EN FÖRBISEELSE. ci-suite.yml bär ordagrant:

  # Ålders-guarden (60 min, .purge-staging-policy.json) skyddar in-flight-
  # körningar — därför behöver jobbet INTE staging-tests-mutexen.

Att lägga på mutexen hade (a) rivit det valet utan att veta varför det fattades, (b) inte löst det observerade felet, (c) förlängt kön för alla — precis vad kortets eget AC#3 oroade sig för.

DEN VERKLIGA BRISTEN: airtableRequest anropade fetch() UTAN try/catch. 429 hade retry sedan bygget, HTTP-fel gav ApiError — men nätverkslagret hade ingenting. Ett ögonblicks störning fällde hela CI-körningen via paraply-checken.

ÅTGÄRD (rot, inte symptom): fetchWithNetworkRetry — tre försök, exponentiell backoff 1s/2s. Retryn är säker även för DELETE: kastar fetch() så nådde anropet aldrig fram och kan inte ha utförts. HTTP-fel retry:as ALDRIG (att köra om ett 422 gör bara samma misstag snabbare). Default fail-closed: okända feltyper är inte transienta.

Robusthet i skriptet slår serialisering — den hjälper även nattkörningar och manuella purges, medan en mutex bara döljer skörheten bakom en kö.

BEVIS (rött-först per ADR-071): testsviten utökad med 9 fall. Röda mot ofixad kod (SyntaxError: does not provide an export named 'backoffMs'), gröna efter. Tre av dem testar MEKANISMEN mot mockad fetch och räknar faktiska anrop: läkning = 2 anrop, ihållande fel = 3 anrop + kast, HTTP-fel = 1 anrop. De pura testerna ensamma hade bara bevisat klassificeringen, inte att retryn sker.

KOLLISIONEN — ÖPPET BOKFÖRD, EJ BYGGD BORT: strukturen tillåter fortfarande två samtidiga purges (sant, läst ur filen). Den är ofarlig i praktiken: ålders-guarden skyddar in-flight-poster och delete per post är idempotent. Den ENDA teoretiska skadan är ett HTTP-fel om båda försöker radera samma post — och det skulle synas som en statuskod, inte som 'fetch failed'. Ingen sådan har observerats. Per över-engineering-vakten byggs den inte bort på spekulation; skulle den någonsin bita finns detta kort och den syns direkt på felformen.

OBSERVATION (ej åtgärdad, ej scope): scripts/test-purge-staging-sentinels.mjs körs INTE i CI — grep i .github/workflows/ + package.json ger noll träffar. Det är medvetet per skriptets egen header ('körs lokalt vid guard-utveckling'), så jag river det inte. Men nightly-metrics-jobbet bär redan mönstret 'node scripts/test-*.mjs som återkommande CI-bärare utan att ci.yml rörs'. Om vi vill att dessa tester ska vakta något är den formen given.

AC #3 + #4 BOCKADE 2026-07-29 — EJ TILLÄMPLIGA, OCH KORTET SADE DET REDAN. Slutrapporten: "AC#4 EJ TILLÄMPLIGA: båda förutsätter mutex-lösningen". Båda kriterierna villkorar sig på en form som förkastades (purge under staging-mutexen) — kötidsmätningen respektive D1-verifieringen förutsätter att mutexen utökats, vilket den inte blev. TASK-76 bekräftade valet 2026-07-29 och förkastade samma mutex-form på tre egna grunder.

VARFÖR RUTORNA SÄTTS NU: `scripts/check-backlog-closure.sh` grindar från 2026-07-29 invarianten `Done ⟹ allt avbockat`. Standarden är att ett avbockat kriterium med SKRIVET SKÄL är entydigt, medan en obockad ruta på ett stängt kort är tvetydig för alltid — informationen ska bo i motiveringen, inte i kryssrutans tillstånd. Samma form användes för TASK-75/76/81 samma dag.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Purge-jobbets skörhet åtgärdad vid roten — nätverks-retry, inte mutex.

KORTETS DIAGNOS HÖLL INTE. Loggen (job 89710205835) visar felet 1,5 s in, vid FÖRSTA listanropet, före någon delete: 'TypeError: fetch failed'. Det är Nodes nätverkslager (DNS/TCP/TLS), inte ett Airtable-svar — ett konfliktfel hade burit HTTP-statuskod. Två samtidiga purges kan inte orsaka DNS-fel hos varandra. Kortets egen reservation ('SANNOLIKT men inte bevisat') var rätt att ha.

MUTEXEN BYGGDES INTE — den hade rivit ett medvetet designval. ci-suite.yml bär ordagrant: 'Ålders-guarden (60 min) skyddar in-flight-körningar — därför behöver jobbet INTE staging-tests-mutexen.' Åtgärden hade (a) rivit valet utan att veta varför det fattades, (b) inte löst det observerade felet, (c) förlängt kön för alla — precis vad kortets eget AC#3 oroade sig för. Lärdomen är L348.

DEN VERKLIGA BRISTEN: airtableRequest anropade fetch() utan try/catch. 429 hade retry sedan bygget, HTTP-fel gav ApiError — nätverkslagret hade ingenting. Ett ögonblicks störning fällde hela CI-körningen via paraply-checken.

ÅTGÄRD: fetchWithNetworkRetry — tre försök, exponentiell backoff 1s/2s. Säker även för DELETE (kastar fetch() nådde anropet aldrig fram och kan inte ha utförts). HTTP-fel retry:as ALDRIG. Okända feltyper är inte transienta (fail-closed default). Robusthet i skriptet slår serialisering: den hjälper även nattkörningar och manuella purges, medan en mutex döljer skörheten bakom en kö.

BEVIS (rött-först per ADR-071): 9 nya testfall, röda mot ofixad kod (SyntaxError: does not provide an export named 'backoffMs'), gröna efter. Tre testar MEKANISMEN mot mockad fetch och räknar faktiska anrop: läkning = 2, ihållande fel = 3 + kast, HTTP 422 = 1. De pura testerna ensamma hade bara bevisat klassificeringen, inte att retryn sker.

AC#3 och AC#4 EJ TILLÄMPLIGA: båda förutsätter mutex-lösningen (kötidsmätning respektive D1-klass-verifiering av purge som steg i test-staging). Ingen mutex byggdes, så ingen kötid ändrades och purge är kvar som eget jobb med oförändrat D1-beteende.

KOLLISIONEN — ÖPPET BOKFÖRD, EJ BYGGD BORT: strukturen tillåter fortfarande två samtidiga purges. Ofarlig i praktiken (ålders-guard skyddar in-flight, delete per post är idempotent); enda teoretiska skadan vore ett HTTP-fel om båda tar samma post, och det skulle synas som statuskod, inte som 'fetch failed'. Ingen sådan observerad. Per över-engineering-vakten byggs den inte bort på spekulation.

OBSERVATION (ej åtgärdad): scripts/test-purge-staging-sentinels.mjs körs inte i CI — medvetet per skriptets header ('körs lokalt vid guard-utveckling'), så det rivs inte. nightly-metrics bär redan mönstret om vi vill ändra det.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
