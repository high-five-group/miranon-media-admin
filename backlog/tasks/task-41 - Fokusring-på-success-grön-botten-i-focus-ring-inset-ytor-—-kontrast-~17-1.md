---
id: TASK-41
title: 'Fokusring på success-grön botten i focus-ring-inset-ytor — kontrast ~1,7:1'
status: To Do
assignee: []
created_date: '2026-07-25 01:48'
labels: []
dependencies: []
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur task-18.16:s review-pilot (2026-07-25), icke-blockerande. SYMPTOM: --mm-focus-ring (#1B4965) mot --mm-success (#606B57) ger ~1,7:1. Ofarligt där ringen ritas som outline med offset UTANFÖR knappen (mot omgivande yta), men i en .focus-ring-inset-yta hamnar ringen PÅ den gröna bottnen. Systemisk egenskap för ALLA success-knappar (växande klass sedan grön-knapp-regeln, DESIGN-SYSTEM-SPEC §19) — inte en enskild ytas bugg. FÖRVÄNTAT: fokusringen håller icke-text-kontrastgolvet (WCAG 1.4.11, 3:1) mot sin faktiska botten även i inset-läget; regel/vakt-rad i ACCESSIBILITY-CHECKLIST.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
