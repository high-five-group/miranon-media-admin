---
id: TASK-309.25
title: >-
  Fynd: plats-sparningen i genereringsvyn ser osparad ut i flera sekunder innan
  värdet slår igenom
status: To Do
assignee: []
created_date: '2026-08-26 02:54'
updated_date: '2026-08-26 04:41'
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
