---
id: TASK-147.8
title: 'Skiva: Mailto-rivningen, grå löftena och namnet'
status: To Do
assignee: []
created_date: '2026-08-10 07:04'
updated_date: '2026-08-10 11:43'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.2
  - TASK-147.3
  - TASK-147.4
parent_task_id: TASK-147
priority: high
ordinal: 345000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Gamla vägar rivs när de nya bär: mailto-vägarna ut ur utskicksflödena med mekanisk grind som fäller återinförsel. Eventsidans Åtgärds-grupps rader som pekar på flöden som nu bor på åtgärdssidan rivs eller blir genvägar — numreringen är byggkrav, referentbarheten hanteras uttryckligen vid rivning (PRD § Implementationsbeslut). Namnkollisionen (två Åtgärds-ytor: sidan + eventsidans grupp) löses per Marcus-beslut bokfört i kortets notes. PrototypRigg i AtgardsSida.tsx rivs — dess egen docblock väntar på just 147:s riktiga sändväg; referens-specen (tests/visual/atgardssida-promoverings-grind.spec.ts) omriktas mot verkliga utfallslägen. Avblockar task-171.6 (hopkopplingen).

Täcker användarberättelse 14 fullbordad (stämplingslögnen helt stängd).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Noll mailto-vägar i utskicksflödena, fälld av mekanisk grind — inte ögonkontroll
- [ ] #2 Eventsidans döda åtgärdsrader rivna eller genvägar; numrering + referentbarhet bokförd
- [ ] #3 PrototypRigg riven; referens-specen grön mot verkliga utfallslägen
- [ ] #4 Namnkollisionen löst per Marcus-beslutet i kortets notes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-08-10 (S102, namnkollisionen): åtgärds-sidan behåller namnet 'Åtgärder'; eventsidans länkgrupp döps om till 'Genvägar'. Kvitterat i klartext i huvudsessionen.

TILLÄGG (S102-batchen kort ⑤:s fynd): PrototypNot-komponentens användarsynliga copy ('Inget skickas, inget sparas.') är delvis osann sedan betalningsskrivningen blev skarp — den rivs/revideras naturligt i DENNA skiva när sändvägen också är skarp och riggen rivs. Facit-låst copy: ändringen ingår i omstämplingsytan.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Mailto-frånvaron mekaniskt fälld: noll mailto-vägar kvar (PRD DoD 6-arv)
<!-- DOD:END -->
