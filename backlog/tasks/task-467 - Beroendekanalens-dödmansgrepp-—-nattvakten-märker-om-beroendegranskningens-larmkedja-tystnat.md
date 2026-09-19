---
id: TASK-467
title: >-
  Beroendekanalens dödmansgrepp — nattvakten märker om beroendegranskningens
  larmkedja tystnat
status: To Do
assignee: []
created_date: '2026-09-18 23:23'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.5
  - TASK-450.10
priority: high
ordinal: 808000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
K1 (b) (TASK-450.5, PR #2553) flyttar beroendegranskningen från varje ändring till diff-villkorad körning, med nattens strängare granskning (nightly.yml audit-ci --moderate + beroende-arende, kanal beroendevarning) som skyddsnät för en ny extern varning mot ett oförändrat träd. Därmed blir kanalen LASTBÄRANDE — men den saknar egen dödmansvakt: CONTRIBUTING § Nattnätet kallar det 'känd lucka, inte en glömska' (bekräftat av granskaren av #2553, runda 1, fynd 3). Om ärendeskapandet i beroendekanalen fallerar tyst finns inget som märker det. 3A-agenten (TASK-450.10, PR #2557) sköt medvetet denna del framför sig med skälet att en vakt byggd FÖRE K1 (b) hade vaktat en kanal som ännu inte bar något; orkestreraren gjorde den till eget kort i stället för ett AC #7 på det redan byggda 450.5-kortet (två PR:er redigerade samma kortfil — bekräftad merge-konflikt, granskningen av #2557 fynd 1). Form: bygg ut nightly-watchdog/.nattvakt-kanal-policy.conf (config-driven) och låt partitionsvakten check-nattkanal-partition.mjs känna kanalen. Marcus ledstjärna: värdera i BÅDA måtten väntetid och fakturerade Actions-minuter; inget nytt jobb där ett steg räcker.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tvåsidigt via workflowens simulate-ingång: en tystnad beroendekanal (granskningen körde rött men inget ärende skapades) ger ett tilldelat larm; en frisk kanal ger inget
- [ ] #2 Partitionsvakten (TASK-450.10) känner kanalen och fäller om dess dödmansgrepp tas bort
- [ ] #3 CONTRIBUTING § Nattnätet säger inte längre 'känd lucka' — och påstår inte mer än mekanismen gör (ADR-083)
- [ ] #4 PR-kroppens 'Kostnad i två mått' med mätta körningar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
