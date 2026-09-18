---
id: TASK-450.1
title: 'Skiva: N2 — nattlarmet delas i kanaler (produkt, bokföring, beroendesäkerhet)'
status: To Do
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 11:09'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: high
ordinal: 775000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nattkontrollens åtta poster delar i dag ETT larmjobb och EN etikett. Efter skivan utlöser de produktskyddande jobben ci-natt (oförändrad form, tilldelning och stängningsregel), de fyra bokföringsgrindarna ETT stående ärende på egen etikett i ADR-082-mönstrets form (samma som länkkontrollens: nya fynd som kommentarer, icke-blockerande, samma stängningsregel), och — eftersom Marcus valt K1 väg (b) 2026-09-18 — den nattliga beroendegranskningen en tredje, egen kanal. Båda/alla ärendena redovisar fortsatt samtliga jobbs resultat; det som ändras är vilka jobb som utlöser vilken kanal. Nya etiketter undantas i sanningsavstämningens policy på samma grund som ci-natt (annars byggs den självförstärkande loopen in igen). Spec: planens § N2 + § K2. Pröva planens premisser mot disk före bygge (ADR-086); radnumren är 2026-09-17:s.

Täcker användarberättelser: 1, 2, 3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tvåsidigt via workflowens simulate_failure-ingång: en röd BOKFÖRINGSGRIND ger ärende/kommentar på den nya etiketten och ci-natt förblir tyst
- [ ] #2 Tvåsidigt: ett rött PRODUKTJOBB ger tilldelat ci-natt-ärende och bokföringskanalen förblir tyst
- [x] #3 Den nattliga beroendegranskningen har egen kanal, skild från både ci-natt och bokföringskanalen
- [x] #4 Samtliga åtta kontroller kör oförändrat; ingen merge-grind är försvagad; nightly-watchdog är konsistent med kanalindelningen
- [x] #5 Nya etiketter finns i .label-policy.json och i repot på GitHub, och är undantagna i .sanningsavstamning-policy.conf med skrivet skäl
- [x] #6 CONTRIBUTING § Nattnätet beskriver stängningsregeln för alla kanaler; ADR-082 bär en Updates-amendering om mönstrets nya tillämpningar
- [ ] #7 Testärendena från den tvåsidiga körningen är städade med den motivering workflowens ingångsbeskrivning kräver
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
