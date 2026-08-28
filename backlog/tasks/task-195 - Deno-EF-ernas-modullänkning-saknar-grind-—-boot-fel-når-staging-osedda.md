---
id: TASK-195
title: 'Deno-EF:ernas modullänkning saknar grind — boot-fel når staging osedda'
status: To Do
assignee: []
created_date: '2026-08-10 20:16'
updated_date: '2026-08-28 05:08'
labels: []
dependencies: []
ordinal: 360000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (147.7:s boot-incident, S102 2026-08-10): send-receipt-email deployades med en import av en icke-exporterad symbol (NonProdAddressError ur send-receipt.ts) → 503 BOOT_ERROR på varje autentiserat anrop. INGEN grind såg det: biome.json exkluderar supabase/functions helt, index-filerna är @ts-nocheck (Deno-only, esm.sh-imports), api-pure-testerna importerar _shared-moduler direkt i Node och passerar aldrig EF:ernas index-importblock. Fixens bevisform (PR #1145) visade vägen: Node:s ESM-loader följer samma named-export-länkningsspec som Deno — en billig CI-grind kan länka varje EF:s index.ts (eller deno check via setup-deno-action) och fälla boot-fel före deploy. FÖRVÄNTAT: mekanisk grind (config-driven per repo-konvention) som fäller import/export-mismatch i supabase/functions/**; research: deno check i CI vs Node-ESM-länkningsform (branschmönster före design).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En ny CI-grind länkar/kompilerar varje supabase/functions/*/index.ts (deno check eller motsvarande Node-ESM-länkningskontroll) och fäller vid import/export-mismatch
- [ ] #2 Grinden är config-driven per repo-konvention (egen .conf om projekt-specifika listor krävs)
- [ ] #3 Grinden bevisat att fälla skarpt: en konstruerad import-mismatch (t.ex. reproduktion av send-receipt-email-boot-felet, NonProdAddressError-fallet) ger rött innan fix, grönt efter
- [ ] #4 Grinden wirad i .github/workflows/ och bevisat anropad (samma TASK-130-lärdom: verifiera faktisk anropskedja, inte bara existens)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
