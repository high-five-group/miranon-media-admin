---
id: TASK-8.5
title: 'Skiva: QA-planen — Lugnt laddläge'
status: Done
assignee: []
created_date: '2026-07-11 22:55'
updated_date: '2026-07-18 16:37'
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
- [x] #1 Testplanens 8 punkter genomförda i webbläsaren och godkända av Marcus
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
QA-planen genomförd S67 i preview-formen (4173 — byggt staging-bygge med skarp SW + persist = planens 'prod-lika staging'; kallstarterna arrangerade via Clear site data) · Marcus-kvittens: helhetsgodkännandet 'Nu godkänner jag allt.' · FYND per planens regel (planen orörd): task-8.6 skeleton-tonen — ospecat designutrymme (L269-klassen: 'vääldigt gråa'), rotorsakad till WCAG 1.4.11-feltillämpning, åtgärdad till branschbandet (neutral-200 via --mm-bg-placeholder) och Marcus-godkänd 'Det blev bättre. Det är OK tillsvidare.' inom vågen · DoD 6 layout-skift ≈ 0: buren av 8.4:s renderade boundingBox-mätning (hem-laddlage-sviten, CI-grön i PR #55 → main) — bevisad FÖRE granskningen · DoD 5 design-review godkänd (kallstart + varm start + tonjusteringen).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [x] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
