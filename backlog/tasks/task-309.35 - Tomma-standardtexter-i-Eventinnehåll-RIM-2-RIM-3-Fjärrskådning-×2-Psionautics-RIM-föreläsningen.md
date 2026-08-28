---
id: TASK-309.35
title: >-
  Tomma standardtexter i Eventinnehåll: RIM 2, RIM 3, Fjärrskådning ×2,
  Psionautics, RIM-föreläsningen
status: To Do
assignee: []
created_date: '2026-08-28 03:01'
updated_date: '2026-08-28 03:08'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-309
ordinal: 606000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
HELT MARCUS/LOTTA-ARBETE — inget agent-bygge i detta kort.

FAKTA (källa: PR #2028:s beskrivning, verifierad verbatim 2026-08-28 via
`gh pr view 2028 --json body`):

"Mätt: 7 Eventinnehåll-kombinationer existerar, bara RIM 1 har text ifylld —
RIM 2, RIM 3, Fjärrskådning ×2, Psionautics och RIM-föreläsningen är tomma i
båda baserna. När de fylls vet ingen om de ryms."

Höjdanpassningen (TASK-309.27, PR #2028) bygger en trappa som skalar
innehållet ned om det inte ryms på en sida — men den är bara PRÖVAD mot RIM 1
(som redan har fullständig text). De sex övriga kombinationerna är tomma i
BÅDA Airtable-baserna och har därför aldrig testat trappan mot verkligt
innehåll av okänd längd.

GÖR: Roger och Lotta fyller i standardtexterna för de sex tomma
Eventinnehåll-kombinationerna (RIM 2, RIM 3, Fjärrskådning ×2, Psionautics,
RIM-föreläsningen) i BÅDA Airtable-baserna (staging `apphjj8Q7lkXCMsL4`,
prod `app8uGPrVCVOm6LfD`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Innehåll ifyllt i staging OCH prod (Marcus/Lotta)
- [ ] #2 En bilaga per typ renderad via npm run mall:pdf eller genereringsvyn
- [ ] #3 Sidantal = 1 verifierat per typ
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
