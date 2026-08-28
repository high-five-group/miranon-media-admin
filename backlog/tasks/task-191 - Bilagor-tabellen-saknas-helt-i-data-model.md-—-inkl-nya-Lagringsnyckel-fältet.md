---
id: TASK-191
title: Bilagor-tabellen saknas helt i data-model.md — inkl nya Lagringsnyckel-fältet
status: To Do
assignee: []
created_date: '2026-08-10 17:36'
updated_date: '2026-08-28 05:08'
labels: []
dependencies: []
ordinal: 357000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (147.5-bygget + FRAMME-passet, S102 2026-08-10): docs/reference/data-model.md dokumenterar inte Bilagor-tabellen (tblFamrna53MVf1nG) alls — pre-existing lucka som nu vuxit: 147.5 skapade fältet Lagringsnyckel (singleLineText, fldRw08hcRyKit3qF, ENDAST i staging-basen apphjj8Q7lkXCMsL4 — prod-basen saknar det, del av ref-incidentens städkarta S102 Del 4). FÖRVÄNTAT per CLAUDE.md 'Airtable-schema före write': tabellen med fält-skrivbarhet + write-fält-IDs dokumenterad; prod/staging-schemadivergensen EXPLICIT bokförd tills prod-basen får fältet (bas-maximeringens spår, ADR-063).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/reference/data-model.md får en fullständig sektion för Bilagor-tabellen (tblFamrna53MVf1nG) med samtliga fält, fält-skrivbarhet och write-fält-IDs, inklusive Lagringsnyckel (fldRw08hcRyKit3qF)
- [ ] #2 Prod/staging-schemadivergensen för Lagringsnyckel (finns endast i staging apphjj8Q7lkXCMsL4, saknas i prod app8uGPrVCVOm6LfD) är explicit bokförd i dokumentet
- [ ] #3 Kvitton-tabellen får en egen sektion i data-model.md (breddningsfyndet — tidigare 0 träffar på 'Kvitton')
- [ ] #4 Anteckningar får en egen sektion i data-model.md (breddningsfyndet)
- [ ] #5 npm run check:docs grönt efter ändringen
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
BREDDNING (bas-diffen 2026-08-11, docs/research/prodbas-synk-staging-till-prod-2026-08-11.md): luckan är TRE tabeller, inte en — Kvitton saknas lika helt i data-model.md (0 träffar) och Anteckningar har ingen egen sektion. Dessutom är § Prod-basens additiva tillskott per-våg, inte ett register (t.ex. Utskickslogg.Idempotensnyckel bokförd som framtida trots att den finns i prod).
<!-- SECTION:NOTES:END -->
