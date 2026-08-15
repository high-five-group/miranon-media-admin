---
id: TASK-228
title: >-
  Fynd: Deltagare-blockets Åtgärder-knapp visar interim-platshållaren - koppla
  urvalet till Åtgärds-sidan
status: To Do
assignee: []
created_date: '2026-08-15 22:59'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 430000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 6 (Marcus 2026-08-16): Markera personer på eventdetaljen + Åtgärder-klick visar texten 'Åtgärds-sidan är inte byggd ännu' (src/components/events/detail/Deltagare.tsx rad ~579-591, INTERIM-PLATSHÅLLAREN AC #3) - trots att sidan ÄR byggd sedan TASK-147-serien (/atgarder, AtgardsSida.tsx). Interimen byggdes medvetet före 147; ombkopplingen gjordes aldrig när sidan landade. QA-kortet 147.9 steg 1 FÖRVÄNTAR flödet ('Markera 2 deltagare på eventdetaljen - Åtgärder - mottagarna är SAMMA kort'). GÖR: ersätt platshållaren med navigation till /atgarder med urvalet medskickat; verifiera FÖRST hur AtgardsSida faktiskt tar emot mottagare (147-bygget kan ha byggt intag) och följ det - bygg inget nytt intag utan att ha läst det befintliga. 147.9 är blockerad tills detta är gjort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Markera på eventdetalj + Åtgärder navigerar till Åtgärds-sidan med exakt de markerade som mottagare
- [ ] #2 Interim-platshållaren och dess villkorskod borttagna
- [ ] #3 DoD-kvartetten grön + berörda acceptance-/webbläsarfall gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
