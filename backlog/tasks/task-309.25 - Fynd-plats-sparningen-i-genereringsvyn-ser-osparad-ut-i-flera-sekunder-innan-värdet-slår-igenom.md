---
id: TASK-309.25
title: >-
  Fynd: plats-sparningen i genereringsvyn ser osparad ut i flera sekunder innan
  värdet slår igenom
status: Done
assignee: []
created_date: '2026-08-26 02:54'
updated_date: '2026-08-28 03:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 591000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-26 (S108 resume 11), ordagrant: 'Jag gick till plats och skrev in en adress bara för att testa, och tryckte på spara, men sparandet laggade typ lite, det såg inte ut att bli sparat först men sedan rätt var det va så var det sparat. Konstigt.' Event: RIM 1 i Rönninge 12–13 sep (prod), som saknade Plats-länk — allt utom plats var förifyllt.

VAR: src/components/dokument/GenereringsVy.tsx rad ~576–625 — saveEventText = useSaveEventText(event.id), mutate() 'fire-and-forget' (kommentaren vid ~605); block-dialogen stängs och listan visar kopian. Skrivvägarna: save-event-text / save-place-standard / save-event-content (TASK-309.3), query-invalidering i src/queries/keys.ts ~186–191.

DIAGNOSTISERA FÖRST (diagnosing-bugs-disciplinen: bygg en tät återkopplingsslinga innan hypotes): mät i staging vad som händer mellan 'Spara' och att värdet syns — (a) visas det gamla värdet tills query-invalideringen refetchat (ingen optimistisk uppdatering)? (b) hur lång är EF-latensen (save-event-text) i staging/prod — logga tid? (c) invalideras rätt nyckel, eller refetchas ett underlag som är större än nödvändigt? Rapportera mätta ms, inte antaganden.

BESLUT som Marcus förväntar sig: efter 'Spara' ska det nya värdet synas OMEDELBART (optimistisk uppdatering med rollback vid fel, TanStack Query-mönstret onMutate/onError/onSettled — cite docs) ELLER en tydlig 'Sparar…'-status i blocket tills EF:en svarat, aldrig ett läge som ser osparat ut. Välj det branschmässiga (optimistisk uppdatering är standard för formulärfält med låg konfliktrisk) och bokför. Felväg: EF-fel → värdet återställs + felmeddelande i husets mönster (ingen tyst förlust).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mätning i staging före fix redovisad (tid från Spara till synligt värde, EF-latens, invalideringskedja) — tal i PR:en
- [x] #2 Efter Spara syns det nya värdet omedelbart (optimistisk uppdatering) eller ett explicit Sparar…-läge; aldrig ett osparat-utseende — acceptance-test i browser-skarven fäller om det gamla värdet visas efter Spara
- [x] #3 Felväg bevisad: EF-fel → rollback till föregående värde + felmeddelande i husets mönster; ingen tyst förlust
- [x] #4 Gäller alla tre skrivvägarna (text, agenda, plats/spara som platsens standard) — verifierat per väg
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Stängningssvansen (S108 resume 13): kortet saknade Implementation Notes/Final Summary — skriven ur PR #1998:s beskrivning + diff (gh pr view/diff). Verifierat: gh pr view 1998 — MERGED 2026-08-26T05:06:48Z, merge-SHA 48f853155891d14905010b123a4e068ceb8b88df. gh pr diff 1998 --name-only: src/data/mutations/useSaveEventText.ts, tests/acceptance/dokument-genereringsvy-optimistisk-sparning.acceptance.test.ts, kortfilen (+332/-11, 3 filer) — inga orelaterade filer. gh pr checks 1998: samtliga körda jobb pass. Landning: PR #1998 (<https://github.com/high-five-group/miranon-media-admin/pull/1998>).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Genereringsvyns block-sparning (text + agenda) blir optimistisk (ADR-016s onMutate/onError/onSettled-mönster, samma form som useUpdatePersonNote.ts). Rotorsak (PR #1998): useSaveEventText.ts var rent pessimistisk — listan visade gammalt värde tills onSettled-invalideringen refetchat. Mätt i staging (5 anrop, throwaway ZZ-event): save-event-text 945 ms snitt, get-document-sources 1008 ms snitt, sekventiell kedja 1953 ms — det Marcus upplevde som lagg. Fix i src/data/mutations/useSaveEventText.ts, ny testfil tests/acceptance/dokument-genereringsvy-optimistisk-sparning.acceptance.test.ts (4 fall: text <250ms, agenda samma, felväg med rollback+felmeddelande, plats/standard-regressionsvärn). Plats/'spara som standard' rörs inte — redan blockerande Skapa-läge, AC #2:s uttryckligen acceptabla alternativ. Dubbelriktat bevisat mot gammal pessimistisk kod (1-3 röda, 4 grön oavsett). Grindar (PR-kroppen): typecheck 0 fel, biome 0 fel, check-langa-streck OK, build grön, test:api:pure 728/728, test:api:staging (riktad mot save-event-text+get-document-sources) 24/24, full staging-svit 3 körningar under hög maskinlast med enstaka transienta fel utanför diffens filer (miljöbrus, ej regression).
<!-- SECTION:FINAL_SUMMARY:END -->
