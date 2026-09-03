---
id: TASK-374.4
title: >-
  Skiva: Rivningen och regressionslåset — växel, variant-post, fyllnadsläge och
  prototypmapp bort, markören avregistrerad i samma commit, visual-baslinjen
  om-baselinjerad efter godkännandet
status: To Do
assignee: []
created_date: '2026-09-03 09:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-374.3
parent_task_id: TASK-374
ordinal: 679000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter landningen finns bara en Intresserade-vy i källkoden — den godkända formen — och inget villkor, ingen växel och ingen fyllnadsdata kan längre visa något annat. Facit-grinden är grön eftersom markören dog i samma commit som koden, och regressionslåset (ariaSnapshot-paret + den nya visuella baslinjen) bär den godkända formen framåt. Täcker användarberättelser: 18, 19, 20
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prototyp-substratet rivet enligt ADR-103 B2 steg 4: variant-växeln, variant-posten i prototyp-railen, dataläget ?data=fyll och fyllnadsfabriken, prototypmappen tömd; inga [PROTOTYPE]-markörer eller ?variant-/?data-grenar kvar för intresserade (grep-svep bilagt i Final Summary)
- [ ] #2 Markören IntresseradeKonvergens avregistrerad ur .facit-policy.conf i SAMMA commit som koden rivs; bash scripts/check-facit.sh exit 0 efter (slutraden citerad)
- [ ] #3 Den promoverade formen är byte-identisk före och efter rivningen: ariaSnapshot per läge oförändrad i båda vyporterna, grind-specen grön
- [ ] #4 Visual-baslinjerna för Intresserade (fyra bilder) om-baselinjerade via CI-workflowen visual-baselines.yml EFTER Marcus godkännande i 374.3, aldrig lokalt och aldrig före; ändringen bokförd i commit-meddelandet som avsiktlig; visual-sviten grön
- [ ] #5 Acceptance-, grind- och API-sviterna gröna på rivningscommiten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning utförd och bokförd mot tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista (bild facit-intresserade-lista.png) — formen i bilden slår varje prosa (ADR-102 B1)
- [ ] #5 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [ ] #6 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->
