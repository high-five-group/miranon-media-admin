---
id: TASK-302.3
title: >-
  Städning av utkast: skarp generering rensar utkast/<eventId>/, purge-target i
  staging, T171-bokföring
status: To Do
assignee: []
created_date: '2026-08-22 21:24'
labels:
  - ready-for-agent
dependencies:
  - TASK-302.2
parent_task_id: TASK-302
priority: medium
ordinal: 555000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skiva 3 av `TASK-302`. Håller den transienta mängden bunden och bokför resten öppet.

## Bygg

1. `generate-event-attachment` (skarp väg, `preview: false`) och kvittots skarpa sändning (`_shared/send-receipt.ts` § `sendReceipt`, efter lyckad sändning): ta bort `utkast/<eventId>/` (`storage.remove` på listade objekt under prefixet) — utkastet är ersatt av den riktiga artefakten. Fel vid städning loggas, fäller aldrig den skarpa operationen.
2. `.purge-staging-policy.json`: target för `utkast/**` i bucket `bilagor` så staging-CI:s setup-purge tar testutkasten. OBS CLAUDE.md § Granskningsdata: `ZZ-GRANSKNING-*` rörs aldrig — utkast-targeten avgränsas till prefixet, inte till events.
3. `T171` (persondata, `tasks/threads/README.md` + ev. kort): bokför att kvitto-utkast med köparuppgifter ligger i privat bucket under signerad 300 s-URL, högst ett per event, borttaget vid skarp sändning — och att prod saknar tidsstyrd städning (känd rest, `ADR-124` § Kända rester).
4. `docs/reference/` — där Storage-layouten för `bilagor` dokumenteras (sök `BILAGOR_BUCKET_ID`/`<eventId>/` i docs): lägg `utkast/`-prefixet i kartan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skarp generering/sändning för event E tar bort utkast/E/ — API-test: utkast finns före, saknas efter, skarp operation lyckas även om remove fallerar
- [ ] #2 .purge-staging-policy.json bär utkast-targeten; scripts/check-listparitet.sh och purge-testsviten gröna
- [ ] #3 T171 och Storage-layout-dokumentet bär utkast-prefixet; ADR-124 § Kända rester nämner prod-städningen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
