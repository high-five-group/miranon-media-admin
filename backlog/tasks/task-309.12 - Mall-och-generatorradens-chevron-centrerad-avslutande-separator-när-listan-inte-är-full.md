---
id: TASK-309.12
title: >-
  Mall- och generatorradens chevron centrerad + avslutande separator när listan
  inte är full
status: To Do
assignee: []
created_date: '2026-08-24 16:33'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 575000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två fynd ur Marcus granskning 2026-08-24 av den promoverade dokumentytan (ADR-103 B2 steg 2).

(1) REGRESSION mot den godkända prototypformen. Prototypen (1ec70a85^:src/components/dokument/prototyp/GenereringsPrototyp.tsx rad 483 resp. 511) bar 'flex items-center gap-3 py-3' på både mall- och generatorraden. Den promoverade koden bär 'items-start'. Vänsterkolumnen har tre led (namn/täckning/meta) medan handlingsytan är en enda 44 px-knapp, så chevronen klistras i radens överkant i stället för att stå centrerad. Trolig orsak: DokumentRadSkal (bilageraden) bär items-start med rätta — den har fyra ikonknappar — och formen kopierades till rader som bara har en.

(2) NYTT önskemål, inte en regression: prototypen bar samma divide-y utan avslutande linje. Marcus: 'Vår ruta visar 4 rader innan den blir inline-scroll, men om det bara är två rader så ser det dumt ut att den nedersta raden (dokumentet) inte har en separatorlinje nedtill.' Regeln blir olikhet mot golvet, inte 'mindre än': exakt fyra rader är det enda läget där ytans egen kant redan gör separatorns jobb (LISTA_MAXHOJD är mätt för att klippa exakt över separatorn). Kortare lista slutar naket; längre lista har sin sista rad bortom den låsta höjden och den som rullar dit ska mötas av en avslutad lista.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mall- och generatorraden bär items-center — chevronen vertikalt centrerad mot radens tre led, samma form som den godkända prototypen
- [ ] #2 Sista raden i dokumentlistan bär en avslutande separator när antalet synliga rader är skilt från LISTA_SYNLIGA_RADER (4) och större än 0; vid exakt 4 rader ritas ingen (ytans kant avslutar)
- [ ] #3 Tom-raden ('Inga bilagor för det här eventet än.') bär aldrig separator
- [ ] #4 npm run test:acceptance -- dokument grön; axe 0 violations kvar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
