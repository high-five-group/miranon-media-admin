---
id: TASK-97
title: >-
  Fynd: ADR-081:s precedent-anspråk håller bara för halva formen — motiveringen
  bör läggas om
status: Done
assignee: []
created_date: '2026-07-30 19:48'
updated_date: '2026-07-31 07:59'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 177000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research-passet `docs/research/nummerallokering-parallella-aktorer-2026-07-29.md` fann att ADR-081 § Ärlighet om underlaget påstår att towncriers `+`-form är *"vår form exakt"*. Det håller bara för HALVA formen: towncrier undviker numret, men har inget tilldelningssteg — och tilldelningen är hela ADR-081 beslut 1.

Passets rekommendation 5: motiveringen bör läggas om så grunden blir merge-grindens serialisering plus EIP/Python-precedenten, inte towncrier.

Upptäckt igen 2026-07-30 av `TASK-86`:s agent, som deklarerade den öppet i sin nya sektion i stället för att tiga om den — men som inte fick röra § Ärlighet om underlaget (dess AC #3 förbjöd det). Ingen kort bar korrigeringen.

Detta är ett precedent-anspråk i en Accepted ADR, alltså exakt den klass web-research-disciplinen säger inte får fejkas: *"räkningen fejkas aldrig"*.

NUMRERINGSHISTORIK: kortet mintades först som TASK-95 2026-07-30 och kolliderade med TASK-88-agentens kort med samma nummer — orsaken var att detta kort låg OSPÅRAT i huvudträdet medan agenten räknade från main. Parkerat och omnumrerat via CLI:t i stället för att handredigeras. Oberoende belägg för TASK-93.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Precedent-anspråket i § Ärlighet om underlaget rättat så det säger vad towncrier faktiskt bär — och vad det inte bär
- [x] #2 Den omlagda motiveringen bär sina egna källor: merge-grindens serialisering och EIP/Python-precedenten verifierade mot primärkälla, inte återanvända på minnet
- [x] #3 Beslut 1 självt är oförändrat — detta rättar MOTIVERINGEN, inte beslutet; håller beslutet inte utan towncrier-anspråket ska det sägas rakt ut i stället för att döljas
- [x] #4 ADR-081:s Updates-sektion bär rättelsen öppet — en rättad ADR som inte visar att den rättats är en tyst rivning
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ADR-081:s precedent-anspråk rättat, grunden omlagd. towncrier bär HALVA formen — skriv utan nummer — men har inget tilldelningssteg, och tilldelningen är hela beslut 1. Grunden står nu på merge-grindens serialisering plus EIP-1 och Rust RFC 0002; sju källor hämtade i förstahandskälla 2026-07-31, inte återanvända ur passets sammanfattning. ANDRA FELET, funnet under arbetet: "tre solida precedenter" stod efter TVÅ uppräknade poster — sedan första commiten (40e79e1), genom tre månader, två amenderingar och ett research-pass som läste sektionen och upprepade talet utan att räkna om. Räkningen står nu per halva med posterna utskrivna. Beslut 1 byte-orört (första ändrade rad 151; besluts-sektionen 36-87). Sidofynd: max_entries_to_merge=3, så "en PR i taget" är en förenkling — grinden gör LANDNINGEN seriell, inte tilldelningen. Landad #497 (558a3ba), merge_group grön.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
