---
id: TASK-8.5
title: 'Skiva: QA-planen — Lugnt laddläge'
status: To Do
assignee: []
created_date: '2026-07-11 22:55'
labels:
  - ready-for-human
dependencies:
  - TASK-8.1
  - TASK-8.2
  - TASK-8.3
  - TASK-8.4
parent_task_id: TASK-8
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell browser-testplan för hela Lugnt laddläge-leveransen — Marcus-exekverad slutgrind för TASK-8-PRD:n. Testplan (prövas i webbläsaren, prod-lika staging):

1. ALLRA-FÖRSTA STARTEN: rensa webbplatsdata (eller privat fönster) → logga in → Hem ska rendera rubriker + kort-ytor DIREKT i slutstorlek; endast datakropparna visar lugna skeleton-block (per 8.1:s låsta form: direkt eller efter ~1 s); när datat landar byts block mot innehåll utan att NÅGOT flyttar sig.
2. VARM START: stäng fliken → öppna appen igen → senast kända data ska synas OMEDELBART ('det ska bara vara där') — inget synligt laddande; verifiera i nätverkspanelen att en tyst bakgrundshämtning ändå sker.
3. UTLOGGNING: logga ut → logga in igen → tidigare data ska INTE blinka förbi; kallstartsformen (skeleton) visas igen eftersom cachen tömts.
4. REDUCED-MOTION: slå på 'minska rörelse' i systeminställningarna → skelettet ska stå STILLA (inga shimmer-vågor).
5. FÖRSTÄRKT KONTRAST: prefers-contrast: more → skelettblocken ska förbli urskiljbara.
6. OFFLINE: öppna appen utan nät (efter tidigare besök) → senast kända data visas.
7. SNABB LADDNING (om 8.1 låste fördröjd form): vid snabba svar ska INGEN skeleton blinka förbi.
8. HELHETEN mot Marcus-kravet: 'inget ska röra sig, helst inget synligt laddande alls' — bedöm subjektivt att laddupplevelsen är lugn eller osynlig.

Godkänd testplan = PRD:ns sista grind. Fynd → NYTT kort med exakt symptom + förväntat beteende (planer retuscheras aldrig). Täcker användarberättelser: helheten (1–16).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Testplanens 8 punkter genomförda i webbläsaren och godkända av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [ ] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
