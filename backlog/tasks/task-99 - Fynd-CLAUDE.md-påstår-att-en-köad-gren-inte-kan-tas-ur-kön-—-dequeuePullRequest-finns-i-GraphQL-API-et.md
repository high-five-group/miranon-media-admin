---
id: TASK-99
title: >-
  Fynd: CLAUDE.md påstår att en köad gren inte kan tas ur kön —
  dequeuePullRequest finns i GraphQL-API:et
status: To Do
assignee: []
created_date: '2026-07-31 06:43'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 179000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`CLAUDE.md` § Landning fick 2026-07-30 raden: *"En köad gren kan inte uppdateras. Push avvisas med `GH006` så länge PR:en står i kön, och `--disable-auto` släpper inte låset — `gh` har ingen dequeue."*

Delen om `gh` är korrekt och skarpt prövad. **Slutsatsen är för stark.** Revert-passet (`docs/research/kohopp-bradskande-revert-2026-07-30.md`) fann att **`dequeuePullRequest` finns i GitHubs GraphQL-API** — vägen finns, den går bara inte via CLI:t.

Samma pass fann även `enqueuePullRequest(jump:)` i schemat, som `gh` 2.96.0 inte heller exponerar. Mönstret är alltså bredare än en enskild rad: **CLI:ts yta är smalare än plattformens, och vi har dragit plattformsslutsatser ur CLI-begränsningar.**

Raden skrevs av orkestreraren i samma session som den upptäckte låset skarpt — den var alltså ett äkta fynd, men generaliserat ett steg för långt. Klassen är repots egen återkommande: *ett värde eller en slutsats som ser verifierad ut*.

**Varför det spelar roll och inte är kosmetik:** raden avslutas med en operativ regel — *"köa inte förrän diffen är den du vill landa, för möjligheten att ändra försvinner i samma ögonblick"*. Den regeln kan vara rätt ändå, men den vilar just nu på en premiss som inte håller.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mutationen PRÖVAD, inte bara belagd i schemat: dequeuePullRequest körd skarpt mot en köad test-PR, och utfallet redovisat — inklusive om den kräver rättigheter vi inte har
- [ ] #2 CLAUDE.md-raden rättad så den skiljer CLI:ts yta från plattformens; den operativa regeln behålls, rivs eller omformuleras utifrån vad mätningen visar — inte utifrån den gamla premissen
- [ ] #3 Samma prövning för enqueuePullRequest(jump:) — den delar mönstret och passet lämnade den outförd, bara schemabelagd
- [ ] #4 Sökt efter FLER plattformsslutsatser dragna ur gh-begränsningar i styrande filer — utfallet redovisat även om det är noll
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
