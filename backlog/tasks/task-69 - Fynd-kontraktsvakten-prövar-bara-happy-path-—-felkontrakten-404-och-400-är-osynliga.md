---
id: TASK-69
title: >-
  Fynd: kontraktsvakten prövar bara happy-path — felkontrakten 404 och 400 är
  osynliga
status: Done
assignee: []
created_date: '2026-07-28 14:08'
updated_date: '2026-07-28 17:36'
labels:
  - ready-for-agent
dependencies:
  - TASK-68
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (docs/research/kontraktsdrift-skyddet-2026-07-28.md § 5): kontraktsjamforelse.ts rad 195-206 kortsluter på allt utom HTTP 200. Statuskoder och felkroppar är kontrakt precis som svarsformen, men vakten kan i dag inte uttrycka en förväntad felstatus.

REDAN GLIDIT, LIVE-BELAGT: EF:en get-person har ett uttryckligt 404-kontrakt (supabase/functions/get-person/index.ts rad 172-180, kommenterat '404-KONTRAKT ... icke-existerande ID → 404, aldrig 500/tomt 200'). Fixturens resolvePersonResponse returnerar undefined för okänt ID, vilket via json(undefined) blir HTTP 200 MED TOM KROPP. Fixturens egen kommentar (fixture-data.ts rad 1163) påstår att hermetic.ts svarar 501 — den catch-allen togs bort i task-54.2 (handlers.ts rad 102-116). Dokumentationen beskriver alltså ett beteende som inte finns, och ingen grind har sagt något.

SAMMA KLASS PÅ LISTVÄGEN: get-persons svarar 400 'Invalid cursor' på trasig cursor (index.ts rad 74-85) och 400 'Invalid filter input' på kontroll-/bidi-tecken. Fixturen svarar 200 + sida 1 respektive 200 med tom lista. Fail-closed mot fail-open.

FÖRVÄNTAT BETEENDE: ett kontraktsfall ska kunna bära förväntad statuskod och felkropp, så att en EF som slutar returnera 404 vid okänt ID fälls av vakten.

AVGRÄNSNING: detta är vaktens MEKANIK. Att fixturens resolvers glidit i beteende är ett större problem som kräver dual-run (lager 4 i research-doket) och hör inte hit. TASK-68 (200-formen till alla sju) är förkrav — bygg inte detta först.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ett kontraktsfall kan uttrycka förväntad statuskod och felkropp, inte bara 200
- [x] #2 get-person okänt ID och get-persons ogiltig cursor bevakas som felkontrakt
- [x] #3 Tvåsidigt bevis: vakten fäller när felkontraktet bryts OCH är tyst när det hålls
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD 2026-07-28 av orkestreraren efter CI-verifiering. PR #358 mergad som fef0f3d; samtliga tolv jobb gröna per jobb (Staging 7m16s · Acceptance 6m38s · A11y 1m48s · Pure+Build 27s · Lint 43s · Docs 44s · purge 10s · CodeQL-paret · aggregatorn 3s).

DoD #1/#2/#4 bockade av orkestreraren mot belägg, inte mot antagande: AC 1-3 avbockade i kortet · agentens uppmätta exitkoder (typecheck 0 · biome 0 · build 0 · test:api 0 med 419 passed · test:acceptance 0 med 153 passed · check:docs 0) · diffen fem filer, samtliga i scope (kortet + fyra under tests/), noll orelaterade.

DESIGNBESLUTET SOM AVGJORDE KORTET: felkontraktet jämför EF:ens egen deklaration mot skarp staging, INTE fixtur mot staging. Fixturen är inte part i jämförelsen alls. Skälet är strukturellt — fixturvärlden kan inte svara annat än 200 (json() defaultar dit), så en fixtur-mot-staging-jämförelse hade fällt på fixturens form i stället för på kontraktet. Fixturens kända drift (resolvePersonResponse ger 200 + tom kropp där EF:en har 404) lämnas därför medvetet till lager 4 (dual-run), och larmets egen text säger uttryckligen att fixturen aldrig ska lappas för att tysta ett felkontraktslarm.

ORKESTRERARENS UPPDRAG BAR FEL ADRESS — fångat av agenten. Uppdraget angav tests/support/fixturvarld/kontraktsjamforelse.ts; filen ligger i tests/kontraktsvakt/. Radhänvisningen 195-206 (ur kortet) pekade på en kommentar om listaAvPoster, inte på 200-kortslutningen, som låg på rad 239. Agenten verifierade mot koden i stället för att lita på uppdraget — exakt vad fragmentet uppdrag-kan-peka-pa-fel-adress-verifiera-mot-koden [UNIVERSAL] föreskriver. Samma klass av fel som fragmentet beskriver, begånget av orkestreraren.

TÄCKNINGEN VAR OJÄMN, BOKFÖRT AV AGENTEN I STÄLLET FÖR UTJÄMNAT: get-persons 404-status prövades redan blockerande i tests/api/get-person.staging.test.ts:83, men bara som typeof body.error === 'string' — aldrig lydelsen. get-persons cursor-400 prövades ingenstans (noll träffar på 'Invalid cursor' i tests/). Nytt är alltså lydelsen som kontrakt, cursor-grenen alls, och att båda hamnar i kontraktsdrifts-mekanismen.

TASK-68:s motivering-blindfläck är varken lättare eller svårare att stänga efter detta — felkontrakten rör inte typjämförelsen.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
