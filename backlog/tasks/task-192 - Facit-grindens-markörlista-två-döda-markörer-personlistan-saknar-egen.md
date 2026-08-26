---
id: TASK-192
title: 'Facit-grindens markörlista: två döda markörer + personlistan saknar egen'
status: Done
assignee: []
created_date: '2026-08-10 17:54'
updated_date: '2026-08-24 15:47'
labels:
  - grind
  - facit
  - intentionally-unchecked
dependencies: []
ordinal: 358000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Facit-grindens markörlista pekar på fel yta, och två av fem markörer är döda. Upptäckt i S103 när personlistans facit-manifest skulle skapas inför Marcus stämpling (ADR-104).

MÄTNINGEN (strängarna lästa UR .facit-policy.conf, ej avskrivna för hand):
5 isHallplatsVariant / 4 protoAktiv / 0 'ÅTGÄRDS-SIDAN — konvergens-prototyp' / 1 'Åtgärds-sidan UTAN event — tomt läge' / 0 'Åtgärds-sidan MED event — konvergens-prototyp'.

De två nollorna refererar kod som revs KORREKT efter åtgärdssidans godkännande 2026-08-09. Listan städades aldrig.

VARFÖR DET INTE SYNS I DAG: check-facit.sh aktiverar B3-spärren bara om minst ett manifest är ogodkänt (rad 136). Båda befintliga manifest är godkända, så spärren hoppas över helt. Latent, inte harmlöst: nästa ogodkända manifest fäller grinden på de döda markörerna.

DEN DJUPARE LUCKAN: markörlistan är YTSPECIFIK men invarianten är GLOBAL. Ingen markör hör till personlistan. Ett ogodkänt personer-manifest hade aktiverat en spärr som vaktar åtgärdssidans kod, inte personlistans prototyp — skyddsräcket hade inte hindrat den förtidiga rivning det finns för att hindra.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De två döda markörerna är borta ur .facit-policy.conf
- [ ] #2 Personlistans egen prototyp-markör finns i listan och grep-verifieras finnas i src/
- [ ] #3 tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json finns med godkand: null och ytor[] deklarerade
- [ ] #4 bash scripts/check-facit.sh ger EXIT=0 med minst ett ogodkänt manifest, dvs med B3-spärren AKTIV
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
STÄNGNING 2026-08-24 (S112 mandatpasset). Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Sakproblemet löst 2026-08-10 (samma dag kortet skrevs) — .facit-policy.conf:s egen historik dokumenterar att de två döda markörerna ('ÅTGÄRDS-SIDAN — konvergens-prototyp', 'Åtgärds-sidan MED event — konvergens-prototyp') togs bort samma dag. AC#1 bockad — verifierat på disk 2026-08-24: ingen av de två gav träff i .facit-policy.conf. AC#2/#3/#4 lämnas OBOCKADE — AC-bokstaven matchar inte dagens disk, av skäl som ligger UTANFÖR kortets egen leverans (senare, orelaterad approval-progression):

- AC#2 ('Personlistans egen prototyp-markör finns i listan') — FALSKT idag: 'Personlistan - promoverad' lades till och togs bort SAMMA DAG (2026-08-10) enligt .facit-policy.conf:s egen kommentar, eftersom personlistans rivning (PROTO_VARIANTS) redan hade skett. Markören är borta med rätta, inte en regression.
- AC#3 ('facit.json finns med godkand: null') — FALSKT idag: tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json existerar men bär ett SATT godkand-fält (Marcus, 2026-08-22, sha d4997b5a, citat 'Ser ju skitbra ut! Bra jobb Claude!') — personlistan godkändes 12 dagar efter kortet skrevs.
- AC#4 ('EXIT=0 med minst ett ogodkänt manifest, B3-spärren AKTIV') — idag ger check-facit.sh EXIT=0 med '0 ogodkända' (kört 2026-08-24) — INGET manifest har för närvarande godkand: null, så B3-spärren är strukturellt overifierbar just nu (inte trasig, bara utan aktivt objekt att skydda).

Dagens mätvärden (S112 städvåg A-rapporten, verifierat självständigt 2026-08-24): samtliga FYRA aktiva markörer i FACIT_PROTO_MARKORER ger minst 1 träff i src/ — isHallplatsVariant (4), protoAktiv (6), 'Åtgärds-sidan UTAN event — tomt läge' (1), 'V1 Lugna morgonen (ro)' (1). Grinden är alltså frisk och skyddande idag; AC-bokstaven är bara inaktuell mot en fråga som redan avgjorts (personlistan godkänd).

OBOCKAT MED AVSIKT: sakproblemet löst 2026-08-10; AC #2-#4:s bokstav matchar inte dagens disk (godkand-fält satt 2026-08-22) — avvikelsenot med mätvärden i notes ovan.
<!-- SECTION:NOTES:END -->
