---
id: TASK-213.12
title: >-
  Skiva: Rot-orsaks-fixen — Person-länka anmälningarna utan Deltaganden-rader +
  fälla-registrering
status: To Do
assignee: []
created_date: '2026-08-14 19:23'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-213
ordinal: 410000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rot-orsaks-läkningen bakom promoveringens CREATE-backup (S103 Del 15 F2/F6 — Marcus: symptom behandlas aldrig, rotorsaken läks). Prod-mätningen 2026-08-14 fann fyra aktiva anmälningar utan Deltaganden-rader på kommande event: tre på Event-55 (3–4 okt, record-ID:n i Del 15) och en på Event-25 (5–6 sep), samtliga utan Person-länk och utan Källa — fälla 16/21-klassen. Fälla 21:s live-fall visar att Person-länkning läker raderna via automationskedjan. HITL: prod-mutationer kräver Marcus GO per skiva-regeln i 213-familjen. Körs FÖRST i bas-vågen — oktober-eventet är närmast berört.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exakt mätning bilagd: per anmälan på samtliga kommande event — vilka aktiva anmälningar saknar Deltaganden-rader (utgångsdata: S103 Del 15-tabellen)
- [ ] #2 De identifierade anmälningarna Person-länkade i prod, en i taget på Marcus GO per mutation
- [ ] #3 A-kedjan verifierad efter varje länkning: Deltaganden-raderna finns och är korrekt sessionssatta
- [ ] #4 Fälla-instansen registrerad i defekt-registret med rot-orsak (anmälan utan Person-länk bryter A3/A11-kedjan) och mätdata
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
