---
id: TASK-147.8
title: 'Skiva: Mailto-rivningen, grå löftena och namnet'
status: Done
assignee: []
created_date: '2026-08-10 07:04'
updated_date: '2026-08-10 18:16'
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
- [x] #1 Noll mailto-vägar i utskicksflödena, fälld av mekanisk grind — inte ögonkontroll
- [x] #2 Eventsidans döda åtgärdsrader rivna eller genvägar; numrering + referentbarhet bokförd
- [x] #3 PrototypRigg riven; referens-specen grön mot verkliga utfallslägen
- [x] #4 Namnkollisionen löst per Marcus-beslutet i kortets notes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-147.8 BYGGD (bygg-agent, S102). Premiss-pass (ADR-086) fann EN källmärkt divergens mot uppdragstexten: PrototypNot-copyn "Inget skickas, inget sparas." (citerad i kortets tillägg) fanns INTE på disk vid start - TASK-147.5 hade redan bytt ut den (commit 9742334a/1aea42d2, PR #1128, landad FORE denna skiva). Byggdes inte vidare pa citatet; PrototypNot reviderades ändå (etikett "Prototyp." -> "Mallar.", reassurance-satsen riven) enligt tilläggets ANDA (produktionssida ska inte bära prototyp-etikett), se AtgardsSida.tsx:s egen docblock för hela resonemanget.

AC #4 (namnkollisionen) krävde en tolkning: ingen synlig rubrik "Åtgärder" finns idag på eventsidan (den revs redan i TASK-162.2) - kollisionen satt i INTERN terminologi ("åtgärds-ytan" i kommentarer/testtitlar). Löst genom namnbyte av just den terminologin till "genvägar-ytan"/"Genvägar-ytan" i LIVE källkod och testfiler (Atgarder.tsx, EventDetail.tsx, event-detail.staging.test.ts, event-deltagare.staging.test.ts, eventsida-promoverings-grind.spec.ts) - INGEN ny synlig rubrik lades till (hade varit en obehörig formändring mot det ADR-102/103-låsta facit). Historiska dokument (docs/research/*, docs/decisions/ADR-102*/ADR-103*, backlog/tasks/task-162*) rörda EJ - frusna historiska artefakter.

FYND, ej åtgärdat (utanför scope, orelaterad fil): npm run test:api visar 570/571 - tests/api/generate-event-attachment.staging.test.ts:164 fäller pa ett hardkodat 4-fält-antagande (fields-set) som blev falskt när TASK-147.5 (redan landad på main, commit 9742334a) lade till Lagringsnyckel-fältet i samma EF utan att uppdatera detta tests assertion. Verifierat FORE mina ändringar (git diff origin/main mot filen är tom) och verifierat att detta INTE gatear PR-ytan (ci-suite.yml test-staging-jobbet är if: inputs.run_staging, villkorslöst false på PR-ytan per .ci-parity-policy.json). Rekommenderas en egen liten fix-skiva eller tråd-registrering - ej gjort här (skulle ha krävt en fil utanför denna skivas scope).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Done S102 batch ⑭ (Marcus tak-utvidgning i klartext 'Kör 147.8 också, koppla ingången'): PR #1133, merge 1b5b7592, commit 8535fc8e. Ingången kopplad (AtgarderKort → HandlingsLank-navigation), mailto-grinden byggd med tvåsidigt bevis (check-mailto.mjs + policy + 13-kontrollers självtest), PrototypRigg riven, namnet per Marcus-beslut. Aria-delta: atgarder-kort button→link (eventsidans facit), dokumenterat. CI grön per jobb via kön.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Mailto-frånvaron mekaniskt fälld: noll mailto-vägar kvar (PRD DoD 6-arv)
<!-- DOD:END -->
