---
id: TASK-474
title: >-
  CodeQL-larm 13: check-nattkanal-partition.mjs läser en config-sökväg via bash
  -c — åtgärda i kod eller avfärda med skrivet skäl (Marcus)
status: To Do
assignee: []
created_date: '2026-09-19 08:36'
labels:
  - ci
  - security
dependencies: []
priority: medium
ordinal: 815000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Öppet kodskanningslarm nr 13, regel js/shell-command-injection-from-environment, allvar medium, scripts/check-nattkanal-partition.mjs:208 (funktionen loadProduktPrefixes). Skapat 2026-09-18T23:10Z av landningen #2557 (3A, TASK-450.10). Hittat 2026-09-19 (S126 resume 3) när larm-baslinjen togs inför CodeQL-bytet i #2558 — det är det ENDA öppna larmet efter att #2556 stängde de nio gamla. Mätt läge: skriptet kör spawnSync('bash', ['-c', script, '--', abs]) där script är en FAST sträng och sökvägen går in som positionsargument och läses med source "$1" — sökvägen interpoleras alltså aldrig i kommandotexten. HYPOTES, ej belagd: larmet är ett falskt positivt för injektion, men 'source' av en fil vars sökväg kommer från ett CLI-argument är en verklig förtroendegräns värd att pröva. En agent avfärdar aldrig ett larm; avfärdande med skäl är Marcus beslut. Baslinjen per identitet ligger i sessionsdok S126 Del 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Larm 13 är stängt i GitHub: 'fixed' av landad kod (t.ex. policy-värdet läses utan bash, eller sökvägen valideras mot en fast lista) ELLER 'dismissed' av Marcus med skrivet skäl
- [ ] #2 Skriptets tvåsidiga testsvit är fortsatt grön efter en kodändring
- [ ] #3 Samma mönster (bash -c + source av conf-fil) är sökt i övriga scripts/*.mjs och utfallet bokfört i kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
