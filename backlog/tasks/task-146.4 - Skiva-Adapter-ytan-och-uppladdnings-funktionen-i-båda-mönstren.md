---
id: TASK-146.4
title: 'Skiva: Adapter-ytan och uppladdnings-funktionen i båda mönstren'
status: To Do
assignee: []
created_date: '2026-08-07 09:06'
labels:
  - ready-for-agent
dependencies:
  - TASK-146.2
  - TASK-146.3
parent_task_id: TASK-146
ordinal: 243000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En fil kan laddas upp och kopplas till sitt event, och den vägen håller lager-oberoendet: allt går via adapterkontraktet, aldrig direkt mot lagringen. Stora filer laddas upp utan att appen hänger sig.

MÖNSTER 2 HÅLLER ADR-057 trots att klienten rör lagringen, eftersom auktorisationsbeslutet — vem får ladda upp vad, till vilken path — fortfarande fattas server-side.

Täcker användarberättelser: 1, 2, 10, 11, 14, 15, 16, 18
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bilage-metoderna finns på datakälle-adapterns kontrakt och implementeras av BÅDA adaptrarna (port-paritet)
- [ ] #2 UI-lagret importerar aldrig lagrings-SDK:t och anropar aldrig lagrings-API:t direkt; frånvaron är mekaniskt fälld
- [ ] #3 Mönster 1 (små filer): bytesen går genom edge-funktionen, som skriver dem med förhöjd behörighet plus en metadatarad
- [ ] #4 Mönster 2 (stora filer): funktionen utfärdar ett tidsbegränsat, path-scopat uppladdnings-tillstånd; klienten laddar upp direkt utan att bytesen passerar funktionen
- [ ] #5 Auktorisationsbeslutet fattas server-side i BÅDA mönstren — klienten får ett scopat tillstånd, aldrig en genväg runt adaptern
- [ ] #6 En misslyckad uppladdning ger ett fel som säger vad som gick fel, på Lottas språk och inte i byte
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [ ] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [ ] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
