---
id: TASK-40
title: Numrutans prefers-contrast-more-avgränsning (18.15-review-fynd)
status: To Do
assignee: []
created_date: '2026-07-25 00:58'
labels: []
dependencies: []
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review-pilot-fynd (task-18.15, utanför skivans scope; T86). SYMPTOM: åtgärds-radernas numruta (bg-surface/neutral-0 på kortets bg-muted/neutral-50) har nära osynlig avgränsning och saknar contrast-more-hantering — jämför check-in-kortets contrast-more:border-border-strong-mönster. Siffran själv har god kontrast (text-secondary på vit) så informationen bärs; design-systemets regel 'varje komponent ska klara prefers-contrast: more' kan ändå motivera en avgränsningskant. FÖRVÄNTAT BETEENDE: medvetet beslut om contrast-more:border på numrutan — obs att rutans form är Marcus-låst 18.15-facit (vit, 24x24, rounded-lg), så en kant är en facit-justering som tas öppet, inte tyst i en skiva.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fött ur review-pilotens utanför-scope-sektion 2026-07-25 (granskat träd e9cff7d8). Oetiketterat tills Marcus klassar (ADR-053).
<!-- SECTION:NOTES:END -->
