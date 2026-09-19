---
id: TASK-467
title: >-
  Beroendekanalens dödmansgrepp — nattvakten märker om beroendegranskningens
  larmkedja tystnat
status: Done
assignee: []
created_date: '2026-09-18 23:23'
updated_date: '2026-09-19 14:37'
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
- [x] #1 Tvåsidigt via workflowens simulate-ingång: en tystnad beroendekanal (granskningen körde rött men inget ärende skapades) ger ett tilldelat larm; en frisk kanal ger inget
- [x] #2 Partitionsvakten (TASK-450.10) känner kanalen och fäller om dess dödmansgrepp tas bort
- [x] #3 CONTRIBUTING § Nattnätet säger inte längre 'känd lucka' — och påstår inte mer än mekanismen gör (ADR-083)
- [x] #4 PR-kroppens 'Kostnad i två mått' med mätta körningar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som PR #2590 → 6eef96de (2026-09-19 13:16Z), efterkontroll grön (35445267477). Två rundor (risk medel): dödmansgreppet byggt som STEG i nightly-watchdog.yml:s befintliga watch-jobb (0 nya fakturerade minuter per natt), config-drivet via .nattvakt-kanal-policy.conf, partitionsvakten fick ett tredje led, tvåsidigt bevisat lokalt (20/20) och skarpt via simulate-ingången. Runda 1-fynd: bevis-körningen lämnade det stängda ärendet #2589 med etiketten ci-natt, som nattvaktens dedup kunde ha läst som täckning för ett äkta larm natten 2026-09-20 — orkestreraren tog bort etiketten 12:35Z; regeln (stäng + ta bort etiketten) står i CONTRIBUTING § Nattnätet som ÅTAGANDE; strukturell fix kortad som TASK-484. Runda 2-fynd (kvarlämnad 'OBEROENDE'-kommentar i nightly-watchdog.yml ~rad 262) avskrivet vid landning på Marcus mandat, buret som AC på TASK-484. verify:ci-parity:fast exit 0.
<!-- SECTION:FINAL_SUMMARY:END -->
