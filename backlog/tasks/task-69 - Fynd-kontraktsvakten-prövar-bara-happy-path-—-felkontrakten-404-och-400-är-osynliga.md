---
id: TASK-69
title: >-
  Fynd: kontraktsvakten prövar bara happy-path — felkontrakten 404 och 400 är
  osynliga
status: To Do
assignee: []
created_date: '2026-07-28 14:08'
updated_date: '2026-07-28 17:22'
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



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
