---
id: TASK-99
title: >-
  Fynd: CLAUDE.md påstår att en köad gren inte kan tas ur kön —
  dequeuePullRequest finns i GraphQL-API:et
status: To Do
assignee: []
created_date: '2026-07-31 06:43'
updated_date: '2026-08-01 22:00'
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
- [x] #1 Mutationen PRÖVAD, inte bara belagd i schemat: dequeuePullRequest körd skarpt mot en köad test-PR, och utfallet redovisat — inklusive om den kräver rättigheter vi inte har
- [x] #2 CLAUDE.md-raden rättad så den skiljer CLI:ts yta från plattformens; den operativa regeln behålls, rivs eller omformuleras utifrån vad mätningen visar — inte utifrån den gamla premissen
- [x] #3 Samma prövning för enqueuePullRequest(jump:) — den delar mönstret och passet lämnade den outförd, bara schemabelagd
- [x] #4 Sökt efter FLER plattformsslutsatser dragna ur gh-begränsningar i styrande filer — utfallet redovisat även om det är noll
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prövat skarpt mot en kastbar test-PR (#561, gren test/task-99-mergequeue-probe, stängd utan merge, gren raderad). Full metod + rådata: docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md.

AC1 — dequeuePullRequest: fungerar. id-argumentet är PR:ens GraphQL-nod-ID (ej kö-post-ID), bekräftat av schemats fältbeskrivning + skarpt anrop. Armerad 21:57:38 UTC, dequeue lyckades 21:57:43 UTC, kön bekräftat tom 21:57:49 UTC (2026-08-01). Krävde inga extra rättigheter utöver repo-admin-token (repo-scope) — obelagt om enbart repo-scope utan org-admin räcker.

AC2 — CLAUDE.md § Landning omskriven (rad ~185-207): GH006 + gh-har-ingen-dequeue-påståendet kvarstår orört (separat belagd empiri). Den överdrivna slutsatsen "möjligheten att ändra försvinner" ersatt med mätt fakta om dequeuePullRequest. Operativ regel (köa inte förrän diffen är slutgiltig) BEHÅLLS men med korrekt skäl: inte att vägen saknas, utan att den enda vägen går via en handskriven GraphQL-mutation utanför gh.

AC3 — enqueuePullRequest(jump:true): fungerar, testat i samma pass. Kräver att PR:ens egna required checks redan är gröna (mätt: försök före grön status gav "Required status check ... is expected" — den råa mutationen kringgår INTE den grinden). Testad med tom kö (ingen annan PR i kön vid testtillfället, verifierat via GraphQL-query av mergeQueue.entries innan test) för att undvika GitHubs dokumenterade "full rebuild of all in-progress pull requests" på andras pågående poster. CONTRIBUTING.md:s befintliga jump-stycke var redan korrekt skrivet (beskriver jump som existerande-men-avstådd, inte omöjlig) — rört ej, eftersom underlaget inte motsäger det.

AC4 — sökt (grep) i CLAUDE.md, CONTRIBUTING.md, .claude/agents/*.md, docs/decisions/*.md efter fler CLI-begränsning->plattformsslutsats-mönster. Noll ytterligare träffar. CONTRIBUTING.md:s --admin-stycke ser liknande ut ytligt men är INTE samma fel: den är verifierad mot faktisk config (current_user_can_bypass: never), inte gissad ur gh:s hjälptext — rört ej.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
