---
id: TASK-326
title: 'Beslut: nattjobbets fetch-depth: 1 vs pekarsanningen (ADR-127 § B4-amendering)'
status: To Do
assignee: []
created_date: '2026-08-26 04:59'
updated_date: '2026-08-26 07:11'
labels:
  - ready-for-human
  - beslut
dependencies: []
ordinal: 599000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-319 (verifierat existerande, PR #1985, merge-commit 7ac4b6c67bc18b667108ce5567acf3fff78d6e28, mergad 2026-08-26T04:26:22Z, titel 'fix: [S112 fix-våg 4, bunt E] closure-grindens landnings-pekare — sanning + bokföring') bygger ancestry-verifiering av 'Landning: PR #N'. ADR-127 § B4 (verifierat: docs/decisions/ADR-127-backlog-stangningsformerna-harledd-dod-och-avstadda-krav.md rad 129-132, 193, 232, 236) anger explicit att nightly.yml:s backlog-closure-jobb checkar ut med fetch-depth: 1, vilket i natten gör grinden oförmögen att verifiera pekarens ancestry — den rapporterar i så fall '11 pekare OPRÖVADE' i stället för att fälla ett påhittat PR-nummer. Mätning citerad i uppdraget (KÄLLA EJ ÅTERFUNNEN i denna sessions sökning av docs/tasks/backlog — flaggas som OBELAGD, S112 resume 1, 2026-08-26): full klon +0,08 procent (20,999 s vs 20,982 s), landningsmängd 0,838 s/5575 commits; CI-tid ännu ej mätt. Beslutet att fatta: aktivera fetch-depth: 0 för nattjobbet + amendera ADR-127 § B4, eller behålla degraderat läge (OPRÖVAD-rapportering kvarstår).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CI-tid mätt i ett dispatch-run före beslut (den lokala 0,08-procentssiffran ovan är OBELAGD i repots artefakter och måste omprövas, inte kopieras vidare)
- [ ] #2 ADR-127 paragraf Updates bär beslutet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
POINTER TILL S112 DEL 5 (S112 resume 1, 2026-08-26): tasks/sessions/2026-08-24-session-112.md rad 366+ (landad #2004, merge-commit 9b3a2581) bar landningstabellen for fix-vaga 4 och naromnar bunt E (TASK-319/PR #1985): '319 ancestry-verifiering av Landning:-pekare (89/0, mutationsbevis; +0,08 % lokalt) ...'. DIVERGENS FLAGGAD (ADR-086): uppdragets pastaende att de FULLSTANDIGA mattvarderna ('full klon 20,999 vs 20,982 s, 0,838 s/5575 commits') samt 'B1-agentens task edit-race 2026-08-26' skulle vara 'nu bokforda i sessionsdok S112 Del 5' stammer INTE ordagrant — grep over hela session-112.md efter '20,999'/'20,982'/'0,838'/'5575'/'B1-agentens' gav NOLL traffar. De fullstandiga mattvardena finns i STALLET pa TASK-319s eget kort (Implementation Notes, verifierat: 'full klon 20,999 s vs grund klon 20,982 s (+0,08 %, LOKALT 2026-08-26 pa macOS...), landningsmangden byggs pa 0,838 s over 5575 commits'). 'B1-agentens task edit-race'-attributionen ar redan sjalv flaggad som obelagd av TASK-327s egna notes (S112 resume 1). Ratt kalla for de exakta talen ar darfor TASK-319, inte Del 5 — Del 5 bar bara den forkortade '+0,08 % lokalt'-versionen.
<!-- SECTION:NOTES:END -->
