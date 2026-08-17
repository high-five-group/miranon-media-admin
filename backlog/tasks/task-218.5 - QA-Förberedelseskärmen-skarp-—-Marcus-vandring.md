---
id: TASK-218.5
title: 'QA: Förberedelseskärmen skarp — Marcus vandring'
status: To Do
assignee: []
created_date: '2026-08-15 08:48'
updated_date: '2026-08-17 10:07'
labels:
  - ready-for-human
dependencies:
  - TASK-218.1
  - TASK-218.2
  - TASK-218.3
  - TASK-218.4
parent_task_id: TASK-218
ordinal: 419000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, mot staging eller prod efter utrullning): (1) KALL START — logga ut, rensa site-data i webbläsaren, logga in: Förberedelseskärmen ska visas med logotyp + bar + exakt texten 'Förbereder ditt administrationsverktyg'; när den släpper ska Hem vara färdigt UTAN skeletons. (2) FLIKBYTEN direkt efter släpp — Event, Personer, Anmälningar, Väntelista, Maillogg, Intresserade, Segment ska öppna omedelbart utan laddindikatorer. (3) VARM START — stäng fliken, öppna appen igen direkt: INGEN skärm, Hem omedelbart. (4) OFFLINE — flygplansläge, öppna appen: direkt in på sparad data, ingen skärm, offline-indikatorn syns. (5) SEG DAG (om observerbar) — skärmen får aldrig hålla längre än ~10 s; efter släpp laddar resterande ytor ikapp med sina vanliga lägen. Bocka AC och rapportera avvikelser som nya fynd-kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fem stegen i testplanen genomförda och godkända av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-OBSERVATION FÖRE VANDRINGEN (2026-08-17, staging-preview 4173, verifierat staging-bygge): vid inloggning var laddningsskärmens logo + loadingbar INTE centrerade (förväntan: mitten, per TASK-242:s layoutankare). Koden säger centrerad (Forberedelseskarm.tsx:183–184) — hypoteser: höjdkedje-kollaps i login-monteringen ELLER annan fallback-komponent renderas (233 bytte rot-fallback till Sidbytesindikatorn). Observationen matad till TASK-261-diagnosagenten (samma login-övergångsfönster som blinket) — korsläs 261:s utfall innan denna vandring; om 261 inte täcker centreringen är den en egen punkt i denna QA.
<!-- SECTION:NOTES:END -->
