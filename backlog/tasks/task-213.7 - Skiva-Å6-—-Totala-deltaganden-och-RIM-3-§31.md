---
id: TASK-213.7
title: 'Skiva: Å6 — Totala deltaganden och RIM 3 (§31)'
status: To Do
assignee: []
created_date: '2026-08-14 17:23'
labels:
  - ready-for-human
dependencies:
  - TASK-213.2
parent_task_id: TASK-213
ordinal: 394000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: `Totala deltaganden` och `Erfarenhetsnivå (Miranon Media)`
räknar med RIM 3-eventens Deltaganden i stället för att missa en hel
eventtyp. Peka konsumenter till `Antal genomförda event`
(`flddy8JND3YnlgZxe`) — live-kartans fix-kandidat — eller utöka formeln med
`{RIM 3 ×}`.

**Mjuk deadline, uttryckligen nedprioriterad medvetet:** första RIM
3-eventet är 2026-09-05 (10 anmälda), nästa 2026-11-28 (9); 36
RIM 3-Deltaganden på 17 personer väntar. Fältet når INTE UI — det stannar i
EF-lagret (`get-persons/index.ts:34,38,39` m.fl.) och renderas av ingen
komponent, så deadlinen gäller datakorrekthet i backend-lagret, inte en
skärm Lotta ser direkt — därför P2, trots datumet.

Verifiering: efter fixen ska en person med genomförd RIM 3 ha `Totala
deltaganden` = `Antal genomförda event`.

**HITL — Marcus-moment, obligatoriskt.** Formeländring i Airtables UI,
riskklass R1. Prod-mutationen sker ALDRIG utan uttalat Marcus-GO för just
denna skiva.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P2 · Å6, med underlag
i `bas-defekt-kartlaggning-live-2026-08-14.md` § Fällorna 31, 32 och 34 och
`bas-defekt-konsumtionskarta-2026-08-14.md` §31.

Täcker användarberättelser: 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Totala deltaganden (eller konsumenterna av det) pekar om till Antal genomförda event (flddy8JND3YnlgZxe), eller formeln utökas med {RIM 3 ×} — beslutat och dokumenterat
- [ ] #2 Efter fixen: en person med genomfört RIM 3-event har Totala deltaganden = Antal genomförda event, verifierat i staging
- [ ] #3 Rollback-väg: den gamla formeltexten sparad verbatim
- [ ] #4 Marcus-GO för prod-mutationen inhämtat och citerat innan formeln ändras i prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->
