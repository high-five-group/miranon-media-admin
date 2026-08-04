---
id: TASK-138
title: >-
  Fynd: check-thread-index.sh:s felmeddelande föreslår ett pipe-escape som inte
  fungerar
status: To Do
assignee: []
created_date: '2026-08-04 12:11'
updated_date: '2026-08-04 12:12'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 223000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTT 2026-08-04 (T119-passets agent, S96 slutbunt). scripts/check-thread-index.sh rad 122 (pipe-kolumnkontrollens fel-gren, rad ~119-125) skriver: "Fix: escapa pipe-tecken i titel/ingång som \| — annars läser varje maskinell läsare fel kolumn." Rekommendationen fungerar INTE: skriptets egen räkning (rad 119) är `PIPES="${line//[^|]/}"` — detta stryker bort ALLA icke-pipe-tecken ur raden, inklusive det inledande backslash-tecknet i \|, så en escapad pipe räknas fortfarande som en pipe i ${#PIPES}. Bekräftat oberoende (denna agent, isolerad bash-repro): `line="| \`T01\` | test \| pipe | active |"`; `PIPES="${line//[^|]/}"`; `${#PIPES}` gav 5 — samma antal som utan escape. Mätt av T119-passets agent (rapporterat: röd→grön först efter att literala pipe-tecken togs bort ur cellinnehållet helt — escape-vägen prövades och gav ingen ändring). ÅTGÄRDSRIKTNING (ej beslutad design): rätta felmeddelandet rad 122 till att rekommendera "undvik literala pipe-tecken i cellinnehåll" i stället för ett escape som inte verkar, och överväg ett testfall i scripts/test-check-thread-index.sh som prövar just detta (planterad rad med \| ska fortsatt fällas av kolumnkontrollen, för att bevisa att escape inte är en giltig kringgång).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Felmeddelandet i scripts/check-thread-index.sh (nuvarande rad ~122) rekommenderar inte längre ett pipe-escape som inte fungerar mot skriptets egen ${line//[^|]/}-räkning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
