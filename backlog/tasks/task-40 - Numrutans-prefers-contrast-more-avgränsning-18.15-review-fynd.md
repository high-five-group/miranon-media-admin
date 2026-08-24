---
id: TASK-40
title: Numrutans prefers-contrast-more-avgränsning (18.15-review-fynd)
status: Done
assignee: []
created_date: '2026-07-25 00:58'
updated_date: '2026-08-24 15:46'
labels:
  - ready-for-human
  - wontfix
  - intentionally-unchecked
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

Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Motiv: objektet (Åtgärds-sidans numrerade rader/numruta) rivet via TASK-162.2. Verifierat mot Atgarder.tsx 2026-08-24 innan stängning; ingen divergens.

OBOCKAT MED AVSIKT: förkastat (wontfix) — samma rivna objekt som TASK-39.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-24 14:41
---
WONTFIX 2026-08-24 (S112, Marcus-mandat): objektet fyndet gäller är rivet. src/components/events/detail/Atgarder.tsx (rad 37-51, 83-91, 257-274) dokumenterar att Åtgärds-gruppen — sektionen med den vita NumRuta (bg-surface/24x24) detta fynd (saknad prefers-contrast:more-avgränsning) rör — är PROMOVERAD BORT via TASK-162.2 (ADR-103 B2 steg 1): 'den gamla grenen fanns bakom ?variant=a-villkoret, nu riven (git bevarar)'. Ersatt av AtgarderKort ('Gå till åtgärder') + SkrivUtKort utan numruta-formen. Kontrast-avgränsningsfrågan fyndet beskrev finns inte kvar att åtgärda.
---
<!-- COMMENTS:END -->
