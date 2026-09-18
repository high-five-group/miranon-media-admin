---
id: TASK-450.1
title: 'Skiva: N2 — nattlarmet delas i kanaler (produkt, bokföring, beroendesäkerhet)'
status: Done
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 22:36'
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
- [x] #1 Tvåsidigt via workflowens simulate_failure-ingång: en röd BOKFÖRINGSGRIND ger ärende/kommentar på den nya etiketten och ci-natt förblir tyst
- [x] #2 Tvåsidigt: ett rött PRODUKTJOBB ger tilldelat ci-natt-ärende och bokföringskanalen förblir tyst
- [x] #3 Den nattliga beroendegranskningen har egen kanal, skild från både ci-natt och bokföringskanalen
- [x] #4 Samtliga åtta kontroller kör oförändrat; ingen merge-grind är försvagad; nightly-watchdog är konsistent med kanalindelningen
- [x] #5 Nya etiketter finns i .label-policy.json och i repot på GitHub, och är undantagna i .sanningsavstamning-policy.conf med skrivet skäl
- [x] #6 CONTRIBUTING § Nattnätet beskriver stängningsregeln för alla kanaler; ADR-082 bär en Updates-amendering om mönstrets nya tillämpningar
- [x] #7 Testärendena från den tvåsidiga körningen är städade med den motivering workflowens ingångsbeskrivning kräver
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
N2 landad via #2521 (a046d29c, 2026-09-18T12:09:24Z) efter tre granskningsrundor: nattlarmet delat i tre kanaler (produkt ci-natt, bokföring, beroenden), samtliga åtta kontroller kör oförändrat, nightly-watchdog konsistent med indelningen. Efterkontrollen: landningens EGEN körning 35343753042 blev RÖD på staging-API-testet send-registration-confirmation.staging.test.ts:192 (Request context disposed) — ett fel utanför N2:s diff (N2 rör nattens workflow, inte staging-sviten), som återkom på ab6b2127 i en annan landning (larmärenden #2544 + #2549, diagnos pågår i S126 resume 2). Trädet bärs i stället av den gröna kodtoppen e6308887 (körning 35344474711) och cdd1856b (35344638454). Den första skarpa natten med tre kanaler (2026-09-19) läses i QA-kortet 450.9 punkt 1. DoD #2/#3: PR:en passerade merge-köns fulla svit och tre rundor review utan fynd om orelaterade filer.
<!-- SECTION:FINAL_SUMMARY:END -->
