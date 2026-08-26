---
id: TASK-309.29
title: >-
  Pensionera s102-dokument-konvergens via arkivflytt — ARKIVERAD.md med gapet
  bokfört, pekar-svep
status: To Do
assignee: []
created_date: '2026-08-26 04:57'
updated_date: '2026-08-26 05:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 595000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beslut (orkestreraren på Marcus mandat i klartext 2026-08-26, S108 resume 11): TASK-309.21 AC #1 = PENSIONERA, inte omstämpla. Underlag: docs/research/facit-pensionering-s102-2026-08-26.md (PR #1991) — --ersatt är omstämpling av SAMMA manifest (byter bara godkand), aldrig en pensioneringsmekanism; s102:s kärnbeskrivna funktion (dialog-Visa) är riven ur koden (DokumentYta.tsx docblock rad ~75–87, TASK-273.4); kanonisk form = ARKIVFLYTT (tasks/lessons.d/superseded-facit-arkivflyttas-aldrig-raderas.md, prejudikat s55-hem-konvergens → tasks/sessions/archive/bilagor/, TASK-243.1 PR #1426). Under ADR-baren: formen är redan mekaniserad via FACIT_BILAGE_ROT (arkivet ligger utanför grindens svep).

GÖR (research-filens § 1, steg 1–4): (1) git mv tasks/sessions/bilagor/s102-dokument-konvergens tasks/sessions/archive/bilagor/s102-dokument-konvergens — hooken deny-facit-godkand-skrivning.sh matchar inte en filsystemsflytt (verifierat i research § 1), men rör ALDRIG godkand-fältet. (2) Skriv ARKIVERAD.md i samma form som s55:s: superseded av s108-generering + s108-dokumentytan, Marcus vägval (mandat 2026-08-26), OCH GAPET explicit: ingen av de tre manifesten visar ett valt events fullt filtrerbara dokumentlista med dagens ikonpar-Visa-beteende (research § 5) — uppföljning i TASK-309.32. (3) Pekar-svep i LEVANDE filer (inte historiska sessionsdok/kort): .facit-policy.conf ~151, src/components/dokument/DokumentYta.tsx rad 6/86/134/419, tests/e2e/mer-index.staging.test.ts:47, tests/visual/dokument-visual.spec.ts:10, docs/decisions/ADR-102 rad ~328 — uppdatera sökvägar/kommentarer till arkivet; grep-verifiera att inga programmatiska referenser finns. (4) De tre AMENDERING-filerna i katalogen flyttar MED och förblir orörda (frusna, som s55:s). Efteråt: bash scripts/check-facit.sh exit 0 och dokumentationsgrindarna exit 0 (fånga exitkoderna). TASK-309.21 AC #1 och #2 (s102-delen) bockas i denna skiva med hänvisning; s106/s111:s omstämplingar är Marcus (--ersatt), kvar öppna.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Katalogen ligger under tasks/sessions/archive/bilagor/s102-dokument-konvergens med ORÖRT manifest (godkand-blocket byte-identiskt före/efter — diff-bevis), alla bilder och de tre AMENDERING-filerna
- [ ] #2 ARKIVERAD.md finns i s55-formen och bokför både efterträdarna och GAPET (valt events fulla lista + ikonpar-Visa) med pekare till TASK-309.30
- [ ] #3 Pekar-svepet: inga levande filer refererar den gamla sökvägen (grep-bevis i PR:en); historiska sessionsdok/kort orörda
- [ ] #4 scripts/check-facit.sh exit 0 och dokumentationsgrindarna exit 0 efter flytten; TASK-309.21 AC #1 + #2 (s102) bockade med hänvisning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
