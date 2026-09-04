---
id: TASK-389
title: >-
  Fynd: Mer → Anmälningar-raden leder till eventets gamla Anmälda-lista i
  stället för anmälans sida — länkbyte + rivning av anmalda-ytan (18.13-skulden)
status: To Do
assignee: []
created_date: '2026-09-04 09:54'
labels:
  - ready-for-agent
dependencies: []
ordinal: 686000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (Marcus 2026-09-04, S120 Del 1): klick på en rad i Mer → Anmälningar landar på /event/$eventId/anmalda (src/components/events/EventRegistrations.tsx, Fas 6c L2, juni 2026) — eventets HELA deltagarlista som fält/värde-rader med utskrifts-golv (break-inside-avoid), inte anmälan man tryckte på. Anmälans egen sida finns sedan TASK-18.17 (/event/$eventId/anmalan/$registrationId, AnmalanDetail, S83-facit, Avboka/Boka om sedan S115). Länken bor i src/components/registrations/AnmalningarSida.tsx rad ~838 (<Link to="/event/$eventId/anmalda"> på OK-rader; rader utan event öppnar AnmalningRadResolution — oförändrat). FORENSIK: TASK-18.13 (2026-07-23, Marcus beslut A) bokförde rivningen som gated: 'anmälda-ytan när task-18.17 (per-anmälan-detaljvyn) kan ta över AnmalningarLists länkmål'. 18.17 landade, övertagandet gjordes aldrig; S111:s promovering (TASK-299.5) bar det gamla länkmålet vidare. S111-facitet (tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json) låser radens FORM (namnet som helradslänk, chevron), inte länkens mål — DOM och pixlar är oförändrade av bytet. Marcus vägval 2026-09-04: A, länkbyte + rivning i ETT kort. RIVNINGSYTA (disk-verifierad 2026-09-04; enda konsumenten av routen är länken ovan, grep i src): src/routes/_authenticated/event/$eventId/anmalda.tsx · src/components/events/EventRegistrations.tsx · src/components/events/AddRegistrationModal.tsx (gammal fyrfälts-modal, ersatt av manuell anmälan-sidan per 18.13) · tests/acceptance/event-anmalda.acceptance.test.ts (6 tester) · tests/acceptance/event-add-registration.acceptance.test.ts (5) · tests/visual/event-anmalda.spec.ts + dess baseline-bilder · docs/byggplan.md rad ~709 (filraden). Syskonet i 18.13:s inventarium (standalone-närvaron narvaro.tsx + EventAttendance) INGÅR INTE — gated på check-in-sidan. Källor: S120 sessionsdok Del 1 · task-18.13 § SCOPE-KORRIGERING 2 · task-18.17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 OK-rader i Mer → Anmälningar (rad med eventId) länkar till /event/$eventId/anmalan/$registrationId med radens reg.id; rader utan event öppnar fortfarande kopplingsdialogen. Bevisat i tests/acceptance/mer-anmalningar*.acceptance.test.ts (länkmålet asserterat, inte bara att en länk finns).
- [ ] #2 Routen /event/$eventId/anmalda, EventRegistrations.tsx och AddRegistrationModal.tsx är rivna; routeTree.gen.ts regenererad; grep -rn anmalda src tests ger noll träffar i kod (prosa-omnämnanden undantagna); typecheck 0, biome 0, build grön.
- [ ] #3 De tre testfilerna för den rivna ytan är rivna inklusive visuella baselines och eventuella aria-snapshots; test:visual och acceptance-klassen gröna utan dem (inga föräldralösa snapshot-filer kvar).
- [ ] #4 Anmälningssidans promoverings-grind (tests/visual/__aria__/anmalningssidan-promoverings-grind.spec.ts) grön OFÖRÄNDRAD — formen är orörd, s111-facitet amenderas inte.
- [ ] #5 docs/byggplan.md: filraden för anmalda.tsx uppdaterad med rivningsnot (18.13-skulden betald i detta kort); task-18.13 orört (Done), betalningen bokförs i detta korts notes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
