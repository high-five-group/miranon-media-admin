---
id: TASK-70.3
title: 'Skiva: Staging (API + E2E) ur PR-grinden till post-merge'
status: To Do
assignee: []
created_date: '2026-07-28 16:33'
updated_date: '2026-07-28 16:34'
labels:
  - ready-for-agent
dependencies:
  - TASK-70.2
  - TASK-70.5
parent_task_id: TASK-70
ordinal: 146000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den enskilt största posten i spåret. Staging (API + E2E) bär 375 s mätt (run 30369011230) plus den globala mutexen staging-tests, och ligger i dag i den blockerande PR-grinden.

KRÄVER A7:4 OCH A7:7. Post-merge-lagret måste finnas att flytta kontrollen TILL, och revert-vägen måste vara skriven och övad innan en kontroll lämnar den blockerande grinden. Utan bådadera tas kontrollen bort i stället för väntan.

### VAD SOM FAKTISKT VINNS — OCH VAD SOM INTE GÖR DET

Var ärlig med talet. Kritisk väg i dag: 445 s, buren av purge 9 s följt av Staging 375 s. Tas de två jobben ur PR-vägen blir NY kritisk väg Acceptance (hermetisk), som är mätt till 404 s, 407 s och 452 s i tre körningar efter att alla 18 filer var ute (ci-suite.yml rad 137-139). Väggklockan för EN ensam kod-PR sjunker alltså knappt — den kan i värsta observation stå still eller stiga.

Den verkliga vinsten är MUTEXEN. staging-tests är en global FIFO över alla staging-rörande körningar (PR mot PR, PR mot main-push, PR mot natt). Ur PR-vägen försvinner därmed kö-tiden vid parallella PR:er, och det är den kostnad som faktiskt drabbar ett flöde med flera samtidiga agenter.

MÅLET UNDER 4 MIN UR ÅTGÄRDSPLANEN NÅS INTE AV DENNA SKIVA. Acceptance blir ny kritisk väg och ligger över det taket. Acceptance-urval är den fortsättning som krävs, och den är kandidat och EJ beslutad — den ska inte designas förrän post-merge-lagret mätts skarpt. Att kortets tak därför är satt till 480 s och inte 240 s är ett medvetet val mot uppmätt verklighet, inte en uppmjukning.

### FÄLLAN: ci-suite.yml ÄR EN KÄLLA, DELAD MED NATTEN

nightly.yml rad 61 anropar ci-suite.yml UTAN run_staging-input, vilket ger default true och full svit. Raderas test-staging-jobbet ur ci-suite.yml försvinner staging även ur nattnätet. Det är inte den flytt som beställts.

Rätt form är att VILLKORA, inte radera: en input eller ett github.event_name-villkor som släcker jobbet för presubmit-anroparen medan natten och post-merge behåller det.

### ÄNDRAR BETEENDE

En kod-PR kan efter denna skiva landa utan att staging någonsin körts mot dess innehåll. Det är avsikten — men det gör revert-vägen till den kontroll som bär risken, och det är därför A7:7 är dep och inte en rekommendation.

VID FÖRSTA SKARPA LANDNINGEN EFTERÅT, OBSERVERA:

- att post-merge-körningen faktiskt startade på main-push och faktiskt körde staging,
- att ett rött post-merge öppnade sitt ärende,
- att tiden från merge till post-merge-svar är känd och redovisad — det är hur länge ett fel nu kan ligga oupptäckt i main,
- att natten fortfarande kör staging.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging (API + E2E) och Staging sentinel purge förekommer INTE i jobblistan för en kod-PR:s ci.yml-körning — verifierat med gh run view --json jobs, run-ID redovisat
- [ ] #2 Båda jobben körs FORTFARANDE i nightly.yml och i post-merge-lagret — ett grönt run-ID per yta redovisat
- [ ] #3 Ingen PR-körning tar concurrency-gruppen staging-tests — bevisat genom två kod-PR:er körda samtidigt utan att någon köar
- [ ] #4 Kod-PR:ens kritiska väg mätt i CI och redovisad som tal, tak 480 s. Talet jämförs mot baslinjen 445 s och avvikelsen förklaras — en oförändrad väggklocka är GODKÄNT utfall så länge mutexen är borta ur PR-vägen
- [ ] #5 Mutex-vinsten mätt separat: väggklockan för två samtidiga kod-PR:er före och efter, båda talen redovisade
- [ ] #6 CI Passed or Skipped är fortfarande enda required check i ruleset 19627609, och gate-proof.yml är körd grön efter ci.yml-ändringen — ci.yml rad 690 kräver det efter varje ändring
- [ ] #7 Tiden från merge till post-merge-svar är skriven i CONTRIBUTING.md — det är exponeringsfönstret för ett fel som slipper igenom grinden
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Varje kriterium är en mätning mot CI eller ett gh api-svar: jobblistor ur gh run view, mutex-beteende ur två samtidiga körningar, tal mot ett tak. Inget kräver omdöme om vad som ser rätt ut.

Skivan tar visserligen bort en blockerande kontroll, vilket är den tyngsta rörelsen i hela spåret — men förutsättningen är mekaniserad i deps snarare än överlämnad till omdöme: A7:4 ger skyddsnätet och A7:7 ger vägen tillbaka, och båda är kodade som äkta beroenden. Frågan som SKULLE kräva mänskligt omdöme, nämligen OM kontrollen får flyttas, är redan avgjord genom Marcus godkännande av åtgärdsplanen. Kvar är utförandet, och det är mekaniskt.

Den enda fällan är delningen av ci-suite.yml med natten, och den är utskriven med radhänvisning i beskrivningen.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
