---
id: TASK-18.19
title: >-
  Skiva: Eventväljaren på eventdetaljsidan — byt event utan att gå via listan
  (review-iteration 5)
status: To Do
assignee: []
created_date: '2026-07-23 10:00'
labels: []
dependencies:
  - TASK-18.18
parent_task_id: TASK-18
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg (2026-07-23), idé-utvidgning av 18.18: samma eventväljare på EVENTDETALJSIDAN — byt event högst upp så detaljerna laddas direkt, utan bakåt-navigering till listan (pogo-sticking-elimineringen; NN/g-antimönstret; precedent: Stripes objekt-switcher · Linears issue-hopp · Airtables record-navigering). Komponenten föds i 18.18 och får här sin ANDRA konsument = äkta bibliotekskomponent (dubbel-output-visionen). ÖPPNA DESIGNBESLUT: (A/B) rubrik-hierarkin — väljaren ÄR rubriken (namnet som trigger, Stripe-formen) ELLER kompakt kontroll ovanför H1:an; rollfördelningen mot listan/kalendern hålls: väljaren är snabbspåret, listan är hemmet (väljaren får ALDRIG växa filter/grupperingar). Route-semantiken ärvs från 18.18 beslut a (URL-navigering). Grillnings-kandidat — ready-for-agent flippas på Marcus designbeslut eller grillnings-utfall.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus rubrik-beslut (A: namnet som trigger / B: kontroll ovanför H1) bokfört; grillnings-utfall vid grillning
- [ ] #2 Väljaren på eventsidan: förvald = aktuellt event, byte navigerar routen och laddar detaljerna; delad komponent med 18.18 utan ändringar (biblioteks-beviset)
- [ ] #3 E2e täcker byte + djuplänk + fokus-/rubrik-semantik; axe 0 på ytan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
