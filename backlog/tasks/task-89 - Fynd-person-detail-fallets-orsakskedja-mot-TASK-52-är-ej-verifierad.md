---
id: TASK-89
title: 'Fynd: person-detail-fallets orsakskedja mot TASK-52 är ej verifierad'
status: To Do
assignee: []
created_date: '2026-07-29 17:36'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`TASK-52` säger att persondetaljen faller för varje person med motivering, och att orsaken är att `get-person` returnerar en array där schemat kräver en sträng.

Restlistan bär posten `person-detail kontra TASK-52 — orsakskedjan ej verifierad`. Alltså: **vi har en trolig orsak, inte en belagd.**

Det finns dessutom ett angränsande fynd som gör verifieringen värd att göra ordentligt: `TASK-64`:s diagnos visade sig delvis falsifierad — `person-detail:140` föll sex rader FÖRE `T26`:s data-grind, så grinden vaktar rätt sak av fel skäl. Samma yta har alltså redan burit en felaktig orsaksförklaring en gång.

**Denna skiva verifierar orsakskedjan. Den fixar ingenting** — fixen hör till `TASK-52` och ska bygga på ett belagt fel, inte ett antaget.

Källa: restlistans § Spår E.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Orsakskedjan reproducerad: exakt vilket anrop som returnerar vad, och exakt var schemat avvisar det — med rad-referens, inte prosa
- [ ] #2 Verifierat mot KODEN och ett faktiskt svar, inte mot kortets påstående
- [ ] #3 Utfallet skrivet in i TASK-52 så fixen bygger på belägg — även om utfallet är att kortets diagnos INTE stämmer
- [ ] #4 Om diagnosen faller: det redovisas som resultat, inte tystas — jfr TASK-64:s delvis falsifierade diagnos på samma yta
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
